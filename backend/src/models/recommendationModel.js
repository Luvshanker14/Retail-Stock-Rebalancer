const pool = require('../config/db');

// Get personalized recommendations based on customer's purchase history
async function getPersonalizedRecommendations(customerId, limit = 10) {
  // Get customer's favorite categories and stores
  const favoriteCategories = await pool.query(`
    SELECT st.category, COUNT(*) as purchase_count
    FROM customer_purchases cp
    JOIN stores st ON cp.store_id = st.id
    WHERE cp.customer_id = $1
    GROUP BY st.category
    ORDER BY purchase_count DESC
    LIMIT 3
  `, [customerId]);

  const favoriteStores = await pool.query(`
    SELECT cp.store_id, COUNT(*) as purchase_count
    FROM customer_purchases cp
    WHERE cp.customer_id = $1
    GROUP BY cp.store_id
    ORDER BY purchase_count DESC
    LIMIT 3
  `, [customerId]);

  // Get customer's average spending range
  const spendingStats = await pool.query(`
    SELECT 
      AVG(total_amount) as avg_spending,
      MIN(total_amount) as min_spending,
      MAX(total_amount) as max_spending
    FROM customer_purchases 
    WHERE customer_id = $1
  `, [customerId]);

  const avgSpending = spendingStats.rows[0]?.avg_spending || 100;
  const minPrice = Math.max(0, Math.round(avgSpending * 0.5));
  const maxPrice = Math.round(avgSpending * 2);

  // Build recommendation query based on preferences
  let recommendationQuery = `
    SELECT DISTINCT
      s.id as stock_id,
      s.name as stock_name,
      s.price as stock_price,
      s.quantity as stock_quantity,
      st.id as store_id,
      st.name as store_name,
      st.location as store_location,
      st.category as store_category,
      CASE 
        WHEN st.category = ANY($2) THEN 3
        WHEN st.id = ANY($3) THEN 2
        ELSE 1
      END as relevance_score
    FROM stocks s
    JOIN stores st ON s.store_id = st.id
    WHERE s.quantity > 0
    AND s.price BETWEEN $4 AND $5
    AND s.id NOT IN (
      SELECT stock_id FROM customer_purchases WHERE customer_id = $1
    )
  `;

  const categoryArray = favoriteCategories.rows.map(row => row.category);
  const storeArray = favoriteStores.rows.map(row => row.store_id);

  const result = await pool.query(
    recommendationQuery + ' ORDER BY relevance_score DESC, s.price ASC LIMIT $6',
    [customerId, categoryArray, storeArray, minPrice, maxPrice, limit]
  );

  return result.rows;
}

// Get trending products (most purchased recently)
async function getTrendingProducts(limit = 10) {
  const result = await pool.query(`
    SELECT 
      s.id as stock_id,
      s.name as stock_name,
      s.price as stock_price,
      s.quantity as stock_quantity,
      st.id as store_id,
      st.name as store_name,
      st.location as store_location,
      st.category as store_category,
      COUNT(cp.id) as recent_purchases,
      SUM(cp.quantity) as total_quantity_sold
    FROM stocks s
    JOIN stores st ON s.store_id = st.id
    LEFT JOIN customer_purchases cp ON s.id = cp.stock_id 
      AND cp.purchase_date >= NOW() - INTERVAL '7 days'
    WHERE s.quantity > 0
    GROUP BY s.id, s.name, s.price, s.quantity, st.id, st.name, st.location, st.category
    ORDER BY recent_purchases DESC, total_quantity_sold DESC
    LIMIT $1
  `, [limit]);
  return result.rows;
}

// Get recommendations based on similar customers
async function getCollaborativeRecommendations(customerId, limit = 10) {
  // Find customers with similar purchase patterns
  const similarCustomers = await pool.query(`
    SELECT 
      cp2.customer_id,
      COUNT(*) as common_purchases
    FROM customer_purchases cp1
    JOIN customer_purchases cp2 ON cp1.stock_id = cp2.stock_id 
      AND cp1.customer_id != cp2.customer_id
    WHERE cp1.customer_id = $1
    GROUP BY cp2.customer_id
    ORDER BY common_purchases DESC
    LIMIT 5
  `, [customerId]);

  if (similarCustomers.rows.length === 0) {
    return [];
  }

  const similarCustomerIds = similarCustomers.rows.map(row => row.customer_id);

  // Get products purchased by similar customers but not by current customer
  const result = await pool.query(`
    SELECT DISTINCT
      s.id as stock_id,
      s.name as stock_name,
      s.price as stock_price,
      s.quantity as stock_quantity,
      st.id as store_id,
      st.name as store_name,
      st.location as store_location,
      st.category as store_category,
      COUNT(cp.customer_id) as similar_customer_purchases
    FROM customer_purchases cp
    JOIN stocks s ON cp.stock_id = s.id
    JOIN stores st ON s.store_id = st.id
    WHERE cp.customer_id = ANY($2)
    AND s.quantity > 0
    AND s.id NOT IN (
      SELECT stock_id FROM customer_purchases WHERE customer_id = $1
    )
    GROUP BY s.id, s.name, s.price, s.quantity, st.id, st.name, st.location, st.category
    ORDER BY similar_customer_purchases DESC, s.price ASC
    LIMIT $3
  `, [customerId, similarCustomerIds, limit]);

  return result.rows;
}

// Get category-based recommendations
async function getCategoryRecommendations(category, limit = 10) {
  const result = await pool.query(`
    SELECT 
      s.id as stock_id,
      s.name as stock_name,
      s.price as stock_price,
      s.quantity as stock_quantity,
      st.id as store_id,
      st.name as store_name,
      st.location as store_location,
      st.category as store_category,
      COUNT(cp.id) as purchase_count
    FROM stocks s
    JOIN stores st ON s.store_id = st.id
    LEFT JOIN customer_purchases cp ON s.id = cp.stock_id
    WHERE st.category = $1 AND s.quantity > 0
    GROUP BY s.id, s.name, s.price, s.quantity, st.id, st.name, st.location, st.category
    ORDER BY purchase_count DESC, s.price ASC
    LIMIT $2
  `, [category, limit]);
  return result.rows;
}

// Get location-based recommendations
async function getLocationRecommendations(location, limit = 10) {
  const result = await pool.query(`
    SELECT 
      s.id as stock_id,
      s.name as stock_name,
      s.price as stock_price,
      s.quantity as stock_quantity,
      st.id as store_id,
      st.name as store_name,
      st.location as store_location,
      st.category as store_category,
      COUNT(cp.id) as purchase_count
    FROM stocks s
    JOIN stores st ON s.store_id = st.id
    LEFT JOIN customer_purchases cp ON s.id = cp.stock_id
    WHERE st.location = $1 AND s.quantity > 0
    GROUP BY s.id, s.name, s.price, s.quantity, st.id, st.name, st.location, st.category
    ORDER BY purchase_count DESC, s.price ASC
    LIMIT $2
  `, [location, limit]);
  return result.rows;
}

module.exports = {
  getPersonalizedRecommendations,
  getTrendingProducts,
  getCollaborativeRecommendations,
  getCategoryRecommendations,
  getLocationRecommendations
}; 