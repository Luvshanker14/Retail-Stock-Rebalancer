'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Star, 
  CheckCircle, 
  ThumbsUp, 
  ThumbsDown, 
  Flag, 
  MoreHorizontal,
  Calendar,
  User
} from 'lucide-react';
import { StaticStarRating } from './StarRating';
import PhotoGallery from './PhotoGallery';

interface Review {
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
  photos?: Array<{
    id: number;
    photo_url: string;
    photo_alt?: string;
    created_at: string;
  }>;
}

interface ReviewCardProps {
  review: Review;
  onVote?: (reviewId: number, voteType: 'helpful' | 'unhelpful') => void;
  onReport?: (reviewId: number) => void;
  isOwnReview?: boolean;
  onEdit?: (review: Review) => void;
  onDelete?: (reviewId: number) => void;
  className?: string;
  isDark: boolean;
}

export default function ReviewCard({
  review,
  onVote,
  onReport,
  isOwnReview = false,
  onEdit,
  onDelete,
  className = '',
  isDark
}: ReviewCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [hasVoted, setHasVoted] = useState<'helpful' | 'unhelpful' | null>(null);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();

    // Check if it's the same calendar day
    if (
      date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear()
    ) {
      return 'Today';
    }

    // Check if it was yesterday
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    if (
      date.getDate() === yesterday.getDate() &&
      date.getMonth() === yesterday.getMonth() &&
      date.getFullYear() === yesterday.getFullYear()
    ) {
      return 'Yesterday';
    }

    // Otherwise, fallback to days ago
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return date.toLocaleDateString();
  };

  const handleVote = (voteType: 'helpful' | 'unhelpful') => {
    if (hasVoted === voteType) return; // Already voted
    
    setHasVoted(voteType);
    onVote?.(review.id, voteType);
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 4) return 'text-green-600';
    if (rating >= 3) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getRatingText = (rating: number) => {
    if (rating === 5) return 'Excellent';
    if (rating === 4) return 'Very Good';
    if (rating === 3) return 'Good';
    if (rating === 2) return 'Fair';
    return 'Poor';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`${isDark ? 'bg-gray-900 border-gray-700 text-gray-100' : 'bg-white border-gray-200 text-gray-900'} rounded-lg border p-6 ${className}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start gap-3">
          <div className={`${isDark ? 'bg-indigo-900' : 'bg-indigo-100'} w-10 h-10 rounded-full flex items-center justify-center`}>
            <User className={`w-5 h-5 ${isDark ? 'text-indigo-300' : 'text-indigo-600'}`} />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className={`font-medium ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>{review.customer_name || 'Anonymous Customer'}</span>
              {review.is_verified_purchase && (
                <div className="flex items-center gap-1 text-green-600 text-xs">
                  <CheckCircle className="w-3 h-3" />
                  <span>Verified Purchase</span>
                </div>
              )}
            </div>
            <div className={`flex items-center gap-4 text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}> 
              <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                <span>{formatDate(review.created_at)}</span>
              </div>
              {review.updated_at !== review.created_at && (
                <span className="text-xs">(edited)</span>
              )}
            </div>
          </div>
        </div>
        {/* Rating */}
        <div className="text-right">
          <div className={`text-lg font-bold ${getRatingColor(review.rating)}`}>{review.rating}.0</div>
          <StaticStarRating rating={review.rating} size="sm" />
          <div className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{getRatingText(review.rating)}</div>
        </div>
      </div>

      {/* Review Text */}
      <div className="mb-4">
        <p className={`leading-relaxed whitespace-pre-wrap ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>{review.review_text}</p>
      </div>

      {/* Review Photos */}
      {review.photos && review.photos.length > 0 && (
        <div className="mb-4">
          <PhotoGallery photos={review.photos} maxDisplay={3} />
        </div>
      )}

      {/* Actions */}
      <div className={`flex items-center justify-between pt-4 border-t ${isDark ? 'border-gray-700' : 'border-gray-100'}`}> 
        <div className="flex items-center gap-4">
          {/* Vote Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleVote('helpful')}
              disabled={hasVoted !== null}
              className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm transition-colors ${
                hasVoted === 'helpful'
                  ? 'bg-green-100 text-green-700'
                  : isDark
                    ? 'hover:bg-gray-800 text-gray-300'
                    : 'hover:bg-gray-100 text-gray-600'
              }`}
            >
              <ThumbsUp className={`w-4 h-4 ${hasVoted === 'helpful' ? 'fill-current' : ''}`} />
              <span>Helpful</span>
              {review.helpful_votes > 0 && (
                <span className="ml-1">({review.helpful_votes})</span>
              )}
            </button>

            <button
              onClick={() => handleVote('unhelpful')}
              disabled={hasVoted !== null}
              className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm transition-colors ${
                hasVoted === 'unhelpful'
                  ? 'bg-red-100 text-red-700'
                  : isDark
                    ? 'hover:bg-gray-800 text-gray-300'
                    : 'hover:bg-gray-100 text-gray-600'
              }`}
            >
              <ThumbsDown className={`w-4 h-4 ${hasVoted === 'unhelpful' ? 'fill-current' : ''}`} />
              <span>Not Helpful</span>
              {review.unhelpful_votes > 0 && (
                <span className="ml-1">({review.unhelpful_votes})</span>
              )}
            </button>
          </div>
        </div>

        {/* Menu */}
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <MoreHorizontal className="w-4 h-4 text-gray-500" />
          </button>

          {showMenu && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10"
            >
              {!isOwnReview && (
                <button
                  onClick={() => {
                    onReport?.(review.id);
                    setShowMenu(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                >
                  <Flag className="w-4 h-4" />
                  Report Review
                </button>
              )}
              
              {isOwnReview && onEdit && (
                <button
                  onClick={() => {
                    onEdit(review);
                    setShowMenu(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                >
                  Edit Review
                </button>
              )}
              
              {isOwnReview && onDelete && (
                <button
                  onClick={() => {
                    onDelete(review.id);
                    setShowMenu(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                >
                  Delete Review
                </button>
              )}
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
} 