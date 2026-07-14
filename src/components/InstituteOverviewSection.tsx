import React, { useEffect } from "react";
import { Building2, MapPin, Phone, CheckCircle2, BookOpen, Shield, Users, Library, Sunset } from "lucide-react";
import { collection, query, doc, setDoc } from "firebase/firestore";
import { db, StreamBuilder } from "../lib/firebase";

const overviewQuery = query(collection(db, "website_overview"));

interface OverviewHighlight {
  title: string;
  desc: string;
}

interface OverviewDepartment {
  level: string;
  title: string;
  desc: string;
  footer: string;
}

interface OverviewData {
  id?: string;
  phone: string;
  location: string;
  highlights: OverviewHighlight[];
  departments: OverviewDepartment[];
  eligibility: string[];
  documents: string[];
  features: string[];
}

const DEFAULT_OVERVIEW: OverviewData = {
  phone: "01767 014 524",
  location: "নতুন পল্লান পাড়া, টেকনাফ পৌরসভা, টেকনাফ, কক্সবাজার।",
  highlights: [
    {
      title: "সিসি ক্যামেরা দ্বারা সুরক্ষিত ক্যাম্পাস",
      desc: "শিক্ষার্থীদের সার্বক্ষণিক নিরাপত্তা নিশ্চিত করতে সম্পূর্ণ ক্যাম্পাস সিসিটিভি ক্যামেরা সার্ভেইলেন্স দ্বারা সুরক্ষিত।"
    },
    {
      title: "অভিজ্ঞ ও দক্ষ শিক্ষক মণ্ডলী",
      desc: "যোগ্যতাসম্পন্ন ও অভিজ্ঞ আলেম এবং দক্ষ শিক্ষকমণ্ডলী দ্বারা আন্তরিক পাঠদান পরিচালনা করা হয়।"
    },
    {
      title: "চমৎকার লাইব্রেরি",
      desc: "ইসলামি সাহিত্য, হাদিস, তাফসির ও আধুনিক বই সমৃদ্ধ আমাদের রয়েছে একটি চমৎকার ও গোছানো লাইব্রেরি।"
    },
    {
      title: "মনোরম ইসলামি পরিবেশ",
      desc: "নৈতিক চরিত্র গঠন এবং সুন্নাহর অনুসরণে মনোরম, কোলাহলমুক্ত ও সুশৃঙ্খল দ্বীনি শিক্ষার পরিবেশ।"
    }
  ],
  departments: [
    {
      level: "প্রাথমিক স্তর",
      title: "ইবতেদায়ী শাখা",
      desc: "১ম শ্রেণী থেকে ৫ম শ্রেণী পর্যন্ত দ্বীনি শিক্ষার বুনিয়াদ সহ আধুনিক সাধারণ শিক্ষার অপূর্ব সমন্বয়।",
      footer: "কুরআন পাঠ ও প্রাথমিক কারিকুলাম"
    },
    {
      level: "হাফেজি স্তর",
      title: "নূরানী ও হিফজ বিভাগ",
      desc: "নূরানী বোর্ড সিলেবাস সহ ক্বারী প্রশিক্ষণপ্রাপ্ত শিক্ষকদের তত্ত্বাবধানে হিফজুল কুরআনের বিশেষ আয়োজন।",
      footer: "সহীহ তিলাওয়াত ও হিফজ সমাপ্তকরণ"
    },
    {
      level: "মাধ্যমিক স্তর",
      title: "দাখিল সাধারণ শাখা",
      desc: "ষষ্ঠ শ্রেণী থেকে দশম শ্রেণী পর্যন্ত বাংলাদেশ মাদ্রাসা শিক্ষা বোর্ড অনুমোদিত সরকারি সিলেবাস অনুযায়ী সাধারণ দ্বীনি ও বিজ্ঞান শিক্ষার সমন্বয়।",
      footer: "বোর্ড পরীক্ষা প্রস্তুতি ও উচ্চশিক্ষা"
    },
    {
      level: "কারি প্রশিক্ষণ স্তর",
      title: "দাখিল মুজাব্বিদ শাখা",
      desc: "ইলমে তাজবীদের নিখুঁত ও বিশেষ অধ্যয়ন সহ বিশুদ্ধ কিরাআতের মাধ্যমে আন্তর্জাতিক মানের ক্বারী হিসেবে গড়ে তোলার বিশেষ ধারা।",
      footer: "তাজবীদ ও কিরাআতের উপর বিশেষ ডিপ্লোমা"
    }
  ],
  eligibility: [
    "ইবতেদায়ী স্তরে প্লে গ্রুপ হতে ৫ম শ্রেণীতে সরাসরি বয়সের যৌক্তিকতার ভিত্তিতে ভর্তি নেওয়া হয়।",
    "দাখিল স্তরে (৬ষ্ঠ-১০ম) অন্য যেকোনো বোর্ড/মাদ্রাসা হতে পিইসি (PEC) বা সমমান পরীক্ষায় উত্তীর্ণ হতে হবে।",
    "হাফেজি বা মুজাব্বিদ বিভাগে ভর্তির জন্য ছাত্রের নূন্যতম হাফেজি পড়ার তীব্র আকাঙ্ক্ষা ও মেধা থাকতে হবে।"
  ],
  documents: [
    "শিক্ষার্থীর অনলাইন জন্ম নিবন্ধন সার্টিফিকেটের স্পষ্ট ফটোকপি (১ কপি)।",
    "পিতা ও মাতার জাতীয় পরিচয়পত্রের ফটোকপি (NID) (১ কপি করে)।",
    "পূর্ববর্তী শিক্ষা প্রতিষ্ঠান থেকে প্রাপ্ত ট্রান্সক্রিপ্ট/মার্কশিট বা প্রশংসাপত্র (প্রযোজ্য ক্ষেত্রে)।",
    "শিক্ষার্থীর পাসপোর্ট সাইজের সদ্য তোলা রঙিন ছবি (২ কপি)।"
  ],
  features: [
    "দক্ষ ও অভিজ্ঞতাসম্পন্ন পরিচালনা কমিটি দ্বারা পরিচালিত।",
    "ইসলামী ও আধুনিক শিক্ষার চমৎকার সমন্বয়।",
    "অর্থ সহ বিশুদ্ধ কোরআন শিক্ষার বিশেষ ব্যবস্থা।",
    "অভিজ্ঞ ও প্রশিক্ষণ প্রাপ্ত শিক্ষক মণ্ডলী দ্বারা পাঠদান।",
    "দক্ষ ও ক্বারী প্রশিক্ষণ প্রাপ্ত হাফেজ দ্বারা হিফজ বিভাগ পরিচালনা।",
    "সমৃদ্ধ একাডেমিক ভবন ও মনোরম পরিবেশ।",
    "কম্পিউটার প্রশিক্ষণ, আরবী ও ইংরেজী ভাষার উপর বিশেষ গুরুত্বারোপ।",
    "নিয়মিত ক্লাস টেস্ট ও মাসিক পরীক্ষার মাধ্যমে পাঠ মূল্যায়ন।",
    "ছাত্র-ছাত্রীদের অগ্রগতি সম্পর্কে অভিভাবকদের অবহিতকরণ।",
    "নৈতিকতা ও মূল্যবোধ শিক্ষা।",
    "নিয়মিত সাপ্তাহিক সাংস্কৃতিক অনুষ্ঠান ও শরীর চর্চার সু-ব্যবস্থা।",
    "বার্ষিক ক্রীড়া ও সাংস্কৃতিক অনুষ্ঠান।",
    "সার্বক্ষণিক সিসি (CC) ক্যামেরা দ্বারা নিয়ন্ত্রিত।"
  ]
};

const iconMap = [Shield, Users, Library, Sunset];
const colorMap = [
  "border-emerald-600 bg-emerald-50/50",
  "border-amber-500 bg-amber-50/50",
  "border-emerald-600 bg-emerald-50/50",
  "border-amber-500 bg-amber-50/50"
];
const borderMap = [
  "border-t-emerald-600",
  "border-t-amber-500",
  "border-t-emerald-600",
  "border-t-amber-500"
];
const footerColorMap = [
  "text-emerald-800",
  "text-amber-700",
  "text-emerald-800",
  "text-amber-700"
];

export default function InstituteOverviewSection() {
  return (
    <StreamBuilder<OverviewData>
      stream={overviewQuery}
      builder={(overviewList, loading, error) => {
        const overview = overviewList && overviewList.length > 0 ? overviewList[0] : null;

        // Auto seeding if empty
        useEffect(() => {
          if (!loading && (!overviewList || overviewList.length === 0)) {
            setDoc(doc(db, "website_overview", "main"), DEFAULT_OVERVIEW)
              .then(() => console.log("Seeded website overview default data"))
              .catch((err) => console.error("Error seeding default overview:", err));
          }
        }, [loading, overviewList]);

        if (loading) {
          return (
            <div className="py-12 text-center text-gray-400 font-sans animate-pulse">
              তথ্য লোড হচ্ছে...
            </div>
          );
        }

        const data = overview || DEFAULT_OVERVIEW;

        return (
          <div id="institute-overview-section" className="space-y-10 py-6 w-full px-2">
            {/* Header Banner */}
            <div className="bg-emerald-950 text-white p-8 rounded-2xl relative overflow-hidden shadow-lg border-b-8 border-amber-500">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-emerald-800/60 via-emerald-950 to-emerald-950 mix-blend-multiply opacity-90 z-0"></div>
              <div className="absolute inset-0 bg-[linear-gradient(to_right,#047857_1px,transparent_1px),linear-gradient(to_bottom,#047857_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-10"></div>
              
              <div className="relative z-10 text-center space-y-4">
                <div className="inline-flex items-center justify-center p-3.5 bg-emerald-800/50 rounded-full border border-emerald-700/50 mb-2 shadow-inner">
                  <Building2 className="h-9 w-9 text-amber-400" />
                </div>
                <h2 className="text-3xl md:text-5xl font-bold font-serif text-white tracking-tight">
                  সুফিয়া নূরিয়া দাখিল মাদ্রাসা
                </h2>
                <p className="text-xs font-mono tracking-widest text-emerald-300">
                  SUFIA NOORIA DAKHIL MADRASAH
                </p>
                
                <div className="flex flex-col md:flex-row items-center justify-center gap-4 sm:gap-8 pt-4 text-emerald-100 text-sm md:text-base border-t border-emerald-800/60 max-w-2xl mx-auto">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-amber-400 shrink-0" />
                    <span>{data.location}</span>
                  </div>
                  <div className="hidden md:block h-6 w-px bg-emerald-800"></div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-5 w-5 text-amber-400 shrink-0" />
                    <span className="font-sans font-bold text-amber-300">{data.phone}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Highlights / Special Features Bento */}
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-emerald-950 font-serif flex items-center gap-2 border-b-2 border-emerald-100 pb-2">
                <Shield className="h-5.5 w-5.5 text-emerald-800" />
                মাদ্রাসার অনন্য বৈশিষ্ট্যসমূহ
              </h3>
              <div className="grid sm:grid-cols-2 gap-4 pt-2">
                {(data.highlights || DEFAULT_OVERVIEW.highlights).map((h, i) => {
                  const Icon = iconMap[i] || Shield;
                  const colorClass = colorMap[i] || "border-emerald-600 bg-emerald-50/50";
                  return (
                    <div 
                      key={i} 
                      className={`p-5 rounded-xl border-l-4 ${colorClass} border border-slate-200/60 shadow-xs flex gap-4 hover:shadow-md transition-all`}
                    >
                      <div className="h-10 w-10 rounded-lg bg-white border border-slate-100 shadow-xs flex items-center justify-center shrink-0">
                        <Icon className="h-5 w-5 text-emerald-850" />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm sm:text-base text-emerald-950 font-serif leading-snug">{h.title}</h4>
                        <p className="text-xs sm:text-sm text-gray-600 mt-1.5 leading-relaxed">{h.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Departments Section */}
            <div className="space-y-4 pt-4">
              <h3 className="text-xl font-bold text-emerald-950 font-serif flex items-center gap-2 border-b-2 border-emerald-100 pb-2">
                <BookOpen className="h-5.5 w-5.5 text-emerald-800" />
                মাদ্রাসার শিক্ষা বিভাগসমূহ
              </h3>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 pt-2">
                {(data.departments || DEFAULT_OVERVIEW.departments).map((dept, i) => {
                  const borderClass = borderMap[i] || "border-t-emerald-600";
                  const footerColorClass = footerColorMap[i] || "text-emerald-800";
                  return (
                    <div key={i} className={`bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow border-t-4 ${borderClass} flex flex-col justify-between`}>
                      <div>
                        <span className={`text-[10px] uppercase font-mono font-bold block mb-1 ${footerColorClass}`}>{dept.level}</span>
                        <h4 className="text-base font-bold text-emerald-950 font-serif mb-2">{dept.title}</h4>
                        <p className="text-gray-600 text-xs sm:text-sm leading-relaxed">
                          {dept.desc}
                        </p>
                      </div>
                      <div className={`mt-4 pt-3 border-t border-gray-100 text-xs font-bold ${footerColorClass}`}>
                        {dept.footer}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Admission Eligibility Section */}
            <div className="space-y-4 pt-4 animate-fade-in">
              <h3 className="text-xl font-bold text-emerald-950 font-serif flex items-center gap-2 border-b-2 border-emerald-100 pb-2">
                <CheckCircle2 className="h-5.5 w-5.5 text-emerald-800" />
                ভর্তির যোগ্যতা ও প্রয়োজনীয় কাগজপত্র
              </h3>
              <div className="grid md:grid-cols-2 gap-6 pt-2">
                <div className="bg-gradient-to-br from-emerald-800 to-emerald-900 text-white rounded-xl p-6 shadow-sm border border-emerald-700">
                  <h4 className="font-bold text-base font-serif text-amber-400 mb-3 border-b border-emerald-700/60 pb-1.5 flex items-center gap-1.5">
                    <span>🎯</span> সাধারণ শিক্ষাগত যোগ্যতা ও বয়সসীমা
                  </h4>
                  <ul className="space-y-2.5 text-xs sm:text-sm text-emerald-50">
                    {(data.eligibility || DEFAULT_OVERVIEW.eligibility).map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-amber-400 shrink-0">✔</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm border-l-4 border-l-amber-500">
                  <h4 className="font-bold text-base font-serif text-emerald-950 mb-3 border-b border-gray-100 pb-1.5 flex items-center gap-1.5">
                    <span>📂</span> প্রয়োজনীয় দাখিলযোগ্য কাগজপত্র
                  </h4>
                  <ul className="space-y-2.5 text-xs sm:text-sm text-gray-700">
                    {(data.documents || DEFAULT_OVERVIEW.documents).map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-emerald-700 shrink-0">📌</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* General Features List */}
            <div className="space-y-4 pt-4">
              <h3 className="text-xl font-bold text-emerald-950 font-serif flex items-center gap-2 border-b-2 border-emerald-100 pb-2">
                <CheckCircle2 className="h-5.5 w-5.5 text-emerald-800" />
                অন্যান্য সুযোগ-সুবিধা ও পরিচিতি বৈশিষ্ট্যসমূহ
              </h3>
              <div className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 shadow-sm">
                <ul className="grid md:grid-cols-2 gap-4">
                  {(data.features || DEFAULT_OVERVIEW.features).map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <div className="mt-0.5 min-w-[20px]">
                        <div className="h-5 w-5 rounded-full bg-emerald-100 flex items-center justify-center">
                          <div className="h-2 w-2 rounded-full bg-emerald-600"></div>
                        </div>
                      </div>
                      <span className="text-sm text-gray-700 leading-relaxed font-medium">
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        );
      }}
    />
  );
}
