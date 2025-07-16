// const redis = require('redis');
// const client = redis.createClient();

// client.on('error', (err) => console.error('Redis error:', err));

// module.exports = client;
const redis = require('redis');
const redisClient = redis.createClient();

redisClient.on('error', (err) => console.error('Redis Client Error', err));
(async () => {
  await redisClient.connect();
  console.log('✅ Redis client connected');
})();
module.exports = redisClient;
