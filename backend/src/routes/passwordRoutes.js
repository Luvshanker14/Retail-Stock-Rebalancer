const express = require('express');
const router = express.Router();
const passwordController = require('../controllers/passwordController');
const { authenticatePasswordChange, determineUserType } = require('../middleware/authenticatePasswordChange');

// Public routes (no authentication required)
// Send OTP for password change
router.post('/send-otp', passwordController.sendPasswordChangeOTP);

// Change password with OTP (no authentication required)
router.post('/change-with-otp', passwordController.changePasswordWithOTP);

// Protected routes (authentication required)
// Change password with current password
router.post('/change-with-current', 
  authenticatePasswordChange, 
  determineUserType, 
  passwordController.changePasswordWithCurrent
);

module.exports = router; 