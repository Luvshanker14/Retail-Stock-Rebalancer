"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { 
  Store, 
  TrendingUp, 
  AlertTriangle, 
  BarChart3, 
  Shield, 
  Zap, 
  Users, 
  ShoppingCart,
  ArrowRight,
  CheckCircle,
  Star,
  Mail,
  Phone,
  MapPin,
  Github,
  Linkedin,
  Twitter,
  Menu,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import LogoutButton from "@/components/LogoutButton";
import ThreeDGameStore from "@/components/ThreeDGameStore";
import FloatingShapes3D from "@/components/FloatingShapes3D";
import ChatbotWidget from "@/components/ChatbotWidget";
import FeaturesSection from "@/components/FeaturesSection";
import TestimonialsCarousel from "@/components/TestimonialsCarousel";
import StatsSection from "@/components/StatsSection";
import PartnersSection from "@/components/PartnersSection";
import FAQSection from "@/components/FAQSection";
import FooterSection from "@/components/FooterSection";

export default function LandingPage() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userType, setUserType] = useState<'admin' | 'customer' | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('hero');
  const sectionsRef = useRef<{ [key: string]: HTMLElement | null }>({});

  useEffect(() => {
    const adminToken = localStorage.getItem("adminToken");
    const customerToken = localStorage.getItem("customerToken");
    
    if (adminToken) {
      setIsLoggedIn(true);
      setUserType('admin');
    } else if (customerToken) {
      setIsLoggedIn(true);
      setUserType('customer');
    }
  }, []);

  // Scroll detection for active section
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 100; // Offset for navbar height
      
      // Check which section is currently in view
      const sections = ['hero', 'features', 'stats', 'testimonials', 'partners', 'faq', 'contact'];
      
      for (let i = sections.length - 1; i >= 0; i--) {
        const sectionId = sections[i];
        const section = sectionsRef.current[sectionId];
        
        if (section) {
          const sectionTop = section.offsetTop;
          const sectionHeight = section.offsetHeight;
          
          if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
            setActiveSection(sectionId);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogin = (type: 'admin' | 'customer') => {
    if (type === 'admin') {
      router.push('/admin/login');
    } else {
      router.push('/customer/login');
    }
  };

  const handleDashboard = () => {
    if (userType === 'admin') {
      router.push('/admin/tracked_stores');
    } else {
      router.push('/customer/home');
    }
  };

  const features = [
    {
      icon: <Store className="w-8 h-8" />,
      title: "Multi-Store Management",
      description: "Manage multiple retail stores from a single dashboard with real-time inventory tracking."
    },
    {
      icon: <TrendingUp className="w-8 h-8" />,
      title: "Smart Analytics",
      description: "Advanced analytics and insights to optimize stock levels and improve sales performance."
    },
    {
      icon: <AlertTriangle className="w-8 h-8" />,
      title: "Automated Alerts",
      description: "Get instant notifications when stock levels are low or when restocking is needed."
    },
    {
      icon: <BarChart3 className="w-8 h-8" />,
      title: "Performance Metrics",
      description: "Track store performance, sales trends, and inventory turnover with detailed metrics."
    },
    {
      icon: <Shield className="w-8 h-8" />,
      title: "Secure & Reliable",
      description: "Enterprise-grade security with encrypted data and reliable backup systems."
    },
    {
      icon: <Zap className="w-8 h-8" />,
      title: "Real-time Updates",
      description: "Instant synchronization across all devices with real-time inventory updates."
    }
  ];

  const stats = [
    { number: "500+", label: "Stores Managed" },
    { number: "10K+", label: "Products Tracked" },
    { number: "99.9%", label: "Uptime" },
    { number: "24/7", label: "Support" }
  ];

  const testimonials = [
    {
      name: "Sarah Johnson",
      role: "Store Manager",
      company: "Retail Chain Inc.",
      content: "This system has revolutionized how we manage our inventory. The automated alerts save us hours every week.",
      rating: 5
    },
    {
      name: "Michael Chen",
      role: "Operations Director",
      company: "SuperMart",
      content: "The analytics dashboard gives us insights we never had before. Our stock turnover has improved by 40%.",
      rating: 5
    },
    {
      name: "Emily Rodriguez",
      role: "Retail Owner",
      company: "Local Boutique",
      content: "Simple to use yet powerful. Perfect for small businesses looking to scale efficiently.",
      rating: 5
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-teal-50 relative overflow-hidden scroll-smooth">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-white/95 backdrop-blur-xl border-b border-gray-200/50 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo Section */}
            <div className="flex items-center space-x-3 group cursor-pointer" onClick={() => router.push('/')}>
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 via-purple-500 to-teal-500 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110">
                  <Store className="w-7 h-7 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-md">
                  <div className="w-2.5 h-2.5 bg-white rounded-full"></div>
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-teal-600 bg-clip-text text-transparent">
                  StockRebalancer
                </span>
                <span className="text-xs text-gray-500 font-medium -mt-1 tracking-wide">Smart Retail Solutions</span>
              </div>
            </div>
            
            {/* Navigation Links */}
            <div className="hidden lg:flex items-center space-x-1">
              <a 
                href="#features" 
                className={`px-4 py-2 font-medium transition-all duration-300 rounded-lg relative group ${
                  activeSection === 'features' 
                    ? 'text-indigo-600 bg-indigo-50 shadow-md' 
                    : 'text-gray-700 hover:text-indigo-600 hover:bg-indigo-50'
                }`}
                onClick={(e) => {
                  e.preventDefault();
                  sectionsRef.current['features']?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                Features
                <div className={`absolute bottom-0 left-1/2 transform -translate-x-1/2 h-0.5 bg-gradient-to-r from-indigo-500 to-teal-500 transition-all duration-300 ${
                  activeSection === 'features' ? 'w-3/4' : 'w-0 group-hover:w-3/4'
                }`}></div>
              </a>
              <a 
                href="#stats" 
                className={`px-4 py-2 font-medium transition-all duration-300 rounded-lg relative group ${
                  activeSection === 'stats' 
                    ? 'text-indigo-600 bg-indigo-50 shadow-md' 
                    : 'text-gray-700 hover:text-indigo-600 hover:bg-indigo-50'
                }`}
                onClick={(e) => {
                  e.preventDefault();
                  sectionsRef.current['stats']?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                Stats
                <div className={`absolute bottom-0 left-1/2 transform -translate-x-1/2 h-0.5 bg-gradient-to-r from-indigo-500 to-teal-500 transition-all duration-300 ${
                  activeSection === 'stats' ? 'w-3/4' : 'w-0 group-hover:w-3/4'
                }`}></div>
              </a>
              <a 
                href="#testimonials" 
                className={`px-4 py-2 font-medium transition-all duration-300 rounded-lg relative group ${
                  activeSection === 'testimonials' 
                    ? 'text-indigo-600 bg-indigo-50 shadow-md' 
                    : 'text-gray-700 hover:text-indigo-600 hover:bg-indigo-50'
                }`}
                onClick={(e) => {
                  e.preventDefault();
                  sectionsRef.current['testimonials']?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                Testimonials
                <div className={`absolute bottom-0 left-1/2 transform -translate-x-1/2 h-0.5 bg-gradient-to-r from-indigo-500 to-teal-500 transition-all duration-300 ${
                  activeSection === 'testimonials' ? 'w-3/4' : 'w-0 group-hover:w-3/4'
                }`}></div>
              </a>
              <a 
                href="#partners" 
                className={`px-4 py-2 font-medium transition-all duration-300 rounded-lg relative group ${
                  activeSection === 'partners' 
                    ? 'text-indigo-600 bg-indigo-50 shadow-md' 
                    : 'text-gray-700 hover:text-indigo-600 hover:bg-indigo-50'
                }`}
                onClick={(e) => {
                  e.preventDefault();
                  sectionsRef.current['partners']?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                Partners
                <div className={`absolute bottom-0 left-1/2 transform -translate-x-1/2 h-0.5 bg-gradient-to-r from-indigo-500 to-teal-500 transition-all duration-300 ${
                  activeSection === 'partners' ? 'w-3/4' : 'w-0 group-hover:w-3/4'
                }`}></div>
              </a>
              <a 
                href="#faq" 
                className={`px-4 py-2 font-medium transition-all duration-300 rounded-lg relative group ${
                  activeSection === 'faq' 
                    ? 'text-indigo-600 bg-indigo-50 shadow-md' 
                    : 'text-gray-700 hover:text-indigo-600 hover:bg-indigo-50'
                }`}
                onClick={(e) => {
                  e.preventDefault();
                  sectionsRef.current['faq']?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                FAQ
                <div className={`absolute bottom-0 left-1/2 transform -translate-x-1/2 h-0.5 bg-gradient-to-r from-indigo-500 to-teal-500 transition-all duration-300 ${
                  activeSection === 'faq' ? 'w-3/4' : 'w-0 group-hover:w-3/4'
                }`}></div>
              </a>
            </div>
            
            {/* Action Buttons */}
            <div className="flex items-center space-x-3">
              {isLoggedIn ? (
                <>
                  <Button
                    onClick={handleDashboard}
                    className="bg-gradient-to-r from-indigo-500 to-teal-500 hover:from-indigo-600 hover:to-teal-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 px-6"
                  >
                    <Store className="w-4 h-4 mr-2" />
                    Dashboard
                  </Button>
                  <LogoutButton variant="outline" size="sm" />
                </>
              ) : (
                <Button
                  onClick={() => router.push('/admin-register')}
                  variant="outline"
                  className="border-2 border-indigo-500 text-indigo-600 hover:bg-indigo-50 hover:border-indigo-600 transition-all duration-300 shadow-md hover:shadow-lg px-6"
                >
                  <Store className="w-4 h-4 mr-2" />
                  Become Supplier
                </Button>
              )}
              
              {/* Mobile menu button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 rounded-lg text-gray-700 hover:text-indigo-600 hover:bg-indigo-50 transition-colors duration-200"
              >
                {mobileMenuOpen ? (
                  <X className="w-6 h-6" />
                ) : (
                  <Menu className="w-6 h-6" />
                )}
              </button>
            </div>
          </div>
          
          {/* Mobile menu */}
          {mobileMenuOpen && (
            <div className="lg:hidden py-4 border-t border-gray-200">
              <div className="flex flex-col space-y-2">
                <a 
                  href="#features" 
                  onClick={(e) => {
                    e.preventDefault();
                    setMobileMenuOpen(false);
                    sectionsRef.current['features']?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className={`px-4 py-2 rounded-lg transition-all duration-300 ${
                    activeSection === 'features' 
                      ? 'text-indigo-600 bg-indigo-50 font-medium' 
                      : 'text-gray-700 hover:text-indigo-600 hover:bg-indigo-50'
                  }`}
                >
                  Features
                </a>
                <a 
                  href="#stats" 
                  onClick={(e) => {
                    e.preventDefault();
                    setMobileMenuOpen(false);
                    sectionsRef.current['stats']?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className={`px-4 py-2 rounded-lg transition-all duration-300 ${
                    activeSection === 'stats' 
                      ? 'text-indigo-600 bg-indigo-50 font-medium' 
                      : 'text-gray-700 hover:text-indigo-600 hover:bg-indigo-50'
                  }`}
                >
                  Stats
                </a>
                <a 
                  href="#testimonials" 
                  onClick={(e) => {
                    e.preventDefault();
                    setMobileMenuOpen(false);
                    sectionsRef.current['testimonials']?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className={`px-4 py-2 rounded-lg transition-all duration-300 ${
                    activeSection === 'testimonials' 
                      ? 'text-indigo-600 bg-indigo-50 font-medium' 
                      : 'text-gray-700 hover:text-indigo-600 hover:bg-indigo-50'
                  }`}
                >
                  Testimonials
                </a>
                <a 
                  href="#partners" 
                  onClick={(e) => {
                    e.preventDefault();
                    setMobileMenuOpen(false);
                    sectionsRef.current['partners']?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className={`px-4 py-2 rounded-lg transition-all duration-300 ${
                    activeSection === 'partners' 
                      ? 'text-indigo-600 bg-indigo-50 font-medium' 
                      : 'text-gray-700 hover:text-indigo-600 hover:bg-indigo-50'
                  }`}
                >
                  Partners
                </a>
                <a 
                  href="#faq" 
                  onClick={(e) => {
                    e.preventDefault();
                    setMobileMenuOpen(false);
                    sectionsRef.current['faq']?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className={`px-4 py-2 rounded-lg transition-all duration-300 ${
                    activeSection === 'faq' 
                      ? 'text-indigo-600 bg-indigo-50 font-medium' 
                      : 'text-gray-700 hover:text-indigo-600 hover:bg-indigo-50'
                  }`}
                >
                  FAQ
                </a>
              </div>
            </div>
          )}
        </div>
      </nav>
      {/* Hero Section - Modular, Layered, Retail/3D Theme */}
      <section 
        ref={(el) => { sectionsRef.current['hero'] = el; }}
        className="relative z-10 pt-36 pb-16 px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center min-h-[70vh] bg-transparent"
      >
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center gap-10">
          {/* Hero Illustration (inline SVG, modern store/retail theme) */}
          <div className="flex-1 flex justify-center items-center relative">
            {/* Inline SVG illustration from unDraw: https://undraw.co/illustrations (Store theme) */}
            <svg width="400" height="400" viewBox="0 0 800 800" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-[320px] md:w-[400px] drop-shadow-2xl rounded-2xl border border-white/40 animate-float">
              <rect x="100" y="300" width="600" height="300" rx="40" fill="#f1f5f9" />
              <rect x="160" y="360" width="120" height="180" rx="20" fill="#38bdf8" />
              <rect x="320" y="360" width="120" height="180" rx="20" fill="#6366f1" />
              <rect x="480" y="360" width="120" height="180" rx="20" fill="#14b8a6" />
              <rect x="200" y="250" width="400" height="60" rx="30" fill="#fff" stroke="#e0e7ef" strokeWidth="8" />
              <ellipse cx="400" cy="650" rx="220" ry="30" fill="#e0e7ef" />
              <circle cx="220" cy="420" r="18" fill="#fff" />
              <circle cx="380" cy="420" r="18" fill="#fff" />
              <circle cx="540" cy="420" r="18" fill="#fff" />
              <rect x="250" y="500" width="60" height="40" rx="10" fill="#fff" />
              <rect x="510" y="500" width="60" height="40" rx="10" fill="#fff" />
              <rect x="370" y="500" width="60" height="40" rx="10" fill="#fff" />
              <rect x="100" y="600" width="600" height="20" rx="10" fill="#e0e7ef" />
              <rect x="100" y="620" width="600" height="10" rx="5" fill="#cbd5e1" />
            </svg>
            {/* Removed glassmorphism overlay for clarity */}
          </div>
          {/* Hero Text & CTAs */}
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 mb-6 drop-shadow-lg">
              Welcome to <span className="bg-gradient-to-r from-indigo-500 to-teal-500 bg-clip-text text-transparent">StockRebalancer</span>
            </h1>
            <p className="text-xl text-gray-700 mb-8 max-w-2xl mx-auto md:mx-0 drop-shadow">
              The next generation platform for smart, automated, and beautiful retail stock management.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start items-center">
              <Button
                onClick={() => handleLogin('customer')}
                size="lg"
                className="bg-gradient-to-r from-indigo-500 to-teal-500 hover:from-indigo-600 hover:to-teal-600 text-white px-8 py-3 shadow-lg"
              >
                Start Shopping
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <Button
                onClick={() => router.push('/admin-register')}
                variant="outline"
                size="lg"
                className="border-2 border-indigo-500 text-indigo-600 hover:bg-indigo-50 px-8 py-3 shadow"
              >
                Become Supplier
                <Store className="w-5 h-5 ml-2" />
              </Button>
            </div>
          </div>
        </div>
        {/* Animated SVG Wave Divider (replace with a beautiful SVG if desired) */}
        <div className="absolute left-0 right-0 bottom-0 w-full overflow-hidden pointer-events-none" style={{ height: 80 }}>
          <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
            <path d="M0 40 Q 360 80 720 40 T 1440 40 V80 H0 V40Z" fill="#f1f5f9" />
          </svg>
        </div>
      </section>
      {/* Features Section */}
      <section 
        ref={(el) => { sectionsRef.current['features'] = el; }}
        id="features" 
        className="py-20 bg-white"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FeaturesSection />
        </div>
      </section>
      
      {/* Stats Section */}
      <section 
        ref={(el) => { sectionsRef.current['stats'] = el; }}
        id="stats" 
        className="py-20 bg-gradient-to-r from-indigo-50 to-teal-50"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <StatsSection />
        </div>
      </section>
      
      {/* Testimonials Section */}
      <section 
        ref={(el) => { sectionsRef.current['testimonials'] = el; }}
        id="testimonials" 
        className="py-20 bg-white"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <TestimonialsCarousel />
        </div>
      </section>
      
      {/* Partners Section */}
      <section 
        ref={(el) => { sectionsRef.current['partners'] = el; }}
        id="partners" 
        className="py-20 bg-gradient-to-r from-gray-50 to-white"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <PartnersSection />
        </div>
      </section>
      
      {/* FAQ Section */}
      <section 
        ref={(el) => { sectionsRef.current['faq'] = el; }}
        id="faq" 
        className="py-20 bg-white"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FAQSection />
        </div>
      </section>
      
      {/* Floating Chatbot Widget */}
      <ChatbotWidget />
      
      {/* Footer Section */}
      <section 
        ref={(el) => { sectionsRef.current['contact'] = el; }}
        id="contact" 
        className="bg-gradient-to-r from-gray-900 to-gray-800"
      >
        <FooterSection />
      </section>
    </div>
  );
} 