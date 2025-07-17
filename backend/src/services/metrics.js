const client = require('prom-client');
const redisClient = require('./redisService');

const collectDefaultMetrics = client.collectDefaultMetrics;
collectDefaultMetrics();

const stockCounter = new client.Counter({
  name: 'stocks_added_total',
  help: 'Total number of stocks added',
  labelNames: ['admin_email','store_id']
});

const stockUpdatedCounter = new client.Counter({
  name: 'stocks_updated_total',
  help: 'Total number of stocks updated',
  labelNames: ['admin_email','store_id']
});

const stockRemovedCounter = new client.Counter({
  name: 'stocks_removed_total',
  help: 'Total number of stocks removed',
  labelNames: ['admin_email','store_id']
});

// Restore value from Redis at app startup
const redisCacheHitCounter = new client.Counter({
  name: 'redis_cache_hits_total',
  help: 'Total number of Redis cache hits',
  labelNames: ['admin_email','store_id']
});

const redisCacheMissCounter = new client.Counter({
  name: 'redis_cache_misses_total',
  help: 'Total number of Redis cache misses',
  labelNames: ['admin_email','store_id']
});

const lowStockAlertCounter = new client.Counter({
  name: 'low_stock_alerts_total',
  help: 'Number of times low stock threshold was crossed',
  labelNames: ['admin_email','store_id']
});

const dbQueryDuration = new client.Histogram({
  name: 'stock_db_query_duration_seconds',
  help: 'Duration of DB queries in seconds',
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2], // Customize as needed
});

const kafkaMessagesProducedCounter = new client.Counter({
  name: 'kafka_messages_produced_total',
  help: 'Total number of messages produced to Kafka',
  labelNames: ['admin_email','store_id']
});

const storeCounter = new client.Counter({
  name: 'stores_added_total',
  help: 'Total number of stores added',
  labelNames: ['admin_email']
});

const storeUpdatedCounter = new client.Counter({
  name: 'stores_updated_total',
  help: 'Total number of stores updated',
  labelNames: ['admin_email']
});

const storeRemovedCounter = new client.Counter({
  name: 'stores_removed_total',
  help: 'Total number of stores removed',
  labelNames: ['admin_email']
});

const storeStockGauge = new client.Gauge({
  name: 'store_stock_quantity',
  help: 'Total stock quantity per store',
  labelNames: ['store_id', 'store_name'],
});

// ===== PHASE 1 ANALYTICS METRICS =====

// Sales Performance Metrics
const purchaseCounter = new client.Counter({
  name: 'purchases_total',
  help: 'Total number of purchases made',
  labelNames: ['store_id', 'store_name', 'product_name', 'product_id']
});

const revenueCounter = new client.Counter({
  name: 'revenue_total',
  help: 'Total revenue generated',
  labelNames: ['store_id', 'store_name', 'product_name', 'product_id']
});

const dailySalesGauge = new client.Gauge({
  name: 'daily_sales',
  help: 'Daily sales count',
  labelNames: ['store_id', 'store_name', 'date']
});

const dailyRevenueGauge = new client.Gauge({
  name: 'daily_revenue',
  help: 'Daily revenue amount',
  labelNames: ['store_id', 'store_name', 'date']
});

// Stock Level Analytics
const stockLevelGauge = new client.Gauge({
  name: 'stock_level',
  help: 'Current stock level for each product',
  labelNames: ['store_id', 'store_name', 'product_name', 'product_id']
});

const lowStockGauge = new client.Gauge({
  name: 'low_stock_products',
  help: 'Number of products with low stock (below threshold)',
  labelNames: ['store_id', 'store_name']
});

const outOfStockGauge = new client.Gauge({
  name: 'out_of_stock_products',
  help: 'Number of products out of stock',
  labelNames: ['store_id', 'store_name']
});

// Store Performance Metrics
const storePerformanceGauge = new client.Gauge({
  name: 'store_performance_score',
  help: 'Store performance score based on sales and stock management',
  labelNames: ['store_id', 'store_name']
});

const storeTotalRevenueGauge = new client.Gauge({
  name: 'store_total_revenue',
  help: 'Total revenue per store',
  labelNames: ['store_id', 'store_name']
});

const storeTotalSalesGauge = new client.Gauge({
  name: 'store_total_sales',
  help: 'Total sales count per store',
  labelNames: ['store_id', 'store_name']
});

// Product Performance Metrics
const productSalesGauge = new client.Gauge({
  name: 'product_sales_count',
  help: 'Total sales count per product',
  labelNames: ['product_id', 'product_name', 'store_id', 'store_name']
});

const productRevenueGauge = new client.Gauge({
  name: 'product_revenue',
  help: 'Total revenue per product',
  labelNames: ['product_id', 'product_name', 'store_id', 'store_name']
});

const productStockTurnoverGauge = new client.Gauge({
  name: 'product_stock_turnover',
  help: 'Stock turnover rate per product (sales/stock ratio)',
  labelNames: ['product_id', 'product_name', 'store_id', 'store_name']
});

// Cart Analytics
const cartAbandonmentCounter = new client.Counter({
  name: 'cart_abandonments_total',
  help: 'Total number of cart abandonments',
  labelNames: ['store_id', 'store_name']
});

const successfulPurchaseCounter = new client.Counter({
  name: 'successful_purchases_total',
  help: 'Total number of successful purchases',
  labelNames: ['store_id', 'store_name']
});

// Rating and Review Metrics
const ratingCounter = new client.Counter({
  name: 'ratings_submitted_total',
  help: 'Total number of ratings submitted',
  labelNames: ['store_id', 'customer_id']
});

const reviewVoteCounter = new client.Counter({
  name: 'review_votes_total',
  help: 'Total number of review votes (helpful/not helpful)',
  labelNames: ['rating_id', 'customer_id']
});

const reviewReportCounter = new client.Counter({
  name: 'review_reports_total',
  help: 'Total number of review reports',
  labelNames: ['rating_id', 'customer_id']
});

const averageRatingGauge = new client.Gauge({
  name: 'store_average_rating',
  help: 'Average rating per store',
  labelNames: ['store_id', 'store_name']
});

const totalRatingsGauge = new client.Gauge({
  name: 'store_total_ratings',
  help: 'Total number of ratings per store',
  labelNames: ['store_id', 'store_name']
});

const restoredCounters = new Set();

async function restoreLabeledCounter(redisKeyPrefix, counter, labelKeys) {
  const keys = await redisClient.keys(`${redisKeyPrefix}:*`);
  for (const key of keys) {
    if (restoredCounters.has(key)) continue; // avoid double increment

    const count = await redisClient.get(key);
    const parts = key.replace(`${redisKeyPrefix}:`, '').split(':');

    const labels = {};
    parts.forEach(part => {
      const [k, v] = part.split('=');
      if (labelKeys.includes(k)) labels[k] = v;
    });

    if (Object.keys(labels).length === labelKeys.length) {
      counter.inc(labels, Number(count));
      restoredCounters.add(key); // mark as restored
    }
  }
}



// Function to restore counters with retry logic
async function restoreCountersWithRetry() {
  const maxRetries = 3;
  let retries = 0;
  
  while (retries < maxRetries) {
    try {
      // Wait a bit for Redis to be ready
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      await restoreLabeledCounter('stocks_added_total', stockCounter, ['admin_email', 'store_id']);
      await restoreLabeledCounter('stocks_updated_total', stockUpdatedCounter, ['admin_email', 'store_id']);
      await restoreLabeledCounter('stocks_removed_total', stockRemovedCounter, ['admin_email', 'store_id']);
      await restoreLabeledCounter('low_stock_alerts_total', lowStockAlertCounter, ['admin_email', 'store_id']);
      await restoreLabeledCounter('redis_cache_misses_total', redisCacheMissCounter, ['admin_email', 'store_id']);
      await restoreLabeledCounter('redis_cache_hits_total', redisCacheHitCounter, ['admin_email', 'store_id']);
      
      console.log('✅ Successfully restored counters from Redis');
      break; // Success, exit retry loop
    } catch (err) {
      retries++;
      console.error(`❌ Error restoring counters from Redis (attempt ${retries}/${maxRetries}):`, err.message);
      
      if (retries >= maxRetries) {
        console.log('⚠️ Skipping counter restoration after max retries');
        break;
      }
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }
}

// Start counter restoration after a delay to ensure Redis is ready
setTimeout(restoreCountersWithRetry, 5000);
// (async () => {
//   try {
//     const keys = await redisClient.keys('stocks_added_total:*');
//     for (const key of keys) {
//       const count = await redisClient.get(key);
//       const [, adminPart, storePart] = key.split(':');
//       const admin_email = adminPart.split('=')[1];
//       const store_id = storePart.split('=')[1];

//       stockCounter.inc({ admin_email, store_id }, Number(count));
//     }
//   } catch (err) {
//     console.error('Error restoring labeled stockCounter:', err.message);
//   }
// })();


// (async () => {
//   try {
//     const keys = await redisClient.keys('stocks_updated_total:*');
//     for (const key of keys) {
//       const count = await redisClient.get(key);
//       const [, adminPart, storePart] = key.split(':');
//       const admin_email = adminPart.split('=')[1];
//       const store_id = storePart.split('=')[1];

//       stockUpdatedCounter.inc({ admin_email, store_id }, Number(count));
//     }
//   } catch (err) {
//     console.error('Error restoring labeled stockCounter:', err.message);
//   }
// })();

// (async () => {
//   try {
//     const keys = await redisClient.keys('stocks_removed_total:*');
//     for (const key of keys) {
//       const count = await redisClient.get(key);
//       const [, adminPart, storePart] = key.split(':');
//       const admin_email = adminPart.split('=')[1];
//       const store_id = storePart.split('=')[1];

//       stockRemovedCounter.inc({ admin_email, store_id }, Number(count));
//     }
//   } catch (err) {
//     console.error('Error restoring labeled stockCounter:', err.message);
//   }
// })();

// (async () => {
//   try {
//     const valhit = await redisClient.get('redis_cache_hits_total');
//     if (valhit) {
//       redisCacheHitCounter.inc(Number(valhit));
//     }
//   } catch (err) {
//     console.error('Error restoring counter from Redis:', err.message);
//   }
// })();

// (async () => {
//   try {
//     const valmiss = await redisClient.get('redis_cache_misses_total');
//     if (valmiss) {
//       redisCacheMissCounter.inc(Number(valmiss));
//     }
//   } catch (err) {
//     console.error('Error restoring counter from Redis:', err.message);
//   }
// })();

// (async () => {
//   try {
//     const keys = await redisClient.keys('low_stock_alerts_total:*');
//     for (const key of keys) {
//       const count = await redisClient.get(key);
//       const [, adminPart, storePart] = key.split(':');
//       const admin_email = adminPart.split('=')[1];
//       const store_id = storePart.split('=')[1];

//       lowStockAlertCounter.inc({ admin_email, store_id }, Number(count));
//     }
//   } catch (err) {
//     console.error('Error restoring labeled stockCounter:', err.message);
//   }
// })();

// Function to restore simple counters with retry logic
async function restoreSimpleCountersWithRetry() {
  const maxRetries = 3;
  let retries = 0;
  
  while (retries < maxRetries) {
    try {
      // Wait a bit for Redis to be ready
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const valkafka = await redisClient.get('kafka_messages_produced_total');
      if (valkafka) {
        kafkaMessagesProducedCounter.inc(Number(valkafka));
      }
      
      const val = await redisClient.get('stores_added_total');
      if (val) {
        storeCounter.inc(Number(val));
      }
      
      const valupdated = await redisClient.get('stores_updated_total');
      if (valupdated) {
        storeUpdatedCounter.inc(Number(valupdated));
      }
      
      const valremoved = await redisClient.get('stores_removed_total');
      if (valremoved) {
        storeRemovedCounter.inc(Number(valremoved));
      }
      
      console.log('✅ Successfully restored simple counters from Redis');
      break; // Success, exit retry loop
    } catch (err) {
      retries++;
      console.error(`❌ Error restoring simple counters from Redis (attempt ${retries}/${maxRetries}):`, err.message);
      
      if (retries >= maxRetries) {
        console.log('⚠️ Skipping simple counter restoration after max retries');
        break;
      }
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }
}

// Start simple counter restoration after a delay to ensure Redis is ready
setTimeout(restoreSimpleCountersWithRetry, 7000);


module.exports = { 
  stockCounter, 
  stockRemovedCounter, 
  stockUpdatedCounter,
  storeCounter,
  storeUpdatedCounter,
  storeRemovedCounter, 
  redisCacheHitCounter,
  redisCacheMissCounter, 
  lowStockAlertCounter,
  dbQueryDuration,
  kafkaMessagesProducedCounter,
  storeStockGauge,
  // Phase 1 Analytics Metrics
  purchaseCounter,
  revenueCounter,
  dailySalesGauge,
  dailyRevenueGauge,
  stockLevelGauge,
  lowStockGauge,
  outOfStockGauge,
  storePerformanceGauge,
  storeTotalRevenueGauge,
  storeTotalSalesGauge,
  productSalesGauge,
  productRevenueGauge,
  productStockTurnoverGauge,
  cartAbandonmentCounter,
  successfulPurchaseCounter,
  // Rating and Review Metrics
  ratingCounter,
  reviewVoteCounter,
  reviewReportCounter,
  averageRatingGauge,
  totalRatingsGauge,
  client
};
