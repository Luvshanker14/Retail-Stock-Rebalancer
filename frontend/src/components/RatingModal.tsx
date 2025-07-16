'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Star, CheckCircle, AlertCircle, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import StarRating from './StarRating';
import PhotoUpload from './PhotoUpload';

interface RatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (rating: number, reviewText: string, isVerifiedPurchase: boolean, photos: File[]) => void;
  storeName: string;
  existingRating?: {
    rating: number;
    reviewText: string;
    isVerifiedPurchase: boolean;
  };
  loading?: boolean;
}

export default function RatingModal({
  isOpen,
  onClose,
  onSubmit,
  storeName,
  existingRating,
  loading = false
}: RatingModalProps) {
  const [rating, setRating] = useState(existingRating?.rating || 0);
  const [reviewText, setReviewText] = useState(existingRating?.reviewText || '');
  const [isVerifiedPurchase, setIsVerifiedPurchase] = useState(existingRating?.isVerifiedPurchase || false);
  const [photos, setPhotos] = useState<File[]>([]);
  const [errors, setErrors] = useState<{ rating?: string; review?: string }>({});

  const handleSubmit = () => {
    const newErrors: { rating?: string; review?: string } = {};

    if (rating === 0) {
      newErrors.rating = 'Please select a rating';
    }

    if (reviewText.trim().length < 10) {
      newErrors.review = 'Review must be at least 10 characters long';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSubmit(rating, reviewText.trim(), isVerifiedPurchase, photos);
  };

  const handleClose = () => {
    if (!loading) {
      setRating(existingRating?.rating || 0);
      setReviewText(existingRating?.reviewText || '');
      setIsVerifiedPurchase(existingRating?.isVerifiedPurchase || false);
      setPhotos([]);
      setErrors({});
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={handleClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-md mx-4 bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden max-h-[90vh] flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {existingRating ? 'Update Your Review' : 'Rate This Store'}
                </h2>
                <p className="text-sm text-gray-600 mt-1">{storeName}</p>
              </div>
              <button
                onClick={handleClose}
                disabled={loading}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6 overflow-y-auto flex-1">
              {/* Rating Section */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Your Rating *
                </label>
                <div className="flex items-center gap-4">
                  <StarRating
                    rating={rating}
                    onRatingChange={setRating}
                    size="lg"
                    showValue
                  />
                  {rating > 0 && (
                    <span className="text-sm text-gray-600">
                      {rating === 1 && 'Poor'}
                      {rating === 2 && 'Fair'}
                      {rating === 3 && 'Good'}
                      {rating === 4 && 'Very Good'}
                      {rating === 5 && 'Excellent'}
                    </span>
                  )}
                </div>
                {errors.rating && (
                  <div className="flex items-center gap-2 mt-2 text-red-600 text-sm">
                    <AlertCircle className="w-4 h-4" />
                    {errors.rating}
                  </div>
                )}
              </div>

              {/* Review Section */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Write a Review *
                </label>
                <textarea
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  placeholder="Share your experience with this store... (minimum 10 characters)"
                  className="w-full h-32 px-4 py-3 border border-gray-300 rounded-lg resize-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all"
                  disabled={loading}
                />
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-gray-500">
                    {reviewText.length}/500 characters
                  </span>
                  {reviewText.length >= 10 && (
                    <div className="flex items-center gap-1 text-green-600 text-sm">
                      <CheckCircle className="w-4 h-4" />
                      Good length
                    </div>
                  )}
                </div>
                {errors.review && (
                  <div className="flex items-center gap-2 mt-2 text-red-600 text-sm">
                    <AlertCircle className="w-4 h-4" />
                    {errors.review}
                  </div>
                )}
              </div>

              {/* Verified Purchase */}
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="verified-purchase"
                  checked={isVerifiedPurchase}
                  onChange={(e) => setIsVerifiedPurchase(e.target.checked)}
                  disabled={loading}
                  className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                />
                <label htmlFor="verified-purchase" className="text-sm text-gray-700">
                  I made a purchase from this store
                </label>
              </div>

              {/* Photo Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  <div className="flex items-center gap-2">
                    <Camera className="w-4 h-4" />
                    Add Photos (Optional)
                  </div>
                </label>
                <PhotoUpload
                  onPhotosChange={setPhotos}
                  maxPhotos={5}
                  maxSize={5}
                />
              </div>

              {/* Tips */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="text-sm font-medium text-blue-900 mb-2">Review Tips:</h4>
                <ul className="text-xs text-blue-800 space-y-1">
                  <li>• Be specific about your experience</li>
                  <li>• Mention product quality, service, and atmosphere</li>
                  <li>• Add photos to make your review more helpful</li>
                  <li>• Help other customers make informed decisions</li>
                </ul>
              </div>
            </div>

            {/* Footer */}
            <div className="flex gap-3 p-6 border-t border-gray-200 flex-shrink-0">
              <Button
                variant="outline"
                onClick={handleClose}
                disabled={loading}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={loading || rating === 0 || reviewText.trim().length < 10}
                className="flex-1"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Submitting...
                  </div>
                ) : (
                  existingRating ? 'Update Review' : 'Submit Review'
                )}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
} 