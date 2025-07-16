const express = require('express');
const router = express.Router();
const { getKafkaLogs, getKafkaLogsForStore} = require('../controllers/logsController');
const authenticateAdmin = require('../middleware/authenticateAdmin');

router.get('/logs', authenticateAdmin, getKafkaLogs);
router.get('/stores/:storeId/logs', authenticateAdmin, getKafkaLogsForStore);
module.exports = router;
