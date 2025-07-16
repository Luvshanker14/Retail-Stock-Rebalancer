'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader, Eye, EyeOff, CheckCircle, XCircle, Home, ArrowRight, Shield, User, Mail, Lock } from 'lucide-react';
import { validatePassword, getPasswordStrengthColor, getPasswordStrengthText } from '@/lib/passwordValidation';
import LogoutButton from '@/components/LogoutButton';
import PasswordChangeButton from '@/components/PasswordChangeButton';
import PasswordChangeModal from '@/components/PasswordChangeModal';

export default function CustomerAuthPage() {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordValidation, setPasswordValidation] = useState<any>(null);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const router = useRouter();

  // Check if user is logged in on client side
  useEffect(() => {
    const customerToken = localStorage.getItem('customerToken');
    const adminToken = localStorage.getItem('adminToken');
    setIsLoggedIn(!!(customerToken || adminToken));
  }, []);

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    if (mode === 'signup' && value) {
      setPasswordValidation(validatePassword(value));
    } else {
      setPasswordValidation(null);
    }
  };

  const startResendTimer = () => {
    setResendTimer(60);
    const interval = setInterval(() => {
      setResendTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleSendOTP = async () => {
    if (!email || !password || !name) {
      toast.error('Please fill in all fields');
      return;
    }

    if (passwordValidation && !passwordValidation.isValid) {
      toast.error('Please fix password requirements');
      return;
    }

    setOtpLoading(true);
    try {
      await api.post('/customer/send-signup-otp', { name, email, password });
      setOtpSent(true);
      startResendTimer();
      toast.success('OTP sent to your email!');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to send OTP');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp || otp.length !== 6) {
      toast.error('Please enter a valid 6-digit OTP');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/customer/verify-signup-otp', { email, otp });
      
      if (res.data.token) {
        localStorage.setItem('customerToken', res.data.token);
        toast.success('Account created successfully!');
        router.push('/customer/home');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (resendTimer > 0) return;
    
    setOtpLoading(true);
    try {
      await api.post('/customer/send-signup-otp', { name, email, password });
      startResendTimer();
      toast.success('OTP resent successfully!');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to resend OTP');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!email || !password || (mode === 'signup' && !name)) {
      toast.error('Please fill in all fields');
      return;
    }

    // Only validate password for signup, not login
    if (mode === 'signup' && passwordValidation && !passwordValidation.isValid) {
      toast.error('Please fix password requirements');
      return;
    }

    if (mode === 'login') {
      setLoading(true);
      try {
        const res = await api.post('/customer/login', { email, password });
        if (res.data.token) {
          localStorage.setItem('customerToken', res.data.token);
          toast.success('Welcome back!');
          router.push('/customer/home');
        }
      } catch (err) {
        toast.error('Invalid credentials or server issue');
      } finally {
        setLoading(false);
      }
    } else {
      // For signup, send OTP first
      handleSendOTP();
    }
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
      {/* Back to Home button always at top right of page */}
      <Button
        onClick={() => router.push("/")}
        className="absolute top-4 right-4 bg-gradient-to-r from-indigo-600 to-teal-600 text-white py-3 px-4 rounded-lg font-medium hover:from-indigo-700 hover:to-teal-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 shadow-md z-20"
      >
        <Home className="w-4 h-4" />
        Back to Home
      </Button>
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md"
      >
        
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-extrabold text-gray-900 mb-2 tracking-tight">
            {mode === 'login' ? 'Welcome Back' : 'Create Account'}
          </h1>
          <p className="text-xl text-gray-600 max-w-xs mx-auto">
            {mode === 'login' 
              ? 'Sign in to access your shopping experience' 
              : 'Join us for seamless retail shopping'
            }
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white/80 backdrop-blur rounded-2xl shadow-xl border border-gray-100 p-8">
          <form onSubmit={(e) => { e.preventDefault(); otpSent ? handleVerifyOTP() : handleSubmit(); }} className="space-y-6">
            {mode === 'signup' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                  <User className="w-4 h-4 mr-2 text-indigo-600" />
                  Full Name
                </label>
                <Input
                  type="text"
                  placeholder="Enter your full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      otpSent ? handleVerifyOTP() : handleSubmit();
                    }
                  }}
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                <Mail className="w-4 h-4 mr-2 text-indigo-600" />
                Email Address
              </label>
              <Input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    otpSent ? handleVerifyOTP() : handleSubmit();
                  }
                }}
                className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                <Lock className="w-4 h-4 mr-2 text-indigo-600" />
                Password
              </label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => handlePasswordChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      otpSent ? handleVerifyOTP() : handleSubmit();
                    }
                  }}
                  className="w-full px-4 py-3 pr-12 rounded-lg border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              
              {/* Password Requirements (only show for signup) */}
              {mode === 'signup' && password && (
                <div className="mt-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-gray-700">Password Strength:</span>
                    <span className={`text-sm font-semibold ${getPasswordStrengthColor(passwordValidation?.strength || 'weak')}`}>
                      {getPasswordStrengthText(passwordValidation?.strength || 'weak')}
                    </span>
                  </div>
                  
                  <div className="space-y-2">
                    <div className={`flex items-center gap-2 text-sm ${password.length >= 8 ? 'text-green-600' : 'text-gray-500'}`}>
                      {password.length >= 8 ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                      At least 8 characters
                    </div>
                    <div className={`flex items-center gap-2 text-sm ${/[A-Z]/.test(password) ? 'text-green-600' : 'text-gray-500'}`}>
                      {/[A-Z]/.test(password) ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                      One uppercase letter
                    </div>
                    <div className={`flex items-center gap-2 text-sm ${/[a-z]/.test(password) ? 'text-green-600' : 'text-gray-500'}`}>
                      {/[a-z]/.test(password) ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                      One lowercase letter
                    </div>
                    <div className={`flex items-center gap-2 text-sm ${/\d/.test(password) ? 'text-green-600' : 'text-gray-500'}`}>
                      {/\d/.test(password) ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                      One digit
                    </div>
                    <div className={`flex items-center gap-2 text-sm ${/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password) ? 'text-green-600' : 'text-gray-500'}`}>
                      {/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password) ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                      One special character
                    </div>
                  </div>
                </div>
              )}

              {/* OTP Input (only show for signup after OTP is sent) */}
              {mode === 'signup' && otpSent && (
                <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-200">
                  <div className="flex items-center justify-between mb-4">
                    <label className="block text-sm font-medium text-gray-700 flex items-center">
                      <Shield className="w-4 h-4 mr-2 text-indigo-600" />
                      Enter OTP
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setOtpSent(false);
                        setOtp('');
                        setResendTimer(0);
                      }}
                      className="text-xs text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
                    >
                      ← Back to Signup
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      placeholder="Enter 6-digit OTP"
                      value={otp}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                        setOtp(value);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleVerifyOTP();
                        }
                      }}
                      className="flex-1 text-center text-lg font-mono tracking-widest"
                      maxLength={6}
                    />
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-xs text-gray-600">
                      Check your email for the OTP
                    </span>
                    <button
                      type="button"
                      onClick={handleResendOTP}
                      disabled={resendTimer > 0 || otpLoading}
                      className={`text-xs font-medium transition-colors ${
                        resendTimer > 0 
                          ? 'text-gray-400 cursor-not-allowed' 
                          : 'text-indigo-600 hover:text-indigo-800'
                      }`}
                    >
                      {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend OTP'}
                    </button>
                  </div>
                </div>
              )}
            </div>

            <Button
              type="submit"
              disabled={loading || otpLoading}
              className="w-full bg-gradient-to-r from-indigo-500 to-teal-500 hover:from-indigo-600 hover:to-teal-600 text-white py-3 px-4 rounded-lg font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 shadow-md"
            >
              {loading || otpLoading ? (
                <div className="flex items-center gap-2">
                  <Loader className="w-4 h-4 animate-spin" />
                  {mode === 'login' 
                    ? 'Signing in...' 
                    : otpSent 
                      ? 'Verifying OTP...' 
                      : 'Sending OTP...'
                  }
                </div>
              ) : (
                <>
                  <span>
                    {mode === 'login' 
                      ? 'Sign In' 
                      : otpSent 
                        ? 'Verify OTP & Create Account' 
                        : 'Send OTP'
                    }
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>

            <div className="text-center">
              <p className="text-sm text-gray-600">
                {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode(mode === 'login' ? 'signup' : 'login');
                    setPasswordValidation(null);
                    setPassword('');
                    setOtpSent(false);
                    setOtp('');
                    setResendTimer(0);
                  }}
                  className="text-indigo-600 hover:text-indigo-800 font-semibold transition-colors"
                >
                  {mode === 'login' ? 'Sign up' : 'Sign in'}
                </button>
              </p>
            </div>
          </form>
          
          {/* Password Change Link */}
          {mode === 'login' && (
            <div className="text-center pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={() => setShowPasswordChange(true)}
                className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-lg border border-indigo-200 hover:bg-indigo-100 hover:text-indigo-700 hover:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all duration-200"
              >
                <Shield className="w-4 h-4 mr-2" />
                Forgot Password? Change it here
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-xs text-gray-500">
            By continuing, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </motion.div>

      {/* Password Change Modal */}
      <PasswordChangeModal
        isOpen={showPasswordChange}
        onClose={() => setShowPasswordChange(false)}
        userType="customer"
        userEmail={email}
        method="otp"
      />
    </div>
  );
}
