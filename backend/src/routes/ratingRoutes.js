const express = require('express');
const router = express.Router();
const ratingController = require('../controllers/ratingController');
const authenticateCustomer = require('../middleware/authenticateCustomer');

// Public routes (no authentication required)
router.get('/stores/:storeId/stats', ratingController.getStoreRatingStats);
router.get('/stores/:storeId/reviews', ratingController.getStoreReviews);
router.get('/top-rated', ratingController.getTopRatedStores);
router.get('/recent', ratingController.getRecentReviews);
router.get('/stores-with-ratings', ratingController.getAllStoresWithRatings);

// Customer authenticated routes
router.get('/stores/:storeId/my-rating', authenticateCustomer, ratingController.getCustomerRating);
router.post('/stores/:storeId/ratings', authenticateCustomer, ratingController.createRating);
router.put('/ratings/:ratingId', authenticateCustomer, ratingController.updateRating);
router.delete('/ratings/:ratingId', authenticateCustomer, ratingController.deleteRating);
router.post('/ratings/:ratingId/vote', authenticateCustomer, ratingController.voteOnReview);
router.post('/ratings/:ratingId/report', authenticateCustomer, ratingController.reportReview);
router.get('/customer/reviews', authenticateCustomer, ratingController.getCustomerReviews);

// Photo upload routes
router.post('/ratings/:ratingId/photos', authenticateCustomer, ratingController.upload.array('photos', 5), ratingController.uploadReviewPhotos);
router.delete('/photos/:photoId', authenticateCustomer, ratingController.deleteReviewPhoto);
router.get('/ratings/:ratingId/photos', ratingController.getReviewPhotos);

module.exports = router; 