'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Star, 
  Filter, 
  SortAsc, 
  SortDesc,
  ChevronLeft,
  ChevronRight,
  MessageSquare
} from 'lucide-react';
import ReviewCard from './ReviewCard';
import { Button } from '@/components/ui/button';

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
}

interface ReviewsListProps {
  reviews: Review[];
  currentUserId?: number;
  onVote?: (reviewId: number, voteType: 'helpful' | 'unhelpful') => void;
  onReport?: (reviewId: number) => void;
  onEdit?: (review: Review) => void;
  onDelete?: (reviewId: number) => void;
  loading?: boolean;
  className?: string;
  isDark: boolean;
}

type SortOption = 'newest' | 'oldest' | 'highest' | 'lowest' | 'most_helpful';
type FilterOption = 'all' | 'verified' | '5_star' | '4_star' | '3_star' | '2_star' | '1_star';

export default function ReviewsList({
  reviews,
  currentUserId,
  onVote,
  onReport,
  onEdit,
  onDelete,
  loading = false,
  className = '',
  isDark
}: ReviewsListProps) {
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [filterBy, setFilterBy] = useState<FilterOption>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const reviewsPerPage = 5;

  // Filter reviews
  const filteredReviews = reviews.filter(review => {
    if (filterBy === 'all') return true;
    if (filterBy === 'verified') return review.is_verified_purchase;
    if (filterBy === '5_star') return review.rating === 5;
    if (filterBy === '4_star') return review.rating === 4;
    if (filterBy === '3_star') return review.rating === 3;
    if (filterBy === '2_star') return review.rating === 2;
    if (filterBy === '1_star') return review.rating === 1;
    return true;
  });

  // Sort reviews
  const sortedReviews = [...filteredReviews].sort((a, b) => {
    switch (sortBy) {
      case 'newest':
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      case 'oldest':
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      case 'highest':
        return b.rating - a.rating;
      case 'lowest':
        return a.rating - b.rating;
      case 'most_helpful':
        return b.helpful_votes - a.helpful_votes;
      default:
        return 0;
    }
  });

  // Pagination
  const totalPages = Math.ceil(sortedReviews.length / reviewsPerPage);
  const startIndex = (currentPage - 1) * reviewsPerPage;
  const endIndex = startIndex + reviewsPerPage;
  const currentReviews = sortedReviews.slice(startIndex, endIndex);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [sortBy, filterBy]);

  const getFilterLabel = (filter: FilterOption) => {
    switch (filter) {
      case 'all': return 'All Reviews';
      case 'verified': return 'Verified Purchases';
      case '5_star': return '5 Stars';
      case '4_star': return '4 Stars';
      case '3_star': return '3 Stars';
      case '2_star': return '2 Stars';
      case '1_star': return '1 Star';
      default: return 'All Reviews';
    }
  };

  const getSortLabel = (sort: SortOption) => {
    switch (sort) {
      case 'newest': return 'Newest First';
      case 'oldest': return 'Oldest First';
      case 'highest': return 'Highest Rated';
      case 'lowest': return 'Lowest Rated';
      case 'most_helpful': return 'Most Helpful';
      default: return 'Newest First';
    }
  };

  if (loading) {
    return (
      <div className={`space-y-4 ${className}`}>
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
    );
  }

  return (
    <div className={className}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <MessageSquare className={`w-5 h-5 ${isDark ? 'text-gray-300' : 'text-gray-600'}`} />
          <h3 className={`text-lg font-semibold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>Customer Reviews ({reviews.length})</h3>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2"
        >
          <Filter className="w-4 h-4" />
          Filters
        </Button>
      </div>

      {/* Filters */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className={`${isDark ? 'bg-gray-800 border-gray-700 text-gray-100' : 'bg-gray-50 border-gray-200 text-gray-900'} rounded-lg p-4 mb-6`}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Filter by rating */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Filter by Rating
                </label>
                <select
                  value={filterBy}
                  onChange={(e) => setFilterBy(e.target.value as FilterOption)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                >
                  <option value="all">All Reviews</option>
                  <option value="verified">Verified Purchases Only</option>
                  <option value="5_star">5 Stars</option>
                  <option value="4_star">4 Stars</option>
                  <option value="3_star">3 Stars</option>
                  <option value="2_star">2 Stars</option>
                  <option value="1_star">1 Star</option>
                </select>
              </div>

              {/* Sort by */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sort by
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="highest">Highest Rated</option>
                  <option value="lowest">Lowest Rated</option>
                  <option value="most_helpful">Most Helpful</option>
                </select>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Active filters display */}
      {(filterBy !== 'all' || sortBy !== 'newest') && (
        <div className="flex items-center gap-2 mb-4 text-sm text-gray-600">
          <span>Showing:</span>
          {filterBy !== 'all' && (
            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
              {getFilterLabel(filterBy)}
            </span>
          )}
          {sortBy !== 'newest' && (
            <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full">
              {getSortLabel(sortBy)}
            </span>
          )}
        </div>
      )}

      {/* Reviews */}
      <div className="space-y-4">
        {currentReviews.length === 0 ? (
          <div className={`text-center py-8 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>No reviews found.</div>
        ) : (
          currentReviews.map((review) => (
            <ReviewCard
              key={review.id}
              review={review}
              onVote={onVote}
              onReport={onReport}
              isOwnReview={review.customer_id === currentUserId}
              onEdit={onEdit}
              onDelete={onDelete}
              isDark={isDark}
            />
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-6 border-t border-gray-200">
          <div className="text-sm text-gray-600">
            Showing {startIndex + 1}-{Math.min(endIndex, sortedReviews.length)} of {sortedReviews.length} reviews
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </Button>
            
            <div className="flex items-center gap-1">
              {[...Array(totalPages)].map((_, i) => {
                const page = i + 1;
                const isCurrent = page === currentPage;
                const isNearCurrent = Math.abs(page - currentPage) <= 1;
                const isFirst = page === 1;
                const isLast = page === totalPages;
                
                if (isCurrent || isNearCurrent || isFirst || isLast) {
                  return (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                        isCurrent
                          ? 'bg-indigo-600 text-white'
                          : 'hover:bg-gray-100 text-gray-700'
                      }`}
                    >
                      {page}
                    </button>
                  );
                } else if (page === currentPage - 2 || page === currentPage + 2) {
                  return (
                    <span key={page} className="w-8 h-8 flex items-center justify-center text-gray-400">
                      ...
                    </span>
                  );
                }
                return null;
              })}
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
} 