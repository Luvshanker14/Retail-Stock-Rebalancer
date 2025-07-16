'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { motion } from 'framer-motion';
import { 
  Store, 
  Package, 
  ShoppingCart, 
  TrendingUp, 
  Users, 
  DollarSign,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  Plus,
  BarChart3,
  ExternalLink,
  Box,
  AlertTriangle,
  Clock,
  CheckCircle,
  Info,
  Activity as ActivityIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import LogoutButton from '@/components/LogoutButton';
import PasswordChangeButton from '@/components/PasswordChangeButton';
import ProfileAvatar from '@/components/ProfileAvatar';
import { useDarkMode } from '@/hooks/useDarkMode';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import useAuth from '@/hooks/useAuth';

interface DashboardStats {
  totalStores: number;
  totalStock: number;
  totalPurchases: number;
  totalRevenue: number;
  activeUsers: number;
  stockAlerts: number;
  recentActivity: Array<{
    id: string;
    type: string;
    message: string;
    timestamp: string;
    store?: string;
  }>;
  topStores: Array<{
    id: number;
    name: string;
    sales: number;
    revenue: number;
  }>;
}

export default function AdminDashboard() {
  const { loading: authLoading, adminEmail } = useAuth();
  const [stats, setStats] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [showLowStock, setShowLowStock] = useState(false);
  const [lowStockItems, setLowStockItems] = useState<any[]>([]);
  const router = useRouter();
  const { isDark } = useDarkMode();
  const [rebalanceOpen, setRebalanceOpen] = useState(false);
  const [rebalanceItem, setRebalanceItem] = useState<any>(null);
  const [rebalanceQty, setRebalanceQty] = useState(0);
  const [rebalanceLoading, setRebalanceLoading] = useState(false);
  const [rebalanceError, setRebalanceError] = useState('');
  const [rebalanceSuccess, setRebalanceSuccess] = useState('');
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [topStores, setTopStores] = useState<any[]>([]);
  const [showTrackedStores, setShowTrackedStores] = useState(false);
  const [trackedStores, setTrackedStores] = useState<any[]>([]);

  useEffect(() => {
    if (authLoading) return; // Wait for auth check
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem('adminToken');
        const res = await api.get('/admin/dashboard', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setStats(res.data);
      } catch (error) {
        console.error('Failed to fetch dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();

    // Fetch recent activities
    const fetchActivities = async () => {
      try {
        const token = localStorage.getItem('adminToken');
        const res = await api.get('/admin/recent-activity', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setRecentActivities(res.data.activities || []);
      } catch (error) {
        console.error('Failed to fetch recent activities:', error);
      }
    };
    fetchActivities();

    // Fetch top performing stores
    const fetchTopStores = async () => {
      try {
        const token = localStorage.getItem('adminToken');
        const res = await api.get('/admin/top-stores', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setTopStores(res.data.topStores || []);
      } catch (error) {
        console.error('Failed to fetch top stores:', error);
      }
    };
    fetchTopStores();
  }, [authLoading]);

  const handleShowLowStock = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const res = await api.get('/admin/low-stock', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setLowStockItems(res.data.lowStockItems || []);
      setShowLowStock(true);
    } catch (error) {
      console.error('Failed to fetch low stock items:', error);
    }
  };

  const handleRebalanceClick = (item: any) => {
    const minQty = 11 - item.quantity;
    setRebalanceItem(item);
    setRebalanceQty(minQty);
    setRebalanceError('');
    setRebalanceSuccess('');
    setRebalanceOpen(true);
  };

  const handleRebalanceSubmit = async () => {
    if (!rebalanceItem) return;
    const minQty = 11 - rebalanceItem.quantity;
    if (rebalanceQty < minQty) {
      setRebalanceError(`Quantity must be at least ${minQty}`);
      return;
    }
    setRebalanceLoading(true);
    setRebalanceError('');
    setRebalanceSuccess('');
    try {
      const token = localStorage.getItem('adminToken');
      await api.post('/admin/rebalance-stock', {
        stock_id: rebalanceItem.stock_id,
        store_id: rebalanceItem.store_id,
        quantityToAdd: rebalanceQty,
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRebalanceSuccess('Stock rebalanced successfully!');
      // Refresh low stock list
      await handleShowLowStock();
      setTimeout(() => setRebalanceOpen(false), 1200);
    } catch (error: any) {
      setRebalanceError(error?.response?.data?.error || 'Failed to rebalance stock');
    } finally {
      setRebalanceLoading(false);
    }
  };

  const handleShowTrackedStores = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const res = await api.get('/stores/tracked', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTrackedStores(res.data);
      setShowTrackedStores(true);
    } catch (error) {
      console.error('Failed to fetch tracked stores:', error);
    }
  };

  const StatCard = ({ 
    title, 
    value, 
    icon: Icon, 
    trend, 
    trendValue, 
    color 
  }: {
    title: string;
    value: string | number;
    icon: any;
    trend?: 'up' | 'down';
    trendValue?: string;
    color: string;
  }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl p-6 shadow-lg border transition-all duration-300 ${
        isDark 
          ? 'bg-gray-800 border-gray-700 hover:shadow-gray-900/50' 
          : 'bg-white border-gray-100 hover:shadow-xl'
      }`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-sm font-medium ${
            trend === 'up' ? 'text-green-600' : 'text-red-600'
          }`}>
            {trend === 'up' ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
            {trendValue}
          </div>
        )}
      </div>
      <h3 className={`text-2xl font-bold mb-1 transition-colors duration-300 ${
        isDark ? 'text-white' : 'text-gray-900'
      }`}>{value}</h3>
      <p className={`text-sm transition-colors duration-300 ${
        isDark ? 'text-gray-400' : 'text-gray-600'
      }`}>{title}</p>
    </motion.div>
  );

  const ActivityItem = ({ activity }: { activity: any }) => {
    const getIcon = (type: string) => {
      switch (type) {
        case 'purchase': return <ShoppingCart className="w-4 h-4" />;
        case 'stock': return <Package className="w-4 h-4" />;
        case 'store': return <Store className="w-4 h-4" />;
        case 'user': return <Users className="w-4 h-4" />;
        default: return <Activity className="w-4 h-4" />;
      }
    };

    const getColor = (type: string) => {
      switch (type) {
        case 'purchase': return 'bg-green-100 text-green-600';
        case 'stock': return 'bg-orange-100 text-orange-600';
        case 'store': return 'bg-blue-100 text-blue-600';
        case 'user': return 'bg-purple-100 text-purple-600';
        default: return 'bg-gray-100 text-gray-600';
      }
    };

    return (
      <div className={`flex items-start gap-3 p-3 rounded-lg transition-colors ${
        isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
      }`}>
        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${getColor(activity.type)}`}>
          {getIcon(activity.type)}
        </div>
        <div className="flex-1">
          <p className={`text-sm font-medium transition-colors duration-300 ${
            isDark ? 'text-white' : 'text-gray-900'
          }`}>{activity.message}</p>
          <p className={`text-xs transition-colors duration-300 ${
            isDark ? 'text-gray-400' : 'text-gray-500'
          }`}>{activity.timestamp}</p>
        </div>
      </div>
    );
  };

  // Helper to get icon and color for event type
  const getEventIcon = (type: string) => {
    switch (type) {
      case 'stock-purchased':
        return <ShoppingCart className="w-5 h-5 text-green-500" />;
      case 'LOW_STOCK':
        return <AlertTriangle className="w-5 h-5 text-red-500" />;
      case 'stock-added':
        return <Box className="w-5 h-5 text-blue-500" />;
      case 'stock-updated':
        return <TrendingUp className="w-5 h-5 text-indigo-500" />;
      case 'store-added':
        return <Store className="w-5 h-5 text-purple-500" />;
      case 'stock-removed':
        return <Info className="w-5 h-5 text-gray-500" />;
      default:
        return <ActivityIcon className="w-5 h-5 text-gray-400" />;
    }
  };

  // Add getLogStyle for event badge coloring
  const getLogStyle = (event: string) => {
    switch (event) {
      case 'stock_added':
      case 'stock-added':
        return 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-300';
      case 'stock_updated':
      case 'stock-updated':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300';
      case 'stock_deleted':
      case 'stock-removed':
        return 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-300';
      case 'purchase_made':
      case 'stock-purchased':
        return 'bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300';
      case 'LOW_STOCK':
        return 'bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-300';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-300';
    }
  };

  if (authLoading || loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center transition-all duration-300 ${
        isDark 
          ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900' 
          : 'bg-gradient-to-br from-gray-50 to-blue-50'
      }`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className={`transition-colors duration-300 ${
            isDark ? 'text-gray-400' : 'text-gray-600'
          }`}>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-all duration-300 ${
      isDark 
        ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900' 
        : 'bg-gradient-to-br from-gray-50 to-blue-50'
    } pb-12`}>
      {/* Header */}
      <div className={`border-b transition-all duration-300 ${
        isDark 
          ? 'bg-gray-800/80 border-gray-700' 
          : 'bg-white border-gray-200'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className={`text-3xl font-bold transition-colors duration-300 ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}>Admin Dashboard</h1>
              <p className={`mt-1 transition-colors duration-300 ${
                isDark ? 'text-gray-400' : 'text-gray-600'
              }`}>Welcome back! Here's what's happening with your stores.</p>
            </div>
            <div className="flex items-center gap-4">
              <Button
                onClick={() => router.push('/admin/tracked_stores')}
                className="bg-gradient-to-r from-indigo-500 to-teal-500 hover:from-indigo-600 hover:to-teal-600 text-white"
              >
                <Eye className="w-4 h-4 mr-2" />
                Tracked Stores
              </Button>
              <Button
                onClick={() => router.push('/admin/stores')}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Manage Stores
              </Button>
              <PasswordChangeButton 
                userType="admin" 
                variant="icon" 
                className="mr-2"
              />
              <LogoutButton variant="gradient" size="sm" />
              <ProfileAvatar />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <button
            onClick={handleShowTrackedStores}
            className="bg-transparent border-none p-0 w-full text-left focus:outline-none"
            style={{ appearance: 'none' }}
          >
            <StatCard
              title="Total Tracked Stores"
              value={stats.totalTrackedStores ?? 0}
              icon={Store}
              trend="up"
              trendValue=""
              color="bg-blue-500"
            />
          </button>
          <StatCard
            title="Total Stock Items"
            value={stats.totalStockItems ?? 0}
            icon={Package}
            trend="up"
            trendValue=""
            color="bg-green-500"
          />
          <StatCard
            title="Purchases (after last payout)"
            value={stats.totalPurchases ?? 0}
            icon={ShoppingCart}
            trend="up"
            trendValue=""
            color="bg-purple-500"
          />
          <StatCard
            title="Revenue (after last payout)"
            value={`₹${stats.totalRevenue?.toLocaleString() ?? 0}`}
            icon={DollarSign}
            trend="up"
            trendValue=""
            color="bg-emerald-500"
          />
          <StatCard
            title="Earnings (after last payout)" 
            value={`₹${stats.earningsAfterCommission?.toLocaleString() ?? 0}`}
            icon={TrendingUp}
            trend="up"
            trendValue=""
            color="bg-orange-500"
          />
          <button
            className="bg-transparent border-none p-0 w-full text-left focus:outline-none"
            style={{ appearance: 'none' }}
            onClick={handleShowLowStock}
          >
            <StatCard
              title="Stock Alerts"
              value={stats.stockAlerts ?? 0}
              icon={AlertTriangle}
              trend="down"
              trendValue=""
              color="bg-red-500"
            />
          </button>
        </div>

        {/* Additional dashboard sections (recent activity, top stores, etc.) are removed for now */}
      </div>

      {/* Low Stock Modal */}
      <Dialog open={showLowStock} onOpenChange={setShowLowStock}>
        <DialogContent>
          <DialogTitle>Low Stock Items</DialogTitle>
          {lowStockItems.length === 0 ? (
            <div className="text-gray-500 py-4">No low stock items!</div>
          ) : (
            <div className="py-2">
              <table className="min-w-full text-sm">
                <thead>
                  <tr>
                    <th className="text-left px-2 py-1">Product</th>
                    <th className="text-left px-2 py-1">Store</th>
                    <th className="text-left px-2 py-1">Quantity</th>
                    <th className="text-left px-2 py-1">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {lowStockItems.map((item, idx) => {
                    const minQty = 11 - item.quantity;
                    return (
                      <tr key={item.stock_id || idx}>
                        <td className="px-2 py-1">{item.product_name}</td>
                        <td className="px-2 py-1">{item.store_name}</td>
                        <td className="px-2 py-1">{item.quantity}</td>
                        <td className="px-2 py-1">
                          <button
                            className="px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                            onClick={() => handleRebalanceClick(item)}
                          >
                            Rebalance
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          <div className="flex justify-end mt-4">
            <button
              className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
              onClick={() => setShowLowStock(false)}
            >
              Close
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Rebalance Dialog */}
      <Dialog open={rebalanceOpen} onOpenChange={setRebalanceOpen}>
        <DialogContent>
          <DialogTitle>Rebalance Stock</DialogTitle>
          {rebalanceItem && (
            <div className="space-y-4">
              <div>
                <div className="font-medium">{rebalanceItem.product_name}</div>
                <div className="text-sm text-gray-500">Store: {rebalanceItem.store_name}</div>
                <div className="text-sm text-gray-500">Current Quantity: {rebalanceItem.quantity}</div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Quantity to Add</label>
                <input
                  type="number"
                  min={11 - rebalanceItem.quantity}
                  value={rebalanceQty}
                  onChange={e => setRebalanceQty(Number(e.target.value))}
                  className="border rounded px-2 py-1 w-32"
                />
                <span className="ml-2 text-xs text-gray-400">(min {11 - rebalanceItem.quantity})</span>
              </div>
              {rebalanceError && <div className="text-red-500 text-sm">{rebalanceError}</div>}
              {rebalanceSuccess && <div className="text-green-600 text-sm">{rebalanceSuccess}</div>}
              <div className="flex justify-end space-x-2">
                <button
                  className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
                  onClick={() => setRebalanceOpen(false)}
                  disabled={rebalanceLoading}
                >
                  Cancel
                </button>
                <button
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  onClick={handleRebalanceSubmit}
                  disabled={rebalanceLoading}
                >
                  {rebalanceLoading ? 'Rebalancing...' : 'Rebalance'}
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Top Performing Stores & Recent Activities Side by Side */}
      <div className="mt-10 max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Top Performing Stores Section */}
        <div className="backdrop-blur rounded-2xl shadow-lg border p-6 bg-white/80 dark:bg-gray-900/80 border-indigo-100 dark:border-gray-700">
          <h2 className="text-lg font-semibold mb-4">Top Performing Stores</h2>
          {topStores.length === 0 ? (
            <div className="text-gray-500">No data available.</div>
          ) : (
            <table className="min-w-full text-sm">
              <thead>
                <tr>
                  <th className="px-4 py-2 text-left">#</th>
                  <th className="px-4 py-2 text-left">Store</th>
                  <th className="px-4 py-2 text-left">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {topStores.map((store, idx) => (
                  <tr
                    key={store.store_id || idx}
                    className={`border-b last:border-0 transition-colors ${
                      idx === 0
                        ? 'bg-yellow-50 dark:bg-yellow-900/20'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                  >
                    <td className="px-4 py-2 font-bold text-center align-middle">
                      <span className={`inline-block w-7 h-7 rounded-full text-xs font-bold leading-7 align-middle ${
                        idx === 0
                          ? 'bg-yellow-400 text-white'
                          : idx === 1
                          ? 'bg-gray-400 text-white'
                          : idx === 2
                          ? 'bg-orange-400 text-white'
                          : 'bg-gray-200 text-gray-700'
                      }`}>
                        {idx + 1}
                      </span>
                    </td>
                    <td className="px-4 py-2 font-medium flex items-center gap-2">
                      <Store className="w-4 h-4 mr-1 text-blue-500" />
                      {store.store_name}
                    </td>
                    <td className="px-4 py-2 font-semibold text-lg text-emerald-600 dark:text-emerald-400">
                      ₹{Number(store.revenue).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        {/* Recent Activities Section */}
        <div className="backdrop-blur rounded-2xl shadow-lg border p-6 transition-all duration-300 bg-white/80 dark:bg-gray-900/80 border-indigo-100 dark:border-gray-700">
          <h2 className="text-lg font-semibold mb-4">Recent Activities</h2>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {recentActivities.length === 0 ? (
              <div className="text-center py-8">
                <ActivityIcon className={`w-12 h-12 mx-auto mb-4 transition-colors duration-300 text-gray-400 dark:text-gray-600`} />
                <p className="text-gray-500 dark:text-gray-400">No recent activities found.</p>
              </div>
            ) : (
              recentActivities.slice(0, 10).map((activity, idx) => {
                let payload: any = {};
                try {
                  payload = JSON.parse(activity.payload);
                } catch {}
                const eventType = activity.event_type || payload?.event || payload?.type || 'Event';
                // Capitalize event name for display
                const eventLabel = eventType.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase());
                return (
                  <div
                    key={activity.id || idx}
                    className="p-3 rounded-lg border transition-all duration-300 bg-white dark:bg-gray-700/50 border-gray-200 dark:border-gray-600"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-800 dark:text-white">
                          {eventLabel}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Store: <span className="font-semibold">{activity.store_name || '-'}</span> | Product: <span className="font-semibold">{activity.stock_name || '-'}</span>
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          {activity.timestamp ? new Date(activity.timestamp).toLocaleString() : (payload?.timestamp ? new Date(payload?.timestamp).toLocaleString() : '')}
                        </p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getLogStyle(eventType)}`}> {eventType} </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Tracked Stores Modal */}
      <Dialog open={showTrackedStores} onOpenChange={setShowTrackedStores}>
        <DialogContent>
          <DialogTitle>Tracked Stores</DialogTitle>
          {trackedStores.length === 0 ? (
            <div className="text-gray-500 py-4">No tracked stores!</div>
          ) : (
            <div className="py-2">
              <table className="min-w-full text-sm">
                <thead>
                  <tr>
                    <th className="text-left px-2 py-1">Name</th>
                    <th className="text-left px-2 py-1">Category</th>
                    <th className="text-left px-2 py-1">Location</th>
                    <th className="text-left px-2 py-1">Phone</th>
                    <th className="text-left px-2 py-1">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {trackedStores.map((store, idx) => (
                    <tr key={store.id || idx}>
                      <td className="px-2 py-1 font-semibold">{store.name}</td>
                      <td className="px-2 py-1">{store.category}</td>
                      <td className="px-2 py-1">{store.location}</td>
                      <td className="px-2 py-1">
                        {store.phone_number ? (
                          <a
                            href={`tel:${store.phone_number}`}
                            aria-label="Call Store Manager"
                            className="inline-flex items-center justify-center rounded-full w-8 h-8 bg-green-50 text-green-600 hover:bg-green-500 hover:text-white transition-colors"
                          >
                            <Store className="w-4 h-4" />
                          </a>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-2 py-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => router.push(`/admin/stores/${store.id}`)}
                        >
                          View Details
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="flex justify-end mt-4">
            <button
              className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
              onClick={() => setShowTrackedStores(false)}
            >
              Close
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
