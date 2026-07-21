import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { db } from "../lib/firebase";
import { doc, onSnapshot } from "firebase/firestore";
import { useGlobalLoading } from "../lib/loadingService";

export default function GlobalLoadingPopup() {
  const isLoading = useGlobalLoading();
  const [logoUrl, setLogoUrl] = useState<string | null | undefined>(undefined);

  // Dynamically fetch the latest Logo URL so the popup logo stays in sync with settings
  useEffect(() => {
    let unsubLegacy: (() => void) | null = null;
    const unsub = onSnapshot(
      doc(db, "settings", "branding"),
      (snap) => {
        if (snap.exists()) {
          setLogoUrl(snap.data().logoUrl || null);
        } else {
          if (!unsubLegacy) {
            unsubLegacy = onSnapshot(
              doc(db, "settings", "website"),
              (webSnap) => {
                if (webSnap.exists()) {
                  setLogoUrl(webSnap.data().logoUrl || null);
                } else {
                  setLogoUrl(null);
                }
              },
              (err) => {
                console.warn("Unable to reach legacy website config: ", err);
                setLogoUrl(null);
              }
            );
          } else {
            setLogoUrl(null);
          }
        }
      },
      (err) => {
        console.warn("Unable to reach branding config (operating in offline/fallback mode): ", err);
        setLogoUrl(null);
      }
    );
    return () => {
      unsub();
      if (unsubLegacy) unsubLegacy();
    };
  }, []);

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          id="global-loading-popup-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4, ease: "easeInOut" }}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-gradient-to-br from-emerald-950/90 via-slate-950/95 to-emerald-950/90 backdrop-blur-md px-4"
        >
          <motion.div
            id="global-loading-popup-content"
            initial={{ scale: 0.92, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.92, y: 20, opacity: 0 }}
            transition={{ type: "spring", damping: 28, stiffness: 320 }}
            className="bg-white/95 border-2 border-emerald-500/30 rounded-3xl p-10 max-w-sm w-full text-center shadow-[0_25px_60px_rgba(4,47,31,0.5)] flex flex-col items-center relative overflow-hidden"
            style={{ fontFamily: "'Noto Serif Bengali', serif" }}
          >
            {/* Ambient Background Glow Effects */}
            <div className="absolute -top-16 -left-16 w-32 h-32 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none animate-pulse" />
            <div className="absolute -bottom-16 -right-16 w-32 h-32 bg-amber-500/20 rounded-full blur-3xl pointer-events-none animate-pulse delay-1000" />

            {/* Premium Animated Neon Glow Spinner with Logo */}
            <div className="relative w-40 h-40 flex items-center justify-center mb-8">
              {/* Outer Glowing Spinning Rings */}
              <div className="absolute inset-0 rounded-full border-4 border-emerald-100/50 shadow-[inset_0_0_12px_rgba(16,185,129,0.2)]"></div>
              
              {/* Spinning Accent Ring with Gradient and Neon Glow */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1.8, ease: "linear" }}
                className="absolute inset-0 rounded-full border-4 border-transparent border-t-emerald-600 border-r-amber-500 shadow-[0_0_20px_rgba(16,185,129,0.5)]"
              ></motion.div>

              {/* Subtly Pulsing Inner Logo Frame with Premium Shadow */}
              <motion.div
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
                className="relative w-32 h-32 rounded-full bg-gradient-to-tr from-emerald-50 to-amber-50/50 border-2 border-emerald-500 flex items-center justify-center p-1.5 shadow-[0_8px_24px_rgba(4,47,31,0.2)] overflow-hidden bg-white z-10"
              >
                {logoUrl !== undefined ? (
                  <img
                    key={logoUrl || "default-logo"}
                    src={logoUrl || "/photo/logo.png"}
                    alt="SNDM Logo"
                    loading="eager"
                    className="w-full h-full object-contain rounded-full shadow-inner"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = "https://cdn-icons-png.flaticon.com/512/2913/2913520.png";
                    }}
                  />
                ) : (
                  <div className="w-full h-full rounded-full bg-emerald-100/60 animate-pulse"></div>
                )}
              </motion.div>
            </div>

            {/* Typography and Messages */}
            <h3 className="text-emerald-950 text-xl font-black leading-relaxed tracking-wide mb-1 px-2 drop-shadow-xs">
              সুফিয়া নূরীয়া দাখিল মাদ্রাসা
            </h3>
            
            <p className="text-emerald-800 text-sm font-semibold tracking-medium opacity-90">
              ধৈর্য ইমানের অঙ্গ।
            </p>

            {/* Stylish Circular Progress Indicator text */}
            <div className="mt-6 px-4 py-2 bg-emerald-50/80 border border-emerald-100/80 rounded-full flex items-center gap-2.5 shadow-sm">
              <svg className="animate-spin h-4 w-4 text-emerald-600 shrink-0" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span className="text-emerald-900 text-xs font-bold leading-none">
                আপনার নেটওয়ার্ক পারফরম্যান্স চেক করা হচ্ছে...
              </span>
            </div>

            {/* Interactive Pulse Indicators */}
            <div className="flex gap-2 justify-center mt-6">
              <span className="w-2.5 h-2.5 bg-emerald-600 rounded-full animate-bounce delay-75 shadow-md"></span>
              <span className="w-2.5 h-2.5 bg-amber-500 rounded-full animate-bounce delay-150 shadow-md"></span>
              <span className="w-2.5 h-2.5 bg-emerald-800 rounded-full animate-bounce delay-300 shadow-md"></span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
