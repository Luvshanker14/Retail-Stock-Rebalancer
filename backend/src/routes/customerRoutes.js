const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');
const authenticateCustomer = require('../middleware/authenticateCustomer');

router.post('/signup', customerController.signupCustomer);
router.post('/login', customerController.loginCustomer);
router.post('/send-signup-otp', customerController.sendSignupOTP);
router.post('/verify-signup-otp', customerController.verifySignupOTP);
router.get('/profile', authenticateCustomer, customerController.getProfile);
router.get('/purchases', authenticateCustomer, customerController.getPurchaseHistory);

module.exports = router;