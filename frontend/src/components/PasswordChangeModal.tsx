'use client';

import React, { useState } from 'react';
import { X, Eye, EyeOff, Lock, Mail, AlertCircle, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '@/lib/api';

interface PasswordChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  userType: 'customer' | 'admin' | 'super_admin';
  userEmail?: string;
  method: 'otp' | 'current';
}

export default function PasswordChangeModal({ 
  isOpen, 
  onClose, 
  userType, 
  userEmail, 
  method 
}: PasswordChangeModalProps) {
  const [step, setStep] = useState<'form' | 'otp' | 'success'>('form');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Form data
  const [email, setEmail] = useState(userEmail || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otp, setOtp] = useState('');
  
  // Password visibility
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Password strength
  const [passwordStrength, setPasswordStrength] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false
  });

  const validatePassword = (password: string) => {
    setPasswordStrength({
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /\d/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    });
  };

  const handleNewPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const password = e.target.value;
    setNewPassword(password);
    validatePassword(password);
  };

  const isPasswordValid = Object.values(passwordStrength).every(Boolean);
  const passwordsMatch = newPassword === confirmPassword;

  const sendOTP = async () => {
    if (!email) {
      setError('Please enter your email address');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await api.post('/password/send-otp', {
        email,
        userType
      });
      
      setStep('otp');
      setSuccess('OTP sent to your email address');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const changePasswordWithOTP = async () => {
    if (!otp || !newPassword || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

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
      await api.post('/password/change-with-otp', {
        email,
        userType,
        otp,
        newPassword
      });
      
      setStep('success');
      setSuccess('Password changed successfully!');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const changePasswordWithCurrent = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

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
      await api.post('/password/change-with-current', {
        currentPassword,
        newPassword
      });
      
      setStep('success');
      setSuccess('Password changed successfully!');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setStep('form');
    setError('');
    setSuccess('');
    setEmail(userEmail || '');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setOtp('');
    onClose();
  };

  const getStrengthColor = (isValid: boolean) => isValid ? 'text-green-500' : 'text-gray-400';
  const getStrengthIcon = (isValid: boolean) => isValid ? <CheckCircle size={16} /> : <AlertCircle size={16} />;

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden relative"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white relative">
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 text-white hover:text-gray-200 transition-colors p-1 rounded-full hover:bg-white/10"
              title="Close"
            >
              <X size={20} />
            </button>
            <div className="flex items-center space-x-3">
              <div className="bg-white bg-opacity-20 p-2 rounded-lg">
                <Lock size={24} />
              </div>
              <div>
                <h2 className="text-xl font-bold">
                  {userType === 'admin' ? 'Change Your Password' : 'Change Password'}
                </h2>
                <p className="text-blue-100 text-sm">
                  {userType === 'admin' 
                    ? 'Update your dummy password to a secure one' 
                    : method === 'otp' 
                      ? 'Via Email OTP' 
                      : 'With Current Password'
                  }
                </p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 flex items-center space-x-2"
              >
                <AlertCircle size={16} className="text-red-500" />
                <span className="text-red-700 text-sm">{error}</span>
              </motion.div>
            )}

            {success && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4 flex items-center space-x-2"
              >
                <CheckCircle size={16} className="text-green-500" />
                <span className="text-green-700 text-sm">{success}</span>
              </motion.div>
            )}

            {step === 'form' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-4"
              >
                {method === 'otp' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter your email"
                      />
                    </div>
                    {userType === 'admin' && (
                      <p className="text-sm text-gray-600 mt-2">
                        Enter the email address where you received your dummy password
                      </p>
                    )}
                  </div>
                )}

                {method === 'current' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Current Password
                    </label>
                    <div className="relative">
                      <Lock size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        type={showCurrentPassword ? 'text' : 'password'}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter current password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showCurrentPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    New Password
                  </label>
                  <div className="relative">
                    <Lock size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={handleNewPasswordChange}
                      className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter new password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <Lock size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Confirm new password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                {/* Password Strength Indicator */}
                {newPassword && (
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

                <div className="flex space-x-3 pt-4">
                  <button
                    onClick={handleClose}
                    className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={method === 'otp' ? sendOTP : changePasswordWithCurrent}
                    disabled={loading || !isPasswordValid || !passwordsMatch}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <div className="flex items-center justify-center space-x-2">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Processing...</span>
                      </div>
                    ) : (
                      method === 'otp' ? 'Send OTP' : 'Change Password'
                    )}
                  </button>
                </div>
              </motion.div>
            )}

            {step === 'otp' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Enter OTP
                  </label>
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-lg tracking-widest"
                    placeholder="000000"
                    maxLength={6}
                  />
                  <p className="text-sm text-gray-500 mt-2">
                    Enter the 6-digit code sent to your email
                  </p>
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={() => setStep('form')}
                    className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                  >
                    Back
                  </button>
                  <button
                    onClick={changePasswordWithOTP}
                    disabled={loading || otp.length !== 6}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Changing...' : 'Change Password'}
                  </button>
                </div>
              </motion.div>
            )}

            {step === 'success' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center space-y-4"
              >
                <div className="bg-green-100 p-4 rounded-full w-16 h-16 mx-auto flex items-center justify-center">
                  <CheckCircle size={32} className="text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Password Changed Successfully!
                  </h3>
                  <p className="text-gray-600">
                    Your password has been updated. You can now close this window.
                  </p>
                </div>
                <button
                  onClick={handleClose}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-200"
                >
                  Close
                </button>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
} 