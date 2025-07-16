const { Kafka } = require('kafkajs');
const pool = require('../config/db');
const redisClient = require('../services/redisService');
const { stockCounter, stockRemovedCounter, stockUpdatedCounter, redisCacheHitCounter, redisCacheMissCounter,lowStockAlertCounter } = require('../services/metrics');
const kafka = new Kafka({
  clientId: 'retail-rebalancer',
  brokers: ['localhost:9092']
});

const kafkaProducer = kafka.producer();

(async () => {
  await kafkaProducer.connect();
})();

const kafkaConsumer = kafka.consumer({ groupId: 'stock-event-group' });

const startKafkaConsumer = async () => {
  await kafkaConsumer.connect();
  await kafkaConsumer.subscribe({ topic: 'stock-events', fromBeginning: true });
  await kafkaConsumer.subscribe({ topic: 'stock-alerts', fromBeginning: true });
  await kafkaConsumer.subscribe({ topic: 'store-events', fromBeginning: true });

  console.log('✅ Kafka Consumer connected and listening to stock-events...');

  async function logKafkaEvent(topic, event) {
  const { event: eventType, store_id, id: stock_id, admin_email } = event;
  await pool.query(
    'INSERT INTO kafka_logs (topic, event_type, store_id, stock_id, admin_email, payload) VALUES ($1, $2, $3, $4, $5, $6)',
    [
      topic,
      eventType,
      store_id || null,
      stock_id || null,
      admin_email || null,
      JSON.stringify(event), // Serialize payload
    ]
  );
}


//   await kafkaConsumer.run({
//     eachMessage: async ({ topic, partition, message }) => {
//       const parsedMessage = JSON.parse(message.value.toString());
//       console.log(`📩 [Kafka] Received message on topic ${topic}:`, parsedMessage);

//       // Future processing logic
//       // handleStockEvent(parsedMessage);
//       if (topic === 'stock-events') {
//         handleStockEvent(parsedMessage);
//       } else if (topic === 'stock-alerts') {
//         handleStockAlert(parsedMessage);
//       }
//       else
//       {
//         handleStoreEvent(parsedMessage);
//       }
//     },
//   });
// };
await kafkaConsumer.run({
  eachMessage: async ({ topic, partition, message }) => {
    try {
      const raw = message.value.toString();
      const event = JSON.parse(raw);

      console.log(`📩 [Kafka] Received message on topic '${topic}':`, event);

      switch (topic) {
        case 'stock-events':
          handleStockEvent(event);
          break;
        case 'stock-alerts':
          handleStockAlert(event);
          break;
        case 'store-events':
          handleStoreEvent(event);
          break;
        default:
          console.warn(`⚠️ Unknown topic: ${topic}`);
      }

      await logKafkaEvent(topic, event); // ✅ Log to DB after handling
      const storeId = event.store_id || event.storeId || event.id;
      if (storeId) {
        await redisClient.lPush(`kafka_logs:${storeId}`, JSON.stringify({
          topic,
          ...event,
          timestamp: new Date().toISOString()
        }));
        await redisClient.lTrim(`kafka_logs:${storeId}`, 0, 99); // Keep last 100
      } else {
        console.warn('⚠️ Event does not have a valid store_id:', event);
      }

    } catch (err) {
      console.error(`❌ Error processing Kafka message:`, err.message);
    }
  },
});
}
function handleStockEvent(event) {
  switch (event.event) {
    case 'stock-added':
      console.log(`🟢 Stock added: ${event.name} x${event.quantity} to store ${event.store_id}`);
      break;
    case 'stock-updated':
      console.log(`📝 Stock updated:stock_id: ${event.id} to quantity ${event.quantity} and price ${event.price} in store ${event.store_id}`);
      break;
    case 'stock-removed':
      console.log(`❌ Stock removed: name ${event.name} id: ${event.stock_id} from store ${event.store_id}`);
      break;
    case 'stock-purchased':
      console.log(`🛒 Stock purchased: ${event.name} (ID: ${event.id}) from Store ${event.store_id} Quantity purchased : ${event.purchased_quantity}— Remaining: ${event.quantity}`);
      break;
    default:
      console.log('⚠️ Unknown event type:', event.event);
  }
}

function handleStockAlert(event) {
  console.log(`⚠️ [ALERT] Low stock for item ID: ${event.id}, Quantity: ${event.quantity}`);
}

function handleStoreEvent(event) {
  switch (event.event) {
    case 'store-added':
      console.log(`🟢 Store added: ${event.name} & ${event.category}`);
      break;
    case 'store-updated':
      console.log(`📝 Store updated: ${event.name1} & ${event.category1} to ${event.name} & ${event.category}`);
      break;
    case 'store-removed':
      console.log(`❌ Store removed: ${event.id}`);
      break;
    default:
      console.log('⚠️ Unknown event type:', event.event);
  }
}


module.exports = { kafkaProducer ,startKafkaConsumer};
