'use client';

import React, { useState } from 'react';
import { Lock, Settings } from 'lucide-react';
import { motion } from 'framer-motion';
import PasswordChangeModal from './PasswordChangeModal';

interface PasswordChangeButtonProps {
  userType: 'customer' | 'admin' | 'super_admin';
  userEmail?: string;
  variant?: 'button' | 'icon' | 'text';
  className?: string;
}

export default function PasswordChangeButton({ 
  userType, 
  userEmail, 
  variant = 'button',
  className = ''
}: PasswordChangeButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [method, setMethod] = useState<'otp' | 'current'>('current');

  const openModal = (selectedMethod: 'otp' | 'current') => {
    setMethod(selectedMethod);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  if (variant === 'icon') {
    return (
      <>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => openModal('current')}
          className={`p-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl relative z-10 ${className}`}
          title="Change Password"
        >
          <Lock size={20} />
        </motion.button>

        <PasswordChangeModal
          isOpen={isModalOpen}
          onClose={closeModal}
          userType={userType}
          userEmail={userEmail}
          method={method}
        />
      </>
    );
  }

  if (variant === 'text') {
    return (
      <>
        <div className="flex flex-col space-y-2">
          <button
            onClick={() => openModal('current')}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors"
          >
            Change Password (Current)
          </button>
          <button
            onClick={() => openModal('otp')}
            className="text-purple-600 hover:text-purple-800 text-sm font-medium transition-colors"
          >
            Change Password (OTP)
          </button>
        </div>

        <PasswordChangeModal
          isOpen={isModalOpen}
          onClose={closeModal}
          userType={userType}
          userEmail={userEmail}
          method={method}
        />
      </>
    );
  }

  return (
    <>
      <div className="flex space-x-2 relative z-10">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => openModal('current')}
          className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-md hover:shadow-lg"
        >
          <Lock size={16} />
          <span>Change Password</span>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => openModal('otp')}
          className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all duration-200 shadow-md hover:shadow-lg"
        >
          <Settings size={16} />
          <span>Reset Password</span>
        </motion.button>
      </div>

      <PasswordChangeModal
        isOpen={isModalOpen}
        onClose={closeModal}
        userType={userType}
        userEmail={userEmail}
        method={method}
      />
    </>
  );
} 