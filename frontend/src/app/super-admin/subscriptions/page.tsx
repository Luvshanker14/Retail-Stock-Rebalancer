"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { motion } from "framer-motion";
import { 
  Crown, 
  Users, 
  CheckCircle, 
  XCircle, 
  Clock, 
  LogOut,
  ArrowLeft,
  DollarSign,
  Calendar,
  AlertTriangle,
  TrendingUp,
  TrendingDown
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface AdminSubscription {
  id: number;
  admin_id: number;
  plan_id: number;
  status: string;
  monthly_fee: number;
  payment_date: string;
  next_payment_date: string;
  trial_end_date: string;
  created_at: string;
  admin_name: string;
  admin_email: string;
  plan_name: string;
  plan_price: number;
}

interface AdminEarnings {
  [adminId: number]: {
    loading: boolean;
    value: number | null;
    error: string | null;
  };
}

export default function AdminSubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<AdminSubscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [adminEarnings, setAdminEarnings] = useState<AdminEarnings>({});
  const [metrics, setMetrics] = useState({
    totalRevenue: 0,
    activeCount: 0,
    avgRevenue: 0,
    totalCount: 0
  });
  const router = useRouter();

  useEffect(() => {
    const superAdminToken = localStorage.getItem("superAdminToken");
    if (!superAdminToken) {
      router.push("/super-admin/login");
      return;
    }

    fetchSubscriptions();
  }, [router, currentPage, statusFilter]);

  // Fetch earnings after commission for each admin
  useEffect(() => {
    subscriptions.forEach((sub) => {
      if (adminEarnings[sub.admin_id] === undefined) {
        setAdminEarnings((prev) => ({
          ...prev,
          [sub.admin_id]: { loading: true, value: null, error: null },
        }));
        api
          .get(`/super-admin/admins/${sub.admin_id}/earnings`, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("superAdminToken")}`,
            },
          })
          .then((res) => {
            setAdminEarnings((prev) => ({
              ...prev,
              [sub.admin_id]: {
                loading: false,
                value: res.data.earningsAfterCommission,
                error: null,
              },
            }));
          })
          .catch((err) => {
            setAdminEarnings((prev) => ({
              ...prev,
              [sub.admin_id]: {
                loading: false,
                value: null,
                error: "Failed to fetch earnings",
              },
            }));
          });
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subscriptions]);

  // Razorpay script loader
  useEffect(() => {
    if (!window.Razorpay) {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  const handleRazorpayPayout = (adminId: number, amount: number) => {
    const options = {
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || '',
      amount: Math.round(amount * 100), // Amount in paise
      currency: "INR",
      name: "Admin Payout",
      description: "Payout to admin",
      handler: function (response: any) {
        handlePayout(adminId);
      },
      prefill: {
        name: "Super Admin",
        email: "superadmin@example.com",
      },
      theme: {
        color: "#7c3aed",
      },
    };
    const rzp = new (window as any).Razorpay(options);
    rzp.open();
  };

  // Payout handler
  const handlePayout = async (adminId: number) => {
    setAdminEarnings((prev) => ({
      ...prev,
      [adminId]: { ...prev[adminId], loading: true },
    }));
    try {
      await api.post(
        `/super-admin/admins/${adminId}/payout`,
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("superAdminToken")}`,
          },
        }
      );
      // Refetch earnings after payout
      const res = await api.get(`/super-admin/admins/${adminId}/earnings`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("superAdminToken")}`,
        },
      });
      setAdminEarnings((prev) => ({
        ...prev,
        [adminId]: {
          loading: false,
          value: res.data.earningsAfterCommission,
          error: null,
        },
      }));
    } catch (err) {
      setAdminEarnings((prev) => ({
        ...prev,
        [adminId]: {
          ...prev[adminId],
          loading: false,
          error: "Payout failed",
        },
      }));
    }
  };

  const fetchSubscriptions = async () => {
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "10"
      });
      
      if (statusFilter) {
        params.append("status", statusFilter);
      }

      const response = await api.get(`/super-admin/subscriptions?${params}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("superAdminToken")}`,
        },
      });
      setSubscriptions(response.data.subscriptions || response.data);
      setTotalPages(response.data.pagination?.totalPages || 1);
      if (response.data.metrics) {
        setMetrics(response.data.metrics);
      }
    } catch (err: any) {
      if (err.response?.status === 401) {
        localStorage.removeItem("superAdminToken");
        router.push("/super-admin/login");
      } else {
        setError("Failed to load subscriptions");
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-400 bg-green-400/20';
      case 'pending': return 'text-yellow-400 bg-yellow-400/20';
      case 'suspended': return 'text-red-400 bg-red-400/20';
      case 'cancelled': return 'text-gray-400 bg-gray-400/20';
      default: return 'text-gray-400 bg-gray-400/20';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="w-4 h-4" />;
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'suspended': return <XCircle className="w-4 h-4" />;
      case 'cancelled': return <XCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  // Plan badge helper
  const getPlanBadge = (planName: string) => {
    switch ((planName || '').toLowerCase()) {
      case 'basic':
        return <span className="bg-blue-600/20 text-blue-400 rounded-full px-3 py-1 font-semibold text-sm">Basic</span>;
      case 'premium':
        return <span className="bg-purple-600/20 text-purple-400 rounded-full px-3 py-1 font-semibold text-sm">Premium</span>;
      case 'enterprise':
        return <span className="bg-yellow-500/20 text-yellow-500 rounded-full px-3 py-1 font-semibold text-sm">Enterprise</span>;
      default:
        return <span className="bg-gray-600/20 text-gray-300 rounded-full px-3 py-1 font-semibold text-sm">{planName}</span>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading subscriptions...</p>
        </div>
      </div>
    );
  }

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
                <h1 className="text-xl font-bold text-white">Admin Subscriptions</h1>
                <p className="text-gray-400 text-sm">Manage admin subscriptions and revenue</p>
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

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Revenue</p>
                <p className="text-2xl font-bold text-green-400">
                  ₹{metrics.totalRevenue.toLocaleString()}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-green-400" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Active Subscriptions</p>
                <p className="text-2xl font-bold text-blue-400">
                  {metrics.activeCount}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-blue-400" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Avg. Revenue</p>
                <p className="text-2xl font-bold text-yellow-400">
                  ₹{metrics.avgRevenue.toLocaleString()}
                </p>
              </div>
              <div className="w-12 h-12 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-yellow-400" />
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
                <p className="text-gray-400 text-sm">Total Subscriptions</p>
                <p className="text-2xl font-bold text-purple-400">
                  {metrics.totalCount}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-purple-400" />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 mb-8"
        >
          <div className="flex items-center space-x-4">
            <label className="text-gray-400 text-sm">Filter by Status:</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-yellow-400"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="suspended">Suspended</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </motion.div>

        {/* Subscriptions Table */}
        <table className="min-w-full divide-y divide-gray-700 bg-white/5 rounded-xl overflow-hidden">
          <thead>
            <tr>
              <th className="px-6 py-4 w-2/5 min-w-[200px] text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Admin</th>
              <th className="px-6 py-4 w-1/5 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Plan</th>
              <th className="px-6 py-4 w-1/5 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
              <th className="px-6 py-4 w-1/5 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Amount Due</th>
              <th className="px-6 py-4 w-1/5 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Action</th>
            </tr>
          </thead>
          <tbody className="bg-white/10 divide-y divide-gray-800">
            {subscriptions.map((sub) => {
              const isInactive = sub.status !== 'active';
              return (
                <tr
                  key={sub.id}
                  className={
                    isInactive
                      ? 'bg-gray-700/60 border-l-4 border-gray-500/40 opacity-80'
                      : 'bg-transparent'
                  }
                >
                  <td className="px-6 py-4 w-2/5 min-w-[200px]">
                    <span className={isInactive ? 'text-gray-300 italic font-medium' : 'text-white font-semibold'}>{sub.admin_name}</span>
                    {isInactive && (
                      <span className="ml-2 text-xs bg-gray-600/40 text-gray-400 px-2 py-0.5 rounded-full align-middle">inactive</span>
                    )}
                    <br />
                    <span className={isInactive ? 'text-xs text-gray-400' : 'text-gray-400 text-xs'}>{sub.admin_email}</span>
                  </td>
                  <td className={"px-6 py-4 w-1/5 " + (isInactive ? 'text-gray-400 italic' : '')}>{getPlanBadge(sub.plan_name)}</td>
                  <td className="px-6 py-4 w-1/5">
                    <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-semibold ${isInactive ? 'bg-gray-600/40 text-gray-300' : getStatusColor(sub.status)}`}> 
                      {getStatusIcon(sub.status)} {isInactive ? 'Inactive' : sub.status}
                    </span>
                  </td>
                  <td className={"px-6 py-4 w-1/5 " + (isInactive ? 'text-2xl text-gray-500 font-light' : 'text-gray-400')}>
                    {isInactive ? '—' :
                      adminEarnings[sub.admin_id]?.loading
                        ? <span>Loading...</span>
                        : adminEarnings[sub.admin_id]?.error
                          ? <span className="text-red-400">{adminEarnings[sub.admin_id].error}</span>
                          : `₹${adminEarnings[sub.admin_id]?.value?.toLocaleString()}`
                    }
                  </td>
                  <td className="px-6 py-4 w-1/5">
                    {isInactive ? (
                      <button
                        className="bg-gray-600/60 text-gray-400 px-5 py-2 rounded-full cursor-not-allowed font-semibold"
                        disabled
                        title="Cannot pay out to inactive admin"
                      >
                        Pay Out
                      </button>
                    ) : (
                      <Button
                        onClick={() => handleRazorpayPayout(sub.admin_id, adminEarnings[sub.admin_id]?.value || 0)}
                        disabled={adminEarnings[sub.admin_id]?.loading || !adminEarnings[sub.admin_id]?.value}
                        className="bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded"
                      >
                        Pay Out
                      </Button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Pagination */}
        {totalPages > 1 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="flex justify-center items-center space-x-2 mt-8"
          >
            <Button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              variant="ghost"
              className="text-gray-400 hover:text-white"
            >
              Previous
            </Button>
            
            <span className="text-gray-400">
              Page {currentPage} of {totalPages}
            </span>
            
            <Button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              variant="ghost"
              className="text-gray-400 hover:text-white"
            >
              Next
            </Button>
          </motion.div>
        )}
      </main>
    </div>
  );
} 