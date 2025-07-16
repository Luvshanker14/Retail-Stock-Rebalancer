const storeModel = require('../models/storeModel');
const { kafkaProducer } = require('../services/kafkaService');
const redisClient = require('../services/redisService');
const { storeCounter, storeRemovedCounter, storeUpdatedCounter, redisCacheHitCounter, redisCacheMissCounter,dbQueryDuration,kafkaMessagesProducedCounter} = require('../services/metrics');
const pool = require('../config/db');

async function getStores(req, res) {
  try {
    const cached = await redisClient.get('stores');
    if (cached) {
      await redisClient.incr('redis_cache_hits_total');
    // Fetch value from Redis and sync Prometheus counter
      const currentCount = await redisClient.get('redis_cache_hits_total');
      redisCacheHitCounter.reset(); // clear in-memory counter
      redisCacheHitCounter.inc(Number(currentCount));
      return res.json(JSON.parse(cached));
    }
    await redisClient.incr('redis_cache_misses_total');
    // Fetch value from Redis and sync Prometheus counter
    const currentCount = await redisClient.get('redis_cache_misses_total');
    redisCacheMissCounter.reset(); // clear in-memory counter
    redisCacheMissCounter.inc(Number(currentCount));
    const end = dbQueryDuration.startTimer();
    const stores = await storeModel.getAllStores();
    end();
    await redisClient.setEx('stores', 600, JSON.stringify(stores));
    res.json(stores);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// async function createStore(req, res) {
//   const { name, category} = req.body;
//   try {
//     const end = dbQueryDuration.startTimer();
//     const store = await storeModel.createStore(name, category);
//     end();
//     await redisClient.incr('stores_added_total');

//     // Fetch value from Redis and sync Prometheus counter
//     const currentCount = await redisClient.get('stores_added_total');
//     storeCounter.reset(); // clear in-memory counter
//     storeCounter.inc(Number(currentCount));
//     await kafkaProducer.send({
//       topic: 'store-events',
//       messages: [
//         { value: JSON.stringify({ event: 'store-added', name, category,timestamp: new Date() }) }
//       ]
//     });
//     await redisClient.incr('kafka_messages_produced_total');
//     const currentCountkafka = await redisClient.get('kafka_messages_produced_total');
//     kafkaMessagesProducedCounter.reset(); // clear in-memory counter
//     kafkaMessagesProducedCounter.inc(Number(currentCountkafka));
//     res.status(201).send('Store added');
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// }
async function createStore(req, res) {
  const { name, category ,location} = req.body;
  const adminEmail = req.admin?.email || 'unknown';

  try {
    const end = dbQueryDuration.startTimer();
    const store = await storeModel.createStore(name, category,location);
    end();

    await redisClient.del('stores'); // Clear stale cache

    storeCounter.inc({ admin_email: adminEmail });
    await redisClient.incr('stores_added_total');

    await kafkaProducer.send({
      topic: 'store-events',
      messages: [
        {
          value: JSON.stringify({
            event: 'store-added',
            name,
            category,
            admin_email: adminEmail,
            timestamp: new Date()
          }),
        },
      ],
    });

    kafkaMessagesProducedCounter.inc({ admin_email: adminEmail });
    await redisClient.incr('kafka_messages_produced_total');

    res.status(201).send('Store added');
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}


// async function updateStore(req, res) {
//   const { id } = req.params;
//   const { name, category } = req.body;
//   try {
//     const storeRes = await pool.query('SELECT * FROM stores WHERE id = $1', [id]);
//     const name1 = storeRes.rows[0]?.name || 'Unknown';
//     const category1 = storeRes.rows[0]?.category || 'Unknown';
//     const end = dbQueryDuration.startTimer();
//     const store = await storeModel.updateStore(id, name, category);
//     end();
//     await redisClient.incr('stores_updated_total');
//     // Fetch value from Redis and sync Prometheus counter
//     const currentCount = await redisClient.get('stores_updated_total');
//     storeUpdatedCounter.reset(); // clear in-memory counter
//     storeUpdatedCounter.inc(Number(currentCount));
//     await kafkaProducer.send({
//       topic: 'store-events',
//       messages: [
//         {
//           value: JSON.stringify({
//             event: 'store-updated',
//             name1,
//             category1,
//             name,
//             category,
//             timestamp: new Date().toISOString(),
//           }),
//         },
//       ],
//     });
//     await redisClient.incr('kafka_messages_produced_total');
//     const currentCountkafka2 = await redisClient.get('kafka_messages_produced_total');
//     kafkaMessagesProducedCounter.reset(); // clear in-memory counter
//     kafkaMessagesProducedCounter.inc(Number(currentCountkafka2));
    
//     res.status(201).send('Store Updated');
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// }

async function updateStore(req, res) {
  const { id } = req.params;
  const { name, category ,location} = req.body;
  const adminEmail = req.admin?.email || 'unknown';

  try {
    const storeRes = await pool.query('SELECT * FROM stores WHERE id = $1', [id]);

    if (storeRes.rowCount === 0) {
      return res.status(404).json({ error: 'Store not found' });
    }

    const oldName = storeRes.rows[0].name;
    const oldCategory = storeRes.rows[0].category;
    const oldLocation = storeRes.rows[0].location;

    const end = dbQueryDuration.startTimer();
    const updated = await storeModel.updateStore(id, name, category, location);
    end();

    if (!updated) {
      return res.status(500).json({ error: 'Failed to update store' });
    }

    await redisClient.del('stores'); // Invalidate store cache

    await redisClient.incr('stores_updated_total');
    storeUpdatedCounter.inc({ admin_email: adminEmail });

    await kafkaProducer.send({
      topic: 'store-events',
      messages: [
        {
          value: JSON.stringify({
            event: 'store-updated',
            store_id: id,
            old_name: oldName,
            old_category: oldCategory,
            old_location: oldLocation,
            new_name: name,
            new_category: category,
            new_location: location,
            admin_email: adminEmail,
            timestamp: new Date().toISOString(),
          }),
        },
      ],
    });

    await redisClient.incr('kafka_messages_produced_total');
    kafkaMessagesProducedCounter.inc({ admin_email: adminEmail });

    res.status(200).send('Store updated');
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}


async function deleteStore(req, res) {
  const { id } = req.params;
  try {
    const end = dbQueryDuration.startTimer();
    await storeModel.deleteStore(id);
    end();
    // Increment Redis count
    await redisClient.incr('stores_removed_total');
    // Fetch value from Redis and sync Prometheus counter
    const currentCount = await redisClient.get('stores_removed_total');
    storeRemovedCounter.reset(); // clear in-memory counter
    storeRemovedCounter.inc(Number(currentCount));

    await kafkaProducer.send({
      topic: 'store-events',
      messages: [
        {
          value: JSON.stringify({
            event: 'store-removed',
            id,
            timestamp: new Date().toISOString(),
          }),
        },
      ],
    });
    await redisClient.incr('kafka_messages_produced_total');
    const currentCountkafka = await redisClient.get('kafka_messages_produced_total');
    kafkaMessagesProducedCounter.reset(); // clear in-memory counter
    kafkaMessagesProducedCounter.inc(Number(currentCountkafka));
    res.status(201).send("Store Deleted");
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function getStore(req, res) {
  const { id: store_id } = req.params;
  try {
    const cached = await redisClient.get(`store:${store_id}`);
    if (cached) {
      console.log(`✅ Cache HIT for store:${store_id}`);
      await redisClient.incr('redis_cache_hits_total');
      const currentCount = await redisClient.get('redis_cache_hits_total');
      redisCacheHitCounter.reset();
      redisCacheHitCounter.inc(Number(currentCount));

      const store = JSON.parse(cached);
      if (store) return res.json(store);
      return res.status(404).send('Store not found in cache');
    }

    // Cache miss
    console.log(`❌ Cache MISS for store:${store_id}`);
    await redisClient.incr('redis_cache_misses_total');
    const currentCount = await redisClient.get('redis_cache_misses_total');
    redisCacheMissCounter.reset();
    redisCacheMissCounter.inc(Number(currentCount));
    const end = dbQueryDuration.startTimer();
    const store = await storeModel.getStoreById(store_id);
    end();

    if (!store) return res.status(404).send('Store not found');
    const result = await redisClient.setEx(`store:${store_id}`, 600, JSON.stringify(store));
    console.log(`Redis set result for store:${store_id}:`, result);
    res.json(store);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function trackStore(req, res) {
  const { storeId } = req.params;
  const adminId = req.admin?.id;

  try {
    // Ensure store exists
    const store = await pool.query('SELECT id FROM stores WHERE id = $1', [storeId]);
    if (store.rowCount === 0) return res.status(404).json({ error: 'Store not found' });

    // Check if already tracked
    const exists = await pool.query(
      'SELECT * FROM admin_store_links WHERE admin_id = $1 AND store_id = $2',
      [adminId, storeId]
    );
    if (exists.rowCount > 0) return res.status(400).json({ error: 'Store already added to dashboard' });

    // Insert mapping
    await pool.query(
      'INSERT INTO admin_store_links(admin_id, store_id) VALUES ($1, $2)',
      [adminId, storeId]
    );

    res.status(201).json({ message: 'Store added to dashboard' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function getTrackedStores(req, res) {
  const adminId = req.admin?.id;

  try {
    const result = await pool.query(`
      SELECT s.*
      FROM stores s
      JOIN admin_store_links a ON s.id = a.store_id
      WHERE a.admin_id = $1
    `, [adminId]);

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function getStoresByLocation(req, res) {
  const {location} = req.params;
  try {
    const result = await pool.query('SELECT * FROM stores WHERE location = $1', [location]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching stores', error: err.message });
  }
}

async function searchStores(req, res) {
  const { q: searchQuery, location, category } = req.query;
  
  try {
    let query = 'SELECT * FROM stores WHERE 1=1';
    const params = [];
    let paramIndex = 1;

    // Case-insensitive search in name, location, and category
    if (searchQuery) {
      query += ` AND (
        LOWER(name) LIKE LOWER($${paramIndex}) OR 
        LOWER(location) LIKE LOWER($${paramIndex}) OR 
        LOWER(category) LIKE LOWER($${paramIndex})
      )`;
      params.push(`%${searchQuery}%`);
      paramIndex++;
    }

    // Filter by location
    if (location) {
      query += ` AND LOWER(location) = LOWER($${paramIndex})`;
      params.push(location);
      paramIndex++;
    }

    // Filter by category
    if (category) {
      query += ` AND LOWER(category) = LOWER($${paramIndex})`;
      params.push(category);
      paramIndex++;
    }

    query += ' ORDER BY name ASC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: 'Error searching stores', error: err.message });
  }
}

module.exports = {
  getStores,
  createStore,
  updateStore,
  deleteStore,
  getStore,
  getTrackedStores,
  trackStore,
  getStoresByLocation,
  searchStores
};
