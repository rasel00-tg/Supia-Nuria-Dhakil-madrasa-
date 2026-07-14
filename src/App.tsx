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

  // Back button navigation control for "sodosso_form", "staff", "committee" and "committee_member_detail" tabs
  // Emulates PopScope/WillPopScope in a React SPA.
  // When activeTab changes, we push a state into history.
  // When the user presses the hardware/software back button, we intercept it.
  useEffect(() => {
    if (activeTab === "sodosso_form" || activeTab === "staff" || activeTab === "committee" || activeTab === "committee_member_detail") {
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
      {activeTab !== "committee" && activeTab !== "committee_member_detail" && activeTab !== "dashboard" && activeTab !== "sodosso_form" && activeTab !== "staff" && activeTab !== "students" && activeTab !== "honored" && user?.role !== "admin" && (
        <FooterStreamBuilder
          stream={settingsCollectionQuery}
          builder={(settingsList) => {
            const footerSettings = settingsList.find(s => s.id === "footer") || {};
            const jdcLogoUrl = footerSettings.jdcLogoUrl || "";
            const isJdcLogoUploaded = footerSettings.isJdcLogoUploaded || false;
            const imranImageUrl = footerSettings.imranImageUrl || "";
            const isImranUploaded = footerSettings.isImranUploaded || false;

            return (
              <footer id="main-footer" className="bg-gradient-to-b from-emerald-950 via-emerald-900 to-emerald-950 text-white border-t-8 border-amber-500 py-16 px-4 sm:px-6 lg:px-8 mt-12 print:hidden font-alinur relative overflow-hidden">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#047857_1px,transparent_1px),linear-gradient(to_bottom,#047857_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-10 pointer-events-none"></div>

                <div className="max-w-7xl mx-auto relative z-10">
                  {/* Branding & Quote Zone */}
                  <div className="flex flex-col items-center text-center space-y-4 mb-12">
                    <div className="relative p-1 bg-gradient-to-tr from-amber-400 to-emerald-600 rounded-full shadow-lg">
                      {logoUrl ? (
                        <img src={logoUrl} alt="Logo" className="h-16 w-16 object-contain rounded-full bg-white p-0.5" />
                      ) : (
                        <img 
                          src="/photo/logo.png" 
                          alt="Logo" 
                          className="h-16 w-16 object-contain rounded-full bg-white p-0.5"
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = "https://cdn-icons-png.flaticon.com/512/2913/2913520.png";
                          }}
                        />
                      )}
                    </div>
                    <h3 className="font-extrabold text-2xl sm:text-3xl text-amber-400 tracking-wide">
                      সুফিয়া নূরীয়া দাখিল মাদ্রাসা
                    </h3>
                    <p className="text-sm sm:text-base text-emerald-100 max-w-4xl mx-auto leading-relaxed text-justify sm:text-center px-4 font-medium">
                      ১৯৭৫ সালে প্রতিষ্ঠিত আমাদের নতুন পল্লান পাড়ার অন্যতম প্রাচীন, ঐতিহ্যবাহী ও সুনামধন্য দ্বীনি শিক্ষাপ্রতিষ্ঠান। প্রতিষ্ঠালগ্ন থেকেই কুরআন-সুন্নাহর আলোকে নৈতিক, আদর্শবান, সুশিক্ষিত ও দক্ষ প্রজন্ম গড়ে তোলার লক্ষ্যে আমরা নিরলসভাবে কাজ করে যাচ্ছি। দ্বীনি শিক্ষার পাশাপাশি উন্নত চরিত্র, মানবিক মূল্যবোধ এবং দেশপ্রেমে উদ্বুদ্ধ আদর্শ সুনাগরিক তৈরি করাই আমাদের প্রধান লক্ষ্য ও অঙ্গীকার।
                    </p>
                  </div>

                  {/* Elegant divider */}
                  <div className="h-[1px] bg-gradient-to-r from-transparent via-amber-500/30 to-transparent my-10" />

                  {/* Columns Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-12 sm:gap-16">
                    {/* Col 1: Important Links */}
                    <div className="space-y-4">
                      <h4 className="text-lg font-bold text-amber-400 border-b border-emerald-800 pb-2">
                        গুরুত্বপূর্ণ লিংকসমূহ
                      </h4>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 text-sm">
                        {[
                          { label: "স্মরনীয় ব্যাক্তিত্ব", tab: "honored" },
                          { label: "শিক্ষকবৃন্দ", tab: "teachers" },
                          { label: "হোমপেজ", tab: "home" },
                          { label: "অনলাইন ভর্তি", tab: "admission" },
                          { label: "ক্লাস রুটিন", tab: "routine" },
                          { label: "ফলাফল খুজুন", tab: "result" },
                          { label: "লগইন সিস্টেম", tab: "login" }
                        ].map((link) => (
                          <button
                            key={link.label}
                            onClick={() => {
                              setActiveTab(link.tab);
                              window.scrollTo({ top: 0, behavior: "smooth" });
                            }}
                            className="text-left text-emerald-100 hover:text-amber-300 transition-colors duration-200 flex items-center gap-1.5 cursor-pointer font-medium hover:translate-x-1 transform transition-all"
                          >
                            <span className="text-amber-500/80">✦</span>
                            <span>{link.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Col 2: Credits & Batch Logo */}
                    <div className="space-y-4">
                      <h4 className="text-lg font-bold text-amber-400 border-b border-emerald-800 pb-2">
                        সহযোগিতা ও শুভেচ্ছান্তে
                      </h4>
                      <div className="space-y-3 text-sm text-emerald-100">
                        <p className="leading-relaxed">
                          <span className="font-bold text-amber-300">ডেভেলপমেন্ট ও কারিগরি আপডেট সহায়তায়:</span>
                          <br />
                          রাশেদুল করিম (সাবেক শিক্ষার্থী JDC-18 ব্যাচ)।
                        </p>
                        <div className="flex flex-wrap items-center gap-4">
                          <p className="leading-relaxed">
                            <span className="font-bold text-amber-300">শুভেচ্ছান্তে:</span>
                            <br />
                            JDC-18 ব্যাচ এর সকল শিক্ষার্থীবৃন্দ।
                          </p>

                          {/* Display Batch Logo if uploaded */}
                          {isJdcLogoUploaded && jdcLogoUrl && (
                            <div className="w-14 h-14 rounded-full border-2 border-amber-400 overflow-hidden bg-white p-0.5 shadow-md flex-shrink-0">
                              <img src={jdcLogoUrl} alt="JDC-18 Logo" className="w-full h-full object-contain rounded-full" />
                            </div>
                          )}
                        </div>

                        {/* One-Time Secure Upload Gateway for JDC-18 Logo */}
                        {!isJdcLogoUploaded && (
                          <div className="pt-2">
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              id="footer-jdc-logo"
                              onChange={handleJdcLogoUpload}
                              disabled={jdcUploading}
                            />
                            <label
                              htmlFor="footer-jdc-logo"
                              className={`inline-flex items-center gap-2 bg-emerald-900 hover:bg-emerald-850 text-amber-300 text-xs font-bold py-2 px-4 rounded-xl border border-amber-500/30 cursor-pointer shadow-md transition-all active:scale-95 ${
                                jdcUploading ? "opacity-50 cursor-not-allowed" : ""
                              }`}
                            >
                              <Upload className="w-4 h-4" />
                              <span>{jdcUploading ? "লোগো আপলোড হচ্ছে..." : "লোগো আপলোড করুন (One-Time)"}</span>
                            </label>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Col 3: Remembrance */}
                    <div className="space-y-4">
                      <h4 className="text-lg font-bold text-amber-400 border-b border-emerald-800 pb-2">
                        স্মরণ সভা ও স্মৃতিচারণ
                      </h4>
                      <div className="space-y-4 text-sm text-emerald-100">
                        <div className="flex items-center gap-4">
                          <div className="space-y-1">
                            <p className="font-bold text-amber-300 text-base">স্মরনে - হাফেজ মোহাম্মদ ইমরান</p>
                            <p className="text-xs text-emerald-200 leading-relaxed italic">
                              "হে আল্লাহ, উনাকে জান্নাতুল ফেরদাউসের উচ্চ মাকাম দান করুন।"
                            </p>
                          </div>

                          {/* Imran Picture Frame if uploaded */}
                          {isImranUploaded && imranImageUrl && (
                            <div className="relative group flex-shrink-0">
                              <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-amber-400 to-emerald-600 blur-xs opacity-40"></div>
                              <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl border-2 border-amber-400 p-1 bg-white overflow-hidden shadow-xl">
                                <img src={imranImageUrl} alt="হাফেজ মোহাম্মদ ইমরান" className="w-full h-full object-cover rounded-xl" />
                              </div>
                            </div>
                          )}
                        </div>

                        {/* One-Time Secure Upload Gateway for Imran Memory Image */}
                        {!isImranUploaded && (
                          <div className="pt-2">
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              id="footer-imran-image"
                              onChange={handleImranImageUpload}
                              disabled={imranUploading}
                            />
                            <label
                              htmlFor="footer-imran-image"
                              className={`inline-flex items-center gap-2 bg-emerald-900 hover:bg-emerald-850 text-amber-300 text-xs font-bold py-2 px-4 rounded-xl border border-amber-500/30 cursor-pointer shadow-md transition-all active:scale-95 ${
                                imranUploading ? "opacity-50 cursor-not-allowed" : ""
                              }`}
                            >
                              <Upload className="w-4 h-4" />
                              <span>{imranUploading ? "ছবি আপলোড হচ্ছে..." : "ছবি আপলোড করুন (One-Time)"}</span>
                            </label>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Copyright and version control */}
                  <div className="w-full border-t border-emerald-900/60 mt-12 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-emerald-300">
                    <p>© ২০২৬ সুফিয়া নূরিয়া দাখিল মাদ্রাসা। সর্বস্বত্ব সংরক্ষিত।</p>
                    <p className="font-semibold text-amber-400">ভার্সন- 1.3</p>
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
