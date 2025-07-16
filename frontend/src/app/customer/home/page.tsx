'use client';

import { useEffect, useState, useRef } from 'react';
import api from '@/lib/api';
import dynamic from 'next/dynamic';
import Cookies from 'js-cookie';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader, MapPin, Store, Search, Filter, X, User, Heart, Sparkles, Navigation, Globe, History, ShoppingBag, BadgeCheck, AlertCircle, XCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useDarkMode } from '@/hooks/useDarkMode';
import LogoutButton from '@/components/LogoutButton';
import PasswordChangeButton from '@/components/PasswordChangeButton';
import RecommendationsCarousel from '@/components/RecommendationsCarousel';
import { format } from 'date-fns'; // For date formatting
import useCustomerAuth from '@/hooks/useCustomerAuth';

const LocationPicker = dynamic(() => import('@/components/LocationPicker'), {
  ssr: false,
  loading: () => <p>Loading map...</p>,
});

type Store = {
  id: number;
  name: string;
  location: string;
  category: string;
};

export default function CustomerHomePage() {
  const { loading: authLoading } = useCustomerAuth();
  const [location, setLocation] = useState('');
  const [manualLocation, setManualLocation] = useState('');
  const [stores, setStores] = useState<Store[]>([]);
  const [filteredStores, setFilteredStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [storeStocks, setStoreStocks] = useState([]);
  const [loadingStocks, setLoadingStocks] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [locationDetected, setLocationDetected] = useState(false);
  const [detectingLocation, setDetectingLocation] = useState(true);
  const router = useRouter();
  const { isDark, toggleDarkMode } = useDarkMode();
  const [customerName, setCustomerName] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'discover' | 'history'>('discover');
  const [purchaseHistory, setPurchaseHistory] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [productCache, setProductCache] = useState<Record<number, string>>({});
  const [storeCache, setStoreCache] = useState<Record<number, string>>({});

  const lastLocation = useRef('');
  const fetchTimeout = useRef<NodeJS.Timeout | null>(null);

  const fetchStores = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/stores/location/${location}`);
      setStores(res.data);
      setFilteredStores(res.data);
    } catch (err) {
      console.error('Error fetching stores:', err);
    } finally {
      setLoading(false);
    }
  };

  // Enhanced search with backend support
  const searchStores = async (searchTerm: string, location: string, category: string) => {
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append('q', searchTerm);
      if (location) params.append('location', location);
      if (category) params.append('category', category);
      
      const res = await api.get(`/stores/search?${params.toString()}`);
      return res.data;
    } catch (err) {
      console.error('Error searching stores:', err);
      return [];
    }
  };

  // Enhanced case-insensitive search and filtering with backend support
  useEffect(() => {
    // If we have a search term, use backend search for better performance
    if (searchTerm && searchTerm.trim().length > 0) {
      setSearchLoading(true);
      const searchTimeout = setTimeout(async () => {
        const searchResults = await searchStores(searchTerm, location, selectedCategory);
        setFilteredStores(searchResults);
        setSearchLoading(false);
      }, 300); // 300ms debounce

      return () => {
        clearTimeout(searchTimeout);
        setSearchLoading(false);
      };
    }

    // Otherwise, use client-side filtering for instant results
    let filtered = stores;
    
    if (selectedCategory) {
      filtered = filtered.filter(store => 
        store.category.toLowerCase() === selectedCategory.toLowerCase()
      );
    }
    
    if (location) {
      filtered = filtered.filter(store => 
        store.location.toLowerCase() === location.toLowerCase()
      );
    }
    
    setFilteredStores(filtered);
    setSearchLoading(false);
  }, [stores, searchTerm, selectedCategory, location]);

  // Get unique categories from stores
  const categories = [...new Set(stores.map(store => store.category))];

  // Get unique cities from stores
  const cities = [...new Set(stores.map(store => store.location))];

  // Group stores by city
  const storesByCity = stores.reduce((acc, store) => {
    if (!acc[store.location]) {
      acc[store.location] = [];
    }
    acc[store.location].push(store);
    return acc;
  }, {} as Record<string, Store[]>);

  // Get city statistics
  const cityStats = cities.map(city => ({
    city,
    storeCount: storesByCity[city].length,
    categories: [...new Set(storesByCity[city].map(store => store.category))],
    totalItems: storesByCity[city].reduce((sum, store) => sum + (store as any).stockCount || 0, 0)
  }));

  const fetchStocks = async (storeId: number) => {
    console.log("Fetching stocks for storeId:", storeId);
    setLoadingStocks(true);
    try {
      const res = await api.get(`/public/stores/${storeId}/stocks`);
      setStoreStocks(res.data);
      console.log('API data:', res.data);
      setSelectedStore(stores.find((s) => s.id === storeId) || null);
    } catch (err) {
      console.error('Error fetching stocks:', err);
      alert('Failed to load stock data.');
    } finally {
      setLoadingStocks(false);
    }
  };

  const fetchPurchaseHistory = async () => {
    setHistoryLoading(true);
    try {
      const token = localStorage.getItem('customerToken');
      const res = await api.get('/customer/purchases', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPurchaseHistory(res.data);
      // Fetch product and store names in parallel (with caching)
      const uniqueStockIds = Array.from(new Set(res.data.map((p: any) => Number(p.stock_id)))) as number[];
      const uniqueStoreIds = Array.from(new Set(res.data.map((p: any) => Number(p.store_id)))) as number[];
      const productNames: Record<number, string> = { ...productCache };
      const storeNames: Record<number, string> = { ...storeCache };
      await Promise.all([
        ...uniqueStockIds.filter((id: number) => !productNames[id]).map(async (id: number) => {
          try {
            const resp = await api.get(`/public/stocks/${id}`);
            productNames[id] = resp.data.name;
          } catch {}
        }),
        ...uniqueStoreIds.filter((id: number) => !storeNames[id]).map(async (id: number) => {
          try {
            const resp = await api.get(`/stores/${id}`);
            storeNames[id] = resp.data.name;
          } catch {}
        })
      ]);
      setProductCache(productNames);
      setStoreCache(storeNames);
    } catch (err) {
      // handle error
    } finally {
      setHistoryLoading(false);
    }
  };

  // Location detection on mount
  useEffect(() => {
    setDetectingLocation(true);
    const savedCity = Cookies.get('selectedCity');
    
    if (savedCity) {
      setLocation(savedCity);
      setLocationDetected(true);
      setDetectingLocation(false);
    } else {
      // Try to get user's location
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async ({ coords: { latitude, longitude } }) => {
            try {
              const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`);
              const data = await res.json();
              const city = data.address?.city || data.address?.town || data.address?.village || 'Unknown';
              setLocation(city);
              Cookies.set('selectedCity', city);
              setLocationDetected(true);
            } catch (err) {
              console.error('Geocoding error:', err);
              setLocationDetected(false);
            } finally {
              setDetectingLocation(false);
            }
          },
          (err) => {
            console.error('Geolocation error:', err);
            setLocationDetected(false);
            setDetectingLocation(false);
          },
          { timeout: 10000, enableHighAccuracy: true }
        );
      } else {
        setLocationDetected(false);
        setDetectingLocation(false);
      }
    }
  }, []);

  useEffect(() => {
    if (!location) return;
    if (location === lastLocation.current) return; // Don't fetch if same as last

    if (fetchTimeout.current) clearTimeout(fetchTimeout.current);

    fetchTimeout.current = setTimeout(() => {
      lastLocation.current = location;
      fetchStores();
    }, 400); // 400ms debounce
  }, [location]);

  useEffect(() => {
    if (activeTab === 'history') {
      fetchPurchaseHistory();
    }
    // eslint-disable-next-line
  }, [activeTab]);

  // Fetch customer name for initials in header
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem("customerToken");
        if (!token) return;
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3000"}/api/customer/profile`,
          {
            headers: { Authorization: `Bearer ${token}` },
            credentials: "include",
          }
        );
        if (res.ok) {
          const profileData = await res.json();
          setCustomerName(profileData.name);
        }
      } catch {}
    };
    fetchProfile();
  }, []);

  function getInitials(name: string | null) {
    if (!name) return "";
    const parts = name.trim().split(" ");
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  const handleManualSubmit = () => {
    if (manualLocation.trim()) {
      setLocation(manualLocation);
      Cookies.set('selectedCity', manualLocation);
      setLocationDetected(true);
      setManualLocation('');
    }
  };

  const handleLocationSelect = (city: string) => {
    setLocation(city);
    Cookies.set('selectedCity', city);
    setLocationDetected(true);
  };

  // Category badge color mapping
  const categoryColorClass: Record<string, string> = {
    'Pharmaceuticals': 'bg-emerald-100 text-emerald-800',
    'Fashion': 'bg-pink-100 text-pink-800',
    'Sports': 'bg-orange-100 text-orange-800',
    'Electronics': 'bg-blue-100 text-blue-800',
    'General Store': 'bg-gray-200 text-gray-800',
    'Milk Dairy': 'bg-yellow-100 text-yellow-800',
    'Sweet Shop': 'bg-rose-100 text-rose-800',
    'Home & Lifestyle': 'bg-indigo-100 text-indigo-800',
    'Food & Beverage': 'bg-green-100 text-green-800',
    'Home & Garden': 'bg-lime-100 text-lime-800',
    'Books & Stationery': 'bg-purple-100 text-purple-800',
    'Books & Stationary': 'bg-purple-100 text-purple-800',
    'Health & Beauty': 'bg-fuchsia-100 text-fuchsia-800',
    'Automotive Parts': 'bg-cyan-100 text-cyan-800',
    'Industrial Supplies': 'bg-slate-100 text-slate-800',
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-400">Loading...</p>
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
            <div>
              <h1 className={`text-3xl font-extrabold tracking-tight mb-1 transition-colors duration-300 ${
                isDark ? 'text-white' : 'text-indigo-700'
              }`}>
                Discover Stores
              </h1>
              <p className={`transition-colors duration-300 ${
                isDark ? 'text-gray-400' : 'text-indigo-400'
              }`}>
                Find and explore stores near you
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className={`text-sm font-medium transition-colors duration-300 ${
                isDark ? 'text-gray-300' : 'text-gray-600'
              }`}>Dark Mode</span>
              <Switch checked={isDark} onCheckedChange={toggleDarkMode} />
              <button
                onClick={() => router.push('/customer/profile')}
                className="ml-2 w-9 h-9 rounded-full flex items-center justify-center bg-indigo-100 hover:bg-indigo-200 transition-colors border border-indigo-200 shadow-sm"
                title="My Profile"
                aria-label="My Profile"
              >
                {customerName ? (
                  <span className="text-indigo-700 font-bold text-base">
                    {getInitials(customerName)}
                  </span>
                ) : (
                  <User className="w-5 h-5 text-indigo-700" />
                )}
              </button>
              <Button
                onClick={() => router.push('/customer/wishlist')}
                variant="ghost"
                size="sm"
                className={`transition-colors duration-300 ${
                  isDark ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-800'
                }`}
                title="My Wishlist"
              >
                <Heart className="w-5 h-5" />
              </Button>
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
        <div className="flex space-x-2 mb-8 border-b border-gray-200 dark:border-gray-700 pb-2">
          <button
            className={`flex items-center gap-2 px-5 py-2 rounded-t-lg font-semibold transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400
              ${activeTab === 'discover'
                ? 'bg-indigo-600 text-white shadow scale-105'
                : 'bg-gray-100 text-gray-700 hover:bg-indigo-50 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'}
            `}
            onClick={() => setActiveTab('discover')}
          >
            <Store className="w-5 h-5" />
            Discover Stores
          </button>
          <button
            className={`flex items-center gap-2 px-5 py-2 rounded-t-lg font-semibold transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400
              ${activeTab === 'history'
                ? 'bg-indigo-600 text-white shadow scale-105'
                : 'bg-gray-100 text-gray-700 hover:bg-indigo-50 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'}
            `}
            onClick={() => setActiveTab('history')}
          >
            <History className="w-5 h-5" />
            Purchase History
          </button>
        </div>
        {activeTab === 'discover' && (
          <>
            {/* Location Detection Section - Shows first */}
            <AnimatePresence mode="wait">
              {detectingLocation && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className={`backdrop-blur-xl rounded-3xl shadow-2xl border p-8 mb-8 transition-all duration-300 ${
                    isDark 
                      ? 'bg-gray-900/80 border-gray-700/50' 
                      : 'bg-white/90 border-gray-200/50'
                  }`}
                >
                  <div className="text-center">
                    <div className={`w-16 h-16 mx-auto mb-6 rounded-full flex items-center justify-center ${
                      isDark ? 'bg-blue-900/50' : 'bg-blue-100'
                    }`}>
                      <Loader className={`w-8 h-8 animate-spin transition-colors duration-300 ${
                        isDark ? 'text-blue-400' : 'text-blue-600'
                      }`} />
                    </div>
                    <h2 className={`text-2xl font-bold mb-4 transition-colors duration-300 ${
                      isDark ? 'text-white' : 'text-gray-800'
                    }`}>
                      Detecting Your Location
                    </h2>
                    <p className={`text-lg transition-colors duration-300 ${
                      isDark ? 'text-gray-300' : 'text-gray-600'
                    }`}>
                      We're finding stores near you...
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Compact Location Selector - Shows after location detected */}
            <AnimatePresence mode="wait">
              {locationDetected && !detectingLocation && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className={`backdrop-blur-xl rounded-2xl shadow-lg border p-4 mb-6 transition-all duration-300 ${
                    isDark 
                      ? 'bg-gray-800/80 border-gray-700' 
                      : 'bg-white/80 border-indigo-100'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-xl ${
                        isDark ? 'bg-blue-900/50' : 'bg-blue-100'
                      }`}>
                        <MapPin className={`w-5 h-5 transition-colors duration-300 ${
                          isDark ? 'text-blue-400' : 'text-blue-600'
                        }`} />
                      </div>
                      <div>
                        <p className={`text-sm transition-colors duration-300 ${
                          isDark ? 'text-gray-300' : 'text-gray-600'
                        }`}>
                          Current Location
                        </p>
                        <p className={`font-semibold transition-colors duration-300 ${
                          isDark ? 'text-blue-400' : 'text-indigo-700'
                        }`}>
                          {location}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowMap(!showMap)}
                        className={`transition-all duration-300 ${
                          isDark 
                            ? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
                            : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <Navigation className="w-4 h-4 mr-2" />
                        {showMap ? 'Hide Map' : 'Change Location'}
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setLocation('');
                          Cookies.remove('selectedCity');
                          setLocationDetected(false);
                          setDetectingLocation(true);
                        }}
                        className={`transition-all duration-300 ${
                          isDark 
                            ? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
                            : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <Globe className="w-4 h-4 mr-2" />
                        Reset
                      </Button>
                    </div>
                  </div>

                  {/* Manual Location Input */}
                  <AnimatePresence mode="wait">
                    {showMap && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700"
                      >
                        <div className="flex flex-wrap gap-3 items-center">
                          <Input
                            placeholder="Enter city manually"
                            value={manualLocation}
                            onChange={(e) => setManualLocation(e.target.value)}
                            className={`max-w-xs transition-all duration-300 ${
                              isDark 
                                ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-400' 
                                : 'bg-white border-gray-300 focus:border-indigo-500'
                            }`}
                            onKeyDown={(e) => e.key === 'Enter' && handleManualSubmit()}
                          />
                          <Button 
                            onClick={handleManualSubmit}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white"
                          >
                            <MapPin className="w-4 h-4 mr-2" />
                            Set Location
                          </Button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Map Section - Shows when toggled */}
            <AnimatePresence mode="wait">
              {showMap && locationDetected && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className={`backdrop-blur rounded-2xl shadow-lg border p-6 mb-8 transition-all duration-300 ${
                    isDark 
                      ? 'bg-gray-800/80 border-gray-700' 
                      : 'bg-white/80 border-indigo-100'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-4">
                    <Search className={`w-5 h-5 transition-colors duration-300 ${
                      isDark ? 'text-blue-400' : 'text-indigo-600'
                    }`} />
                    <h2 className={`text-xl font-semibold transition-colors duration-300 ${
                      isDark ? 'text-white' : 'text-gray-800'
                    }`}>Interactive Map</h2>
                  </div>
                  <LocationPicker
                    onLocationSelect={handleLocationSelect}
                    stores={stores}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Recommendations Carousel - Shows after location detected */}
            <AnimatePresence mode="wait">
              {locationDetected && !detectingLocation && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: 0.1 }}
                  className="mb-8"
                >
                  <RecommendationsCarousel isDark={isDark} key={isDark ? 'dark' : 'light'} />
                </motion.div>
              )}
            </AnimatePresence>

            {/* City Overview Section */}
            {cityStats.length > 0 && locationDetected && !detectingLocation && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className={`backdrop-blur rounded-2xl shadow-lg border p-6 mb-8 transition-all duration-300 ${
                  isDark 
                    ? 'bg-gray-800/80 border-gray-700' 
                    : 'bg-white/80 border-indigo-100'
                }`}
              >
                <div className="flex items-center gap-2 mb-6">
                  <Store className={`w-5 h-5 transition-colors duration-300 ${
                    isDark ? 'text-blue-400' : 'text-indigo-600'
                  }`} />
                  <h2 className={`text-xl font-semibold transition-colors duration-300 ${
                    isDark ? 'text-white' : 'text-gray-800'
                  }`}>Available Cities</h2>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {cityStats.map((cityStat, index) => (
                    <motion.div
                      key={cityStat.city}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 * index }}
                      className={`p-4 rounded-xl border transition-all duration-300 cursor-pointer hover:shadow-lg ${
                        isDark 
                          ? 'bg-gray-700/50 border-gray-600 hover:bg-gray-700' 
                          : 'bg-white border-gray-200 hover:border-indigo-300'
                      }`}
                      onClick={() => handleLocationSelect(cityStat.city)}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h3 className={`font-bold text-lg transition-colors duration-300 ${
                          isDark ? 'text-white' : 'text-gray-800'
                        }`}>{cityStat.city}</h3>
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full transition-colors duration-300 ${
                          isDark 
                            ? 'bg-blue-900/50 text-blue-300 border border-blue-700' 
                            : 'bg-blue-100 text-blue-700'
                        }`}>
                          {cityStat.storeCount} stores
                        </span>
                      </div>
                      
                      <div className="space-y-2">
                        <p className={`text-sm transition-colors duration-300 ${
                          isDark ? 'text-gray-300' : 'text-gray-600'
                        }`}>
                          <span className="font-semibold">{cityStat.categories.length}</span> categories available
                        </p>
                        
                        <div className="flex flex-wrap gap-1">
                          {cityStat.categories.slice(0, 3).map((category) => (
                            <span
                              key={category}
                              className={`px-2 py-1 text-xs rounded-full transition-colors duration-300 ${
                                isDark 
                                  ? 'bg-gray-600 text-gray-300' 
                                  : 'bg-gray-100 text-gray-700'
                              }`}
                            >
                              {category}
                            </span>
                          ))}
                          {cityStat.categories.length > 3 && (
                            <span className={`px-2 py-1 text-xs rounded-full transition-colors duration-300 ${
                              isDark 
                                ? 'bg-gray-600 text-gray-300' 
                                : 'bg-gray-100 text-gray-700'
                            }`}>
                              +{cityStat.categories.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Filter Section */}
            {locationDetected && !detectingLocation && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className={`backdrop-blur rounded-2xl shadow-lg border p-6 mb-8 transition-all duration-300 ${
                  isDark 
                    ? 'bg-gray-800/80 border-gray-700' 
                    : 'bg-white/80 border-indigo-100'
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Filter className={`w-5 h-5 transition-colors duration-300 ${
                      isDark ? 'text-blue-400' : 'text-indigo-600'
                    }`} />
                    <h2 className={`text-xl font-semibold transition-colors duration-300 ${
                      isDark ? 'text-white' : 'text-gray-800'
                    }`}>Filter Stores</h2>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowFilters(!showFilters)}
                    className={`transition-colors duration-300 ${
                      isDark ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-800'
                    }`}
                  >
                    {showFilters ? <X className="w-4 h-4" /> : <Filter className="w-4 h-4" />}
                  </Button>
                </div>

                {showFilters && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-4"
                  >
                    {/* Search Input */}
                    <div>
                      <label className={`block text-sm font-medium mb-2 transition-colors duration-300 ${
                        isDark ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        Search by name or location
                        {searchLoading && (
                          <span className={`ml-2 text-xs transition-colors duration-300 ${
                            isDark ? 'text-blue-400' : 'text-indigo-600'
                          }`}>
                            🔍 Searching...
                          </span>
                        )}
                      </label>
                      <div className="relative">
                        <Input
                          placeholder="Search stores..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className={`transition-all duration-300 ${
                            isDark 
                              ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-400' 
                              : 'bg-white border-gray-300 focus:border-indigo-500'
                          }`}
                        />
                        {searchLoading && (
                          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                            <div className={`w-4 h-4 border-2 border-t-transparent rounded-full animate-spin ${
                              isDark ? 'border-blue-400' : 'border-indigo-600'
                            }`}></div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* City Filter */}
                    <div>
                      <label className={`block text-sm font-medium mb-2 transition-colors duration-300 ${
                        isDark ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        Filter by City
                      </label>
                      <select
                        value={location}
                        onChange={(e) => handleLocationSelect(e.target.value)}
                        className={`w-full px-3 py-2 rounded-lg border transition-all duration-300 ${
                          isDark 
                            ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-400' 
                            : 'bg-white border-gray-300 focus:border-indigo-500'
                        }`}
                      >
                        <option value="">All Cities</option>
                        {cities.map((city) => (
                          <option key={city} value={city}>
                            {city} ({storesByCity[city]?.length || 0} stores)
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Category Filter */}
                    <div>
                      <label className={`block text-sm font-medium mb-2 transition-colors duration-300 ${
                        isDark ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        Filter by Category
                      </label>
                      <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className={`w-full px-3 py-2 rounded-lg border transition-all duration-300 ${
                          isDark 
                            ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-400' 
                            : 'bg-white border-gray-300 focus:border-indigo-500'
                        }`}
                      >
                        <option value="">All Categories</option>
                        {categories.map((category) => (
                          <option key={category} value={category}>
                            {category}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Quick City Buttons */}
                    <div>
                      <label className={`block text-sm font-medium mb-2 transition-colors duration-300 ${
                        isDark ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        Quick City Selection
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {cities.slice(0, 5).map((city) => (
                          <button
                            key={city}
                            onClick={() => handleLocationSelect(city)}
                            className={`px-3 py-1 text-sm rounded-full transition-all duration-300 ${
                              location === city
                                ? 'bg-indigo-500 text-white'
                                : isDark
                                ? 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            {city}
                          </button>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Clear Filters */}
                {(searchTerm || selectedCategory || location) && (
                  <div className="flex justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSearchTerm('');
                        setSelectedCategory('');
                        setLocation('');
                        Cookies.remove('selectedCity');
                      }}
                      className={`transition-all duration-300 ${
                        isDark 
                          ? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
                          : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <X className="w-4 h-4 mr-2" />
                      Clear All Filters
                    </Button>
                  </div>
                )}
              </motion.div>
            )}

            {/* Store Display Section */}
            {locationDetected && !detectingLocation && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className={`backdrop-blur rounded-2xl shadow-lg border p-6 transition-all duration-300 ${
                  isDark 
                    ? 'bg-gray-800/80 border-gray-700' 
                    : 'bg-white/80 border-indigo-100'
                }`}
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <Store className={`w-5 h-5 transition-colors duration-300 ${
                      isDark ? 'text-blue-400' : 'text-indigo-600'
                    }`} />
                    <h2 className={`text-xl font-semibold transition-colors duration-300 ${
                      isDark ? 'text-white' : 'text-gray-800'
                    }`}>
                      {location ? `Stores in ${location}` : 'All Stores'}
                    </h2>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full transition-colors duration-300 ${
                      isDark 
                        ? 'bg-blue-900/50 text-blue-300 border border-blue-700' 
                        : 'bg-blue-100 text-blue-700'
                    }`}>
                      {filteredStores.length} stores
                    </span>
                    {searchTerm && (
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full transition-colors duration-300 ${
                        isDark 
                          ? 'bg-green-900/50 text-green-300 border border-green-700' 
                          : 'bg-green-100 text-green-700'
                      }`}>
                        🔍 Database search
                      </span>
                    )}
                  </div>
                </div>

                {filteredStores.length === 0 ? (
                  <div className="text-center py-12">
                    <Store className={`w-16 h-16 mx-auto mb-4 transition-colors duration-300 ${
                      isDark ? 'text-gray-600' : 'text-gray-400'
                    }`} />
                    <h3 className={`text-lg font-semibold mb-2 transition-colors duration-300 ${
                      isDark ? 'text-gray-300' : 'text-gray-600'
                    }`}>
                      No stores found
                    </h3>
                    <p className={`text-sm transition-colors duration-300 ${
                      isDark ? 'text-gray-500' : 'text-gray-500'
                    }`}>
                      Try adjusting your filters or search terms
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredStores.map((store, index) => (
                      <motion.div
                        key={store.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 * index }}
                        className={`group relative overflow-hidden rounded-xl border transition-all duration-300 hover:shadow-lg ${
                          isDark 
                            ? 'bg-gray-700/50 border-gray-600 hover:border-blue-500' 
                            : 'bg-white border-gray-200 hover:border-indigo-300'
                        }`}
                      >
                        {/* Store Image */}
                        <div className="relative h-48 overflow-hidden">
                          <div className={`w-full h-full transition-all duration-300 group-hover:scale-105 ${
                            isDark ? 'bg-gray-600' : 'bg-gray-100'
                          }`}>
                            <Store className="w-full h-full p-8 opacity-20" />
                          </div>
                          <div className="absolute top-3 right-3">
                            <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full shadow-sm border border-white/40 transition-colors duration-300 ${
                              categoryColorClass[store.category] || 'bg-gray-100 text-gray-700'
                            }`}>
                              {store.category}
                            </span>
                          </div>
                        </div>

                        {/* Store Info */}
                        <div className="p-4">
                          <div className="flex items-start justify-between mb-2">
                            <h3 className={`font-bold text-lg transition-colors duration-300 ${
                              isDark ? 'text-white' : 'text-gray-800'
                            }`}>
                              {store.name}
                            </h3>
                          </div>
                          
                          <p className={`text-sm mb-3 transition-colors duration-300 ${
                            isDark ? 'text-gray-300' : 'text-gray-600'
                          }`}>
                            📍 {store.location}
                          </p>

                          <div className="flex items-center justify-between">
                            <span className={`text-sm transition-colors duration-300 ${
                              isDark ? 'text-gray-400' : 'text-gray-500'
                            }`}>
                              Category: {store.category}
                            </span>
                            
                            <Button
                              onClick={() => router.push(`/customer/stores/${store.id}?name=${encodeURIComponent(store.name)}&location=${encodeURIComponent(store.location)}&category=${encodeURIComponent(store.category)}`)}
                              className="bg-indigo-600 hover:bg-indigo-700 text-white transition-all duration-300"
                            >
                              View Store
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </>
        )}
        {activeTab === 'history' && (
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2 text-indigo-700 dark:text-indigo-300">
              <History className="w-6 h-6" /> Purchase History
            </h2>
            {historyLoading ? (
              <div className="flex items-center justify-center py-12"><Loader className="animate-spin w-8 h-8 text-indigo-500" /></div>
            ) : purchaseHistory.length === 0 ? (
              <div className="text-center text-gray-500 py-12">No purchases yet.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm rounded-xl overflow-hidden">
                  <thead>
                    <tr className="bg-indigo-50 dark:bg-gray-800">
                      <th className="px-4 py-3 text-left font-semibold">Date</th>
                      <th className="px-4 py-3 text-left font-semibold"><Store className="inline w-4 h-4 mr-1" />Store</th>
                      <th className="px-4 py-3 text-left font-semibold"><ShoppingBag className="inline w-4 h-4 mr-1" />Product</th>
                      <th className="px-4 py-3 text-left font-semibold">Qty</th>
                      <th className="px-4 py-3 text-left font-semibold">Unit Price</th>
                      <th className="px-4 py-3 text-left font-semibold">Total</th>
                      <th className="px-4 py-3 text-left font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {purchaseHistory.map((p, i) => (
                      <tr
                        key={p.id}
                        className={`transition-all duration-200 ${
                          i % 2 === 0
                            ? 'bg-white dark:bg-gray-900'
                            : 'bg-gray-50 dark:bg-gray-800'
                        } hover:bg-indigo-50 dark:hover:bg-gray-700 shadow-sm`}
                      >
                        <td className="px-4 py-3 whitespace-nowrap">{format(new Date(p.purchase_date), 'dd MMM yyyy, hh:mm a')}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Store className="w-4 h-4 text-indigo-500" />
                            {storeCache[p.store_id as number] || p.store_id}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <ShoppingBag className="w-4 h-4 text-emerald-500" />
                            {productCache[p.stock_id as number] || p.stock_id}
                          </div>
                        </td>
                        <td className="px-4 py-3">{p.quantity}</td>
                        <td className="px-4 py-3">₹{p.price_per_unit}</td>
                        <td className="px-4 py-3 font-semibold">₹{p.total_amount}</td>
                        <td className="px-4 py-3">
                          {p.payment_status === 'completed' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                              <BadgeCheck className="w-4 h-4" /> Completed
                            </span>
                          ) : p.payment_status === 'pending' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700">
                              <AlertCircle className="w-4 h-4" /> Pending
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">
                              <XCircle className="w-4 h-4" /> {p.payment_status}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
