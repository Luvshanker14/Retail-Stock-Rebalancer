"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { 
  Store, 
  User, 
  Mail, 
  MapPin, 
  CreditCard, 
  CheckCircle, 
  ArrowRight,
  Shield,
  Zap,
  Crown,
  Star
} from "lucide-react";
import { Button } from "@/components/ui/button";
import api from "@/lib/api"; // Added import for api

interface SubscriptionPlan {
  id: number;
  name: string;
  price: number;
  duration_days: number;
  features: string[];
  trial_days: number;
  popular?: boolean;
}

const subscriptionPlans: SubscriptionPlan[] = [
  {
    id: 1,
    name: "Basic",
    price: 999,
    duration_days: 30,
    trial_days: 7,
    features: [
      "Store Management",
      "Stock Tracking", 
      "Basic Analytics",
      "Email Alerts",
      "Mobile App Access"
    ]
  },
  {
    id: 2,
    name: "Premium",
    price: 1999,
    duration_days: 30,
    trial_days: 7,
    popular: true,
    features: [
      "Everything in Basic",
      "Advanced Analytics",
      "Multi-Store Support",
      "Priority Support",
      "Custom Reports",
      "API Access"
    ]
  },
  {
    id: 3,
    name: "Enterprise",
    price: 4999,
    duration_days: 30,
    trial_days: 7,
    features: [
      "Everything in Premium",
      "Custom Integrations",
      "Dedicated Support",
      "White Label",
      "Advanced Security",
      "SLA Guarantee"
    ]
  }
];

const planDiscountRates: Record<number, { label: string; color: string }> = {
  1: { label: '15% Discount Rate', color: 'from-amber-400 to-yellow-700 text-amber-900 border-amber-300' }, // Basic (Bronze)
  2: { label: '10% Discount Rate', color: 'from-gray-300 to-gray-500 text-gray-800 border-gray-300' },      // Premium (Silver)
  3: { label: '5% Discount Rate',  color: 'from-[#FFD700] to-[#B8860B] text-[#7c5700] border-[#FFD700]' }, // Enterprise (Gold, richer)
};

interface RegistrationForm {
  name: string;
  email: string;
  company_name: string;
  business_category: string;
  business_location: string;
  plan_id: number;
}

export default function AdminRegisterPage() {
  const [formData, setFormData] = useState<RegistrationForm>({
    name: "",
    email: "",
    company_name: "",
    business_category: "",
    business_location: "",
    plan_id: 1
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState(1);
  const router = useRouter();

  useEffect(() => {
    // Load Razorpay script
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const handleInputChange = (field: keyof RegistrationForm, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError("");
  };

  const validateStep1 = () => {
    if (!formData.name.trim()) return "Name is required";
    if (!formData.email.trim()) return "Email is required";
    if (!formData.email.includes("@")) return "Valid email is required";
    if (!formData.company_name.trim()) return "Company name is required";
    if (!formData.business_category.trim()) return "Business category is required";
    if (!formData.business_location.trim()) return "Business location is required";
    return null;
  };

  const handleNextStep = () => {
    const validationError = validateStep1();
    if (validationError) {
      setError(validationError);
      return;
    }
    setStep(2);
  };

  const handleBackStep = () => {
    setStep(1);
    setError("");
  };

  const handleRegistration = async () => {
    setLoading(true);
    setError("");

    try {
      console.log("Starting registration with data:", formData);
      
      // Step 1: Create admin request
      const registrationResponse = await api.post('/admin-registration/register', formData);
      console.log("Registration response:", registrationResponse);

      const registrationData = registrationResponse.data;
      
      // Step 2: Initialize Razorpay payment
      const options = {
        key: registrationData.payment_order.key_id,
        amount: registrationData.payment_order.amount,
        currency: registrationData.payment_order.currency,
        name: 'Retail Stock Rebalancer',
        description: `${subscriptionPlans.find(plan => plan.id === formData.plan_id)?.name} Plan - ${formData.company_name}`,
        order_id: registrationData.payment_order.id,
        handler: async function (response: any) {
          console.log("Payment response:", response);
          try {
            // Step 3: Verify payment
            const verifyResponse = await api.post('/admin-registration/verify-payment', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });

            // Payment successful - redirect to success page
            router.push('/admin-register/success');
          } catch (verifyError: any) {
            console.error("Payment verification error:", verifyError);
            setError(verifyError.response?.data?.message || verifyError.message);
            setLoading(false);
          }
        },
        prefill: {
          name: formData.name,
          email: formData.email,
        },
        theme: {
          color: '#10B981',
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();

    } catch (err: any) {
      console.error("Registration error:", err);
      console.error("Error response:", err.response?.data);
      
      if (err.response?.data?.missing_fields) {
        const missingFields = err.response.data.missing_fields;
        const missingFieldNames = Object.keys(missingFields).filter(key => missingFields[key]);
        setError(`Missing required fields: ${missingFieldNames.join(', ')}`);
      } else {
        setError(err.response?.data?.message || err.message || 'Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const selectedPlan = subscriptionPlans.find(plan => plan.id === formData.plan_id);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Header */}
      <header className="bg-white/10 backdrop-blur-lg border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-r from-green-400 to-blue-500 rounded-lg flex items-center justify-center">
                <Store className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Supplier Registration</h1>
                <p className="text-gray-400 text-sm">Join our platform as a supplier</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                onClick={() => router.push("/admin/login")}
                className="text-gray-400 hover:text-white border border-gray-600 hover:border-gray-500"
              >
                Already a supplier? Login here
              </Button>
              <Button
                variant="ghost"
                onClick={() => router.push("/")}
                className="text-gray-400 hover:text-white"
              >
                Back to Home
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Progress Steps */}
        <div className="flex justify-center mb-12">
          <div className="flex items-center space-x-4">
            <div className={`flex items-center space-x-2 ${step >= 1 ? 'text-green-400' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${step >= 1 ? 'border-green-400 bg-green-400/20' : 'border-gray-400'}`}>
                {step > 1 ? <CheckCircle className="w-4 h-4" /> : <span className="text-sm">1</span>}
              </div>
              <span className="text-sm font-medium">Store Details</span>
            </div>
            
            <ArrowRight className="w-4 h-4 text-gray-400" />
            
            <div className={`flex items-center space-x-2 ${step >= 2 ? 'text-green-400' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${step >= 2 ? 'border-green-400 bg-green-400/20' : 'border-gray-400'}`}>
                <span className="text-sm">2</span>
              </div>
              <span className="text-sm font-medium">Payment</span>
            </div>
          </div>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-500/20 border border-red-500/30 rounded-lg p-4 mb-8"
          >
            <p className="text-red-400">{error}</p>
          </motion.div>
        )}

        {/* Step 1: Store Details */}
        {step === 1 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-12"
          >
            {/* Form */}
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-8 border border-white/20">
              <h2 className="text-2xl font-bold text-white mb-6">Company Information</h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">
                    Full Name *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleInputChange("name", e.target.value)}
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg pl-10 pr-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-400"
                      placeholder="Enter your full name"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">
                    Email Address *
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg pl-10 pr-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-400"
                      placeholder="Enter your email address"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">
                    Company Name *
                  </label>
                  <div className="relative">
                    <Store className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={formData.company_name}
                      onChange={(e) => handleInputChange("company_name", e.target.value)}
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg pl-10 pr-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-400"
                      placeholder="Enter your company name"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">
                    Business Category *
                  </label>
                  <select
                    value={formData.business_category}
                    onChange={(e) => handleInputChange("business_category", e.target.value)}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-green-400"
                  >
                    <option value="">Select category</option>
                    <option value="Electronics Supplier">Electronics Supplier</option>
                    <option value="Fashion & Apparel">Fashion & Apparel</option>
                    <option value="Food & Beverage">Food & Beverage</option>
                    <option value="Home & Garden">Home & Garden</option>
                    <option value="Sports & Fitness">Sports & Fitness</option>
                    <option value="Books & Stationery">Books & Stationery</option>
                    <option value="Health & Beauty">Health & Beauty</option>
                    <option value="Automotive Parts">Automotive Parts</option>
                    <option value="Pharmaceuticals">Pharmaceuticals</option>
                    <option value="Industrial Supplies">Industrial Supplies</option>
                    <option value="Wholesale Distributor">Wholesale Distributor</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">
                    Business Location *
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={formData.business_location}
                      onChange={(e) => handleInputChange("business_location", e.target.value)}
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg pl-10 pr-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-400"
                      placeholder="City, State"
                    />
                  </div>
                </div>
              </div>

              <Button
                onClick={handleNextStep}
                className="w-full mt-8 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white"
              >
                Continue to Payment
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>

            {/* Benefits */}
            <div className="space-y-6">
              <div className="bg-white/10 backdrop-blur-lg rounded-xl p-8 border border-white/20">
                <h3 className="text-xl font-bold text-white mb-4">Why Join as a Supplier?</h3>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <Zap className="w-5 h-5 text-yellow-400" />
                    <span className="text-gray-300">Reach thousands of retail stores</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Shield className="w-5 h-5 text-green-400" />
                    <span className="text-gray-300">Secure payment processing</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Star className="w-5 h-5 text-blue-400" />
                    <span className="text-gray-300">Advanced inventory management</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Crown className="w-5 h-5 text-purple-400" />
                    <span className="text-gray-300">Priority support & analytics</span>
                  </div>
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur-lg rounded-xl p-8 border border-white/20">
                <h3 className="text-xl font-bold text-white mb-4">What's Included?</h3>
                <ul className="space-y-2 text-gray-300">
                  <li>• Supplier dashboard & analytics</li>
                  <li>• Order management system</li>
                  <li>• Inventory tracking & alerts</li>
                  <li>• Store network access</li>
                  <li>• Payment processing</li>
                  <li>• 24/7 support</li>
                </ul>
              </div>
            </div>
          </motion.div>
        )}

        {/* Step 2: Payment */}
        {step === 2 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-12"
          >
            {/* Plan Selection */}
            <div className="space-y-6">
              <div className="bg-white/10 backdrop-blur-lg rounded-xl p-8 border border-white/20">
                <h2 className="text-2xl font-bold text-white mb-6">Choose Your Plan</h2>
                
                <div className="space-y-4">
                  {subscriptionPlans.map((plan) => {
                    const discount = planDiscountRates[plan.id] || { label: '', color: '' };
                    return (
                      <div
                        key={plan.id}
                        onClick={() => handleInputChange("plan_id", plan.id)}
                        className={`relative p-4 rounded-lg border-2 cursor-pointer transition-all ${
                          formData.plan_id === plan.id
                            ? 'border-green-400 bg-green-400/10'
                            : 'border-gray-600 bg-gray-700/50 hover:border-gray-500'
                        }`}
                      >
                        {plan.popular && (
                          <div className="absolute -top-3 left-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs px-3 py-1 rounded-full">
                            Most Popular
                          </div>
                        )}
                        {/* Discount Rate Badge - now above plan name, unique color per plan */}
                        <div className="mb-2 flex items-center">
                          {discount.label && (
                            <span
                              className={`bg-gradient-to-r ${discount.color} text-xs font-semibold px-3 py-1 rounded-full border shadow-sm mr-2`}
                              title="This is the discount rate you get on your store’s stock purchases."
                            >
                              {discount.label}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-lg font-semibold text-white">{plan.name}</h3>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-green-400">₹{plan.price}</p>
                            <p className="text-gray-400 text-sm">per month</p>
                          </div>
                        </div>
                        
                        <ul className="space-y-2">
                          {plan.features.map((feature, index) => (
                            <li key={index} className="flex items-center space-x-2 text-gray-300">
                              <CheckCircle className="w-4 h-4 text-green-400" />
                              <span className="text-sm">{feature}</span>
                            </li>
                          ))}
                        </ul>
                        
                        <div className="mt-3 text-xs text-gray-400">
                          {plan.trial_days}-day free trial included
                        </div>
                        <div className="mt-2 text-xs text-blue-300">
                          This is the commission rate you’ll pay to the platform on your store’s sales.
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex space-x-4">
                <Button
                  onClick={handleBackStep}
                  variant="ghost"
                  className="flex-1 text-gray-400 hover:text-white border border-gray-600"
                >
                  Back
                </Button>
                <Button
                  onClick={handleRegistration}
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white"
                >
                  {loading ? (
                    <div className="flex items-center">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Processing...
                    </div>
                  ) : (
                    <>
                      Pay ₹{selectedPlan?.price}
                      <CreditCard className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Order Summary */}
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-8 border border-white/20">
              <h3 className="text-xl font-bold text-white mb-6">Order Summary</h3>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Plan:</span>
                  <span className="text-white font-medium">{selectedPlan?.name}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Duration:</span>
                  <span className="text-white">30 days</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Trial:</span>
                  <span className="text-green-400">{selectedPlan?.trial_days} days free</span>
                </div>
                
                <hr className="border-gray-600" />
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Company:</span>
                  <span className="text-white font-medium">{formData.company_name}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Category:</span>
                  <span className="text-white">{formData.business_category}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Location:</span>
                  <span className="text-white">{formData.business_location}</span>
                </div>
                
                <hr className="border-gray-600" />
                
                <div className="flex justify-between items-center text-lg font-bold">
                  <span className="text-white">Total:</span>
                  <span className="text-green-400">₹{selectedPlan?.price}</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </main>
    </div>
  );
} 