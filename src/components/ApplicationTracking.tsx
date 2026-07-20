import React, { useState, useEffect } from "react";
import { collection, query, where, doc, setDoc } from "firebase/firestore";
import { db, StreamBuilder, uploadFileToImgBB } from "../lib/firebase";
import { Search, Upload, FileText, Download, CheckCircle, AlertCircle, X, Phone, ArrowRight, RefreshCw, Loader2, Info } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

const convertBengaliToEnglishDigits = (str: string | undefined | null): string => {
  if (str === undefined || str === null) return "";
  const banglaDigits = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
  return str.toString().replace(/[০-৯]/g, (match) => banglaDigits.indexOf(match).toString());
};

const toBengaliDigits = (numStr: string | number | undefined | null): string => {
  if (numStr === undefined || numStr === null) return "";
  const banglaDigits = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
  return numStr.toString().replace(/[0-9]/g, (match) => banglaDigits[parseInt(match, 10)]);
};

interface ApplicationTrackingProps {
  logoUrl?: string | null;
  setActiveTab: (tab: string) => void;
}

export default function ApplicationTracking({ logoUrl, setActiveTab }: ApplicationTrackingProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  
  // Search Form State
  const [formData, setFormData] = useState({
    applicantPhone: "",
    studentNameBn: "",
    studentNameEn: "",
    admissionClass: "শিশু শ্রেণী",
    bloodGroup: "A+",
  });

  // Query state for Firestore StreamBuilder
  const [searchQueryPhone, setSearchQueryPhone] = useState<string>("");
  const [showResultPopup, setShowResultPopup] = useState(false);

  // Banner query from global_config
  const bannerConfigQuery = query(collection(db, "global_config"));

  // Dropdowns
  const classes = ["শিশু শ্রেণী", "১ম শ্রেণী", "২য় শ্রেণী", "৩য় শ্রেণী", "৪র্থ শ্রেণী", "৫ম শ্রেণী", "৬ষ্ঠ শ্রেণী", "৭ম শ্রেণী", "৮ম শ্রেণী", "৯ম শ্রেণী"];
  const bloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

  // Handle Banner Upload to ImgBB
  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const url = await uploadFileToImgBB(file);
      const configRef = doc(db, "global_config", "tracking_banner_config");
      await setDoc(configRef, {
        isTrackingBannerUploaded: true,
        trackingBannerUrl: url
      }, { merge: true });
    } catch (error) {
      console.error("Tracking banner upload failed:", error);
      alert("ব্যানার আপলোড ব্যর্থ হয়েছে। আবার চেষ্টা করুন।");
    } finally {
      setIsUploading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    let finalValue = value;
    if (field === "applicantPhone") {
      finalValue = convertBengaliToEnglishDigits(value).slice(0, 11);
    }
    setFormData(prev => ({ ...prev, [field]: finalValue }));
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.applicantPhone.length !== 11) {
      alert("অনুগ্রহ করে সঠিক ১১ ডিজিটের মোবাইল নাম্বার দিন।");
      return;
    }
    setSearchQueryPhone(formData.applicantPhone);
    setIsSearchModalOpen(false);
    setShowResultPopup(true);
  };

  // Smooth scroll helper for Condition A
  const handleContactRedirect = () => {
    setShowResultPopup(false);
    setActiveTab("home");
    setTimeout(() => {
      const section = document.getElementById("official-contact-section");
      if (section) {
        section.scrollIntoView({ behavior: "smooth" });
      }
    }, 100);
  };

  // Redirect to admissions page for Condition B
  const handleReapplyRedirect = () => {
    setShowResultPopup(false);
    setActiveTab("admission");
  };

  return (
    <div className="w-full bg-slate-50 min-h-screen pb-20 font-alinur select-none" style={{ fontFamily: "'Alinur Tatsama', sans-serif" }}>
      {/* 1. Dynamic Banner StreamBuilder */}
      <StreamBuilder<any>
        stream={bannerConfigQuery}
        builder={(configs) => {
          const config = configs?.find(c => c.id === "tracking_banner_config") || {};
          const isUploaded = !!config.isTrackingBannerUploaded;
          const bannerUrl = config.trackingBannerUrl || "";

          return (
            <div className="relative w-full overflow-hidden bg-slate-200 border-b-2 border-emerald-500/10 min-h-[140px] flex items-center justify-center">
              {isUploaded && bannerUrl ? (
                <img 
                  src={bannerUrl} 
                  alt="আবেদন ট্র্যাকিং ব্যানার" 
                  className="w-full h-auto object-contain block max-h-[420px]" 
                  style={{ width: "100%", height: "auto" }}
                />
              ) : (
                <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                  <p className="text-emerald-800 font-bold text-lg md:text-xl mb-3">আবেদন ট্র্যাকিং ব্যানার এখনও আপলোড করা হয়নি</p>
                  <p className="text-xs text-slate-500 max-w-md">আপনার মাদ্রাসার আবেদন ট্র্যাকিং সেকশনের জন্য একটি আকর্ষণীয় ব্যানার আপলোড করুন।</p>
                </div>
              )}

              {/* One-Time Upload Option - Hides permanently when isTrackingBannerUploaded is true */}
              {!isUploaded && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-xs transition-opacity duration-300">
                  <label className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-6 py-3 rounded-2xl shadow-xl cursor-pointer flex items-center gap-2 transition-all border border-emerald-400 active:scale-95">
                    {isUploading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>আপলোড হচ্ছে...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-5 h-5" />
                        <span>ব্যানার আপলোড করুন</span>
                      </>
                    )}
                    <input type="file" accept="image/*" onChange={handleBannerUpload} className="hidden" disabled={isUploading} />
                  </label>
                </div>
              )}
            </div>
          );
        }}
      />

      {/* 2. Interactive Search Application Form Section */}
      <div className="max-w-4xl mx-auto px-4 mt-16 text-center">
        <div className="bg-white p-8 md:p-12 rounded-3xl shadow-xl border border-emerald-50/50 flex flex-col items-center justify-center max-w-2xl mx-auto">
          <p className="text-emerald-900 font-bold text-xl md:text-2xl mb-6">আপনার দাখিলকৃত ভর্তির আবেদন ট্র্যাক করুন</p>
          
          {/* Main Action Button with Beautiful Radar Animation */}
          <div className="relative group">
            {/* Pulsing radar effect */}
            <span className="absolute -inset-1.5 rounded-full bg-emerald-500/20 blur-sm opacity-75 group-hover:opacity-100 animate-ping"></span>
            
            <button
              onClick={() => setIsSearchModalOpen(true)}
              className="relative bg-gradient-to-r from-emerald-600 to-emerald-800 hover:from-emerald-500 hover:to-emerald-700 text-white font-bold text-lg md:text-xl px-10 py-5 rounded-full shadow-lg hover:shadow-2xl flex items-center justify-center gap-4 transition-all duration-300 transform hover:scale-105 active:scale-95 border border-emerald-400"
            >
              <FileText className="w-6 h-6 animate-bounce" />
              <span>আবেদন খুঁজুন</span>
              
              {/* Dynamic Rotating/Pulsing Search Animation Icon */}
              <div className="relative flex items-center justify-center w-8 h-8 rounded-full bg-emerald-900/30">
                <Search className="w-4 h-4 text-amber-400 animate-[spin_6s_linear_infinite]" />
                <span className="absolute inset-0 w-full h-full border border-amber-400/30 rounded-full animate-ping"></span>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* 3. Search Inputs Modal Dialog */}
      <AnimatePresence>
        {isSearchModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSearchModalOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />

            {/* Modal Body */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 25 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 25 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative bg-white w-full max-w-lg rounded-3xl p-6 md:p-8 shadow-2xl border border-emerald-100 overflow-hidden"
            >
              {/* Top Accent Bar */}
              <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-emerald-600 to-amber-500"></div>

              {/* Close Button */}
              <button
                onClick={() => setIsSearchModalOpen(false)}
                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-full transition-all"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-emerald-50 rounded-2xl">
                  <Search className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-emerald-950">আবেদন অনুসন্ধান ফরম</h3>
                  <p className="text-xs text-slate-500">আপনার দাখিলকৃত সঠিক তথ্যসমূহ ইনপুট দিন</p>
                </div>
              </div>

              <form onSubmit={handleSearchSubmit} className="space-y-4">
                {/* Applicant Phone Number */}
                <div>
                  <label className="block text-emerald-950 font-bold mb-1.5 text-sm">আবেদনকারীর মোবাইল নাম্বার *</label>
                  <div className="relative">
                    <input
                      type="tel"
                      required
                      maxLength={11}
                      value={formData.applicantPhone}
                      onChange={(e) => handleInputChange("applicantPhone", e.target.value)}
                      placeholder="01XXXXXXXXX"
                      className="w-full border border-slate-200 hover:border-emerald-300 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 rounded-xl px-4 py-3 focus:outline-none bg-white font-alinur text-slate-800 text-sm font-semibold transition-all"
                      style={{ fontFamily: "'Alinur Tatsama', sans-serif" }}
                    />
                    <div className="text-right mt-1">
                      <span className="text-xs text-slate-500 font-bold" style={{ fontFamily: "'Alinur Tatsama', sans-serif" }}>
                        {`${toBengaliDigits(11 - formData.applicantPhone.length)}টি বাকি`}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Student's Bengali Name */}
                <div>
                  <label className="block text-emerald-950 font-bold mb-1.5 text-sm">শিক্ষার্থীর বাংলা নাম *</label>
                  <input
                    type="text"
                    required
                    value={formData.studentNameBn}
                    onChange={(e) => handleInputChange("studentNameBn", e.target.value)}
                    placeholder="বাংলায় পূর্ণ নাম লিখুন"
                    className="w-full border border-slate-200 hover:border-emerald-300 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 rounded-xl px-4 py-3 focus:outline-none bg-white font-alinur text-slate-800 text-sm font-semibold transition-all"
                    style={{ fontFamily: "'Alinur Tatsama', sans-serif" }}
                  />
                </div>

                {/* Student's English Name */}
                <div>
                  <label className="block text-emerald-950 font-bold mb-1.5 text-sm">শিক্ষার্থীর ইংরেজি নাম *</label>
                  <input
                    type="text"
                    required
                    value={formData.studentNameEn}
                    onChange={(e) => handleInputChange("studentNameEn", e.target.value)}
                    placeholder="ইংরেজিতে পূর্ণ নাম লিখুন"
                    className="w-full border border-slate-200 hover:border-emerald-300 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 rounded-xl px-4 py-3 focus:outline-none bg-white font-alinur text-slate-800 text-sm font-semibold transition-all"
                    style={{ fontFamily: "'Alinur Tatsama', sans-serif" }}
                  />
                </div>

                {/* Admission Class */}
                <div>
                  <label className="block text-emerald-950 font-bold mb-1.5 text-sm">ভর্তি ইচ্ছুক শ্রেণী *</label>
                  <select
                    value={formData.admissionClass}
                    onChange={(e) => handleInputChange("admissionClass", e.target.value)}
                    className="w-full border border-slate-200 hover:border-emerald-300 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 rounded-xl px-4 py-3 focus:outline-none bg-white font-alinur text-slate-800 text-sm font-semibold transition-all cursor-pointer"
                    style={{ fontFamily: "'Alinur Tatsama', sans-serif" }}
                  >
                    {classes.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                {/* Blood Group */}
                <div>
                  <label className="block text-emerald-950 font-bold mb-1.5 text-sm">রক্তের গ্রুপ *</label>
                  <select
                    value={formData.bloodGroup}
                    onChange={(e) => handleInputChange("bloodGroup", e.target.value)}
                    className="w-full border border-slate-200 hover:border-emerald-300 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 rounded-xl px-4 py-3 focus:outline-none bg-white font-alinur text-slate-800 text-sm font-semibold transition-all cursor-pointer"
                    style={{ fontFamily: "'Alinur Tatsama', sans-serif" }}
                  >
                    {bloodGroups.map(bg => (
                      <option key={bg} value={bg}>{bg}</option>
                    ))}
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={formData.applicantPhone.length !== 11 || !formData.studentNameBn || !formData.studentNameEn}
                  className={`w-full py-3.5 mt-2 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
                    formData.applicantPhone.length === 11 && formData.studentNameBn && formData.studentNameEn
                      ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/20 active:scale-95"
                      : "bg-slate-200 text-slate-400 cursor-not-allowed"
                  }`}
                >
                  <Search className="w-4 h-4" />
                  <span>তথ্য অনুসন্ধান করুন</span>
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 4. Real-time Firestore StreamBuilder for Search Results & Conditional Status Popups */}
      {searchQueryPhone && (
        <StreamBuilder<any>
          stream={query(collection(db, "admissions"), where("applicantPhone", "==", searchQueryPhone))}
          builder={(admissionsList, loading, error) => {
            if (loading) {
              return (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs">
                  <div className="bg-white p-6 rounded-2xl flex flex-col items-center gap-3 shadow-2xl border border-emerald-50">
                    <Loader2 className="w-10 h-10 text-emerald-600 animate-spin" />
                    <p className="text-emerald-950 font-bold text-sm">সার্ভার থেকে ডেটা লোড হচ্ছে...</p>
                    <p className="text-xs text-amber-600 font-medium">"ধৈর্য ইমানের অঙ্গ"</p>
                  </div>
                </div>
              );
            }

            if (error) {
              return (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
                  <div className="bg-white max-w-md w-full rounded-2xl p-6 text-center shadow-xl">
                    <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
                    <p className="text-red-600 font-bold text-sm">ডেটা কানেকশন ত্রুটি। অনুগ্রহ করে আবার চেষ্টা করুন।</p>
                    <button 
                      onClick={() => setSearchQueryPhone("")}
                      className="mt-4 bg-slate-800 text-white px-5 py-2 rounded-lg font-bold text-xs"
                    >
                      পুনরায় চেষ্টা করুন
                    </button>
                  </div>
                </div>
              );
            }

            // Client-side exact filtering for robust matching (avoiding composite indexes errors)
            const matchedData = admissionsList.find((doc: any) => {
              return (
                doc.admissionClass === formData.admissionClass &&
                doc.studentNameBn.trim() === formData.studentNameBn.trim() &&
                doc.studentNameEn.trim().toLowerCase() === formData.studentNameEn.trim().toLowerCase() &&
                doc.bloodGroup === formData.bloodGroup
              );
            });

            const hasSearchResult = !!matchedData;

            // Define status templates
            const status = matchedData?.status || "pending"; // 'pending' | 'rejected' | 'approved' | 'accepted'

            const isPending = status === "pending" || status === "Pending";
            const isRejected = status === "rejected" || status === "Rejected" || status === "cancelled" || status === "Cancelled";
            const isApproved = status === "approved" || status === "accepted" || status === "Approved" || status === "Accepted";

            const downloadApplicationPDF = async () => {
              const element = document.getElementById("application-form-pdf-template-tracking");
              if (!element) return;
              
              try {
                const canvas = await html2canvas(element, {
                  scale: 3,
                  useCORS: true,
                  allowTaint: true,
                  backgroundColor: "#ffffff",
                  logging: false,
                });
                
                const imgData = canvas.toDataURL("image/png");
                const pdf = new jsPDF("p", "mm", "a4");
                const imgWidth = 210;
                const imgHeight = (canvas.height * imgWidth) / canvas.width;
                
                pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);
                pdf.save(`SNDM_Admission_Form_${matchedData?.applicantPhone || 'Tracking'}.pdf`);
              } catch (error) {
                console.error("Error generating PDF:", error);
                alert("পিডিএফ ডাউনলোড করতে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।");
              }
            };

            return (
              <>
                {/* Result Modal display logic */}
                <AnimatePresence>
                  {showResultPopup && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                      {/* Backdrop */}
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.6 }}
                        exit={{ opacity: 0 }}
                        onClick={() => {
                          setShowResultPopup(false);
                          setSearchQueryPhone("");
                        }}
                        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                      />

                      {/* Modal Body */}
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 30 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 30 }}
                        transition={{ type: "spring", damping: 25, stiffness: 280 }}
                        className="relative bg-white w-full max-w-lg rounded-3xl p-6 md:p-8 shadow-2xl border border-slate-100 overflow-hidden text-center flex flex-col items-center"
                        style={{ fontFamily: 'Alinur Tatsama' }}
                      >
                        {/* Top Accent Strip */}
                        <div className={`absolute top-0 left-0 right-0 h-2 bg-gradient-to-r ${
                          !hasSearchResult ? "from-red-500 to-rose-400" :
                          isPending ? "from-amber-500 to-amber-300" :
                          isRejected ? "from-red-600 to-red-400" :
                          "from-emerald-600 to-emerald-400"
                        }`}></div>

                        {/* Top close button */}
                        <button
                          onClick={() => {
                            setShowResultPopup(false);
                            setSearchQueryPhone("");
                          }}
                          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-full transition-all"
                        >
                          <X className="w-5 h-5" />
                        </button>

                        {/* NOT FOUND POPUP */}
                        {!hasSearchResult && (
                          <div className="py-4">
                            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4 animate-bounce" />
                            <h3 className="text-xl font-bold text-red-600 mb-2">কোনো আবেদন পাওয়া যায়নি</h3>
                            <p className="text-sm text-slate-600 leading-relaxed max-w-sm mb-6">
                              আপনার প্রদানকৃত তথ্যের সাথে সামঞ্জস্যপূর্ণ কোনো আবেদন খুঁজে পাওয়া যায়নি। অনুগ্রহ করে নাম, মোবাইল নাম্বার এবং রক্তের গ্রুপ সঠিক আছে কিনা পুনরায় চেক করুন।
                            </p>
                            <button
                              onClick={() => {
                                setShowResultPopup(false);
                                setIsSearchModalOpen(true);
                              }}
                              className="bg-slate-800 hover:bg-slate-700 text-white px-8 py-3 rounded-xl font-bold text-sm transition-all shadow-md active:scale-95"
                            >
                              তথ্য সংশোধন করুন
                            </button>
                          </div>
                        )}

                        {/* CONDITION A: PENDING STATUS POPUP */}
                        {hasSearchResult && isPending && (
                          <div className="py-4 w-full">
                            <AlertCircle className="w-16 h-16 text-amber-500 mx-auto mb-4 animate-pulse" />
                            
                            {/* Bullet-proof single-line message for specific guideline consistency */}
                            <p className="text-base md:text-lg font-bold text-amber-600 leading-relaxed mb-6">
                              আপনার আবেদনটি এখনো পেন্ডিং এ আছে অনুগ্রহ করে অপেক্ষা করুন বা কোন অভিযোগ থাকলে সরাসরি অফিসে যোগাযোগ করুন
                            </p>

                            <div className="flex flex-col gap-3 w-full">
                              {/* Download PDF button */}
                              <button
                                onClick={downloadApplicationPDF}
                                className="w-full bg-gradient-to-r from-emerald-600 to-emerald-800 hover:from-emerald-500 hover:to-emerald-700 text-white py-3 px-5 rounded-xl font-bold text-sm shadow-md flex items-center justify-center gap-2 transition-all active:scale-95 border border-emerald-400"
                              >
                                <Download className="w-4 h-4" />
                                <span>আবেদন ফরম PDF ডাউনলোড</span>
                              </button>

                              {/* Office Smooth scrolling contact redirection */}
                              <button
                                onClick={handleContactRedirect}
                                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 py-3 px-5 rounded-xl font-bold text-sm border border-slate-200 flex items-center justify-center gap-2 transition-all active:scale-95"
                              >
                                <Phone className="w-4 h-4 text-emerald-600" />
                                <span>যোগাযোগ করুন</span>
                              </button>
                            </div>
                          </div>
                        )}

                        {/* CONDITION B: REJECTED STATUS POPUP */}
                        {hasSearchResult && isRejected && (
                          <div className="py-4 w-full">
                            <AlertCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
                            <h3 className="text-xl font-bold text-red-600 mb-2">আবেদনটি বাতিল করা হয়েছে!</h3>
                            
                            {/* Rejection reason details */}
                            <div className="bg-red-50 p-4 rounded-2xl border border-red-100 text-center mb-6 max-w-sm mx-auto">
                              <p className="text-xs text-red-500 font-bold mb-1">বাতিলের সুনির্দিষ্ট কারণ:</p>
                              <p className="text-sm text-red-950 font-bold leading-tight">
                                {matchedData.rejectionReason || matchedData.reason || "প্রয়োজনীয় কাগজপত্র অসম্পূর্ণ অথবা অভিভাবকের তথ্যে গড়মিল থাকার কারণে আবেদনটি বাতিল হয়েছে।"}
                              </p>
                            </div>

                            <button
                              onClick={handleReapplyRedirect}
                              className="w-full bg-gradient-to-r from-red-600 to-red-800 hover:from-red-500 hover:to-red-700 text-white py-3.5 px-6 rounded-xl font-bold text-sm shadow-md flex items-center justify-center gap-2 transition-all active:scale-95"
                            >
                              <RefreshCw className="w-4 h-4" />
                              <span>পুনরায় আবেদন করুন</span>
                            </button>
                          </div>
                        )}

                        {/* CONDITION C: APPROVED / ACCEPTED STATUS POPUP */}
                        {hasSearchResult && isApproved && (
                          <div className="py-2 w-full text-left">
                            <div className="text-center">
                              <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-3" />
                              <h3 className="text-xl md:text-2xl font-black text-emerald-600 mb-4">আপনার আবেদনটি গ্রহন করা হয়েছে!</h3>
                            </div>

                            {/* Student Info Card */}
                            <div className="bg-emerald-50 p-5 rounded-2xl border border-emerald-100 space-y-2 mb-4">
                              <div className="flex justify-between items-center text-xs pb-1 border-b border-emerald-100">
                                <span className="text-emerald-700 font-bold">আবেদন আইডি / ফোন:</span>
                                <span className="text-emerald-950 font-bold">{matchedData.applicantPhone}</span>
                              </div>
                              <div className="flex justify-between items-center text-xs pb-1 border-b border-emerald-100">
                                <span className="text-emerald-700 font-bold">শিক্ষার্থীর নাম:</span>
                                <span className="text-emerald-950 font-bold">{matchedData.studentNameBn}</span>
                              </div>
                              <div className="flex justify-between items-center text-xs pb-1 border-b border-emerald-100">
                                <span className="text-emerald-700 font-bold">ভর্তি ইচ্ছুক শ্রেণী:</span>
                                <span className="text-emerald-950 font-bold">{matchedData.admissionClass}</span>
                              </div>
                              <div className="flex flex-col text-xs">
                                <span className="text-emerald-700 font-bold mb-0.5">বর্তমান ঠিকানা:</span>
                                <span className="text-emerald-950 font-semibold leading-tight">{matchedData.studentPresentAddress || "নতুন পল্লান পাড়া, টেকনাফ"}</span>
                              </div>
                            </div>

                            <button
                              onClick={downloadApplicationPDF}
                              className="w-full bg-gradient-to-r from-emerald-600 to-emerald-800 hover:from-emerald-500 hover:to-emerald-700 text-white py-3 px-5 rounded-xl font-bold text-sm shadow-md flex items-center justify-center gap-2 transition-all active:scale-95 border border-emerald-400 mb-4"
                            >
                              <Download className="w-4 h-4" />
                              <span>পিডিএফ ডাউনলোড</span>
                            </button>

                            {/* Specific guidelines block */}
                            <div className="bg-amber-50 p-4 rounded-xl border border-amber-200/50 flex gap-2.5 items-start">
                              <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                              <p className="text-xs text-amber-950 font-bold leading-normal">
                                দয়া করে আপনার আবেদন ফরমটি প্রিন্ট করে অফিসে যোগাযোগ করে আপনার একাউন্ট লগইন তথ্য সংগ্রহ করুন
                              </p>
                            </div>
                          </div>
                        )}
                      </motion.div>
                    </div>
                  )}
                </AnimatePresence>

                {/* Hidden PDF Template for capturing */}
                {matchedData && (
                  <div style={{ position: "absolute", left: "-9999px", top: "-9999px" }}>
                    <div id="application-form-pdf-template-tracking" className="w-[210mm] p-10 font-alinur" style={{ backgroundColor: '#ffffff', color: '#0f172a', borderColor: '#cbd5e1', borderWidth: '1px' }}>
                      {/* Header */}
                      <div className="flex flex-col items-center pb-6 mb-6" style={{ borderBottomWidth: '2px', borderColor: '#059669' }}>
                        {logoUrl ? (
                          <img src={logoUrl} alt="Logo" className="w-24 h-24 mb-4 object-contain" crossOrigin="anonymous" />
                        ) : (
                          <div className="w-24 h-24 mb-4 rounded-full flex items-center justify-center" style={{ backgroundColor: '#f1f5f9' }}>লোগো</div>
                        )}
                        <h1 className="text-3xl font-bold mb-2" style={{ color: '#064e3b' }}>সুফিয়া নূরীয়া দাখিল মাদ্রাসা</h1>
                        <p className="text-sm font-semibold" style={{ color: '#334155' }}>নতুন পল্লান পাড়া, ৪নং ওয়ার্ড, টেকনাফ, কক্সবাজার</p>
                        <h2 className="text-xl font-bold mt-4 px-6 py-2 rounded-full" style={{ backgroundColor: '#d1fae5', borderColor: '#6ee7b7', borderWidth: '1px' }}>অফিশিয়াল ভর্তি আবেদন ফরম</h2>
                      </div>

                      {/* Photo Box */}
                      <div className="absolute top-10 right-10 w-32 h-36 border-2 border-dashed flex items-center justify-center text-center p-2" style={{ borderColor: '#94a3b8' }}>
                        <span className="text-xs font-bold" style={{ color: '#64748b' }}>পাসপোর্ট সাইজ<br/>ছবি সংযুক্ত করুন</span>
                      </div>

                      {/* Data Tables */}
                      <div className="space-y-6 relative z-10 text-left">
                        {/* Primary info */}
                        <div className="rounded-lg overflow-hidden" style={{ borderWidth: '1px', borderColor: '#cbd5e1' }}>
                          <div className="px-4 py-2 font-bold" style={{ backgroundColor: '#f1f5f9', color: '#065f46', borderBottomWidth: '1px', borderColor: '#cbd5e1' }}>প্রাথমিক তথ্য</div>
                          <div className="grid grid-cols-2 p-4 gap-4 text-sm">
                            <div><span className="font-bold">আবেদনকারীর নাম্বার:</span> {matchedData.applicantPhone}</div>
                            <div><span className="font-bold">ভর্তি ইচ্ছুক শ্রেণী:</span> {matchedData.admissionClass}</div>
                          </div>
                        </div>

                        {/* Student Details */}
                        <div className="rounded-lg overflow-hidden" style={{ borderWidth: '1px', borderColor: '#cbd5e1' }}>
                          <div className="px-4 py-2 font-bold" style={{ backgroundColor: '#f1f5f9', color: '#065f46', borderBottomWidth: '1px', borderColor: '#cbd5e1' }}>শিক্ষার্থী তথ্য</div>
                          <div className="grid grid-cols-2 p-4 gap-x-4 gap-y-3 text-sm">
                            <div><span className="font-bold">বাংলা নাম:</span> {matchedData.studentNameBn}</div>
                            <div><span className="font-bold">ইংরেজি নাম:</span> {matchedData.studentNameEn}</div>
                            <div><span className="font-bold">জন্মসাল:</span> {matchedData.studentDob || "N/A"}</div>
                            <div><span className="font-bold">রক্তের গ্রুপ:</span> {matchedData.bloodGroup}</div>
                            <div><span className="font-bold">লিঙ্গ:</span> {matchedData.gender || "N/A"}</div>
                            <div><span className="font-bold">এনআইডি/নিবন্ধন:</span> {matchedData.studentNid || "N/A"}</div>
                            <div className="col-span-2"><span className="font-bold">বর্তমান ঠিকানা:</span> {matchedData.studentPresentAddress || "N/A"}, {matchedData.studentThana || "N/A"}, {matchedData.studentDistrict || "N/A"}</div>
                            <div className="col-span-2"><span className="font-bold">স্থায়ী ঠিকানা:</span> {matchedData.studentPermanentAddress || "N/A"}</div>
                          </div>
                        </div>

                        {/* Guardians Info */}
                        <div className="grid grid-cols-2 gap-4">
                          <div className="rounded-lg overflow-hidden" style={{ borderWidth: '1px', borderColor: '#cbd5e1' }}>
                            <div className="px-4 py-2 font-bold" style={{ backgroundColor: '#f1f5f9', color: '#065f46', borderBottomWidth: '1px', borderColor: '#cbd5e1' }}>অভিভাবক ১ (প্রথম)</div>
                            <div className="p-4 space-y-2 text-xs">
                              <div><span className="font-bold">নাম:</span> {matchedData.g1Name || "N/A"}</div>
                              <div><span className="font-bold">সম্পর্ক:</span> {matchedData.g1Relation === 'অন্যান্য' ? matchedData.g1RelationOther : matchedData.g1Relation || "N/A"}</div>
                              <div><span className="font-bold">নাম্বার:</span> {matchedData.g1Phone || "N/A"}</div>
                              <div><span className="font-bold">এনআইডি:</span> {matchedData.g1Nid || "N/A"}</div>
                              <div><span className="font-bold">ইমেইল:</span> {matchedData.g1Email || "N/A"}</div>
                              <div><span className="font-bold">ঠিকানা:</span> {matchedData.g1PresentAddress || "N/A"}</div>
                            </div>
                          </div>
                          
                          <div className="rounded-lg overflow-hidden" style={{ borderWidth: '1px', borderColor: '#cbd5e1' }}>
                            <div className="px-4 py-2 font-bold" style={{ backgroundColor: '#f1f5f9', color: '#065f46', borderBottomWidth: '1px', borderColor: '#cbd5e1' }}>অভিভাবক ২ (দ্বিতীয়)</div>
                            <div className="p-4 space-y-2 text-xs">
                              <div><span className="font-bold">নাম:</span> {matchedData.g2Name || "N/A"}</div>
                              <div><span className="font-bold">সম্পর্ক:</span> {matchedData.g2Relation === 'অন্যান্য' ? matchedData.g2RelationOther : matchedData.g2Relation || "N/A"}</div>
                              <div><span className="font-bold">নাম্বার:</span> {matchedData.g2Phone || "N/A"}</div>
                              <div><span className="font-bold">এনআইডি:</span> {matchedData.g2Nid || "N/A"}</div>
                              <div><span className="font-bold">ইমেইল:</span> {matchedData.g2Email || "N/A"}</div>
                              <div><span className="font-bold">ঠিকানা:</span> {matchedData.g2PresentAddress || "N/A"}</div>
                            </div>
                          </div>
                        </div>

                        {/* Extra school info (Conditional) */}
                        {["৬ষ্ঠ শ্রেণী", "৭ম শ্রেণী", "৮ম শ্রেণী", "৯ম শ্রেণী"].includes(matchedData.admissionClass) && (
                          <div className="rounded-lg overflow-hidden" style={{ borderWidth: '1px', borderColor: '#cbd5e1' }}>
                            <div className="px-4 py-2 font-bold" style={{ backgroundColor: '#f1f5f9', color: '#065f46', borderBottomWidth: '1px', borderColor: '#cbd5e1' }}>পূর্বের শিক্ষাপ্রতিষ্ঠানের তথ্য</div>
                            <div className="grid grid-cols-2 p-4 gap-x-4 gap-y-3 text-sm">
                              <div><span className="font-bold">প্রতিষ্ঠানের নাম:</span> {matchedData.prevInstitute || "N/A"}</div>
                              <div><span className="font-bold">রোল:</span> {matchedData.prevRoll || "N/A"}</div>
                              <div><span className="font-bold">শেষ জিপিএ:</span> {matchedData.prevGpa || "N/A"}</div>
                              <div><span className="font-bold">ছাড়পত্র:</span> {matchedData.prevClearance || "N/A"}</div>
                              <div className="col-span-2"><span className="font-bold">ত্যাগ করার কারণ:</span> {matchedData.prevLeaveReason || "N/A"}</div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Signatures */}
                      <div className="mt-24 pt-8 flex justify-between items-end relative z-10 text-left">
                        <div className="text-center w-48">
                          <div className="pt-2 font-bold text-sm" style={{ borderTopWidth: '2px', borderColor: '#1e293b' }}>শিক্ষার্থীর স্বাক্ষর</div>
                        </div>
                        <div className="text-center w-48">
                          <div className="pt-2 font-bold text-sm" style={{ borderTopWidth: '2px', borderColor: '#1e293b' }}>সুপার/প্রধান শিক্ষকের স্বাক্ষর</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            );
          }}
        />
      )}
    </div>
  );
}
