const redis = require('redis');

// Use REDIS_URL from environment variable if available, otherwise fallback to localhost
const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

// Configure Redis client based on whether it's a cloud service (Upstash) or local
const isCloudRedis = redisUrl.includes('upstash.io') || redisUrl.includes('redis.com') || redisUrl.includes('redislabs.com');

const redisClient = redis.createClient({
  url: redisUrl,
  socket: {
    // Enable TLS for cloud Redis services
    tls: isCloudRedis,
    // Connection timeout
    connectTimeout: 10000,
    // Keep connection alive
    keepAlive: 5000,
    // Reconnection settings
    reconnectStrategy: (retries) => {
      if (retries > 10) {
        console.error('❌ Redis reconnection failed after 10 attempts');
        return false; // Stop trying to reconnect
      }
      const delay = Math.min(retries * 1000, 5000);
      console.log(`🔄 Redis reconnecting in ${delay}ms (attempt ${retries})`);
      return delay;
    }
  }
});

// Extract host info for logging (without exposing credentials)
const getRedisHostInfo = (url) => {
  try {
    const urlObj = new URL(url);
    return `${urlObj.hostname}:${urlObj.port}`;
  } catch (error) {
    return 'unknown';
  }
};

redisClient.on('error', (err) => {
  console.error('❌ Redis Client Error:', err.message);
  // Don't log the full error stack for connection issues
  if (!err.message.includes('Socket closed unexpectedly')) {
    console.error('Full error:', err);
  }
});

redisClient.on('connect', () => {
  const hostInfo = getRedisHostInfo(redisUrl);
  console.log(`🔗 Redis connecting to: ${hostInfo} ${isCloudRedis ? '(cloud)' : '(local)'}`);
});

redisClient.on('ready', () => {
  const hostInfo = getRedisHostInfo(redisUrl);
  console.log(`✅ Redis client ready: ${hostInfo}`);
});

redisClient.on('reconnecting', () => {
  console.log('🔄 Redis reconnecting...');
});

redisClient.on('end', () => {
  console.log('🔌 Redis connection ended');
});

(async () => {
  try {
    await redisClient.connect();
    const hostInfo = getRedisHostInfo(redisUrl);
    console.log(`✅ Redis client connected to: ${hostInfo}`);
    
    // Test the connection with a ping
    const pong = await redisClient.ping();
    console.log(`🏓 Redis ping response: ${pong}`);
  } catch (error) {
    console.error('❌ Failed to connect to Redis:', error.message);
    // For development, you might want to continue without Redis
    if (process.env.NODE_ENV === 'development') {
      console.log('⚠️ Continuing without Redis in development mode');
    }
  }
})();

module.exports = redisClient;
