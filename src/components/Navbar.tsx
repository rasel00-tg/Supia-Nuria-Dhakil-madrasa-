import { useState, ChangeEvent, useEffect, useRef } from "react";
import { Menu, X, BookOpen, GraduationCap, Calendar, Search, FileText, Lock, Clock, Calendar as CalendarIcon, ChevronDown, ChevronUp, Users, Info, Building, Image, MessageSquare, Phone, Globe, LogOut } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { db, StreamBuilder } from "../lib/firebase";
import { collection, query, orderBy, limit } from "firebase/firestore";

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  user: any;
  onLogout: () => void;
  logoUrl?: string | null;
  isLogoUploaded?: boolean;
  logoUploading?: boolean;
  onLogoUpload?: (e: ChangeEvent<HTMLInputElement>) => void;
}

function SequentialScrollingNotice({ notices }: { notices: any[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [position, setPosition] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const requestRef = useRef<number | null>(null);
  const speed = 1.1; // Moderate, highly readable scrolling speed

  const safeCurrentIndex = notices.length > 0 ? currentIndex % notices.length : 0;
  const currentNoticeText = notices.length > 0 
    ? `${safeCurrentIndex + 1}. ${notices[safeCurrentIndex].text}` 
    : "সুফিয়া নূরীয়া দাখিল মাদ্রাসায় আপনাকে স্বাগতম।";

  useEffect(() => {
    const container = containerRef.current;
    const textElement = textRef.current;
    if (!container || !textElement) return;

    // Start position: right edge of the container
    let currentX = container.offsetWidth;
    setPosition(currentX);

    const animate = () => {
      if (!isPaused) {
        currentX -= speed;
        // If the current notice's last character has scrolled completely off-screen to the left
        if (currentX < -textElement.offsetWidth) {
          // Move to the next notice sequentially
          setCurrentIndex((prevIndex) => (prevIndex + 1) % notices.length);
          // Reset starting position to the right edge of the container
          currentX = container.offsetWidth;
        }
        setPosition(currentX);
      }
      requestRef.current = requestAnimationFrame(animate);
    };

    requestRef.current = requestAnimationFrame(animate);

    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [isPaused, currentIndex, notices]);

  // Reset position if container changes size
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        setPosition(containerRef.current.offsetWidth);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative w-full overflow-hidden h-full flex items-center cursor-pointer select-none"
      style={{ fontFamily: "'Noto Serif Bengali', serif !important" }}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={() => setIsPaused(true)}
      onTouchEnd={() => setIsPaused(false)}
    >
      <div
        ref={textRef}
        className="absolute whitespace-nowrap will-change-transform text-amber-200 text-xs sm:text-sm font-semibold tracking-wide"
        style={{ transform: `translateX(${position}px)` }}
      >
        {currentNoticeText}
      </div>
    </div>
  );
}

export default function Navbar({
  activeTab,
  setActiveTab,
  user,
  onLogout,
  logoUrl,
  isLogoUploaded,
  logoUploading,
  onLogoUpload,
}: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedMenu, setExpandedMenu] = useState<string | null>(null);
  const [showHeaderLogoutConfirm, setShowHeaderLogoutConfirm] = useState(false);

  const toggleExpand = (menuId: string) => {
    setExpandedMenu(expandedMenu === menuId ? null : menuId);
  };

  const menuCategories = [
    { 
      id: "home", 
      label: "হোম", 
      icon: BookOpen, 
      action: () => { setActiveTab("home"); setIsOpen(false); } 
    },
    { 
      id: "institute", 
      label: "ইনস্টিটিউট", 
      icon: Building, 
      submenus: [
        { label: "শিক্ষকবৃন্দ", action: () => { setActiveTab("teachers"); setIsOpen(false); } },
        { label: "সদস্যবৃন্দ", action: () => { setActiveTab("committee"); setIsOpen(false); } },
        { label: "সদস্য ফরম", action: () => { setActiveTab("sodosso_form"); setIsOpen(false); } },
        { label: "কর্মচারীবৃন্দ", action: () => { setActiveTab("staff"); setIsOpen(false); } },
        { label: "শিক্ষার্থীবৃন্দ", action: () => { setActiveTab("students"); setIsOpen(false); } }
      ] 
    },
    { 
      id: "personalities", 
      label: "ব্যক্তিবর্গ", 
      icon: Users, 
      submenus: [
        { label: "স্মরণীয় ব্যক্তিবর্গ", action: () => { setActiveTab("honored"); setIsOpen(false); } }
      ] 
    },
    { 
      id: "corner", 
      label: "কর্নার", 
      icon: Info, 
      submenus: [
        { label: "নোটিশ কর্নার", action: () => { setActiveTab("notice_corner"); setIsOpen(false); } },
        { label: "গেমিং কর্ণার", action: () => { setActiveTab("gaming_corner"); setIsOpen(false); } }
      ] 
    },
    { 
      id: "academic", 
      label: "একাডেমিক", 
      icon: GraduationCap, 
      submenus: [
        { label: "রুটিন", action: () => { setActiveTab("routine"); setIsOpen(false); } },
        { label: "ফলাফল অনুসন্ধান", action: () => { setActiveTab("result"); setIsOpen(false); } }
      ] 
    },
    { 
      id: "feedback", 
      label: "মতামত", 
      icon: MessageSquare, 
      submenus: [
        { label: "রিভিউ সেন্টার", action: () => { setActiveTab("review_center"); setIsOpen(false); } }
      ] 
    },
    { 
      id: "gallery", 
      label: "হিফজ বিভাগ", 
      icon: Image, 
      submenus: [
        { label: "হাফেজগন", action: () => { setActiveTab("hafizgon"); setIsOpen(false); } }
      ] 
    },
    { 
      id: "pages", 
      label: "আবেদন কর্ণার", 
      icon: FileText, 
      submenus: [
        { label: "অনলাইন আবেদন", action: () => { setActiveTab("admission"); setIsOpen(false); } },
        { label: "আবেদন ট্র্যাকিং", action: () => { setActiveTab("application_tracking"); setIsOpen(false); } }
      ] 
    },
    { 
      id: "government_websites", 
      label: "সরকারি গুরুত্বপূর্ণ ওয়েবসাইট", 
      icon: Globe, 
      action: () => { setActiveTab("government_websites"); setIsOpen(false); } 
    },
    { 
      id: "contact", 
      label: "যোগাযোগ", 
      icon: Phone, 
      submenus: [
        { label: "কন্টাক্ট ও ইমেইল", action: () => {
          setActiveTab("home");
          setIsOpen(false);
          setTimeout(() => {
            const section = document.getElementById("official-contact-section");
            if (section) {
              section.scrollIntoView({ behavior: "smooth" });
            }
          }, 100);
        } }
      ] 
    },
  ];

  useEffect(() => {
    const handleToggle = () => setIsOpen(prev => !prev);
    window.addEventListener('toggle-sidebar', handleToggle);
    return () => window.removeEventListener('toggle-sidebar', handleToggle);
  }, []);

  const getRoleTitle = () => {
    if (user?.role === "admin") {
      if (user?.adminRole === "assistant_admin") {
        return "(সহকারী এডমিন) এডমিন কন্ট্রোল প্যানেল";
      }
      return "(মাদার এডমিন) এডমিন কন্ট্রোল প্যানেল";
    }
    if (user?.role === "student") return "শিক্ষার্থী পোর্টাল ও ড্যাশবোর্ড";
    if (user?.role === "teacher") return "শিক্ষক পোর্টাল ও ড্যাশবোর্ড সিস্টেম";
    return "এডমিন ও ব্যবহারকারী পোর্টাল";
  };

  const getLastLoginFormatted = () => {
    let lastLoginTime = null;
    try {
      const savedUserStr = localStorage.getItem("sndm_user");
      if (savedUserStr) {
        const savedUser = JSON.parse(savedUserStr);
        if (savedUser && savedUser.lastLogin) {
          lastLoginTime = new Date(savedUser.lastLogin);
        }
      }
    } catch (e) {
      // ignore
    }
    if (!lastLoginTime && user?.lastLogin) {
      lastLoginTime = new Date(user.lastLogin);
    }
    if (!lastLoginTime) {
      lastLoginTime = new Date();
    }
    return lastLoginTime.toLocaleString('bn-BD', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <>
    {activeTab !== "login" && (activeTab !== "dashboard" || (user?.role !== "teacher" && user?.role !== "student")) && (
    <header id="main-header" className="sticky top-0 z-50 w-full bg-gradient-to-r from-emerald-950 via-emerald-900 to-amber-950 text-white shadow-xl border-b-4 border-amber-500 select-none font-alinur backdrop-blur-md">
      <div className="w-full px-3 py-3 flex items-center justify-between min-h-[60px] gap-3">
        
        {/* Madrasa Logo & Title for Admin/Teacher/Student/Login, or Scrolling Ticker for Guests */}
        {user?.role === "admin" || user?.role === "teacher" || user?.role === "student" || activeTab === "login" ? (
          <div className="flex-1 flex flex-wrap items-center gap-3">
            <img 
              src={logoUrl || "/photo/logo.png"} 
              alt="Logo" 
              className="h-14 w-14 sm:h-16 sm:w-16 object-contain rounded-full bg-white p-1 border-2 border-amber-400 shadow-md transition-all duration-300 hover:scale-105 shrink-0"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = "https://cdn-icons-png.flaticon.com/512/2913/2913520.png";
              }}
            />
            <div className="space-y-1">
              <h1 className="text-base sm:text-lg md:text-xl font-extrabold text-amber-400 font-serif leading-tight tracking-wide drop-shadow-xs">
                সুফিয়া নূরীয়া দাখিল মাদ্রাসা
              </h1>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs sm:text-sm font-extrabold text-white bg-emerald-900/90 border border-emerald-500/60 px-2.5 py-0.5 rounded-lg shadow-sm">
                  {getRoleTitle()}
                </span>
                <span className="text-[11px] sm:text-xs font-bold text-amber-300 bg-amber-950/80 border border-amber-500/60 px-2.5 py-0.5 rounded-lg shadow-sm flex items-center gap-1">
                  <Clock className="h-3 w-3 text-amber-400 stroke-[2.5]" />
                  <span>শেষ লগইন: {getLastLoginFormatted()}</span>
                </span>
              </div>
            </div>
          </div>
        ) : (
          /* Dynamic Running Scrolling Notice Ticker */
          <div className="flex-1 flex items-center bg-emerald-950/60 rounded-xl border border-emerald-700/40 overflow-hidden shadow-inner h-11">
            {/* Label Badge */}
            <div className="bg-amber-500 text-emerald-950 px-3 py-1 bg-gradient-to-r from-amber-500 to-amber-400 font-alinur font-bold text-xs sm:text-sm whitespace-nowrap rounded-l-xl flex items-center gap-1.5 shadow-md h-full select-none shrink-0">
              <span className="animate-bounce">📢</span>
              <span>চলমান নোটিশ:</span>
            </div>
            
            {/* Stream Notice Content */}
            <div className="flex-1 overflow-hidden px-3 text-xs sm:text-sm text-amber-200 font-medium h-full flex items-center min-w-0">
              <StreamBuilder<any>
                stream={query(collection(db, "running_notices"), orderBy("createdAt", "desc"), limit(2))}
                builder={(notices, loading, error) => {
                  if (loading) {
                    return <span className="text-emerald-300 text-xs animate-pulse">লোড হচ্ছে...</span>;
                  }
                  if (error) {
                    return <span className="text-red-400 text-xs">নোটিশ লোড করা যায়নি</span>;
                  }
                  if (!notices || notices.length === 0) {
                    return <span className="text-emerald-300/80">সুফিয়া নূরীয়া দাখিল মাদ্রাসায় আপনাকে স্বাগতম।</span>;
                  }
                  return (
                    <SequentialScrollingNotice notices={notices} />
                  );
                }}
              />
            </div>
          </div>
        )}

        {/* Hamburger Menu or Admin Logout Button (at the right corner) */}
        <div className="flex-shrink-0 flex items-center">
          {user?.role === "admin" ? (
            <button
              id="admin-header-logout-button"
              onClick={() => setShowHeaderLogoutConfirm(true)}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-700 hover:to-rose-800 text-white font-extrabold text-xs sm:text-sm shadow-md border border-red-300/40 flex items-center gap-1.5 transition-all duration-200 active:scale-95 cursor-pointer font-alinur"
              title="এডমিন প্যানেল থেকে লগআউট করুন"
            >
              <LogOut className="h-4 w-4 stroke-[2.5]" />
              <span>লগআউট</span>
            </button>
          ) : (
            <button
              id="fixed-hamburger-menu-toggle"
              onClick={() => setIsOpen(!isOpen)}
              className="p-2.5 rounded-lg bg-amber-500 text-emerald-950 hover:bg-amber-400 active:scale-95 transition-all duration-200 border border-amber-300 shadow-md flex items-center justify-center font-alinur"
              title="মেনু খুলুন"
            >
              {isOpen ? <X className="h-5 w-5 stroke-[2.5]" /> : <Menu className="h-5 w-5 stroke-[2.5]" />}
            </button>
          )}
        </div>
      </div>
    </header>
    )}

      {/* Admin Header Logout Confirmation Modal */}
      <AnimatePresence>
        {showHeaderLogoutConfirm && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 z-[100] font-alinur select-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 15 }}
              transition={{ duration: 0.2 }}
              className="bg-white border-2 border-red-500 rounded-3xl p-6 max-w-sm w-full text-center shadow-2xl space-y-4 text-gray-900"
            >
              <div className="flex justify-center">
                <div className="h-16 w-16 bg-red-100 rounded-full flex items-center justify-center text-red-600 shadow-inner">
                  <LogOut className="h-8 w-8 stroke-[2.5]" />
                </div>
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-black text-gray-900 font-alinur">
                  লগআউট নিশ্চিতকরণ
                </h3>
                <p className="text-xs text-gray-600 leading-relaxed font-bold">
                  আপনি কি সুফিয়া নূরীয়া দাখিল মাদ্রাসা এডমিন প্যানেল থেকে লগআউট করতে চান?
                </p>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowHeaderLogoutConfirm(false)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-xs py-3 rounded-2xl transition-all cursor-pointer text-center"
                >
                  বাতিল করুন
                </button>
                <button
                  onClick={() => {
                    setShowHeaderLogoutConfirm(false);
                    onLogout();
                  }}
                  className="flex-1 bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-700 hover:to-rose-800 text-white font-extrabold text-xs py-3 rounded-2xl transition-all cursor-pointer text-center shadow-lg shadow-red-500/20 active:scale-95"
                >
                  হ্যাঁ, লগআউট করুন
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modern Slide-over Sidebar Drawer */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black z-40"
            />

            {/* Sidebar drawer layout */}
            <motion.div
              initial={{ x: "100%", opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: "100%", opacity: 0 }}
              transition={{ type: "spring", damping: 22, stiffness: 250, mass: 0.8 }}
              className="fixed right-0 top-0 bottom-0 w-80 max-w-[85vw] bg-emerald-950 text-white shadow-[0_0_30px_rgba(0,0,0,0.3)] z-50 flex flex-col justify-between border-l-[3px] border-amber-500/80 backdrop-blur-md font-alinur"
            >
              {/* Drawer Header */}
              <div className="p-6 border-b border-emerald-800/80 bg-emerald-900/60 flex items-center justify-between font-alinur">
                <div className="flex items-center space-x-2">
                  <BookOpen className="h-5 w-5 text-amber-400" />
                  <span className="font-alinur font-bold text-amber-400 text-lg tracking-wide">মূল নেভিগেশন মেনু</span>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-full hover:bg-emerald-800 text-emerald-100 hover:text-white transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Navigation list */}
              <div className="flex-1 overflow-y-auto py-6 px-4 space-y-2.5 hide-scrollbar overscroll-y-contain font-alinur">
                {menuCategories.map((item) => {
                  const Icon = item.icon;
                  const isExpanded = expandedMenu === item.id;
                  
                  if (!item.submenus || item.submenus.length === 0) {
                    return (
                      <button
                        key={item.id}
                        id={`drawer-nav-${item.id}`}
                        onClick={item.action ? item.action : undefined}
                        className="group flex items-center justify-between w-full px-4 py-3.5 rounded-xl text-base font-bold tracking-wide transition-all duration-300 text-emerald-100 hover:bg-emerald-800/80 hover:text-white hover:shadow-[0_0_12px_rgba(52,211,153,0.25)] font-alinur"
                      >
                        <div className="flex items-center space-x-3">
                          <Icon className="h-5 w-5 shrink-0 group-hover:text-amber-400 transition-colors duration-300" />
                          <span>{item.label}</span>
                        </div>
                      </button>
                    );
                  }

                  return (
                    <div key={item.id} className="flex flex-col space-y-1 font-alinur">
                      <button
                        id={`drawer-nav-${item.id}`}
                        onClick={() => toggleExpand(item.id)}
                        className={`group flex items-center justify-between w-full px-4 py-3.5 rounded-xl text-base font-bold tracking-wide transition-all duration-300 font-alinur ${isExpanded ? "bg-emerald-800/90 text-white shadow-[0_0_15px_rgba(52,211,153,0.15)]" : "text-emerald-100 hover:bg-emerald-800/80 hover:text-white hover:shadow-[0_0_12px_rgba(52,211,153,0.25)]"}`}
                      >
                        <div className="flex items-center space-x-3">
                          <Icon className="h-5 w-5 shrink-0 group-hover:text-amber-400 transition-colors duration-300" />
                          <span>{item.label}</span>
                        </div>
                        {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                      </button>
                      
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0, y: -5, scale: 0.98 }}
                            animate={{ height: "auto", opacity: 1, y: 0, scale: 1 }}
                            exit={{ height: 0, opacity: 0, y: -5, scale: 0.98 }}
                            transition={{ type: "spring", damping: 20, stiffness: 220 }}
                            className="overflow-hidden"
                          >
                            <div className="pl-11 pr-4 py-2 space-y-1 bg-emerald-900/40 rounded-xl mt-2 border-l border-emerald-700/50 shadow-inner ml-6 font-alinur">
                              {item.submenus.map((submenu, idx) => (
                                <button
                                  key={idx}
                                  onClick={submenu.action}
                                  className="w-full text-left py-2 px-3 rounded-lg text-sm font-bold tracking-wide text-emerald-200 hover:bg-emerald-800 hover:text-amber-300 transition-all duration-300 hover:pl-4 font-alinur"
                                >
                                  {submenu.label}
                                </button>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}

                {/* One-Time Logo Upload Lifecycle option, visible only when isLogoUploaded is false */}
                {!isLogoUploaded && (
                  <div className="mx-4 p-4 mt-4 bg-emerald-900/50 border border-amber-500/30 rounded-xl font-alinur text-center space-y-2">
                    <p className="text-xs font-bold text-amber-400">মাদ্রাসার অফিসিয়াল লোগো আপলোড করুন</p>
                    <p className="text-[10px] text-emerald-200 leading-tight">লোগোটি একবার আপলোড করলে এই অপশনটি চিরতরে লক হয়ে যাবে।</p>
                    <input
                      type="file"
                      accept="image/*"
                      id="menu-logo-upload"
                      className="hidden"
                      onChange={onLogoUpload}
                      disabled={logoUploading}
                    />
                    <label
                      htmlFor="menu-logo-upload"
                      className={`inline-flex items-center gap-1.5 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-emerald-950 text-xs font-bold py-1.5 px-3 rounded-lg cursor-pointer transition-all active:scale-95 shadow ${logoUploading ? "opacity-50" : ""}`}
                    >
                      <Image className="w-4 h-4" />
                      <span>{logoUploading ? "আপলোড হচ্ছে..." : "লোগো নির্বাচন করুন"}</span>
                    </label>
                  </div>
                )}

                {/* Login or Dashboard details */}
                <div className="pt-6 mt-6 border-t border-emerald-800/60 space-y-2 font-alinur">
                  {user ? (
                    <>
                      <button
                        id="drawer-nav-dashboard"
                        onClick={() => {
                          setActiveTab("dashboard");
                          setIsOpen(false);
                        }}
                        className={`flex items-center space-x-3 w-full px-4 py-3.5 rounded-xl text-base font-bold tracking-wide transition-all duration-200 font-alinur ${
                          activeTab === "dashboard"
                            ? "bg-amber-500 text-emerald-950 shadow-md"
                            : "bg-emerald-900/60 text-amber-400 hover:bg-emerald-900"
                        }`}
                      >
                        <Lock className="h-5 w-5 shrink-0" />
                        <span>ড্যাশবোর্ড ({user.role === "admin" ? "এডমিন" : user.role === "teacher" ? "শিক্ষক" : "শিক্ষার্থী"})</span>
                      </button>
                      <button
                        id="drawer-nav-logout"
                        onClick={() => {
                          onLogout();
                          setIsOpen(false);
                        }}
                        className="flex items-center justify-center w-full px-4 py-3 rounded-xl text-sm bg-red-700 hover:bg-red-800 text-white font-bold shadow-sm transition-colors mt-2 font-alinur tracking-wide"
                      >
                        লগআউট করুন
                      </button>
                    </>
                  ) : (
                    <button
                      id="drawer-nav-login"
                      onClick={() => {
                        setActiveTab("login");
                        setIsOpen(false);
                      }}
                      className="flex items-center space-x-3 w-full px-4 py-3.5 rounded-xl text-base font-bold bg-emerald-900 text-amber-400 hover:bg-emerald-850 shadow-sm transition-colors font-alinur tracking-wide"
                    >
                      <Lock className="h-5 w-5 shrink-0" />
                      <span>লগইন সিস্টেম</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Drawer Footer */}
              <div className="p-6 border-t border-emerald-900 bg-emerald-950 text-center space-y-1 font-alinur">
                <p className="text-[10px] text-emerald-300/60 font-mono tracking-wider">
                  সুফিয়া নূরিয়া দাখিল মাদ্রাসা
                </p>
                <p className="text-[9px] text-emerald-400/40">
                  সর্বস্বত্ব সংরক্ষিত © {new Date().getFullYear()}
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
