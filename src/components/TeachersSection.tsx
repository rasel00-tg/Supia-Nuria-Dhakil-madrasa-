import React from "react";
import { collection, query, orderBy } from "firebase/firestore";
import { db, StreamBuilder } from "../lib/firebase";
import { Teacher } from "../types";
import { Phone, Mail, MapPin } from "lucide-react";
import { motion } from "motion/react";

const teachersQuery = query(collection(db, "teachers"), orderBy("createdAt", "desc"));

export default function TeachersSection() {
  return (
    <div className="min-h-screen bg-[#fdfdfb] font-alinur pb-20" style={{ fontFamily: 'Alinur Tatsama' }}>
      <div className="max-w-7xl mx-auto px-4 py-16 space-y-16">
        
        {/* Page Header */}
        <div className="text-center space-y-6">
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-block px-6 py-2 bg-emerald-50 text-emerald-700 rounded-full text-xs font-black uppercase tracking-[0.2em] border border-emerald-100"
          >
            আমাদের শিক্ষা পরিবার
          </motion.div>
          <motion.h2 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-4xl sm:text-5xl md:text-6xl font-black text-emerald-950 tracking-tight leading-tight"
          >
            সম্মানিত শিক্ষকবৃন্দ
          </motion.h2>
          <div className="h-2 w-32 bg-amber-500 mx-auto rounded-full shadow-lg shadow-amber-500/20"></div>
          <p className="text-slate-500 max-w-2xl mx-auto font-bold text-sm sm:text-base leading-relaxed">
            সুফিয়া নূরীয়া দাখিল মাদ্রাসার দক্ষ ও অভিজ্ঞ শিক্ষকমণ্ডলী যারা নিরলস পরিশ্রমের মাধ্যমে শিক্ষার্থীদের সুনাগরিক হিসেবে গড়ে তুলছেন।
          </p>
        </div>

        {/* Teachers Grid */}
        <StreamBuilder<Teacher>
          stream={teachersQuery}
          builder={(teachers, loading) => {
            if (loading) return (
              <div className="flex flex-col items-center justify-center py-32 space-y-6">
                <div className="w-16 h-16 border-4 border-emerald-100 border-t-emerald-700 rounded-full animate-spin"></div>
                <p className="text-emerald-900 font-black animate-pulse">সম্মানিত শিক্ষকদের তথ্য লোড হচ্ছে...</p>
              </div>
            );

            if (teachers.length === 0) return (
              <div className="text-center py-32 bg-white rounded-[3rem] border-4 border-dashed border-emerald-50">
                <p className="text-emerald-800/60 font-black text-xl">দুঃখিত, কোনো শিক্ষকের তথ্য পাওয়া যায়নি।</p>
              </div>
            );

            return (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10 md:gap-12">
                {teachers.map((teacher, idx) => (
                  <motion.div 
                    key={teacher.id}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="bg-white rounded-[3.5rem] p-8 border-2 border-emerald-50 shadow-[0_15px_50px_-20px_rgba(4,120,87,0.1)] hover:shadow-[0_25px_70px_-20px_rgba(4,120,87,0.15)] transition-all duration-500 group flex flex-col relative overflow-hidden"
                  >
                    {/* Background Pattern */}
                    <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/5 rounded-full -mr-24 -mt-24 transition-transform group-hover:scale-125 duration-700"></div>
                    
                    {/* Photo Container */}
                    <div className="relative mb-10 self-center">
                      <div className="absolute inset-0 bg-emerald-950 rounded-[2.5rem] rotate-6 group-hover:rotate-12 transition-transform duration-500 shadow-xl"></div>
                      <div className="relative w-56 h-64 overflow-hidden rounded-[2.2rem] border-4 border-white shadow-2xl bg-emerald-50">
                        <img 
                          src={teacher.photoUrl || "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80"} 
                          alt={teacher.name}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    </div>

                    {/* Basic Info */}
                    <div className="text-center space-y-4 mb-10 flex-1">
                      <h4 className="text-3xl font-black text-emerald-950 leading-tight">
                        {teacher.name}
                      </h4>
                      <div className="inline-block px-6 py-2 bg-emerald-900 text-amber-300 rounded-2xl text-xs font-black shadow-md border-b-2 border-amber-600/30">
                        {teacher.designation}
                      </div>
                      {teacher.subject && (
                        <p className="text-sm text-emerald-800/60 font-black mt-2">
                          {teacher.subject}
                        </p>
                      )}
                    </div>

                    {/* Contact Info */}
                    <div className="space-y-4 p-7 bg-emerald-50/50 rounded-[2.5rem] border border-emerald-100 transition-colors group-hover:bg-emerald-50 duration-300">
                      <div className="flex items-center gap-5">
                        <div className="w-12 h-12 flex items-center justify-center bg-white rounded-2xl shadow-sm border border-emerald-100 group-hover:scale-110 group-hover:border-amber-400 transition-all">
                          <Phone className="w-5 h-5 text-emerald-700" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] uppercase font-black text-emerald-800/30 tracking-widest mb-1">যোগাযোগ</span>
                          <span className="text-xl font-bold text-emerald-950 tracking-wide">
                            {teacher.phone}
                          </span>
                        </div>
                      </div>

                      {teacher.email && (
                        <div className="flex items-center gap-5">
                          <div className="w-12 h-12 flex items-center justify-center bg-white rounded-2xl shadow-sm border border-emerald-100 group-hover:scale-110 group-hover:border-amber-400 transition-all">
                            <Mail className="w-5 h-5 text-emerald-700" />
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="text-[10px] uppercase font-black text-emerald-800/30 tracking-widest mb-1">ইমেইল</span>
                            <span className="text-sm font-bold text-emerald-900/70 truncate" title={teacher.email}>
                              {teacher.email}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            );
          }}
        />
      </div>
    </div>
  );
}
