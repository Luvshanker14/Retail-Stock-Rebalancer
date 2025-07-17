require('dotenv').config();
const express = require('express');
const { Kafka } = require('kafkajs');
const redisClient = require('./services/redisService');
const { Pool } = require('pg');
const stockRoutes = require('./routes/stockRoutes');
const purchaseRoutes = require('./routes/purchaseRoutes');
const storeRoutes = require('./routes/storeRoutes');
const { client: promClient } = require('./services/metrics');
const { startKafkaConsumer } = require('./services/kafkaService');
const { updateStoreStockGauges } = require('./services/storeMetricsUpdater');
const adminRoutes = require('./routes/adminRoutes');
const logsRoutes=require('./routes/logsRoutes');
const customerRoutes=require('./routes/customerRoutes');
const superAdminRoutes = require('./routes/superAdminRoutes');
const adminRegistrationRoutes = require('./routes/adminRegistrationRoutes');
const passwordRoutes = require('./routes/passwordRoutes');
const wishlistRoutes = require('./routes/wishlistRoutes');
const recommendationRoutes = require('./routes/recommendationRoutes');
const passwordSetupRoutes = require('./routes/passwordSetupRoutes');
const ratingRoutes = require('./routes/ratingRoutes');

const cors = require('cors');
const app = express();
app.use(express.json()); 
app.use(cors({
  origin: true, // Allow all origins for debugging
  credentials: true // <-- if you're sending cookies or auth headers
}));


app.use('/api', stockRoutes);
app.use('/api', purchaseRoutes);
app.use('/api/stores', storeRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api', logsRoutes);
app.use('/api/customer', customerRoutes);
app.use('/api/super-admin', superAdminRoutes);
app.use('/api/admin-registration', adminRegistrationRoutes);
app.use('/api/password', passwordRoutes);
app.use('/api/password-setup', passwordSetupRoutes);
app.use('/api/ratings', ratingRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/recommendations', recommendationRoutes);

// Serve uploaded files
app.use('/uploads', express.static('uploads'));
const port = process.env.PORT || 3000;

// Kafka setup
const kafka = new Kafka({
  clientId: process.env.KAFKA_CLIENT_ID || 'retail-rebalancer',
  brokers: (process.env.KAFKA_BROKERS ? process.env.KAFKA_BROKERS.split(',') : ['localhost:9092']),
});

// Only start Kafka consumer if brokers are configured
if (process.env.KAFKA_BROKERS) {
  startKafkaConsumer();
} else {
  console.log('⚠️ Kafka brokers not configured, skipping Kafka consumer');
}
// Redis client
// const redisClient = redis.createClient();

// redisClient.on('error', (err) => console.error('Redis Client Error', err));

// PostgreSQL pool
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'retaildb',
  password: process.env.DB_PASSWORD || '12345678',
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 5432,
});

app.get('/', async (req, res) => {
  try {
    // await redisClient.connect();
    const pong = await redisClient.ping();

    const pgRes = await pool.query('SELECT NOW()');

    res.send({
      message: 'Retail Stock Rebalancer API',
      redis: pong,
      postgres_time: pgRes.rows[0].now,
    });
  } catch (err) {
    res.status(500).send({ error: err.message });
  } 
});

app.get('/metrics', async (req, res) => {
  res.set('Content-Type', promClient.register.contentType);
  res.send(await promClient.register.metrics());
});

// Redis status endpoint
app.get('/redis-status', async (req, res) => {
  try {
    const pong = await redisClient.ping();
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    const urlObj = new URL(redisUrl);
    
    res.json({
      status: 'connected',
      redis_host: `${urlObj.hostname}:${urlObj.port}`,
      ping_response: pong,
      using_cloud_redis: !!process.env.REDIS_URL
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      error: error.message,
      redis_url_configured: !!process.env.REDIS_URL
    });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
// Update every 30 seconds (tweak interval if needed)
setInterval(updateStoreStockGauges, 60 * 1000);

// require('./services/rebalancerService'); // at the bottom of index.js