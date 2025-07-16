
"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { Eye, EyeOff, ArrowRight, Home, Loader, Shield, AlertTriangle } from "lucide-react";
import LogoutButton from "@/components/LogoutButton";
import Link from "next/link";
import PasswordChangeModal from '@/components/PasswordChangeModal';
import { Button } from "@/components/ui/button";

export default function AdminAuthPage() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  
  // Security features
  const [captchaAnswer, setCaptchaAnswer] = useState("");
  const [captchaQuestion, setCaptchaQuestion] = useState("");
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [lockoutTime, setLockoutTime] = useState(0);
  
  const router = useRouter();

  // Generate CAPTCHA question
  const generateCaptcha = () => {
    const num1 = Math.floor(Math.random() * 10) + 1;
    const num2 = Math.floor(Math.random() * 10) + 1;
    setCaptchaQuestion(`${num1} + ${num2} = ?`);
    return num1 + num2;
  };

  // Initialize CAPTCHA and check for lockout
  useEffect(() => {
    const customerToken = localStorage.getItem("customerToken");
    const adminToken = localStorage.getItem("adminToken");
    setIsLoggedIn(!!(customerToken || adminToken));

    // Check for existing lockout
    const storedAttempts = localStorage.getItem("adminLoginAttempts");
    const storedLockoutTime = localStorage.getItem("adminLockoutTime");
    
    if (storedAttempts && storedLockoutTime) {
      const attempts = parseInt(storedAttempts);
      const lockoutTime = parseInt(storedLockoutTime);
      const now = Date.now();
      
      if (now < lockoutTime) {
        setIsLocked(true);
        setLockoutTime(lockoutTime);
        setLoginAttempts(attempts);
      } else {
        // Clear expired lockout
        localStorage.removeItem("adminLoginAttempts");
        localStorage.removeItem("adminLockoutTime");
      }
    }

    generateCaptcha();
  }, []);

  // Handle lockout countdown
  useEffect(() => {
    if (isLocked && lockoutTime > 0) {
      const interval = setInterval(() => {
        const now = Date.now();
        if (now >= lockoutTime) {
          setIsLocked(false);
          setLoginAttempts(0);
          localStorage.removeItem("adminLoginAttempts");
          localStorage.removeItem("adminLockoutTime");
          generateCaptcha();
        }
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isLocked, lockoutTime]);

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setError("");

    // Security validations
    if (isLocked) {
      const remainingTime = Math.ceil((lockoutTime - Date.now()) / 1000);
      setError(`Account temporarily locked. Please try again in ${remainingTime} seconds.`);
      return;
    }

    if (!email || !password) {
      setError("Please fill in all fields.");
      return;
    }

    if (!captchaAnswer) {
      setError("Please complete the security verification.");
      return;
    }

    // Validate CAPTCHA
    const expectedAnswer = eval(captchaQuestion.replace(" = ?", ""));
    if (parseInt(captchaAnswer) !== expectedAnswer) {
      setError("Security verification failed. Please try again.");
      setCaptchaAnswer("");
      generateCaptcha();
      return;
    }

    // Rate limiting
    if (loginAttempts >= 5) {
      const lockoutDuration = 5 * 60 * 1000; // 5 minutes
      const newLockoutTime = Date.now() + lockoutDuration;
      setIsLocked(true);
      setLockoutTime(newLockoutTime);
      localStorage.setItem("adminLoginAttempts", "5");
      localStorage.setItem("adminLockoutTime", newLockoutTime.toString());
      setError("Too many failed attempts. Account locked for 5 minutes.");
      return;
    }

    setLoading(true);
    try {
      const res = await api.post("/admin/login", { email, password });
      localStorage.setItem("adminToken", res.data.token);
      
      // Clear security data on successful login
      localStorage.removeItem("adminLoginAttempts");
      localStorage.removeItem("adminLockoutTime");
      setLoginAttempts(0);
      
      router.push("/admin/tracked_stores");
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || "Invalid credentials or server issue";
      setError(errorMessage);
      
      // Increment failed attempts
      const newAttempts = loginAttempts + 1;
      setLoginAttempts(newAttempts);
      localStorage.setItem("adminLoginAttempts", newAttempts.toString());
      
      // Generate new CAPTCHA
      setCaptchaAnswer("");
      generateCaptcha();
      
      // Show remaining attempts
      if (newAttempts >= 3) {
        setError(`${errorMessage} (${5 - newAttempts} attempts remaining)`);
      }
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (milliseconds: number) => {
    const seconds = Math.ceil(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-teal-50 flex items-center justify-center px-4 relative">
      {/* Logout button for logged-in users */}
      {isLoggedIn && (
        <div className="absolute top-4 right-4 z-10">
          <LogoutButton 
            variant="gradient"
            size="sm"
            compact={true}
            className="shadow-lg"
          />
        </div>
      )}
      <div className="w-full max-w-md">
        <Button
          onClick={() => router.push("/")}
          className="absolute top-4 right-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 px-4 rounded-lg font-medium hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 shadow-md"
        >
          Back to Home
        </Button>
        
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-extrabold text-indigo-700 mb-2 tracking-tight">
            Supplier Login
          </h1>
          <p className="text-indigo-400">
            Access your dashboard to manage store inventory and stock operations 🛒
          </p>
        </div>

        {/* Security Warning */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6 flex items-start space-x-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-amber-800">
            <p className="font-medium mb-1">Security Notice</p>
            <p>This is a secure admin area. Multiple failed attempts will temporarily lock your account.</p>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur rounded-2xl shadow-xl border border-indigo-100 p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all"
                required
                disabled={isLocked}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 pr-12 rounded-lg border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all"
                  required
                  disabled={isLocked}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  disabled={isLocked}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* CAPTCHA */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                <Shield className="w-4 h-4 mr-2 text-indigo-600" />
                Security Verification
              </label>
              <div className="flex items-center space-x-3">
                <div className="flex-1 bg-gray-50 px-4 py-3 rounded-lg border border-gray-200 text-center font-mono text-lg">
                  {captchaQuestion}
                </div>
                <input
                  type="number"
                  placeholder="Answer"
                  value={captchaAnswer}
                  onChange={(e) => setCaptchaAnswer(e.target.value)}
                  className="w-24 px-3 py-3 rounded-lg border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all text-center"
                  required
                  disabled={isLocked}
                />
              </div>
            </div>

            {/* Lockout Timer */}
            {isLocked && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                <p className="text-red-700 font-medium mb-1">Account Temporarily Locked</p>
                <p className="text-red-600 text-sm">
                  Time remaining: {formatTime(lockoutTime - Date.now())}
                </p>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || isLocked}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 px-4 rounded-lg font-medium hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 shadow-md mb-4"
            >
              {loading ? (
                <>
                  <Loader className="w-5 h-5 mr-2 animate-spin" />
                  Signing In...
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {/* Password Change Link */}
            <div className="text-center pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={() => setShowPasswordChange(true)}
                className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-lg border border-indigo-200 hover:bg-indigo-100 hover:text-indigo-700 hover:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all duration-200 mb-3 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isLocked}
              >
                <Shield className="w-4 h-4 mr-2" />
                Forgot your dummy password? Change it here
              </button>
              <p className="text-gray-600 text-sm mb-3">
                Don't have a supplier account yet?
              </p>
              <Link 
                href="/admin-register" 
                className="inline-flex items-center justify-center px-6 py-2 border border-indigo-300 text-indigo-700 bg-white rounded-lg hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all duration-200 text-sm font-medium"
              >
                Register as Supplier
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </div>
          </form>
        </div>
      </div>

      {/* Password Change Modal */}
      <PasswordChangeModal
        isOpen={showPasswordChange}
        onClose={() => setShowPasswordChange(false)}
        userType="admin"
        userEmail={email}
        method="otp"
      />
    </div>
  );
}
