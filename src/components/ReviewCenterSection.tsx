import React, { useState, useEffect } from "react";
import { collection, addDoc, query, where, getDocs, Timestamp, doc, updateDoc, setDoc } from "firebase/firestore";
import { db, StreamBuilder, uploadFileToImgBB } from "../lib/firebase";
import { Star, Upload, MessageSquare, CheckCircle, AlertCircle, X, MousePointerClick } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function ReviewCenterSection() {
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    mobile: "",
    email: "",
    address: "",
    details: "",
    rating: 0
  });

  const bannerConfigQuery = query(collection(db, "global_config"));
  const reviewsQuery = query(collection(db, "reviews"));

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const url = await uploadFileToImgBB(file);
      const configRef = doc(db, "global_config", "banner_config");
      await setDoc(configRef, {
        isBannerUploaded: true,
        bannerUrl: url
      }, { merge: true });
    } catch (error) {
      console.error("Banner upload failed:", error);
      alert("ব্যানার আপলোড ব্যর্থ হয়েছে। আবার চেষ্টা করুন।");
    } finally {
      setIsUploading(false);
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.mobile || !formData.address || !formData.details || formData.rating === 0) {
      setErrorMessage("দয়া করে ইমেইল বাদে সকল ঘর পূরণ করুন এবং রেটিং দিন।");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      // 1-month rate limiting check
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const timestamp30DaysAgo = Timestamp.fromDate(thirtyDaysAgo);

      const reviewsRef = collection(db, "reviews");
      const qMobile = query(
        reviewsRef,
        where("mobile", "==", formData.mobile),
        where("createdAt", ">=", timestamp30DaysAgo)
      );
      
      const mobileSnap = await getDocs(qMobile);
      let emailSnap = { empty: true };
      
      if (formData.email) {
        const qEmail = query(
          reviewsRef,
          where("email", "==", formData.email),
          where("createdAt", ">=", timestamp30DaysAgo)
        );
        emailSnap = await getDocs(qEmail) as any;
      }

      if (!mobileSnap.empty || (!emailSnap.empty && formData.email)) {
        setErrorMessage("দুঃখিত! আপনি গত ৩০ দিনের মধ্যে ইতিমধ্যে একটি রিভিউ প্রদান করেছেন।");
        setIsSubmitting(false);
        return;
      }

      await addDoc(reviewsRef, {
        ...formData,
        createdAt: Timestamp.now()
      });

      setSuccessMessage("ধন্যবাদ! আপনার গুরুত্বপূর্ণ রিভিউ দেওয়ার জন্য!");
      setFormData({ name: "", mobile: "", email: "", address: "", details: "", rating: 0 });
      setTimeout(() => {
        setShowReviewModal(false);
        setSuccessMessage("");
      }, 3000);

    } catch (error) {
      console.error("Review submit failed:", error);
      setErrorMessage("রিভিউ সাবমিট করতে সমস্যা হয়েছে।");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-950 via-slate-900 to-black text-emerald-50 font-alinur pb-20">
      
      <StreamBuilder<any>
        stream={bannerConfigQuery}
        builder={(configs) => {
          const config = configs?.find(c => c.id === "banner_config") || {};
          
          return (
            <div className="relative w-full">
              {config.bannerUrl && (
                <div className="w-full h-48 md:h-80 overflow-hidden shadow-2xl border-b border-emerald-500/30">
                  <img src={config.bannerUrl} alt="মাদ্রাসার ব্যানার" className="w-full h-full object-cover" />
                </div>
              )}
              
              {!config.isBannerUploaded && (
                <div className="absolute top-4 right-4 z-10">
                  <label className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl shadow-lg cursor-pointer flex items-center gap-2 transition-all font-bold border border-emerald-400">
                    <Upload className="w-5 h-5" />
                    {isUploading ? "আপলোড হচ্ছে..." : "ব্যানার আপলোড করুন"}
                    <input type="file" accept="image/*" onChange={handleBannerUpload} className="hidden" disabled={isUploading} />
                  </label>
                </div>
              )}
            </div>
          );
        }}
      />

      <div className="max-w-5xl mx-auto px-4 mt-12 text-center flex justify-center items-center gap-4">
        <button 
          onClick={() => setShowReviewModal(true)}
          className="bg-gradient-to-r from-emerald-600 to-emerald-800 hover:from-emerald-500 hover:to-emerald-700 text-white px-8 py-4 rounded-full shadow-[0_0_20px_rgba(16,185,129,0.4)] hover:shadow-[0_0_30px_rgba(16,185,129,0.6)] flex items-center justify-center gap-3 text-xl font-bold transition-all hover:scale-105 border border-emerald-400/50 relative"
        >
          <MessageSquare className="w-6 h-6" />
          রিভিউ ও রেটিং দিন
        </button>
        <motion.div
          animate={{ x: [0, -10, 0], scale: [1, 1.1, 1] }}
          transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
          className="text-emerald-400 drop-shadow-[0_0_10px_rgba(52,211,153,0.8)]"
        >
          <MousePointerClick className="w-10 h-10 -rotate-12" />
        </motion.div>
      </div>

      {/* Reviews Display */}
      <div className="max-w-6xl mx-auto px-4 mt-16">
        <StreamBuilder<any>
          stream={reviewsQuery}
          builder={(reviews) => {
            if (!reviews || reviews.length === 0) {
              return (
                <div className="text-center p-12 bg-black/40 rounded-3xl border border-emerald-900/50 backdrop-blur-md">
                  <Star className="w-16 h-16 text-emerald-700 mx-auto mb-4 opacity-50" />
                  <p className="text-xl text-emerald-600/80 font-bold">এখনো কোনো রিভিউ পাওয়া যায়নি</p>
                </div>
              );
            }

            return (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {reviews.sort((a, b) => b.createdAt?.seconds - a.createdAt?.seconds).map(review => (
                  <div key={review.id} className="bg-gradient-to-br from-emerald-900/40 to-black/60 p-6 rounded-3xl border border-emerald-500/20 backdrop-blur-md hover:border-emerald-500/50 transition-all hover:-translate-y-1">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-emerald-300">{review.name}</h3>
                        <p className="text-sm text-emerald-100/50">{review.address}</p>
                      </div>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4].map(star => (
                          <Star key={star} className={`w-4 h-4 ${star <= review.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-700'}`} />
                        ))}
                      </div>
                    </div>
                    <p className="text-emerald-50/90 italic leading-relaxed text-sm">"{review.details}"</p>
                  </div>
                ))}
              </div>
            );
          }}
        />
      </div>

      {/* Review Modal */}
      <AnimatePresence>
        {showReviewModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 font-alinur"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-gradient-to-br from-slate-900 to-black border border-emerald-500/30 w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl relative"
            >
              <button 
                onClick={() => setShowReviewModal(false)}
                className="absolute top-4 right-4 text-emerald-500 hover:text-emerald-300 bg-emerald-900/30 p-2 rounded-full transition-colors z-10"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="p-8">
                <h3 className="text-3xl font-black text-emerald-400 mb-6 text-center">আপনার মতামত দিন</h3>
                
                {successMessage ? (
                  <div className="flex flex-col items-center justify-center py-10">
                    <div className="w-20 h-20 bg-emerald-900/50 rounded-full flex items-center justify-center mb-6">
                      <CheckCircle className="w-10 h-10 text-emerald-400" />
                    </div>
                    <p className="text-2xl font-bold text-emerald-300 text-center">{successMessage}</p>
                  </div>
                ) : (
                  <form onSubmit={handleReviewSubmit} className="space-y-4">
                    {errorMessage && (
                      <div className="bg-red-900/20 border border-red-500/30 text-red-400 p-4 rounded-xl flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                        <p className="text-sm">{errorMessage}</p>
                      </div>
                    )}
                    
                    <div>
                      <input 
                        type="text" 
                        value={formData.name}
                        onChange={e => setFormData({...formData, name: e.target.value})}
                        placeholder="এখানে আপনার নাম লিখুন" 
                        className="w-full bg-black/50 border border-emerald-500/30 rounded-xl px-4 py-3 text-emerald-100 placeholder:text-emerald-700 focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 transition-all font-alinur"
                      />
                    </div>
                    <div>
                      <input 
                        type="tel" 
                        value={formData.mobile}
                        onChange={e => setFormData({...formData, mobile: e.target.value})}
                        placeholder="এখানে আপনার মোবাইল নাম্বার লিখুন" 
                        className="w-full bg-black/50 border border-emerald-500/30 rounded-xl px-4 py-3 text-emerald-100 placeholder:text-emerald-700 focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 transition-all font-alinur"
                      />
                    </div>
                    <div>
                      <input 
                        type="email" 
                        value={formData.email}
                        onChange={e => setFormData({...formData, email: e.target.value})}
                        placeholder="এখানে আপনার ইমেইল লিখুন (ঐচ্ছিক)" 
                        className="w-full bg-black/50 border border-emerald-500/30 rounded-xl px-4 py-3 text-emerald-100 placeholder:text-emerald-700 focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 transition-all font-alinur"
                      />
                    </div>
                    <div>
                      <input 
                        type="text" 
                        value={formData.address}
                        onChange={e => setFormData({...formData, address: e.target.value})}
                        placeholder="এখানে আপনার ঠিকানা লিখুন" 
                        className="w-full bg-black/50 border border-emerald-500/30 rounded-xl px-4 py-3 text-emerald-100 placeholder:text-emerald-700 focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 transition-all font-alinur"
                      />
                    </div>
                    <div>
                      <textarea 
                        value={formData.details}
                        onChange={e => setFormData({...formData, details: e.target.value})}
                        placeholder="এখানে আপনার রিভিউ বিস্তারিত লিখুন" 
                        rows={4}
                        className="w-full bg-black/50 border border-emerald-500/30 rounded-xl px-4 py-3 text-emerald-100 placeholder:text-emerald-700 focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 transition-all resize-none font-alinur"
                      ></textarea>
                    </div>

                    <div className="flex justify-center gap-2 py-2">
                      {[1, 2, 3, 4].map(star => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setFormData({...formData, rating: star})}
                          className="focus:outline-none transition-transform hover:scale-110"
                        >
                          <Star className={`w-10 h-10 ${star <= formData.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-700'}`} />
                        </button>
                      ))}
                    </div>

                    <button 
                      type="submit" 
                      disabled={isSubmitting}
                      className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-4 rounded-xl shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all flex items-center justify-center gap-2"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          সাবমিট হচ্ছে...
                        </>
                      ) : (
                        "রিভিউ সাবমিট করুন"
                      )}
                    </button>
                  </form>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
