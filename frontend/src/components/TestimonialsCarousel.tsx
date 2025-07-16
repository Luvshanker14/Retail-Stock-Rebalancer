import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import { FaStar } from "react-icons/fa";
import { motion } from "framer-motion";

const testimonials = [
  { name: "Sarah Johnson", role: "Store Manager", company: "Retail Chain Inc.", content: "This system has revolutionized how we manage our inventory. The automated alerts save us hours every week.", rating: 5, color: "#6366f1" },
  { name: "Michael Chen", role: "Operations Director", company: "SuperMart", content: "The analytics dashboard gives us insights we never had before. Our stock turnover has improved by 40%.", rating: 5, color: "#14b8a6" },
  { name: "Emily Rodriguez", role: "Retail Owner", company: "Local Boutique", content: "Simple to use yet powerful. Perfect for small businesses looking to scale efficiently.", rating: 5, color: "#f59e42" },
  { name: "Raj Patel", role: "Franchise Owner", company: "QuickShop", content: "The real-time sync and team features are a game changer for our multi-location business.", rating: 4, color: "#a21caf" },
  { name: "Anna Müller", role: "Inventory Lead", company: "EuroStores", content: "We love the customizable workflows and the support team is fantastic!", rating: 5, color: "#0ea5e9" },
];

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase();
}

export default function TestimonialsCarousel() {
  return (
    <div className="max-w-3xl mx-auto px-4">
        <div className="text-center mb-10">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">What Our Customers Say</h2>
          <p className="text-xl text-gray-600">Real feedback from retail leaders using StockRebalancer.</p>
        </div>
        <Swiper
          modules={[Navigation, Pagination, Autoplay]}
          spaceBetween={24}
          slidesPerView={1}
          navigation
          pagination={{ clickable: true }}
          autoplay={{ delay: 4000, disableOnInteraction: true }}
          className="pb-10"
        >
          {testimonials.map((t, i) => (
            <SwiperSlide key={i}>
              <motion.div
                className="flex flex-col items-center p-10 rounded-3xl shadow-2xl border border-indigo-100 bg-white relative transition-transform duration-300 hover:scale-105 hover:shadow-indigo-200 hover:border-indigo-300 active:scale-100 max-w-xl mx-auto"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                style={{ background: `linear-gradient(135deg, ${t.color}11 0%, #fff 100%)` }}
              >
                <div className="w-20 h-20 rounded-full flex items-center justify-center mb-4 text-white text-3xl font-bold shadow-lg border-4 border-white" style={{ background: t.color }}>
                  {getInitials(t.name)}
                </div>
                <div className="flex mb-4">
                  {[...Array(t.rating)].map((_, j) => (
                    <FaStar key={j} className="w-6 h-6 text-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-700 mb-6 italic text-lg text-center">"{t.content}"</p>
                <div className="text-center">
                  <div className="font-semibold text-gray-900">{t.name}</div>
                  <div className="text-sm text-gray-500">{t.role} at {t.company}</div>
                </div>
              </motion.div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
  );
} 