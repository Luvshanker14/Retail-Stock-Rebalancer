"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { motion } from "framer-motion";
import { 
  Crown, 
  Users, 
  DollarSign, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  LogOut,
  BarChart3,
  Settings,
  FileText,
  Calendar
} from "lucide-react";
import { Button } from "@/components/ui/button";
import PasswordChangeButton from '@/components/PasswordChangeButton';

interface DashboardStats {
  currentMonth: {
    revenue: number;
    adminCount: number;
    activeSubscriptions: number;
    pendingRequests: number;
    commission?: number; // Added commission to interface
    activeAdminCount: number; // Added activeAdminCount to interface
  };
  recentPayments: any[];
  revenueTrend: any[];
}

export default function SuperAdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    // Check authentication
    const superAdminToken = localStorage.getItem("superAdminToken");
    if (!superAdminToken) {
      router.push("/super-admin/login");
      return;
    }

    fetchDashboardStats();
  }, [router]);

  const fetchDashboardStats = async () => {
    try {
      const response = await api.get("/super-admin/dashboard", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("superAdminToken")}`,
        },
      });
      setStats(response.data);
    } catch (err: any) {
      if (err.response?.status === 401) {
        localStorage.removeItem("superAdminToken");
        router.push("/super-admin/login");
      } else {
        setError("Failed to load dashboard data");
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading platform data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <XCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <p className="text-red-400">{error}</p>
          <Button onClick={fetchDashboardStats} className="mt-4">
            Retry
          </Button>
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
              <div className="w-10 h-10 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-lg flex items-center justify-center">
                <Crown className="w-6 h-6 text-gray-900" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Platform Admin</h1>
                <p className="text-gray-400 text-sm">Super Admin Dashboard</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <PasswordChangeButton 
                userType="super_admin" 
                variant="icon" 
                className="mr-2"
              />
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
        {/* Section Heading */}
        <h2 className="text-2xl font-bold text-white mb-6">Platform Metrics</h2>
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Monthly Revenue</p>
                <p className="text-2xl font-bold text-white">
                  ₹{stats?.currentMonth.revenue.toLocaleString() || 0}
                </p>
                <p className="text-xs text-gray-400 mt-1">Total revenue collected this month</p>
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
                <p className="text-gray-400 text-sm">Active Admins</p>
                <p className="text-2xl font-bold text-white">
                  {stats?.currentMonth.activeAdminCount || 0}
                </p>
                <p className="text-xs text-gray-400 mt-1">Number of admins currently active</p>
              </div>
              <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-400" />
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
                <p className="text-gray-400 text-sm">Active Subscriptions</p>
                <p className="text-2xl font-bold text-white">
                  {stats?.currentMonth.activeSubscriptions || 0}
                </p>
                <p className="text-xs text-gray-400 mt-1">Currently active paid subscriptions</p>
              </div>
              <div className="w-12 h-12 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-yellow-400" />
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
                <p className="text-gray-400 text-sm">Pending Requests</p>
                <p className="text-2xl font-bold text-white">
                  {stats?.currentMonth.pendingRequests || 0}
                </p>
                <p className="text-xs text-gray-400 mt-1">New admin requests awaiting review</p>
              </div>
              <div className="w-12 h-12 bg-orange-500/20 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-orange-400" />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Quick Actions as 2x2 grid of cards with icon, title, description */}
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 mt-8">
          <h3 className="text-lg font-bold text-white mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div
              className="flex flex-col items-start p-6 rounded-xl cursor-pointer shadow bg-blue-100 hover:bg-blue-200 text-blue-800 transition-all duration-200"
              onClick={() => router.push('/super-admin/requests')}
            >
              <div className="flex items-center mb-2">
                <FileText className="w-7 h-7 mr-2" />
                <span className="font-semibold text-lg">Review Requests</span>
              </div>
              <span className="text-sm">Approve or reject new admin requests</span>
            </div>
            <div
              className="flex flex-col items-start p-6 rounded-xl cursor-pointer shadow bg-green-100 hover:bg-green-200 text-green-800 transition-all duration-200"
              onClick={() => router.push('/super-admin/subscriptions')}
            >
              <div className="flex items-center mb-2">
                <Users className="w-7 h-7 mr-2" />
                <span className="font-semibold text-lg">Manage Admins</span>
              </div>
              <span className="text-sm">Add, remove, or edit admin accounts</span>
            </div>
            <div
              className="flex flex-col items-start p-6 rounded-xl cursor-pointer shadow bg-yellow-100 hover:bg-yellow-200 text-yellow-800 transition-all duration-200"
              onClick={() => router.push('/super-admin/revenue')}
            >
              <div className="flex items-center mb-2">
                <BarChart3 className="w-7 h-7 mr-2" />
                <span className="font-semibold text-lg">Revenue Analytics</span>
              </div>
              <span className="text-sm">View platform revenue and trends</span>
            </div>
            <div
              className="flex flex-col items-start p-6 rounded-xl cursor-pointer shadow bg-purple-100 hover:bg-purple-200 text-purple-800 transition-all duration-200"
              onClick={() => router.push('/super-admin/logs')}
            >
              <div className="flex items-center mb-2">
                <Settings className="w-7 h-7 mr-2" />
                <span className="font-semibold text-lg">System Logs</span>
              </div>
              <span className="text-sm">Audit platform activity and errors</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
} 