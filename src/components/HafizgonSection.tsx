import React, { useState } from "react";
import { collection, query, doc, setDoc } from "firebase/firestore";
import { db, StreamBuilder, uploadFileToImgBB } from "../lib/firebase";
import { Hafiz } from "../types";

const hafizgonQuery = query(collection(db, "hafizgon"));
const settingsQuery = query(collection(db, "settings"));

export default function HafizgonSection() {
  const [isUploading, setIsUploading] = useState(false);

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const url = await uploadFileToImgBB(file);
      await setDoc(doc(db, "settings", "hafizgon_banner"), {
        bannerUrl: url
      });
    } catch (error) {
      console.error("Banner upload failed:", error);
      alert("ব্যানার আপলোড ব্যর্থ হয়েছে। আবার চেষ্টা করুন।");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div 
      id="hafizgon-section-container" 
      className="min-h-screen bg-gradient-to-b from-[#5c0607] via-[#91200b] to-[#c77014] bg-fixed py-12 px-4 sm:px-6 md:px-8 flex justify-center items-start" 
      style={{ fontFamily: 'Ador Noirit' }}
    >
      {/* Outer Paper Vessel representing the premium traditional stamp sheet */}
      <div className="w-full max-w-6xl bg-[#faf8f5] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.5)] relative py-8 px-6 sm:px-12 md:px-16 rounded-2xl my-2 border-4 border-amber-500/20 overflow-visible">
        
        {/* Inner traditional dashed frame line of stamp sheet */}
        <div className="absolute inset-2 sm:inset-3 border-2 border-dashed border-amber-900/10 pointer-events-none rounded-xl"></div>

        {/* Postal Stamp Perforations - Left Edge */}
        <div className="absolute top-6 bottom-6 left-0 w-6 flex flex-col justify-between items-center overflow-hidden select-none pointer-events-none transform -translate-x-1/2 z-20">
          {Array.from({ length: 42 }).map((_, i) => (
            <div 
              key={`left-perf-${i}`} 
              className="w-4 h-4 rounded-full bg-gradient-to-b from-[#5c0607] via-[#91200b] to-[#c77014] bg-fixed shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)] shrink-0 my-1" 
            />
          ))}
        </div>

        {/* Postal Stamp Perforations - Right Edge */}
        <div className="absolute top-6 bottom-6 right-0 w-6 flex flex-col justify-between items-center overflow-hidden select-none pointer-events-none transform translate-x-1/2 z-20">
          {Array.from({ length: 42 }).map((_, i) => (
            <div 
              key={`right-perf-${i}`} 
              className="w-4 h-4 rounded-full bg-gradient-to-b from-[#5c0607] via-[#91200b] to-[#c77014] bg-fixed shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)] shrink-0 my-1" 
            />
          ))}
        </div>

        <div className="relative z-10">
          <StreamBuilder<any>
            stream={settingsQuery}
            builder={(settingsList, settingsLoading) => {
              const bannerDoc = settingsList?.find((s) => s.id === "hafizgon_banner");
              const bannerUrl = bannerDoc?.bannerUrl || "";

              return (
                <div className="space-y-6">
                  {/* Banner Spot / One-time Upload Container */}
                  {bannerUrl ? (
                    <div className="w-full rounded-2xl overflow-hidden border border-amber-200/50 bg-amber-50/10 shadow-sm">
                      <img 
                        src={bannerUrl} 
                        alt="হিফজ বিভাগ ব্যানার" 
                        className="w-full h-auto object-contain max-h-[300px] sm:max-h-[400px] md:max-h-[500px] block mx-auto rounded-2xl"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  ) : (
                    !settingsLoading && (
                      <div className="w-full border-4 border-dashed border-amber-500/30 rounded-2xl p-6 sm:p-10 text-center bg-amber-50/15 hover:bg-amber-50/25 transition-all flex flex-col items-center justify-center space-y-3 relative overflow-hidden">
                        <div className="p-3 bg-amber-100 rounded-full text-amber-700">
                          {isUploading ? (
                            <div className="w-6 h-6 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                            </svg>
                          )}
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm sm:text-base font-bold text-emerald-950">এখানে হিফজ বিভাগের ব্যানার আপলোড করুন</p>
                          <p className="text-[10px] text-gray-500">ব্যানারটি ল্যাপটপ ও মোবাইলে সুন্দরভাবে ফিট হবে (JPG, PNG)</p>
                        </div>
                        <label className="cursor-pointer bg-amber-500 hover:bg-amber-600 active:scale-95 text-emerald-950 font-bold px-4 py-2 rounded-lg text-xs transition-all shadow-sm inline-flex items-center gap-2">
                          <span>{isUploading ? "আপলোড হচ্ছে..." : "ব্যানার নির্বাচন করুন"}</span>
                          <input 
                            type="file" 
                            accept="image/*" 
                            className="hidden" 
                            onChange={handleBannerUpload}
                            disabled={isUploading}
                          />
                        </label>
                      </div>
                    )
                  )}

                  {/* Dynamic Grid using StreamBuilder directly under the banner */}
                  <StreamBuilder<Hafiz>
                    stream={hafizgonQuery}
                    builder={(hafizList, loading) => {
                      if (loading) {
                        return (
                          <div className="flex flex-col items-center justify-center py-20 space-y-4">
                            <div className="w-12 h-12 border-4 border-emerald-200 border-t-emerald-700 rounded-full animate-spin"></div>
                            <p className="text-emerald-900 font-bold animate-pulse">হাফেজদের তথ্য লোড হচ্ছে...</p>
                          </div>
                        );
                      }

                      if (!hafizList || hafizList.length === 0) {
                        return (
                          <div className="text-center py-20 bg-white/60 rounded-3xl border-2 border-dashed border-emerald-100 max-w-2xl mx-auto">
                            <p className="text-emerald-800/60 font-bold text-lg">দুঃখিত, বর্তমানে কোনো হাফেজের তথ্য তালিকাভুক্ত নেই।</p>
                          </div>
                        );
                      }

                      return (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                          {hafizList.map((hafiz, index) => {
                            const isEven = index % 2 === 0;
                            // Alternating background gradient colors behind student photos
                            const photoBgClass = isEven 
                              ? "bg-gradient-to-br from-[#7a0d0e] to-[#c21807]" 
                              : "bg-gradient-to-br from-[#d97c18] to-[#f2a104]";

                            return (
                              <div 
                                key={hafiz.id} 
                                className="bg-white rounded-2xl p-4 border border-amber-200/60 shadow-[0_8px_24px_rgba(0,0,0,0.03)] hover:shadow-[0_16px_36px_rgba(0,0,0,0.08)] transition-all duration-500 transform hover:-translate-y-1.5 group flex flex-col justify-between relative overflow-hidden"
                              >
                                {/* Stamp Corner Deco Marks */}
                                <div className="absolute top-1 left-1 w-2 h-2 rounded-full bg-amber-500/20"></div>
                                <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-amber-500/20"></div>

                                {/* Photo Wrapper Container */}
                                <div className="relative mb-4 self-center w-full">
                                  <div className={`relative w-28 h-28 sm:w-32 sm:h-32 mx-auto overflow-hidden rounded-2xl p-1.5 shadow-inner transition-transform duration-500 group-hover:rotate-1 ${photoBgClass}`}>
                                    <div className="w-full h-full rounded-xl overflow-hidden bg-white p-0.5 flex items-center justify-center">
                                      <img 
                                        src={hafiz.photoUrl || "https://cdn-icons-png.flaticon.com/512/2913/2913520.png"} 
                                        alt={hafiz.name}
                                        className="w-full h-full object-cover rounded-lg transition-transform duration-750 group-hover:scale-105"
                                        referrerPolicy="no-referrer"
                                        onError={(e) => {
                                          e.currentTarget.onerror = null;
                                          e.currentTarget.src = "https://cdn-icons-png.flaticon.com/512/2913/2913520.png";
                                        }}
                                      />
                                    </div>
                                  </div>
                                </div>

                                {/* Text Information Details Section */}
                                <div className="text-center space-y-3 flex-1 flex flex-col justify-between">
                                  <div>
                                    <h4 className="text-sm sm:text-base font-black text-emerald-950 leading-tight">
                                      {hafiz.name}
                                    </h4>
                                    <div className="inline-block px-3 py-0.5 bg-amber-500/10 text-amber-800 rounded-full text-[10px] font-bold mt-1">
                                      হাফেজে কুরআন
                                    </div>
                                  </div>

                                  <div className="space-y-2 p-2.5 bg-emerald-50/30 rounded-xl border border-emerald-100/50 text-left text-[11px] sm:text-xs">
                                    <div className="flex items-start gap-1.5">
                                      <span className="font-extrabold text-emerald-950 shrink-0">পিতা:</span>
                                      <span className="text-emerald-900 font-bold truncate" title={hafiz.fatherName}>
                                        {hafiz.fatherName}
                                      </span>
                                    </div>

                                    <div className="flex items-start gap-1.5">
                                      <span className="font-extrabold text-emerald-950 shrink-0">ঠিকানা:</span>
                                      <span className="text-emerald-900/80 font-semibold line-clamp-2 leading-relaxed" title={hafiz.address}>
                                        {hafiz.address}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    }}
                  />
                </div>
              );
            }}
          />
        </div>
      </div>
    </div>
  );
}
