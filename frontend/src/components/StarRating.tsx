'use client';

import { useState } from 'react';
import { Star } from 'lucide-react';
import { motion } from 'framer-motion';

interface StarRatingProps {
  rating: number;
  onRatingChange?: (rating: number) => void;
  size?: 'sm' | 'md' | 'lg';
  readonly?: boolean;
  showValue?: boolean;
  className?: string;
}

export default function StarRating({
  rating,
  onRatingChange,
  size = 'md',
  readonly = false,
  showValue = false,
  className = ''
}: StarRatingProps) {
  const [hoverRating, setHoverRating] = useState(0);
  const [isHovering, setIsHovering] = useState(false);

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  const handleStarClick = (starRating: number) => {
    if (!readonly && onRatingChange) {
      onRatingChange(starRating);
    }
  };

  const handleStarHover = (starRating: number) => {
    if (!readonly) {
      setHoverRating(starRating);
      setIsHovering(true);
    }
  };

  const handleStarLeave = () => {
    if (!readonly) {
      setHoverRating(0);
      setIsHovering(false);
    }
  };

  const displayRating = isHovering ? hoverRating : rating;

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => {
          const isFilled = star <= displayRating;
          const isHalfFilled = !isFilled && star - 0.5 <= displayRating;

          return (
            <motion.button
              key={star}
              type="button"
              onClick={() => handleStarClick(star)}
              onMouseEnter={() => handleStarHover(star)}
              onMouseLeave={handleStarLeave}
              disabled={readonly}
              className={`transition-all duration-200 ${
                readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110'
              }`}
              whileHover={!readonly ? { scale: 1.1 } : {}}
              whileTap={!readonly ? { scale: 0.95 } : {}}
            >
              <Star
                className={`${sizeClasses[size]} transition-colors duration-200 ${
                  isFilled
                    ? 'fill-yellow-400 text-yellow-400'
                    : isHalfFilled
                    ? 'fill-yellow-400/50 text-yellow-400'
                    : 'fill-gray-200 text-gray-300'
                }`}
              />
            </motion.button>
          );
        })}
      </div>
      
      {showValue && (
        <span className="ml-2 text-sm font-medium text-gray-600">
          {displayRating.toFixed(1)}
        </span>
      )}
    </div>
  );
}

// Static display component for showing ratings without interaction
export function StaticStarRating({
  rating,
  size = 'md',
  showValue = false,
  className = ''
}: Omit<StarRatingProps, 'onRatingChange' | 'readonly'>) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => {
          const isFilled = star <= rating;
          const isHalfFilled = !isFilled && star - 0.5 <= rating;

          return (
            <Star
              key={star}
              className={`${sizeClasses[size]} ${
                isFilled
                  ? 'fill-yellow-400 text-yellow-400'
                  : isHalfFilled
                  ? 'fill-yellow-400/50 text-yellow-400'
                  : 'fill-gray-200 text-gray-300'
              }`}
            />
          );
        })}
      </div>
      
      {showValue && (
        <span className="ml-2 text-sm font-medium text-gray-600">
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  );
} 