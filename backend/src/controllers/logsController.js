const pool = require('../config/db');
const redisClient = require('../services/redisService');

async function getKafkaLogs(req, res) {
  try {
    const result = await pool.query(
      'SELECT * FROM kafka_logs ORDER BY timestamp DESC LIMIT 100'
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// controllers/logController.js
async function getKafkaLogsForStore(req, res) {
  const { storeId } = req.params;
  if (!storeId) {
    return res.status(400).json({ error: 'Missing storeId' });
  }
  try {
    const logs = await redisClient.lRange(`kafka_logs:${storeId}`, 0, 49); // Last 50 logs
    const parsed = logs.map(log => {
      try {
        return JSON.parse(log);
      } catch (err) {
        return { error: 'Invalid JSON', raw: log };
      }
    });

    res.json(parsed);
  } catch (err) {
    console.error(`❌ Failed to fetch Redis logs for store ${storeId}:`, err.message);
    res.status(500).json({ error: 'Failed to fetch logs' });
  }
}



module.exports = { getKafkaLogs,getKafkaLogsForStore};
