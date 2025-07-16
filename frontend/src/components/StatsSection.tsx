import React, { useEffect, useRef, useState } from "react";
import { Store, Package, Activity, Headphones } from "lucide-react";

const stats = [
  { number: 500, label: "Stores Managed", icon: <Store className="w-6 h-6" />, color: "bg-indigo-100 text-indigo-600" },
  { number: 10000, label: "Products Tracked", icon: <Package className="w-6 h-6" />, color: "bg-teal-100 text-teal-600" },
  { number: 99.9, label: "Uptime", icon: <Activity className="w-6 h-6" />, color: "bg-yellow-100 text-yellow-600" },
  { number: 24, label: "Support (hrs)", icon: <Headphones className="w-6 h-6" />, color: "bg-pink-100 text-pink-600" },
];

function useCountUp(target: number, duration = 1200, decimals = 0) {
  const [count, setCount] = useState(0);
  const raf = useRef<number | null>(null);
  useEffect(() => {
    let start: number | null = null;
    function animate(ts: number) {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      setCount(Number((progress * target).toFixed(decimals)));
      if (progress < 1) raf.current = requestAnimationFrame(animate);
      else setCount(target);
    }
    raf.current = requestAnimationFrame(animate);
    return () => {
      if (raf.current !== null) cancelAnimationFrame(raf.current);
    };
  }, [target, duration, decimals]);
  return count;
}

const StatsSection: React.FC = () => (
  <section className="py-16 bg-gradient-to-r from-indigo-50 to-teal-50">
    <div className="max-w-5xl mx-auto px-4 text-center">
      <h2 className="text-3xl font-bold text-gray-900 mb-10">Platform Stats</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
        {stats.map((stat, i) => {
          const count = useCountUp(stat.number, 1200, stat.label === "Uptime" ? 1 : 0);
          return (
            <div
              key={stat.label}
              className="flex flex-col items-center bg-white rounded-2xl shadow-lg border border-gray-100 p-8 transition-transform duration-300 hover:scale-105 hover:shadow-indigo-200 hover:border-indigo-400 group cursor-pointer relative overflow-hidden"
            >
              <span className={`mb-4 inline-flex items-center justify-center rounded-full ${stat.color} px-3 py-2 font-bold text-base shadow-sm`}>{stat.icon}</span>
              <span className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-teal-500 mb-2 flex items-end">
                {stat.label === "Uptime" ? `${count}%` : stat.label === "Support (hrs)" ? `${count}/7` : `${count.toLocaleString()}+`}
              </span>
              <span className="text-gray-700 font-medium text-lg">{stat.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  </section>
);

export default StatsSection; 