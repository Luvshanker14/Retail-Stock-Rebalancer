import { FaTwitter, FaLinkedin, FaGithub } from "react-icons/fa";

const partnerBadges = [
  { name: "ShopEase", logo: "/store-icon.png" },
  { name: "RetailPro", logo: "/store-icon.png" },
  { name: "QuickMart", logo: "/store-icon.png" },
  { name: "MegaStore", logo: "/store-icon.png" },
];

const headingBadges = [
  "bg-indigo-100 text-indigo-700", // Product
  "bg-teal-100 text-teal-700",    // Company
  "bg-yellow-100 text-yellow-700" // Support
];

export default function FooterSection() {
  return (
    <footer className="bg-gradient-to-br from-white via-indigo-50 to-teal-50 border-t border-gray-200 pt-8 pb-8 mt-0">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Footer Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-8 items-start">
          {/* Brand block */}
          <div className="flex flex-col items-center md:items-start">
            <div className="relative mb-4">
              <span className="absolute -inset-1 rounded-full bg-gradient-to-r from-indigo-400 to-teal-400 blur-sm opacity-30"></span>
              <div className="relative w-12 h-12 rounded-full bg-white flex items-center justify-center border-2 border-indigo-100 shadow-lg">
                <span className="font-bold text-2xl text-indigo-600">SR</span>
              </div>
            </div>
            <span className="text-2xl font-extrabold text-gray-900 mb-2">StockRebalancer</span>
            <p className="text-gray-500 text-base max-w-xs text-center md:text-left mb-2">Intelligent retail inventory management for the modern business.</p>
            <span className="inline-block text-xs font-semibold text-indigo-500 bg-indigo-50 rounded px-2 py-1 mt-1">Empower. Optimize. Grow.</span>
          </div>
          {/* Navigation columns */}
          <div className="flex flex-col sm:flex-row justify-center items-start gap-10 col-span-1 md:col-span-1">
            {[
              {
                title: "Product",
                badge: headingBadges[0],
                links: [
                  { label: "Features", color: "hover:bg-indigo-100 hover:text-indigo-700" },
                  { label: "Pricing", color: "hover:bg-indigo-100 hover:text-indigo-700" },
                  { label: "API", color: "hover:bg-indigo-100 hover:text-indigo-700" },
                  { label: "Docs", color: "hover:bg-indigo-100 hover:text-indigo-700" },
                ],
              },
              {
                title: "Company",
                badge: headingBadges[1],
                links: [
                  { label: "About", color: "hover:bg-teal-100 hover:text-teal-700" },
                  { label: "Blog", color: "hover:bg-teal-100 hover:text-teal-700" },
                  { label: "Careers", color: "hover:bg-teal-100 hover:text-teal-700" },
                  { label: "Contact", color: "hover:bg-teal-100 hover:text-teal-700" },
                ],
              },
              {
                title: "Support",
                badge: headingBadges[2],
                links: [
                  { label: "Help Center", color: "hover:bg-yellow-100 hover:text-yellow-700" },
                  { label: "Community", color: "hover:bg-yellow-100 hover:text-yellow-700" },
                  { label: "Status", color: "hover:bg-yellow-100 hover:text-yellow-700" },
                  { label: "Security", color: "hover:bg-yellow-100 hover:text-yellow-700" },
                ],
              },
            ].map((col, i) => (
              <div key={col.title}>
                <span className={`inline-block mb-3 px-3 py-1 rounded-full font-semibold text-sm shadow-sm ${col.badge}`}>{col.title}</span>
                <ul className="space-y-2 text-gray-500 text-sm mt-2">
                  {col.links.map((link, j) => (
                    <li key={link.label}>
                      <a
                        href="#"
                        className={`block px-3 py-1 rounded transition ${link.color} hover:underline underline-offset-4`}
                      >
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          {/* Newsletter Signup */}
          <div className="flex flex-col items-center md:items-end w-full">
            <div className="w-full max-w-xs">
              <h3 className="text-lg font-bold text-gray-900 mb-1">Subscribe to our newsletter</h3>
              <p className="text-gray-500 text-sm mb-2">Get the latest updates, tips, and exclusive offers.</p>
              <form className="flex gap-2 w-full">
                <input
                  type="email"
                  required
                  placeholder="Your email address"
                  className="px-4 py-2 rounded-l-md border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-200 bg-gray-50 text-sm w-full"
                />
                <button
                  type="submit"
                  className="px-5 py-2 rounded-r-md bg-gradient-to-r from-indigo-500 to-teal-500 text-white font-semibold text-sm hover:from-indigo-600 hover:to-teal-600 transition"
                >
                  Subscribe
                </button>
              </form>
            </div>
          </div>
        </div>
        {/* Partner Badges */}
        <div className="flex flex-col items-center mb-6 border-t border-gray-100 pt-6">
          <span className="text-xs text-gray-500 mb-2">Trusted by leading retailers</span>
          <div className="flex gap-6 flex-wrap justify-center items-center">
            {partnerBadges.map((partner) => (
              <img
                key={partner.name}
                src={partner.logo}
                alt={partner.name}
                className="w-16 h-10 object-contain grayscale hover:grayscale-0 transition"
                title={partner.name}
              />
            ))}
          </div>
        </div>
        {/* Socials and copyright */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-center border-t border-gray-100 pt-6">
          <p className="text-xs text-gray-400 text-center md:text-left mb-6 md:mb-0">© 2024 StockRebalancer. All rights reserved.</p>
          <div className="flex flex-col items-center md:flex-row md:items-center gap-2 md:justify-end w-full">
            <span className="text-xs text-gray-500 mb-1 md:mb-0 md:mr-2">Follow us</span>
            <div className="flex space-x-3">
              <a href="#" className="rounded-full bg-white border border-gray-200 p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition shadow-sm"><FaTwitter className="w-5 h-5" /></a>
              <a href="#" className="rounded-full bg-white border border-gray-200 p-2 text-gray-400 hover:text-teal-600 hover:bg-teal-50 transition shadow-sm"><FaLinkedin className="w-5 h-5" /></a>
              <a href="#" className="rounded-full bg-white border border-gray-200 p-2 text-gray-400 hover:text-yellow-600 hover:bg-yellow-50 transition shadow-sm"><FaGithub className="w-5 h-5" /></a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
} 