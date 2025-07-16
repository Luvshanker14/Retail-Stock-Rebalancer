const pool = require('../config/db');

async function getAllStores() {
  const res = await pool.query('SELECT * FROM stores ORDER BY created_at DESC');
  return res.rows;
}

async function getStoreById(id) {
  const res = await pool.query('SELECT * FROM stores WHERE id = $1', [id]);
  return res.rows[0];
}

async function createStore(name, category,location) {
  const res = await pool.query(
    'INSERT INTO stores (name, category,location) VALUES ($1, $2, $3) RETURNING *',
    [name, category,location]
  );
  return res.rows[0];
}

async function updateStore(id, name, category,location) {
  const res = await pool.query(
    'UPDATE stores SET name = $1, category = $2 ,location =$3 WHERE id = $4 RETURNING *',
    [name, category, location, id ]
  );
  return res.rows[0];
}

async function deleteStore(id) {
  await pool.query('DELETE FROM stores WHERE id = $1', [id]);
}




module.exports = {
  getAllStores,
  getStoreById,
  createStore,
  updateStore,
  deleteStore,
};
