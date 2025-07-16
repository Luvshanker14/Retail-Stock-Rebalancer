const pool = require('../config/db');
const { storeStockGauge } = require('./metrics');
const dbQueryDuration = require('./metrics').dbQueryDuration;

async function updateStoreStockGauges() {
  const end = dbQueryDuration.startTimer();

  // Get total stock per store
  const stockResult = await pool.query(`
    SELECT store_id, SUM(quantity) as total_quantity
    FROM stocks
    GROUP BY store_id
  `);

  // Get store names
  const nameResult = await pool.query(`SELECT id, name FROM stores`);
  const storeNames = {};
  nameResult.rows.forEach(({ id, name }) => {
    storeNames[id] = name;
  });

  end();

  // Update gauge
  storeStockGauge.reset(); // avoid stale data
  stockResult.rows.forEach(({ store_id, total_quantity }) => {
    const name = storeNames[store_id] || 'Unknown';
    storeStockGauge.labels(store_id.toString(), name).set(Number(total_quantity));
  });
}
module.exports = { updateStoreStockGauges };