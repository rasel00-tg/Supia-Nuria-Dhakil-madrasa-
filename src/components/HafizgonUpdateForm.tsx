import React, { useState } from "react";
import { collection, query, addDoc, deleteDoc, doc, serverTimestamp } from "firebase/firestore";
import { db, StreamBuilder, uploadFileToImgBB } from "../lib/firebase";
import { Hafiz } from "../types";
import { Trash2, Plus, Upload, User, Home, BookOpen, AlertCircle, CheckCircle2, Loader2, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

const hafizgonQuery = query(collection(db, "hafizgon"));

export default function HafizgonUpdateForm() {
  const [name, setName] = useState("");
  const [fatherName, setFatherName] = useState("");
  const [address, setAddress] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [showDeleteConfirmId, setShowDeleteConfirmId] = useState<string | null>(null);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setStatusMessage(null);
    try {
      const url = await uploadFileToImgBB(file);
      setPhotoUrl(url);
      setStatusMessage({ type: "success", text: "ছবি সফলভাবে আপলোড হয়েছে!" });
    } catch (err: any) {
      console.error("Upload error:", err);
      setStatusMessage({ type: "error", text: "ছবি আপলোড ব্যর্থ হয়েছে। পুনরায় চেষ্টা করুন।" });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !fatherName.trim() || !address.trim()) {
      setStatusMessage({ type: "error", text: "অনুগ্রহ করে সকল আবশ্যক ক্ষেত্র পূরণ করুন।" });
      return;
    }

    setIsSaving(true);
    setStatusMessage(null);

    try {
      await addDoc(collection(db, "hafizgon"), {
        name: name.trim(),
        fatherName: fatherName.trim(),
        address: address.trim(),
        photoUrl: photoUrl || "https://cdn-icons-png.flaticon.com/512/2913/2913520.png",
        createdAt: serverTimestamp()
      });

      // Reset form on success
      setName("");
      setFatherName("");
      setAddress("");
      setPhotoUrl("");
      setStatusMessage({ type: "success", text: "নতুন হাফেজ প্রোফাইল সফলভাবে সংরক্ষণ করা হয়েছে!" });
    } catch (err: any) {
      console.error("Firestore save error:", err);
      setStatusMessage({ type: "error", text: "ডাটাবেসে তথ্য সংরক্ষণে সমস্যা হয়েছে।" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, "hafizgon", id));
      setShowDeleteConfirmId(null);
      setStatusMessage({ type: "success", text: "হাফেজ প্রোফাইল সফলভাবে মুছে ফেলা হয়েছে।" });
    } catch (err) {
      console.error("Firestore delete error:", err);
      setStatusMessage({ type: "error", text: "হাফেজ প্রোফাইল মুছতে ব্যর্থ হয়েছে।" });
    }
  };

  return (
    <div id="hafizgon-update-container" className="space-y-8 font-alinur" style={{ fontFamily: 'Ador Noirit' }}>
      
      {/* Description Box */}
      <div className="bg-emerald-50 border-l-4 border-amber-500 p-4 rounded-r-xl shadow-sm">
        <h4 className="text-sm font-bold text-emerald-950 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-emerald-800" />
          হিফজ বিভাগ (হাফেজ তালিকা) ম্যানেজমেন্ট
        </h4>
        <p className="text-xs text-emerald-800 font-semibold mt-1">
          এখানে মাদ্রাসার হিফজ বিভাগের সম্মানিত হাফেজদের নতুন প্রোফাইল যোগ করুন, পূর্বে সংরক্ষিত প্রোফাইলগুলো দেখুন এবং যেকোনো প্রোফাইল লাইভ তালিকা থেকে মুছে ফেলুন।
        </p>
      </div>

      {/* Top Banner & Status Feedback */}
      <AnimatePresence>
        {statusMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`p-4 rounded-xl flex items-center gap-3 border ${
              statusMessage.type === "success" 
                ? "bg-emerald-50 border-emerald-200 text-emerald-850" 
                : "bg-red-50 border-red-200 text-red-850"
            }`}
          >
            {statusMessage.type === "success" ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
            )}
            <span className="text-xs font-bold leading-normal">{statusMessage.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* ADD PROFILE FORM */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm h-fit">
          <div className="border-b pb-3 mb-5">
            <h3 className="text-lg font-black text-emerald-950">নতুন হাফেজ প্রোফাইল তৈরি করুন</h3>
            <p className="text-xs text-gray-500">সকল তথ্য নির্ভুলভাবে ইনপুট দিয়ে লাইভ ডাটাবেসে সেভ করুন।</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Photo Upload Input */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-700 block">ছাত্রের প্রোফাইল ফটো (Photo Upload)</label>
              <div className="flex flex-col items-center p-4 border-2 border-dashed border-emerald-100 rounded-xl bg-emerald-50/20 hover:bg-emerald-50/40 transition-colors relative">
                {photoUrl ? (
                  <div className="relative w-28 h-28 mb-3 rounded-lg overflow-hidden border-2 border-white shadow-md">
                    <img src={photoUrl} alt="Preview" className="w-full h-full object-cover" />
                    <button 
                      type="button"
                      onClick={() => setPhotoUrl("")}
                      className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 shadow hover:bg-red-700 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-1 py-3 text-emerald-800/60">
                    {isUploading ? (
                      <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
                    ) : (
                      <Upload className="w-8 h-8 text-emerald-600" />
                    )}
                    <span className="text-xs font-bold mt-1">হাফেজের ছবি নির্বাচন করুন</span>
                    <span className="text-[10px] text-gray-400">JPG, PNG বা JPEG (সর্বোচ্চ ৩ এমবি)</span>
                  </div>
                )}
                
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handlePhotoUpload} 
                  disabled={isUploading || isSaving}
                  className="absolute inset-0 opacity-0 cursor-pointer" 
                />
              </div>
            </div>

            {/* Name Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700 block">হাফেজ ছাত্রের নাম</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                  <User className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="হাফেজ ছাত্রের নাম লিখুন"
                  disabled={isSaving}
                  className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-emerald-500 text-xs focus:outline-none"
                />
              </div>
            </div>

            {/* Father's Name Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700 block">পিতার নাম</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                  <User className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  required
                  value={fatherName}
                  onChange={(e) => setFatherName(e.target.value)}
                  placeholder="হাফেজ ছাত্রের পিতার নাম লিখুন"
                  disabled={isSaving}
                  className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-emerald-500 text-xs focus:outline-none"
                />
              </div>
            </div>

            {/* Address Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700 block">সম্পূর্ণ ঠিকানা</label>
              <div className="relative">
                <span className="absolute top-3 left-0 pl-3 flex items-start text-gray-400">
                  <Home className="w-4 h-4" />
                </span>
                <textarea
                  required
                  rows={3}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="গ্রাম, ডাকঘর, থানা ও জেলা লিখুন"
                  disabled={isSaving}
                  className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-emerald-500 text-xs focus:outline-none"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isUploading || isSaving}
              className="w-full bg-emerald-800 hover:bg-emerald-950 text-amber-400 font-bold py-3 px-4 rounded-xl text-xs transition-all shadow-md active:scale-[0.98] flex items-center justify-center gap-2 border-b-4 border-emerald-950/60 disabled:opacity-55"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                  <span>সংরক্ষণ হচ্ছে...</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 text-amber-400" />
                  <span>সাবমিট করুন</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* EXISTENT LIST MANAGEMENT */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <div className="border-b pb-3 mb-5">
              <h3 className="text-lg font-black text-emerald-950">বর্তমানে তালিকাভুক্ত হাফেজগণ</h3>
              <p className="text-xs text-gray-500">রিয়েল-টাইমে সেভ করা সকল হাফেজদের তালিকা নিচে প্রদর্শিত হচ্ছে।</p>
            </div>

            <StreamBuilder<Hafiz>
              stream={hafizgonQuery}
              builder={(hafizList, loading) => {
                if (loading) {
                  return (
                    <div className="flex flex-col items-center justify-center py-16 space-y-3">
                      <Loader2 className="w-8 h-8 animate-spin text-emerald-700" />
                      <p className="text-emerald-950 text-xs font-bold animate-pulse">হাফেজ তালিকা লোড হচ্ছে...</p>
                    </div>
                  );
                }

                if (!hafizList || hafizList.length === 0) {
                  return (
                    <div className="text-center py-16 border-2 border-dashed border-emerald-100 rounded-xl bg-emerald-50/10">
                      <p className="text-emerald-950/60 text-xs font-bold">দুঃখিত, কোনো হাফেজের প্রোফাইল খুঁজে পাওয়া যায়নি।</p>
                    </div>
                  );
                }

                return (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-emerald-50 text-emerald-950 font-bold border-b border-emerald-100">
                          <th className="p-3 text-center">ছবি</th>
                          <th className="p-3">নাম</th>
                          <th className="p-3">পিতার নাম</th>
                          <th className="p-3">ঠিকানা</th>
                          <th className="p-3 text-center">অ্যাকশন</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-emerald-50/60">
                        {hafizList.map((hafiz) => (
                          <tr key={hafiz.id} className="hover:bg-emerald-50/20 transition-colors">
                            <td className="p-3 text-center">
                              <img 
                                src={hafiz.photoUrl || "https://cdn-icons-png.flaticon.com/512/2913/2913520.png"} 
                                alt={hafiz.name} 
                                className="w-12 h-12 rounded-lg object-cover mx-auto border border-emerald-100 bg-emerald-50/50" 
                                referrerPolicy="no-referrer"
                              />
                            </td>
                            <td className="p-3 font-bold text-emerald-950 text-xs whitespace-nowrap">{hafiz.name}</td>
                            <td className="p-3 text-gray-700 text-xs">{hafiz.fatherName}</td>
                            <td className="p-3 text-gray-600 text-xs max-w-[200px] truncate" title={hafiz.address}>
                              {hafiz.address}
                            </td>
                            <td className="p-3 text-center">
                              {showDeleteConfirmId === hafiz.id ? (
                                <div className="flex items-center justify-center gap-1.5 bg-red-50 p-1.5 rounded-lg border border-red-200">
                                  <button 
                                    onClick={() => handleDelete(hafiz.id)} 
                                    className="bg-red-600 text-white font-bold px-2 py-1 rounded text-[10px] hover:bg-red-700 transition-colors"
                                  >
                                    হ্যাঁ
                                  </button>
                                  <button 
                                    onClick={() => setShowDeleteConfirmId(null)} 
                                    className="bg-gray-200 text-gray-700 font-bold px-2 py-1 rounded text-[10px] hover:bg-gray-300 transition-colors"
                                  >
                                    না
                                  </button>
                                </div>
                              ) : (
                                <button 
                                  onClick={() => setShowDeleteConfirmId(hafiz.id)} 
                                  className="p-2 text-red-600 hover:text-white hover:bg-red-600 rounded-lg transition-all mx-auto block"
                                  title="মুছে ফেলুন"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                );
              }}
            />
          </div>
        </div>

      </div>
    </div>
  );
}
