'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, TrendingUp, Users, MapPin, Store, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { useDarkMode } from '@/hooks/useDarkMode';
import api from '@/lib/api';
import WishlistButton from './WishlistButton';

interface RecommendationItem {
  stock_id: number;
  stock_name: string;
  stock_price: number;
  stock_quantity: number;
  store_id: number;
  store_name: string;
  store_location: string;
  store_category: string;
  relevance_score?: number;
  recent_purchases?: number;
  total_quantity_sold?: number;
  similar_customer_purchases?: number;
}

interface RecommendationsData {
  personalized: RecommendationItem[];
  trending: RecommendationItem[];
  collaborative: RecommendationItem[];
  favoriteCategories: Array<{ category: string; purchase_count: number; total_spent: number }>;
  favoriteStores: Array<{ 
    store_id: number; 
    store_name: string; 
    store_location: string; 
    purchase_count: number; 
    total_spent: number 
  }>;
}

export default function RecommendationsSection() {
  const [recommendations, setRecommendations] = useState<RecommendationsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'personalized' | 'trending' | 'collaborative'>('personalized');
  const router = useRouter();
  const { isDark } = useDarkMode();

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const fetchRecommendations = async () => {
    try {
      const token = localStorage.getItem('customerToken');
      if (!token) {
        setLoading(false);
        return;
      }

      const response = await api.get('/recommendations/all?limit=6', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRecommendations(response.data);
    } catch (error) {
      console.error('Error fetching recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStoreClick = (storeId: number, storeName: string, location: string, category: string) => {
    router.push(`/customer/stores/${storeId}?name=${encodeURIComponent(storeName)}&location=${encodeURIComponent(location)}&category=${encodeURIComponent(category)}`);
  };

  if (loading) {
    return (
      <div className={`backdrop-blur rounded-2xl shadow-lg border p-6 transition-all duration-300 ${
        isDark 
          ? 'bg-gray-800/80 border-gray-700' 
          : 'bg-white/80 border-indigo-100'
      }`}>
        <div className="flex items-center gap-2 mb-6">
          <Sparkles className={`w-5 h-5 transition-colors duration-300 ${
            isDark ? 'text-blue-400' : 'text-indigo-600'
          }`} />
          <h2 className={`text-xl font-semibold transition-colors duration-300 ${
            isDark ? 'text-white' : 'text-gray-800'
          }`}>Personalized Recommendations</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className={`h-48 rounded-lg animate-pulse ${
              isDark ? 'bg-gray-700' : 'bg-gray-200'
            }`} />
          ))}
        </div>
      </div>
    );
  }

  if (!recommendations) {
    return null;
  }

  const getActiveRecommendations = () => {
    switch (activeTab) {
      case 'personalized':
        return recommendations.personalized;
      case 'trending':
        return recommendations.trending;
      case 'collaborative':
        return recommendations.collaborative;
      default:
        return recommendations.personalized;
    }
  };

  const renderRecommendationCard = (item: RecommendationItem, index: number) => (
    <motion.div
      key={`${item.stock_id}-${activeTab}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className={`group relative overflow-hidden rounded-xl border transition-all duration-300 hover:shadow-lg cursor-pointer ${
        isDark 
          ? 'bg-gray-700/50 border-gray-600 hover:border-blue-500' 
          : 'bg-white border-gray-200 hover:border-indigo-300'
      }`}
      onClick={() => handleStoreClick(item.store_id, item.store_name, item.store_location, item.store_category)}
    >
      {/* Product Image Placeholder */}
      <div className="relative h-32 overflow-hidden">
        <div className={`w-full h-full transition-all duration-300 group-hover:scale-105 ${
          isDark ? 'bg-gray-600' : 'bg-gray-100'
        }`}>
          <Store className="w-full h-full p-6 opacity-20" />
        </div>
        
        {/* Relevance Badge */}
        {item.relevance_score && (
          <div className="absolute top-2 left-2">
            <span className={`px-2 py-1 text-xs font-semibold rounded-full transition-colors duration-300 ${
              isDark 
                ? 'bg-blue-900/50 text-blue-300 border border-blue-700' 
                : 'bg-blue-100 text-blue-700'
            }`}>
              {item.relevance_score === 3 ? 'Perfect Match' : 
               item.relevance_score === 2 ? 'Good Match' : 'Recommended'}
            </span>
          </div>
        )}

        {/* Trending Badge */}
        {item.recent_purchases && item.recent_purchases > 0 && (
          <div className="absolute top-2 right-2">
            <span className={`px-2 py-1 text-xs font-semibold rounded-full transition-colors duration-300 ${
              isDark 
                ? 'bg-green-900/50 text-green-300 border border-green-700' 
                : 'bg-green-100 text-green-700'
            }`}>
              🔥 {item.recent_purchases} recent
            </span>
          </div>
        )}

        {/* Wishlist Button */}
        <div className="absolute top-2 right-2">
          <WishlistButton 
            stockId={item.stock_id} 
            storeId={item.store_id}
            variant="ghost"
            size="icon"
            className="bg-white/80 hover:bg-white"
          />
        </div>
      </div>

      {/* Product Info */}
      <div className="p-4">
        <h3 className={`font-bold text-lg mb-1 transition-colors duration-300 ${
          isDark ? 'text-white' : 'text-gray-800'
        }`}>
          {item.stock_name}
        </h3>
        
        <p className={`text-sm mb-2 transition-colors duration-300 ${
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
          
          <Button
            size="sm"
            className="bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            View Store
          </Button>
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className={`backdrop-blur rounded-2xl shadow-lg border p-6 transition-all duration-300 ${
      isDark 
        ? 'bg-gray-800/80 border-gray-700' 
        : 'bg-white/80 border-indigo-100'
    }`}>
      <div className="flex items-center gap-2 mb-6">
        <Sparkles className={`w-5 h-5 transition-colors duration-300 ${
          isDark ? 'text-blue-400' : 'text-indigo-600'
        }`} />
        <h2 className={`text-xl font-semibold transition-colors duration-300 ${
          isDark ? 'text-white' : 'text-gray-800'
        }`}>Personalized Recommendations</h2>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 mb-6">
        <Button
          variant={activeTab === 'personalized' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setActiveTab('personalized')}
          className="flex items-center gap-2"
        >
          <Sparkles className="w-4 h-4" />
          For You
        </Button>
        <Button
          variant={activeTab === 'trending' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setActiveTab('trending')}
          className="flex items-center gap-2"
        >
          <TrendingUp className="w-4 h-4" />
          Trending
        </Button>
        <Button
          variant={activeTab === 'collaborative' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setActiveTab('collaborative')}
          className="flex items-center gap-2"
        >
          <Users className="w-4 h-4" />
          Similar Users
        </Button>
      </div>

      {/* Recommendations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {getActiveRecommendations().map((item, index) => 
          renderRecommendationCard(item, index)
        )}
      </div>

      {/* Favorite Categories and Stores */}
      {(recommendations.favoriteCategories.length > 0 || recommendations.favoriteStores.length > 0) && (
        <div className="mt-8 space-y-6">
          {/* Favorite Categories */}
          {recommendations.favoriteCategories.length > 0 && (
            <div>
              <h3 className={`text-lg font-semibold mb-3 transition-colors duration-300 ${
                isDark ? 'text-white' : 'text-gray-800'
              }`}>
                Your Favorite Categories
              </h3>
              <div className="flex flex-wrap gap-2">
                {recommendations.favoriteCategories.map((category, index) => (
                  <span
                    key={category.category}
                    className={`px-3 py-1 text-sm rounded-full transition-colors duration-300 ${
                      isDark 
                        ? 'bg-blue-900/50 text-blue-300 border border-blue-700' 
                        : 'bg-blue-100 text-blue-700'
                    }`}
                  >
                    {category.category} ({category.purchase_count} purchases)
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Favorite Stores */}
          {recommendations.favoriteStores.length > 0 && (
            <div>
              <h3 className={`text-lg font-semibold mb-3 transition-colors duration-300 ${
                isDark ? 'text-white' : 'text-gray-800'
              }`}>
                Your Favorite Stores
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {recommendations.favoriteStores.map((store) => (
                  <div
                    key={store.store_id}
                    className={`p-3 rounded-lg border transition-all duration-300 cursor-pointer hover:shadow-md ${
                      isDark 
                        ? 'bg-gray-700/50 border-gray-600 hover:border-blue-500' 
                        : 'bg-white border-gray-200 hover:border-indigo-300'
                    }`}
                    onClick={() => handleStoreClick(store.store_id, store.store_name, store.store_location, '')}
                  >
                    <h4 className={`font-semibold transition-colors duration-300 ${
                      isDark ? 'text-white' : 'text-gray-800'
                    }`}>
                      {store.store_name}
                    </h4>
                    <p className={`text-sm transition-colors duration-300 ${
                      isDark ? 'text-gray-300' : 'text-gray-600'
                    }`}>
                      📍 {store.store_location}
                    </p>
                    <p className={`text-xs transition-colors duration-300 ${
                      isDark ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      {store.purchase_count} purchases • ₹{store.total_spent} spent
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 