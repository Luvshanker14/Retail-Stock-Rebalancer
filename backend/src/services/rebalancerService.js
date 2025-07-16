const cron = require('node-cron');
const pool = require('../config/db'); // your PostgreSQL pool
const { kafkaProducer } = require('./kafkaService');

cron.schedule('0 0 * * *', async () => {
  console.log('🔄 Running stock rebalance job...');

  try {
    const result = await pool.query(
      `UPDATE stocks SET quantity = 20 WHERE quantity < 10 RETURNING id, name`
    );

    for (const row of result.rows) {
      await kafkaProducer.send({
        topic: 'stock-events',
        messages: [
          {
            key: 'rebalance',
            value: JSON.stringify({
              event: 'rebalance',
              id: row.id,
              name: row.name,
              quantity: 20,
              timestamp: new Date().toISOString()
            }),
          },
        ],
      });

      console.log(`Rebalanced stock for ${row.name}`);
    }
  } catch (err) {
    console.error('Error during rebalance job:', err.message);
  }
});
