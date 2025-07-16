const pool = require('../config/db');

// Record a purchase
async function recordPurchase(customerId, stockId, storeId, quantity, pricePerUnit, totalAmount, orderId) {
  const result = await pool.query(`
    INSERT INTO customer_purchases 
    (customer_id, stock_id, store_id, quantity, price_per_unit, total_amount, order_id) 
    VALUES ($1, $2, $3, $4, $5, $6, $7) 
    RETURNING *
  `, [customerId, stockId, storeId, quantity, pricePerUnit, totalAmount, orderId]);
  return result.rows[0];
}

// Get customer's purchase history
async function getPurchaseHistory(customerId, limit = 50, offset = 0) {
  const result = await pool.query(`
    SELECT 
      cp.id,
      cp.quantity,
      cp.price_per_unit,
      cp.total_amount,
      cp.order_id,
      cp.payment_status,
      cp.purchase_date,
      cp.email_sent,
      s.id as stock_id,
      s.name as stock_name,
      st.id as store_id,
      st.name as store_name,
      st.location as store_location,
      st.category as store_category
    FROM customer_purchases cp
    JOIN stocks s ON cp.stock_id = s.id
    JOIN stores st ON cp.store_id = st.id
    WHERE cp.customer_id = $1
    ORDER BY cp.purchase_date DESC
    LIMIT $2 OFFSET $3
  `, [customerId, limit, offset]);
  return result.rows;
}

// Get customer's purchase statistics
async function getPurchaseStats(customerId) {
  const result = await pool.query(`
    SELECT 
      COUNT(*) as total_purchases,
      SUM(total_amount) as total_spent,
      AVG(total_amount) as avg_purchase_amount,
      MAX(purchase_date) as last_purchase_date,
      COUNT(DISTINCT store_id) as stores_visited,
      COUNT(DISTINCT stock_id) as unique_products_purchased
    FROM customer_purchases 
    WHERE customer_id = $1
  `, [customerId]);
  return result.rows[0];
}

// Mark email as sent for a purchase
async function markEmailSent(purchaseId) {
  const result = await pool.query(
    'UPDATE customer_purchases SET email_sent = true WHERE id = $1 RETURNING *',
    [purchaseId]
  );
  return result.rows[0];
}

// Get purchases that haven't had emails sent yet
async function getUnsentEmailPurchases() {
  const result = await pool.query(`
    SELECT 
      cp.id,
      cp.customer_id,
      cp.stock_id,
      cp.store_id,
      cp.quantity,
      cp.price_per_unit,
      cp.total_amount,
      cp.order_id,
      cp.purchase_date,
      c.name as customer_name,
      c.email as customer_email,
      s.name as stock_name,
      st.name as store_name
    FROM customer_purchases cp
    JOIN customers c ON cp.customer_id = c.id
    JOIN stocks s ON cp.stock_id = s.id
    JOIN stores st ON cp.store_id = st.id
    WHERE cp.email_sent = false
    ORDER BY cp.purchase_date DESC
  `);
  return result.rows;
}

// Get customer's favorite categories based on purchase history
async function getFavoriteCategories(customerId, limit = 5) {
  const result = await pool.query(`
    SELECT 
      st.category,
      COUNT(*) as purchase_count,
      SUM(cp.total_amount) as total_spent
    FROM customer_purchases cp
    JOIN stores st ON cp.store_id = st.id
    WHERE cp.customer_id = $1
    GROUP BY st.category
    ORDER BY purchase_count DESC, total_spent DESC
    LIMIT $2
  `, [customerId, limit]);
  return result.rows;
}

// Get customer's favorite stores based on purchase history
async function getFavoriteStores(customerId, limit = 5) {
  const result = await pool.query(`
    SELECT 
      st.id as store_id,
      st.name as store_name,
      st.location as store_location,
      st.category as store_category,
      COUNT(*) as purchase_count,
      SUM(cp.total_amount) as total_spent
    FROM customer_purchases cp
    JOIN stores st ON cp.store_id = st.id
    WHERE cp.customer_id = $1
    GROUP BY st.id, st.name, st.location, st.category
    ORDER BY purchase_count DESC, total_spent DESC
    LIMIT $2
  `, [customerId, limit]);
  return result.rows;
}

module.exports = {
  recordPurchase,
  getPurchaseHistory,
  getPurchaseStats,
  markEmailSent,
  getUnsentEmailPurchases,
  getFavoriteCategories,
  getFavoriteStores
}; 