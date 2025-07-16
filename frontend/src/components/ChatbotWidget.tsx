import React, { useState, useRef, useEffect } from "react";

// Comprehensive FAQ Database
const faqDatabase = [
  // Product Features
  { keywords: ["feature", "what can", "capabilities", "functionality", "tools"], response: "StockRebalancer offers multi-store management, real-time analytics, automated alerts, inventory tracking, team collaboration, cloud sync, customizable workflows, and enterprise security. What specific feature would you like to know more about?" },
  { keywords: ["multi-store", "multiple stores", "chain", "franchise"], response: "Yes! StockRebalancer is designed for multi-store management. You can manage all your retail locations from a single dashboard with real-time synchronization across all stores." },
  { keywords: ["analytics", "dashboard", "reports", "insights", "metrics"], response: "Our analytics dashboard provides detailed insights into sales trends, inventory turnover, stock levels, and performance metrics. You can generate custom reports and track KPIs in real-time." },
  { keywords: ["alerts", "notifications", "low stock", "restock"], response: "StockRebalancer sends automated alerts for low stock levels, sales spikes, inventory discrepancies, and restocking reminders. You can customize alert thresholds and delivery methods." },
  { keywords: ["real-time", "sync", "live", "instant"], response: "All data syncs in real-time across devices and users. Changes are instantly reflected in the dashboard, ensuring everyone has the latest information." },
  { keywords: ["cloud", "access", "anywhere", "mobile"], response: "StockRebalancer is cloud-powered, so you can access your dashboard from anywhere on any device. Perfect for on-the-go management!" },
  { keywords: ["security", "safe", "protected", "encryption"], response: "We use enterprise-grade security with encrypted data, secure backups, and industry-standard protection. Your data is always safe and compliant." },
  { keywords: ["team", "collaboration", "users", "permissions"], response: "Invite your team members with customizable permissions. Control who can view, edit, or manage different aspects of your inventory." },
  { keywords: ["workflow", "customize", "automation", "process"], response: "Customize workflows to match your business processes. Set up automated tasks, approval processes, and custom business rules." },

  // Pricing & Plans
  { keywords: ["price", "cost", "pricing", "plan", "subscription", "free"], response: "We offer flexible pricing plans starting from $29/month. There's a 14-day free trial with no credit card required. Would you like me to connect you with our sales team for detailed pricing?" },
  { keywords: ["trial", "demo", "test", "free trial"], response: "Yes! You can try StockRebalancer free for 14 days. No credit card required. Would you like me to help you set up a demo or start your trial?" },
  { keywords: ["upgrade", "plan", "subscription", "billing"], response: "You can upgrade your plan anytime from your dashboard. We offer monthly and annual billing with different tiers to match your business size." },

  // Support & Help
  { keywords: ["help", "support", "contact", "assistance"], response: "We offer 24/7 support via chat, email, and phone. Our support team is always ready to help with any questions or issues you might have." },
  { keywords: ["documentation", "docs", "guide", "tutorial", "how to"], response: "We have comprehensive documentation, video tutorials, and step-by-step guides. You can find them in our Help Center or I can walk you through specific features." },
  { keywords: ["setup", "onboarding", "get started", "begin"], response: "Getting started is easy! Our onboarding process takes about 10 minutes. We'll help you set up your stores, import inventory, and train your team." },
  { keywords: ["training", "learn", "tutorial", "guide"], response: "We provide free training sessions, video tutorials, and comprehensive documentation. Our team can also schedule personalized training for your staff." },

  // Technical
  { keywords: ["api", "integration", "connect", "third party"], response: "StockRebalancer offers a robust API for integrations with your existing systems. We support popular e-commerce platforms, accounting software, and POS systems." },
  { keywords: ["mobile", "app", "phone", "tablet"], response: "Our platform is fully responsive and works great on mobile devices. You can manage your inventory from your phone or tablet with full functionality." },
  { keywords: ["backup", "data", "export", "import"], response: "Your data is automatically backed up and secure. You can export data anytime and import from various formats including CSV, Excel, and API." },
  { keywords: ["uptime", "reliability", "performance", "speed"], response: "We maintain 99.9% uptime with fast performance. Our cloud infrastructure ensures your dashboard is always available and responsive." },

  // Business Benefits
  { keywords: ["benefit", "advantage", "improve", "efficiency", "save time"], response: "StockRebalancer helps you save time, reduce stockouts, improve sales, and make data-driven decisions. Most customers see 40% improvement in inventory turnover within 3 months." },
  { keywords: ["roi", "return", "investment", "value"], response: "Our customers typically see ROI within 2-3 months through reduced stockouts, improved efficiency, and better inventory management. The platform pays for itself quickly!" },
  { keywords: ["customer", "review", "testimonial", "feedback"], response: "We have thousands of satisfied customers across retail, e-commerce, and wholesale businesses. Our average customer rating is 4.8/5 stars." },

  // Common Questions
  { keywords: ["hello", "hi", "hey"], response: "Hello! I'm your StockRebalancer assistant. How can I help you today? I can answer questions about features, pricing, support, or help you get started." },
  { keywords: ["thanks", "thank you", "bye", "goodbye"], response: "You're welcome! Feel free to ask if you have more questions. Have a great day!" },
  { keywords: ["who", "company", "about us"], response: "StockRebalancer is a leading retail inventory management platform. We help businesses streamline operations, reduce costs, and grow efficiently. We're trusted by 500+ stores worldwide." },
];

// Smart keyword matching function
function findBestResponse(userInput: string): string {
  const input = userInput.toLowerCase();
  
  // Check for exact matches first
  for (const faq of faqDatabase) {
    if (faq.keywords.some(keyword => input.includes(keyword))) {
      return faq.response;
    }
  }
  
  // Check for partial matches
  for (const faq of faqDatabase) {
    if (faq.keywords.some(keyword => 
      keyword.split(' ').some(word => input.includes(word))
    )) {
      return faq.response;
    }
  }
  
  // Fallback responses
  const fallbacks = [
    "I'm not sure I understood that. Could you rephrase your question? I can help with features, pricing, support, or general questions about StockRebalancer.",
    "That's a great question! While I don't have a specific answer, I can help you with our features, pricing, or connect you with our support team.",
    "I'd be happy to help! Could you ask about our features, pricing, support, or how to get started with StockRebalancer?",
    "Let me help you find what you're looking for. You can ask about our inventory management features, pricing plans, or how to get support."
  ];
  
  return fallbacks[Math.floor(Math.random() * fallbacks.length)];
}

export default function ChatbotWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { from: "bot", text: "Hi! I'm your StockRebalancer assistant. I can help you with features, pricing, support, or any questions about our platform. How can I assist you today?" }
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, open]);

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;
    
    const userMessage = input.trim();
    setInput("");
    
    // Add user message
    setMessages(msgs => [...msgs, { from: "user", text: userMessage }]);
    
    // Show typing indicator
    setIsTyping(true);
    
    // Simulate typing delay for more natural feel
    setTimeout(() => {
      const botResponse = findBestResponse(userMessage);
      setMessages(msgs => [...msgs, { from: "bot", text: botResponse }]);
      setIsTyping(false);
    }, 1000 + Math.random() * 1000); // Random delay between 1-2 seconds
  };

  return (
    <>
      {/* Floating Button */}
      <button
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-br from-indigo-500 to-teal-500 shadow-lg flex items-center justify-center text-white text-2xl hover:scale-105 transition-all"
        onClick={() => setOpen(true)}
        style={{ display: open ? "none" : "flex" }}
        aria-label="Open chatbot"
      >
        💬
      </button>
      
      {/* Chat Window */}
      {open && (
        <div className="fixed bottom-6 right-6 z-50 w-80 bg-white rounded-xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden animate-fade-in">
          <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-indigo-500 to-teal-500 text-white">
            <span className="font-semibold">StockRebalancer Assistant</span>
            <button onClick={() => setOpen(false)} className="text-white text-lg font-bold hover:bg-white/20 rounded-full w-6 h-6 flex items-center justify-center">×</button>
          </div>
          
          <div className="flex-1 p-4 space-y-2 overflow-y-auto max-h-64 bg-gray-50">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.from === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`px-3 py-2 rounded-lg text-sm max-w-[85%] ${msg.from === "user" ? "bg-indigo-100 text-indigo-900" : "bg-white border border-gray-200 text-gray-700"}`}>
                  {msg.text}
                </div>
              </div>
            ))}
            
            {/* Typing indicator */}
            {isTyping && (
              <div className="flex justify-start">
                <div className="px-3 py-2 rounded-lg text-sm bg-white border border-gray-200 text-gray-700">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
          
          <div className="flex items-center border-t border-gray-200 p-2 bg-white">
            <input
              className="flex-1 px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm"
              type="text"
              placeholder="Ask me anything about StockRebalancer..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") handleSend(); }}
              disabled={isTyping}
            />
            <button
              className={`ml-2 px-3 py-2 rounded-lg font-semibold transition-all ${
                isTyping 
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-indigo-500 to-teal-500 text-white hover:from-indigo-600 hover:to-teal-600'
              }`}
              onClick={handleSend}
              disabled={isTyping}
            >
              Send
            </button>
          </div>
        </div>
      )}
    </>
  );
} 