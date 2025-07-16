import React from "react";
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, EffectCoverflow } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/autoplay';
import 'swiper/css/effect-coverflow';

const partners = [
  { name: "ShopEase", logo: "/store-icon.png", review: "Seamless integration and fantastic support! Their onboarding process was smooth, and the support team is always available. We’ve seen a significant reduction in stockouts and improved our overall efficiency. Highly recommended for any retail business looking to modernize.", accent: "bg-indigo-500" },
  { name: "RetailPro", logo: "/store-icon.png", review: "Helped us scale our operations efficiently. The analytics dashboard provides deep insights, and the automated alerts keep us ahead of inventory issues. Our team collaboration has never been better. A must-have for serious retailers.", accent: "bg-teal-500" },
  { name: "QuickMart", logo: "/store-icon.png", review: "Reliable and easy to use for our team. The real-time sync across devices is a game changer. We especially love the customizable workflows and the ability to manage multiple stores from one place. Great value!", accent: "bg-yellow-500" },
  { name: "MegaStore", logo: "/store-icon.png", review: "Great analytics and inventory features. The platform’s security and backup systems give us peace of mind. We’ve improved our sales performance and reduced manual errors. The user interface is intuitive and modern.", accent: "bg-pink-500" },
  { name: "SuperMart", logo: "/store-icon.png", review: "Excellent support and robust features. The automated alerts and performance metrics have helped us optimize our stock levels. The platform is reliable and scales well with our growing business needs.", accent: "bg-blue-500" },
  { name: "UrbanGrocer", logo: "/store-icon.png", review: "Perfect for our growing chain. The cloud-powered dashboard allows us to access data from anywhere. The team collaboration tools and secure environment make it easy to onboard new staff and manage permissions.", accent: "bg-green-500" },
  { name: "FreshFinds", logo: "/store-icon.png", review: "Inventory management made easy! The customizable workflows and instant notifications have streamlined our daily operations. We appreciate the detailed metrics and the ability to track sales trends effortlessly.", accent: "bg-purple-500" },
  { name: "MarketHub", logo: "/store-icon.png", review: "A must-have for retailers. The platform’s uptime is impressive, and the support team is responsive. We’ve seen a noticeable improvement in our inventory turnover and customer satisfaction since switching.", accent: "bg-red-500" },
  { name: "ValueStore", logo: "/store-icon.png", review: "Saves us hours every week. The automated restocking alerts and analytics have made our processes more efficient. The platform is secure, reliable, and easy to integrate with our existing systems.", accent: "bg-orange-500" },
  { name: "GrocerEase", logo: "/store-icon.png", review: "User-friendly and powerful. The onboarding was quick, and the platform’s features are exactly what we needed. The ability to manage multiple locations from a single dashboard is a huge plus.", accent: "bg-cyan-500" },
  { name: "HyperMart", logo: "/store-icon.png", review: "Our go-to for analytics. The performance metrics and real-time updates have helped us make data-driven decisions. The platform’s security features ensure our data is always protected.", accent: "bg-lime-500" },
  { name: "EverydayMart", logo: "/store-icon.png", review: "Great for multi-location stores. The team collaboration tools and customizable workflows have improved our efficiency. The support team is knowledgeable and always ready to help.", accent: "bg-fuchsia-500" },
  { name: "SmartShop", logo: "/store-icon.png", review: "Love the real-time sync! The platform’s intuitive design and robust analytics have made inventory management a breeze. We’ve seen a significant boost in our sales and customer satisfaction.", accent: "bg-amber-500" },
  { name: "CityGrocer", logo: "/store-icon.png", review: "Easy onboarding and setup. The platform’s features are well thought out, and the support team is fantastic. We appreciate the regular updates and new features being added.", accent: "bg-emerald-500" },
  { name: "PrimeRetail", logo: "/store-icon.png", review: "Fantastic analytics dashboard. The detailed metrics and automated alerts have helped us optimize our inventory. The platform is secure, reliable, and easy to use for our entire team.", accent: "bg-sky-500" },
  { name: "QuickPick", logo: "/store-icon.png", review: "Automated alerts are a lifesaver. The platform’s performance metrics and customizable workflows have made our operations more efficient. The support team is always available and helpful.", accent: "bg-violet-500" },
  { name: "StoreXpress", logo: "/store-icon.png", review: "Secure and reliable. The platform’s backup systems and security features give us confidence. The analytics and team collaboration tools are top-notch. Highly recommended for any retailer.", accent: "bg-rose-500" },
];

const PartnersSection: React.FC = () => (
  <div className="max-w-6xl mx-auto px-4 text-center">
      <h2 className="text-3xl font-bold text-gray-900 mb-10">Our Trusted Partners</h2>
      <Swiper
        modules={[Autoplay, EffectCoverflow]}
        effect="coverflow"
        coverflowEffect={{
          rotate: 0,
          stretch: 40,
          depth: 120,
          modifier: 1,
          slideShadows: false,
        }}
        spaceBetween={24}
        slidesPerView={1}
        breakpoints={{
          640: { slidesPerView: 2 },
          1024: { slidesPerView: 4 },
        }}
        loop={true}
        speed={700}
        autoplay={{ delay: 2200, disableOnInteraction: false }}
        className="pb-4"
      >
        {partners.map((partner, idx) => (
          <SwiperSlide key={partner.name + idx}>
            <div className="flex flex-col items-center bg-white rounded-2xl shadow-lg border border-gray-100 p-8 transition-transform duration-200 hover:-translate-y-2 hover:shadow-2xl group cursor-pointer mx-2 h-72 min-h-72 max-h-72">
              <div className={`w-3 h-3 rounded-full ${partner.accent} mb-4`}></div>
              <img
                src={partner.logo}
                alt={partner.name}
                className="w-16 h-16 object-contain rounded-full border-2 border-gray-200 shadow mb-4 bg-white"
              />
              <span className="text-lg font-bold text-gray-900 mb-2 text-center">{partner.name}</span>
              <p className="text-gray-500 text-sm text-center line-clamp-6">{partner.review}</p>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
);

export default PartnersSection; 