import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { db } from "../lib/firebase";
import { doc, onSnapshot } from "firebase/firestore";
import { useGlobalLoading } from "../lib/loadingService";

export default function GlobalLoadingPopup() {
  const isLoading = useGlobalLoading();
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  // Dynamically fetch the latest Logo URL so the popup logo stays in sync with settings
  useEffect(() => {
    const unsub = onSnapshot(
      doc(db, "settings", "website"),
      (snap) => {
        if (snap.exists()) {
          setLogoUrl(snap.data().logoUrl || null);
        }
      },
      (err) => {
        console.error("Error fetching logo for global loading popup:", err);
      }
    );
    return () => unsub();
  }, []);

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          id="global-loading-popup-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
        >
          <motion.div
            id="global-loading-popup-content"
            initial={{ scale: 0.9, y: 15, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, y: 15, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 350 }}
            className="bg-white/95 border border-emerald-100 rounded-2xl p-8 max-w-sm w-full text-center shadow-[0_20px_50px_rgba(6,78,59,0.15)] flex flex-col items-center relative overflow-hidden"
          >
            {/* Ambient Background Glow Effect */}
            <div className="absolute -top-12 -left-12 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute -bottom-12 -right-12 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

            {/* Premium Animated Neon Glow Spinner with Logo */}
            <div className="relative w-28 h-28 flex items-center justify-center mb-6">
              {/* Outer Glowing Spinning Rings */}
              <div className="absolute inset-0 rounded-full border-4 border-emerald-100 shadow-[inset_0_0_8px_rgba(16,185,129,0.1)]"></div>
              
              {/* Spinning Accent Ring with Gradient and Neon Glow */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                className="absolute inset-0 rounded-full border-4 border-transparent border-t-emerald-600 border-r-amber-500 shadow-[0_0_15px_rgba(16,185,129,0.4)]"
              ></motion.div>

              {/* Subtly Pulsing Inner Logo Frame */}
              <motion.div
                animate={{ scale: [1, 1.04, 1] }}
                transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                className="relative w-20 h-20 rounded-full bg-emerald-50 border-2 border-emerald-500 flex items-center justify-center p-1.5 shadow-[0_4px_12px_rgba(6,78,59,0.1)] overflow-hidden bg-white z-10"
              >
                <img
                  src="/photo/logo.png"
                  alt="SNDM Logo Fallback"
                  className="w-full h-full object-cover rounded-full"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = "https://cdn-icons-png.flaticon.com/512/2913/2913520.png";
                  }}
                />
              </motion.div>
            </div>

            {/* Required Alinur Tatsama Typography and Message */}
            <h3 className="font-alinur text-emerald-950 text-lg sm:text-xl font-bold leading-relaxed tracking-wide px-2 drop-shadow-xs">
              धৈর্য ঈমানের সৌন্দর্য।
            </h3>
            <p className="font-alinur text-emerald-800 text-xs sm:text-sm mt-2 leading-relaxed px-1">
              অনুগ্রহ করে কিছুক্ষণ অপেক্ষা করুন, তথ্য লোড হচ্ছে।
            </p>

            {/* Interactive Pulse Indicators */}
            <div className="flex gap-1.5 justify-center mt-5">
              <span className="w-2.5 h-2.5 bg-emerald-600 rounded-full animate-bounce delay-75"></span>
              <span className="w-2.5 h-2.5 bg-amber-500 rounded-full animate-bounce delay-150"></span>
              <span className="w-2.5 h-2.5 bg-emerald-800 rounded-full animate-bounce delay-300"></span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
