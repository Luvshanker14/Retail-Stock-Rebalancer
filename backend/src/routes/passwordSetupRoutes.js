const express = require('express');
const router = express.Router();
const passwordSetupController = require('../controllers/passwordSetupController');

// Verify setup token (GET)
router.get('/verify/:token', passwordSetupController.verifySetupToken);

// Set up password (POST)
router.post('/setup', passwordSetupController.setupPassword);

module.exports = router; 