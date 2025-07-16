const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const authenticateAdmin = require('../middleware/authenticateAdmin');

// DISABLED: Old admin registration routes that create admins directly
// router.post('/signup', adminController.signupAdmin);
// router.post('/send-signup-otp', adminController.sendSignupOTP);
// router.post('/verify-signup-otp', adminController.verifySignupOTP);

// Keep only login and dashboard routes
router.post('/login', adminController.loginAdmin);
router.get('/dashboard', authenticateAdmin, adminController.getDashboardStats);

// Password management
router.post('/change-password', authenticateAdmin, adminController.changePassword);

// Metrics endpoints for dashboard
router.get('/metrics/:type', authenticateAdmin, adminController.getMetricsData);

// Low stock details for admin
router.get('/low-stock', authenticateAdmin, adminController.getLowStockDetails);

// Rebalance stock for admin
router.post('/rebalance-stock', authenticateAdmin, adminController.rebalanceStock);

// Recent activities for admin
router.get('/recent-activity', authenticateAdmin, adminController.getRecentActivities);

// Top performing stores for admin
router.get('/top-stores', authenticateAdmin, adminController.getTopStores);

// Add route for admin cancellation request
router.post('/request-cancellation', authenticateAdmin, adminController.requestCancellation);

// Profile endpoint
router.get('/profile', authenticateAdmin, adminController.getAdminProfile);

// Change Plan Request (Admin)
router.post('/change-plan-request', authenticateAdmin, adminController.createChangePlanRequest);

// Get all active subscription plans (for admin)
router.get('/subscription-plans', authenticateAdmin, adminController.getSubscriptionPlans);

module.exports = router;