import { db, StreamBuilder } from "../lib/firebase";
import { collection, query, orderBy } from "firebase/firestore";
import { Calendar, Award, AlertTriangle, Clock, User } from "lucide-react";
import { motion } from "motion/react";

interface StaffSectionProps {
  logoUrl?: string | null;
}

// Helper to convert English numbers to Bengali numerals
const convertToBengaliDigits = (num: number | string): string => {
  const englishToBengali: Record<string, string> = {
    '0': '০', '1': '১', '2': '২', '3': '৩', '4': '৪',
    '5': '৫', '6': '৬', '7': '৭', '8': '৮', '9': '৯'
  };
  return num.toString().split('').map(char => englishToBengali[char] || char).join('');
};

// Helper to format English Date (YYYY-MM-DD) into Bengali readable format (e.g. ১৫ জানুয়ারি ২০২০)
const formatBengaliDate = (dateStr: string): string => {
  if (!dateStr) return "";
  const monthsInBengali = [
    "জানুয়ারি", "ফেব্রুয়ারি", "মার্চ", "এপ্রিল", "মে", "জুন",
    "জুলাই", "আগস্ট", "সেপ্টেম্বর", "অক্টোবর", "নভেম্বর", "ডিসেম্বর"
  ];
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    const day = date.getDate();
    const month = monthsInBengali[date.getMonth()];
    const year = date.getFullYear();
    return `${convertToBengaliDigits(day)} ${month} ${convertToBengaliDigits(year)}`;
  } catch (e) {
    return dateStr;
  }
};

// Helper to calculate total days served from joiningDate to current date
const calculateDaysServed = (joiningDateStr: string): number => {
  if (!joiningDateStr) return 0;
  try {
    const joiningDate = new Date(joiningDateStr);
    const today = new Date();
    // Set both to midnight to count full days
    joiningDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    
    const diffTime = today.getTime() - joiningDate.getTime();
    if (diffTime < 0) return 0; // Joined in the future
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  } catch (e) {
    return 0;
  }
};

export default function StaffSection({ logoUrl }: StaffSectionProps) {
  return (
    <div id="staff-section" className="py-12 bg-[#faf9f6] min-h-screen font-alinur">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 font-alinur">
        
        {/* Header Section */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200 shadow-md text-center space-y-6 relative overflow-hidden font-alinur mb-12"
        >
          {/* Subtle branding line */}
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-emerald-800 via-amber-500 to-emerald-900" />
          
          <div className="flex justify-center">
            <div className="relative p-2.5 bg-white border-2 border-emerald-800/20 rounded-full shadow-lg">
                <img 
                  src={logoUrl || "/photo/logo.png"} 
                  alt="সুফিয়া নূরীয়া দাখিল মাদ্রাসা লোগো" 
                  className="h-24 w-24 object-contain rounded-full bg-white p-0.5"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = "https://cdn-icons-png.flaticon.com/512/2913/2913520.png";
                  }}
                />
            </div>
          </div>

          <div className="space-y-3 font-alinur">
            <h1 className="text-3xl sm:text-4xl font-bold text-emerald-950 tracking-tight leading-tight">
              মাদ্রাসার কর্মচারীবৃন্দ
            </h1>
            <p className="text-sm sm:text-base text-emerald-800 font-medium max-w-2xl mx-auto leading-relaxed">
              যাদের ছাড়া একটি মাদ্রাসার দৈনন্দিন কার্যক্রম কল্পনা করা কঠিন, তাদের মর্যাদা ও সম্মান সবসময় অটুট থাকুক।
            </p>
          </div>
        </motion.div>

        {/* StreamBuilder for Staff Members - sorted by Seniority (oldest first) */}
        <StreamBuilder<any>
          stream={query(collection(db, "employees"), orderBy("joiningDate", "asc"))}
          builder={(employees, loading, error) => {
            if (loading) {
              return (
                <div className="flex flex-col items-center justify-center py-20 space-y-4 font-alinur">
                  <div className="h-12 w-12 border-4 border-emerald-800 border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-emerald-950 font-bold animate-pulse">লোড হচ্ছে, অনুগ্রহ করে অপেক্ষা করুন...</p>
                </div>
              );
            }

            if (error) {
              return (
                <div className="bg-red-50 border border-red-200 text-red-800 p-6 rounded-2xl text-center space-y-3 shadow-sm font-alinur">
                  <AlertTriangle className="h-10 w-10 text-red-600 mx-auto" />
                  <p className="font-bold text-lg">কর্মচারীদের তালিকা লোড করতে সমস্যা হয়েছে</p>
                  <p className="text-sm">অনুগ্রহ করে ইন্টারনেট কানেকশন চেক করুন অথবা কিছুক্ষণ পর আবার চেষ্টা করুন।</p>
                </div>
              );
            }

            if (!employees || employees.length === 0) {
              return (
                <div className="bg-white rounded-2xl p-12 border border-slate-200 text-center space-y-4 font-alinur shadow-sm">
                  <User className="h-12 w-12 text-slate-300 mx-auto" />
                  <h3 className="text-lg font-bold text-slate-700">কোনো কর্মচারীর প্রোফাইল পাওয়া যায়নি</h3>
                  <p className="text-sm text-slate-500">এডমিন প্যানেল থেকে নতুন কর্মচারী যুক্ত করা হলে এখানে প্রদর্শিত হবে।</p>
                </div>
              );
            }

            return (
              <motion.div 
                initial="hidden"
                animate="show"
                variants={{
                  hidden: { opacity: 0 },
                  show: {
                    opacity: 1,
                    transition: {
                      staggerChildren: 0.15
                    }
                  }
                }}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 font-alinur"
              >
                {employees.map((employee) => {
                  const daysServed = calculateDaysServed(employee.joiningDate);
                  return (
                    <motion.div
                      key={employee.id}
                      variants={{
                        hidden: { opacity: 0, scale: 0.95, y: 25 },
                        show: { opacity: 1, scale: 1, y: 0 }
                      }}
                      transition={{ duration: 0.5, ease: "easeOut" }}
                      className="relative h-[430px] rounded-[24px] overflow-hidden group font-alinur p-1.5 bg-gradient-to-br from-emerald-700 via-amber-500 to-emerald-900 shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-300"
                    >
                      {/* Inner Card Content */}
                      <div className="relative w-full h-full rounded-[18px] overflow-hidden flex flex-col justify-end p-6 bg-slate-950">
                        
                        {/* Background Employee Image (Full-Image Box) */}
                        <img 
                          src={employee.photo || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=250"} 
                          alt={employee.name} 
                          className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = "https://cdn-icons-png.flaticon.com/512/3135/3135715.png";
                          }}
                        />

                        {/* Semi-transparent Dark Overlay Mask */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-black/20" />

                        {/* Seniority badge layered on top */}
                        <div className="absolute top-4 right-4 z-10 bg-emerald-950/90 backdrop-blur-md border border-emerald-500/40 text-emerald-300 text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-md">
                          <Award className="h-3 w-3 text-amber-400" />
                          <span>জ্যেষ্ঠ কর্মচারী</span>
                        </div>

                        {/* Layered Text Content inside the bottom of the card */}
                        <div className="relative z-10 space-y-4">
                          
                          {/* Name and Designation */}
                          <div className="space-y-1">
                            <h3 className="font-bold text-white text-xl leading-snug tracking-tight drop-shadow-md">
                              {employee.name}
                            </h3>
                            <span className="inline-block px-3 py-0.5 rounded-full bg-emerald-500/20 text-[11px] font-bold text-emerald-300 border border-emerald-500/30 backdrop-blur-xs">
                              {employee.designation || "অফিস স্টাফ"}
                            </span>
                          </div>

                          {/* Elegant separator */}
                          <div className="h-px bg-white/10 w-full" />

                          {/* Joining Date and Days Served */}
                          <div className="space-y-2.5 text-xs text-slate-200">
                            
                            {/* Joining Date */}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-emerald-400 shrink-0" />
                                <span className="opacity-85 font-medium">যোগদানের তারিখ</span>
                              </div>
                              <span className="font-bold text-white drop-shadow-xs">{formatBengaliDate(employee.joiningDate)}</span>
                            </div>

                            {/* Total Days Served */}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-amber-400 shrink-0" />
                                <span className="opacity-85 font-medium">মোট কর্মকাল</span>
                              </div>
                              <span className="font-bold text-amber-300 font-mono bg-amber-500/10 px-2.5 py-0.5 rounded-md border border-amber-500/25">
                                {convertToBengaliDigits(daysServed)} দিন
                              </span>
                            </div>

                          </div>

                        </div>

                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            );
          }}
        />

      </div>
    </div>
  );
}
