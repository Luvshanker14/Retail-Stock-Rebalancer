import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000/api',
  withCredentials: false,
});

api.interceptors.request.use((config) => {
  // Check for admin token first, then customer token
  const adminToken = localStorage.getItem('adminToken');
  const customerToken = localStorage.getItem('customerToken');
  
  if (adminToken) {
    config.headers.Authorization = `Bearer ${adminToken}`;
  } else if (customerToken) {
    config.headers.Authorization = `Bearer ${customerToken}`;
  }
  
  return config;
});

// Types for ratings and reviews
export interface RatingStats {
  store_id: number;
  total_ratings: number;
  average_rating: number;
  five_star_count: number;
  four_star_count: number;
  three_star_count: number;
  two_star_count: number;
  one_star_count: number;
  verified_purchases: number;
}

export interface Photo {
  id: number;
  rating_id: number;
  photo_url: string;
  photo_alt?: string;
  created_at: string;
}

export interface Review {
  id: number;
  store_id: number;
  customer_id: number;
  rating: number;
  review_text: string;
  is_verified_purchase: boolean;
  helpful_votes: number;
  unhelpful_votes: number;
  created_at: string;
  updated_at: string;
  customer_name?: string;
  customer_email?: string;
  photos?: Photo[];
}

export interface CreateReviewData {
  store_id: number;
  rating: number;
  review_text: string;
  is_verified_purchase: boolean;
}

export interface UpdateReviewData {
  rating: number;
  review_text: string;
  is_verified_purchase: boolean;
}

// Ratings and Reviews API functions
export const ratingsApi = {
  // Get rating statistics for a store
  getStoreRatingStats: async (storeId: number): Promise<RatingStats> => {
    const response = await api.get(`/ratings/stores/${storeId}/stats`);
    return response.data;
  },

  // Get reviews for a store
  getStoreReviews: async (storeId: number, page = 1, limit = 10): Promise<{
    reviews: Review[];
    total: number;
    page: number;
    totalPages: number;
  }> => {
    const response = await api.get(`/ratings/stores/${storeId}/reviews`, {
      params: { page, limit }
    });
    return response.data;
  },

  // Submit a new review
  submitReview: async (data: CreateReviewData): Promise<Review> => {
    const response = await api.post(`/ratings/stores/${data.store_id}/ratings`, {
      rating: data.rating,
      reviewText: data.review_text,
      isVerifiedPurchase: data.is_verified_purchase
    });
    return response.data.rating;
  },

  // Update an existing review
  updateReview: async (reviewId: number, data: UpdateReviewData): Promise<Review> => {
    const response = await api.put(`/ratings/ratings/${reviewId}`, {
      rating: data.rating,
      reviewText: data.review_text,
      isVerifiedPurchase: data.is_verified_purchase
    });
    return response.data.rating;
  },

  // Delete a review
  deleteReview: async (reviewId: number): Promise<void> => {
    await api.delete(`/ratings/ratings/${reviewId}`);
  },

  // Vote on a review (helpful/unhelpful)
  voteOnReview: async (reviewId: number, voteType: 'helpful' | 'unhelpful'): Promise<{
    helpful_votes: number;
    unhelpful_votes: number;
  }> => {
    const response = await api.post(`/ratings/ratings/${reviewId}/vote`, {
      isHelpful: voteType === 'helpful'
    });
    return {
      helpful_votes: 0, // TODO: Get actual vote counts from response
      unhelpful_votes: 0
    };
  },

  // Report a review
  reportReview: async (reviewId: number, reason: string): Promise<void> => {
    await api.post(`/ratings/ratings/${reviewId}/report`, { reason });
  },

  // Get customer's own review for a store
  getCustomerReview: async (storeId: number): Promise<Review | null> => {
    try {
      const response = await api.get(`/ratings/stores/${storeId}/my-rating`);
      return response.data.rating;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null; // No review found
      }
      throw error;
    }
  },

  // Get all reviews by current customer
  getCustomerReviews: async (page = 1, limit = 10): Promise<{
    reviews: Review[];
    total: number;
    page: number;
    totalPages: number;
  }> => {
    const response = await api.get('/ratings/customer/reviews', {
      params: { page, limit }
    });
    return response.data;
  },

  // Upload photos for a review
  uploadReviewPhotos: async (reviewId: number, photos: File[]): Promise<{
    photos: string[];
  }> => {
    const formData = new FormData();
    photos.forEach((photo) => {
      formData.append('photos', photo);
    });

    const response = await api.post(`/ratings/ratings/${reviewId}/photos`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Delete a review photo
  deleteReviewPhoto: async (photoId: number): Promise<void> => {
    await api.delete(`/ratings/photos/${photoId}`);
  },

  // Get photos for a review
  getReviewPhotos: async (reviewId: number): Promise<Photo[]> => {
    const response = await api.get(`/ratings/ratings/${reviewId}/photos`);
    return response.data;
  }
};

export default api;
