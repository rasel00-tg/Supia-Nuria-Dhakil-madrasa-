import React from "react";
import { collection, query } from "firebase/firestore";
import { db, StreamBuilder } from "../lib/firebase";
import { Globe, ExternalLink, AlertTriangle } from "lucide-react";

const settingsQuery = query(collection(db, "settings"));
const SettingsStreamBuilder = StreamBuilder as any;

export default function GovernmentWebsitesSection() {
  const websites = [
    {
      serial: "১",
      name: "শিক্ষা মন্ত্রণালয়",
      desc: "শিক্ষা মন্ত্রণালয়ের সকল নোটিশ, নীতিমালা, সার্কুলার ও শিক্ষা-সংক্রান্ত তথ্য।",
      url: "https://moedu.gov.bd"
    },
    {
      serial: "২",
      name: "মাধ্যমিক ও উচ্চ শিক্ষা বিভাগ (SHED)",
      desc: "মাধ্যমিক ও উচ্চশিক্ষা সম্পর্কিত সরকারি তথ্য, নোটিশ ও সেবা।",
      url: "https://shed.gov.bd"
    },
    {
      serial: "৩",
      name: "মাধ্যমিক ও উচ্চশিক্ষা অধিদপ্তর (DSHE)",
      desc: "স্কুল ও কলেজ সংক্রান্ত নোটিশ, শিক্ষক তথ্য, EMIS এবং বিভিন্ন শিক্ষা কার্যক্রম।",
      url: "https://dshe.gov.bd"
    },
    {
      serial: "৪",
      name: "মাদ্রাসা শিক্ষা অধিদপ্তর (DME)",
      desc: "মাদ্রাসার নোটিশ, শিক্ষক, শিক্ষার্থী ও প্রশাসনিক তথ্য।",
      url: "https://dme.gov.bd"
    },
    {
      serial: "৫",
      name: "বাংলাদেশ মাদ্রাসা শিক্ষা বোর্ড (BMEB)",
      desc: "দাখিল, আলিম, ফাজিল ও কামিল পরীক্ষা, রুটিন, ফলাফল ও বিজ্ঞপ্তি।",
      url: "https://bmeb.gov.bd"
    },
    {
      serial: "৬",
      name: "শিক্ষা বোর্ড বাংলাদেশ",
      desc: "সকল শিক্ষা বোর্ডের তথ্য, পরীক্ষার ফলাফল ও অনলাইন সেবা।",
      url: "https://www.educationboard.gov.bd"
    },
    {
      serial: "৭",
      name: "জাতীয় শিক্ষাক্রম ও পাঠ্যপুস্তক বোর্ড (NCTB)",
      desc: "বিনামূল্যে পাঠ্যবই, শিক্ষাক্রম ও শিক্ষাসামগ্রী।",
      url: "https://nctb.gov.bd"
    },
    {
      serial: "৮",
      name: "BANBEIS",
      desc: "বাংলাদেশের শিক্ষা-সংক্রান্ত পরিসংখ্যান, গবেষণা ও তথ্যভাণ্ডার।",
      url: "https://banbeis.gov.bd"
    },
    {
      serial: "৯",
      name: "কারিগরি ও মাদ্রাসা শিক্ষা বিভাগ",
      desc: "কারিগরি ও মাদ্রাসা শিক্ষার নীতিমালা, সার্কুলার ও সরকারি তথ্য।",
      url: "https://tmed.gov.bd"
    },
    {
      serial: "১০",
      name: "বাংলাদেশ জাতীয় তথ্য বাতায়ন",
      desc: "বিভিন্ন সরকারি শিক্ষা প্রতিষ্ঠান ও সেবার অফিশিয়াল লিংক এক জায়গায়।",
      url: "https://bangladesh.gov.bd"
    }
  ];

  const fontStyle = { fontFamily: '"Ador Noirit", "Hind Siliguri", "Anek Bangla", sans-serif' };

  return (
    <div id="government-websites-section" className="py-12 bg-[#faf9f6] min-h-screen font-alinur">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        
        {/* Real-time Data fetch from Firestore using StreamBuilder as strictly mandated */}
        <SettingsStreamBuilder
          stream={settingsQuery}
          builder={(settingsList: any[], loading: boolean, error: any) => {
            if (loading) {
              return (
                <div className="flex flex-col items-center justify-center py-20 space-y-4">
                  <div className="h-12 w-12 border-4 border-emerald-800 border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-emerald-950 font-bold animate-pulse" style={fontStyle}>লোড হচ্ছে, অনুগ্রহ করে অপেক্ষা করুন...</p>
                </div>
              );
            }

            if (error) {
              return (
                <div className="bg-red-50 border border-red-200 text-red-800 p-6 rounded-2xl text-center space-y-3 shadow-sm">
                  <AlertTriangle className="h-10 w-10 text-red-600 mx-auto" />
                  <p className="font-bold text-lg" style={fontStyle}>তথ্য লোড করতে সমস্যা হয়েছে</p>
                  <p className="text-sm" style={fontStyle}>অনুগ্রহ করে ইন্টারনেট কানেকশন চেক করুন অথবা কিছুক্ষণ পর আবার চেষ্টা করুন।</p>
                </div>
              );
            }

            return (
              <div className="space-y-10">
                {/* Section Header */}
                <div className="text-center space-y-4 max-w-2xl mx-auto">
                  <h2 
                    className="text-2xl sm:text-3xl md:text-4xl font-black text-emerald-950 leading-tight" 
                    style={fontStyle}
                  >
                    📚 শিক্ষার্থীদের জন্য গুরুত্বপূর্ণ সরকারি শিক্ষা ওয়েবসাইট
                  </h2>
                  <div className="w-24 h-1 bg-gradient-to-r from-emerald-600 to-amber-500 mx-auto rounded-full"></div>
                </div>

                {/* All-in-One Dashboard Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {websites.map((site) => (
                    <div 
                      key={site.serial} 
                      className="bg-white rounded-2xl p-5 sm:p-6 border border-emerald-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] hover:shadow-[0_12px_40px_rgba(4,120,87,0.06)] hover:-translate-y-1 transition-all duration-300 flex gap-4 relative overflow-hidden group"
                    >
                      {/* Serial / Badge number in emerald background */}
                      <div className="shrink-0">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-800 to-emerald-950 text-white flex items-center justify-center font-bold text-lg shadow-sm border border-emerald-700/20 select-none">
                          <span style={fontStyle}>{site.serial}</span>
                        </div>
                      </div>

                      {/* Content details */}
                      <div className="flex-1 flex flex-col justify-between space-y-4 min-w-0">
                        <div className="space-y-1.5">
                          <h3 
                            className="text-base sm:text-lg font-black text-emerald-950 leading-snug group-hover:text-emerald-800 transition-colors duration-300" 
                            style={fontStyle}
                          >
                            {site.name}
                          </h3>
                          <p 
                            className="text-xs sm:text-sm text-emerald-900/70 font-semibold leading-relaxed" 
                            style={fontStyle}
                          >
                            {site.desc}
                          </p>
                        </div>

                        {/* Link Button */}
                        <div className="pt-2">
                          <a 
                            href={site.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-emerald-950 text-xs sm:text-sm font-black transition-all duration-200 active:scale-95 shadow-sm hover:shadow-md"
                            style={fontStyle}
                          >
                            <Globe className="w-4 h-4" />
                            <span>অফিশিয়াল লিংক বাটন</span>
                            <ExternalLink className="w-3 h-3 opacity-60" />
                          </a>
                        </div>
                      </div>

                      {/* Subtle Decorative Background Element */}
                      <div className="absolute right-0 bottom-0 translate-x-4 translate-y-4 text-emerald-50 opacity-[0.03] group-hover:scale-110 transition-transform duration-500 pointer-events-none">
                        <Globe className="w-32 h-32" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          }}
        />

      </div>
    </div>
  );
}
