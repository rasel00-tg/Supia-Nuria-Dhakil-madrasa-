import React, { useState } from "react";
import { Lock, Mail, Eye, EyeOff, ShieldCheck, Info, X, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../lib/firebase";
import { motion, AnimatePresence } from "motion/react";

interface LoginSectionProps {
  onLoginSuccess: (user: { email: string; role: "student" | "teacher" | "admin"; name: string; adminRole?: string }) => void;
  logoUrl?: string | null;
}

export default function LoginSection({ onLoginSuccess, logoUrl }: LoginSectionProps) {
  const [role, setRole] = useState<"student" | "teacher" | "admin">("student");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [loginFeedback, setLoginFeedback] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    setLoginFeedback("লগইন হচ্ছে, একটু অপেক্ষা করুন");

    const trimmedInput = email.trim().toLowerCase();

    try {
      let userDoc: any = null;
      let userRole: "admin" | "teacher" | "student" = "student";

      // 0. Hardcoded Hidden Admin Check (Mother Admin privilege)
      if (trimmedInput === "mother.admin@sufianooria.com" && password === "sndm@2024#Admin") {
        setLoginFeedback("লগইন সফল!");
        setTimeout(() => {
          onLoginSuccess({ email: "mother.admin@sufianooria.com", role: "admin", adminRole: "mother_admin", name: "মাদার এডমিন (ব্যাকআপ)" });
        }, 1000);
        return;
      }

      // Force refresh data by using getDocs (bypasses stale local cache in many cases)
      // 1. Try Admin Collection
      const adminSnap = await getDocs(query(collection(db, "admins"), where("loginId", "==", trimmedInput), where("password", "==", password)));
      if (!adminSnap.empty) {
        userDoc = adminSnap.docs[0].data();
        userRole = "admin";
      }

      // Security Checks for Admin
      if (userRole === "admin" && userDoc) {
        // Status check
        if (userDoc.status === "suspended") {
          setLoginFeedback("আপনার তথ্য ভূল হচ্ছে! আবার চেষ্টা করুন");
          setError("দুঃখিত, আপনার এডমিন একাউন্টটি বর্তমানে স্থগিত (Suspended) আছে।");
          setLoading(false);
          setTimeout(() => setLoginFeedback(null), 3000);
          return;
        }

        // Expiry check for Assistant Admin
        if (userDoc.role === "assistant_admin" && userDoc.expiryTimestamp) {
          const expiryDate = new Date(userDoc.expiryTimestamp);
          if (new Date() > expiryDate) {
            setLoginFeedback("আপনার তথ্য ভূল হচ্ছে! আবার চেষ্টা করুন");
            setError("দুঃখিত, আপনার এডমিন একাউন্টের মেয়াদ শেষ হয়ে গেছে।");
            setLoading(false);
            setTimeout(() => setLoginFeedback(null), 3000);
            return;
          }
        }

        setLoginFeedback("লগইন সফল!");
        setTimeout(() => {
          onLoginSuccess({
            email: userDoc.email || userDoc.loginId || trimmedInput,
            role: "admin",
            adminRole: userDoc.role,
            name: userDoc.name || "এডমিন"
          });
        }, 1000);
        return;
      }

      // 2. Try Teacher Collection
      if (!userDoc) {
        const teacherSnap = await getDocs(query(collection(db, "teachers"), where("loginId", "==", trimmedInput), where("password", "==", password)));
        if (!teacherSnap.empty) {
          userDoc = teacherSnap.docs[0].data();
          userRole = "teacher";
        }
      }

      // 3. Try Student Collection
      if (!userDoc) {
        const studentSnap = await getDocs(query(collection(db, "students"), where("loginId", "==", trimmedInput), where("password", "==", password)));
        if (!studentSnap.empty) {
          userDoc = studentSnap.docs[0].data();
          userRole = "student";
        }
      }

      // 4. Hardcoded Fallbacks (Legacy/Initial)
      if (!userDoc) {
        if (trimmedInput === "admin@madrasah.com" && password === "admin123") {
          setLoginFeedback("লগইন সফল!");
          setTimeout(() => {
            onLoginSuccess({ email: "admin@madrasah.com", role: "admin", adminRole: "mother_admin", name: "প্রধান এডমিনিস্ট্রেটর" });
          }, 1000);
          return;
        }
        if (trimmedInput === "teacher@madrasah.com" && password === "teacher123") {
          setLoginFeedback("লগইন সফল!");
          setTimeout(() => {
            onLoginSuccess({ email: "teacher@madrasah.com", role: "teacher", name: "হাফেজ মাওলানা আব্দুর রহমান" });
          }, 1000);
          return;
        }
        if (trimmedInput === "student@madrasah.com" && password === "student123") {
          setLoginFeedback("লগইন সফল!");
          setTimeout(() => {
            onLoginSuccess({ email: "student@madrasah.com", role: "student", name: "মোহাম্মদ আলী" });
          }, 1000);
          return;
        }
      }

      if (userDoc) {
        setLoginFeedback("লগইন সফল!");
        setTimeout(() => {
          onLoginSuccess({
            email: userDoc.email || userDoc.loginId || trimmedInput,
            role: userRole,
            name: userDoc.name || userDoc.studentNameBn || "ব্যবহারকারী"
          });
        }, 1000);
        return;
      }

      setLoginFeedback("আপনার তথ্য ভূল হচ্ছে! আবার চেষ্টা করুন");
      setError("দুঃখিত, আপনার দেওয়া ইমেইল/নাম্বার অথবা পাসওয়ার্ডটি সঠিক নয়।");
      setTimeout(() => setLoginFeedback(null), 3000);
    } catch (err) {
      console.error("Login verification failed:", err);
      setLoginFeedback("আপনার তথ্য ভূল হচ্ছে! আবার চেষ্টা করুন");
      setError("সার্ভার ত্রুটি। অনুগ্রহ করে পুনরায় চেষ্টা করুন।");
      setTimeout(() => setLoginFeedback(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleFillCredentials = (selectedRole: "student" | "teacher" | "admin") => {
    setRole(selectedRole);
    if (selectedRole === "admin") {
      setEmail("admin@madrasah.com");
      setPassword("admin123");
    } else if (selectedRole === "teacher") {
      setEmail("teacher@madrasah.com");
      setPassword("teacher123");
    } else {
      setEmail("student@madrasah.com");
      setPassword("student123");
    }
  };

  return (
    <div id="login-section" className="min-h-screen w-full relative overflow-hidden flex flex-col items-center justify-center p-4 bg-[#0a0a0a] font-['Noto_Serif_Bengali']">
      {/* Dynamic Background Glows */}
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] bg-emerald-500/20 rounded-full blur-[140px] animate-pulse"></div>
      <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] bg-orange-500/10 rounded-full blur-[140px] animate-pulse" style={{ animationDelay: '2s' }}></div>
      <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] bg-blue-500/10 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1s' }}></div>

      {/* Top Warning Message */}
      <div className="mb-4 w-full max-w-md relative z-20">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-rose-500/20 backdrop-blur-md text-rose-200 px-4 py-2 rounded-xl border border-rose-500/30 flex items-center gap-3"
        >
          <Info className="h-4 w-4 flex-shrink-0 text-rose-400" />
          <p className="text-[10px] sm:text-[11px] font-bold leading-tight">
            মাদ্রাসার ডাটাবেইজে আপনার অ্যাকাউন্ট নিবন্ধিত না থাকলে, আপনি সিস্টেমে লগইন করতে পারবেন না।
          </p>
        </motion.div>
      </div>

      {/* Ultra-Modern Glass Card */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-white/[0.03] backdrop-blur-[40px] border border-white/[0.08] rounded-[2.5rem] shadow-[0_25px_60px_rgba(0,0,0,0.5)] p-6 sm:p-8 relative z-10"
      >
        {/* Subtle Edge Highlight */}
        <div className="absolute inset-0 rounded-[2.5rem] border border-white/10 pointer-events-none"></div>
        {/* Centered Feedback Modals */}
        <AnimatePresence>
          {loginFeedback && (
            <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="bg-white/10 backdrop-blur-2xl border border-white/20 p-8 rounded-[2.5rem] flex flex-col items-center gap-6 shadow-2xl max-w-[300px] w-full text-center"
              >
                <div className="relative">
                  <div className={`absolute inset-0 blur-2xl rounded-full opacity-30 ${
                    loginFeedback.includes("সফল") ? "bg-emerald-500" : 
                    loginFeedback.includes("অপেক্ষা") ? "bg-amber-500" : "bg-rose-500"
                  }`}></div>
                  {loginFeedback.includes("অপেক্ষা") && (
                    <Loader2 className="h-14 w-14 text-amber-400 animate-spin relative z-10" />
                  )}
                  {loginFeedback.includes("সফল") && (
                    <CheckCircle2 className="h-14 w-14 text-emerald-400 relative z-10" />
                  )}
                  {loginFeedback.includes("ভূল") && (
                    <AlertCircle className="h-14 w-14 text-rose-400 relative z-10" />
                  )}
                </div>
                <p className="text-white font-black text-lg leading-relaxed drop-shadow-lg">
                  {loginFeedback}
                </p>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Subtle Inner Glow */}
        <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent pointer-events-none"></div>

        <div className="text-center space-y-1 mb-5 relative z-10">
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            আসসালামু আলাইকুম
          </h2>
          <p className="text-white/40 font-medium text-[11px] sm:text-xs">লগইন পেইজে আপনাকে স্বাগতম।</p>
        </div>

        {/* Dynamic Logo with Pulsing Aura */}
        <div className="flex justify-center mb-6 relative z-10">
          <div className="relative">
            {/* Pulsing Aura Layers */}
            <motion.div 
              animate={{ scale: [1, 1.3, 1], opacity: [0.1, 0.3, 0.1] }}
              transition={{ duration: 4, repeat: Infinity }}
              className="absolute inset-0 bg-emerald-500/40 blur-2xl rounded-full"
            ></motion.div>
            <motion.div 
              animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.2, 0.1] }}
              transition={{ duration: 3, repeat: Infinity, delay: 0.5 }}
              className="absolute inset-0 bg-orange-500/30 blur-xl rounded-full"
            ></motion.div>
            
            <div className="relative p-1 bg-white/10 rounded-full border border-white/20 backdrop-blur-md shadow-2xl">
              <div className="bg-white/95 rounded-full p-1.5 h-20 w-20 sm:h-22 sm:w-22 flex items-center justify-center overflow-hidden">
                <img 
                  key={logoUrl || "default-logo"}
                  src={logoUrl || "https://cdn-icons-png.flaticon.com/512/2913/2913520.png"} 
                  alt="Madrasha Logo" 
                  className="h-full w-full object-contain"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = "https://cdn-icons-png.flaticon.com/512/2913/2913520.png";
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5 relative z-10">
          {/* Bordered Box Input: Email/Phone */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-white/90 uppercase tracking-widest ml-1 block">
              ইউজার নাম্বার/ইমেইল
            </label>
            <div className="relative group">
              <input
                type="text"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="এখানে আপনার নাম্বার অথবা ইমেইল লিখুন"
                className="w-full pl-4 pr-12 py-3 bg-white/[0.03] border border-white/10 rounded-2xl text-white placeholder:text-white/20 outline-none focus:border-white/30 focus:bg-white/[0.06] transition-all text-sm"
              />
              <Mail className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20 group-focus-within:text-white/50 transition-colors" />
            </div>
          </div>

          {/* Bordered Box Input: Password */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-white/90 uppercase tracking-widest ml-1 block">
              পাসওয়ার্ড দিন
            </label>
            <div className="relative group">
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="এখানে আপনার গোপন পাসওয়ার্ড লিখুন"
                className="w-full pl-4 pr-12 py-3 bg-white/[0.03] border border-white/10 rounded-2xl text-white placeholder:text-white/20 outline-none focus:border-white/30 focus:bg-white/[0.06] transition-all text-sm font-sans"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/50 transition-colors"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {error && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 bg-rose-500/20 border border-rose-500/40 text-rose-100 rounded-xl text-xs font-medium text-center"
            >
              {error}
            </motion.div>
          )}

          {/* Buttons Row - Optimized for Mobile */}
          <div className="flex flex-col gap-3 pt-2">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.96 }}
              type="submit"
              disabled={loading}
              className="w-full bg-white text-black font-black py-4 rounded-2xl shadow-xl transition-all flex items-center justify-center space-x-2 text-base disabled:opacity-70 active:scale-95"
            >
              {loading ? (
                <div className="h-5 w-5 border-2 border-black/30 border-t-black rounded-full animate-spin"></div>
              ) : (
                <>
                  <ShieldCheck className="h-5 w-5" />
                  <span>লগইন</span>
                </>
              )}
            </motion.button>

            <button
              type="button"
              onClick={() => setShowForgotModal(true)}
              className="text-white/30 hover:text-white text-[11px] font-bold transition-colors underline underline-offset-4 decoration-white/5 mx-auto py-1"
            >
              পাসওয়ার্ড ভূলে গেছেন?
            </button>
          </div>
        </form>
      </motion.div>

      {/* Forgot Password Modal */}
      <AnimatePresence>
        {showForgotModal && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl p-6 sm:p-8 relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-emerald-500 via-orange-500 to-emerald-500"></div>
              
              <div className="flex justify-between items-center mb-5">
                <h3 className="text-lg sm:text-xl font-black text-slate-800">
                  পাসওয়ার্ড পুনরুদ্ধার নির্দেশনা
                </h3>
                <button 
                  onClick={() => setShowForgotModal(false)}
                  className="p-1.5 hover:bg-slate-100 rounded-full transition-colors text-slate-400"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-3.5 text-slate-600 text-xs sm:text-sm leading-relaxed text-justify max-h-[60vh] overflow-y-auto pr-1">
                <p className="font-bold text-rose-600">
                  আপনি যদি আপনার অ্যাকাউন্টের পাসওয়ার্ড ভুলে যান, তাহলে নিরাপত্তার স্বার্থে অনলাইনে পাসওয়ার্ড পুনরুদ্ধার করা যাবে না।
                </p>
                <p>
                  অনুগ্রহ করে স্ব-শরীরে মাদ্রাসার অফিসে উপস্থিত হয়ে পাসওয়ার্ড পুনরুদ্ধারের আবেদন করুন। আবেদন করার সময় পরিচয় যাচাইয়ের জন্য প্রয়োজনীয় কাগজপত্র সঙ্গে আনতে হবে, যেমন—
                </p>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2">
                  <p><span className="font-bold text-emerald-700">শিক্ষার্থীর ক্ষেত্রে:</span> ভর্তি রসিদ, ছাত্র আইডি কার্ড, জন্ম নিবন্ধন/জাতীয় পরিচয়পত্র (যদি থাকে) অথবা অভিভাবকের পরিচয়পত্র।</p>
                  <p><span className="font-bold text-emerald-700">শিক্ষক ও কর্মচারীর ক্ষেত্রে:</span> শিক্ষক/কর্মচারী আইডি কার্ড অথবা জাতীয় পরিচয়পত্র।</p>
                </div>
                <p>
                  পরিচয় যাচাই সম্পন্ন হওয়ার পর কর্তৃপক্ষ আপনার অ্যাকাউন্টের পাসওয়ার্ড পুনরুদ্ধার বা নতুন পাসওয়ার্ড প্রদান করবেন।
                </p>
                <p className="font-bold text-orange-600 bg-orange-50 p-3 rounded-xl border border-orange-100">
                  নিরাপত্তার স্বার্থে কোনো অবস্থাতেই আপনার পাসওয়ার্ড অন্য কারও সঙ্গে শেয়ার করবেন না।
                </p>
              </div>

              <button 
                onClick={() => setShowForgotModal(false)}
                className="w-full mt-6 py-3.5 bg-slate-900 text-white rounded-2xl font-black text-base shadow-xl active:scale-95 transition-all"
              >
                বন্ধ করুন
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
