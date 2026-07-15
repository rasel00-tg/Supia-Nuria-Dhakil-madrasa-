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
import { seedDatabaseIfEmpty } from "./lib/dbSeeder";
import { GraduationCap, BookOpen, Clock, Heart, Award } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { db, StreamBuilder, uploadFileToImgBB } from "./lib/firebase";
import { doc, onSnapshot, collection, query, setDoc } from "firebase/firestore";
import { Upload } from "lucide-react";

const settingsCollectionQuery = query(collection(db, "settings"));
const FooterStreamBuilder = StreamBuilder as any;

export default function App() {
  const [activeTab, setActiveTab] = useState<string>("home");
  const [user, setUser] = useState<any | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [selectedCommitteeMember, setSelectedCommitteeMember] = useState<any | null>(null);
  const [prevCommitteeTab, setPrevCommitteeTab] = useState<string>("home");

  const [jdcUploading, setJdcUploading] = useState<boolean>(false);
  const [imranUploading, setImranUploading] = useState<boolean>(false);

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

    // Subscribe to dynamic website settings (like logo)
    const unsubSettings = onSnapshot(doc(db, "settings", "website"), (docSnap) => {
      if (docSnap.exists()) {
        setLogoUrl(docSnap.data().logoUrl || null);
      }
    });

    return () => {
      unsubSettings();
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

  // Back button navigation control for "teachers", "sodosso_form", "staff", "committee", "notice_corner" and "committee_member_detail" tabs
  // Emulates PopScope/WillPopScope in a React SPA.
  // When activeTab changes, we push a state into history.
  // When the user presses the hardware/software back button, we intercept it.
  useEffect(() => {
    if (activeTab === "teachers" || activeTab === "sodosso_form" || activeTab === "staff" || activeTab === "committee" || activeTab === "committee_member_detail" || activeTab === "notice_corner" || activeTab === "routine") {
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

      {/* Sticky Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        user={user}
        onLogout={handleLogout}
        logoUrl={logoUrl}
      />

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
            {activeTab === "admission" && <AdmissionSection />}
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
            {activeTab === "login" && (
              <LoginSection onLoginSuccess={handleLoginSuccess} />
            )}
            {activeTab === "dashboard" && user && (
              <DashboardSection user={user} />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Sticky Bottom/Footer Section */}
      {activeTab !== "teachers" && activeTab !== "committee" && activeTab !== "committee_member_detail" && activeTab !== "dashboard" && activeTab !== "sodosso_form" && activeTab !== "staff" && activeTab !== "students" && activeTab !== "honored" && activeTab !== "routine" && user?.role !== "admin" && (
        <FooterStreamBuilder
          stream={settingsCollectionQuery}
          builder={(settingsList) => {
            const footerSettings = settingsList.find(s => s.id === "footer") || {};
            const jdcLogoUrl = footerSettings.jdcLogoUrl || "";
            const isJdcLogoUploaded = footerSettings.isJdcLogoUploaded || false;
            const imranImageUrl = footerSettings.imranImageUrl || "";
            const isImranUploaded = footerSettings.isImranUploaded || false;

            return (
              <footer id="main-footer" className="bg-gradient-to-b from-emerald-950 via-emerald-900 to-emerald-950 text-white border-t-4 border-amber-500 py-3 px-4 sm:px-6 lg:px-8 mt-4 print:hidden font-alinur relative overflow-hidden leading-[1.1]">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#047857_1px,transparent_1px),linear-gradient(to_bottom,#047857_1px,transparent_1px)] bg-[size:3rem_3rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-5 pointer-events-none"></div>

                <div className="max-w-7xl mx-auto relative z-10">
                  {/* Branding Hub (Propeller Center) */}
                  <div className="flex flex-col items-center text-center space-y-1 mb-3">
                    <div className="relative">
                      <div className="absolute inset-0 bg-amber-500/20 blur-xl rounded-full animate-pulse"></div>
                      {logoUrl ? (
                        <img src={logoUrl} alt="Logo" className="h-10 w-10 object-contain rounded-full relative z-10" />
                      ) : (
                        <img 
                          src="/photo/logo.png" 
                          alt="Logo" 
                          className="h-10 w-10 object-contain rounded-full relative z-10"
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = "https://cdn-icons-png.flaticon.com/512/2913/2913520.png";
                          }}
                        />
                      )}
                    </div>
                    <h3 className="font-extrabold text-lg sm:text-xl text-amber-400 tracking-wide leading-none">
                      সুফিয়া নূরীয়া দাখিল মাদ্রাসা
                    </h3>
                    <p className="text-[10px] sm:text-[11px] text-emerald-100 max-w-2xl mx-auto leading-tight opacity-90 font-bornomala">
                      <span className="font-bengali">১৯৭৫</span> সালে প্রতিষ্ঠিত পল্লান পাড়ার ঐতিহ্যবাহী দ্বীনি বিদ্যাপীঠ। কুরআন-সুন্নাহর আলোকে আদর্শ সুনাগরিক গড়ে তোলাই আমাদের অঙ্গীকার।
                    </p>
                  </div>

                  {/* Balanced Propeller Blades Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-start">
                    {/* Left Blade: Important Links */}
                    <div className="space-y-1 md:text-left text-center">
                      <h4 className="text-[12px] font-bold text-amber-400 border-b border-emerald-800/50 pb-0.5 inline-block md:block leading-none">
                        গুরুত্বপূর্ণ লিংকসমূহ
                      </h4>
                      <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-[10px]">
                        {[
                          { label: "স্মরনীয় ব্যাক্তিত্ব", tab: "honored" },
                          { label: "শিক্ষকবৃন্দ", tab: "teachers" },
                          { label: "হোমপেজ", tab: "home" },
                          { label: "অনলাইন ভর্তি", tab: "admission" },
                          { label: "ক্লাস রুটিন", tab: "routine" },
                          { label: "ফলাফল খুজুন", tab: "result" }
                        ].map((link) => (
                          <button
                            key={link.label}
                            onClick={() => {
                              setActiveTab(link.tab);
                              window.scrollTo({ top: 0, behavior: "smooth" });
                            }}
                            className="text-left text-emerald-100 hover:text-amber-300 transition-colors duration-200 flex items-center gap-1 cursor-pointer font-medium leading-none"
                          >
                            <span className="text-amber-500/60 text-[8px]">✦</span>
                            <span>{link.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Middle Blade: Credits & JDC Logo */}
                    <div className="text-center border-x-0 md:border-x border-emerald-800/30 px-1">
                      <h4 className="text-[12px] font-bold text-amber-400 border-b border-emerald-800/50 pb-0.5 inline-block md:block leading-none mb-1">
                        সহযোগিতা ও শুভেচ্ছান্তে
                      </h4>
                      <div className="text-[10px] text-emerald-100 flex flex-col items-center leading-none">
                        <p className="mb-0">
                          ডেভেলপমেন্ট ও কারিগরি আপডেট সহায়তায় -রাশেদুল করিম (সাবেক শিক্ষার্থী JDC-18)
                        </p>
                        <div className="flex items-center justify-center gap-1">
                          <p className="mb-0">
                            শুভেচ্ছান্তে - JDC-18 ব্যাচের সকল শিক্ষার্থীবৃন্দ
                          </p>
                          {isJdcLogoUploaded && jdcLogoUrl && (
                            <img 
                              src={jdcLogoUrl} 
                              alt="JDC-18 Logo" 
                              className="w-16 h-16 object-contain" 
                              style={{ imageRendering: '-webkit-optimize-contrast' }}
                            />
                          )}
                        </div>

                        {!isJdcLogoUploaded && (
                          <div className="pt-0.5">
                            <input type="file" accept="image/*" className="hidden" id="footer-jdc-logo" onChange={handleJdcLogoUpload} disabled={jdcUploading} />
                            <label htmlFor="footer-jdc-logo" className={`inline-flex items-center gap-1 bg-emerald-900/50 hover:bg-emerald-800 text-amber-300 text-[8px] font-bold py-0.5 px-1.5 rounded-md border border-amber-500/20 cursor-pointer transition-all ${jdcUploading ? "opacity-50" : ""}`}>
                              <Upload className="w-2.5 h-2.5" />
                              <span>{jdcUploading ? "..." : "লোগো"}</span>
                            </label>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right Blade: Remembrance */}
                    <div className="space-y-1 md:text-right text-center">
                      <div className="space-y-1 text-[10px] text-emerald-100">
                        <div className="flex flex-col md:flex-row items-center md:justify-end gap-1.5">
                          <div className="space-y-0">
                            <p className="font-bold text-amber-300 text-[10px] leading-tight">স্বরনে -হাফেজ মোহাম্মদ ইমরান</p>
                            <p className="text-[9px] text-emerald-200 leading-tight italic">আমাদের প্রিয় বন্ধুকে আল্লাহ জান্নাতুল ফেরদৌস দান করুক।</p>
                          </div>
                          {isImranUploaded && imranImageUrl && (
                            <img src={imranImageUrl} alt="হাফেজ ইমরান" className="w-8 h-8 object-contain" />
                          )}
                        </div>

                        {!isImranUploaded && (
                          <div className="pt-0.5">
                            <input type="file" accept="image/*" className="hidden" id="footer-imran-image" onChange={handleImranImageUpload} disabled={imranUploading} />
                            <label htmlFor="footer-imran-image" className={`inline-flex items-center gap-1 bg-emerald-900/50 hover:bg-emerald-800 text-amber-300 text-[8px] font-bold py-0.5 px-1.5 rounded-md border border-amber-500/20 cursor-pointer transition-all ${imranUploading ? "opacity-50" : ""}`}>
                              <Upload className="w-2.5 h-2.5" />
                              <span>{imranUploading ? "..." : "ছবি"}</span>
                            </label>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Copyright Footer (Centered Propeller Base) */}
                  <div className="w-full border-t border-emerald-900/40 mt-3 pt-2 flex flex-col items-center text-center space-y-0.5 text-[10px] text-emerald-400/80 leading-tight">
                    <p>©️সুফিয়া নূরীয়া দাখিল মাদ্রাসা সর্বস্ব সুরক্ষিত</p>
                    <p className="font-semibold text-amber-500/60 uppercase tracking-tight">ভার্সন 2.1</p>
                  </div>
                </div>
              </footer>
            );
          }}
        />
      )}
    </div>
  );
}
