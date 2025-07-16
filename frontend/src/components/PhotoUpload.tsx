'use client';

import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X, Image, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PhotoUploadProps {
  onPhotosChange: (photos: File[]) => void;
  maxPhotos?: number;
  maxSize?: number; // in MB
  className?: string;
}

export default function PhotoUpload({
  onPhotosChange,
  maxPhotos = 5,
  maxSize = 5,
  className = ''
}: PhotoUploadProps) {
  const [photos, setPhotos] = useState<File[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    // Check file type
    if (!file.type.startsWith('image/')) {
      return 'Only image files are allowed';
    }

    // Check file size
    if (file.size > maxSize * 1024 * 1024) {
      return `File size must be less than ${maxSize}MB`;
    }

    return null;
  };

  const addPhotos = useCallback((newPhotos: File[]) => {
    const validPhotos: File[] = [];
    const newErrors: string[] = [];

    newPhotos.forEach((file) => {
      const error = validateFile(file);
      if (error) {
        newErrors.push(`${file.name}: ${error}`);
      } else {
        validPhotos.push(file);
      }
    });

    if (newErrors.length > 0) {
      setErrors(newErrors);
      setTimeout(() => setErrors([]), 5000); // Clear errors after 5 seconds
    }

    if (validPhotos.length > 0) {
      const updatedPhotos = [...photos, ...validPhotos].slice(0, maxPhotos);
      setPhotos(updatedPhotos);
      onPhotosChange(updatedPhotos);
    }
  }, [photos, maxPhotos, onPhotosChange, maxSize]);

  const removePhoto = (index: number) => {
    const updatedPhotos = photos.filter((_, i) => i !== index);
    setPhotos(updatedPhotos);
    onPhotosChange(updatedPhotos);
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const files = Array.from(e.dataTransfer.files);
      addPhotos(files);
    }
  }, [addPhotos]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const files = Array.from(e.target.files);
      addPhotos(files);
    }
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={className}>
      {/* Error Messages */}
      <AnimatePresence>
        {errors.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg"
          >
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h4 className="text-sm font-medium text-red-800 mb-1">Upload Errors</h4>
                <ul className="text-sm text-red-700 space-y-1">
                  {errors.map((error, index) => (
                    <li key={index}>• {error}</li>
                  ))}
                </ul>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Upload Area */}
      <div
        className={`relative border-2 border-dashed rounded-lg p-6 transition-all duration-200 ${
          dragActive
            ? 'border-indigo-400 bg-indigo-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />

        <div className="text-center">
          <Upload className={`w-12 h-12 mx-auto mb-4 transition-colors duration-200 ${
            dragActive ? 'text-indigo-500' : 'text-gray-400'
          }`} />
          
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Upload Photos
          </h3>
          
          <p className="text-sm text-gray-600 mb-4">
            Drag and drop images here, or{' '}
            <button
              type="button"
              onClick={openFileDialog}
              className="text-indigo-600 hover:text-indigo-800 font-medium"
            >
              browse files
            </button>
          </p>

          <div className="text-xs text-gray-500 space-y-1">
            <p>• Maximum {maxPhotos} photos per review</p>
            <p>• Maximum {maxSize}MB per photo</p>
            <p>• Supported formats: JPG, PNG, GIF, WebP</p>
          </div>
        </div>
      </div>

      {/* Photo Preview */}
      {photos.length > 0 && (
        <div className="mt-6">
          <h4 className="text-sm font-medium text-gray-900 mb-3">
            Selected Photos ({photos.length}/{maxPhotos})
          </h4>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {photos.map((photo, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="relative group aspect-square bg-gray-100 rounded-lg overflow-hidden"
              >
                <img
                  src={URL.createObjectURL(photo)}
                  alt={`Preview ${index + 1}`}
                  className="w-full h-full object-cover"
                />
                
                {/* Remove Button */}
                <button
                  type="button"
                  onClick={() => removePhoto(index)}
                  className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-red-600"
                >
                  <X className="w-4 h-4" />
                </button>

                {/* File Info */}
                <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-2 text-xs">
                  <p className="truncate">{photo.name}</p>
                  <p>{(photo.size / 1024 / 1024).toFixed(1)}MB</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Upload Progress */}
          <div className="mt-4 flex items-center gap-2 text-sm text-green-600">
            <CheckCircle className="w-4 h-4" />
            <span>Photos ready to upload</span>
          </div>
        </div>
      )}
    </div>
  );
} 