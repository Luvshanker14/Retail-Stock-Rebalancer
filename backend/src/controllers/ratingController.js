const RatingModel = require('../models/ratingModel');
const { kafkaProducer } = require('../services/kafkaService');
const redisClient = require('../services/redisService');
const { ratingCounter, reviewVoteCounter, reviewReportCounter } = require('../services/metrics');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;

// Configure multer for photo uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = 'uploads/review-photos';
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `review-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const fileFilter = (req, file, cb) => {
  // Allow only image files
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 5 // Max 5 photos per review
  }
});

// Get store rating statistics
async function getStoreRatingStats(req, res) {
  const { storeId } = req.params;
  
  try {
    // Check cache first
    const cacheKey = `store_rating_stats:${storeId}`;
    const cached = await redisClient.get(cacheKey);
    
    if (cached) {
      return res.json(JSON.parse(cached));
    }

    const stats = await RatingModel.getStoreRatingStats(storeId);
    
    // Debug logging
    console.log('Store rating stats for store', storeId, ':', stats);
    
    // Cache for 5 minutes
    await redisClient.setEx(cacheKey, 300, JSON.stringify(stats));
    
    res.json(stats);
  } catch (error) {
    console.error('Error getting store rating stats:', error);
    res.status(500).json({ error: 'Failed to get rating statistics' });
  }
}

// Get store reviews with pagination
async function getStoreReviews(req, res) {
  const { storeId } = req.params;
  const { page = 1, limit = 10, sortBy = 'created_at', sortOrder = 'DESC' } = req.query;
  
  try {
    const reviews = await RatingModel.getStoreRatingsWithPhotos(storeId, parseInt(page), parseInt(limit), sortBy, sortOrder);
    const totalCount = await RatingModel.getStoreRatingsCount(storeId);
    
    res.json({
      reviews,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalCount,
        totalPages: Math.ceil(totalCount / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error getting store reviews:', error);
    res.status(500).json({ error: 'Failed to get reviews' });
  }
}

// Create or update a rating
async function createRating(req, res) {
  const { storeId } = req.params;
  const { rating, reviewText, isVerifiedPurchase = false } = req.body;
  const customerId = req.customer?.id;

  if (!customerId) {
    return res.status(401).json({ error: 'Customer authentication required' });
  }

  if (!rating || rating < 1 || rating > 5) {
    return res.status(400).json({ error: 'Rating must be between 1 and 5' });
  }

  try {
    const newRating = await RatingModel.createRating(
      storeId, 
      customerId, 
      rating, 
      reviewText, 
      isVerifiedPurchase
    );

    // Clear cache
    await redisClient.del(`store_rating_stats:${storeId}`);

    // Send Kafka event
    await kafkaProducer.send({
      topic: 'rating-events',
      messages: [
        {
          value: JSON.stringify({
            event: 'rating-created',
            store_id: storeId,
            customer_id: customerId,
            rating,
            has_review: !!reviewText,
            timestamp: new Date().toISOString()
          })
        }
      ]
    });

    ratingCounter.inc({ store_id: storeId, customer_id: customerId });

    res.status(201).json({
      message: 'Rating submitted successfully',
      rating: newRating
    });
  } catch (error) {
    console.error('Error creating rating:', error);
    res.status(500).json({ error: 'Failed to submit rating' });
  }
}

// Update a rating
async function updateRating(req, res) {
  const { ratingId } = req.params;
  const { rating, reviewText, isVerifiedPurchase } = req.body;
  const customerId = req.customer?.id;

  if (!customerId) {
    return res.status(401).json({ error: 'Customer authentication required' });
  }

  if (!rating || rating < 1 || rating > 5) {
    return res.status(400).json({ error: 'Rating must be between 1 and 5' });
  }

  try {
    const updatedRating = await RatingModel.updateRating(
      ratingId,
      customerId,
      rating,
      reviewText,
      isVerifiedPurchase
    );

    if (!updatedRating) {
      return res.status(404).json({ error: 'Rating not found or not authorized' });
    }

    // Clear cache
    await redisClient.del(`store_rating_stats:${updatedRating.store_id}`);

    res.json({
      message: 'Rating updated successfully',
      rating: updatedRating
    });
  } catch (error) {
    console.error('Error updating rating:', error);
    res.status(500).json({ error: 'Failed to update rating' });
  }
}

// Delete a rating
async function deleteRating(req, res) {
  const { ratingId } = req.params;
  const customerId = req.customer?.id;

  if (!customerId) {
    return res.status(401).json({ error: 'Customer authentication required' });
  }

  try {
    const deletedRating = await RatingModel.deleteRating(ratingId, customerId);

    if (!deletedRating) {
      return res.status(404).json({ error: 'Rating not found or not authorized' });
    }

    // Clear cache
    await redisClient.del(`store_rating_stats:${deletedRating.store_id}`);

    res.json({ message: 'Rating deleted successfully' });
  } catch (error) {
    console.error('Error deleting rating:', error);
    res.status(500).json({ error: 'Failed to delete rating' });
  }
}

// Get customer's rating for a store
async function getCustomerRating(req, res) {
  const { storeId } = req.params;
  const customerId = req.customer?.id;

  if (!customerId) {
    return res.status(401).json({ error: 'Customer authentication required' });
  }

  try {
    const rating = await RatingModel.getCustomerRating(storeId, customerId);
    
    if (rating) {
      // Get photos for this rating
      const photos = await RatingModel.getReviewPhotos(rating.id);
      rating.photos = photos;
    }
    
    res.json({ rating });
  } catch (error) {
    console.error('Error getting customer rating:', error);
    res.status(500).json({ error: 'Failed to get customer rating' });
  }
}

// Get all reviews by current customer
async function getCustomerReviews(req, res) {
  const customerId = req.customer?.id;
  const { page = 1, limit = 10 } = req.query;

  if (!customerId) {
    return res.status(401).json({ error: 'Customer authentication required' });
  }

  try {
    const reviews = await RatingModel.getCustomerReviews(customerId, parseInt(page), parseInt(limit));
    res.json(reviews);
  } catch (error) {
    console.error('Error getting customer reviews:', error);
    res.status(500).json({ error: 'Failed to get customer reviews' });
  }
}

// Upload photos for a review
async function uploadReviewPhotos(req, res) {
  const { ratingId } = req.params;
  const customerId = req.customer?.id;

  if (!customerId) {
    return res.status(401).json({ error: 'Customer authentication required' });
  }

  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: 'No photos uploaded' });
  }

  try {
    // Verify the rating belongs to the customer
    const rating = await RatingModel.getRatingById(ratingId);
    if (!rating || rating.customer_id !== customerId) {
      return res.status(404).json({ error: 'Rating not found or not authorized' });
    }

    const photoUrls = [];
    for (const file of req.files) {
      const photoUrl = `/uploads/review-photos/${file.filename}`;
      await RatingModel.addReviewPhoto(ratingId, photoUrl, file.originalname);
      photoUrls.push(photoUrl);
    }

    // Clear cache to ensure fresh data
    await redisClient.del(`store_rating_stats:${rating.store_id}`);

    res.status(201).json({
      message: 'Photos uploaded successfully',
      photos: photoUrls
    });
  } catch (error) {
    console.error('Error uploading review photos:', error);
    res.status(500).json({ error: 'Failed to upload photos' });
  }
}

// Delete a review photo
async function deleteReviewPhoto(req, res) {
  const { photoId } = req.params;
  const customerId = req.customer?.id;

  if (!customerId) {
    return res.status(401).json({ error: 'Customer authentication required' });
  }

  try {
    const deletedPhoto = await RatingModel.deleteReviewPhoto(photoId, customerId);
    
    if (!deletedPhoto) {
      return res.status(404).json({ error: 'Photo not found or not authorized' });
    }

    // Delete the actual file
    try {
      await fs.unlink(`uploads/review-photos/${path.basename(deletedPhoto.photo_url)}`);
    } catch (fileError) {
      console.error('Error deleting photo file:', fileError);
    }

    res.json({ message: 'Photo deleted successfully' });
  } catch (error) {
    console.error('Error deleting review photo:', error);
    res.status(500).json({ error: 'Failed to delete photo' });
  }
}

// Get photos for a review
async function getReviewPhotos(req, res) {
  const { ratingId } = req.params;

  try {
    const photos = await RatingModel.getReviewPhotos(ratingId);
    res.json(photos);
  } catch (error) {
    console.error('Error getting review photos:', error);
    res.status(500).json({ error: 'Failed to get review photos' });
  }
}

// Vote on a review (helpful/not helpful)
async function voteOnReview(req, res) {
  const { ratingId } = req.params;
  const { isHelpful } = req.body;
  const customerId = req.customer?.id;

  if (!customerId) {
    return res.status(401).json({ error: 'Customer authentication required' });
  }

  if (typeof isHelpful !== 'boolean') {
    return res.status(400).json({ error: 'isHelpful must be a boolean' });
  }

  try {
    const vote = await RatingModel.voteOnReview(ratingId, customerId, isHelpful);
    
    reviewVoteCounter.inc({ rating_id: ratingId, customer_id: customerId });

    res.json({
      message: 'Vote recorded successfully',
      vote
    });
  } catch (error) {
    console.error('Error voting on review:', error);
    res.status(500).json({ error: 'Failed to record vote' });
  }
}

// Report a review
async function reportReview(req, res) {
  const { ratingId } = req.params;
  const { reason } = req.body;
  const customerId = req.customer?.id;

  if (!customerId) {
    return res.status(401).json({ error: 'Customer authentication required' });
  }

  if (!reason || reason.trim().length === 0) {
    return res.status(400).json({ error: 'Reason is required' });
  }

  try {
    const report = await RatingModel.reportReview(ratingId, customerId, reason);
    
    reviewReportCounter.inc({ rating_id: ratingId, customer_id: customerId });

    res.status(201).json({
      message: 'Review reported successfully',
      report
    });
  } catch (error) {
    console.error('Error reporting review:', error);
    res.status(500).json({ error: 'Failed to report review' });
  }
}

// Get top rated stores
async function getTopRatedStores(req, res) {
  const { limit = 10 } = req.query;
  
  try {
    const stores = await RatingModel.getTopRatedStores(parseInt(limit));
    res.json(stores);
  } catch (error) {
    console.error('Error getting top rated stores:', error);
    res.status(500).json({ error: 'Failed to get top rated stores' });
  }
}

// Get recent reviews across all stores
async function getRecentReviews(req, res) {
  const { limit = 10 } = req.query;
  
  try {
    const reviews = await RatingModel.getRecentReviews(parseInt(limit));
    res.json(reviews);
  } catch (error) {
    console.error('Error getting recent reviews:', error);
    res.status(500).json({ error: 'Failed to get recent reviews' });
  }
}

// Get all stores with ratings (for customer home page)
async function getAllStoresWithRatings(req, res) {
  try {
    const stores = await RatingModel.getAllStoresWithRatings();
    res.json(stores);
  } catch (error) {
    console.error('Error getting stores with ratings:', error);
    res.status(500).json({ error: 'Failed to get stores with ratings' });
  }
}

module.exports = {
  getStoreRatingStats,
  getStoreReviews,
  createRating,
  updateRating,
  deleteRating,
  getCustomerRating,
  getCustomerReviews,
  uploadReviewPhotos,
  deleteReviewPhoto,
  getReviewPhotos,
  voteOnReview,
  reportReview,
  getTopRatedStores,
  getRecentReviews,
  getAllStoresWithRatings,
  upload // Export multer upload middleware
}; 