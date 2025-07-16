'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { motion } from 'framer-motion';
import { Store as StoreIcon, Eye, Plus, Package, TrendingUp, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
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

export default function TrackedStoresPage() {
  const { loading: authLoading } = useAuth();
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();
  const { isDark } = useDarkMode();

  useEffect(() => {
    if (authLoading) return; // Wait for auth check
    const fetchTrackedStores = async () => {
      try {
        const token = localStorage.getItem('adminToken');
        const res = await api.get('/stores/tracked', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setStores(res.data);
      } catch (err) {
        console.error(err);
        setError('Failed to fetch tracked stores');
      } finally {
        setLoading(false);
      }
    };
    fetchTrackedStores();
  }, [authLoading]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-400">Loading tracked stores...</p>
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
            }`}>Tracked Stores</h1>
            <p className={`transition-colors duration-300 ${
              isDark ? 'text-gray-400' : 'text-indigo-400'
            }`}>Monitor and manage stores that are currently being tracked. Click "View Store" to see details and analytics.</p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              onClick={() => router.push('/admin/stores')}
              className="bg-gradient-to-r from-indigo-500 to-teal-500 hover:from-indigo-600 hover:to-teal-600 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Track More Stores
            </Button>
            <LogoutButton variant="gradient" size="sm" />
            <ProfileAvatar />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats Overview */}
        <div className={`backdrop-blur rounded-2xl shadow-lg border p-6 mb-8 transition-all duration-300 ${
          isDark 
            ? 'bg-gray-800/80 border-gray-700' 
            : 'bg-white/80 border-indigo-100'
        }`}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className={`w-12 h-12 mx-auto mb-3 rounded-full flex items-center justify-center transition-all duration-300 ${
                isDark 
                  ? 'bg-blue-500/20 text-blue-400' 
                  : 'bg-blue-100 text-blue-600'
              }`}>
                <StoreIcon className="w-6 h-6" />
              </div>
              <h3 className={`text-2xl font-bold transition-colors duration-300 ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}>{stores.length}</h3>
              <p className={`text-sm transition-colors duration-300 ${
                isDark ? 'text-gray-400' : 'text-gray-600'
              }`}>Total Tracked</p>
            </div>
            <div className="text-center">
              <div className={`w-12 h-12 mx-auto mb-3 rounded-full flex items-center justify-center transition-all duration-300 ${
                isDark 
                  ? 'bg-green-500/20 text-green-400' 
                  : 'bg-green-100 text-green-600'
              }`}>
                <Package className="w-6 h-6" />
              </div>
              <h3 className={`text-2xl font-bold transition-colors duration-300 ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}>{stores.length * 15}</h3>
              <p className={`text-sm transition-colors duration-300 ${
                isDark ? 'text-gray-400' : 'text-gray-600'
              }`}>Total Items</p>
            </div>
            <div className="text-center">
              <div className={`w-12 h-12 mx-auto mb-3 rounded-full flex items-center justify-center transition-all duration-300 ${
                isDark 
                  ? 'bg-purple-500/20 text-purple-400' 
                  : 'bg-purple-100 text-purple-600'
              }`}>
                <TrendingUp className="w-6 h-6" />
              </div>
              <h3 className={`text-2xl font-bold transition-colors duration-300 ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}>+12%</h3>
              <p className={`text-sm transition-colors duration-300 ${
                isDark ? 'text-gray-400' : 'text-gray-600'
              }`}>Growth Rate</p>
            </div>
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
        ) : error ? (
          <div className="text-center py-20">
            <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center transition-colors duration-300 ${
              isDark 
                ? 'bg-red-500/20 text-red-400' 
                : 'bg-red-100 text-red-600'
            }`}>
              <StoreIcon className="w-8 h-8" />
            </div>
            <h3 className={`text-xl font-semibold mb-2 transition-colors duration-300 ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}>Error Loading Stores</h3>
            <p className={`transition-colors duration-300 ${
              isDark ? 'text-gray-400' : 'text-gray-600'
            }`}>{error}</p>
            <Button
              onClick={() => window.location.reload()}
              className="mt-4 bg-gradient-to-r from-indigo-500 to-teal-500 hover:from-indigo-600 hover:to-teal-600 text-white"
            >
              Try Again
            </Button>
          </div>
        ) : stores.length === 0 ? (
          <div className="text-center py-20">
            <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center transition-colors duration-300 ${
              isDark 
                ? 'bg-gray-500/20 text-gray-400' 
                : 'bg-gray-100 text-gray-400'
            }`}>
              <StoreIcon className="w-8 h-8" />
            </div>
            <h3 className={`text-xl font-semibold mb-2 transition-colors duration-300 ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}>No Tracked Stores</h3>
            <p className={`mb-6 transition-colors duration-300 ${
              isDark ? 'text-gray-400' : 'text-gray-600'
            }`}>Start tracking stores to monitor their inventory and performance.</p>
            <Button
              onClick={() => router.push('/admin/stores')}
              className="bg-gradient-to-r from-indigo-500 to-teal-500 hover:from-indigo-600 hover:to-teal-600 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Browse All Stores
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {stores.map((store, index) => (
              <motion.div
                key={store.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`relative rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border overflow-hidden group cursor-pointer ${
                  isDark 
                    ? 'bg-gray-800 border-gray-700 hover:shadow-gray-900/50' 
                    : 'bg-white border-gray-100'
                }`}
                onClick={() => router.push(`/admin/stores/${store.id}`)}
              >
                {/* TRACKED badge */}
                <div className={`absolute top-3 left-3 px-2 py-1 rounded-full text-xs font-semibold z-10 transition-all duration-300 ${
                  isDark 
                    ? 'bg-green-900/50 text-green-300 border border-green-700' 
                    : 'bg-green-100 text-green-700'
                }`}>
                  TRACKED
                </div>
                {/* Phone icon top right */}
                {store.phone_number && (
                  <a
                    href={`tel:${store.phone_number}`}
                    aria-label="Call Store Manager"
                    className={`absolute top-3 right-3 z-10 rounded-full w-9 h-9 flex items-center justify-center shadow-md transition-colors duration-200
                      ${isDark ? 'bg-gray-800 shadow-gray-900 text-green-400 hover:bg-green-500 hover:text-white' : 'bg-white shadow-md text-green-500 hover:bg-green-500 hover:text-white'}`}
                    onClick={e => e.stopPropagation()}
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
                  
                  {/* Action Button */}
                  <div className="mt-auto">
                    <Button
                      variant="outline"
                      className={`w-full h-11 font-semibold rounded-lg transition-all duration-300 transform hover:scale-[1.02] shadow-md hover:shadow-lg ${
                        isDark 
                          ? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
                          : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View Details
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Quick Actions */}
        {stores.length > 0 && (
          <div className={`mt-12 backdrop-blur rounded-2xl shadow-lg border p-6 transition-all duration-300 ${
            isDark 
              ? 'bg-gray-800/80 border-gray-700' 
              : 'bg-white/80 border-indigo-100'
          }`}>
            <h2 className={`text-xl font-semibold mb-4 transition-colors duration-300 ${
              isDark ? 'text-white' : 'text-gray-800'
            }`}>Quick Actions</h2>
            <div className="flex flex-wrap gap-4">
              <Button
                onClick={() => router.push('/admin/stores')}
                variant="outline"
                className={`transition-all duration-300 ${
                  isDark 
                    ? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Plus className="w-4 h-4 mr-2" />
                Track More Stores
              </Button>
              <Button
                onClick={() => router.push('/admin/dashboard')}
                variant="outline"
                className={`transition-all duration-300 ${
                  isDark 
                    ? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <TrendingUp className="w-4 h-4 mr-2" />
                View Analytics
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

