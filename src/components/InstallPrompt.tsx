import React, { useEffect, useState } from "react";
import { Download, X, Smartphone } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);

  useEffect(() => {
    // Check if app is already running in standalone mode
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches 
      || (window.navigator as any).standalone 
      || document.referrer.includes('android-app://');
    
    if (isStandalone) {
      setIsInstalled(true);
      return;
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Store the event so it can be triggered later.
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Show the prompt 10 seconds after load
      const initialTimer = setTimeout(() => {
        setIsVisible(true);
      }, 10000);

      return () => clearTimeout(initialTimer);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // Also trigger the popup even if the event didn't fire (e.g., iOS Safari)
    // to guide the user on how to install. Show after 15 seconds initially.
    const backupTimer = setTimeout(() => {
      if (!isStandalone) {
        setIsVisible(true);
      }
    }, 15000);

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsVisible(false);
      setDeferredPrompt(null);
    };

    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
      clearTimeout(backupTimer);
    };
  }, []);

  // Interval trigger to show the prompt again every 2 minutes if closed
  useEffect(() => {
    if (isInstalled) return;

    const interval = setInterval(() => {
      setIsVisible(true);
    }, 120000); // 120,000 ms = 2 minutes

    return () => clearInterval(interval);
  }, [isInstalled]);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      // Show the install prompt
      deferredPrompt.prompt();
      // Wait for the user to respond to the prompt
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
        setIsVisible(false);
      }
      setDeferredPrompt(null);
    } else {
      // If deferredPrompt is not available (like iOS Safari)
      // Provide simple feedback/toast instructions
      alert("মাদ্রাসা অ্যাপটি ইনস্টল করতে আপনার ব্রাউজারের শেয়ার (Share) মেনু থেকে 'Add to Home Screen' বা 'হোম স্ক্রিনে যোগ করুন' সিলেক্ট করুন।");
      setIsVisible(false);
    }
  };

  const handleClose = () => {
    setIsVisible(false);
  };

  if (isInstalled) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -50, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="fixed top-20 left-4 right-4 md:left-auto md:right-6 md:w-96 z-50 bg-white dark:bg-emerald-950 border-2 border-amber-500 rounded-2xl shadow-2xl overflow-hidden font-alinur"
          style={{ fontFamily: 'Ador Noirit' }}
        >
          {/* Top colored accent */}
          <div className="bg-gradient-to-r from-emerald-800 to-emerald-600 h-2 w-full" />
          
          <div className="p-4 sm:p-5 relative">
            <button
              onClick={handleClose}
              className="absolute top-3 right-3 text-slate-400 hover:text-slate-600 dark:hover:text-amber-400 transition-colors cursor-pointer"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-start gap-4">
              <div className="bg-amber-100 dark:bg-amber-900/50 p-2.5 rounded-xl border border-amber-300 flex-shrink-0 text-amber-600 dark:text-amber-400">
                <Smartphone className="w-6 h-6 animate-bounce" />
              </div>

              <div className="space-y-1.5 flex-1 pr-6">
                <h4 className="font-extrabold text-base text-emerald-900 dark:text-amber-400 leading-tight">
                  মাদ্রাসা অ্যাপ ইনস্টল করুন!
                </h4>
                <p className="text-xs text-slate-600 dark:text-emerald-100/90 leading-relaxed">
                  আমাদের সুফিয়া নূরীয়া দাখিল মাদ্রাসা অ্যাপটি আপনার মোবাইলে ইনস্টল করে সরাসরি হোম স্ক্রিন থেকে দ্রুত নোটিশ ও রুটিন চেক করুন।
                </p>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-emerald-900/40 pt-3">
              <button
                onClick={handleClose}
                className="px-3 py-1.5 text-xs font-semibold text-slate-500 hover:text-slate-700 dark:text-slate-300 dark:hover:text-white transition-colors cursor-pointer"
              >
                পরে করুন
              </button>
              <button
                onClick={handleInstallClick}
                className="flex items-center gap-1.5 bg-gradient-to-r from-emerald-700 to-emerald-600 hover:from-emerald-600 hover:to-emerald-500 text-white font-bold text-xs px-4 py-2 rounded-lg shadow-md border-b-2 border-emerald-900 cursor-pointer active:scale-95 transition-all"
              >
                <Download className="w-3.5 h-3.5" />
                <span>অ্যাপ ইনস্টল করুন</span>
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
