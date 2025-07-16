const pool = require('../config/db');

class RatingModel {
  // Get store rating statistics
  static async getStoreRatingStats(storeId) {
    try {
      const query = `
        SELECT 
          s.id as store_id,
          s.name as store_name,
          s.location as store_location,
          s.category as store_category,
          COUNT(sr.id) as total_ratings,
          ROUND(AVG(sr.rating), 1) as average_rating,
          COUNT(CASE WHEN sr.rating = 5 THEN 1 END) as five_star_count,
          COUNT(CASE WHEN sr.rating = 4 THEN 1 END) as four_star_count,
          COUNT(CASE WHEN sr.rating = 3 THEN 1 END) as three_star_count,
          COUNT(CASE WHEN sr.rating = 2 THEN 1 END) as two_star_count,
          COUNT(CASE WHEN sr.rating = 1 THEN 1 END) as one_star_count,
          COUNT(CASE WHEN sr.is_verified_purchase = true THEN 1 END) as verified_purchases,
          MAX(sr.created_at) as last_review_date
        FROM stores s
        LEFT JOIN store_ratings sr ON s.id = sr.store_id
        WHERE s.id = $1
        GROUP BY s.id, s.name, s.location, s.category
      `;
      
      const result = await pool.query(query, [storeId]);
      const row = result.rows[0];
      return row ? {
        store_id: parseInt(row.store_id),
        total_ratings: parseInt(row.total_ratings) || 0,
        average_rating: parseFloat(row.average_rating) || 0,
        five_star_count: parseInt(row.five_star_count) || 0,
        four_star_count: parseInt(row.four_star_count) || 0,
        three_star_count: parseInt(row.three_star_count) || 0,
        two_star_count: parseInt(row.two_star_count) || 0,
        one_star_count: parseInt(row.one_star_count) || 0,
        verified_purchases: parseInt(row.verified_purchases) || 0
      } : {
        store_id: parseInt(storeId),
        total_ratings: 0,
        average_rating: 0,
        five_star_count: 0,
        four_star_count: 0,
        three_star_count: 0,
        two_star_count: 0,
        one_star_count: 0,
        verified_purchases: 0
      };
    } catch (error) {
      throw error;
    }
  }

  // Get all ratings for a store with customer info
  static async getStoreRatings(storeId, page = 1, limit = 10, sortBy = 'created_at', sortOrder = 'DESC') {
    try {
      const offset = (page - 1) * limit;
      const validSortFields = ['created_at', 'rating', 'helpful_votes'];
      const validSortOrders = ['ASC', 'DESC'];
      
      const sortField = validSortFields.includes(sortBy) ? sortBy : 'created_at';
      const order = validSortOrders.includes(sortOrder.toUpperCase()) ? sortOrder.toUpperCase() : 'DESC';

      const query = `
        SELECT 
          sr.*,
          c.name as customer_name,
          c.email as customer_email,
          COUNT(rv.id) as helpful_votes_count,
          COUNT(rv2.id) as total_votes_count
        FROM store_ratings sr
        LEFT JOIN customers c ON sr.customer_id = c.id
        LEFT JOIN review_votes rv ON sr.id = rv.rating_id AND rv.is_helpful = true
        LEFT JOIN review_votes rv2 ON sr.id = rv2.rating_id
        WHERE sr.store_id = $1
        GROUP BY sr.id, c.name, c.email
        ORDER BY ${sortField} ${order}
        LIMIT $2 OFFSET $3
      `;
      
      const result = await pool.query(query, [storeId, limit, offset]);
      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  // Get total count of ratings for a store
  static async getStoreRatingsCount(storeId) {
    try {
      const query = 'SELECT COUNT(*) as count FROM store_ratings WHERE store_id = $1';
      const result = await pool.query(query, [storeId]);
      return parseInt(result.rows[0].count);
    } catch (error) {
      throw error;
    }
  }

  // Create a new rating
  static async createRating(storeId, customerId, rating, reviewText, isVerifiedPurchase = false) {
    try {
      const query = `
        INSERT INTO store_ratings (store_id, customer_id, rating, review_text, is_verified_purchase)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (store_id, customer_id) 
        DO UPDATE SET 
          rating = $3,
          review_text = $4,
          is_verified_purchase = $5,
          updated_at = CURRENT_TIMESTAMP
        RETURNING *
      `;
      
      const result = await pool.query(query, [storeId, customerId, rating, reviewText, isVerifiedPurchase]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  // Update an existing rating
  static async updateRating(ratingId, customerId, rating, reviewText, isVerifiedPurchase) {
    try {
      const query = `
        UPDATE store_ratings 
        SET rating = $3, review_text = $4, is_verified_purchase = $5, updated_at = CURRENT_TIMESTAMP
        WHERE id = $1 AND customer_id = $2
        RETURNING *
      `;
      
      const result = await pool.query(query, [ratingId, customerId, rating, reviewText, isVerifiedPurchase]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  // Delete a rating
  static async deleteRating(ratingId, customerId) {
    try {
      const query = 'DELETE FROM store_ratings WHERE id = $1 AND customer_id = $2 RETURNING *';
      const result = await pool.query(query, [ratingId, customerId]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  // Get customer's rating for a store
  static async getCustomerRating(storeId, customerId) {
    try {
      const query = 'SELECT * FROM store_ratings WHERE store_id = $1 AND customer_id = $2';
      const result = await pool.query(query, [storeId, customerId]);
      return result.rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  // Vote on a review (helpful/not helpful)
  static async voteOnReview(ratingId, customerId, isHelpful) {
    try {
      const query = `
        INSERT INTO review_votes (rating_id, customer_id, is_helpful)
        VALUES ($1, $2, $3)
        ON CONFLICT (rating_id, customer_id) 
        DO UPDATE SET is_helpful = $3, created_at = CURRENT_TIMESTAMP
        RETURNING *
      `;
      
      const result = await pool.query(query, [ratingId, customerId, isHelpful]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  // Report a review
  static async reportReview(ratingId, reporterId, reason) {
    try {
      const query = `
        INSERT INTO review_reports (rating_id, reporter_id, reason)
        VALUES ($1, $2, $3)
        RETURNING *
      `;
      
      const result = await pool.query(query, [ratingId, reporterId, reason]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  // Get all stores with their rating statistics
  static async getAllStoresWithRatings() {
    try {
      const query = `
        SELECT 
          s.*,
          COUNT(sr.id) as total_ratings,
          ROUND(AVG(sr.rating), 1) as average_rating,
          COUNT(CASE WHEN sr.rating = 5 THEN 1 END) as five_star_count,
          COUNT(CASE WHEN sr.rating = 4 THEN 1 END) as four_star_count,
          COUNT(CASE WHEN sr.rating = 3 THEN 1 END) as three_star_count,
          COUNT(CASE WHEN sr.rating = 2 THEN 1 END) as two_star_count,
          COUNT(CASE WHEN sr.rating = 1 THEN 1 END) as one_star_count
        FROM stores s
        LEFT JOIN store_ratings sr ON s.id = sr.store_id
        GROUP BY s.id, s.name, s.location, s.category
        ORDER BY average_rating DESC NULLS LAST, total_ratings DESC
      `;
      
      const result = await pool.query(query);
      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  // Get top rated stores
  static async getTopRatedStores(limit = 10) {
    try {
      const query = `
        SELECT 
          s.*,
          COUNT(sr.id) as total_ratings,
          ROUND(AVG(sr.rating), 1) as average_rating
        FROM stores s
        LEFT JOIN store_ratings sr ON s.id = sr.store_id
        GROUP BY s.id, s.name, s.location, s.category
        HAVING COUNT(sr.id) >= 1
        ORDER BY average_rating DESC, total_ratings DESC
        LIMIT $1
      `;
      
      const result = await pool.query(query, [limit]);
      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  // Get recent reviews across all stores
  static async getRecentReviews(limit = 10) {
    try {
      const query = `
        SELECT 
          sr.*,
          s.name as store_name,
          s.location as store_location,
          c.name as customer_name
        FROM store_ratings sr
        JOIN stores s ON sr.store_id = s.id
        JOIN customers c ON sr.customer_id = c.id
        ORDER BY sr.created_at DESC
        LIMIT $1
      `;
      
      const result = await pool.query(query, [limit]);
      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  // Get all reviews by a customer
  static async getCustomerReviews(customerId, page = 1, limit = 10) {
    try {
      const offset = (page - 1) * limit;
      
      // Get total count
      const countQuery = 'SELECT COUNT(*) as count FROM store_ratings WHERE customer_id = $1';
      const countResult = await pool.query(countQuery, [customerId]);
      const total = parseInt(countResult.rows[0].count);
      
      // Get reviews with store info
      const reviewsQuery = `
        SELECT 
          sr.*,
          s.name as store_name,
          s.location as store_location
        FROM store_ratings sr
        LEFT JOIN stores s ON sr.store_id = s.id
        WHERE sr.customer_id = $1
        ORDER BY sr.created_at DESC
        LIMIT $2 OFFSET $3
      `;
      
      const reviewsResult = await pool.query(reviewsQuery, [customerId, limit, offset]);
      const reviews = reviewsResult.rows.map(review => ({
        ...review,
        rating: parseInt(review.rating),
        helpful_votes: parseInt(review.helpful_votes) || 0,
        unhelpful_votes: parseInt(review.unhelpful_votes) || 0,
        is_verified_purchase: Boolean(review.is_verified_purchase)
      }));
      
      return {
        reviews,
        total,
        page: parseInt(page),
        totalPages: Math.ceil(total / limit)
      };
    } catch (error) {
      throw error;
    }
  }

  // Get rating by ID
  static async getRatingById(ratingId) {
    try {
      const query = 'SELECT * FROM store_ratings WHERE id = $1';
      const result = await pool.query(query, [ratingId]);
      return result.rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  // Add a photo to a review
  static async addReviewPhoto(ratingId, photoUrl, photoAlt = null) {
    try {
      const query = `
        INSERT INTO review_photos (rating_id, photo_url, photo_alt)
        VALUES ($1, $2, $3)
        RETURNING *
      `;
      
      const result = await pool.query(query, [ratingId, photoUrl, photoAlt]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  // Delete a review photo
  static async deleteReviewPhoto(photoId, customerId) {
    try {
      const query = `
        DELETE FROM review_photos 
        WHERE id = $1 AND rating_id IN (
          SELECT id FROM store_ratings WHERE customer_id = $2
        )
        RETURNING *
      `;
      
      const result = await pool.query(query, [photoId, customerId]);
      return result.rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  // Get photos for a review
  static async getReviewPhotos(ratingId) {
    try {
      const query = `
        SELECT * FROM review_photos 
        WHERE rating_id = $1 
        ORDER BY created_at ASC
      `;
      
      const result = await pool.query(query, [ratingId]);
      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  // Get reviews with photos
  static async getStoreRatingsWithPhotos(storeId, page = 1, limit = 10, sortBy = 'created_at', sortOrder = 'DESC') {
    try {
      const offset = (page - 1) * limit;
      const validSortFields = ['created_at', 'rating', 'helpful_votes'];
      const validSortOrders = ['ASC', 'DESC'];
      
      const sortField = validSortFields.includes(sortBy) ? sortBy : 'created_at';
      const order = validSortOrders.includes(sortOrder.toUpperCase()) ? sortOrder.toUpperCase() : 'DESC';

      const query = `
        SELECT 
          sr.*,
          c.name as customer_name,
          c.email as customer_email,
          COUNT(rv.id) as helpful_votes_count,
          COUNT(rv2.id) as total_votes_count,
          ARRAY_AGG(
            CASE WHEN rp.id IS NOT NULL THEN 
              json_build_object(
                'id', rp.id,
                'photo_url', rp.photo_url,
                'photo_alt', rp.photo_alt,
                'created_at', rp.created_at
              )
            END
          ) FILTER (WHERE rp.id IS NOT NULL) as photos
        FROM store_ratings sr
        LEFT JOIN customers c ON sr.customer_id = c.id
        LEFT JOIN review_votes rv ON sr.id = rv.rating_id AND rv.is_helpful = true
        LEFT JOIN review_votes rv2 ON sr.id = rv2.rating_id
        LEFT JOIN review_photos rp ON sr.id = rp.rating_id
        WHERE sr.store_id = $1
        GROUP BY sr.id, c.name, c.email
        ORDER BY ${sortField} ${order}
        LIMIT $2 OFFSET $3
      `;
      
      const result = await pool.query(query, [storeId, limit, offset]);
      return result.rows;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = RatingModel; 