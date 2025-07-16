"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { motion } from "framer-motion";
import { 
  Crown, 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  LogOut,
  ArrowLeft,
  Calendar,
  BarChart3,
  PieChart,
  Activity,
  Target
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface RevenueData {
  month_year: string;
  total_revenue: number;
  admin_count: number;
  active_subscriptions: number;
  new_subscriptions: number;
  cancelled_subscriptions: number;
}

interface PaymentData {
  id: number;
  admin_id: number;
  amount: number;
  payment_date: string;
  status: string;
  admin_name: string;
  plan_name: string;
}

interface PayoutData {
  id: number;
  amount: number;
  paid_at: string;
  admin_name: string;
  admin_email: string;
  super_admin_name: string;
  super_admin_email: string;
}

interface MonthlyRevenueTrend {
  month: string;
  total_active_revenue: number;
  total_active_count: number;
}

export default function RevenueAnalyticsPage() {
  const [revenueData, setRevenueData] = useState<RevenueData[]>([]);
  const [recentPayments, setRecentPayments] = useState<PaymentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [timeRange, setTimeRange] = useState("6"); // months
  const [activeTab, setActiveTab] = useState<'payments' | 'payouts'>('payments');
  const [recentPayouts, setRecentPayouts] = useState<PayoutData[]>([]);
  const [monthlyTrend, setMonthlyTrend] = useState<MonthlyRevenueTrend[]>([]);
  const [currentMonthCommission, setCurrentMonthCommission] = useState<number>(0);
  const router = useRouter();

  useEffect(() => {
    const superAdminToken = localStorage.getItem("superAdminToken");
    if (!superAdminToken) {
      router.push("/super-admin/login");
      return;
    }

    fetchRevenueData();
    // Fetch monthly revenue trend
    const fetchMonthlyTrend = async () => {
      try {
        const response = await api.get('/super-admin/monthly-revenue-trend', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("superAdminToken")}`,
          },
        });
        setMonthlyTrend(response.data);
      } catch (err) {
        // Optionally handle error
      }
    };
    fetchMonthlyTrend();
  }, [router, timeRange]);

  // Fetch payouts when tab is switched to payouts
  useEffect(() => {
    if (activeTab === 'payouts' && recentPayouts.length === 0) {
      const fetchPayouts = async () => {
        try {
          const response = await api.get('/super-admin/recent-payouts', {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("superAdminToken")}`,
            },
          });
          setRecentPayouts(response.data);
        } catch (err) {
          // Optionally handle error
        }
      };
      fetchPayouts();
    }
  }, [activeTab, recentPayouts.length]);

  const fetchRevenueData = async () => {
    try {
      const response = await api.get(`/super-admin/revenue?months=${timeRange}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("superAdminToken")}`,
        },
      });
      setRevenueData(response.data.revenue || response.data);
      
      // Fetch recent payments and commission
      const paymentsResponse = await api.get("/super-admin/dashboard", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("superAdminToken")}`,
        },
      });
      setRecentPayments(paymentsResponse.data.recentPayments || []);
      setCurrentMonthCommission(paymentsResponse.data.currentMonth?.commission || 0);
    } catch (err: any) {
      if (err.response?.status === 401) {
        localStorage.removeItem("superAdminToken");
        router.push("/super-admin/login");
      } else {
        setError("Failed to load revenue data");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("superAdminToken");
    localStorage.removeItem("superAdminData");
    router.push("/super-admin/login");
  };

  const getRevenueStats = () => {
    if (revenueData.length === 0) return null;

    const currentMonth = revenueData[revenueData.length - 1];
    const previousMonth = revenueData.length > 1 ? revenueData[revenueData.length - 2] : null;
    
    const totalRevenue = revenueData.reduce((sum, month) => sum + month.total_revenue, 0);
    const avgMonthlyRevenue = totalRevenue / revenueData.length;
    
    const revenueGrowth = previousMonth 
      ? ((currentMonth.total_revenue - previousMonth.total_revenue) / previousMonth.total_revenue) * 100
      : 0;

    return {
      currentMonth: currentMonth.total_revenue,
      totalRevenue,
      avgMonthlyRevenue,
      revenueGrowth,
      totalAdmins: currentMonth.admin_count,
      activeSubscriptions: currentMonth.active_subscriptions,
      newSubscriptions: currentMonth.new_subscriptions,
      cancelledSubscriptions: currentMonth.cancelled_subscriptions
    };
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Replace old stats logic for current month revenue with new logic using monthlyTrend
  const getCurrentMonthRevenueStats = () => {
    if (!monthlyTrend || monthlyTrend.length === 0) return null;
    const current = monthlyTrend[0];
    const previous = monthlyTrend[1];
    const currentRevenue = current.total_active_revenue;
    const previousRevenue = previous ? previous.total_active_revenue : null;
    let revenueGrowth = null;
    if (previousRevenue !== null && previousRevenue !== 0) {
      revenueGrowth = ((currentRevenue - previousRevenue) / Math.abs(previousRevenue)) * 100;
    } else if (previousRevenue === 0 && currentRevenue > 0) {
      revenueGrowth = 100;
    } else if (previousRevenue === 0 && currentRevenue === 0) {
      revenueGrowth = 0;
    }
    return {
      currentMonth: currentRevenue,
      revenueGrowth,
      monthLabel: current.month,
      totalActive: current.total_active_count
    };
  };

  // Helper to format YYYY-MM to 'Month YYYY'
  const formatMonthLabel = (month: string | undefined) => {
    if (!month) return '';
    const [year, m] = month.split('-');
    const date = new Date(Number(year), Number(m) - 1);
    return date.toLocaleString('default', { month: 'long', year: 'numeric' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading revenue analytics...</p>
        </div>
      </div>
    );
  }

  const trendStats = getCurrentMonthRevenueStats();
  const stats = getRevenueStats();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Header */}
      <header className="bg-white/10 backdrop-blur-lg border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                onClick={() => router.push("/super-admin/dashboard")}
                className="text-gray-400 hover:text-white"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Back to Dashboard
              </Button>
              <div className="w-10 h-10 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-lg flex items-center justify-center">
                <Crown className="w-6 h-6 text-gray-900" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Revenue Analytics</h1>
                <p className="text-gray-400 text-sm">Platform revenue insights and trends</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                onClick={handleLogout}
                className="text-gray-400 hover:text-white"
              >
                <LogOut className="w-5 h-5 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-500/20 border border-red-500/30 rounded-lg p-4 mb-6"
          >
            <p className="text-red-400">{error}</p>
          </motion.div>
        )}

        {/* Time Range Filter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 mb-8"
        >
          <div className="flex items-center space-x-4">
            <label className="text-gray-400 text-sm">Time Range:</label>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-yellow-400"
            >
              <option value="3">Last 3 Months</option>
              <option value="6">Last 6 Months</option>
              <option value="12">Last 12 Months</option>
            </select>
          </div>
        </motion.div>

        {/* Key Metrics */}
        {(() => {
          const trendStats = getCurrentMonthRevenueStats();
          const stats = getRevenueStats();
          return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {/* Current Month Revenue (uses monthlyTrend) */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">
                      Revenue for {formatMonthLabel(trendStats?.monthLabel)}
                    </p>
                    <p className="text-2xl font-bold text-green-400">
                      {formatCurrency(trendStats?.currentMonth || 0)}
                    </p>
                    <div className="flex items-center mt-2">
                      {typeof trendStats?.revenueGrowth === 'number' && trendStats.revenueGrowth !== null ? (
                        trendStats.revenueGrowth >= 0 ? (
                          <TrendingUp className="w-4 h-4 text-green-400 mr-1" />
                        ) : (
                          <TrendingDown className="w-4 h-4 text-red-400 mr-1" />
                        )
                      ) : null}
                      <span className={`text-sm ${typeof trendStats?.revenueGrowth === 'number' && trendStats.revenueGrowth !== null && trendStats.revenueGrowth >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {typeof trendStats?.revenueGrowth === 'number' && trendStats.revenueGrowth !== null
                          ? `${Math.abs(trendStats.revenueGrowth).toFixed(1)}%`
                          : 'N/A'}
                      </span>
                    </div>
                  </div>
                  <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-green-400" />
                  </div>
                </div>
              </motion.div>
              {/* Other metric cards use old stats if available */}
              {stats && (
                <>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-400 text-sm">Total Revenue</p>
                        <p className="text-2xl font-bold text-blue-400">
                          {stats ? formatCurrency(stats.totalRevenue) : ''}
                        </p>
                        <p className="text-gray-400 text-sm mt-2">
                          Avg: {stats ? formatCurrency(stats.avgMonthlyRevenue) : ''}/month
                        </p>
                      </div>
                      <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                        <BarChart3 className="w-6 h-6 text-blue-400" />
                      </div>
                    </div>
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-400 text-sm">Active Subscriptions</p>
                        <p className="text-2xl font-bold text-yellow-400">
                          {stats ? stats.activeSubscriptions : ''}
                        </p>
                        <p className="text-gray-400 text-sm mt-2">
                          {stats ? stats.totalAdmins : ''} total admins
                        </p>
                      </div>
                      <div className="w-12 h-12 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                        <Users className="w-6 h-6 text-yellow-400" />
                      </div>
                    </div>
                  </motion.div>
                  {/* Commission Metric Card */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-400 text-sm">Total Revenue from Commission (This Month)</p>
                        <p className="text-2xl font-bold text-purple-400">
                          {formatCurrency(currentMonthCommission)}
                        </p>
                      </div>
                      <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
                        <Activity className="w-6 h-6 text-purple-400" />
                      </div>
                    </div>
                  </motion.div>
                </>
              )}
            </div>
          );
        })()}

        {/* Revenue Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20"
          >
            <h2 className="text-lg font-semibold text-white mb-4">Monthly Revenue Trend</h2>
            <div className="space-y-4 overflow-y-auto" style={{ maxHeight: 320 }}>
              {monthlyTrend.map((month, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                    <span className="text-white">{month.month}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-green-400 font-semibold">{formatCurrency(month.total_active_revenue)}</p>
                    <p className="text-gray-400 text-xs">{month.total_active_count} active</p>
                  </div>
                </div>
              ))}
              {monthlyTrend.length === 0 && (
                <p className="text-gray-400 text-center py-4">No revenue data available</p>
              )}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">Recent Payments</h2>
              <div className="flex space-x-2">
                <button
                  className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${activeTab === 'payments' ? 'bg-green-600 text-white' : 'bg-white/10 text-gray-300 hover:bg-white/20'}`}
                  onClick={() => setActiveTab('payments')}
                >
                  Subscription Received
                </button>
                <button
                  className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${activeTab === 'payouts' ? 'bg-purple-600 text-white' : 'bg-white/10 text-gray-300 hover:bg-white/20'}`}
                  onClick={() => setActiveTab('payouts')}
                >
                  Payouts
                </button>
              </div>
            </div>
            {/* Tab Content */}
            {activeTab === 'payments' ? (
              <div className="space-y-3 overflow-y-auto" style={{ maxHeight: 320 }}>
                {recentPayments.map((payment, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                    <div>
                      <p className="text-white font-medium">{payment.admin_name}</p>
                      <p className="text-gray-400 text-sm">{payment.plan_name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-green-400 font-semibold">{formatCurrency(payment.amount)}</p>
                      <p className="text-gray-400 text-xs">
                        {new Date(payment.payment_date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
                {recentPayments.length === 0 && (
                  <p className="text-gray-400 text-center py-4">No recent payments</p>
                )}
              </div>
            ) : (
              <div className="space-y-3 overflow-y-auto" style={{ maxHeight: 320 }}>
                {recentPayouts.map((payout, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                    <div>
                      <p className="text-white font-medium">{payout.admin_name}</p>
                      <p className="text-gray-400 text-sm">{payout.admin_email}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-purple-400 font-semibold">{formatCurrency(payout.amount)}</p>
                      <p className="text-gray-400 text-xs">
                        {new Date(payout.paid_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
                {recentPayouts.length === 0 && (
                  <p className="text-gray-400 text-center py-4">No recent payouts</p>
                )}
              </div>
            )}
          </motion.div>
        </div>

        {/* Revenue Insights */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20"
        >
          <h2 className="text-lg font-semibold text-white mb-4">Revenue Insights</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <Target className="w-8 h-8 text-green-400" />
              </div>
              <h3 className="text-white font-medium mb-2">Revenue Target</h3>
              <p className="text-gray-400 text-sm">
                Track your monthly revenue goals and performance metrics
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <PieChart className="w-8 h-8 text-blue-400" />
              </div>
              <h3 className="text-white font-medium mb-2">Growth Analysis</h3>
              <p className="text-gray-400 text-sm">
                Monitor subscription growth and churn rates
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <TrendingUp className="w-8 h-8 text-yellow-400" />
              </div>
              <h3 className="text-white font-medium mb-2">Trend Prediction</h3>
              <p className="text-gray-400 text-sm">
                Forecast future revenue based on current trends
              </p>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
} 