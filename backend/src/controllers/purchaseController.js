const { updateStockQuantity} = require('../models/stockModel');
const purchaseModel = require('../models/purchaseModel');
const pool = require('../config/db');
const redisClient = require('../services/redisService');
const { kafkaProducer } = require('../services/kafkaService');
const {
  lowStockAlertCounter,
  stockUpdatedCounter,
  dbQueryDuration,
} = require('../services/metrics');
const { sendLowStockAlert, sendPurchaseConfirmation } = require('../services/mailService');

async function purchaseStock(req, res) {
  const { storeId } = req.params; // storeId from route param
  const { id, quantity, amount_paid } = req.body; // Accept amount_paid from frontend

  if (!id || !quantity || quantity <= 0) {
    return res.status(400).json({ error: 'Invalid stock ID or quantity' });
  }

  try {
    // 1. Verify stock exists and belongs to the store
    const result = await pool.query(
      'SELECT quantity, name, price FROM stocks WHERE id = $1 AND store_id = $2',
      [id, storeId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Stock not found for this store' });
    }

    const { quantity: currentQty, name, price } = result.rows[0];

    if (quantity > currentQty) {
      return res.status(400).json({ error: 'Not enough stock available' });
    }

    const newQty = currentQty - quantity;
    // Use amount_paid if provided, else fallback to price * quantity
    const totalRevenue = typeof amount_paid === 'number' && amount_paid > 0 ? amount_paid : price * quantity;
    const pricePerUnit = typeof amount_paid === 'number' && amount_paid > 0 ? (amount_paid / quantity) : price;

    // 2. Update stock quantity
    const end = dbQueryDuration.startTimer();
    await updateStockQuantity(id, newQty, undefined, storeId); 
    end();

    // 3. Update existing metrics
    await redisClient.incr('stocks_updated_total');
    const updatedTotal = await redisClient.get('stocks_updated_total');
    stockUpdatedCounter.reset();
    stockUpdatedCounter.inc(Number(updatedTotal));

    // Get admin email for all Kafka events
    const stockResultForAdmin = await pool.query('SELECT admin_id FROM stocks WHERE id = $1', [id]);
    const adminIdForKafka = stockResultForAdmin.rows[0]?.admin_id;
    let adminEmailForKafka = null;
    if (adminIdForKafka) {
      const adminResultForKafka = await pool.query('SELECT email FROM admins WHERE id = $1', [adminIdForKafka]);
      adminEmailForKafka = adminResultForKafka.rows[0]?.email;
    }

    // 4. Emit Kafka event (stock-purchased)
    await kafkaProducer.send({
      topic: 'stock-events',
      messages: [
        {
          value: JSON.stringify({
            event: 'stock-purchased',
            id,
            name,
            purchased_quantity: quantity,
            quantity: newQty,
            revenue: totalRevenue,
            store_id: storeId,
            admin_email: adminEmailForKafka,
            timestamp: new Date().toISOString(),
          }),
        },
      ],
    });

    // Get store name for email and alerts
    const storeResult = await pool.query('SELECT name FROM stores WHERE id = $1', [storeId]);
    const storeName = storeResult.rows[0]?.name || `Store-${storeId}`;
    
    // 5. Low stock alert logic
    if (newQty < 10) {
      await redisClient.incr('low_stock_alerts_total');
      const lowStockCount = await redisClient.get('low_stock_alerts_total');
      lowStockAlertCounter.reset();
      lowStockAlertCounter.inc(Number(lowStockCount));
      
      // Get store name for alert
      const storeResult = await pool.query('SELECT name FROM stores WHERE id = $1', [storeId]);
      const storeName = storeResult.rows[0]?.name || `Store-${storeId}`;

      // Get admin email for alert
      const stockResult = await pool.query('SELECT admin_id FROM stocks WHERE id = $1', [id]);
      const adminId = stockResult.rows[0]?.admin_id;
      let adminEmail = null;
      if (adminId) {
        const adminResult = await pool.query('SELECT email FROM admins WHERE id = $1', [adminId]);
        adminEmail = adminResult.rows[0]?.email;
      }

      if (adminEmail) {
        await sendLowStockAlert(name, newQty, storeId, storeName, adminEmail);
      } else {
        console.error('Low stock alert: No admin email found for stock', id);
      }

      await kafkaProducer.send({
        topic: 'stock-alerts',
        messages: [
          {
            value: JSON.stringify({
              id,
              name,
              quantity: newQty,
              store_id: storeId,
              type: 'LOW_STOCK',
              admin_email: adminEmailForKafka,
              timestamp: new Date().toISOString(),
            }),
          },
        ],
      });
    }

    await redisClient.del(`stocks:${storeId}`);
    await redisClient.del('stocks');
    
    // Record the purchase in customer_purchases table
    try {
      const purchaseRecord = await purchaseModel.recordPurchase(
        req.customer?.id, // Customer ID from auth middleware
        id,
        storeId,
        quantity,
        pricePerUnit, // Use calculated price per unit
        totalRevenue, // Use calculated total amount
        req.body.orderId || `order_${Date.now()}`
      );
      
      // Send purchase confirmation email
      if (req.customer?.id) {
        console.log('Customer authenticated, attempting to send email for customer ID:', req.customer.id);
        try {
          // Get customer details
          const customerResult = await pool.query('SELECT name, email FROM customers WHERE id = $1', [req.customer.id]);
          const customer = customerResult.rows[0];
          
          if (customer) {
            console.log('Customer found, sending email to:', customer.email);
            await sendPurchaseConfirmation(customer.name, customer.email, {
              stockName: name,
              storeName: storeName,
              quantity: quantity,
              totalAmount: totalRevenue,
              orderId: purchaseRecord.order_id,
              purchaseDate: purchaseRecord.purchase_date
            });
            
            // Mark email as sent
            await purchaseModel.markEmailSent(purchaseRecord.id);
            console.log('Purchase confirmation email sent successfully');
          } else {
            console.log('Customer not found in database for ID:', req.customer.id);
          }
        } catch (emailError) {
          console.error('Error sending purchase confirmation email:', emailError);
          // Don't fail the purchase if email fails
        }
      } else {
        console.log('No customer authentication found, skipping email');
      }
    } catch (purchaseRecordError) {
      console.error('Error recording purchase:', purchaseRecordError);
      // Don't fail the purchase if recording fails
    }
    
    res.json({ message: 'Purchase successful', remaining: newQty });
  } catch (err) {
    console.error('❌ Purchase error:', err.message);
    res.status(500).json({ error: err.message });
  }
}

module.exports = { purchaseStock };
