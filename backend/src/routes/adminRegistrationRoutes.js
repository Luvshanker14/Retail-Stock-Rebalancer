const express = require('express');
const router = express.Router();
const adminRegistrationController = require('../controllers/adminRegistrationController');

// Public routes (no authentication required)
router.get('/plans', adminRegistrationController.getSubscriptionPlans);
router.post('/register', adminRegistrationController.createAdminRequest);
router.post('/verify-payment', adminRegistrationController.verifyPayment);
router.get('/status', adminRegistrationController.getAdminRequestStatus);

module.exports = router; 