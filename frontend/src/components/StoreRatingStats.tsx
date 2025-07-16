'use client';

import { motion } from 'framer-motion';
import { Star, Users, CheckCircle } from 'lucide-react';
import { StaticStarRating } from './StarRating';

interface RatingStats {
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

interface StoreRatingStatsProps {
  stats: RatingStats | null;
  onRateClick?: () => void;
  showRateButton?: boolean;
  className?: string;
  isDark: boolean;
}

export default function StoreRatingStats({
  stats,
  onRateClick,
  showRateButton = true,
  className = '',
  isDark
}: StoreRatingStatsProps) {
  // Add null check for stats
  if (!stats) {
    return (
      <div className={`${isDark ? 'bg-gray-900 border-gray-700 text-gray-100' : 'bg-white border-gray-200 text-gray-900'} rounded-xl border p-6 ${className}`}>
        <div className="animate-pulse">
          <div className={`${isDark ? 'bg-gray-700' : 'bg-gray-200'} h-6 rounded w-48 mb-4`}></div>
          <div className="space-y-3">
            <div className={`${isDark ? 'bg-gray-700' : 'bg-gray-200'} h-4 rounded w-32`}></div>
            <div className={`${isDark ? 'bg-gray-700' : 'bg-gray-200'} h-4 rounded w-24`}></div>
          </div>
        </div>
      </div>
    );
  }

  const totalRatings = Number(stats.total_ratings) || 0;
  const averageRating = Number(stats.average_rating) || 0;

  const getRatingPercentage = (count: number) => {
    // console.log(count, totalRatings);
    return totalRatings > 0 ? Math.round((count / totalRatings) * 100) : 0;
  };

  const getRatingBarWidth = (count: number) => {
    return totalRatings > 0 ? (count / totalRatings) * 100 : 0;
  };

  const starKeyMap = {
    5: 'five_star_count',
    4: 'four_star_count',
    3: 'three_star_count',
    2: 'two_star_count',
    1: 'one_star_count',
  };

  return (
    <div className={`${isDark ? 'bg-gray-900 border-gray-700 text-gray-100' : 'bg-white border-gray-200 text-gray-900'} rounded-xl border p-6 ${className}`}>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className={`text-lg font-semibold mb-2 ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>Customer Ratings</h3>
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className={`text-3xl font-bold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>{averageRating.toFixed(1)}</div>
              <StaticStarRating rating={averageRating} size="sm" />
              <div className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{totalRatings} {totalRatings === 1 ? 'review' : 'reviews'}</div>
            </div>
            <div className={`flex items-center gap-2 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              <Users className="w-4 h-4" />
              <span>{totalRatings} total ratings</span>
            </div>
            {(stats.verified_purchases || 0) > 0 && (
              <div className="flex items-center gap-2 text-sm text-green-600">
                <CheckCircle className="w-4 h-4" />
                <span>{stats.verified_purchases || 0} verified</span>
              </div>
            )}
          </div>
        </div>

        {showRateButton && onRateClick && (
          <motion.button
            onClick={onRateClick}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
          >
            Rate Store
          </motion.button>
        )}
      </div>

      {totalRatings > 0 ? (
        <div className="space-y-3">
          {/* Rating Distribution */}
          <div className="space-y-2">
            {[5, 4, 3, 2, 1].map((stars) => {
              const key = starKeyMap[stars as 5 | 4 | 3 | 2 | 1];
              const count = Number((stats as any)[key]) || 0;
              const percentage = totalRatings > 0 ? Math.round((count / totalRatings) * 100) : 0;
              return (
                <div key={stars} className="flex items-center gap-3">
                  <div className="flex items-center gap-1 w-16">
                    <span className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{stars}</span>
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  </div>
                  <div className={`${isDark ? 'bg-gray-700' : 'bg-gray-200'} w-full rounded-full h-2`}>
                    <div
                      style={{ width: `${percentage}%` }}
                      className="bg-yellow-400 h-2 rounded-full transition-all duration-500"
                    />
                  </div>
                  <div className="w-12 text-right">
                    <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{count}</span>
                  </div>
                  <div className="w-12 text-right">
                    <span className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>{percentage}%</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Rating Summary */}
          <div className={`grid grid-cols-2 gap-4 pt-4 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {getRatingPercentage((stats.five_star_count || 0) + (stats.four_star_count || 0))}%
              </div>
              <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Positive Reviews</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {getRatingPercentage(stats.three_star_count || 0)}%
              </div>
              <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Neutral Reviews</div>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-8">
          <Star className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className={`mb-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>No ratings yet</p>
          {showRateButton && onRateClick && (
            <button
              onClick={onRateClick}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Be the first to rate
            </button>
          )}
        </div>
      )}
    </div>
  );
} 