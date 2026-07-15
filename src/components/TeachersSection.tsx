import React, { useState } from "react";
import { collection, query, orderBy, doc, setDoc } from "firebase/firestore";
import { db, StreamBuilder, uploadFileToImgBB } from "../lib/firebase";
import { Teacher } from "../types";
import { Upload, Phone, Mail } from "lucide-react";

const teachersQuery = query(collection(db, "teachers"), orderBy("uid", "asc"));
const settingsQuery = query(collection(db, "settings"));

export default function TeachersSection() {
  const [isUploading, setIsUploading] = useState(false);

  const handleIconUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'phone' | 'email') => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const url = await uploadFileToImgBB(file);
      const updateData: any = {};
      if (type === 'phone') {
        updateData.phoneIconUrl = url;
      } else {
        updateData.emailIconUrl = url;
      }
      
      await setDoc(doc(db, "settings", "teacher_icons"), updateData, { merge: true });
    } catch (error) {
      console.error("Error uploading icon:", error);
    } finally {
      setIsUploading(false);
    }
  };

  const finalizeUpload = async () => {
    try {
      await setDoc(doc(db, "settings", "teacher_icons"), { isTeacherIconsUploaded: true }, { merge: true });
    } catch (error) {
      console.error("Error finalizing icon setup:", error);
    }
  };

  return (
    <div id="teachers-section-container" className="min-h-screen bg-[#fdfdfb]">
      <StreamBuilder<any>
        stream={settingsQuery}
        builder={(settingsList) => {
          const iconSettings = settingsList.find(s => s.id === "teacher_icons") || {};
          const isTeacherIconsUploaded = iconSettings.isTeacherIconsUploaded || false;
          const phoneIconUrl = iconSettings.phoneIconUrl || "";
          const emailIconUrl = iconSettings.emailIconUrl || "";

          return (
            <div id="teachers-content" className="space-y-10 py-10 w-full px-4 max-w-7xl mx-auto font-alinur">
              {/* Page Header */}
              <div className="text-center space-y-3">
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-emerald-900 tracking-tight leading-tight">
                  মাদ্রাসার সম্মানিত শিক্ষকবৃন্দ
                </h2>
                <div className="h-1.5 w-32 bg-amber-500 mx-auto rounded-full"></div>
              </div>

              {/* One-Time Upload Interface (Hidden if uploaded) */}
              {!isTeacherIconsUploaded && (
                <div className="bg-emerald-50/50 border-2 border-dashed border-emerald-200 p-8 rounded-[2rem] flex flex-col items-center space-y-6 shadow-sm max-w-2xl mx-auto">
                  <div className="text-center space-y-1">
                    <h3 className="text-xl font-black text-emerald-900">আইকন সেটআপ গেটওয়ে</h3>
                    <p className="text-xs text-emerald-700 font-bold">একবার আপলোড হয়ে গেলে এই অপশনটি চিরতরে মুছে যাবে</p>
                  </div>
                  
                  <div className="flex flex-wrap justify-center gap-6">
                    <div className="flex flex-col items-center gap-3">
                      <input type="file" accept="image/*" className="hidden" id="phone-icon-upload" onChange={(e) => handleIconUpload(e, 'phone')} disabled={isUploading} />
                      <label htmlFor="phone-icon-upload" className="cursor-pointer bg-white px-5 py-2.5 rounded-xl border-2 border-emerald-200 shadow-sm hover:border-amber-400 hover:bg-amber-50 transition-all flex items-center gap-2 text-sm font-bold text-emerald-900 group">
                        <Upload className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition-transform" /> 
                        ফোন আইকন
                      </label>
                      {phoneIconUrl && (
                        <div className="p-2 bg-white rounded-lg border border-emerald-100 shadow-inner">
                          <img src={phoneIconUrl} alt="Phone Icon Preview" className="w-8 h-8 object-contain" />
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col items-center gap-3">
                      <input type="file" accept="image/*" className="hidden" id="email-icon-upload" onChange={(e) => handleIconUpload(e, 'email')} disabled={isUploading} />
                      <label htmlFor="email-icon-upload" className="cursor-pointer bg-white px-5 py-2.5 rounded-xl border-2 border-emerald-200 shadow-sm hover:border-amber-400 hover:bg-amber-50 transition-all flex items-center gap-2 text-sm font-bold text-emerald-900 group">
                        <Upload className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition-transform" /> 
                        ইমেইল আইকন
                      </label>
                      {emailIconUrl && (
                        <div className="p-2 bg-white rounded-lg border border-emerald-100 shadow-inner">
                          <img src={emailIconUrl} alt="Email Icon Preview" className="w-8 h-8 object-contain" />
                        </div>
                      )}
                    </div>
                  </div>

                  {phoneIconUrl && emailIconUrl && (
                    <button 
                      onClick={finalizeUpload}
                      className="mt-4 bg-amber-500 hover:bg-amber-600 text-emerald-950 px-8 py-3 rounded-2xl font-black text-sm transition-all shadow-lg shadow-amber-500/20 active:scale-95 border-b-4 border-amber-700"
                    >
                      সেটআপ সম্পন্ন করুন (Hides forever)
                    </button>
                  )}
                </div>
              )}

              {/* Teachers List */}
              <StreamBuilder<Teacher>
                stream={teachersQuery}
                builder={(teachers, loading) => {
                  if (loading) return (
                    <div className="flex flex-col items-center justify-center py-24 space-y-4">
                      <div className="w-12 h-12 border-4 border-emerald-200 border-t-emerald-700 rounded-full animate-spin"></div>
                      <p className="text-emerald-900 font-bold animate-pulse">সম্মানিত শিক্ষকদের তথ্য লোড হচ্ছে...</p>
                    </div>
                  );
                  
                  if (teachers.length === 0) return (
                    <div className="text-center py-24 bg-white rounded-3xl border-2 border-dashed border-emerald-100">
                      <p className="text-emerald-800/60 font-bold text-lg">দুঃখিত, কোনো শিক্ষকের তথ্য পাওয়া যায়নি।</p>
                    </div>
                  );

                  return (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-10">
                      {teachers.map((teacher) => (
                        <div key={teacher.id} className="bg-white rounded-[2.5rem] p-6 border-2 border-emerald-50 shadow-[0_10px_40px_-15px_rgba(4,120,87,0.1)] hover:shadow-[0_20px_60px_-15px_rgba(4,120,87,0.15)] transition-all duration-500 transform hover:-translate-y-2 group flex flex-col relative overflow-hidden">
                          {/* Accent Decoration */}
                          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-150 duration-700"></div>
                          
                          {/* Profile Image with Styled Frame */}
                          <div className="relative mb-8 self-center">
                            <div className="absolute inset-0 bg-emerald-900 rounded-[2rem] rotate-6 group-hover:rotate-12 transition-transform duration-500"></div>
                            <div className="relative w-48 h-56 sm:w-52 sm:h-60 overflow-hidden rounded-[1.8rem] border-4 border-white shadow-lg bg-emerald-50">
                              <img 
                                src={teacher.photoUrl || "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80"} 
                                alt={teacher.name}
                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                referrerPolicy="no-referrer"
                              />
                            </div>
                          </div>

                          {/* Name and Designation */}
                          <div className="text-center space-y-3 mb-8 flex-1">
                            <h4 className="text-2xl sm:text-3xl font-black text-emerald-950 leading-tight">
                              {teacher.name}
                            </h4>
                            <div className="inline-block px-5 py-1.5 bg-emerald-900 text-amber-300 rounded-2xl text-[13px] font-bold shadow-sm">
                              {teacher.designation}
                            </div>
                          </div>

                          {/* Contact Info Section */}
                          <div className="space-y-4 p-5 bg-emerald-50/50 rounded-3xl border border-emerald-100 transition-colors group-hover:bg-emerald-50 duration-300">
                            <div className="flex items-center gap-4 group/item">
                              <div className="w-10 h-10 flex items-center justify-center bg-white rounded-2xl shadow-sm border border-emerald-100 group-hover/item:border-amber-400 group-hover/item:scale-110 transition-all duration-300">
                                {phoneIconUrl ? (
                                  <img src={phoneIconUrl} alt="Phone" className="w-5 h-5 object-contain" />
                                ) : (
                                  <Phone className="w-4 h-4 text-emerald-700" />
                                )}
                              </div>
                              <div className="flex flex-col">
                                <span className="text-[10px] uppercase font-black text-emerald-800/40 tracking-widest leading-none mb-1">যোগাযোগ</span>
                                <span className="text-lg font-bold text-emerald-950 tracking-wide">
                                  {teacher.phone}
                                </span>
                              </div>
                            </div>

                            {teacher.email && (
                              <div className="flex items-center gap-4 group/item">
                                <div className="w-10 h-10 flex items-center justify-center bg-white rounded-2xl shadow-sm border border-emerald-100 group-hover/item:border-amber-400 group-hover/item:scale-110 transition-all duration-300">
                                  {emailIconUrl ? (
                                    <img src={emailIconUrl} alt="Email" className="w-5 h-5 object-contain" />
                                  ) : (
                                    <Mail className="w-4 h-4 text-emerald-700" />
                                  )}
                                </div>
                                <div className="flex flex-col min-w-0">
                                  <span className="text-[10px] uppercase font-black text-emerald-800/40 tracking-widest leading-none mb-1">ইমেইল</span>
                                  <span className="text-sm font-bold text-emerald-900/80 truncate" title={teacher.email}>
                                    {teacher.email}
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                }}
              />
            </div>
          );
        }}
      />
    </div>
  );
}
