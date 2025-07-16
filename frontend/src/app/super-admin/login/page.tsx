"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { motion } from "framer-motion";
import { Eye, EyeOff, Shield, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import PasswordChangeModal from '@/components/PasswordChangeModal';

export default function SuperAdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Check if already logged in
    const superAdminToken = localStorage.getItem("superAdminToken");
    if (superAdminToken) {
      router.push("/super-admin/dashboard");
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await api.post("/super-admin/login", {
        email,
        password,
      });

      if (response.data.token) {
        localStorage.setItem("superAdminToken", response.data.token);
        localStorage.setItem("superAdminData", JSON.stringify(response.data.superAdmin));
        router.push("/super-admin/dashboard");
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-2xl flex items-center justify-center mr-4">
              <Crown className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Platform Admin</h1>
              <p className="text-gray-400">Super Admin Access</p>
            </div>
          </div>
          <p className="text-gray-400 text-sm">
            Secure access to platform management and revenue analytics
          </p>
        </div>

        {/* Login Form */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Input */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Email Address
              </label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@platform.com"
                className="w-full bg-white/10 border-white/20 text-white placeholder-gray-400 focus:border-yellow-400 focus:ring-yellow-400"
                required
              />
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Password
              </label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full bg-white/10 border-white/20 text-white placeholder-gray-400 focus:border-yellow-400 focus:ring-yellow-400 pr-12"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3">
                <p className="text-red-300 text-sm">{error}</p>
              </div>
            )}

            {/* Security Notice */}
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
              <div className="flex items-start">
                <Shield className="w-5 h-5 text-yellow-400 mt-0.5 mr-3 flex-shrink-0" />
                <div>
                  <p className="text-yellow-300 text-sm font-medium">Secure Access</p>
                  <p className="text-yellow-200/80 text-xs mt-1">
                    This is a restricted area. All access attempts are logged and monitored.
                  </p>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-gray-900 font-semibold py-3 rounded-lg transition-all duration-200 disabled:opacity-50"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-gray-900 border-t-transparent rounded-full animate-spin mr-2"></div>
                  Authenticating...
                </div>
              ) : (
                "Access Platform"
              )}
            </Button>

            {/* Password Change Link */}
            <div className="text-center pt-4 border-t border-white/10">
              <button
                type="button"
                onClick={() => setShowPasswordChange(true)}
                className="text-yellow-400 hover:text-yellow-300 text-sm font-medium transition-colors"
              >
                Need to change password?
              </button>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-gray-500 text-xs">
            © 2024 Retail Stock Rebalancer Platform
          </p>
          <p className="text-gray-600 text-xs mt-1">
            Super Admin Access Only
          </p>
        </div>
      </motion.div>

      {/* Password Change Modal */}
      <PasswordChangeModal
        isOpen={showPasswordChange}
        onClose={() => setShowPasswordChange(false)}
        userType="super_admin"
        userEmail={email}
        method="otp"
      />
    </div>
  );
} 