import { useState, ChangeEvent, useEffect } from "react";
import { Menu, X, BookOpen, GraduationCap, Calendar, Search, FileText, Lock, Clock, Calendar as CalendarIcon, ChevronDown, ChevronUp, Users, Info, Building, Image, MessageSquare, Phone, Globe } from "lucide-react";
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

  return (
    <>
    {activeTab !== "login" && (activeTab !== "dashboard" || user?.role !== "teacher") && (
    <header id="main-header" className="sticky top-0 z-50 w-full bg-emerald-850 text-white shadow-md border-b-4 border-amber-500 select-none font-alinur">
      <div className="w-full px-2 py-3 flex items-center justify-between min-h-[56px] gap-3">
        
        {/* Madrasa Logo & Title for Admin/Teacher/Login, or Scrolling Ticker for Guests/Students */}
        {user?.role === "admin" || user?.role === "teacher" || activeTab === "login" ? (
          <div className="flex-1 flex items-center gap-3">
            <img 
              src={logoUrl || "/photo/logo.png"} 
              alt="Logo" 
              className="h-16 w-16 sm:h-20 sm:w-20 object-contain rounded-full bg-white p-1 border-2 border-amber-400 shadow-md transition-all duration-300 hover:scale-105"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = "https://cdn-icons-png.flaticon.com/512/2913/2913520.png";
              }}
            />
            <div>
              <h1 className="text-sm sm:text-base font-bold text-amber-400 font-serif leading-none">সুফিয়া নূরিয়া দাখিল মাদ্রাসা</h1>
              <p className="text-[10px] text-emerald-100 font-sans tracking-wide mt-1">
                {user?.role === "admin" ? "এডমিন ম্যানেজমেন্ট ড্যাশবোর্ড কন্ট্রোল প্যানেল" : "শিক্ষক পোর্টাল ও ড্যাশবোর্ড সিস্টেম"}
              </p>
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
                  // Join notices text
                  const noticeTexts = notices.map((n, i) => `${i + 1}. ${n.text}`).join("    ||    ");
                  return (
                    <marquee
                      behavior="scroll"
                      direction="left"
                      scrollamount="4"
                      className="w-full whitespace-nowrap"
                      onMouseOver={(e) => (e.currentTarget as any).stop()}
                      onMouseOut={(e) => (e.currentTarget as any).start()}
                    >
                      {noticeTexts}
                    </marquee>
                  );
                }}
              />
            </div>
          </div>
        )}

        {/* Hamburger Menu Fixed Trigger (at the right corner) */}
        <div className="flex-shrink-0 flex items-center">
          <button
            id="fixed-hamburger-menu-toggle"
            onClick={() => setIsOpen(!isOpen)}
            className="p-2.5 rounded-lg bg-amber-500 text-emerald-950 hover:bg-amber-400 active:scale-95 transition-all duration-200 border border-amber-300 shadow-md flex items-center justify-center font-alinur"
            title="মেনু খুলুন"
          >
            {isOpen ? <X className="h-5 w-5 stroke-[2.5]" /> : <Menu className="h-5 w-5 stroke-[2.5]" />}
          </button>
        </div>
      </div>
    </header>
    )}

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
