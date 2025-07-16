"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { motion } from "framer-motion";
import { 
  Crown, 
  CheckCircle, 
  XCircle, 
  Clock, 
  LogOut,
  ArrowLeft,
  User,
  Store,
  Mail,
  MapPin,
  Calendar,
  DollarSign,
  FileText
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface AdminRequest {
  id: number;
  name: string;
  email: string;
  store_name: string;
  store_category: string;
  store_location: string;
  plan_id: number;
  status: string;
  payment_status: string;
  notes: string;
  created_at: string;
  plan_name?: string;
  plan_price?: number;
}

interface CancellationRequest {
  id: number;
  admin_id: number;
  admin_name: string;
  admin_email: string;
  status: string;
  requested_at: string;
  resolved_at?: string;
  notes?: string;
}

interface ChangePlanRequest {
  id: number;
  admin_id: number;
  admin_name: string;
  admin_email: string;
  old_plan_id: number;
  old_plan_name: string;
  new_plan_id: number;
  new_plan_name: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export default function AdminRequestsPage() {
  const [requests, setRequests] = useState<AdminRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedRequest, setSelectedRequest] = useState<AdminRequest | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'subscriptions' | 'cancellations' | 'changeplans'>('subscriptions');
  const [cancellationRequests, setCancellationRequests] = useState<CancellationRequest[]>([]);
  const [changePlanRequests, setChangePlanRequests] = useState<ChangePlanRequest[]>([]);
  const router = useRouter();

  useEffect(() => {
    const superAdminToken = localStorage.getItem("superAdminToken");
    if (!superAdminToken) {
      router.push("/super-admin/login");
      return;
    }
    if (activeTab === 'subscriptions') {
      fetchRequests();
    } else if (activeTab === 'cancellations') {
      fetchCancellationRequests();
    } else if (activeTab === 'changeplans') {
      fetchChangePlanRequests();
    }
  }, [router, activeTab]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      setError("");
      
      const response = await api.get("/super-admin/requests", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("superAdminToken")}`,
        },
      });
      
      console.log("API Response:", response.data); // Debug log
      
      // Handle both old and new response formats
      if (response.data.requests) {
        setRequests(response.data.requests);
      } else {
        setRequests(response.data);
      }
    } catch (err: any) {
      console.error("Fetch requests error:", err); // Debug log
      if (err.response?.status === 401) {
        localStorage.removeItem("superAdminToken");
        router.push("/super-admin/login");
      } else {
        setError(`Failed to load admin requests: ${err.response?.data?.message || err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchCancellationRequests = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await api.get("/super-admin/cancellation-requests", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("superAdminToken")}`,
        },
      });
      setCancellationRequests(response.data);
    } catch (err: any) {
      if (err.response?.status === 401) {
        localStorage.removeItem("superAdminToken");
        router.push("/super-admin/login");
      } else {
        setError(`Failed to load cancellation requests: ${err.response?.data?.message || err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchChangePlanRequests = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await api.get("/super-admin/change-plan-requests", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("superAdminToken")}`,
        },
      });
      setChangePlanRequests(response.data);
    } catch (err: any) {
      if (err.response?.status === 401) {
        localStorage.removeItem("superAdminToken");
        router.push("/super-admin/login");
      } else {
        setError(`Failed to load change plan requests: ${err.response?.data?.message || err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId: number) => {
    setActionLoading(true);
    try {
      await api.post(`/super-admin/requests/${requestId}/approve`, {}, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("superAdminToken")}`,
        },
      });
      await fetchRequests();
      setShowModal(false);
      setSelectedRequest(null);
    } catch (err: any) {
      setError("Failed to approve request");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (requestId: number) => {
    setActionLoading(true);
    try {
      await api.post(`/super-admin/requests/${requestId}/reject`, {}, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("superAdminToken")}`,
        },
      });
      await fetchRequests();
      setShowModal(false);
      setSelectedRequest(null);
    } catch (err: any) {
      setError("Failed to reject request");
    } finally {
      setActionLoading(false);
    }
  };

  const handleApproveCancellation = async (adminId: number) => {
    setActionLoading(true);
    try {
      await api.post(`/super-admin/admins/${adminId}/cancel-approve`, {}, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("superAdminToken")}`,
        },
      });
      await fetchCancellationRequests();
    } catch (err: any) {
      setError("Failed to approve cancellation request");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectCancellation = async (adminId: number) => {
    setActionLoading(true);
    try {
      const notes = prompt('Reason for rejection?') || '';
      await api.post(`/super-admin/admins/${adminId}/cancel-reject`, { notes }, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("superAdminToken")}`,
        },
      });
      await fetchCancellationRequests();
    } catch (err: any) {
      setError("Failed to reject cancellation request");
    } finally {
      setActionLoading(false);
    }
  };

  const handleApproveChangePlan = async (id: number) => {
    setActionLoading(true);
    try {
      await api.post(`/super-admin/change-plan-requests/${id}/approve`, {}, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("superAdminToken")}`,
        },
      });
      await fetchChangePlanRequests();
    } catch (err: any) {
      setError("Failed to approve change plan request");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectChangePlan = async (id: number) => {
    setActionLoading(true);
    try {
      await api.post(`/super-admin/change-plan-requests/${id}/reject`, {}, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("superAdminToken")}`,
        },
      });
      await fetchChangePlanRequests();
    } catch (err: any) {
      setError("Failed to reject change plan request");
    } finally {
      setActionLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("superAdminToken");
    localStorage.removeItem("superAdminData");
    router.push("/super-admin/login");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-yellow-400 bg-yellow-400/20';
      case 'approved': return 'text-green-400 bg-green-400/20';
      case 'rejected': return 'text-red-400 bg-red-400/20';
      default: return 'text-gray-400 bg-gray-400/20';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'approved': return <CheckCircle className="w-4 h-4" />;
      case 'rejected': return <XCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  // At the top of the component, add helpers for metrics based on activeTab
  const getMetrics = () => {
    if (activeTab === 'subscriptions') {
      return {
        pending: requests.filter(r => r.status === 'pending').length,
        approved: requests.filter(r => r.status === 'approved').length,
        rejected: requests.filter(r => r.status === 'rejected').length,
        approvedLabel: 'Approved Suppliers',
        rejectedLabel: 'Rejected',
        pendingLabel: 'Pending Requests',
      };
    } else if (activeTab === 'cancellations') {
      return {
        pending: cancellationRequests.filter(r => r.status === 'pending').length,
        approved: cancellationRequests.filter(r => r.status === 'approved').length,
        rejected: cancellationRequests.filter(r => r.status === 'rejected').length,
        approvedLabel: 'Approved Cancellations',
        rejectedLabel: 'Rejected',
        pendingLabel: 'Pending Requests',
      };
    } else {
      return {
        pending: changePlanRequests.filter(r => r.status === 'pending').length,
        approved: changePlanRequests.filter(r => r.status === 'approved').length,
        rejected: changePlanRequests.filter(r => r.status === 'rejected').length,
        approvedLabel: 'Approved Changes',
        rejectedLabel: 'Rejected',
        pendingLabel: 'Pending Requests',
      };
    }
  };
  const metrics = getMetrics();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading admin requests...</p>
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
                <h1 className="text-xl font-bold text-white">Supplier Requests</h1>
                <p className="text-gray-400 text-sm">Review and manage supplier applications</p>
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">{metrics.pendingLabel}</p>
                <p className="text-2xl font-bold text-yellow-400">
                  {metrics.pending}
                </p>
              </div>
              <div className="w-12 h-12 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-yellow-400" />
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
                <p className="text-gray-400 text-sm">{metrics.approvedLabel}</p>
                <p className="text-2xl font-bold text-green-400">
                  {metrics.approved}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-400" />
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
                <p className="text-gray-400 text-sm">{metrics.rejectedLabel}</p>
                <p className="text-2xl font-bold text-red-400">
                  {metrics.rejected}
                </p>
              </div>
              <div className="w-12 h-12 bg-red-500/20 rounded-lg flex items-center justify-center">
                <XCircle className="w-6 h-6 text-red-400" />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Requests List */}
        {(activeTab === 'subscriptions' || activeTab === 'cancellations' || activeTab === 'changeplans') && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20"
          >
            {/* Tabs */}
            <div className="flex space-x-2 mb-8">
              <button
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${activeTab === 'subscriptions' ? 'bg-violet-600 text-white' : 'bg-white/10 text-gray-400 hover:text-white'}`}
                onClick={() => setActiveTab('subscriptions')}
              >
                Subscription Requests
              </button>
              <button
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${activeTab === 'cancellations' ? 'bg-violet-600 text-white' : 'bg-white/10 text-gray-400 hover:text-white'}`}
                onClick={() => setActiveTab('cancellations')}
              >
                Cancellation Requests
              </button>
              <button
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${activeTab === 'changeplans' ? 'bg-violet-600 text-white' : 'bg-white/10 text-gray-400 hover:text-white'}`}
                onClick={() => setActiveTab('changeplans')}
              >
                Change Subscription Requests
              </button>
            </div>
            {activeTab === 'subscriptions' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-white/1 backdrop-blur-lg rounded-xl border border-white/20 overflow-hidden"
              >
                <div className="p-6 border-b border-white/20">
                  <h2 className="text-lg font-semibold text-white">Supplier Applications</h2>
                </div>
                
                <div className="divide-y divide-white/10">
                  {requests.length === 0 ? (
                    <div className="p-8 text-center">
                      <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-400">No supplier applications found</p>
                    </div>
                  ) : (
                    requests.map((request, index) => (
                      <motion.div
                        key={request.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 * index }}
                        className="p-6 hover:bg-white/5 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-4 mb-3">
                              <div className="flex items-center space-x-2">
                                <User className="w-5 h-5 text-gray-400" />
                                <span className="text-white font-medium">{request.name}</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Mail className="w-4 h-4 text-gray-400" />
                                <span className="text-gray-400">{request.email}</span>
                              </div>
                            </div>
                            
                            <div className="flex items-center space-x-4 mb-3">
                              <div className="flex items-center space-x-2">
                                <Store className="w-4 h-4 text-gray-400" />
                                <span className="text-gray-300">{request.store_name}</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <MapPin className="w-4 h-4 text-gray-400" />
                                <span className="text-gray-400">{request.store_location}</span>
                              </div>
                            </div>
                            
                            <div className="flex items-center space-x-4">
                              <div className="flex items-center space-x-2">
                                <Calendar className="w-4 h-4 text-gray-400" />
                                <span className="text-gray-400">
                                  {new Date(request.created_at).toLocaleDateString()}
                                </span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <DollarSign className="w-4 h-4 text-gray-400" />
                                <span className="text-gray-400">Plan: {request.plan_name || 'Basic'}</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-4">
                            <div className={`px-3 py-1 rounded-full flex items-center space-x-2 ${getStatusColor(request.status)}`}>
                              {getStatusIcon(request.status)}
                              <span className="text-sm font-medium capitalize">{request.status}</span>
                            </div>
                            
                            {request.status === 'pending' && (
                              <div className="flex space-x-2">
                                <Button
                                  onClick={() => {
                                    setSelectedRequest(request);
                                    setShowModal(true);
                                  }}
                                  size="sm"
                                  className="bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/30"
                                >
                                  Review
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>
              </motion.div>
            )}
            {activeTab === 'cancellations' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white/1 backdrop-blur-lg rounded-xl border border-white/20 overflow-hidden"
              >
                <div className="p-6 border-b border-white/20">
                  <h2 className="text-lg font-semibold text-white">Cancellation Requests</h2>
                </div>
                <div className="divide-y divide-white/10">
                  {cancellationRequests.length === 0 ? (
                    <div className="p-8 text-center">
                      <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-400">No cancellation requests found</p>
                    </div>
                  ) : (
                    cancellationRequests.map((req, index) => (
                      <motion.div
                        key={req.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 * index }}
                        className="p-6 hover:bg-white/5 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-4 mb-3">
                              <div className="flex items-center space-x-2">
                                <User className="w-5 h-5 text-gray-400" />
                                <span className="text-white font-medium">{req.admin_name}</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Mail className="w-4 h-4 text-gray-400" />
                                <span className="text-gray-400">{req.admin_email}</span>
                              </div>
                            </div>
                            <div className="flex items-center space-x-4 mb-3">
                              <div className="flex items-center space-x-2">
                                <Calendar className="w-4 h-4 text-gray-400" />
                                <span className="text-gray-400">
                                  {new Date(req.requested_at).toLocaleDateString()}
                                </span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <FileText className="w-4 h-4 text-gray-400" />
                                <span className="text-gray-400">Notes: {req.notes || '-'}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-4">
                            <div className={`px-3 py-1 rounded-full flex items-center space-x-2 ${getStatusColor(req.status)}`}>
                              {getStatusIcon(req.status)}
                              <span className="text-sm font-medium capitalize">{req.status}</span>
                            </div>
                            {req.status === 'pending' && (
                              <div className="flex space-x-2">
                                <Button
                                  size="sm"
                                  className="bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/30"
                                  disabled={actionLoading}
                                  onClick={() => handleApproveCancellation(req.admin_id)}
                                >
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  className="bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30"
                                  disabled={actionLoading}
                                  onClick={() => handleRejectCancellation(req.admin_id)}
                                >
                                  Reject
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>
              </motion.div>
            )}
            {activeTab === 'changeplans' && (
              <div className="bg-white/10 rounded-xl p-6 border border-white/20">
                <h2 className="text-lg font-semibold text-white mb-4">Change Subscription Requests</h2>
                {loading ? (
                  <div className="flex justify-center items-center py-8">
                    <div className="w-8 h-8 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : error ? (
                  <p className="text-red-400 text-sm mb-4">{error}</p>
                ) : changePlanRequests.length === 0 ? (
                  <p className="text-gray-400 text-sm">No change plan requests found.</p>
                ) : (
                  <table className="min-w-full divide-y divide-gray-700">
                    <thead>
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Admin</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Old Plan</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">New Plan</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Requested At</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                        <th className="px-4 py-2"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                      {changePlanRequests.map((req) => (
                        <tr key={req.id}>
                          <td className="px-4 py-3">
                            <span className="text-white font-semibold">{req.admin_name}</span>
                            <br />
                            <span className="text-xs text-gray-400">{req.admin_email}</span>
                          </td>
                          <td className="px-4 py-3 text-gray-300">{req.old_plan_name}</td>
                          <td className="px-4 py-3 text-violet-400 font-semibold">{req.new_plan_name}</td>
                          <td className="px-4 py-3 text-gray-400">{new Date(req.created_at).toLocaleString()}</td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-semibold ${getStatusColor(req.status)}`}>
                              {getStatusIcon(req.status)} {req.status}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            {req.status === 'pending' && (
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  className="bg-green-600 hover:bg-green-700 text-white"
                                  disabled={actionLoading}
                                  onClick={() => handleApproveChangePlan(req.id)}
                                >
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  className="bg-red-600 hover:bg-red-700 text-white"
                                  disabled={actionLoading}
                                  onClick={() => handleRejectChangePlan(req.id)}
                                >
                                  Reject
                                </Button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </motion.div>
        )}
      </main>

      {/* Review Modal */}
      {showModal && selectedRequest && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gray-800 rounded-xl p-6 max-w-md w-full mx-4 border border-white/20"
          >
            <h3 className="text-lg font-semibold text-white mb-4">Review Supplier Application</h3>
            
            <div className="space-y-4 mb-6">
              <div>
                <p className="text-gray-400 text-sm">Applicant</p>
                <p className="text-white font-medium">{selectedRequest.name}</p>
                <p className="text-gray-400">{selectedRequest.email}</p>
              </div>
              
              <div>
                <p className="text-gray-400 text-sm">Company Details</p>
                <p className="text-white font-medium">{selectedRequest.store_name}</p>
                <p className="text-gray-400">{selectedRequest.store_location}</p>
                <p className="text-gray-400">Category: {selectedRequest.store_category}</p>
              </div>
              
              <div>
                <p className="text-gray-400 text-sm">Selected Plan</p>
                <p className="text-white font-medium">{selectedRequest.plan_name || 'Basic'}</p>
              </div>
            </div>
            
            <div className="flex space-x-3">
              <Button
                onClick={() => handleApprove(selectedRequest.id)}
                disabled={actionLoading}
                className="flex-1 bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/30"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Approve
              </Button>
              <Button
                onClick={() => handleReject(selectedRequest.id)}
                disabled={actionLoading}
                className="flex-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30"
              >
                <XCircle className="w-4 h-4 mr-2" />
                Reject
              </Button>
            </div>
            
            <Button
              onClick={() => {
                setShowModal(false);
                setSelectedRequest(null);
              }}
              variant="ghost"
              className="w-full mt-3 text-gray-400 hover:text-white"
            >
              Cancel
            </Button>
          </motion.div>
        </div>
      )}
    </div>
  );
} 