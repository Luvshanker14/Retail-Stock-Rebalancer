"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { motion } from "framer-motion";
import { 
  Crown, 
  FileText, 
  Search, 
  Filter, 
  LogOut,
  ArrowLeft,
  Calendar,
  User,
  Activity,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Eye
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface SystemLog {
  id: number;
  super_admin_id: number;
  action: string;
  details: any;
  ip_address: string;
  user_agent: string;
  created_at: string;
  super_admin_name?: string;
}

export default function SystemLogsPage() {
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [actionFilter, setActionFilter] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLog, setSelectedLog] = useState<SystemLog | null>(null);
  const [showModal, setShowModal] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const superAdminToken = localStorage.getItem("superAdminToken");
    if (!superAdminToken) {
      router.push("/super-admin/login");
      return;
    }

    fetchLogs();
  }, [router, currentPage, actionFilter]);

  const fetchLogs = async () => {
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "20"
      });
      
      if (actionFilter) {
        params.append("action", actionFilter);
      }

      const response = await api.get(`/super-admin/logs?${params}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("superAdminToken")}`,
        },
      });
      setLogs(response.data.logs || response.data);
      setTotalPages(response.data.totalPages || 1);
    } catch (err: any) {
      if (err.response?.status === 401) {
        localStorage.removeItem("superAdminToken");
        router.push("/super-admin/login");
      } else {
        setError("Failed to load system logs");
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

  const getActionColor = (action: string) => {
    switch (action.toLowerCase()) {
      case 'login': return 'text-blue-400 bg-blue-400/20';
      case 'approve': return 'text-green-400 bg-green-400/20';
      case 'reject': return 'text-red-400 bg-red-400/20';
      case 'suspend': return 'text-orange-400 bg-orange-400/20';
      case 'update': return 'text-yellow-400 bg-yellow-400/20';
      default: return 'text-gray-400 bg-gray-400/20';
    }
  };

  const getActionIcon = (action: string) => {
    switch (action.toLowerCase()) {
      case 'login': return <User className="w-4 h-4" />;
      case 'approve': return <CheckCircle className="w-4 h-4" />;
      case 'reject': return <XCircle className="w-4 h-4" />;
      case 'suspend': return <AlertTriangle className="w-4 h-4" />;
      case 'update': return <Activity className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  const filteredLogs = logs.filter(log => {
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        log.action.toLowerCase().includes(searchLower) ||
        log.details?.email?.toLowerCase().includes(searchLower) ||
        log.ip_address.includes(searchTerm)
      );
    }
    return true;
  });

  const getLogStats = () => {
    const totalLogs = logs.length;
    const loginCount = logs.filter(log => log.action.toLowerCase() === 'login').length;
    const approveCount = logs.filter(log => log.action.toLowerCase() === 'approve').length;
    const rejectCount = logs.filter(log => log.action.toLowerCase() === 'reject').length;
    
    return { totalLogs, loginCount, approveCount, rejectCount };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading system logs...</p>
        </div>
      </div>
    );
  }

  const stats = getLogStats();

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
                <h1 className="text-xl font-bold text-white">System Logs</h1>
                <p className="text-gray-400 text-sm">Audit trail and system activities</p>
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
                <p className="text-gray-400 text-sm">Total Logs</p>
                <p className="text-2xl font-bold text-blue-400">
                  {stats.totalLogs}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <FileText className="w-6 h-6 text-blue-400" />
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
                <p className="text-gray-400 text-sm">Login Events</p>
                <p className="text-2xl font-bold text-green-400">
                  {stats.loginCount}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                <User className="w-6 h-6 text-green-400" />
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
                <p className="text-gray-400 text-sm">Approvals</p>
                <p className="text-2xl font-bold text-yellow-400">
                  {stats.approveCount}
                </p>
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
                <p className="text-gray-400 text-sm">Rejections</p>
                <p className="text-2xl font-bold text-red-400">
                  {stats.rejectCount}
                </p>
              </div>
              <div className="w-12 h-12 bg-red-500/20 rounded-lg flex items-center justify-center">
                <XCircle className="w-6 h-6 text-red-400" />
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
          <div className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-4">
            <div className="flex items-center space-x-2 flex-1">
              <Search className="w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search logs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-yellow-400 flex-1"
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
                className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-yellow-400"
              >
                <option value="">All Actions</option>
                <option value="login">Login</option>
                <option value="approve">Approve</option>
                <option value="reject">Reject</option>
                <option value="suspend">Suspend</option>
                <option value="update">Update</option>
              </select>
            </div>
          </div>
        </motion.div>

        {/* Logs List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 overflow-hidden"
        >
          <div className="p-6 border-b border-white/20">
            <h2 className="text-lg font-semibold text-white">System Activity Logs</h2>
          </div>
          
          <div className="divide-y divide-white/10">
            {filteredLogs.length === 0 ? (
              <div className="p-8 text-center">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-400">No logs found</p>
              </div>
            ) : (
              filteredLogs.map((log, index) => (
                <motion.div
                  key={log.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * index }}
                  className="p-6 hover:bg-white/5 transition-colors cursor-pointer"
                  onClick={() => {
                    setSelectedLog(log);
                    setShowModal(true);
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-4 mb-3">
                        <div className={`px-3 py-1 rounded-full flex items-center space-x-2 ${getActionColor(log.action)}`}>
                          {getActionIcon(log.action)}
                          <span className="text-sm font-medium capitalize">{log.action}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-400">
                            {new Date(log.created_at).toLocaleString()}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          <span className="text-gray-400">IP:</span>
                          <span className="text-gray-300 font-mono text-sm">{log.ip_address}</span>
                        </div>
                        {log.details?.email && (
                          <div className="flex items-center space-x-2">
                            <span className="text-gray-400">User:</span>
                            <span className="text-gray-300">{log.details.email}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Eye className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-400 text-sm">View Details</span>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </motion.div>

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

      {/* Log Details Modal */}
      {showModal && selectedLog && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gray-800 rounded-xl p-6 max-w-2xl w-full mx-4 border border-white/20 max-h-[80vh] overflow-y-auto"
          >
            <h3 className="text-lg font-semibold text-white mb-4">Log Details</h3>
            
            <div className="space-y-4">
              <div>
                <p className="text-gray-400 text-sm">Action</p>
                <div className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full ${getActionColor(selectedLog.action)}`}>
                  {getActionIcon(selectedLog.action)}
                  <span className="font-medium capitalize">{selectedLog.action}</span>
                </div>
              </div>
              
              <div>
                <p className="text-gray-400 text-sm">Timestamp</p>
                <p className="text-white">{new Date(selectedLog.created_at).toLocaleString()}</p>
              </div>
              
              <div>
                <p className="text-gray-400 text-sm">IP Address</p>
                <p className="text-white font-mono">{selectedLog.ip_address}</p>
              </div>
              
              <div>
                <p className="text-gray-400 text-sm">User Agent</p>
                <p className="text-white text-sm break-all">{selectedLog.user_agent}</p>
              </div>
              
              {selectedLog.details && Object.keys(selectedLog.details).length > 0 && (
                <div>
                  <p className="text-gray-400 text-sm">Details</p>
                  <pre className="bg-gray-700 rounded-lg p-3 text-white text-sm overflow-x-auto">
                    {JSON.stringify(selectedLog.details, null, 2)}
                  </pre>
                </div>
              )}
            </div>
            
            <Button
              onClick={() => {
                setShowModal(false);
                setSelectedLog(null);
              }}
              className="w-full mt-6 bg-gray-700 hover:bg-gray-600 text-white"
            >
              Close
            </Button>
          </motion.div>
        </div>
      )}
    </div>
  );
} 