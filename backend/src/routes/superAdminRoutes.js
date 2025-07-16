const express = require('express');
const router = express.Router();
const superAdminController = require('../controllers/superAdminController');
const {
  getChangePlanRequests,
  approveChangePlanRequest,
  rejectChangePlanRequest
} = require('../controllers/superAdminController');
const authenticateSuperAdmin = require('../middleware/authenticateSuperAdmin');

// Public routes (no authentication required)
router.post('/login', superAdminController.loginSuperAdmin);

// Protected routes (require super admin authentication)
router.use(authenticateSuperAdmin);

// Dashboard
router.get('/dashboard', superAdminController.getDashboardStats);

// Admin Subscriptions Management
router.get('/subscriptions', superAdminController.getAllAdminSubscriptions);

// Admin Requests Management
router.get('/requests', superAdminController.getAllAdminRequests);
router.post('/requests/:requestId/approve', superAdminController.approveAdminRequest);
router.post('/requests/:requestId/reject', superAdminController.rejectAdminRequest);

// Revenue Analytics
router.get('/revenue', superAdminController.getPlatformRevenue);

// System Logs
router.get('/logs', superAdminController.getSuperAdminLogs);

// Payout to Admin (Revenue After Commission)
router.post('/admins/:adminId/payout', superAdminController.payoutToAdmin);

// Get current earnings after commission for an admin
router.get('/admins/:adminId/earnings', superAdminController.getAdminEarningsAfterCommission);

// Get recent payouts
router.get('/recent-payouts', superAdminController.getRecentPayouts);

// Get monthly revenue trend (with 28th cutoff rule)
router.get('/monthly-revenue-trend', superAdminController.getMonthlyRevenueTrend);

// Approve admin cancellation request
router.post('/admins/:adminId/cancel-approve', authenticateSuperAdmin, superAdminController.approveAdminCancellation);
// Reject admin cancellation request
router.post('/admins/:adminId/cancel-reject', authenticateSuperAdmin, superAdminController.rejectAdminCancellation);

// Get all admin cancellation requests (optionally filter by status)
router.get('/cancellation-requests', authenticateSuperAdmin, superAdminController.getAdminCancellationRequests);

// Change Plan Requests (Super Admin)
router.get('/change-plan-requests', authenticateSuperAdmin, getChangePlanRequests);
router.post('/change-plan-requests/:id/approve', authenticateSuperAdmin, approveChangePlanRequest);
router.post('/change-plan-requests/:id/reject', authenticateSuperAdmin, rejectChangePlanRequest);

module.exports = router; 