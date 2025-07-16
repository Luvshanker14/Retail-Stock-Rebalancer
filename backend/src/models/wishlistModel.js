const pool = require('../config/db');

// Add item to wishlist
async function addToWishlist(customerId, stockId, storeId) {
  try {
    const result = await pool.query(
      'INSERT INTO customer_wishlist (customer_id, stock_id, store_id) VALUES ($1, $2, $3) RETURNING *',
      [customerId, stockId, storeId]
    );
    return result.rows[0];
  } catch (error) {
    if (error.code === '23505') { // Unique constraint violation
      throw new Error('Item already in wishlist');
    }
    throw error;
  }
}

// Remove item from wishlist
async function removeFromWishlist(customerId, stockId) {
  const result = await pool.query(
    'DELETE FROM customer_wishlist WHERE customer_id = $1 AND stock_id = $2 RETURNING *',
    [customerId, stockId]
  );
  return result.rows[0];
}

// Get customer's wishlist with stock and store details
async function getWishlist(customerId) {
  try {
    const result = await pool.query(`
      SELECT 
        cw.id,
        cw.added_at,
        s.id as stock_id,
        s.name as stock_name,
        s.price as stock_price,
        s.quantity as stock_quantity,
        st.id as store_id,
        st.name as store_name,
        st.location as store_location,
        st.category as store_category
      FROM customer_wishlist cw
      JOIN stocks s ON cw.stock_id = s.id
      JOIN stores st ON cw.store_id = st.id
      WHERE cw.customer_id = $1
      ORDER BY cw.added_at DESC
    `, [customerId]);
    return result.rows;
  } catch (error) {
    console.error('Error getting wishlist:', error);
    // If table doesn't exist, return empty array
    if (error.code === '42P01') { // undefined_table
      return [];
    }
    throw error;
  }
}

// Check if item is in wishlist
async function isInWishlist(customerId, stockId) {
  try {
    const result = await pool.query(
      'SELECT id FROM customer_wishlist WHERE customer_id = $1 AND stock_id = $2',
      [customerId, stockId]
    );
    return result.rows.length > 0;
  } catch (error) {
    console.error('Error checking wishlist status:', error);
    // If table doesn't exist, return false
    if (error.code === '42P01') { // undefined_table
      return false;
    }
    throw error;
  }
}

// Get wishlist count for customer
async function getWishlistCount(customerId) {
  try {
    const result = await pool.query(
      'SELECT COUNT(*) as count FROM customer_wishlist WHERE customer_id = $1',
      [customerId]
    );
    return parseInt(result.rows[0].count);
  } catch (error) {
    console.error('Error getting wishlist count:', error);
    // If table doesn't exist, return 0
    if (error.code === '42P01') { // undefined_table
      return 0;
    }
    throw error;
  }
}

module.exports = {
  addToWishlist,
  removeFromWishlist,
  getWishlist,
  isInWishlist,
  getWishlistCount
}; 