'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Star, MessageSquare, AlertCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import StoreRatingStats from './StoreRatingStats';
import ReviewsList from './ReviewsList';
import RatingModal from './RatingModal';
import { ratingsApi, RatingStats, Review, CreateReviewData, UpdateReviewData } from '@/lib/api';
import PhotoGallery from './PhotoGallery';

interface StoreRatingsSectionProps {
  storeId: number;
  storeName: string;
  currentUserId?: number;
  className?: string;
  isDark: boolean;
}

export default function StoreRatingsSection({
  storeId,
  storeName,
  currentUserId,
  className = '',
  isDark
}: StoreRatingsSectionProps) {
  const [ratingStats, setRatingStats] = useState<RatingStats | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [customerReview, setCustomerReview] = useState<Review | null>(null);
  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Load initial data
  useEffect(() => {
    loadData();
  }, [storeId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [statsResponse, reviewsResponse, customerReviewResponse] = await Promise.all([
        ratingsApi.getStoreRatingStats(storeId).catch(() => null),
        ratingsApi.getStoreReviews(storeId, 1, 50).catch(() => ({ reviews: [], total: 0, page: 1, totalPages: 0 })),
        currentUserId ? ratingsApi.getCustomerReview(storeId).catch(() => null) : Promise.resolve(null)
      ]);

      setRatingStats(statsResponse);
      setReviews(reviewsResponse.reviews);
      setCustomerReview(customerReviewResponse);
    } catch (error: any) {
      console.error('Error loading ratings data:', error);
      toast.error('Failed to load ratings and reviews');
    } finally {
      setLoading(false);
    }
  };

  const handleRateClick = () => {
    setIsEditing(false);
    setIsRatingModalOpen(true);
  };

  const handleEditReview = (review: Review) => {
    setCustomerReview(review);
    setIsEditing(true);
    setIsRatingModalOpen(true);
  };

  const handleSubmitReview = async (rating: number, reviewText: string, isVerifiedPurchase: boolean, photos: File[]) => {
    setSubmitting(true);
    try {
      if (isEditing && customerReview) {
        // Update existing review
        const updatedReview = await ratingsApi.updateReview(customerReview.id, {
          rating,
          review_text: reviewText,
          is_verified_purchase: isVerifiedPurchase
        });
        
        // Update local state
        setCustomerReview(updatedReview);
        setReviews(prev => prev.map(r => r.id === updatedReview.id ? updatedReview : r));
        
        toast.success('Review updated successfully!');
      } else {
        // Submit new review
        const newReview = await ratingsApi.submitReview({
          store_id: storeId,
          rating,
          review_text: reviewText,
          is_verified_purchase: isVerifiedPurchase
        });
        
        // Upload photos if any
        if (photos.length > 0) {
          try {
            await ratingsApi.uploadReviewPhotos(newReview.id, photos);
            toast.success('Photos uploaded successfully!');
          } catch (photoError: any) {
            console.error('Error uploading photos:', photoError);
            toast.error('Review submitted but photos failed to upload');
          }
        }
        
        // Refresh the review data to include photos
        try {
          const [updatedCustomerReview, updatedReviews] = await Promise.all([
            ratingsApi.getCustomerReview(storeId),
            ratingsApi.getStoreReviews(storeId, 1, 50)
          ]);
          
          setCustomerReview(updatedCustomerReview);
          setReviews(updatedReviews.reviews);
        } catch (refreshError) {
          console.error('Error refreshing review data:', refreshError);
          // Fallback to original data
          setCustomerReview(newReview);
          setReviews(prev => [newReview, ...prev]);
        }
        
        toast.success('Review submitted successfully!');
      }
      
      // Refresh stats with a small delay to ensure backend has processed changes
      setTimeout(async () => {
        try {
          const newStats = await ratingsApi.getStoreRatingStats(storeId);
          setRatingStats(newStats);
        } catch (error) {
          console.error('Error refreshing stats:', error);
        }
      }, 500);
      
      setIsRatingModalOpen(false);
    } catch (error: any) {
      console.error('Error submitting review:', error);
      toast.error(error.response?.data?.message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteReview = async (reviewId: number) => {
    if (!confirm('Are you sure you want to delete your review? This action cannot be undone.')) {
      return;
    }

    try {
      await ratingsApi.deleteReview(reviewId);
      
      // Update local state
      setCustomerReview(null);
      setReviews(prev => prev.filter(r => r.id !== reviewId));
      
      // Refresh stats with a small delay to ensure backend has processed changes
      setTimeout(async () => {
        try {
          const newStats = await ratingsApi.getStoreRatingStats(storeId);
          setRatingStats(newStats);
        } catch (error) {
          console.error('Error refreshing stats:', error);
        }
      }, 500);
      
      toast.success('Review deleted successfully!');
    } catch (error: any) {
      console.error('Error deleting review:', error);
      toast.error('Failed to delete review');
    }
  };

  const handleVote = async (reviewId: number, voteType: 'helpful' | 'unhelpful') => {
    try {
      const result = await ratingsApi.voteOnReview(reviewId, voteType);
      
      // Update local state
      setReviews(prev => prev.map(review => 
        review.id === reviewId 
          ? { ...review, helpful_votes: result.helpful_votes, unhelpful_votes: result.unhelpful_votes }
          : review
      ));
      
      toast.success(`Vote recorded!`);
    } catch (error: any) {
      console.error('Error voting on review:', error);
      toast.error('Failed to record vote');
    }
  };

  const handleReportReview = async (reviewId: number) => {
    const reason = prompt('Please provide a reason for reporting this review:');
    if (!reason?.trim()) return;

    try {
      await ratingsApi.reportReview(reviewId, reason.trim());
      toast.success('Review reported successfully');
    } catch (error: any) {
      console.error('Error reporting review:', error);
      toast.error('Failed to report review');
    }
  };

  if (loading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className={`${isDark ? 'bg-gray-900 border-gray-700 text-gray-100' : 'bg-white border-gray-200 text-gray-900'} rounded-xl border p-6 animate-pulse`}>
          <div className={`${isDark ? 'bg-gray-700' : 'bg-gray-200'} h-6 rounded w-48 mb-4`}></div>
          <div className="space-y-3">
            <div className={`${isDark ? 'bg-gray-700' : 'bg-gray-200'} h-4 rounded w-32`}></div>
            <div className={`${isDark ? 'bg-gray-700' : 'bg-gray-200'} h-4 rounded w-24`}></div>
          </div>
        </div>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className={`${isDark ? 'bg-gray-900 border-gray-700 text-gray-100' : 'bg-white border-gray-200 text-gray-900'} border rounded-lg p-6 animate-pulse`}>
              <div className="flex items-start gap-3 mb-4">
                <div className={`${isDark ? 'bg-gray-700' : 'bg-gray-200'} w-10 h-10 rounded-full`}></div>
                <div className="flex-1">
                  <div className={`${isDark ? 'bg-gray-700' : 'bg-gray-200'} h-4 rounded w-32 mb-2`}></div>
                  <div className={`${isDark ? 'bg-gray-700' : 'bg-gray-200'} h-3 rounded w-24`}></div>
                </div>
              </div>
              <div className="space-y-2">
                <div className={`${isDark ? 'bg-gray-700' : 'bg-gray-200'} h-4 rounded`}></div>
                <div className={`${isDark ? 'bg-gray-700' : 'bg-gray-200'} h-4 rounded w-3/4`}></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Rating Statistics */}
      {ratingStats && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <StoreRatingStats
            stats={ratingStats}
            onRateClick={handleRateClick}
            showRateButton={!customerReview}
            isDark={isDark}
          />
        </motion.div>
      )}

      {/* Customer's Review (if exists) */}
      {customerReview && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className={`${isDark ? 'bg-blue-900 border-blue-700 text-blue-100' : 'bg-blue-50 border border-blue-200 text-blue-900'} rounded-lg p-4`}>
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-blue-300">Your Review</h4>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleEditReview(customerReview)}
                  className="text-sm text-blue-400 hover:text-blue-200 font-medium"
                >
                  Edit
                </button>
                <span className="text-blue-300">|</span>
                <button
                  onClick={() => handleDeleteReview(customerReview.id)}
                  className="text-sm text-red-400 hover:text-red-200 font-medium"
                >
                  Delete
                </button>
              </div>
            </div>
            <div className="flex items-center gap-3 mb-2">
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-4 h-4 ${
                      star <= customerReview.rating
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'fill-gray-200 text-gray-300'
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm text-blue-400">
                {customerReview.is_verified_purchase && '(Verified Purchase)'}
              </span>
            </div>
            <p className="text-blue-200 text-sm">{customerReview.review_text}</p>
            
            {/* Customer Review Photos */}
            {customerReview.photos && customerReview.photos.length > 0 && (
              <div className="mt-3">
                <PhotoGallery photos={customerReview.photos} maxDisplay={3} />
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Reviews List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <ReviewsList
          reviews={reviews}
          currentUserId={currentUserId}
          onVote={handleVote}
          onReport={handleReportReview}
          onEdit={handleEditReview}
          onDelete={handleDeleteReview}
          loading={loading}
          className=""
          isDark={isDark}
        />
      </motion.div>

      {/* Rating Modal */}
      <RatingModal
        isOpen={isRatingModalOpen}
        onClose={() => setIsRatingModalOpen(false)}
        onSubmit={handleSubmitReview}
        storeName={storeName}
        existingRating={isEditing && customerReview ? {
          rating: customerReview.rating,
          reviewText: customerReview.review_text,
          isVerifiedPurchase: customerReview.is_verified_purchase
        } : undefined}
        loading={submitting}
      />
    </div>
  );
} 