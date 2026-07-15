import { collection } from "firebase/firestore";
import { db, StreamBuilder } from "../lib/firebase";
import { GraduationCap, Users, BookOpen, Award, Sparkles, Heart } from "lucide-react";
import { motion } from "motion/react";

interface StudentsSectionProps {
  logoUrl?: string | null;
}

export default function StudentsSection({ logoUrl }: StudentsSectionProps) {
  // Ordered classes as requested (11 standard classes)
  const classList = [
    { name: "শিশু শ্রেণী", icon: Heart, bg: "from-emerald-50 to-teal-50 border-emerald-200", text: "text-emerald-800", iconBg: "bg-emerald-100" },
    { name: "১ম শ্রেণী", icon: GraduationCap, bg: "from-amber-50/50 to-orange-50/50 border-amber-200", text: "text-amber-800", iconBg: "bg-amber-100" },
    { name: "২য় শ্রেণী", icon: BookOpen, bg: "from-sky-50 to-blue-50 border-sky-200", text: "text-sky-800", iconBg: "bg-sky-100" },
    { name: "৩য় শ্রেণী", icon: Users, bg: "from-purple-50 to-fuchsia-50 border-purple-200", text: "text-purple-800", iconBg: "bg-purple-100" },
    { name: "৪র্থ শ্রেণী", icon: Award, bg: "from-rose-50 to-red-50 border-rose-200", text: "text-rose-800", iconBg: "bg-rose-100" },
    { name: "৫ম শ্রেণী", icon: Sparkles, bg: "from-emerald-50/70 to-emerald-100/30 border-emerald-300", text: "text-emerald-900", iconBg: "bg-emerald-200/60" },
    { name: "৬ষ্ঠ শ্রেণী", icon: GraduationCap, bg: "from-teal-50 to-cyan-50 border-teal-200", text: "text-teal-800", iconBg: "bg-teal-100" },
    { name: "৭ম শ্রেণী", icon: BookOpen, bg: "from-orange-50 to-amber-50 border-orange-200", text: "text-orange-800", iconBg: "bg-orange-100" },
    { name: "৮ম শ্রেণী", icon: Users, bg: "from-indigo-50 to-violet-50 border-indigo-200", text: "text-indigo-800", iconBg: "bg-indigo-100" },
    { name: "৯ম শ্রেণী", icon: Award, bg: "from-pink-50 to-rose-50 border-pink-200", text: "text-pink-800", iconBg: "bg-pink-100" },
    { name: "১০ম শ্রেণী", icon: Sparkles, bg: "from-emerald-50 to-teal-100/50 border-emerald-400", text: "text-emerald-950", iconBg: "bg-emerald-200" }
  ];

  return (
    <div id="students-section" className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 w-full bg-[#fdfdfb] select-none font-alinur">
      <div className="max-w-6xl mx-auto space-y-12">
        
        {/* Realtime Stream Wrapper */}
        <StreamBuilder<any>
          stream={collection(db, "students")}
          builder={(students, loading, error) => {
            const totalCount = students.length;
            const hifzCount = students.filter(s => s.className === "হিফজ বিভাগ").length;

            return (
              <div className="space-y-12">
                
                {/* 1. Live Animated Counter Card (Top Position - Compact, Ultra-Vibrant Neon & Orbit Animations) */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="relative overflow-hidden rounded-3xl p-5 sm:p-7 text-white shadow-2xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-amber-400 border-2 border-emerald-300 shadow-[0_0_25px_rgba(20,184,166,0.35)] font-alinur"
                >
                  {/* Neon ambient backing highlights */}
                  <div className="absolute -right-24 -top-24 w-56 h-56 bg-amber-300/20 rounded-full blur-3xl animate-pulse"></div>
                  <div className="absolute -left-24 -bottom-24 w-56 h-56 bg-teal-400/25 rounded-full blur-3xl"></div>

                  {/* Live Status Indicator Badge with Pulsing Dot and Spinning Wheel */}
                  <div className="absolute right-4 top-4 flex items-center gap-2 bg-black/30 backdrop-blur-md border border-white/20 rounded-full px-3 py-1 shadow-xs">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-300 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-400"></span>
                    </span>
                    <span className="text-[11px] font-extrabold text-white tracking-wider">লাইভ আপডেট</span>
                    <div className="w-3 h-3 border-2 border-white/25 border-t-white rounded-full animate-spin"></div>
                  </div>

                  <div className="flex flex-col items-center text-center space-y-4 py-2">
                    
                    {/* Compact central container with rotating orbiting items */}
                    <div className="relative w-36 h-36 flex items-center justify-center">
                      
                      {/* Pulse and ripple backdrop effects */}
                      <div className="absolute w-24 h-24 bg-white/10 rounded-full animate-ping duration-[1.5s]"></div>
                      <div className="absolute w-20 h-20 bg-white/15 rounded-full animate-pulse"></div>
                      
                      {/* Central Main Icon */}
                      <div className="relative z-10 bg-white text-teal-600 p-4 rounded-full shadow-lg transform hover:scale-110 transition-transform duration-300">
                        <Users className="h-8 w-8" />
                      </div>
                      
                      {/* Subtly faded circular orbit trace */}
                      <div className="absolute w-28 h-28 border border-white/15 rounded-full"></div>
                      
                      {/* Orbiting Ring Container (Continuous Rotation) */}
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 12, ease: "linear" }}
                        className="absolute w-28 h-28"
                      >
                        {/* Orbit Item 1 (GraduationCap) at top of orbit */}
                        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                          <motion.div
                            animate={{ rotate: -360 }}
                            transition={{ repeat: Infinity, duration: 12, ease: "linear" }}
                            className="bg-emerald-500 text-white p-1 rounded-full border border-emerald-300 shadow-md flex items-center justify-center"
                          >
                            <GraduationCap className="h-3.5 w-3.5" />
                          </motion.div>
                        </div>

                        {/* Orbit Item 2 (BookOpen) at bottom of orbit */}
                        <div className="absolute -bottom-3.5 left-1/2 -translate-x-1/2">
                          <motion.div
                            animate={{ rotate: -360 }}
                            transition={{ repeat: Infinity, duration: 12, ease: "linear" }}
                            className="bg-amber-500 text-white p-1 rounded-full border border-amber-300 shadow-md flex items-center justify-center"
                          >
                            <BookOpen className="h-3.5 w-3.5" />
                          </motion.div>
                        </div>

                        {/* Orbit Item 3 (Award) at left of orbit */}
                        <div className="absolute top-1/2 -left-3.5 -translate-y-1/2">
                          <motion.div
                            animate={{ rotate: -360 }}
                            transition={{ repeat: Infinity, duration: 12, ease: "linear" }}
                            className="bg-teal-500 text-white p-1 rounded-full border border-teal-300 shadow-md flex items-center justify-center"
                          >
                            <Award className="h-3.5 w-3.5" />
                          </motion.div>
                        </div>

                        {/* Orbit Item 4 (Sparkles) at right of orbit */}
                        <div className="absolute top-1/2 -right-3.5 -translate-y-1/2">
                          <motion.div
                            animate={{ rotate: -360 }}
                            transition={{ repeat: Infinity, duration: 12, ease: "linear" }}
                            className="bg-purple-500 text-white p-1 rounded-full border border-purple-300 shadow-md flex items-center justify-center"
                          >
                            <Sparkles className="h-3.5 w-3.5" />
                          </motion.div>
                        </div>
                      </motion.div>
                    </div>

                    {/* Server-Based Live Text Description */}
                    <div className="space-y-3 px-2 max-w-3xl">
                      <h3 className="text-xl sm:text-2xl lg:text-3xl font-black leading-relaxed tracking-wide drop-shadow-xs font-alinur text-white">
                        আমাদের মাদ্রাসায়{" "}
                        <motion.span 
                          key={totalCount}
                          initial={{ scale: 0.8 }}
                          animate={{ scale: 1 }}
                          className="inline-block px-4 py-1 bg-amber-400 text-emerald-950 font-black rounded-xl mx-1 shadow-md transform hover:scale-105 transition-transform duration-300"
                        >
                          {loading ? "..." : totalCount}
                        </motion.span>{" "}
                        শিক্ষার্থী নিয়ে এগিয়ে যাচ্ছে আলহামদুলিল্লাহ।
                      </h3>
                      <p className="text-xs sm:text-sm font-medium text-emerald-100 bg-black/15 rounded-xl py-2 px-4 max-w-xl mx-auto border border-white/10">
                        (মাদ্রাসার অফিসিয়াল সার্ভার থেকে কালেক্টেড লাইভ শিক্ষার্থীর সংখ্যা কাউন্ট হচ্ছে।)
                      </p>
                    </div>
                  </div>
                </motion.div>

                {/* 2. Grid of Cards & Highlighted Hifz Section (Middle Position) */}
                <div className="space-y-8 font-alinur">
                  <div className="flex items-center gap-3 border-b-2 border-emerald-100 pb-3">
                    <span className="text-xl">📊</span>
                    <h3 className="text-xl font-bold text-emerald-900">শ্রেণী ও বিভাগ ভিত্তিক শিক্ষার্থী বিবরণী</h3>
                  </div>

                  {/* Top: Specially Highlighted Hifz Card with English Numbers */}
                  <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-emerald-950 rounded-3xl p-6 sm:p-8 border-2 border-amber-300 shadow-lg relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6 hover:shadow-xl transition-all duration-300 group"
                  >
                    {/* Glowing golden element */}
                    <div className="absolute right-0 top-0 w-32 h-32 bg-white/10 rounded-full blur-xl transform group-hover:scale-125 transition-transform duration-500"></div>
                    
                    <div className="flex items-center gap-4 text-center md:text-left flex-col md:flex-row">
                      <div className="bg-white/90 p-4 rounded-2xl border border-amber-300 shadow-inner text-amber-600 transform group-hover:rotate-6 transition-transform">
                        <BookOpen className="h-10 w-10" />
                      </div>
                      <div className="space-y-1">
                        <span className="text-xs font-extrabold tracking-widest text-emerald-900 bg-white/40 px-2.5 py-0.5 rounded-full uppercase">বিশেষ বিভাগ</span>
                        <h4 className="text-2xl sm:text-3xl font-black text-emerald-950">হিফজ বিভাগ</h4>
                        <p className="text-xs sm:text-sm text-emerald-900/90 font-medium max-w-md">
                          পবিত্র আল-কুরআন হিফজ করার জন্য নিবেদিতপ্রাণ খুদে হাফেজদের রিয়েল-টাইমে সংগৃহীত লাইভ পরিসংখ্যান।
                        </p>
                      </div>
                    </div>

                    <div className="flex items-baseline gap-2 bg-emerald-950 text-amber-400 border-2 border-amber-300/40 px-6 py-3 rounded-2xl shadow-inner min-w-[140px] justify-center">
                      <span className="text-3xl sm:text-4xl font-black tracking-tight">
                        {loading ? "..." : hifzCount}
                      </span>
                      <span className="text-xs font-bold text-emerald-100">জন</span>
                    </div>
                  </motion.div>

                  {/* Bottom: 11 Classes Grid with English Numbers */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {classList.map((cls, idx) => {
                      const count = students.filter(s => s.className === cls.name).length;
                      return (
                        <motion.div
                          key={cls.name}
                          initial={{ opacity: 0, y: 15 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.1 + idx * 0.05 }}
                          className={`bg-gradient-to-br ${cls.bg} rounded-2xl p-5 border shadow-xs flex items-center justify-between hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 group`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`${cls.iconBg} p-3 rounded-xl ${cls.text} transition-transform group-hover:scale-110 duration-300`}>
                              <cls.icon className="h-5 w-5" />
                            </div>
                            <div>
                              <h4 className="font-bold text-base text-slate-800">{cls.name}</h4>
                              <p className="text-[10px] text-slate-500">অনলাইন সরাসরি সিঙ্ক</p>
                            </div>
                          </div>

                          <div className={`flex items-baseline gap-1 bg-white border border-slate-100 shadow-inner px-4 py-2 rounded-xl min-w-[70px] justify-center ${cls.text}`}>
                            <span className="text-xl sm:text-2xl font-black tracking-tight">
                              {loading ? "..." : count}
                            </span>
                            <span className="text-[10px] font-bold text-slate-500">জন</span>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>

                {/* 3. Official Logo & Madrasah Name (Bottom Position - Elegant and Decent Card) */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-gradient-to-br from-emerald-850 to-emerald-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border-b-8 border-amber-500 relative overflow-hidden text-center flex flex-col items-center justify-center space-y-4 font-alinur"
                >
                  {/* Decorative background ambient lights */}
                  <div className="absolute -right-16 -top-16 w-48 h-48 bg-amber-500/10 rounded-full blur-2xl"></div>
                  <div className="absolute -left-16 -bottom-16 w-48 h-48 bg-emerald-500/10 rounded-full blur-2xl"></div>

                  {/* Logo Container */}
                  <div className="bg-white/95 p-3 rounded-full shadow-lg border-2 border-amber-400 flex items-center justify-center transform hover:scale-105 transition-transform duration-300">
                    <img 
                      src="/photo/logo.png" 
                      alt="মাদ্রাসা লোগো" 
                      className="h-16 w-16 sm:h-20 sm:w-20 object-contain rounded-full"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = "https://cdn-icons-png.flaticon.com/512/2913/2913520.png";
                      }}
                    />
                  </div>

                  {/* Madrasa Title and Subtitle */}
                  <div className="space-y-1">
                    <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-amber-400 tracking-wide drop-shadow-md">
                      সুফিয়া নূরীয়া দাখিল মাদ্রাসা
                    </h2>
                    <p className="text-xs sm:text-sm text-emerald-100 font-medium tracking-widest opacity-90">
                      Sufia Nooria Dakhil Madrasah
                    </p>
                  </div>
                </motion.div>

              </div>
            );
          }}
        />

      </div>
    </div>
  );
}
