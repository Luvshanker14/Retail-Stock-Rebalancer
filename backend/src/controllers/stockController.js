const { getAllStocks, addStock: addStockModel, getStockById, updateStockQuantity, deleteStock} = require('../models/stockModel');
const pool = require('../config/db');
const redisClient = require('../services/redisService');
const { kafkaProducer } = require('../services/kafkaService');
const { 
  stockCounter, 
  stockUpdatedCounter, 
  stockRemovedCounter, 
  dbQueryDuration,
  // Phase 1 Analytics Metrics
  stockLevelGauge,
  lowStockGauge,
  outOfStockGauge,
  productSalesGauge,
  productRevenueGauge,
  productStockTurnoverGauge,
  storePerformanceGauge,
} = require('../services/metrics');

async function addStock(req, res) {
  const { name, quantity, price } = req.body;
  const { storeId } = req.params; // Get storeId from URL params
  const adminEmail = req.admin.email;
  const adminId = req.admin.id; // Get admin ID from the authenticated user

  if (!name || !quantity || !price) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    const end = dbQueryDuration.startTimer();
    const result = await addStockModel(name, quantity, price, storeId, adminId);
    end();

    await redisClient.incr('stocks_added_total');
    const addedTotal = await redisClient.get('stocks_added_total');
    stockCounter.reset();
    stockCounter.inc({ admin_email: adminEmail, store_id: storeId }, Number(addedTotal));

    // Update Phase 1 Analytics Metrics
    await updateStockMetrics(storeId, name, result.id, quantity, price);

    await kafkaProducer.send({
      topic: 'stock-events',
      messages: [
        {
          value: JSON.stringify({
            event: 'stock-added',
            id: result.id,
            name,
            quantity,
            price,
            store_id: storeId,
            admin_email: adminEmail,
            timestamp: new Date().toISOString(),
          }),
        },
      ],
    });

    await redisClient.del(`stocks:${storeId}`);
    await redisClient.del('stocks');
    res.json({ message: 'Stock added successfully', stock: result });
  } catch (err) {
    console.error('❌ Add stock error:', err.message);
    res.status(500).json({ error: err.message });
  }
}

async function updateStock(req, res) {
  const { id } = req.params;
  const { quantity, price } = req.body;
  const adminEmail = req.admin.email;

  try {
    // Get current stock info for metrics
    const currentStock = await getStockById(id);
    if (!currentStock) {
      return res.status(404).json({ error: 'Stock not found' });
    }

    const end = dbQueryDuration.startTimer();
    const result = await updateStockQuantity(id, quantity, price, currentStock.store_id);
    end();

    await redisClient.incr('stocks_updated_total');
    const updatedTotal = await redisClient.get('stocks_updated_total');
    stockUpdatedCounter.reset();
    stockUpdatedCounter.inc({ admin_email: adminEmail, store_id: currentStock.store_id }, Number(updatedTotal));

    // Update Phase 1 Analytics Metrics
    await updateStockMetrics(currentStock.store_id, currentStock.name, id, quantity, price);

    await kafkaProducer.send({
      topic: 'stock-events',
      messages: [
        {
          value: JSON.stringify({
            event: 'stock-updated',
            id,
            name: currentStock.name,
            quantity,
            price,
            store_id: currentStock.store_id,
            admin_email: adminEmail,
            timestamp: new Date().toISOString(),
          }),
        },
      ],
    });

    await redisClient.del(`stocks:${currentStock.store_id}`);
    await redisClient.del('stocks');
    res.json({ message: 'Stock updated successfully', stock: result });
  } catch (err) {
    console.error('❌ Update stock error:', err.message);
    res.status(500).json({ error: err.message });
  }
}

async function removeStock(req, res) {
  const { id } = req.params;
  const adminEmail = req.admin.email;
  const adminId = req.admin.id; // Get admin ID from the authenticated user

  try {
    // Get current stock info for metrics
    const currentStock = await getStockById(id);
    if (!currentStock) {
      return res.status(404).json({ error: 'Stock not found' });
    }

    const end = dbQueryDuration.startTimer();
    const result = await deleteStock(id, currentStock.store_id, adminId);
    end();

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Stock not found or not owned by you' });
    }

    await redisClient.incr('stocks_removed_total');
    const removedTotal = await redisClient.get('stocks_removed_total');
    stockRemovedCounter.reset();
    stockRemovedCounter.inc({ admin_email: adminEmail, store_id: currentStock.store_id }, Number(removedTotal));

    // Update Phase 1 Analytics Metrics - remove stock level
    stockLevelGauge.remove({ store_id: currentStock.store_id, store_name: `Store-${currentStock.store_id}`, product_name: currentStock.name, product_id: id });
    await updateStockAlerts(currentStock.store_id, `Store-${currentStock.store_id}`);

    await kafkaProducer.send({
      topic: 'stock-events',
      messages: [
        {
          value: JSON.stringify({
            event: 'stock-removed',
            id,
            name: currentStock.name,
            store_id: currentStock.store_id,
            admin_email: adminEmail,
            timestamp: new Date().toISOString(),
          }),
        },
      ],
    });

    await redisClient.del(`stocks:${currentStock.store_id}`);
    await redisClient.del('stocks');
    res.json({ message: 'Stock removed successfully' });
  } catch (err) {
    console.error('❌ Remove stock error:', err.message);
    res.status(500).json({ error: err.message });
  }
}

// Helper function to update stock metrics
async function updateStockMetrics(storeId, productName, productId, quantity, price) {
  try {
    // Get store name
    const storeResult = await pool.query('SELECT name FROM stores WHERE id = $1', [storeId]);
    const storeName = storeResult.rows[0]?.name || `Store-${storeId}`;

    // Update stock level gauge
    stockLevelGauge.set({ store_id: storeId, store_name: storeName, product_name: productName, product_id: productId }, quantity);

    // Update stock alerts
    await updateStockAlerts(storeId, storeName);

    // Update product turnover if we have sales data
    const currentSales = productSalesGauge.get({ product_id: productId, product_name: productName, store_id: storeId, store_name: storeName }) || 0;
    if (quantity > 0 && currentSales > 0) {
      const turnover = currentSales / quantity;
      productStockTurnoverGauge.set({ product_id: productId, product_name: productName, store_id: storeId, store_name: storeName }, turnover);
    }

  } catch (err) {
    console.error('Error updating stock metrics:', err.message);
  }
}

// Helper function to update stock alert gauges
async function updateStockAlerts(storeId, storeName) {
  try {
    const result = await pool.query(
      'SELECT COUNT(*) as low_stock_count FROM stocks WHERE store_id = $1 AND quantity < 10 AND quantity > 0',
      [storeId]
    );
    const lowStockCount = parseInt(result.rows[0].low_stock_count);
    lowStockGauge.set({ store_id: storeId, store_name: storeName }, lowStockCount);

    const outOfStockResult = await pool.query(
      'SELECT COUNT(*) as out_of_stock_count FROM stocks WHERE store_id = $1 AND quantity = 0',
      [storeId]
    );
    const outOfStockCount = parseInt(outOfStockResult.rows[0].out_of_stock_count);
    outOfStockGauge.set({ store_id: storeId, store_name: storeName }, outOfStockCount);

  } catch (err) {
    console.error('Error updating stock alerts:', err.message);
  }
}

module.exports = { addStock, updateStock, removeStock };
