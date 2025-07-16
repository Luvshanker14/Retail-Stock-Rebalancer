
"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import api from "@/lib/api";
import { Loader } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { motion } from "framer-motion";
import ThreeDGameStore from "../../../../components/ThreeDGameStore";
import { AnimatePresence } from "framer-motion";
import { useDarkMode } from "@/hooks/useDarkMode";
import { ShoppingCart, X, Tag, Percent } from "lucide-react";
import { Input } from "@/components/ui/input";
import LogoutButton from "@/components/LogoutButton";
import StoreRatingsSection from "@/components/StoreRatingsSection";
import WishlistButton from "@/components/WishlistButton";
import toast from "react-hot-toast";
import useCustomerAuth from '@/hooks/useCustomerAuth';

// Define types
type Stock = {
  id: number;
  name: string;
  quantity: number;
  price: number;
};

type CartItem = {
  stock: Stock;
  quantity: number;
};

type Coupon = {
  code: string;
  discount: number;
  description: string;
};

export default function CustomerStorePage() {
  const params = useParams();
  const query = useSearchParams();
  const router = useRouter();

  const storeId = params.storeId as string;
  const storeName = query.get("name");
  const storeLocation = query.get("location");
  const storeCategory = query.get("category");

  const [stocks, setStocks] = useState<Stock[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null);
  const [enteredStore, setEnteredStore] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [couponError, setCouponError] = useState('');
  const { isDark } = useDarkMode();
  const { loading: authLoading } = useCustomerAuth();

  // Available coupons
  const availableCoupons: Coupon[] = [
    {
      code: 'LUV20OFF',
      discount: 20,
      description: 'Get 20% off on your purchase!'
    }
  ];

  useEffect(() => {
    if (!storeId) return;
    const fetchStocks = async () => {
      try {
        const res = await api.get(`/public/stores/${storeId}/stocks`);
        setStocks(res.data);
      } catch (err) {
        console.error("Failed to load stocks", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStocks();
  }, [storeId]);

  // Cart functions
  const addToCart = (stock: Stock) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.stock.id === stock.id);
      if (existingItem) {
        if (existingItem.quantity < stock.quantity) {
          return prevCart.map(item =>
            item.stock.id === stock.id
              ? { ...item, quantity: item.quantity + 1 }
              : item
          );
        }
        return prevCart; // Don't add if max quantity reached
      } else {
        return [...prevCart, { stock, quantity: 1 }];
      }
    });
  };

  const removeFromCart = (stockId: number) => {
    setCart(prevCart => prevCart.filter(item => item.stock.id !== stockId));
  };

  const updateCartQuantity = (stockId: number, newQuantity: number) => {
    setCart(prevCart => {
      const item = prevCart.find(item => item.stock.id === stockId);
      if (!item) return prevCart;

      if (newQuantity <= 0) {
        return prevCart.filter(item => item.stock.id !== stockId);
      }

      if (newQuantity > item.stock.quantity) {
        return prevCart; // Don't exceed available stock
      }

      return prevCart.map(item =>
        item.stock.id === stockId
          ? { ...item, quantity: newQuantity }
          : item
      );
    });
  };

  const getCartTotal = () => {
    return cart.reduce((total, item) => total + (item.stock.price * item.quantity), 0);
  };

  const getDiscountAmount = () => {
    if (!appliedCoupon) return 0;
    return (getCartTotal() * appliedCoupon.discount) / 100;
  };

  const getFinalTotalExact = () => {
    return getCartTotal() - getDiscountAmount();
  };

  const getFinalTotal = () => {
    const total = getCartTotal() - getDiscountAmount();
    return Math.round(total); // Round to nearest integer for Razorpay
  };

  const getRoundingAmount = () => {
    const exact = getFinalTotalExact();
    const rounded = getFinalTotal();
    return rounded - exact;
  };

  const applyCoupon = () => {
    const coupon = availableCoupons.find(c => c.code.toUpperCase() === couponCode.toUpperCase());
    if (coupon) {
      setAppliedCoupon(coupon);
      setCouponError('');
    } else {
      setCouponError('Invalid coupon code');
      setAppliedCoupon(null);
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    setCouponError('');
  };

  const handleCartPayment = async () => {
    if (cart.length === 0) {
      toast.error('Your cart is empty!');
      return;
    }

    try {
      const finalAmount = getFinalTotal();
      
      // Ensure amount is at least 1 rupee (100 paise)
      if (finalAmount < 1) {
        toast.error('Minimum order amount is ₹1');
        return;
      }

      const orderRes = await api.post(`/stores/${storeId}/create-order`, { amount: finalAmount });
      const { id: order_id } = orderRes.data;

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: finalAmount * 100, // Convert to paise (integer)
        currency: "INR",
        name: `${storeName} - Cart Purchase`,
        order_id,
        handler: async function () {
          // Process all cart items
          for (const item of cart) {
            await api.post(`/stores/${storeId}/purchase`, { 
              id: item.stock.id, 
              quantity: item.quantity,
              amount_paid: finalAmount // Send the actual paid amount for each item
            });
          }
          
          // Update stocks locally
          setStocks(prev => prev.map(stock => {
            const cartItem = cart.find(item => item.stock.id === stock.id);
            if (cartItem) {
              return { ...stock, quantity: stock.quantity - cartItem.quantity };
            }
            return stock;
          }));

          // Clear cart
          setCart([]);
          setAppliedCoupon(null);
          setCouponCode('');
          setShowCart(false);
          
          toast.success("Payment successful & all items purchased!");
        },
        prefill: {
          name: "Customer",
          email: "customer@example.com",
          contact: "9999999999",
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (error) {
      toast.error("Payment initiation failed");
      console.error(error);
    }
  };

  const PurchaseModal = ({ stock }: { stock: Stock }) => {
    const [quantity, setQuantity] = useState(1);
    const [error, setError] = useState("");
    const price = stock.price * quantity;

    const updateQuantity = (newQuantity: number) => {
      if (newQuantity > stock.quantity) {
        setError(`Only ${stock.quantity} units available in stock!`);
        return;
      }
      if (newQuantity < 1) {
        setError("Quantity must be at least 1!");
        return;
      }
      setError("");
      setQuantity(newQuantity);
    };

    const handlePayment = async () => {
      try {
        const finalPrice = Math.round(price); // Round to nearest integer
        
        // Ensure amount is at least 1 rupee
        if (finalPrice < 1) {
          toast.error('Minimum order amount is ₹1');
          return;
        }

        const orderRes = await api.post(`/stores/${storeId}/create-order`, { amount: finalPrice });
        const { id: order_id } = orderRes.data;

        const options = {
          key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
          amount: finalPrice * 100, // Convert to paise (integer)
          currency: "INR",
          name: stock.name,
          order_id,
          handler: async function () {
            await api.post(`/stores/${storeId}/purchase`, { id: stock.id, quantity, amount_paid: finalPrice });
            setStocks((prev) =>
              prev.map((s) => (s.id === stock.id ? { ...s, quantity: s.quantity - quantity } : s))
            );
            toast.success("Payment successful & purchase completed!");
            setShowModal(false);
          },
          prefill: {
            name: "Customer",
            email: "customer@example.com",
            contact: "9999999999",
          },
        };

        const rzp = new window.Razorpay(options);
        rzp.open();
      } catch (error) {
        toast.error("Payment initiation failed");
        console.error(error);
      }
    };

    return (
      <Dialog open onOpenChange={() => setShowModal(false)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <span className="text-2xl">🛒</span>
              Purchase {stock.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            {/* Stock Info */}
            <div className="bg-gradient-to-r from-indigo-50 to-teal-50 rounded-lg p-4 border border-indigo-100">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center border-2 border-indigo-200">
                  <img src="/store-icon.png" alt="Stock Icon" className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">{stock.name}</h3>
                  <p className="text-sm text-gray-600">Available: {stock.quantity} units</p>
                </div>
              </div>
            </div>
            
            {/* Quantity Selector */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-700">Select Quantity</label>
              <div className="flex items-center justify-center gap-4">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => updateQuantity(quantity - 1)}
                  className="w-12 h-12 rounded-full border-2 hover:bg-indigo-50"
                  disabled={quantity <= 1}
                >
                  ➖
                </Button>
                <span className="text-2xl font-bold text-indigo-600 min-w-[3rem] text-center">{quantity}</span>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => updateQuantity(quantity + 1)}
                  className="w-12 h-12 rounded-full border-2 hover:bg-indigo-50"
                  disabled={quantity >= stock.quantity}
                >
                  ➕
                </Button>
              </div>
              
              {/* Error Message */}
              {error && (
                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center gap-2 text-red-700">
                    <span className="text-lg">⚠️</span>
                    <span className="text-sm font-medium">{error}</span>
                  </div>
                </div>
              )}
            </div>
            
            {/* Price Display */}
            <div className="bg-white rounded-lg p-4 border-2 border-emerald-200">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Unit Price:</span>
                <span className="font-semibold text-gray-800">₹{stock.price}</span>
              </div>
              <div className="flex justify-between items-center mt-2">
                <span className="text-gray-600">Quantity:</span>
                <span className="font-semibold text-gray-800">{quantity}</span>
              </div>
              <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-100">
                <span className="text-lg font-semibold text-gray-800">Exact Total:</span>
                <span className="text-lg font-semibold text-gray-800">₹{price.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center mt-1">
                <span className="text-sm text-gray-500">Rounded for payment:</span>
                <span className="text-sm text-gray-500">₹{Math.round(price)}</span>
              </div>
              <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-100">
                <span className="text-lg font-semibold text-gray-800">Final Amount:</span>
                <span className="text-2xl font-bold text-emerald-600">₹{Math.round(price)}</span>
              </div>
            </div>
            
            {/* Payment Button */}
            <Button 
              className="w-full h-12 font-semibold text-lg bg-gradient-to-r from-indigo-500 to-teal-500 hover:from-indigo-600 hover:to-teal-600 text-white rounded-lg transition-all duration-300 transform hover:scale-[1.02] shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none" 
              onClick={handlePayment}
              disabled={!!error || quantity > stock.quantity}
            >
              💳 Pay ₹{price}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  if (!storeName || !storeLocation || !storeCategory) {
    return <p className="text-center text-red-500">Invalid store data in URL. Please go back and select a store again.</p>;
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-400">Loading...</p>
      </div>
    );
  }

  return (
    <AnimatePresence>
      {!enteredStore && (
        <motion.div
          key="3dstore"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.7 }}
          style={{ position: 'fixed', inset: 0, width: '100vw', height: '100vh', zIndex: 30, background: 'black' }}
        >
          <ThreeDGameStore onEnter={() => setEnteredStore(true)} />
        </motion.div>
      )}
      {enteredStore && (
        <motion.div
          key="store-page"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 40 }}
          transition={{ duration: 0.7 }}
        >
          <div className={`min-h-screen transition-all duration-300 ${
            isDark 
              ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900' 
              : 'bg-gradient-to-br from-indigo-50 via-white to-teal-50'
          }`}>
            {/* Header */}
            <div className={`w-full shadow-sm border-b py-7 px-4 md:px-0 backdrop-blur transition-all duration-300 ${
              isDark 
                ? 'bg-gray-800/80 border-gray-700' 
                : 'bg-white/80 border-indigo-100'
            }`}>
              <div className="max-w-4xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                <div>
                  <h1 className={`text-3xl font-extrabold mb-1 tracking-tight transition-colors duration-300 ${
                    isDark ? 'text-white' : 'text-indigo-700'
                  }`}>{storeName}</h1>
                  <div className={`text-sm flex flex-wrap gap-2 transition-colors duration-300 ${
                    isDark ? 'text-gray-400' : 'text-indigo-400'
                  }`}>
                    <span>📍 {storeLocation}</span>
                    <span>•</span>
                    <span>🏷️ {storeCategory}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 mt-2 md:mt-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowCart(!showCart)}
                    className={`relative transition-all duration-300 ${
                      isDark 
                        ? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
                        : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <ShoppingCart className="w-5 h-5" />
                    {cart.length > 0 && (
                      <span className={`absolute -top-2 -right-2 w-5 h-5 rounded-full text-xs font-bold flex items-center justify-center ${
                        isDark ? 'bg-blue-500 text-white' : 'bg-indigo-500 text-white'
                      }`}>
                        {cart.reduce((total, item) => total + item.quantity, 0)}
                      </span>
                    )}
                  </Button>
                  <Button 
                    variant="ghost" 
                    className={`transition-colors duration-300 ${
                      isDark 
                        ? 'text-blue-400 hover:text-blue-300' 
                        : 'text-indigo-600 hover:text-indigo-800'
                    }`} 
                    onClick={() => router.push("/customer/home")}
                  >
                    ← Back to Home
                  </Button>
                  <LogoutButton 
                    variant="gradient" 
                    size="sm"
                    compact={true}
                    className="ml-2"
                  />
                </div>
              </div>
            </div>

            {/* Stocks Section */}
            <main className="max-w-7xl mx-auto px-4 py-12">
              <h2 className={`text-3xl font-extrabold mb-8 tracking-tight text-center transition-colors duration-300 ${
                isDark ? 'text-white' : 'text-indigo-700'
              }`}>Available Stocks</h2>
              {loading ? (
                <div className={`flex gap-2 items-center justify-center py-20 transition-colors duration-300 ${
                  isDark ? 'text-gray-400' : 'text-gray-400'
                }`}>
                  <Loader className="animate-spin" /> Loading stocks...
                </div>
              ) : stocks.length === 0 ? (
                <p className={`text-center transition-colors duration-300 ${
                  isDark ? 'text-gray-400' : 'text-gray-400'
                }`}>No stocks available.</p>
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {stocks.map((stock) => (
                    <div
                      key={stock.id}
                      className={`relative rounded-2xl shadow-2xl hover:shadow-2xl transition-all duration-500 border overflow-hidden group ${
                        isDark 
                          ? 'bg-gradient-to-br from-gray-800 via-gray-900 to-gray-950 border-gray-700/70' 
                          : 'bg-gradient-to-br from-white via-blue-50 to-gray-100 border-gray-200/50'
                      }`}
                    >
                      {/* Badge */}
                      <div className={`absolute top-4 left-4 px-3 py-1 rounded-full text-xs font-bold z-10 backdrop-blur-sm border transition-all duration-300 ${
                        isDark 
                          ? 'bg-emerald-900/80 text-emerald-300 border-emerald-700/50' 
                          : 'bg-emerald-100 text-emerald-700 border-emerald-200'
                      }`}>
                        {stock.quantity > 0 ? 'In Stock' : 'Out of Stock'}
                      </div>

                      {/* Wishlist Button */}
                      <div className="absolute top-4 right-4 z-10">
                        <WishlistButton 
                          stockId={stock.id} 
                          storeId={parseInt(storeId)}
                          variant="ghost"
                          size="icon"
                          className={`backdrop-blur-sm border transition-all duration-300 ${
                            isDark 
                              ? 'bg-gray-800/80 hover:bg-gray-700/90 text-white border-gray-600/50' 
                              : 'bg-white/80 hover:bg-white text-gray-800 border-gray-200/50'
                          } w-9 h-9 rounded-full`}
                        />
                      </div>
                      
                      {/* Card Content */}
                      <div className="p-6 flex flex-col h-full">
                        {/* Icon */}
                        <div className={`w-16 h-16 flex items-center justify-center mx-auto mb-5 rounded-full border-2 group-hover:scale-110 transition-all duration-500 shadow-lg ${
                          isDark 
                            ? 'bg-gradient-to-br from-gray-700 to-gray-800 border-gray-700' 
                            : 'bg-gradient-to-br from-blue-100 to-teal-100 border-blue-200'
                        }`}>
                          <img src="/store-icon.png" alt="Stock Icon" className="w-9 h-9" />
                        </div>
                        {/* Title */}
                        <h3 className={`text-xl font-bold text-center mb-4 line-clamp-2 transition-colors duration-300 ${
                          isDark ? 'text-white' : 'text-gray-800'
                        }`}>{stock.name}</h3>
                        {/* Details Row */}
                        <div className="flex justify-between items-center mb-6 px-2">
                          <div className="text-center">
                            <p className={`text-xs mb-1 transition-colors duration-300 ${
                              isDark ? 'text-gray-400' : 'text-gray-500'
                            }`}>Quantity</p>
                            <p className={`text-lg font-semibold transition-colors duration-300 ${
                              isDark ? 'text-blue-300' : 'text-indigo-700'
                            }`}>{stock.quantity}</p>
                          </div>
                          <div className="text-center">
                            <p className={`text-xs mb-1 transition-colors duration-300 ${
                              isDark ? 'text-gray-400' : 'text-gray-500'
                            }`}>Price</p>
                            <p className={`text-lg font-bold transition-colors duration-300 ${
                              isDark ? 'text-emerald-300' : 'text-emerald-700'
                            }`}>₹{stock.price}</p>
                          </div>
                        </div>
                        {/* Add to Cart Button */}
                        <div className="mt-auto">
                          <Button
                            variant="default"
                            onClick={() => addToCart(stock)}
                            disabled={cart.some(item => item.stock.id === stock.id && item.quantity >= stock.quantity)}
                            className="w-full h-12 font-semibold rounded-xl bg-gradient-to-r from-indigo-500 to-teal-500 hover:from-indigo-600 hover:to-teal-600 text-white transition-all duration-300 transform hover:scale-[1.03] shadow-lg hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                          >
                            {cart.some(item => item.stock.id === stock.id) ? '✅ In Cart' : '🛒 Add to Cart'}
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {showModal && selectedStock && <PurchaseModal stock={selectedStock} />}
            </main>

            {/* Ratings and Reviews Section */}
            <section className={`max-w-7xl mx-auto px-4 py-12 border-t transition-colors duration-300 ${
              isDark ? 'border-gray-700' : 'border-gray-200'
            }`}>
              <StoreRatingsSection
                storeId={Number(storeId)}
                storeName={storeName || ''}
                currentUserId={undefined}
                isDark={isDark}
                key={isDark ? 'dark' : 'light'}
              />
            </section>

            {/* Cart Sidebar */}
            <AnimatePresence>
              {showCart && (
                <motion.div
                  initial={{ x: '100%' }}
                  animate={{ x: 0 }}
                  exit={{ x: '100%' }}
                  transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                  className={`fixed top-0 right-0 h-full w-96 z-50 shadow-2xl transition-all duration-300 ${
                    isDark ? 'bg-gray-800 border-l border-gray-700' : 'bg-white border-l border-gray-200'
                  }`}
                >
                  <div className="flex flex-col h-full">
                    {/* Cart Header */}
                    <div className={`p-6 border-b transition-colors duration-300 ${
                      isDark ? 'border-gray-700' : 'border-gray-200'
                    }`}>
                      <div className="flex items-center justify-between">
                        <h2 className={`text-xl font-bold transition-colors duration-300 ${
                          isDark ? 'text-white' : 'text-gray-800'
                        }`}>
                          Shopping Cart ({cart.reduce((total, item) => total + item.quantity, 0)})
                        </h2>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowCart(false)}
                          className={`transition-colors duration-300 ${
                            isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-800'
                          }`}
                        >
                          <X className="w-5 h-5" />
                        </Button>
                      </div>
                    </div>

                    {/* Cart Items */}
                    <div className="flex-1 overflow-y-auto p-6">
                      {cart.length === 0 ? (
                        <div className="text-center py-8">
                          <ShoppingCart className={`w-12 h-12 mx-auto mb-4 transition-colors duration-300 ${
                            isDark ? 'text-gray-600' : 'text-gray-400'
                          }`} />
                          <p className={`transition-colors duration-300 ${
                            isDark ? 'text-gray-400' : 'text-gray-600'
                          }`}>
                            Your cart is empty
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {cart.map((item) => (
                            <div
                              key={item.stock.id}
                              className={`p-4 rounded-lg border transition-all duration-300 ${
                                isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'
                              }`}
                            >
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex-1">
                                  <h3 className={`font-semibold transition-colors duration-300 ${
                                    isDark ? 'text-white' : 'text-gray-800'
                                  }`}>
                                    {item.stock.name}
                                  </h3>
                                  <p className={`text-sm transition-colors duration-300 ${
                                    isDark ? 'text-gray-400' : 'text-gray-600'
                                  }`}>
                                    ₹{item.stock.price} each
                                  </p>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeFromCart(item.stock.id)}
                                  className={`text-red-500 hover:text-red-700 transition-colors duration-300 ${
                                    isDark ? 'hover:bg-red-900/20' : 'hover:bg-red-50'
                                  }`}
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              </div>
                              
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => updateCartQuantity(item.stock.id, item.quantity - 1)}
                                    className="w-8 h-8 p-0"
                                  >
                                    ➖
                                  </Button>
                                  <span className={`w-8 text-center font-semibold transition-colors duration-300 ${
                                    isDark ? 'text-white' : 'text-gray-800'
                                  }`}>
                                    {item.quantity}
                                  </span>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => updateCartQuantity(item.stock.id, item.quantity + 1)}
                                    disabled={item.quantity >= item.stock.quantity}
                                    className="w-8 h-8 p-0"
                                  >
                                    ➕
                                  </Button>
                                </div>
                                <span className={`font-semibold transition-colors duration-300 ${
                                  isDark ? 'text-emerald-400' : 'text-emerald-600'
                                }`}>
                                  ₹{item.stock.price * item.quantity}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Cart Footer */}
                    {cart.length > 0 && (
                      <div className={`p-6 border-t transition-colors duration-300 ${
                        isDark ? 'border-gray-700' : 'border-gray-200'
                      }`}>
                        {/* Coupon Section */}
                        <div className="mb-4">
                          <div className="flex items-center gap-2 mb-2">
                            <Tag className={`w-4 h-4 transition-colors duration-300 ${
                              isDark ? 'text-gray-400' : 'text-gray-600'
                            }`} />
                            <span className={`text-sm font-medium transition-colors duration-300 ${
                              isDark ? 'text-gray-300' : 'text-gray-700'
                            }`}>
                              Apply Coupon
                            </span>
                          </div>
                          
                          {!appliedCoupon ? (
                            <div className="flex gap-2">
                              <Input
                                placeholder="Enter coupon code"
                                value={couponCode}
                                onChange={(e) => setCouponCode(e.target.value)}
                                className={`flex-1 transition-all duration-300 ${
                                  isDark 
                                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                                    : 'bg-white border-gray-300'
                                }`}
                              />
                              <Button
                                size="sm"
                                onClick={applyCoupon}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white"
                              >
                                Apply
                              </Button>
                            </div>
                          ) : (
                            <div className={`p-3 rounded-lg transition-all duration-300 ${
                              isDark ? 'bg-green-900/20 border border-green-700' : 'bg-green-50 border border-green-200'
                            }`}>
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className={`text-sm font-medium transition-colors duration-300 ${
                                    isDark ? 'text-green-300' : 'text-green-700'
                                  }`}>
                                    {appliedCoupon.code} - {appliedCoupon.discount}% off
                                  </p>
                                  <p className={`text-xs transition-colors duration-300 ${
                                    isDark ? 'text-green-400' : 'text-green-600'
                                  }`}>
                                    {appliedCoupon.description}
                                  </p>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={removeCoupon}
                                  className={`text-red-500 hover:text-red-700 transition-colors duration-300 ${
                                    isDark ? 'hover:bg-red-900/20' : 'hover:bg-red-50'
                                  }`}
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          )}
                          
                          {couponError && (
                            <p className="text-xs text-red-500 mt-1">{couponError}</p>
                          )}
                        </div>

                        {/* Price Summary */}
                        <div className="space-y-2 mb-4">
                          <div className="flex justify-between">
                            <span className={`transition-colors duration-300 ${
                              isDark ? 'text-gray-400' : 'text-gray-600'
                            }`}>
                              Subtotal:
                            </span>
                            <span className={`transition-colors duration-300 ${
                              isDark ? 'text-white' : 'text-gray-800'
                            }`}>
                              ₹{getCartTotal()}
                            </span>
                          </div>
                          
                          {appliedCoupon && (
                            <>
                              <div className="flex justify-between">
                                <span className={`transition-colors duration-300 ${
                                  isDark ? 'text-gray-400' : 'text-gray-600'
                                }`}>
                                  Discount ({appliedCoupon.discount}%):
                                </span>
                                <span className={`transition-colors duration-300 ${
                                  isDark ? 'text-green-400' : 'text-green-600'
                                }`}>
                                  -₹{getDiscountAmount().toFixed(2)}
                                </span>
                              </div>
                              
                              <div className="flex justify-between">
                                <span className={`transition-colors duration-300 ${
                                  isDark ? 'text-gray-400' : 'text-gray-600'
                                }`}>
                                  Amount after discount:
                                </span>
                                <span className={`transition-colors duration-300 ${
                                  isDark ? 'text-white' : 'text-gray-800'
                                }`}>
                                  ₹{getFinalTotalExact().toFixed(2)}
                                </span>
                              </div>
                              
                              {getRoundingAmount() !== 0 && (
                                <div className="flex justify-between">
                                  <span className={`transition-colors duration-300 ${
                                    isDark ? 'text-gray-400' : 'text-gray-600'
                                  }`}>
                                    Rounded off:
                                  </span>
                                  <span className={`transition-colors duration-300 ${
                                    getRoundingAmount() > 0 ? 'text-blue-500' : 'text-orange-500'
                                  }`}>
                                    {getRoundingAmount() > 0 ? '+' : ''}₹{getRoundingAmount().toFixed(2)}
                                  </span>
                                </div>
                              )}
                            </>
                          )}
                          
                          <div className={`flex justify-between pt-2 border-t transition-colors duration-300 ${
                            isDark ? 'border-gray-700' : 'border-gray-200'
                          }`}>
                            <span className={`font-semibold transition-colors duration-300 ${
                              isDark ? 'text-white' : 'text-gray-800'
                            }`}>
                              Final Total:
                            </span>
                            <span className={`font-bold text-lg transition-colors duration-300 ${
                              isDark ? 'text-emerald-400' : 'text-emerald-600'
                            }`}>
                              ₹{getFinalTotal()}
                            </span>
                          </div>
                        </div>

                        {/* Checkout Button */}
                        <Button
                          onClick={handleCartPayment}
                          className="w-full h-12 font-semibold text-lg bg-gradient-to-r from-indigo-500 to-teal-500 hover:from-indigo-600 hover:to-teal-600 text-white rounded-lg transition-all duration-300 transform hover:scale-[1.02] shadow-lg"
                        >
                          💳 Checkout - ₹{getFinalTotal()}
                        </Button>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}