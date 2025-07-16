const express = require('express');
const router = express.Router();
const recommendationController = require('../controllers/recommendationController');
const authenticateCustomer = require('../middleware/authenticateCustomer');

// Routes that require customer authentication
router.use(authenticateCustomer);

// Get personalized recommendations for customer
router.get('/personalized', recommendationController.getPersonalizedRecommendations);

// Get collaborative recommendations
router.get('/collaborative', recommendationController.getCollaborativeRecommendations);

// Get customer's favorite categories
router.get('/favorite-categories', recommendationController.getFavoriteCategories);

// Get customer's favorite stores
router.get('/favorite-stores', recommendationController.getFavoriteStores);

// Get all recommendations (combined)
router.get('/all', recommendationController.getAllRecommendations);

// Public routes (no authentication required)
// Get trending products
router.get('/trending', recommendationController.getTrendingProducts);

// Get category-based recommendations
router.get('/category/:category', recommendationController.getCategoryRecommendations);

// Get location-based recommendations
router.get('/location/:location', recommendationController.getLocationRecommendations);

module.exports = router; 