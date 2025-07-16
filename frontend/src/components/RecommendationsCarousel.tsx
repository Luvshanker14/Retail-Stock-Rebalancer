'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Sparkles, TrendingUp, Users, Heart, Star, MapPin, ShoppingBag } from 'lucide-react';
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

interface RecommendationsCarouselProps { isDark: boolean }

export default function RecommendationsCarousel({ isDark }: RecommendationsCarouselProps) {
  const [recommendations, setRecommendations] = useState<RecommendationsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'personalized' | 'trending' | 'collaborative'>('personalized');
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [windowWidth, setWindowWidth] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    fetchRecommendations();
    
    // Set initial window width
    setWindowWidth(window.innerWidth);
    
    // Add resize listener
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Auto-slide effect
  useEffect(() => {
    if (!isHovered) {
      const interval = setInterval(() => {
        const items = getActiveRecommendations();
        const itemsPerView = getItemsPerView();
        const maxSlides = Math.max(0, items.length - itemsPerView);
        setCurrentSlide(prev => prev >= maxSlides ? 0 : prev + 1);
      }, 2500); // 2.5 seconds
      return () => clearInterval(interval);
    }
  }, [isHovered, activeTab, recommendations, windowWidth]);

  const fetchRecommendations = async () => {
    try {
      const token = localStorage.getItem('customerToken');
      if (!token) {
        setLoading(false);
        return;
      }

      const response = await api.get('/recommendations/all?limit=12', {
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

  const getActiveRecommendations = () => {
    if (!recommendations) return [];
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

  // Calculate items per view based on screen size
  const getItemsPerView = () => {
    if (windowWidth < 640) return 3;      // Mobile: 3 cards
    if (windowWidth < 1024) return 3;     // Tablet: 3 cards
    if (windowWidth < 1280) return 4;     // Small desktop: 4 cards
    return 5;                             // Large desktop: 5 cards
  };

  const nextSlide = () => {
    const items = getActiveRecommendations();
    const itemsPerView = getItemsPerView();
    const maxSlides = Math.max(0, items.length - itemsPerView);
    setCurrentSlide(prev => prev >= maxSlides ? 0 : prev + 1);
  };

  const prevSlide = () => {
    const items = getActiveRecommendations();
    const itemsPerView = getItemsPerView();
    const maxSlides = Math.max(0, items.length - itemsPerView);
    setCurrentSlide(prev => prev <= 0 ? maxSlides : prev - 1);
  };

  const renderRecommendationCard = (item: RecommendationItem, index: number) => (
    <motion.div
      key={`${item.stock_id}-${activeTab}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.5 }}
      whileHover={{ y: -8, scale: 1.02 }}
      className={`group relative overflow-hidden rounded-2xl transition-all duration-500 cursor-pointer flex-shrink-0 ${
        isDark 
          ? 'bg-gradient-to-br from-gray-800/90 to-gray-900/90 border border-gray-700/50 shadow-2xl' 
          : 'bg-gradient-to-br from-white to-gray-50/80 border border-gray-200/50 shadow-xl'
      } hover:shadow-2xl`}
      onClick={() => handleStoreClick(item.store_id, item.store_name, item.store_location, item.store_category)}
    >
      {/* Background Pattern */}
      <div className={`absolute inset-0 opacity-5 group-hover:opacity-10 transition-opacity duration-500 ${
        isDark ? 'bg-gradient-to-br from-blue-400 to-purple-600' : 'bg-gradient-to-br from-indigo-400 to-purple-600'
      }`} />
      
      {/* Product Image Section */}
      <div className="relative h-40 overflow-hidden">
        <div className={`w-full h-full transition-all duration-700 group-hover:scale-110 ${
          isDark 
            ? 'bg-gradient-to-br from-gray-700 to-gray-800' 
            : 'bg-gradient-to-br from-gray-100 to-gray-200'
        }`}>
          <div className="w-full h-full flex items-center justify-center">
            <div className={`text-4xl transition-transform duration-500 group-hover:scale-110 ${
              isDark ? 'text-gray-600' : 'text-gray-400'
            }`}>
              🛍️
            </div>
          </div>
        </div>
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
        
        {/* Recommendation Badge */}
        {item.relevance_score && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="absolute top-3 left-3"
          >
            <span className={`px-3 py-1 text-xs font-bold rounded-full backdrop-blur-sm border transition-all duration-300 ${
              item.relevance_score === 3 
                ? isDark 
                  ? 'bg-emerald-900/80 text-emerald-300 border-emerald-700/50' 
                  : 'bg-emerald-100 text-emerald-700 border-emerald-200'
                : item.relevance_score === 2
                ? isDark 
                  ? 'bg-blue-900/80 text-blue-300 border-blue-700/50' 
                  : 'bg-blue-100 text-blue-700 border-blue-200'
                : isDark 
                  ? 'bg-gray-900/80 text-gray-300 border-gray-700/50' 
                  : 'bg-gray-100 text-gray-700 border-gray-200'
            }`}>
              {item.relevance_score === 3 ? 'Perfect Match' : 
               item.relevance_score === 2 ? 'Great Pick' : 'Recommended'}
            </span>
          </motion.div>
        )}

        {/* Trending Badge */}
        {item.recent_purchases && item.recent_purchases > 0 && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            className="absolute top-3 right-3"
          >
            <span className={`px-2 py-1 text-xs font-bold rounded-full backdrop-blur-sm border transition-all duration-300 ${
              isDark 
                ? 'bg-orange-900/80 text-orange-300 border-orange-700/50' 
                : 'bg-orange-100 text-orange-700 border-orange-200'
            }`}>
              🔥 {item.recent_purchases}
            </span>
          </motion.div>
        )}

        {/* Wishlist Button */}
        <div className="absolute bottom-3 right-3">
          <WishlistButton 
            stockId={item.stock_id} 
            storeId={item.store_id}
            variant="ghost"
            size="icon"
            className={`backdrop-blur-sm border transition-all duration-300 ${
              isDark 
                ? 'bg-gray-800/80 hover:bg-gray-700/90 text-white border-gray-600/50' 
                : 'bg-white/80 hover:bg-white text-gray-800 border-gray-200/50'
            } w-9 h-9 rounded-full`}
          />
        </div>
      </div>

      {/* Product Info */}
      <div className="p-4">
        <h3 className={`font-bold text-sm mb-2 line-clamp-2 transition-colors duration-300 ${
          isDark ? 'text-white' : 'text-gray-800'
        }`}>
          {item.stock_name}
        </h3>
        
        <div className="flex items-center gap-1 mb-2">
          <MapPin className={`w-3 h-3 transition-colors duration-300 ${
            isDark ? 'text-gray-400' : 'text-gray-500'
          }`} />
          <p className={`text-xs transition-colors duration-300 ${
            isDark ? 'text-gray-300' : 'text-gray-600'
          }`}>
            {item.store_name}
          </p>
        </div>

        <div className="flex items-center justify-between">
          <span className={`text-xs px-2 py-1 rounded-full transition-colors duration-300 ${
            isDark 
              ? 'bg-gray-700/50 text-gray-300' 
              : 'bg-gray-100 text-gray-600'
          }`}>
            {item.store_category}
          </span>
          <div className="flex items-center gap-1">
            <ShoppingBag className={`w-3 h-3 transition-colors duration-300 ${
              isDark ? 'text-green-400' : 'text-green-600'
            }`} />
            <span className={`text-sm font-bold transition-colors duration-300 ${
              isDark ? 'text-green-400' : 'text-green-600'
            }`}>
              ₹{item.stock_price.toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );

  if (loading) {
    return (
      <div className={`backdrop-blur-xl rounded-3xl shadow-2xl border p-6 transition-all duration-300 ${
        isDark 
          ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border-gray-700/70' 
          : 'bg-gradient-to-br from-white via-blue-50 to-gray-100 border-gray-200/50'
      }`}>
        <div className="flex items-center gap-3 mb-6">
          <div className={`p-2 rounded-xl ${
            isDark ? 'bg-blue-950/60' : 'bg-blue-100'
          }`}>
            <Sparkles className={`w-5 h-5 transition-colors duration-300 ${
              isDark ? 'text-blue-300' : 'text-blue-600'
            }`} />
          </div>
          <h3 className={`text-xl font-bold transition-colors duration-300 ${
            isDark ? 'text-white' : 'text-gray-800'
          }`}>Discover Amazing Products</h3>
        </div>
        <div className="flex gap-4 overflow-hidden">
          {[...Array(4)].map((_, i) => (
            <div key={i} className={`w-64 h-64 rounded-2xl animate-pulse flex-shrink-0 ${
              isDark ? 'bg-gray-800' : 'bg-gray-200'
            }`} />
          ))}
        </div>
      </div>
    );
  }

  if (!recommendations) {
    return null;
  }

  const items = getActiveRecommendations();
  const itemsPerView = getItemsPerView();
  const maxSlides = Math.max(0, items.length - itemsPerView);
  const showNavigation = items.length > itemsPerView;

  // If the selected tab is empty, show a friendly message instead of hiding the carousel
  if (items.length === 0) {
    return (
      <div className={`backdrop-blur-xl rounded-3xl shadow-2xl border p-6 transition-all duration-500 ${
        isDark 
          ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border-gray-700/70' 
          : 'bg-gradient-to-br from-white via-blue-50 to-gray-100 border-gray-200/50'
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl ${
              isDark ? 'bg-blue-950/60' : 'bg-blue-100'
            }`}>
              <Sparkles className={`w-5 h-5 ${isDark ? 'text-blue-300' : 'text-blue-600'}`} />
            </div>
            <h3 className={`text-xl font-bold ${isDark ? 'text-blue-100' : 'text-gray-800'}`}>Discover Amazing Products</h3>
          </div>

          {/* Tab Navigation - Desktop */}
          <div className="hidden md:flex gap-2">
            {[
              { key: 'personalized', icon: Sparkles, label: 'For You' },
              { key: 'trending', icon: TrendingUp, label: 'Trending' },
              { key: 'collaborative', icon: Users, label: 'Similar' }
            ].map(({ key, icon: Icon, label }) => (
              <Button
                key={key}
                variant={activeTab === key ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  setActiveTab(key as any);
                  setCurrentSlide(0);
                }}
                className={`flex items-center gap-2 text-xs font-medium transition-all duration-300 ${
                  activeTab === key 
                    ? isDark 
                      ? 'bg-blue-600 hover:bg-blue-700' 
                      : 'bg-blue-600 hover:bg-blue-700'
                    : isDark 
                      ? 'border-gray-600 text-gray-300 hover:bg-gray-800' 
                      : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Icon className="w-3 h-3" />
                <span className="hidden lg:inline">{label}</span>
              </Button>
            ))}
          </div>
        </div>

        {/* Tab Navigation - Mobile */}
        <div className="flex md:hidden gap-2 mb-6">
          {[
            { key: 'personalized', icon: Sparkles, label: 'For You' },
            { key: 'trending', icon: TrendingUp, label: 'Trending' },
            { key: 'collaborative', icon: Users, label: 'Similar' }
          ].map(({ key, icon: Icon, label }) => (
            <Button
              key={key}
              variant={activeTab === key ? 'default' : 'outline'}
              size="sm"
              onClick={() => {
                setActiveTab(key as any);
                setCurrentSlide(0);
              }}
              className={`flex-1 flex items-center justify-center gap-2 text-xs font-medium transition-all duration-300 ${
                activeTab === key 
                  ? isDark 
                    ? 'bg-blue-600 hover:bg-blue-700' 
                    : 'bg-blue-600 hover:bg-blue-700'
                  : isDark 
                    ? 'border-gray-600 text-gray-300 hover:bg-gray-800' 
                    : 'border-gray-300 text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Icon className="w-3 h-3" />
              {label}
            </Button>
          ))}
        </div>

        {/* Fallback Message */}
        <div className="flex flex-col items-center justify-center py-12">
          <div className={`text-5xl mb-4 ${isDark ? 'text-blue-900' : 'text-blue-200'}`}>🤷‍♂️</div>
          <p className={`text-lg font-semibold mb-2 ${isDark ? 'text-blue-100' : 'text-gray-700'}`}>No recommendations found for this tab.</p>
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Try another tab or check back later!</p>
        </div>
      </div>
    );
  }

  // Calculate the card width including gap
  const getCardWidth = () => {
    if (windowWidth < 640) return 100; // Mobile: full width
    if (windowWidth < 1024) return 50; // Tablet: half width
    if (windowWidth < 1280) return 33.333; // Small desktop: third width
    return 25; // Large desktop: quarter width
  };

  const cardWidth = getCardWidth();
  const gapWidth = 16; // 4 * 4px gap
  const totalCardWidth = cardWidth + (gapWidth / itemsPerView);
  const translateX = currentSlide * totalCardWidth;

  return (
    <div 
      className={`backdrop-blur-xl rounded-3xl shadow-2xl border p-6 transition-all duration-500 ${
        isDark 
          ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border-gray-700/70' 
          : 'bg-gradient-to-br from-white via-blue-50 to-gray-100 border-gray-200/50'
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl transition-all duration-300 ${
            isDark ? 'bg-blue-950/60' : 'bg-blue-100'
          }`}>
            <Sparkles className={`w-5 h-5 transition-colors duration-300 ${
              isDark ? 'text-blue-300' : 'text-blue-600'
            }`} />
          </div>
          <h3 className={`text-xl font-bold transition-colors duration-300 ${
            isDark ? 'text-blue-100' : 'text-gray-800'
          }`}>Discover Amazing Products</h3>
        </div>

        {/* Tab Navigation - Desktop */}
        <div className="hidden md:flex gap-2">
          {[
            { key: 'personalized', icon: Sparkles, label: 'For You' },
            { key: 'trending', icon: TrendingUp, label: 'Trending' },
            { key: 'collaborative', icon: Users, label: 'Similar' }
          ].map(({ key, icon: Icon, label }) => (
            <Button
              key={key}
              variant={activeTab === key ? 'default' : 'outline'}
              size="sm"
              onClick={() => {
                setActiveTab(key as any);
                setCurrentSlide(0);
              }}
              className={`flex items-center gap-2 text-xs font-medium transition-all duration-300 ${
                activeTab === key 
                  ? isDark 
                    ? 'bg-blue-600 hover:bg-blue-700' 
                    : 'bg-blue-600 hover:bg-blue-700'
                  : isDark 
                    ? 'border-gray-600 text-gray-300 hover:bg-gray-800' 
                    : 'border-gray-300 text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Icon className="w-3 h-3" />
              <span className="hidden lg:inline">{label}</span>
            </Button>
          ))}
        </div>
      </div>

      {/* Tab Navigation - Mobile */}
      <div className="flex md:hidden gap-2 mb-6">
        {[
          { key: 'personalized', icon: Sparkles, label: 'For You' },
          { key: 'trending', icon: TrendingUp, label: 'Trending' },
          { key: 'collaborative', icon: Users, label: 'Similar' }
        ].map(({ key, icon: Icon, label }) => (
          <Button
            key={key}
            variant={activeTab === key ? 'default' : 'outline'}
            size="sm"
            onClick={() => {
              setActiveTab(key as any);
              setCurrentSlide(0);
            }}
            className={`flex-1 flex items-center justify-center gap-2 text-xs font-medium transition-all duration-300 ${
              activeTab === key 
                ? isDark 
                  ? 'bg-blue-600 hover:bg-blue-700' 
                  : 'bg-blue-600 hover:bg-blue-700'
                : isDark 
                  ? 'border-gray-600 text-gray-300 hover:bg-gray-800' 
                  : 'border-gray-300 text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Icon className="w-3 h-3" />
            {label}
          </Button>
        ))}
      </div>

      {/* Carousel Container */}
      <div className="relative" ref={carouselRef}>
        {/* Navigation Buttons */}
        {showNavigation && (
          <>
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: isHovered ? 1 : 0, x: isHovered ? 0 : -20 }}
              transition={{ duration: 0.3 }}
            >
              <Button
                variant="ghost"
                size="icon"
                onClick={prevSlide}
                className={`absolute left-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full backdrop-blur-sm border transition-all duration-300 ${
                  isDark 
                    ? 'bg-gray-800/80 hover:bg-gray-700/90 text-white border-gray-600/50' 
                    : 'bg-white/80 hover:bg-white text-gray-800 border-gray-200/50 shadow-lg'
                }`}
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: isHovered ? 1 : 0, x: isHovered ? 0 : 20 }}
              transition={{ duration: 0.3 }}
            >
              <Button
                variant="ghost"
                size="icon"
                onClick={nextSlide}
                className={`absolute right-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full backdrop-blur-sm border transition-all duration-300 ${
                  isDark 
                    ? 'bg-gray-800/80 hover:bg-gray-700/90 text-white border-gray-600/50' 
                    : 'bg-white/80 hover:bg-white text-gray-800 border-gray-200/50 shadow-lg'
                }`}
              >
                <ChevronRight className="w-5 h-5" />
              </Button>
            </motion.div>
          </>
        )}

        {/* Carousel */}
        <div className="overflow-hidden rounded-2xl">
          <div 
            className="flex gap-4 transition-transform duration-700 ease-out"
            style={{
              transform: `translateX(-${currentSlide * (100 / itemsPerView)}%)`,
              width: 'auto'
            }}
          >
            {items.map((item, index) => (
              <div 
                key={item.stock_id} 
                style={{ flex: `0 0 ${100 / itemsPerView}%` }}
              >
                {/* Card dark mode polish */}
                <div className={`rounded-2xl h-full w-full ${
                  isDark ? 'bg-gradient-to-br from-gray-800 via-gray-900 to-gray-950 border border-gray-700/70' : ''
                }`}>
                  {renderRecommendationCard(item, index)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Dots Indicator */}
        {showNavigation && maxSlides > 0 && (
          <div className="flex justify-center gap-2 mt-6">
            {[...Array(maxSlides + 1)].map((_, index) => (
              <motion.button
                key={index}
                onClick={() => setCurrentSlide(index)}
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.9 }}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  index === currentSlide
                    ? isDark 
                      ? 'bg-blue-500 shadow-lg shadow-blue-900/60 border border-blue-300' 
                      : 'bg-blue-600 shadow-lg shadow-blue-600/30 border border-blue-200'
                    : isDark 
                      ? 'bg-gray-700 hover:bg-gray-600 border border-gray-600' 
                      : 'bg-gray-300 hover:bg-gray-400 border border-gray-200'
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 