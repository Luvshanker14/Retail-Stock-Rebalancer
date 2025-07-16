import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const faqs = [
  { q: "How do I register as a supplier?", a: "Click the 'Register as Supplier' button on the homepage and fill out the application form." },
  { q: "Is my data secure?", a: "Yes, we use industry-standard encryption and security practices to keep your data safe." },
  { q: "Can I manage multiple stores?", a: "Absolutely! Our platform is designed for multi-store management from a single dashboard." },
  { q: "What support do you offer?", a: "We offer 24/7 support via chat, email, and phone for all users." },
  { q: "Is there a free trial?", a: "Yes, new suppliers can try the platform free for 14 days with no credit card required." },
  { q: "How do I upgrade my plan?", a: "You can upgrade anytime from your dashboard under the subscription section." },
];

export default function FAQSection() {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <div className="max-w-3xl mx-auto px-4">
        <h2 className="text-3xl font-bold text-gray-900 text-center mb-10">Frequently Asked Questions</h2>
        <div className="space-y-4">
          {faqs.map((faq, i) => (
            <div key={i} className="bg-white rounded-2xl shadow border border-gray-100 transition-all duration-200 overflow-hidden">
              <button
                className={`w-full text-left px-6 py-5 text-lg font-semibold text-gray-800 flex justify-between items-center focus:outline-none transition-colors duration-200 hover:bg-indigo-50 hover:border-indigo-200 focus:bg-indigo-50 focus:border-indigo-300 ${open === i ? 'border-l-4 border-indigo-500' : ''}`}
                onClick={() => setOpen(open === i ? null : i)}
                aria-expanded={open === i}
              >
                <span>{faq.q}</span>
                <motion.span
                  className="ml-2 text-indigo-500 text-2xl font-bold"
                  animate={{ rotate: open === i ? 180 : 0 }}
                  transition={{ duration: 0.3 }}
                >
                  {open === i ? "-" : "+"}
                </motion.span>
              </button>
              <AnimatePresence initial={false}>
                {open === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="px-6 pb-5 text-gray-600 text-base bg-indigo-50/40"
                  >
                    {faq.a}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>
  );
} 