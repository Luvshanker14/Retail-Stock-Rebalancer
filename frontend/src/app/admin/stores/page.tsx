'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { motion } from 'framer-motion';
import { Plus, Check, Store as StoreIcon, Search, Filter, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import LogoutButton from '@/components/LogoutButton';
import ProfileAvatar from '@/components/ProfileAvatar';
import { useDarkMode } from '@/hooks/useDarkMode';
import useAuth from '@/hooks/useAuth';

type Store = {
  id: number;
  name: string;
  category: string;
  location: string;
  phone_number?: string; // Added phone_number to the type
};

export default function AllStoresPage() {
  const { loading: authLoading } = useAuth();
  const [allStores, setAllStores] = useState<Store[]>([]);
  const [trackedStoreIds, setTrackedStoreIds] = useState<number[]>([]);
  const [filteredStores, setFilteredStores] = useState<Store[]>([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [location, setLocation] = useState('');
  const [loading, setLoading] = useState(true);
  const [tracking, setTracking] = useState<number | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const router = useRouter();
  const { isDark } = useDarkMode();

  // Fetch all stores and tracked stores
  useEffect(() => {
    if (authLoading) return; // Wait for auth check
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch all stores
        const storesRes = await api.get('/stores');
        setAllStores(storesRes.data);

        // Fetch tracked stores
        const token = localStorage.getItem('adminToken');
        const trackedRes = await api.get('/stores/tracked', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const trackedIds = trackedRes.data.map((store: Store) => store.id);
        setTrackedStoreIds(trackedIds);
      } catch (err) {
        console.error(err);
        toast.error('Failed to fetch stores');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [authLoading]);

  // Filter stores based on search, category, location, and tracked status
  useEffect(() => {
    let filtered = allStores.filter((store) => {
      // Only show untracked stores
      if (trackedStoreIds.includes(store.id)) {
        return false;
      }
      
      // Apply search filter
      if (search && !store.name.toLowerCase().includes(search.toLowerCase())) {
        return false;
      }
      
      // Apply category filter
      if (category && store.category !== category) {
        return false;
      }
      
      // Apply location filter
      if (location && store.location !== location) {
        return false;
      }
      
      return true;
    });
    
    setFilteredStores(filtered);
  }, [allStores, trackedStoreIds, search, category, location]);

  const handleTrack = async (storeId: number) => {
    setTracking(storeId);
    try {
      const token = localStorage.getItem('adminToken');
      await api.post(`/stores/${storeId}/track`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTrackedStoreIds((prev) => [...prev, storeId]);
      toast.success('Store tracked successfully');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to track store');
    } finally {
      setTracking(null);
    }
  };

  const categories = Array.from(new Set(allStores.map((s) => s.category)));
  const locations = Array.from(new Set(allStores.map((s) => s.location)));

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-400">Loading stores...</p>
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
      <div className={`w-full shadow-sm border-b py-7 px-4 md:px-0 backdrop-blur transition-all duration-300 ${
        isDark 
          ? 'bg-gray-800/80 border-gray-700' 
          : 'bg-white/80 border-indigo-100'
      }`}>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className={`text-3xl font-extrabold mb-1 tracking-tight transition-colors duration-300 ${
              isDark ? 'text-white' : 'text-indigo-700'
            }`}>Available Stores</h1>
            <p className={`transition-colors duration-300 ${
              isDark ? 'text-gray-400' : 'text-indigo-400'
            }`}>Discover and track stores that aren't being monitored yet</p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              onClick={() => router.push('/admin/tracked_stores')}
              className="bg-gradient-to-r from-indigo-500 to-teal-500 hover:from-indigo-600 hover:to-teal-600 text-white"
            >
              <StoreIcon className="w-4 h-4 mr-2" />
              View Tracked Stores
            </Button>
            <LogoutButton variant="gradient" size="sm" />
            <ProfileAvatar />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Search and Filters */}
        <div className={`backdrop-blur rounded-2xl shadow-lg border p-6 mb-8 transition-all duration-300 ${
          isDark 
            ? 'bg-gray-800/80 border-gray-700' 
            : 'bg-white/80 border-indigo-100'
        }`}>
          <div className="flex items-center gap-2 mb-4">
            <Search className={`w-5 h-5 transition-colors duration-300 ${
              isDark ? 'text-blue-400' : 'text-indigo-600'
            }`} />
            <h2 className={`text-xl font-semibold transition-colors duration-300 ${
              isDark ? 'text-white' : 'text-gray-800'
            }`}>Search & Filter</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="ml-auto"
            >
              <Filter className="w-4 h-4" />
            </Button>
          </div>
          
          <div className="flex flex-wrap gap-4">
            <Input
              type="text"
              placeholder="Search by store name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={`flex-1 min-w-[200px] transition-all duration-300 ${
                isDark 
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                  : 'bg-white border-gray-300'
              }`}
            />
            
            {showFilters && (
              <>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className={`px-4 py-2 rounded-lg border transition-all duration-300 ${
                    isDark 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-white border-gray-300'
                  }`}
                >
                  <option value="">All Categories</option>
                  {categories.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>

                <select
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className={`px-4 py-2 rounded-lg border transition-all duration-300 ${
                    isDark 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-white border-gray-300'
                  }`}
                >
                  <option value="">All Locations</option>
                  {locations.map((l) => (
                    <option key={l} value={l}>{l}</option>
                  ))}
                </select>
              </>
            )}
          </div>
        </div>

        {/* Stores Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className={`rounded-xl shadow-lg border overflow-hidden animate-pulse transition-all duration-300 ${
                  isDark 
                    ? 'bg-gray-800 border-gray-700' 
                    : 'bg-white border-gray-100'
                }`}
              >
                <div className="p-6">
                  <div className="w-12 h-12 bg-gray-200 rounded-full mb-4" />
                  <div className="h-6 bg-gray-200 rounded w-2/3 mb-2" />
                  <div className="h-4 bg-gray-200 rounded w-1/2 mb-1" />
                  <div className="h-4 bg-gray-200 rounded w-1/3" />
                  <div className="mt-6 h-10 bg-gray-200 rounded-lg" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredStores.length === 0 ? (
          <div className="text-center py-20">
            <StoreIcon className={`w-16 h-16 mx-auto mb-4 transition-colors duration-300 ${
              isDark ? 'text-gray-600' : 'text-gray-400'
            }`} />
            <p className={`text-lg transition-colors duration-300 ${
              isDark ? 'text-gray-400' : 'text-gray-600'
            }`}>
              {allStores.length === 0 
                ? 'No stores available in the system.' 
                : 'All available stores are already being tracked!'
              }
            </p>
            {allStores.length > 0 && (
              <Button
                onClick={() => router.push('/admin/tracked_stores')}
                className="mt-4 bg-gradient-to-r from-indigo-500 to-teal-500 hover:from-indigo-600 hover:to-teal-600 text-white"
              >
                View Tracked Stores
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredStores.map((store) => (
              <motion.div
                key={store.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`relative rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border overflow-hidden group ${
                  isDark 
                    ? 'bg-gray-800 border-gray-700 hover:shadow-gray-900/50' 
                    : 'bg-white border-gray-100'
                }`}
              >
                {/* AVAILABLE badge */}
                <div className={`absolute top-3 left-3 px-2 py-1 rounded-full text-xs font-semibold z-10 transition-all duration-300 ${
                  isDark 
                    ? 'bg-blue-900/50 text-blue-300 border border-blue-700' 
                    : 'bg-blue-100 text-blue-700'
                }`}>
                  AVAILABLE
                </div>
                {/* Phone icon top right */}
                {store.phone_number && (
                  <a
                    href={`tel:${store.phone_number}`}
                    aria-label="Call Store Manager"
                    className={`absolute top-3 right-3 z-10 rounded-full w-9 h-9 flex items-center justify-center shadow-md transition-colors duration-200
                      ${isDark ? 'bg-gray-800 shadow-gray-900 text-green-400 hover:bg-green-500 hover:text-white' : 'bg-white shadow-md text-green-500 hover:bg-green-500 hover:text-white'}`}
                  >
                    <Phone className="w-5 h-5" />
                  </a>
                )}
                {/* Card Content */}
                <div className="p-6 flex flex-col h-full">
                  {/* Icon */}
                  <div className={`w-14 h-14 flex items-center justify-center mx-auto mb-4 rounded-full border-2 group-hover:scale-110 transition-all duration-300 ${
                    isDark 
                      ? 'bg-gradient-to-br from-gray-700 to-gray-600 border-gray-600' 
                      : 'bg-gradient-to-br from-indigo-50 to-teal-50 border-indigo-100'
                  }`}>
                    <StoreIcon className={`w-8 h-8 transition-colors duration-300 ${
                      isDark ? 'text-gray-300' : 'text-indigo-600'
                    }`} />
                  </div>
                  
                  {/* Title */}
                  <h3 className={`text-lg font-bold text-center mb-3 line-clamp-2 transition-colors duration-300 ${
                    isDark ? 'text-white' : 'text-gray-800'
                  }`}>{store.name}</h3>
                  
                  {/* Details */}
                  <div className="space-y-2 mb-4">
                    <div className="text-center">
                      <p className={`text-xs mb-1 transition-colors duration-300 ${
                        isDark ? 'text-gray-400' : 'text-gray-500'
                      }`}>Category</p>
                      <p className={`text-sm font-semibold transition-colors duration-300 ${
                        isDark ? 'text-blue-400' : 'text-indigo-600'
                      }`}>{store.category}</p>
                    </div>
                    <div className="text-center">
                      <p className={`text-xs mb-1 transition-colors duration-300 ${
                        isDark ? 'text-gray-400' : 'text-gray-500'
                      }`}>Location</p>
                      <p className={`text-sm font-semibold transition-colors duration-300 ${
                        isDark ? 'text-emerald-400' : 'text-emerald-600'
                      }`}>📍 {store.location}</p>
                    </div>
                  </div>
                  
                  {/* Track Button */}
                  <div className="mt-auto">
                    <Button
                      variant="default"
                      onClick={() => handleTrack(store.id)}
                      disabled={tracking === store.id}
                      className="w-full h-11 font-semibold rounded-lg bg-gradient-to-r from-indigo-500 to-teal-500 hover:from-indigo-600 hover:to-teal-600 text-white transition-all duration-300 transform hover:scale-[1.02] shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                    >
                      {tracking === store.id ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Tracking...
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4 mr-2" />
                          Track Store
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-center mt-12">
          <Button
            variant="outline"
            onClick={() => router.push('/admin/tracked_stores')}
            className={`transition-all duration-300 ${
              isDark 
                ? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
                : 'border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            ← Back to Tracked Stores
          </Button>
        </div>
      </div>
    </div>
  );
}
