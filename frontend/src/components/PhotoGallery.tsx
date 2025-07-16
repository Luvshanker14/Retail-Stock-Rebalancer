'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, ZoomIn, Download } from 'lucide-react';

interface Photo {
  id: number;
  photo_url: string;
  photo_alt?: string;
  created_at: string;
}

interface PhotoGalleryProps {
  photos: Photo[];
  className?: string;
  maxDisplay?: number; // Max photos to show before "show more"
}

export default function PhotoGallery({
  photos,
  className = '',
  maxDisplay = 4
}: PhotoGalleryProps) {
  const [showAll, setShowAll] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

  if (!photos || photos.length === 0) {
    return null;
  }

  const displayPhotos = showAll ? photos : photos.slice(0, maxDisplay);
  const hasMorePhotos = photos.length > maxDisplay;

  const openLightbox = (index: number) => {
    setCurrentPhotoIndex(index);
    setLightboxOpen(true);
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
  };

  const nextPhoto = () => {
    setCurrentPhotoIndex((prev) => (prev + 1) % photos.length);
  };

  const prevPhoto = () => {
    setCurrentPhotoIndex((prev) => (prev - 1 + photos.length) % photos.length);
  };

  const downloadPhoto = (photo: Photo) => {
    const link = document.createElement('a');
    link.href = getPhotoUrl(photo.photo_url);
    link.download = `review-photo-${photo.id}.jpg`;
    link.click();
  };

  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000';

  const getPhotoUrl = (photoUrl: string) => {
    if (!photoUrl) return '';
    if (photoUrl.startsWith('http')) return photoUrl;
    return `${BACKEND_URL}${photoUrl}`;
  };

  return (
    <div className={className}>
      {/* Photo Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
        {displayPhotos.map((photo, index) => (
          <motion.div
            key={photo.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
            className="relative group aspect-square bg-gray-100 rounded-lg overflow-hidden cursor-pointer"
            onClick={() => openLightbox(showAll ? index : index)}
          >
            <img
              src={getPhotoUrl(photo.photo_url)}
              alt={photo.photo_alt || `Review photo ${index + 1}`}
              className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
            />
            
            {/* Overlay */}
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center">
              <ZoomIn className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
            </div>

            {/* Photo Count Badge */}
            {index === maxDisplay - 1 && hasMorePhotos && !showAll && (
              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                <span className="text-white font-semibold text-lg">
                  +{photos.length - maxDisplay}
                </span>
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Show More Button */}
      {hasMorePhotos && !showAll && (
        <button
          onClick={() => setShowAll(true)}
          className="mt-3 text-sm text-indigo-600 hover:text-indigo-800 font-medium"
        >
          Show all {photos.length} photos
        </button>
      )}

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center"
            onClick={closeLightbox}
          >
            {/* Close Button */}
            <button
              onClick={closeLightbox}
              className="absolute top-4 right-4 w-10 h-10 bg-black bg-opacity-50 text-white rounded-full flex items-center justify-center hover:bg-opacity-70 transition-all duration-200 z-10"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Navigation Buttons */}
            {photos.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    prevPhoto();
                  }}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 w-12 h-12 bg-black bg-opacity-50 text-white rounded-full flex items-center justify-center hover:bg-opacity-70 transition-all duration-200 z-10"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    nextPhoto();
                  }}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 w-12 h-12 bg-black bg-opacity-50 text-white rounded-full flex items-center justify-center hover:bg-opacity-70 transition-all duration-200 z-10"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}

            {/* Download Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                downloadPhoto(photos[currentPhotoIndex]);
              }}
              className="absolute top-4 left-4 w-10 h-10 bg-black bg-opacity-50 text-white rounded-full flex items-center justify-center hover:bg-opacity-70 transition-all duration-200 z-10"
            >
              <Download className="w-5 h-5" />
            </button>

            {/* Photo Counter */}
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 text-white text-sm bg-black bg-opacity-50 px-3 py-1 rounded-full">
              {currentPhotoIndex + 1} of {photos.length}
            </div>

            {/* Main Photo */}
            <motion.div
              key={currentPhotoIndex}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3 }}
              className="relative max-w-4xl max-h-[80vh] mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={getPhotoUrl(photos[currentPhotoIndex].photo_url)}
                alt={photos[currentPhotoIndex].photo_alt || `Review photo ${currentPhotoIndex + 1}`}
                className="w-full h-full object-contain rounded-lg"
              />
            </motion.div>

            {/* Keyboard Navigation */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white text-xs bg-black bg-opacity-50 px-3 py-1 rounded-full">
              Use arrow keys to navigate • ESC to close
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Keyboard Event Listeners */}
      {lightboxOpen && (
        <div
          tabIndex={-1}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              closeLightbox();
            } else if (e.key === 'ArrowRight') {
              nextPhoto();
            } else if (e.key === 'ArrowLeft') {
              prevPhoto();
            }
          }}
          className="sr-only"
        />
      )}
    </div>
  );
} 