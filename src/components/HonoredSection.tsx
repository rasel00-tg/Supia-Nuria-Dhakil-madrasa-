import { useState } from "react";
import { collection } from "firebase/firestore";
import { db, StreamBuilder } from "../lib/firebase";
import { HonoredPerson } from "../types";
import { Heart, ArrowLeft, Award, Calendar } from "lucide-react";
import { motion } from "motion/react";

export default function HonoredSection() {
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null);

  return (
    <div id="honored-section" className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 w-full bg-[#fdfdfb] select-none font-alinur space-y-8">
      
      {/* Mandatory Firestore StreamBuilder Implementation */}
      <StreamBuilder<HonoredPerson>
        stream={collection(db, "honored_persons")}
        builder={(honoredPersons, loading, error) => {
          if (loading) {
            return (
              <div className="py-12 text-center text-slate-400 font-alinur font-semibold">
                তথ্য লোড হচ্ছে...
              </div>
            );
          }

          if (error) {
            return (
              <div className="py-12 text-center text-red-500 font-alinur font-semibold">
                তথ্য লোড করার সময় সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।
              </div>
            );
          }

          if (honoredPersons.length === 0) {
            return (
              <div className="py-12 text-center text-slate-500 font-alinur bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                কোনো তথ্য পাওয়া যায়নি।
              </div>
            );
          }

          // If a person is selected, show their full biography details view
          if (selectedPersonId) {
            const person = honoredPersons.find((p) => p.id === selectedPersonId);
            
            // If the person is not found (e.g. deleted by admin in real-time), go back to list
            if (!person) {
              setSelectedPersonId(null);
              return null;
            }

            return (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-4xl mx-auto space-y-6 font-alinur pt-2"
              >
                {/* Back Button */}
                <button
                  onClick={() => setSelectedPersonId(null)}
                  className="flex items-center gap-2 text-emerald-800 hover:text-emerald-950 font-black bg-emerald-50 hover:bg-emerald-100 px-5 py-2.5 rounded-xl transition-all border border-emerald-200 shadow-xs cursor-pointer"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>তালিকায় ফিরে যান</span>
                </button>

                {/* Detailed view container */}
                <div className="bg-white rounded-3xl border border-slate-100 shadow-lg overflow-hidden font-alinur">
                  <div className="grid md:grid-cols-5 gap-8 p-6 sm:p-10 font-alinur">
                    {/* Left Column: Picture */}
                    <div className="md:col-span-2 space-y-4">
                      <div className="relative rounded-2xl overflow-hidden border border-slate-200/60 shadow-md bg-emerald-50 h-[350px]">
                        <img
                          src={person.imageUrl}
                          alt={person.name}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                        
                        {/* Gradient overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/70 via-transparent to-transparent"></div>

                        {/* 1. Only "শ্রদ্ধাঞ্জলি" Live Animation Badge (No "শোকাহত") */}
                        <div className="absolute top-4 left-4 z-10">
                          <motion.div
                            animate={{ 
                              scale: [1, 1.05, 1],
                              opacity: [0.95, 1, 0.95]
                            }}
                            transition={{ 
                              repeat: Infinity, 
                              duration: 2, 
                              ease: "easeInOut" 
                            }}
                            className="bg-emerald-900/90 border border-amber-400/50 text-amber-400 text-xs font-black tracking-wider px-3.5 py-1.5 rounded-xl flex items-center gap-2 shadow-lg"
                          >
                            <span className="relative flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                            </span>
                            শ্রদ্ধাঞ্জলি
                          </motion.div>
                        </div>

                        {/* Lifespan Banner */}
                        <div className="absolute bottom-4 left-4 text-white z-10">
                          <span className="inline-flex items-center space-x-1 text-xs font-bold bg-amber-400 text-emerald-950 px-3.5 py-1.5 rounded-xl shadow-md border border-amber-300">
                            <Calendar className="h-3.5 w-3.5 text-red-600 mr-1.5" />
                            জীবনকাল: {person.birth_death}
                          </span>
                        </div>
                      </div>
                      
                      {/* Sub footer badge */}
                      <div className="bg-emerald-50/50 border border-emerald-100 p-4 rounded-xl text-center">
                        <span className="text-xs font-bold text-emerald-900 block">স্মরণীয় অবদানের স্বীকৃতি</span>
                        <span className="text-[11px] text-amber-600 font-extrabold mt-1 inline-block">🌸 অনন্য অবদানের জন্য সুফিদা সুপরিচিত</span>
                      </div>
                    </div>

                    {/* Right Column: Name, Contribution Biography */}
                    <div className="md:col-span-3 space-y-6 flex flex-col justify-between font-alinur">
                      <div className="space-y-4 font-alinur">
                        <div className="space-y-2">
                          <span className="text-xs font-black bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full uppercase tracking-wider">
                            স্মরণীয় ব্যক্তিত্ব
                          </span>
                          <h2 className="text-2xl sm:text-3xl font-black text-emerald-950 leading-snug pt-1">
                            {person.name}
                          </h2>
                          <div className="h-1 w-20 bg-amber-500 rounded-full mt-1"></div>
                        </div>

                        <div className="space-y-3 font-alinur">
                          <h4 className="text-sm font-black text-emerald-900 flex items-center gap-1.5">
                            <Award className="h-4 w-4 text-amber-500" />
                            <span>অবদান ও জীবনীর বিস্তারিত বিবরণ:</span>
                          </h4>
                          <p className="text-slate-700 leading-relaxed text-justify text-sm sm:text-base font-medium whitespace-pre-wrap bg-slate-50/50 rounded-2xl p-4 sm:p-5 border border-slate-100">
                            {person.contribution}
                          </p>
                        </div>
                      </div>

                      {/* Footer Signature */}
                      <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400 font-bold">
                        <span>দাখিল মাদ্রাসা অফিশিয়াল আর্কাইভ</span>
                        <span>রিয়েল-টাইম তথ্য</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          }

          // List View of Honored Persons
          return (
            <div className="space-y-8 font-alinur">
              {/* Page Heading & Title */}
              <div className="text-center w-full space-y-2">
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-emerald-900 font-alinur">
                  স্মরণীয় ব্যক্তিবর্গ
                </h2>
                <p className="text-sm sm:text-base font-semibold text-slate-500 font-alinur">
                  মাদ্রাসার প্রতিষ্ঠা ও অনন্য অবদানে যাদের ত্যাগ চিরস্মরণীয়
                </p>
                <div className="h-1.5 w-24 bg-amber-500 mx-auto rounded-full mt-3"></div>
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8 w-full pt-4 font-alinur">
                {honoredPersons.map((person) => (
                  <div
                    key={person.id}
                    className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col justify-between group hover:shadow-md transition-shadow duration-300 font-alinur"
                  >
                    <div>
                      {/* Profile image with subtle corner live status animated badges */}
                      <div className="relative h-64 bg-emerald-50 overflow-hidden">
                        <img
                          src={person.imageUrl}
                          alt={person.name}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        
                        {/* Gradient overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/85 via-emerald-950/25 to-transparent"></div>
                        
                        {/* 1. Only "শ্রদ্ধাঞ্জলি" Live Animation Badge (No "শোকাহত") */}
                        <div className="absolute top-3 left-3 z-10">
                          <motion.div
                            animate={{ 
                              scale: [1, 1.05, 1],
                              opacity: [0.9, 1, 0.9]
                            }}
                            transition={{ 
                              repeat: Infinity, 
                              duration: 2, 
                              ease: "easeInOut"
                            }}
                            className="bg-emerald-950/90 border border-amber-400/40 text-amber-400 text-[10px] font-extrabold tracking-wider px-2.5 py-1.5 rounded-xl flex items-center gap-1.5 shadow-md font-alinur"
                          >
                            <span className="relative flex h-1.5 w-1.5">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-500"></span>
                            </span>
                            শ্রদ্ধাঞ্জলি
                          </motion.div>
                        </div>

                        {/* Lifespan lifespan banner */}
                        <div className="absolute bottom-4 left-4 text-white z-10">
                          <span className="inline-flex items-center space-x-1 text-xs font-bold bg-amber-400 text-emerald-950 px-2.5 py-1 rounded-lg shadow-md font-alinur border border-amber-300">
                            <Heart className="h-3.5 w-3.5 text-red-600 fill-red-600 mr-1 animate-pulse" />
                            {person.birth_death}
                          </span>
                        </div>
                      </div>

                      {/* Description Text with Custom Font and Line Clamp Truncation */}
                      <div className="p-6 space-y-3 font-alinur">
                        <h3 className="font-extrabold text-xl text-emerald-900 font-alinur leading-tight group-hover:text-emerald-700 transition-colors">
                          {person.name}
                        </h3>
                        <p className="text-sm text-slate-600 leading-relaxed text-justify font-alinur font-medium line-clamp-3">
                          {person.contribution}
                        </p>
                      </div>
                    </div>

                    {/* Truncated detailed view button redirection & bottom bar */}
                    <div className="px-6 pb-6 pt-1 font-alinur">
                      <button
                        onClick={() => setSelectedPersonId(person.id)}
                        className="w-full flex items-center justify-center gap-2 bg-emerald-800 hover:bg-emerald-900 text-amber-400 font-extrabold py-2 px-4 rounded-xl text-xs transition-all shadow-xs cursor-pointer hover:scale-[1.02] transform"
                      >
                        বিস্তারিত পড়ুন →
                      </button>
                    </div>

                    {/* Bottom strip with continuous scrolling marquee prayer */}
                    <div className="py-3 bg-emerald-50/50 border-t border-slate-100 overflow-hidden relative font-alinur flex w-full">
                      <motion.div
                        className="whitespace-nowrap text-xs font-black text-emerald-850"
                        animate={{ x: ["100%", "-100%"] }}
                        transition={{
                          ease: "linear",
                          duration: 12,
                          repeat: Infinity,
                        }}
                      >
                        আল্লাহ মরহুমকে জান্নাতুল ফেরদৌসের মেহমান হিসেবে কবুল করুক
                      </motion.div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        }}
      />
    </div>
  );
}
