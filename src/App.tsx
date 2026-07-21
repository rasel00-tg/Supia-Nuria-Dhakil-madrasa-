import React, { useEffect, useState } from "react";
import Navbar from "./components/Navbar";
import HomeSection from "./components/HomeSection";
import TeachersSection from "./components/TeachersSection";
import InstituteOverviewSection from "./components/InstituteOverviewSection";
import HonoredSection from "./components/HonoredSection";
import RoutineSection from "./components/RoutineSection";
import ResultSection from "./components/ResultSection";
import AdmissionSection from "./components/AdmissionSection";
import LoginSection from "./components/LoginSection";
import DashboardSection from "./components/DashboardSection";
import CommitteeSection from "./components/CommitteeSection";
import SodossoFormSection from "./components/SodossoFormSection";
import StaffSection from "./components/StaffSection";
import StudentsSection from "./components/StudentsSection";
import CommitteeMemberDetail from "./components/CommitteeMemberDetail";
import GlobalLoadingPopup from "./components/GlobalLoadingPopup";
import NoticeSection from "./components/NoticeSection";
import ReviewCenterSection from "./components/ReviewCenterSection";
import GamingCornerSection from "./components/GamingCornerSection";
import InstallPrompt from "./components/InstallPrompt";
import ApplicationTracking from "./components/ApplicationTracking";
import HafizgonSection from "./components/HafizgonSection";
import GovernmentWebsitesSection from "./components/GovernmentWebsitesSection";
import { seedDatabaseIfEmpty } from "./lib/dbSeeder";
import { GraduationCap, BookOpen, Clock, Heart, Award } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { db, StreamBuilder, uploadFileToImgBB, handleFirestoreError, OperationType } from "./lib/firebase";
import { doc, onSnapshot, collection, query, setDoc, where, getDocs, deleteDoc } from "firebase/firestore";
import { Upload } from "lucide-react";
import { loadingService } from "./lib/loadingService";
import ImageCropper from "./components/ImageCropper";

const settingsCollectionQuery = query(collection(db, "settings"));
const footerSettingsCollectionQuery = query(collection(db, "footer_settings"));
const FooterStreamBuilder = StreamBuilder as any;
const BatchLogoStreamBuilder = StreamBuilder as any;

export default function App() {
  const [activeTab, setActiveTab] = useState<string>("home");
  const [isAdmissionFormOpen, setIsAdmissionFormOpen] = useState<boolean>(false);
  const [user, setUser] = useState<any | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null | undefined>(undefined);
  const [isLogoUploaded, setIsLogoUploaded] = useState<boolean>(false);
  const [logoUploading, setLogoUploading] = useState<boolean>(false);
  const [selectedCommitteeMember, setSelectedCommitteeMember] = useState<any | null>(null);
  const [prevCommitteeTab, setPrevCommitteeTab] = useState<string>("home");

  const [jdcUploading, setJdcUploading] = useState<boolean>(false);
  const [imranUploading, setImranUploading] = useState<boolean>(false);
  const [batchCropSrc, setBatchCropSrc] = useState<string | null>(null);
  const [batchUploading, setBatchUploading] = useState<boolean>(false);

  const handleBatchLogoFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setBatchCropSrc(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleBatchCropComplete = async (croppedBlob: Blob) => {
    setBatchCropSrc(null);
    setBatchUploading(true);
    try {
      const croppedFile = new File([croppedBlob], "batch_logo.jpg", { type: "image/jpeg" });
      const url = await uploadFileToImgBB(croppedFile);
      await setDoc(doc(db, "footer_settings", "batch_logo"), {
        logo_url: url,
        is_uploaded: true
      }, { merge: true });
    } catch (error) {
      console.error("Error cropping and uploading batch logo:", error);
      alert("লোগো আপলোড ব্যর্থ হয়েছে। পুনরায় চেষ্টা করুন।");
    } finally {
      setBatchUploading(false);
    }
  };

  // Strict 2s Splash Timeout Guard and Slow Network alert states
  const [showSlowNetworkAlert, setShowSlowNetworkAlert] = useState<boolean>(false);
  const [isNetworkSlow, setIsNetworkSlow] = useState<boolean>(!navigator.onLine);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (loadingService.isLoading) {
        console.warn("Strict 2s Splash Timeout Guard triggered! Bypassing logo loading screen.");
        loadingService.forceHideInitial();
        setShowSlowNetworkAlert(true);
        setIsNetworkSlow(true); // Triggers the bottom red alert
        setActiveTab("home");
      }
    }, 2000); // Strict 2 seconds (2000 ms)

    return () => clearTimeout(timer);
  }, []);

  // Session Countdown state (1200 seconds = 20 minutes)
  const [sessionTimeLeft, setSessionTimeLeft] = useState<number>(1200);

  // Connectivity States
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [showOfflineModal, setShowOfflineModal] = useState<boolean>(!navigator.onLine);
  const [showOnlineToast, setShowOnlineToast] = useState<boolean>(false);

  // Connectivity and Network Performance Listeners
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowOfflineModal(false);
      setShowOnlineToast(true);
      setIsNetworkSlow(false); // Auto-dismiss red alert when connection is restored
      setTimeout(() => setShowOnlineToast(false), 4000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowOfflineModal(true);
      setIsNetworkSlow(true); // Show red alert when offline
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Monitor loading finished to auto-dismiss slow network alert when background sync is done
    const unsubscribeLoading = loadingService.subscribe((loading) => {
      if (!loading && navigator.onLine) {
        setIsNetworkSlow(false);
      }
    });

    // Monitor browser Connection API for real-time performance checking if available
    const navConn = (navigator as any).connection;
    const handleConnectionChange = () => {
      if (navConn) {
        const isSlow = navConn.downlink < 1.0 || navConn.rtt > 500 || navConn.effectiveType === '2g' || navConn.effectiveType === 'slow-2g';
        if (isSlow) {
          setIsNetworkSlow(true);
        } else if (navigator.onLine) {
          setIsNetworkSlow(false);
        }
      }
    };

    if (navConn) {
      navConn.addEventListener("change", handleConnectionChange);
      handleConnectionChange();
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      unsubscribeLoading();
      if (navConn) {
        navConn.removeEventListener("change", handleConnectionChange);
      }
    };
  }, []);

  const handleJdcLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setJdcUploading(true);
    try {
      const url = await uploadFileToImgBB(file);
      await setDoc(doc(db, "settings", "footer"), {
        jdcLogoUrl: url,
        isJdcLogoUploaded: true
      }, { merge: true });
    } catch (error) {
      console.error("Error uploading JDC logo:", error);
    } finally {
      setJdcUploading(false);
    }
  };

  const handleImranImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImranUploading(true);
    try {
      const url = await uploadFileToImgBB(file);
      await setDoc(doc(db, "settings", "footer"), {
        imranImageUrl: url,
        isImranUploaded: true
      }, { merge: true });
    } catch (error) {
      console.error("Error uploading Imran image:", error);
    } finally {
      setImranUploading(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoUploading(true);
    try {
      const url = await uploadFileToImgBB(file);
      await setDoc(doc(db, "settings", "branding"), {
        logoUrl: url,
        isMainLogoUploaded: true,
        isLogoUploaded: true
      }, { merge: true });
    } catch (error) {
      console.error("Error uploading official logo:", error);
      alert("লোগো আপলোড ব্যর্থ হয়েছে। পুনরায় চেষ্টা করুন।");
    } finally {
      setLogoUploading(false);
    }
  };

  // Initialize and seed database if empty, and load user from localStorage
  useEffect(() => {
    // Seed in background
    seedDatabaseIfEmpty();

    // Check localStorage session
    const savedUser = localStorage.getItem("sndm_user");
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (err) {
        console.error("Error reading saved user session:", err);
      }
    }

    let unsubLegacy: (() => void) | null = null;

    // Subscribe to dynamic website settings (branding & logo)
    const unsubBranding = onSnapshot(doc(db, "settings", "branding"), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        const url = data.logoUrl || null;
        setLogoUrl(url);
        setIsLogoUploaded(!!data.isMainLogoUploaded || !!data.isLogoUploaded);

        // Dynamically update the favicon and PWA manifest
        if (url) {
          try {
            // Update manifest dynamically
            const manifestObj = {
              "short_name": "Sufia Nuria",
              "name": "সুফিয়া নূরীয়া দাখিল মাদ্রাসা",
              "icons": [
                {
                  "src": url,
                  "sizes": "192x192",
                  "type": "image/png",
                  "purpose": "any"
                },
                {
                  "src": url,
                  "sizes": "512x512",
                  "type": "image/png",
                  "purpose": "any"
                }
              ],
              "start_url": "/",
              "background_color": "#064e3b",
              "theme_color": "#f59e0b",
              "display": "standalone",
              "orientation": "portrait"
            };
            const blob = new Blob([JSON.stringify(manifestObj, null, 2)], { type: 'application/manifest+json' });
            const manifestUrl = URL.createObjectURL(blob);
            const manifestLink = document.querySelector("link[rel='manifest']") as HTMLLinkElement;
            if (manifestLink) {
              manifestLink.href = manifestUrl;
            }

            // Dynamically update standard favicons of optimized sizes
            const sizes = ["192x192", "512x512"];
            sizes.forEach(size => {
              let link = document.querySelector(`link[rel*='icon'][sizes='${size}']`) as HTMLLinkElement;
              if (!link) {
                link = document.createElement('link');
                link.rel = 'icon';
                link.sizes = size;
                link.type = 'image/png';
                document.head.appendChild(link);
              }
              link.href = url;
            });

            // Update default favicon
            let defaultLink = document.querySelector("link[rel='icon']:not([sizes])") as HTMLLinkElement;
            if (defaultLink) {
              defaultLink.href = url;
            }

            // Update apple-touch-icon
            let appleLink = document.querySelector("link[rel='apple-touch-icon']") as HTMLLinkElement;
            if (appleLink) {
              appleLink.href = url;
            }
          } catch (e) {
            console.error("Error updating manifest or favicons dynamically:", e);
          }
        }
      } else {
        // Fallback to legacy website settings if branding document doesn't exist yet
        if (!unsubLegacy) {
          unsubLegacy = onSnapshot(doc(db, "settings", "website"), (webSnap) => {
            if (webSnap.exists()) {
              const data = webSnap.data();
              setLogoUrl(data.logoUrl || null);
            } else {
              setLogoUrl(null);
            }
          }, (err) => {
            console.warn("Unable to reach legacy website config: ", err);
            setLogoUrl(null);
          });
        } else {
          setLogoUrl(null);
        }
      }
    }, (err) => {
      console.warn("Unable to reach branding config (operating in offline/fallback mode): ", err);
      setLogoUrl(null);
    });

    return () => {
      unsubBranding();
      if (unsubLegacy) {
        unsubLegacy();
      }
    };
  }, []);

  const handleLoginSuccess = (loggedInUser: any) => {
    setUser(loggedInUser);
    localStorage.setItem("sndm_user", JSON.stringify(loggedInUser));
    setActiveTab("dashboard");
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("sndm_user");
    setActiveTab("home");
  };

  // Real-time listener for active admin account status (lock, disable, delete, assistant admin expiry)
  useEffect(() => {
    if (!user || user.role !== "admin") return;
    if (user.email === "mother.admin@sufianooria.com") return;

    const loginIdOrEmail = (user.email || "").toLowerCase();

    const unsub = onSnapshot(collection(db, "admins"), async (snapshot) => {
      const currentAdminDoc = snapshot.docs.find(d => {
        const data = d.data();
        return (
          (data.email && data.email.toLowerCase() === loginIdOrEmail) ||
          (data.loginId && data.loginId.toLowerCase() === loginIdOrEmail) ||
          (data.phone && data.phone === loginIdOrEmail)
        );
      });

      if (!currentAdminDoc) {
        if (!snapshot.empty) {
          alert("আপনার এডমিন একাউন্টটি ডিলিট করা হয়েছে।");
          setUser(null);
          localStorage.removeItem("sndm_user");
          setActiveTab("login");
        }
        return;
      }

      const adminData = currentAdminDoc.data();

      // Assistant Admin Expiry check & Auto-deletion from Firestore
      if (adminData.role === "assistant_admin" && adminData.expiryTimestamp) {
        if (new Date() > new Date(adminData.expiryTimestamp)) {
          // Permanently delete document from Firestore database
          try {
            await deleteDoc(doc(db, "admins", currentAdminDoc.id));
          } catch (e) {
            console.error("Error auto-deleting expired admin from Firestore:", e);
          }
          // Display required popup notification
          alert("আপনার একাউন্ট এর মেয়াদ শেষ হয়ে গিয়েছে!");
          // Clear session and redirect to login
          setUser(null);
          localStorage.removeItem("sndm_user");
          setActiveTab("login");
          return;
        }
      }

      // Suspension/Lock check
      if (adminData.status === "suspended") {
        alert("আপনার এডমিন একাউন্টটি বর্তমানে স্থগিত (Suspended) করা হয়েছে।");
        setUser(null);
        localStorage.removeItem("sndm_user");
        setActiveTab("login");
        return;
      }
    }, (err) => {
      console.error("Error listening to admin changes:", err);
    });

    return () => unsub();
  }, [user]);

  // Auto-logout countdown logic & Unified 20-Min Inactivity & Background Logout Logic
  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    // Timer for active tab inactivity (when not on dashboard)
    if (user && activeTab !== "dashboard" && activeTab !== "login") {
      timer = setInterval(() => {
        setSessionTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            // Handle auto logout
            setUser(null);
            localStorage.removeItem("sndm_user");
            setActiveTab("login");
            return 1200;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      // Reset timer when user is on dashboard or logged out
      setSessionTimeLeft(1200);
    }

    // Visibility change logic for AppLifecycleState.paused / hidden
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        if (user) {
          localStorage.setItem("lastExitTimestamp", Date.now().toString());
        }
      } else if (document.visibilityState === "visible") {
        const lastExitStr = localStorage.getItem("lastExitTimestamp");
        if (lastExitStr && user) {
          const lastExit = parseInt(lastExitStr, 10);
          const now = Date.now();
          const diffMs = now - lastExit;
          // 20 minutes = 1200000 milliseconds
          if (diffMs >= 1200000) {
            // Purge firebase session and auto logout
            setUser(null);
            localStorage.removeItem("sndm_user");
            localStorage.removeItem("lastExitTimestamp");
            setActiveTab("login");
            setSessionTimeLeft(1200);
          } else {
            // Reset timer automatically if returning within 20 mins
            localStorage.removeItem("lastExitTimestamp");
            setSessionTimeLeft(1200);
          }
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      if (timer) clearInterval(timer);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [user, activeTab]);

  // Format time (MM:SS)
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Back button navigation control for "teachers", "sodosso_form", "staff", "committee", "notice_corner" and "committee_member_detail" tabs
  // Emulates PopScope/WillPopScope in a React SPA.
  // When activeTab changes, we push a state into history.
  // When the user presses the hardware/software back button, we intercept it.
  useEffect(() => {
    if (activeTab === "teachers" || activeTab === "sodosso_form" || activeTab === "staff" || activeTab === "committee" || activeTab === "committee_member_detail" || activeTab === "notice_corner" || activeTab === "routine" || activeTab === "application_tracking" || activeTab === "hafizgon" || activeTab === "government_websites") {
      // Push history state to enable a backward pop action
      window.history.pushState({ prevTab: activeTab }, "");

      const handlePopState = (event: PopStateEvent) => {
        event.preventDefault();
        if (activeTab === "committee_member_detail") {
          setActiveTab(prevCommitteeTab || "committee");
        } else {
          // Redirect to main Home Page instead of returning to a previous tab or page
          setActiveTab("home");
        }
      };

      window.addEventListener("popstate", handlePopState);
      return () => {
        window.removeEventListener("popstate", handlePopState);
      };
    }
  }, [activeTab, prevCommitteeTab]);

  return (
    <div className="min-h-screen flex flex-col bg-[#fdfdfb] text-slate-800 font-sans selection:bg-amber-100 selection:text-emerald-950">
      {/* Global Loading Popup Overlay */}
      <GlobalLoadingPopup />

      {/* Slow Network Soft Popup Alert */}
      <AnimatePresence>
        {showSlowNetworkAlert && activeTab === "home" && (
          <div className="fixed top-24 left-4 right-4 md:left-auto md:right-4 md:w-96 z-[999]" style={{ fontFamily: "'Noto Serif Bengali', serif" }}>
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: -20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: -20 }}
              className="bg-white/95 backdrop-blur-md border-2 border-amber-200 text-slate-800 p-4 rounded-2xl shadow-xl flex items-start gap-3 relative"
            >
              <div className="w-10 h-10 bg-amber-50 rounded-full flex items-center justify-center text-amber-500 shrink-0">
                <svg className="w-5 h-5 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0 pr-6">
                <p className="font-extrabold text-amber-950 text-sm leading-tight">
                  আপনার নেটওয়ার্ক কানেকশন স্লো!
                </p>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  অফলাইন ক্যাশ থেকে তথ্য লোড করা হয়েছে এবং ব্যাকগ্রাউন্ডে নতুন তথ্য সিংক্রোনাইজ হচ্ছে।
                </p>
              </div>
              <button
                onClick={() => setShowSlowNetworkAlert(false)}
                className="absolute top-3 right-3 text-slate-400 hover:text-slate-600 focus:outline-none transition-colors p-1.5 rounded-full hover:bg-slate-100"
                aria-label="Close"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Dynamic Bottom Red Error Auto-Dismissing Alert */}
      <AnimatePresence>
        {isNetworkSlow && activeTab === "home" && (
          <div className="fixed bottom-20 left-4 right-4 md:left-1/2 md:right-auto md:-translate-x-1/2 md:w-[450px] z-[9999]" style={{ fontFamily: "'Noto Serif Bengali', serif" }}>
            <motion.div
              initial={{ y: 50, scale: 0.95, opacity: 0 }}
              animate={{ y: 0, scale: 1, opacity: 1 }}
              exit={{ y: 50, scale: 0.95, opacity: 0 }}
              transition={{ type: "spring", stiffness: 380, damping: 28 }}
              className="bg-rose-600/95 backdrop-blur-md text-white p-4 rounded-2xl shadow-[0_10px_30px_rgba(225,29,72,0.35)] border-2 border-rose-500/50 flex items-center gap-3 relative"
            >
              <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-white shrink-0 animate-pulse">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0 pr-6">
                <p className="font-extrabold text-white text-base leading-tight">
                  আপনার নেটওয়ার্ক অত্যন্ত স্লো!
                </p>
                <p className="text-xs text-rose-100 mt-1 leading-relaxed">
                  অফলাইন ক্যাশ থেকে মাদ্রাসা তথ্য প্রদর্শিত হচ্ছে। সংযোগ স্বাভাবিক হওয়া মাত্র তথ্য স্বয়ংক্রিয়ভাবে আপডেট হবে।
                </p>
              </div>
              <button
                onClick={() => setIsNetworkSlow(false)}
                className="absolute top-3 right-3 text-rose-200 hover:text-white focus:outline-none transition-colors p-1.5 rounded-full hover:bg-white/10"
                aria-label="Close"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* PWA App Install Prompt Loop - Hidden when logged in */}
      {!user && <InstallPrompt />}

      {/* Session Reminder Banner */}
      <AnimatePresence>
        {user && activeTab !== "dashboard" && activeTab !== "login" && (
          <motion.div
            initial={{ y: -70, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -70, opacity: 0 }}
            className="sticky top-0 z-[100] bg-emerald-950 text-white py-3 px-4 shadow-2xl border-b border-amber-500/40 flex flex-col md:flex-row items-center justify-center gap-3 font-alinur text-center md:text-left backdrop-blur-md bg-opacity-95"
          >
            <div className="flex items-center gap-2 text-[11px] md:text-[13px]">
              <div className="h-2 w-2 bg-rose-500 rounded-full animate-pulse shadow-[0_0_8px_#f43f5e]"></div>
              <p className="font-bold leading-relaxed">
                প্রিয় <span className="text-amber-400">{user.name}</span>, আপনি বর্তমানে <span className="text-emerald-400">{user.role === 'teacher' ? 'শিক্ষক' : 'শিক্ষার্থী'}</span> লগইন অবস্থায় আছেন। আপনি ২০ মিনিটের মধ্যে ড্যাশবোর্ডে ফিরে না গেলে একাউন্ট লগআউট হয়ে যাবে।
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5 bg-emerald-900/50 px-3 py-1.5 rounded-full border border-white/10 shadow-inner min-w-[70px] justify-center">
                <Clock className="h-3 w-3 text-amber-400" />
                <span className="text-[11px] font-black font-mono tracking-tighter text-amber-400">
                  {formatTime(sessionTimeLeft)}
                </span>
              </div>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setActiveTab("dashboard");
                  setSessionTimeLeft(1200);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className="bg-gradient-to-r from-orange-400 to-orange-600 text-white px-5 py-2 rounded-full text-[10px] md:text-[11px] font-black shadow-lg shadow-orange-500/20 hover:shadow-orange-500/40 transition-all flex items-center gap-2 group cursor-pointer border border-white/10"
              >
                ড্যাশবোর্ডে ফিরে যান
                <motion.span
                  animate={{ x: [0, 4, 0] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                >
                  ➜
                </motion.span>
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sticky Top Navbar - Hidden on Login Page */}
      {activeTab !== "login" && (
        <Navbar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          user={user}
          onLogout={handleLogout}
          logoUrl={logoUrl}
          isLogoUploaded={isLogoUploaded}
          logoUploading={logoUploading}
          onLogoUpload={handleLogoUpload}
        />
      )}

      {/* Main Content Area */}
      <main className="flex-1 w-full p-0 m-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="w-full h-full"
          >
            {activeTab === "home" && (
              <HomeSection
                logoUrl={logoUrl}
                setActiveTab={setActiveTab}
                onSelectMember={(member) => {
                  setSelectedCommitteeMember(member);
                  setPrevCommitteeTab("home");
                  setActiveTab("committee_member_detail");
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
              />
            )}
            {activeTab === "teachers" && <TeachersSection />}
            {activeTab === "overview" && <InstituteOverviewSection />}
            {activeTab === "honored" && <HonoredSection />}
            {activeTab === "routine" && <RoutineSection />}
            {activeTab === "result" && <ResultSection />}
            {activeTab === "admission" && <AdmissionSection onFormStateChange={setIsAdmissionFormOpen} logoUrl={logoUrl} />}
            {activeTab === "committee" && (
              <CommitteeSection
                onSelectMember={(member) => {
                  setSelectedCommitteeMember(member);
                  setPrevCommitteeTab("committee");
                  setActiveTab("committee_member_detail");
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
              />
            )}
            {activeTab === "committee_member_detail" && selectedCommitteeMember && (
              <CommitteeMemberDetail
                member={selectedCommitteeMember}
                onBack={() => {
                  setActiveTab(prevCommitteeTab || "committee");
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
              />
            )}
            {activeTab === "sodosso_form" && <SodossoFormSection logoUrl={logoUrl} />}
            {activeTab === "staff" && <StaffSection logoUrl={logoUrl} />}
            {activeTab === "students" && <StudentsSection logoUrl={logoUrl} />}
            {activeTab === "notice_corner" && <NoticeSection />}
            {activeTab === "hafizgon" && <HafizgonSection />}
            {activeTab === "government_websites" && <GovernmentWebsitesSection />}
            {activeTab === "gaming_corner" && <GamingCornerSection logoUrl={logoUrl} />}
            {activeTab === "review_center" && <ReviewCenterSection />}
            {activeTab === "application_tracking" && <ApplicationTracking logoUrl={logoUrl} setActiveTab={setActiveTab} />}
            {activeTab === "login" && (
              <LoginSection onLoginSuccess={handleLoginSuccess} logoUrl={logoUrl} />
            )}
            {activeTab === "dashboard" && user && (
              <DashboardSection user={user} setUser={setUser} setActiveTab={setActiveTab} />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Sticky Bottom/Footer Section */}
      {!(activeTab === "admission" && isAdmissionFormOpen) && activeTab !== "teachers" && activeTab !== "review_center" && activeTab !== "gaming_corner" && activeTab !== "committee" && activeTab !== "committee_member_detail" && activeTab !== "dashboard" && activeTab !== "sodosso_form" && activeTab !== "staff" && activeTab !== "students" && activeTab !== "honored" && activeTab !== "routine" && activeTab !== "application_tracking" && activeTab !== "hafizgon" && activeTab !== "government_websites" && activeTab !== "login" && user?.role !== "admin" && (
        <FooterStreamBuilder
          stream={settingsCollectionQuery}
          builder={(settingsList) => {
            const footerSettings = settingsList.find(s => s.id === "footer") || {};
            const jdcLogoUrl = footerSettings.jdcLogoUrl || "";
            const isJdcLogoUploaded = footerSettings.isJdcLogoUploaded || false;
            const imranImageUrl = footerSettings.imranImageUrl || "";
            const isImranUploaded = footerSettings.isImranUploaded || false;

            return (
              <footer id="main-footer" className="bg-gradient-to-b from-emerald-950 via-emerald-900 to-emerald-950 text-white border-t-4 border-amber-500 py-2.5 px-4 sm:px-6 lg:px-8 mt-3 print:hidden font-alinur relative overflow-hidden leading-[1.1]">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#047857_1px,transparent_1px),linear-gradient(to_bottom,#047857_1px,transparent_1px)] bg-[size:3rem_3rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-5 pointer-events-none"></div>

                <div className="max-w-7xl mx-auto relative z-10">
                  {/* Branding Hub (Propeller Center) */}
                  <div className="flex flex-col items-center text-center space-y-1 mb-2">
                    <div className="relative">
                      <div className="absolute inset-0 bg-amber-500/20 blur-xl rounded-full animate-pulse"></div>
                      <img 
                        src={logoUrl || "/photo/logo.png"} 
                        alt="Logo" 
                        className="h-14 w-14 sm:h-16 sm:w-16 object-contain rounded-full relative z-10 bg-white p-1 border-2 border-amber-400 shadow-md transition-all duration-300 hover:scale-105"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = "https://cdn-icons-png.flaticon.com/512/2913/2913520.png";
                        }}
                      />
                    </div>
                    <h3 className="font-extrabold text-base sm:text-lg text-amber-400 tracking-wide leading-none">
                      সুফিয়া নূরীয়া দাখিল মাদ্রাসা
                    </h3>
                    <p className="text-[10px] sm:text-[11px] text-emerald-100 max-w-2xl mx-auto leading-tight opacity-90 font-bornomala">
                      <span className="font-bengali">১৯৭৫</span> সালে প্রতিষ্ঠিত পল্লান পাড়ার ঐতিহ্যবাহী দ্বীনি বিদ্যাপীঠ। কুরআন-সুন্নাহর আলোকে আদর্শ সুনাগরিক গড়ে তোলাই আমাদের অঙ্গীকার।
                    </p>
                  </div>

                  {/* Balanced Propeller Blades Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 items-start">
                    {/* Left Blade: Important Links */}
                    <div className="space-y-1.5 md:text-left text-center">
                      <h4 className="text-[11px] font-bold text-amber-400 border-b border-emerald-800/50 pb-1 inline-block md:block leading-none">
                        গুরুত্বপূর্ণ লিংকসমূহ
                      </h4>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[11px] max-w-xs mx-auto md:mx-0 w-full">
                        {[
                          { label: "স্মরণীয় ব্যক্তিত্ব", tab: "honored" },
                          { label: "শিক্ষকবৃন্দ", tab: "teachers" },
                          { label: "হোমপেজ", tab: "home" },
                          { label: "অনলাইন ভর্তি", tab: "admission" },
                          { label: "ক্লাস রুটিন", tab: "routine" },
                          { label: "ফলাফল খুঁজুন", tab: "result" }
                        ].map((link) => (
                          <button
                            key={link.label}
                            onClick={() => {
                              setActiveTab(link.tab);
                              window.scrollTo({ top: 0, behavior: "smooth" });
                            }}
                            className="text-left text-emerald-100 hover:text-amber-300 transition-colors duration-200 flex items-center gap-1.5 cursor-pointer font-medium leading-normal w-full"
                          >
                            <span className="text-amber-500/60 text-[8px] shrink-0">✦</span>
                            <span className="truncate">{link.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Middle Blade: Credits & JDC Logo */}
                    <div className="flex flex-col items-center text-center border-x-0 md:border-x border-emerald-800/30 px-4 py-1 md:py-0 space-y-1">
                      <h4 className="text-[11px] font-bold text-amber-400 border-b border-emerald-800/50 pb-1 inline-block md:block leading-none mb-1 w-fit">
                        সহযোগিতা ও শুভেচ্ছান্তে
                      </h4>
                      <div className="text-[10px] text-emerald-100 flex flex-col items-center justify-center space-y-1 leading-tight w-full">
                        <p className="text-center font-medium">
                          ডেভেলপমেন্ট ও কারিগরি আপডেট সহায়তায়:
                        </p>
                        <p className="text-center text-amber-300">
                          রাশেদুল করিম (সাবেক শিক্ষার্থী JDC-18)
                        </p>
                        <p className="text-center pt-0.5 font-medium">
                          শুভেচ্ছান্তে:
                        </p>
                        <p className="text-center text-amber-300">
                          JDC-18 ব্যাচের সকল শিক্ষার্থীবৃন্দ
                        </p>
                        
                        <BatchLogoStreamBuilder
                          stream={footerSettingsCollectionQuery}
                          builder={(batchLogoList) => {
                            const batchLogoDoc = batchLogoList.find(b => b.id === "batch_logo") || {};
                            const batchLogoUrl = batchLogoDoc.logo_url || "";
                            const isUploaded = batchLogoDoc.is_uploaded || false;

                            return (
                              <div className="w-full flex flex-col items-center justify-center">
                                {isUploaded && batchLogoUrl ? (
                                  <div className="flex justify-center mt-1">
                                    <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-lg border border-amber-500/20 bg-emerald-950/40 p-0 shadow-md shrink-0 flex items-center justify-center overflow-hidden">
                                      <img 
                                        src={batchLogoUrl} 
                                        alt="JDC-18 Logo" 
                                        className="w-full h-full object-cover" 
                                        style={{ imageRendering: 'auto' }}
                                      />
                                    </div>
                                  </div>
                                ) : (
                                  <div className="pt-1 flex flex-col items-center justify-center">
                                    <input 
                                      type="file" 
                                      accept="image/*" 
                                      className="hidden" 
                                      id="footer-jdc-logo" 
                                      onChange={handleBatchLogoFileSelect} 
                                      disabled={batchUploading} 
                                    />
                                    <label 
                                      htmlFor="footer-jdc-logo" 
                                      className={`inline-flex items-center gap-1.5 bg-emerald-900/60 hover:bg-emerald-800 text-amber-300 text-[9px] sm:text-[10px] font-bold py-1.5 px-3 rounded-md border border-amber-500/20 cursor-pointer transition-all ${batchUploading ? "opacity-50" : ""}`}
                                    >
                                      <Upload className="w-3 h-3" />
                                      <span>{batchUploading ? "আপলোড হচ্ছে..." : "লোগো যুক্ত করুন"}</span>
                                    </label>
                                  </div>
                                )}
                              </div>
                            );
                          }}
                        />
                      </div>
                    </div>

                    {/* Right Blade: Remembrance */}
                    <div className="flex flex-col items-center text-center justify-center space-y-1 py-1 md:py-0 w-full">
                      <h4 className="text-[11px] font-bold text-amber-400 border-b border-emerald-800/50 pb-1 inline-block md:block leading-none mb-1 w-fit">
                        স্মরণে
                      </h4>
                      <div className="text-[10px] text-emerald-100 flex flex-col items-center justify-center space-y-1.5 w-full">
                        <div className="flex flex-col items-center justify-center gap-1">
                          {isImranUploaded && imranImageUrl && (
                            <div className="flex justify-center pb-1">
                              <img 
                                src={imranImageUrl} 
                                alt="হাফেজ ইমরান" 
                                className="w-12 h-12 sm:w-14 sm:h-14 object-cover rounded-full border-2 border-amber-400 shadow-md bg-emerald-950/40 shrink-0" 
                              />
                            </div>
                          )}
                          <div className="text-center space-y-0.5">
                            <p className="font-bold text-amber-300 text-[10.5px] leading-tight">হাফেজ মোহাম্মদ ইমরান</p>
                            <p className="text-[9.5px] text-emerald-200 leading-tight italic">আল্লাহ আমাদের প্রিয় বন্ধুকে জান্নাতুল ফেরদৌস নসীব করুন। আমিন।</p>
                          </div>
                        </div>

                        {!isImranUploaded && (
                          <div className="pt-1 flex justify-center">
                            <input type="file" accept="image/*" className="hidden" id="footer-imran-image" onChange={handleImranImageUpload} disabled={imranUploading} />
                            <label htmlFor="footer-imran-image" className={`inline-flex items-center gap-1 bg-emerald-900/50 hover:bg-emerald-800 text-amber-300 text-[8px] font-bold py-1 px-2 rounded-md border border-amber-500/20 cursor-pointer transition-all ${imranUploading ? "opacity-50" : ""}`}>
                              <Upload className="w-2.5 h-2.5" />
                              <span>{imranUploading ? "..." : "ছবি আপলোড"}</span>
                            </label>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Copyright Footer (Centered Propeller Base) */}
                  <div className="w-full border-t border-emerald-800/30 mt-3 pt-2 flex flex-col sm:flex-row items-center justify-between gap-1.5 text-[10px] sm:text-[10.5px] text-emerald-200/75 tracking-wide leading-relaxed font-sans">
                    <p className="text-center sm:text-left">© {new Date().getFullYear()} সুফিয়া নূরীয়া দাখিল মাদ্রাসা। সর্বস্বত্ব সংরক্ষিত।</p>
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                      <p className="font-bold text-amber-400/80 tracking-widest uppercase">ভার্সন ২.১ (Version 2.1)</p>
                    </div>
                  </div>
                </div>
              </footer>
            );
          }}
        />
      )}

      {/* Connectivity UI Components */}
      <AnimatePresence>
        {showOfflineModal && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md font-alinur" style={{ fontFamily: 'Alinur Tatsama' }}>
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl p-8 text-center space-y-6 border-2 border-rose-100"
            >
              <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-2">
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                >
                  <svg className="w-10 h-10 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m1.414 2.83L5.414 21M5.636 5.636a9 9 0 0112.728 0M12 12v.01" />
                  </svg>
                </motion.div>
              </div>
              <h3 className="text-xl font-black text-slate-800 leading-tight">
                আপনার ইন্টারনেট সংযোগ বিচ্ছিন্ন হয়েছে🥹
              </h3>
              <p className="text-sm font-bold text-slate-500 leading-relaxed">
                ইন্টারনেট চালু করে পুনরায় চালু করুন
              </p>
              <button 
                onClick={() => setShowOfflineModal(false)}
                className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-black text-lg shadow-xl shadow-emerald-600/20 active:scale-95 transition-all"
              >
                ওকে
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showOnlineToast && (
          <div className="fixed top-24 left-0 right-0 z-[1000] flex justify-center px-4 pointer-events-none font-alinur" style={{ fontFamily: 'Alinur Tatsama' }}>
            <motion.div 
              initial={{ opacity: 0, y: -50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -50 }}
              className="bg-emerald-600 text-white px-8 py-3 rounded-full shadow-2xl flex items-center gap-3 border border-emerald-400/30 backdrop-blur-xl"
            >
              <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span className="font-black text-sm">আপনার পেজ এখন লোড ও প্রস্তুত! (Your page loaded ready)</span>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {!isOnline && !showOfflineModal && (
          <motion.div 
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            className="fixed bottom-0 left-0 right-0 z-[900] bg-gradient-to-r from-rose-600 to-amber-600 text-white py-2 px-4 text-center font-alinur shadow-[0_-4px_20px_rgba(0,0,0,0.2)]"
            style={{ fontFamily: 'Alinur Tatsama' }}
          >
            <p className="text-xs sm:text-sm font-black flex items-center justify-center gap-2">
              <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
              সকল আপডেট তাৎক্ষণিক পেতে ইন্টারনেট সংযোগ চালু করুন
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {batchCropSrc && (
          <ImageCropper
            image={batchCropSrc}
            aspectRatio={1}
            onCropComplete={handleBatchCropComplete}
            onCancel={() => setBatchCropSrc(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
