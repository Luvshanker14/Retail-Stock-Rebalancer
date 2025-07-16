const pool = require('../config/db');

async function getAllStocks(storeId) {
  const res = await pool.query('SELECT * FROM stocks WHERE store_id = $1',[storeId]);
  return res.rows;
}

async function addStock(name, quantity, price, storeID, adminId) {
  const result = await pool.query(
    'INSERT INTO stocks (name, quantity, price, store_id, admin_id) VALUES ($1, $2, $3, $4, $5) RETURNING *', 
    [name, quantity, price, storeID, adminId]
  );
  return result.rows[0];
}

async function getStockById(id) {
  const res = await pool.query('SELECT * FROM stocks WHERE id = $1', [id]);
  return res.rows[0];
}

async function updateStockQuantity(id, quantity, price, storeId) {
  let result;
  if (price !== undefined && quantity === undefined) {
    // Only price is being updated
    result = await pool.query(
      'UPDATE stocks SET price = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND store_id = $3 RETURNING *',
      [price, id, storeId]
    );
  } else if (quantity !== undefined && price === undefined) {
    // Only quantity is being updated
    result = await pool.query(
      'UPDATE stocks SET quantity = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND store_id = $3 RETURNING *',
      [quantity, id, storeId]
    );
  } else {
    // Both quantity and price are being updated
    result = await pool.query(
      'UPDATE stocks SET quantity = $1, price = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 AND store_id = $4 RETURNING *',
      [quantity, price, id, storeId]
    );
  }
  return result.rows[0];
}


async function deleteStock(id, storeId,adminId) {
  const res=await pool.query(
      'DELETE FROM stocks WHERE id = $1 AND store_id = $2 AND admin_id = $3 RETURNING *',
      [id, storeId, adminId]
    );
    return res;
}

module.exports = { getAllStocks, addStock ,getStockById,updateStockQuantity,deleteStock};
