"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { 
  CheckCircle, 
  Mail, 
  Clock, 
  Store,
  ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AdminRegisterSuccessPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white/10 backdrop-blur-lg rounded-xl p-8 border border-white/20 max-w-md w-full mx-4 text-center"
      >
        <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-8 h-8 text-green-400" />
        </div>
        
        <h1 className="text-2xl font-bold text-white mb-4">
          Supplier Registration Successful!
        </h1>
        
        <p className="text-gray-300 mb-6">
          Thank you for registering as a supplier with Retail Stock Rebalancer. Your application has been submitted and is under review.
        </p>
        
        <div className="space-y-4 mb-8">
          <div className="flex items-center space-x-3 text-gray-300">
            <Mail className="w-5 h-5 text-blue-400" />
            <span>Check your email for confirmation</span>
          </div>
          
          <div className="flex items-center space-x-3 text-gray-300">
            <Clock className="w-5 h-5 text-yellow-400" />
            <span>Review process takes 24-48 hours</span>
          </div>
          
          <div className="flex items-center space-x-3 text-gray-300">
            <Store className="w-5 h-5 text-green-400" />
            <span>You'll receive supplier access upon approval</span>
          </div>
        </div>
        
        <div className="space-y-3">
          <Button
            onClick={() => router.push("/")}
            className="w-full bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white"
          >
            Return to Home
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
          
          <Button
            variant="ghost"
            onClick={() => router.push("/admin/login")}
            className="w-full text-gray-400 hover:text-white"
          >
            Admin Login
          </Button>
        </div>
      </motion.div>
    </div>
  );
} 