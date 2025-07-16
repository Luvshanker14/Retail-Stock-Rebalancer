'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Lock, CheckCircle, AlertCircle, ArrowRight } from 'lucide-react';
import api from '@/lib/api';
import useAuth from '@/hooks/useAuth';

export default function AdminPasswordSetupPage() {
  const { loading: authLoading } = useAuth();
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [adminInfo, setAdminInfo] = useState<any>(null);
  const [passwordStrength, setPasswordStrength] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false
  });

  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const tokenFromUrl = searchParams.get('token');
    if (tokenFromUrl) {
      setToken(tokenFromUrl);
      verifyToken(tokenFromUrl);
    } else {
      setError('No setup token found in URL');
      setVerifying(false);
    }
  }, [searchParams]);

  const verifyToken = async (tokenValue: string) => {
    try {
      const response = await api.get(`/password-setup/verify/${tokenValue}`);
      setAdminInfo(response.data.admin);
      setVerifying(false);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid or expired setup link');
      setVerifying(false);
    }
  };

  const validatePassword = (password: string) => {
    setPasswordStrength({
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /\d/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    });
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPassword = e.target.value;
    setPassword(newPassword);
    validatePassword(newPassword);
  };

  const isPasswordValid = Object.values(passwordStrength).every(Boolean);
  const passwordsMatch = password === confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isPasswordValid) {
      setError('Please ensure your password meets all requirements');
      return;
    }

    if (!passwordsMatch) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await api.post('/password-setup/setup', {
        token,
        password
      });
      
      setSuccess('Password set up successfully! Redirecting to login...');
      
      // Redirect to login page after 2 seconds
      setTimeout(() => {
        router.push('/admin/login');
      }, 2000);
      
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to set up password');
    } finally {
      setLoading(false);
    }
  };

  const getStrengthColor = (isValid: boolean) => isValid ? 'text-green-500' : 'text-gray-400';
  const getStrengthIcon = (isValid: boolean) => isValid ? <CheckCircle size={16} /> : <AlertCircle size={16} />;

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-400">Loading...</p>
      </div>
    );
  }

  if (verifying) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-teal-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Verifying your setup link...</p>
        </div>
      </div>
    );
  }

  if (error && !adminInfo) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-teal-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Setup Link Invalid</h1>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={() => router.push('/admin/login')}
              className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Go to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-teal-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-r from-indigo-500 to-teal-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Set Up Your Password</h1>
          <p className="text-gray-600">
            Welcome, {adminInfo?.name}! Let's secure your account.
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-indigo-100 p-8">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-center space-x-2">
              <AlertCircle size={16} className="text-red-500" />
              <span className="text-red-700 text-sm">{error}</span>
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 flex items-center space-x-2">
              <CheckCircle size={16} className="text-green-500" />
              <span className="text-green-700 text-sm">{success}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={adminInfo?.email || ''}
                disabled
                className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-gray-50 text-gray-600"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={handlePasswordChange}
                  className="w-full px-4 py-3 pr-12 rounded-lg border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all"
                  placeholder="Enter your new password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 pr-12 rounded-lg border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all"
                  placeholder="Confirm your new password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Password Strength Indicator */}
            {password && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Password Requirements:</h4>
                <div className="space-y-2">
                  {Object.entries(passwordStrength).map(([key, isValid]) => (
                    <div key={key} className="flex items-center space-x-2">
                      <span className={getStrengthColor(isValid)}>
                        {getStrengthIcon(isValid)}
                      </span>
                      <span className={`text-sm ${getStrengthColor(isValid)}`}>
                        {key === 'length' && 'At least 8 characters'}
                        {key === 'uppercase' && 'One uppercase letter'}
                        {key === 'lowercase' && 'One lowercase letter'}
                        {key === 'number' && 'One number'}
                        {key === 'special' && 'One special character'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !isPasswordValid || !passwordsMatch}
              className="w-full bg-gradient-to-r from-indigo-600 to-teal-600 text-white py-3 px-4 rounded-lg font-medium hover:from-indigo-700 hover:to-teal-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <>
                  <span>Set Up Password</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="text-center mt-6 pt-6 border-t border-gray-200">
            <p className="text-gray-600 text-sm">
              Already have an account?{' '}
              <button
                onClick={() => router.push('/admin/login')}
                className="text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
              >
                Sign in here
              </button>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-xs text-gray-500">
            This setup link is secure and will expire in 24 hours
          </p>
        </div>
      </motion.div>
    </div>
  );
} 