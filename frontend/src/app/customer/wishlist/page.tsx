'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Heart, Trash2, Store, MapPin, ShoppingCart, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { useDarkMode } from '@/hooks/useDarkMode';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import LogoutButton from '@/components/LogoutButton';
import PasswordChangeButton from '@/components/PasswordChangeButton';
import useCustomerAuth from '@/hooks/useCustomerAuth';

interface WishlistItem {
  id: number;
  added_at: string;
  stock_id: number;
  stock_name: string;
  stock_price: number;
  stock_quantity: number;
  store_id: number;
  store_name: string;
  store_location: string;
  store_category: string;
}

export default function WishlistPage() {
  const { loading: authLoading } = useCustomerAuth();
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { isDark } = useDarkMode();

  useEffect(() => {
    fetchWishlist();
  }, []);

  const fetchWishlist = async () => {
    try {
      const token = localStorage.getItem('customerToken');
      if (!token) {
        router.push('/customer/login');
        return;
      }

      const response = await api.get('/wishlist', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setWishlist(response.data.wishlist);
    } catch (error) {
      console.error('Error fetching wishlist:', error);
      toast.error('Failed to load wishlist');
    } finally {
      setLoading(false);
    }
  };

  const removeFromWishlist = async (stockId: number) => {
    try {
      const token = localStorage.getItem('customerToken');
      await api.delete(`/wishlist/remove/${stockId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setWishlist(prev => prev.filter(item => item.stock_id !== stockId));
      toast.success('Removed from wishlist');
    } catch (error) {
      console.error('Error removing from wishlist:', error);
      toast.error('Failed to remove item');
    }
  };

  const handleStoreClick = (storeId: number, storeName: string, location: string, category: string) => {
    router.push(`/customer/stores/${storeId}?name=${encodeURIComponent(storeName)}&location=${encodeURIComponent(location)}&category=${encodeURIComponent(category)}`);
  };

  const handleBackToHome = () => {
    router.push('/customer/home');
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-400">Loading...</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={`min-h-screen transition-all duration-300 ${
        isDark 
          ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900' 
          : 'bg-gradient-to-br from-indigo-50 via-white to-teal-50'
      }`}>
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className={`backdrop-blur rounded-2xl shadow-lg border p-6 transition-all duration-300 ${
            isDark 
              ? 'bg-gray-800/80 border-gray-700' 
              : 'bg-white/80 border-indigo-100'
          }`}>
            <div className="flex items-center gap-2 mb-6">
              <Heart className={`w-5 h-5 transition-colors duration-300 ${
                isDark ? 'text-red-400' : 'text-red-600'
              }`} />
              <h1 className={`text-xl font-semibold transition-colors duration-300 ${
                isDark ? 'text-white' : 'text-gray-800'
              }`}>My Wishlist</h1>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className={`h-48 rounded-lg animate-pulse ${
                  isDark ? 'bg-gray-700' : 'bg-gray-200'
                }`} />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-all duration-300 ${
      isDark 
        ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900' 
        : 'bg-gradient-to-br from-indigo-50 via-white to-teal-50'
    }`}>
      {/* Header */}
      <div className={`backdrop-blur border-b transition-all duration-300 ${
        isDark 
          ? 'bg-gray-800/80 border-gray-700' 
          : 'bg-white/80 border-indigo-100'
      }`}>
        <div className="max-w-6xl mx-auto px-6 py-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBackToHome}
                className={`transition-colors duration-300 ${
                  isDark ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </Button>
              <div>
                <h1 className={`text-3xl font-extrabold tracking-tight mb-1 transition-colors duration-300 ${
                  isDark ? 'text-white' : 'text-indigo-700'
                }`}>
                  My Wishlist
                </h1>
                <p className={`transition-colors duration-300 ${
                  isDark ? 'text-gray-400' : 'text-indigo-400'
                }`}>
                  {wishlist.length} items saved for later
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <PasswordChangeButton 
                userType="customer" 
                variant="icon" 
                className="ml-2"
              />
              <LogoutButton 
                variant="gradient" 
                size="sm"
                compact={true}
                className="ml-2"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {wishlist.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`backdrop-blur rounded-2xl shadow-lg border p-12 text-center transition-all duration-300 ${
              isDark 
                ? 'bg-gray-800/80 border-gray-700' 
                : 'bg-white/80 border-indigo-100'
            }`}
          >
            <Heart className={`w-16 h-16 mx-auto mb-4 transition-colors duration-300 ${
              isDark ? 'text-gray-600' : 'text-gray-400'
            }`} />
            <h2 className={`text-xl font-semibold mb-2 transition-colors duration-300 ${
              isDark ? 'text-gray-300' : 'text-gray-600'
            }`}>
              Your wishlist is empty
            </h2>
            <p className={`text-sm mb-6 transition-colors duration-300 ${
              isDark ? 'text-gray-500' : 'text-gray-500'
            }`}>
              Start exploring stores and add items you love to your wishlist
            </p>
            <Button
              onClick={handleBackToHome}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              <Store className="w-4 h-4 mr-2" />
              Explore Stores
            </Button>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`backdrop-blur rounded-2xl shadow-lg border p-6 transition-all duration-300 ${
              isDark 
                ? 'bg-gray-800/80 border-gray-700' 
                : 'bg-white/80 border-indigo-100'
            }`}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {wishlist.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`group relative overflow-hidden rounded-xl border transition-all duration-300 hover:shadow-lg ${
                    isDark 
                      ? 'bg-gray-700/50 border-gray-600 hover:border-red-500' 
                      : 'bg-white border-gray-200 hover:border-red-300'
                  }`}
                >
                  {/* Product Image */}
                  <div className="relative h-48 overflow-hidden">
                    <div className={`w-full h-full transition-all duration-300 group-hover:scale-105 ${
                      isDark ? 'bg-gray-600' : 'bg-gray-100'
                    }`}>
                      <Store className="w-full h-full p-8 opacity-20" />
                    </div>
                    
                    {/* Wishlist Badge */}
                    <div className="absolute top-3 left-3">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full transition-colors duration-300 ${
                        isDark 
                          ? 'bg-red-900/50 text-red-300 border border-red-700' 
                          : 'bg-red-100 text-red-700'
                      }`}>
                        ❤️ Wishlist
                      </span>
                    </div>

                    {/* Remove Button */}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFromWishlist(item.stock_id);
                      }}
                      className="absolute top-3 right-3 bg-white/80 hover:bg-white text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* Product Info */}
                  <div className="p-4">
                    <h3 className={`font-bold text-lg mb-2 transition-colors duration-300 ${
                      isDark ? 'text-white' : 'text-gray-800'
                    }`}>
                      {item.stock_name}
                    </h3>
                    
                    <p className={`text-sm mb-3 transition-colors duration-300 ${
                      isDark ? 'text-gray-300' : 'text-gray-600'
                    }`}>
                      📍 {item.store_name} • {item.store_location}
                    </p>

                    <div className="flex items-center justify-between mb-3">
                      <span className={`text-sm transition-colors duration-300 ${
                        isDark ? 'text-gray-400' : 'text-gray-500'
                      }`}>
                        Category: {item.store_category}
                      </span>
                      <span className={`text-lg font-bold transition-colors duration-300 ${
                        isDark ? 'text-green-400' : 'text-green-600'
                      }`}>
                        ₹{item.stock_price}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className={`text-sm transition-colors duration-300 ${
                        isDark ? 'text-gray-400' : 'text-gray-500'
                      }`}>
                        Available: {item.stock_quantity}
                      </span>
                      
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeFromWishlist(item.stock_id);
                          }}
                          className={`transition-colors duration-300 ${
                            isDark 
                              ? 'border-red-600 text-red-400 hover:bg-red-600 hover:text-white' 
                              : 'border-red-300 text-red-600 hover:bg-red-50'
                          }`}
                        >
                          <Trash2 className="w-3 h-3 mr-1" />
                          Remove
                        </Button>
                        
                        <Button
                          size="sm"
                          onClick={() => handleStoreClick(item.store_id, item.store_name, item.store_location, item.store_category)}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white"
                        >
                          <ShoppingCart className="w-3 h-3 mr-1" />
                          View Store
                        </Button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
} 