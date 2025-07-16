import { motion } from "framer-motion";
import { FaChartLine, FaBell, FaStore, FaLock, FaSync, FaCloud, FaCogs, FaUsers } from "react-icons/fa";

const features = [
  { icon: <FaStore size={20} />, title: "Multi-Store Management", description: "Manage all your stores from a single dashboard with real-time updates.", color: "bg-indigo-100 text-indigo-600" },
  { icon: <FaChartLine size={20} />, title: "Smart Analytics", description: "Get actionable insights and analytics to optimize your inventory and sales.", color: "bg-teal-100 text-teal-600" },
  { icon: <FaBell size={20} />, title: "Automated Alerts", description: "Receive instant notifications for low stock, sales spikes, and more.", color: "bg-yellow-100 text-yellow-600" },
  { icon: <FaLock size={20} />, title: "Enterprise Security", description: "Your data is protected with industry-leading security and encryption.", color: "bg-pink-100 text-pink-600" },
  { icon: <FaSync size={20} />, title: "Real-time Sync", description: "All changes are instantly synced across devices and users.", color: "bg-blue-100 text-blue-600" },
  { icon: <FaCloud size={20} />, title: "Cloud Powered", description: "Access your dashboard from anywhere, anytime, on any device.", color: "bg-green-100 text-green-600" },
  { icon: <FaCogs size={20} />, title: "Customizable Workflows", description: "Tailor the platform to fit your unique business processes.", color: "bg-purple-100 text-purple-600" },
  { icon: <FaUsers size={20} />, title: "Team Collaboration", description: "Invite your team and manage permissions with ease.", color: "bg-red-100 text-red-600" },
];

export default function FeaturesSection() {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Powerful Features</h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">Everything you need to manage your retail business efficiently and grow faster.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
          {features.map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="bg-white p-8 rounded-2xl shadow border border-gray-100 flex flex-col items-center text-center transition-transform duration-200 hover:-translate-y-2 hover:shadow-2xl"
            >
              <div className={`mb-4 w-12 h-12 flex items-center justify-center rounded-full ${feature.color} shadow-sm`}>
                {feature.icon}
              </div>
              <h3 className="text-lg font-semibold mb-2 text-gray-900">{feature.title}</h3>
              <p className="text-gray-500 text-sm">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
} 