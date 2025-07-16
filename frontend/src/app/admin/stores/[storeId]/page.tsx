"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/api";
import { Loader, Package, DollarSign, AlertTriangle, Activity, Plus, Edit, Trash2, ArrowLeft, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { useDarkMode } from "@/hooks/useDarkMode";
import LogoutButton from "@/components/LogoutButton";
import { toast } from "react-hot-toast";
import ProfileAvatar from '@/components/ProfileAvatar';
import useAuth from '@/hooks/useAuth';

type Stock = {
  id: number;
  name: string;
  quantity: number;
  price: number;
};

type KafkaEvent = {
  event: string;
  timestamp: string;
  [key: string]: any;
};

// Add store type
type StoreDetails = {
  id: number;
  name: string;
  category: string;
  location: string;
  phone_number?: string;
};

export default function StoreStocksPage() {
  const params = useParams();
  const router = useRouter();
  const { isDark } = useDarkMode();
  const { loading: authLoading } = useAuth();

  const storeId = params.storeId as string;
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [logs, setLogs] = useState<KafkaEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showUpdateForm, setShowUpdateForm] = useState(false);
  const [editingStock, setEditingStock] = useState<Stock | null>(null);
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState(0);
  const [price, setPrice] = useState(0);
  const [store, setStore] = useState<StoreDetails | null>(null);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-400">Loading store details...</p>
      </div>
    );
  }

  const fetchStocks = async () => {
    try {
      console.log('Admin: Fetching stocks for store ID:', storeId);
      console.log('Admin: Making API call to:', `/stores/${storeId}/stocks`);
      
      // Check if admin token exists
      const token = localStorage.getItem('adminToken');
      console.log('Admin: Token exists:', !!token);
      if (token) {
        console.log('Admin: Token preview:', token.substring(0, 20) + '...');
      }
      
      const res = await api.get(`/stores/${storeId}/stocks`);
      console.log('Admin: API response:', res.data);
      setStocks(res.data);
    } catch (err: any) {
      console.error('Admin: Failed to load stocks', err);
      console.error('Admin: Error details:', err.response?.data);
      console.error('Admin: Error status:', err.response?.status);
      toast.error('Failed to load stocks');
    } finally {
      setLoading(false);
    }
  };

  const fetchLogs = async () => {
    try {
      console.log('Admin: Fetching logs for store ID:', storeId);
      console.log('Admin: Making API call to:', `/stores/${storeId}/logs`);
      const res = await api.get(`/stores/${storeId}/logs`);
      console.log('Admin: Logs API response:', res.data);
      setLogs(res.data);
    } catch (err: any) {
      console.error('Admin: Failed to load logs', err);
      console.error('Admin: Logs error details:', err.response?.data);
      toast.error('Failed to load activity logs');
    }
  };

  // Fetch store details
  const fetchStore = async () => {
    try {
      const res = await api.get(`/stores/${storeId}`);
      setStore(res.data);
    } catch (err) {
      toast.error('Failed to load store details');
    }
  };
  useEffect(() => {
    fetchStore();
  }, []);

  useEffect(() => {
    fetchStocks();
    fetchLogs();
  }, []);

  const handleAdd = async () => {
    if (!name || quantity <= 0 || price <= 0) {
      toast.error('Please fill in all fields with valid values');
      return;
    }

    try {
      await api.post(`/stores/${storeId}/stocks`, { name, quantity, price });
      toast.success('Stock added successfully');
      setName('');
      setQuantity(0);
      setPrice(0);
      setShowAddForm(false);
      fetchStocks();
      fetchLogs();
    } catch (err: any) {
      toast.error('Error adding stock');
      console.error('Add stock error:', err);
    }
  };

  const handleUpdate = async (id: number, quantity: number, price: number) => {
    try {
      await api.put(`/stores/${storeId}/stocks/${id}`, { quantity, price });
      toast.success('Stock updated successfully');
      fetchStocks();
      fetchLogs();
    } catch (err: any) {
      toast.error('Error updating stock');
      console.error('Update stock error:', err);
    }
  };

  const openUpdateForm = (stock: Stock) => {
    setEditingStock(stock);
    setName(stock.name);
    setQuantity(stock.quantity);
    setPrice(stock.price);
    setShowUpdateForm(true);
  };

  const handleUpdateSubmit = async () => {
    if (!editingStock || !name || quantity <= 0 || price <= 0) {
      toast.error('Please fill in all fields with valid values');
      return;
    }

    try {
      await api.put(`/stores/${storeId}/stocks/${editingStock.id}`, { quantity, price });
      toast.success('Stock updated successfully');
      setShowUpdateForm(false);
      setEditingStock(null);
      setName('');
      setQuantity(0);
      setPrice(0);
      fetchStocks();
      fetchLogs();
    } catch (err: any) {
      toast.error('Error updating stock');
      console.error('Update stock error:', err);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this stock item?')) return;
    
    try {
      await api.delete(`/stores/${storeId}/stocks/${id}`);
      toast.success('Stock deleted successfully');
      setStocks((prev) => prev.filter((s) => s.id !== id));
      fetchLogs();
    } catch (err: any) {
      toast.error('Error deleting stock');
      console.error('Delete stock error:', err);
    }
  };

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

  const totalValue = stocks.reduce((sum, stock) => sum + (stock.quantity * stock.price), 0);
  const lowStockItems = stocks.filter(stock => stock.quantity < 10);

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
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => router.back()}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            <LogoutButton variant="gradient" size="sm" />
            <ProfileAvatar />
          </div>
          <div>
            <h1 className={`text-3xl font-extrabold mb-1 tracking-tight transition-colors duration-300 ${
                isDark ? 'text-white' : 'text-indigo-700'
              }`}>Store #{storeId}</h1>
              <p className={`transition-colors duration-300 ${
                isDark ? 'text-gray-400' : 'text-indigo-400'
              }`}>Manage inventory and monitor activity</p>
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className={`w-12 h-12 mx-auto mb-3 rounded-full flex items-center justify-center transition-all duration-300 ${
                isDark 
                  ? 'bg-blue-500/20 text-blue-400' 
                  : 'bg-blue-100 text-blue-600'
              }`}>
                <Package className="w-6 h-6" />
              </div>
              <h3 className={`text-2xl font-bold transition-colors duration-300 ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}>{stocks.length}</h3>
              <p className={`text-sm transition-colors duration-300 ${
                isDark ? 'text-gray-400' : 'text-gray-600'
              }`}>Total Items</p>
            </div>
            <div className="text-center">
              <div className={`w-12 h-12 mx-auto mb-3 rounded-full flex items-center justify-center transition-all duration-300 ${
                isDark 
                  ? 'bg-green-500/20 text-green-400' 
                  : 'bg-green-100 text-green-600'
              }`}>
                <DollarSign className="w-6 h-6" />
              </div>
              <h3 className={`text-2xl font-bold transition-colors duration-300 ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}>₹{totalValue.toLocaleString()}</h3>
              <p className={`text-sm transition-colors duration-300 ${
                isDark ? 'text-gray-400' : 'text-gray-600'
              }`}>Total Value</p>
            </div>
            <div className="text-center">
              <div className={`w-12 h-12 mx-auto mb-3 rounded-full flex items-center justify-center transition-all duration-300 ${
                isDark 
                  ? 'bg-orange-500/20 text-orange-400' 
                  : 'bg-orange-100 text-orange-600'
              }`}>
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className={`text-2xl font-bold transition-colors duration-300 ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}>{lowStockItems.length}</h3>
              <p className={`text-sm transition-colors duration-300 ${
                isDark ? 'text-gray-400' : 'text-gray-600'
              }`}>Low Stock</p>
            </div>
            <div className="text-center">
              <div className={`w-12 h-12 mx-auto mb-3 rounded-full flex items-center justify-center transition-all duration-300 ${
                isDark 
                  ? 'bg-purple-500/20 text-purple-400' 
                  : 'bg-purple-100 text-purple-600'
              }`}>
                <Activity className="w-6 h-6" />
              </div>
              <h3 className={`text-2xl font-bold transition-colors duration-300 ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}>{logs.length}</h3>
              <p className={`text-sm transition-colors duration-300 ${
                isDark ? 'text-gray-400' : 'text-gray-600'
              }`}>Activities</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Stock Management */}
          <div className={`backdrop-blur rounded-2xl shadow-lg border p-6 transition-all duration-300 ${
            isDark 
              ? 'bg-gray-800/80 border-gray-700' 
              : 'bg-white/80 border-indigo-100'
          }`}>
            <div className="flex items-center justify-between mb-6">
              <h2 className={`text-xl font-semibold transition-colors duration-300 ${
                isDark ? 'text-white' : 'text-gray-800'
              }`}>Inventory Management</h2>
              <Button
                onClick={() => setShowAddForm(!showAddForm)}
                className="bg-gradient-to-r from-indigo-500 to-teal-500 hover:from-indigo-600 hover:to-teal-600 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Stock
              </Button>
            </div>

            {/* Add Stock Form */}
            {showAddForm && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className={`p-4 rounded-lg border mb-6 transition-all duration-300 ${
                  isDark 
                    ? 'bg-gray-700/50 border-gray-600' 
                    : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <Input
                    placeholder="Stock Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={`transition-all duration-300 ${
                      isDark 
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                        : 'bg-white border-gray-300'
                    }`}
                  />
                  <Input
                    type="number"
                    placeholder="Quantity"
                    value={quantity || ''}
                    onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
                    className={`transition-all duration-300 ${
                      isDark 
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                        : 'bg-white border-gray-300'
                    }`}
                  />
                  <Input
                    type="number"
                    placeholder="Price (₹)"
                    value={price || ''}
                    onChange={(e) => setPrice(parseInt(e.target.value) || 0)}
                    className={`transition-all duration-300 ${
                      isDark 
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                        : 'bg-white border-gray-300'
                    }`}
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleAdd}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    Add Stock
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowAddForm(false)}
                    className={`transition-all duration-300 ${
                      isDark 
                        ? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
                        : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Cancel
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Stocks List */}
            {loading ? (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className={`h-16 rounded-lg animate-pulse transition-all duration-300 ${
                      isDark ? 'bg-gray-700' : 'bg-gray-200'
                    }`}
                  />
                ))}
              </div>
            ) : stocks.length === 0 ? (
              <div className="text-center py-8">
                <Package className={`w-12 h-12 mx-auto mb-4 transition-colors duration-300 ${
                  isDark ? 'text-gray-600' : 'text-gray-400'
                }`} />
                <p className={`transition-colors duration-300 ${
                  isDark ? 'text-gray-400' : 'text-gray-600'
                }`}>No stock items found. Add your first item to get started.</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                {stocks.map((stock) => (
                  <motion.div
                    key={stock.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-4 rounded-lg border transition-all duration-300 ${
                      isDark 
                        ? 'bg-gray-700/50 border-gray-600' 
                        : 'bg-white border-gray-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className={`font-semibold transition-colors duration-300 ${
                          isDark ? 'text-white' : 'text-gray-800'
                        }`}>{stock.name}</h3>
                        <div className="flex gap-4 mt-1">
                          <span className={`text-sm transition-colors duration-300 ${
                            isDark ? 'text-gray-400' : 'text-gray-600'
                          }`}>
                            Qty: <span className={`font-medium ${
                              stock.quantity < 10 
                                ? isDark ? 'text-orange-400' : 'text-orange-600'
                                : isDark ? 'text-blue-400' : 'text-blue-600'
                            }`}>{stock.quantity}</span>
                          </span>
                          <span className={`text-sm transition-colors duration-300 ${
                            isDark ? 'text-gray-400' : 'text-gray-600'
                          }`}>
                            Price: <span className={`font-medium ${
                              isDark ? 'text-emerald-400' : 'text-emerald-600'
                            }`}>₹{stock.price}</span>
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openUpdateForm(stock)}
                          className={`transition-all duration-300 ${
                            isDark 
                              ? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
                              : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(stock.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-300"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Activity Logs */}
          <div className={`backdrop-blur rounded-2xl shadow-lg border p-6 transition-all duration-300 ${
            isDark 
              ? 'bg-gray-800/80 border-gray-700' 
              : 'bg-white/80 border-indigo-100'
          }`}>
            <h2 className={`text-xl font-semibold mb-6 transition-colors duration-300 ${
              isDark ? 'text-white' : 'text-gray-800'
            }`}>Recent Activity</h2>
            
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {logs.length === 0 ? (
                <div className="text-center py-8">
                  <Activity className={`w-12 h-12 mx-auto mb-4 transition-colors duration-300 ${
                    isDark ? 'text-gray-600' : 'text-gray-400'
                  }`} />
                  <p className={`transition-colors duration-300 ${
                    isDark ? 'text-gray-400' : 'text-gray-600'
                  }`}>No activity logs found.</p>
                </div>
              ) : (
                logs.slice(0, 10).map((log, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`p-3 rounded-lg border transition-all duration-300 ${
                      isDark 
                        ? 'bg-gray-700/50 border-gray-600' 
                        : 'bg-white border-gray-200'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className={`text-sm font-medium transition-colors duration-300 ${
                          isDark ? 'text-white' : 'text-gray-800'
                        }`}>
                          {log.event.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </p>
                        <p className={`text-xs transition-colors duration-300 ${
                          isDark ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                          {new Date(log.timestamp).toLocaleString()}
                        </p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getLogStyle(log.event)}`}>
                        {log.event}
                      </span>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Prometheus/Grafana Stats */}
        <div className="mt-12">
          <h2 className={`text-2xl font-semibold mb-6 text-center transition-colors duration-300 ${
            isDark ? 'text-white' : 'text-gray-800'
          }`}>📊 Store Analytics & Metrics</h2>
          
          <div className="flex flex-wrap gap-6">
            {/* Panel 1 - Stock Operations */}
            <div className="w-full md:w-[48%] aspect-video">
              <div className={`rounded-xl shadow-lg border overflow-hidden transition-all duration-300 ${
                isDark 
                  ? 'bg-gray-800 border-gray-700' 
                  : 'bg-white border-gray-200'
              }`}>
                <div className={`p-4 border-b transition-colors duration-300 ${
                  isDark ? 'border-gray-700' : 'border-gray-200'
                }`}>
                  <h3 className={`font-semibold transition-colors duration-300 ${
                    isDark ? 'text-white' : 'text-gray-800'
                  }`}>Stock Operations Performed</h3>
                </div>
                <iframe
                  src={`http://localhost:3001/d-solo/5afd7397-b08c-46fe-b822-2712e9d9d320/stock-operations-performed?orgId=1&from=now-12h&to=now&refresh=auto&var-store_id=${storeId}&panelId=1&__feature.dashboardSceneSolo`}
                  className="w-full h-full border-0"
                  style={{ height: '300px' }}
                  allowFullScreen
                />
              </div>
            </div>

            {/* Panel 2 - Hits vs Misses */}
            <div className="w-full md:w-[48%] aspect-video">
              <div className={`rounded-xl shadow-lg border overflow-hidden transition-all duration-300 ${
                isDark 
                  ? 'bg-gray-800 border-gray-700' 
                  : 'bg-white border-gray-200'
              }`}>
                <div className={`p-4 border-b transition-colors duration-300 ${
                  isDark ? 'border-gray-700' : 'border-gray-200'
                }`}>
                  <h3 className={`font-semibold transition-colors duration-300 ${
                    isDark ? 'text-white' : 'text-gray-800'
                  }`}>Hits vs Misses</h3>
                </div>
                <iframe
                  src={`http://localhost:3001/d-solo/5be97764-1208-499f-8d58-8d5ec2e1a5d7/hits-vs-misses?orgId=1&from=now-12h&to=now&refresh=auto&var-store_id=${storeId}&panelId=1&__feature.dashboardSceneSolo`}
                  className="w-full h-full border-0"
                  style={{ height: '300px' }}
                  allowFullScreen
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Update Stock Form */}
      {showUpdateForm && editingStock && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          className={`fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 transition-all duration-300 ${
            isDark ? 'bg-gray-900/80' : 'bg-white/90'
          }`}
          onClick={() => setShowUpdateForm(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className={`bg-white p-6 rounded-lg shadow-xl transition-all duration-300 ${
              isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className={`text-2xl font-bold mb-4 transition-colors duration-300 ${
              isDark ? 'text-white' : 'text-gray-800'
            }`}>Update Stock</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <Input
                placeholder="Stock Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={`transition-all duration-300 ${
                  isDark ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300'
                }`}
              />
              <Input
                type="number"
                placeholder="Quantity"
                value={quantity || ''}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
                className={`transition-all duration-300 ${
                  isDark ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300'
                }`}
              />
              <Input
                type="number"
                placeholder="Price (₹)"
                value={price || ''}
                onChange={(e) => setPrice(parseInt(e.target.value) || 0)}
                className={`transition-all duration-300 ${
                  isDark ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300'
                }`}
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleUpdateSubmit}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Update Stock
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowUpdateForm(false)}
                className={`transition-all duration-300 ${
                  isDark ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                Cancel
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}