'use client';

import { useState, useEffect } from 'react';
import { Heart, HeartOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import api from '@/lib/api';
import toast from 'react-hot-toast';

interface WishlistButtonProps {
  stockId: number;
  storeId: number;
  className?: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export default function WishlistButton({ 
  stockId, 
  storeId, 
  className = '',
  variant = 'outline',
  size = 'sm'
}: WishlistButtonProps) {
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    checkWishlistStatus();
  }, [stockId]);

  const checkWishlistStatus = async () => {
    try {
      const token = localStorage.getItem('customerToken');
      if (!token) {
        setChecking(false);
        return;
      }

      const response = await api.get(`/wishlist/check/${stockId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setIsInWishlist(response.data.isInWishlist);
    } catch (error: any) {
      console.error('Error checking wishlist status:', error);
      // If it's a 404, the table might not exist yet, treat as not in wishlist
      if (error.response?.status === 404) {
        setIsInWishlist(false);
      }
    } finally {
      setChecking(false);
    }
  };

  const toggleWishlist = async () => {
    const token = localStorage.getItem('customerToken');
    if (!token) {
      toast.error('Please login to use wishlist');
      return;
    }

    setLoading(true);
    try {
      if (isInWishlist) {
        await api.delete(`/wishlist/remove/${stockId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setIsInWishlist(false);
        toast.success('Removed from wishlist');
      } else {
        await api.post('/wishlist/add', 
          { stockId, storeId },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setIsInWishlist(true);
        toast.success('Added to wishlist');
      }
    } catch (error: any) {
      const message = error.response?.data?.error || 'Failed to update wishlist';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <Button
        variant={variant}
        size={size}
        disabled
        className={`animate-pulse ${className}`}
      >
        <Heart className="w-4 h-4" />
      </Button>
    );
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={toggleWishlist}
      disabled={loading}
      className={`transition-all duration-200 hover:scale-105 ${
        isInWishlist 
          ? 'bg-red-500 hover:bg-red-600 text-white border-red-500' 
          : ''
      } ${className}`}
    >
      {loading ? (
        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : isInWishlist ? (
        <Heart className="w-4 h-4 fill-current" />
      ) : (
        <HeartOff className="w-4 h-4" />
      )}
    </Button>
  );
} 