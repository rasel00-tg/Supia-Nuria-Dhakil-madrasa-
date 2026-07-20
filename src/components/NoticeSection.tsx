import React, { useEffect, useState } from "react";
import { collection, query, orderBy, onSnapshot, doc, setDoc } from "firebase/firestore";
import { db, uploadFileToImgBB } from "../lib/firebase";
import { Notice } from "../types";
import { motion, AnimatePresence } from "motion/react";
import { Calendar, X, AlertCircle } from "lucide-react";

// Helper function to convert English digits to Bengali digits
const toBengaliNumber = (numStr: string | number | undefined | null): string => {
  if (numStr === undefined || numStr === null) return "";
  const bengaliDigits = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
  return numStr.toString().replace(/\d/g, (digit) => bengaliDigits[parseInt(digit)]);
};

// Bengali months mapping
const bengaliMonths = [
  "জানুয়ারি", "ফেব্রুয়ারি", "মার্চ", "এপ্রিল", "মে", "জুন",
  "জুলাই", "আগস্ট", "সেপ্টেম্বর", "অক্টোবর", "নভেম্বর", "ডিসেম্বর"
];

// Extractor helper for Bengali date parts
const getBengaliDateParts = (date: Date) => {
  const day = date.getDate();
  const monthIndex = date.getMonth();
  const year = date.getFullYear();
  
  return {
    dayStr: toBengaliNumber(day),
    monthStr: bengaliMonths[monthIndex],
    yearStr: toBengaliNumber(year)
  };
};

// Formatter helper for Bengali date-time
const formatBengaliDateTime = (date: Date) => {
  const { dayStr, monthStr, yearStr } = getBengaliDateParts(date);
  let hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? "অপরাহ্ন" : "পূর্বাহ্ন";
  hours = hours % 12;
  hours = hours ? hours : 12;
  const minutesStr = toBengaliNumber(minutes.toString().padStart(2, "0"));
  const hoursStr = toBengaliNumber(hours);
  
  return `${dayStr} ${monthStr} ${yearStr}, ${ampm} ${hoursStr}:${minutesStr} মি.`;
};

export default function NoticeSection() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);
  const [selectedNotice, setSelectedNotice] = useState<Notice | null>(null);
  const [bannerConfig, setBannerConfig] = useState<{ isNoticeBannerUploaded?: boolean; bannerUrl?: string } | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    setLoading(true);
    // Real-time notices query
    const noticesQuery = query(collection(db, "notices"), orderBy("timestamp", "desc"));
    const unsubscribeNotices = onSnapshot(
      noticesQuery,
      (snapshot) => {
        const items: Notice[] = [];
        snapshot.forEach((doc) => {
          items.push({ id: doc.id, ...doc.data() } as Notice);
        });
        setNotices(items);
        setLoading(false);
      },
      (err) => {
        console.error("Error fetching notices:", err);
        setError(err);
        setLoading(false);
      }
    );

    // Real-time notice banner configuration query/document subscription
    const configDocRef = doc(db, "settings", "notice_config");
    const unsubscribeConfig = onSnapshot(
      configDocRef,
      (docSnap) => {
        if (docSnap.exists()) {
          setBannerConfig(docSnap.data() as any);
        } else {
          setBannerConfig({ isNoticeBannerUploaded: false, bannerUrl: "" });
        }
      },
      (err) => {
        console.error("Error fetching notice banner config:", err);
      }
    );

    return () => {
      unsubscribeNotices();
      unsubscribeConfig();
    };
  }, []);

  return (
    <div id="notice-corner-container" className="py-8 bg-[#fcfcf9] min-h-screen font-alinur" style={{ fontFamily: '"Alinur Tatsama", "Hind Siliguri", "Anek Bangla", sans-serif' }}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        
        {/* Top Banner Section */}
        <div className="w-full relative mb-10 bg-emerald-50 rounded-3xl overflow-hidden shadow-md">
          {bannerConfig?.isNoticeBannerUploaded && bannerConfig?.bannerUrl ? (
            <div className="relative w-full h-[180px] sm:h-[240px] md:h-[280px]">
              <img
                src={bannerConfig.bannerUrl}
                alt="সুফিয়া নূরীয়া দাখিল মাদ্রাসা ব্যানার"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
          ) : (
            <div className="w-full h-[180px] sm:h-[240px] md:h-[280px] flex flex-col items-center justify-center bg-gradient-to-br from-emerald-850 to-[#0a1e3a] relative p-6 text-center select-none rounded-3xl">
              {/* Fallback pattern / placeholder decoration */}
              <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]"></div>
              
              <Calendar className="h-12 w-12 text-amber-400 mb-3 animate-pulse relative z-10" />
              <span className="text-white text-lg font-bold tracking-wide relative z-10 font-alinur" style={{ fontFamily: '"Alinur Tatsama", sans-serif' }}>
                সুফিয়া নূরীয়া দাখিল মাদ্রাসা নোটিশবোর্ড
              </span>
              <span className="text-emerald-200 text-xs mt-1 relative z-10 font-alinur" style={{ fontFamily: '"Alinur Tatsama", sans-serif' }}>
                ব্যানার ইমেজ সেট করার জন্য নিচের গোপন গেটওয়েটি ব্যবহার করুন
              </span>

              {/* Discreet Secret Upload Gateway */}
              <div className="absolute bottom-4 right-4 z-20">
                <label className="cursor-pointer bg-white/10 hover:bg-white/20 hover:scale-105 active:scale-95 text-white/80 hover:text-white px-3.5 py-1.5 rounded-xl text-xs font-bold border border-white/20 transition-all flex items-center space-x-1.5 backdrop-blur-xs font-alinur" style={{ fontFamily: '"Alinur Tatsama", sans-serif' }}>
                  <span>{uploading ? "আপলোড হচ্ছে..." : "গোপন ব্যানার আপলোড"}</span>
                  <input
                    type="file"
                    accept="image/*"
                    disabled={uploading}
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      try {
                        setUploading(true);
                        const url = await uploadFileToImgBB(file);
                        const configDocRef = doc(db, "settings", "notice_config");
                        await setDoc(configDocRef, {
                          isNoticeBannerUploaded: true,
                          bannerUrl: url
                        }, { merge: true });
                      } catch (err) {
                        console.error("Upload error:", err);
                        alert("দুঃখিত, ব্যানার আপলোড করতে ব্যর্থ হয়েছে। দয়া করে পুনরায় চেষ্টা করুন।");
                      } finally {
                        setUploading(false);
                      }
                    }}
                  />
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Custom Description Title */}
        <div className="text-center mb-10 px-4">
          <p className="text-[11px] sm:text-xs text-emerald-950 font-medium leading-relaxed tracking-wide font-alinur" style={{ fontFamily: '"Alinur Tatsama", sans-serif' }}>
            সুফিয়া নূরীয়া দাখিল মাদ্রাসার গুরুত্বপূর্ণ নোটিশ, জরুরি ঘোষণা, একাডেমিক তথ্য এবং বিভিন্ন কার্যক্রমের সর্বশেষ আপডেট নিয়মিতভাবে এখানে প্রকাশ করা হয়।
          </p>
          <div className="h-[2px] w-20 bg-amber-500 mx-auto rounded-full mt-3"></div>
        </div>

        {/* Notices Render Logic */}
        {(() => {
          if (loading) {
            return (
              <div className="flex flex-col items-center justify-center py-16 space-y-4">
                <div className="animate-spin rounded-full h-10 w-10 border-4 border-emerald-800 border-t-transparent"></div>
                <p className="text-xs text-emerald-800 font-bold font-alinur" style={{ fontFamily: '"Alinur Tatsama", sans-serif' }}>নোটিশসমূহ লোড হচ্ছে, অনুগ্রহ করে অপেক্ষা করুন...</p>
              </div>
            );
          }

          if (error) {
            return (
              <div className="p-6 bg-red-50 border border-red-200 rounded-2xl flex items-center space-x-3 text-red-700">
                <AlertCircle className="h-5 w-5 shrink-0" />
                <p className="text-sm font-bold font-alinur" style={{ fontFamily: '"Alinur Tatsama", sans-serif' }}>দুঃখিত, নোটিশসমূহ লোড করতে ত্রুটি ঘটেছে। অনুগ্রহ করে পরে চেষ্টা করুন।</p>
              </div>
            );
          }

          if (!notices || notices.length === 0) {
            return (
              <div className="text-center py-16 px-4 bg-white border border-slate-200/60 rounded-3xl space-y-3">
                <div className="bg-amber-50 h-14 w-14 rounded-full flex items-center justify-center mx-auto border border-amber-100">
                  <Calendar className="h-7 w-7 text-amber-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-700 font-alinur" style={{ fontFamily: '"Alinur Tatsama", sans-serif' }}>কোনো নোটিশ পাওয়া যায়নি</h3>
                <p className="text-xs text-gray-400 max-w-xs mx-auto leading-relaxed font-alinur" style={{ fontFamily: '"Alinur Tatsama", sans-serif' }}>
                  এই মুহূর্তে মাদ্রাসার ডাটাবেসে কোনো সক্রিয় নোটিশ নেই। পরবর্তীতে পুনরায় চেক করুন।
                </p>
              </div>
            );
          }

          return (
            <div className="grid gap-6">
              {notices.map((notice) => {
                // Handle transient/null timestamp with fallback
                const rawDate = notice.timestamp ? notice.timestamp.toDate() : new Date();
                const { dayStr, monthStr, yearStr } = getBengaliDateParts(rawDate);

                return (
                  <motion.div
                    key={notice.id}
                    initial={{ opacity: 0, y: 15 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.3 }}
                    onClick={() => setSelectedNotice(notice)}
                    className="group bg-gradient-to-r from-emerald-50/10 via-white to-white rounded-2xl border-l-4 border-l-emerald-600 border-t border-b border-r border-slate-200/85 hover:border-amber-400 hover:border-l-amber-500 shadow-xs hover:shadow-lg hover:scale-[1.01] transition-all duration-300 overflow-hidden cursor-pointer flex flex-row items-stretch"
                  >
                    {/* Left: Date Block (Split UI) */}
                    <div className="w-24 sm:w-28 bg-gradient-to-b from-emerald-900 to-[#061426] shrink-0 flex flex-col justify-center items-center py-5 px-2 text-center select-none border-r border-slate-100 relative">
                      {/* Upper: Month Name */}
                      <div className="text-[10px] sm:text-xs font-bold text-sky-300 uppercase tracking-wide mb-1 font-alinur" style={{ fontFamily: '"Alinur Tatsama", sans-serif' }}>
                        {monthStr}
                      </div>
                      {/* Middle: Bold Day Numeral */}
                      <div className="text-3xl sm:text-4xl font-extrabold text-white font-alinur tracking-tighter leading-none py-1" style={{ fontFamily: '"Alinur Tatsama", sans-serif' }}>
                        {dayStr}
                      </div>
                      {/* Lower: Grey Year Numeral */}
                      <div className="text-[10px] sm:text-xs font-bold text-slate-400 font-alinur mt-1" style={{ fontFamily: '"Alinur Tatsama", sans-serif' }}>
                        {yearStr}
                      </div>
                      
                      {/* Sleek bottom accent inside date block */}
                      <div className="absolute bottom-0 left-0 w-full h-1 bg-amber-500"></div>
                    </div>

                    {/* Right: Content Block */}
                    <div className="flex-1 p-5 sm:p-6 flex flex-col justify-between space-y-3">
                      <div className="space-y-1.5">
                        {/* Title */}
                        <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-snug font-alinur group-hover:text-emerald-800 transition-colors line-clamp-2" style={{ fontFamily: '"Alinur Tatsama", sans-serif' }}>
                          {notice.title}
                        </h3>
                        {/* Single line short description */}
                        <p className="text-xs sm:text-sm text-gray-500 line-clamp-1 leading-relaxed font-medium font-alinur" style={{ fontFamily: '"Alinur Tatsama", sans-serif' }}>
                          {notice.description}
                        </p>
                      </div>

                      {/* Read More Clickable Link */}
                      <div className="pt-2 flex items-center justify-between text-xs font-bold">
                        <span className="text-emerald-700 hover:text-amber-600 font-alinur flex items-center space-x-0.5 transition-all group-hover:translate-x-1 duration-200" style={{ fontFamily: '"Alinur Tatsama", sans-serif' }}>
                          <span>[ আরও পড়ুন ]</span>
                        </span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          );
        })()}

        {/* Details Modal Popup Dialog */}
        <AnimatePresence>
          {selectedNotice && (() => {
            const dateObj = selectedNotice.timestamp ? selectedNotice.timestamp.toDate() : new Date();
            const formattedDateTime = formatBengaliDateTime(dateObj);

            return (
              <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-xl w-full overflow-hidden flex flex-col max-h-[85vh]"
                  style={{ fontFamily: '"Alinur Tatsama", sans-serif' }}
                >
                  {/* Modal Header */}
                  <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-[#0a1e3a] text-white p-5 sm:p-6 flex justify-between items-center border-b border-slate-800 relative select-none shrink-0" style={{ fontFamily: '"Alinur Tatsama", sans-serif' }}>
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-sky-400 uppercase tracking-wide" style={{ fontFamily: '"Alinur Tatsama", sans-serif' }}>
                        সুফিয়া নূরীয়া দাখিল মাদ্রাসা নোটিশবোর্ড
                      </span>
                      <h4 className="font-bold text-sm sm:text-base text-white font-alinur" style={{ fontFamily: '"Alinur Tatsama", sans-serif' }}>
                        বিস্তারিত নোটিশ ভিউ
                      </h4>
                    </div>
                    <button
                      onClick={() => setSelectedNotice(null)}
                      className="p-1.5 rounded-lg bg-white/10 text-slate-300 hover:text-white hover:bg-white/20 transition-all cursor-pointer"
                    >
                      <X className="h-5 w-5" />
                    </button>
                    {/* Amber Bottom Line */}
                    <div className="absolute bottom-0 left-0 w-full h-1 bg-amber-500"></div>
                  </div>

                  {/* Modal Scrollable Body */}
                  <div className="p-6 sm:p-8 overflow-y-auto space-y-6 flex-1">
                    {/* Timestamp & Date */}
                    <div className="flex items-center space-x-1.5 text-xs text-emerald-800 font-bold bg-emerald-50 border border-emerald-100 rounded-lg px-3.5 py-2 w-fit">
                      <Calendar className="h-3.5 w-3.5 text-emerald-700 shrink-0" />
                      <span className="font-alinur" style={{ fontFamily: '"Alinur Tatsama", sans-serif' }}>প্রকাশের সময়: {formattedDateTime}</span>
                    </div>

                    {/* Title */}
                    <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-snug font-alinur" style={{ fontFamily: '"Alinur Tatsama", sans-serif' }}>
                      {selectedNotice.title}
                    </h2>

                    {/* Divider */}
                    <div className="h-[1px] w-full bg-slate-100"></div>

                    {/* Notice Description Body */}
                    <div className="text-sm sm:text-base text-gray-700 font-alinur font-medium leading-relaxed whitespace-pre-wrap" style={{ fontFamily: '"Alinur Tatsama", sans-serif' }}>
                      {selectedNotice.description}
                    </div>
                  </div>

                  {/* Modal Footer */}
                  <div className="p-5 sm:p-6 border-t border-slate-100 bg-slate-50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shrink-0 select-none">
                    {/* isEdited Flag Check */}
                    <div>
                      {selectedNotice.isEdited && (
                        <span className="inline-flex items-center space-x-1 text-xs font-bold text-red-600 bg-red-50 border border-red-100 px-3 py-1 rounded-full font-alinur" style={{ fontFamily: '"Alinur Tatsama", sans-serif' }}>
                          <span>● সংস্করণ হয়েছে</span>
                        </span>
                      )}
                    </div>
                    
                    <button
                      onClick={() => setSelectedNotice(null)}
                      className="w-full sm:w-auto bg-[#0a1e3a] hover:bg-slate-900 text-white font-bold px-5 py-2 rounded-xl text-xs sm:text-sm cursor-pointer transition-colors text-center font-alinur"
                      style={{ fontFamily: '"Alinur Tatsama", sans-serif' }}
                    >
                      বন্ধ করুন
                    </button>
                  </div>
                </motion.div>
              </div>
            );
          })()}
        </AnimatePresence>

      </div>
    </div>
  );
}
