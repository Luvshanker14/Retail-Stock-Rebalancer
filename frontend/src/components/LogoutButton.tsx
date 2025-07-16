'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { LogOut, Power } from 'lucide-react';
import { useDarkMode } from '@/hooks/useDarkMode';
import { motion } from 'framer-motion';

interface LogoutButtonProps {
  variant?: 'default' | 'ghost' | 'outline' | 'gradient';
  size?: 'default' | 'sm' | 'lg';
  className?: string;
  showIcon?: boolean;
  showText?: boolean;
  compact?: boolean;
}

export default function LogoutButton({ 
  variant = 'gradient', 
  size = 'default', 
  className = '',
  showIcon = true,
  showText = true,
  compact = false
}: LogoutButtonProps) {
  const router = useRouter();
  const { isDark } = useDarkMode();

  const handleLogout = () => {
    // Clear all tokens
    localStorage.removeItem('customerToken');
    localStorage.removeItem('adminToken');
    
    // Clear any other stored data
    localStorage.removeItem('selectedCity');
    
    // Redirect to appropriate login page
    // Check current path to determine which login to redirect to
    const currentPath = window.location.pathname;
    
    if (currentPath.includes('/admin')) {
      router.push('/admin/login');
    } else {
      router.push('/customer/login');
    }
  };

  const getButtonStyles = () => {
    const baseStyles = 'transition-all duration-300 font-medium relative overflow-hidden group';
    
    switch (variant) {
      case 'gradient':
        return `${baseStyles} bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95`;
      
      case 'default':
        return `${baseStyles} ${
          isDark 
            ? 'bg-gray-700 hover:bg-gray-600 text-white border border-gray-600' 
            : 'bg-gray-800 hover:bg-gray-700 text-white border border-gray-300'
        } shadow-md hover:shadow-lg`;
      
      case 'outline':
        return `${baseStyles} ${
          isDark 
            ? 'border-red-400 text-red-400 hover:bg-red-400 hover:text-white' 
            : 'border-red-500 text-red-600 hover:bg-red-500 hover:text-white'
        } border-2 hover:shadow-md`;
      
      case 'ghost':
      default:
        return `${baseStyles} ${
          isDark 
            ? 'text-gray-300 hover:text-red-400 hover:bg-red-900/20' 
            : 'text-gray-600 hover:text-red-600 hover:bg-red-50'
        }`;
    }
  };

  const getIconSize = () => {
    switch (size) {
      case 'sm': return 'w-4 h-4';
      case 'lg': return 'w-6 h-6';
      default: return 'w-5 h-5';
    }
  };

  const getTextSize = () => {
    switch (size) {
      case 'sm': return 'text-sm';
      case 'lg': return 'text-lg';
      default: return 'text-base';
    }
  };

  const getPadding = () => {
    if (compact) {
      switch (size) {
        case 'sm': return 'px-2 py-1';
        case 'lg': return 'px-4 py-2';
        default: return 'px-3 py-1.5';
      }
    } else {
      switch (size) {
        case 'sm': return 'px-3 py-1.5';
        case 'lg': return 'px-6 py-3';
        default: return 'px-4 py-2';
      }
    }
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="inline-block"
    >
      <Button
        variant={variant === 'gradient' ? 'default' : variant}
        size={size}
        onClick={handleLogout}
        className={`${getButtonStyles()} ${getPadding()} ${getTextSize()} ${className}`}
      >
        {/* Gradient overlay for gradient variant */}
        {variant === 'gradient' && (
          <div className="absolute inset-0 bg-gradient-to-r from-red-600 to-orange-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        )}
        
        {/* Content */}
        <div className="relative z-10 flex items-center gap-2">
          {showIcon && (
            <motion.div
              whileHover={{ rotate: 15 }}
              transition={{ duration: 0.2 }}
            >
              {variant === 'gradient' ? (
                <Power className={`${getIconSize()} text-white`} />
              ) : (
                <LogOut className={`${getIconSize()}`} />
              )}
            </motion.div>
          )}
          {showText && (
            <span className="font-semibold">
              {compact ? 'Exit' : 'Logout'}
            </span>
          )}
        </div>
        
        {/* Ripple effect */}
        <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-md" />
      </Button>
    </motion.div>
  );
}
