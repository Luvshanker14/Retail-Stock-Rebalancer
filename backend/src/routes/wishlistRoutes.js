const express = require('express');
const router = express.Router();
const wishlistController = require('../controllers/wishlistController');
const authenticateCustomer = require('../middleware/authenticateCustomer');

// Test endpoint to verify routes are working
router.get('/test', (req, res) => {
  res.json({ message: 'Wishlist routes are working!' });
});

// All routes require customer authentication
router.use(authenticateCustomer);

// Add item to wishlist
router.post('/add', wishlistController.addToWishlist);

// Remove item from wishlist
router.delete('/remove/:stockId', wishlistController.removeFromWishlist);

// Get customer's wishlist
router.get('/', wishlistController.getWishlist);

// Check if item is in wishlist
router.get('/check/:stockId', wishlistController.checkWishlistStatus);

// Get wishlist count
router.get('/count', wishlistController.getWishlistCount);

module.exports = router; 