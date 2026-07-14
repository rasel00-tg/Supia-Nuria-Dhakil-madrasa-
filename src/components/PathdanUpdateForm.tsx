import React, { useState, useEffect } from "react";
import { db, StreamBuilder } from "../lib/firebase";
import { collection, query, doc, updateDoc, setDoc } from "firebase/firestore";
import { Save, RefreshCw, CheckCircle, HelpCircle, Phone, MapPin, Shield, Users, Library, Sunset, BookOpen, GraduationCap, CheckCircle2 } from "lucide-react";

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

export default function PathdanUpdateForm() {
  return (
    <StreamBuilder<OverviewData>
      stream={overviewQuery}
      builder={(overviewList, loading, error) => {
        if (loading) {
          return (
            <div className="py-12 text-center text-gray-400 font-sans animate-pulse">
              তথ্য লোড হচ্ছে...
            </div>
          );
        }

        const rawData = overviewList && overviewList.length > 0 ? overviewList[0] : DEFAULT_OVERVIEW;
        return <PathdanUpdateFormInner rawData={rawData} />;
      }}
    />
  );
}

function PathdanUpdateFormInner({ rawData }: { rawData: OverviewData }) {
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  const [highlights, setHighlights] = useState<OverviewHighlight[]>([]);
  const [departments, setDepartments] = useState<OverviewDepartment[]>([]);
  const [eligibility, setEligibility] = useState<string[]>([]);
  const [documents, setDocuments] = useState<string[]>([]);
  const [featuresText, setFeaturesText] = useState("");

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState("");

  // Sync state with incoming database updates, but only if we are not actively saving
  useEffect(() => {
    setPhone(rawData.phone || "");
    setLocation(rawData.location || "");
    setHighlights(rawData.highlights || JSON.parse(JSON.stringify(DEFAULT_OVERVIEW.highlights)));
    setDepartments(rawData.departments || JSON.parse(JSON.stringify(DEFAULT_OVERVIEW.departments)));
    setEligibility(rawData.eligibility || [...DEFAULT_OVERVIEW.eligibility]);
    setDocuments(rawData.documents || [...DEFAULT_OVERVIEW.documents]);
    setFeaturesText((rawData.features || DEFAULT_OVERVIEW.features).join("\n"));
  }, [rawData]);

  const handleHighlightChange = (index: number, key: "title" | "desc", val: string) => {
    const updated = [...highlights];
    updated[index] = { ...updated[index], [key]: val };
    setHighlights(updated);
  };

  const handleDepartmentChange = (index: number, key: keyof OverviewDepartment, val: string) => {
    const updated = [...departments];
    updated[index] = { ...updated[index], [key]: val };
    setDepartments(updated);
  };

  const handleEligibilityChange = (index: number, val: string) => {
    const updated = [...eligibility];
    updated[index] = val;
    setEligibility(updated);
  };

  const handleDocumentChange = (index: number, val: string) => {
    const updated = [...documents];
    updated[index] = val;
    setDocuments(updated);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);
    setSaveError("");

    try {
      const parsedFeatures = featuresText
        .split("\n")
        .map(line => line.trim())
        .filter(line => line.length > 0);

      const payload = {
        phone,
        location,
        highlights,
        departments,
        eligibility,
        documents,
        features: parsedFeatures
      };

      await setDoc(doc(db, "website_overview", "main"), payload);
      setSaveSuccess(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err: any) {
      console.error("Error saving overview data:", err);
      setSaveError("ডাটাবেজে তথ্য সংরক্ষণ করতে ব্যর্থ হয়েছে। পুনরায় চেষ্টা করুন।");
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetToDefault = () => {
    if (window.confirm("আপনি কি নিশ্চিতভাবে এই পেজের সমস্ত তথ্য ডিফল্ট/আদি অবস্থায় রিসেট করতে চান?")) {
      setPhone(DEFAULT_OVERVIEW.phone);
      setLocation(DEFAULT_OVERVIEW.location);
      setHighlights(JSON.parse(JSON.stringify(DEFAULT_OVERVIEW.highlights)));
      setDepartments(JSON.parse(JSON.stringify(DEFAULT_OVERVIEW.departments)));
      setEligibility([...DEFAULT_OVERVIEW.eligibility]);
      setDocuments([...DEFAULT_OVERVIEW.documents]);
      setFeaturesText(DEFAULT_OVERVIEW.features.join("\n"));
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-8 pb-12">
      {saveSuccess && (
        <div className="bg-emerald-100 border border-emerald-300 text-emerald-900 px-4 py-3 rounded-xl flex items-center gap-2 animate-fade-in font-sans text-sm">
          <CheckCircle className="h-5 w-5 text-emerald-600 shrink-0" />
          <span>এক নজরে পাঠদান পেজের তথ্য সফলভাবে রিয়েল-টাইম আপডেট করা হয়েছে!</span>
        </div>
      )}

      {saveError && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-xl flex items-center gap-2 font-sans text-sm">
          <span className="text-red-500 shrink-0">❌</span>
          <span>{saveError}</span>
        </div>
      )}

      {/* ১. মাদ্রাসার সাধারণ তথ্য */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 shadow-xs space-y-4">
        <h4 className="text-sm font-bold uppercase tracking-wider text-emerald-800 border-b border-gray-100 pb-2 flex items-center gap-2 font-mono">
          <Phone className="h-4 w-4" />
          ১. মাদ্রাসার সাধারণ তথ্য ও হেড ব্যানার
        </h4>
        <div className="grid md:grid-cols-2 gap-4 pt-2">
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-700">মোবাইল ফোন নম্বর</label>
            <input 
              type="text" 
              required 
              value={phone} 
              onChange={(e) => setPhone(e.target.value)} 
              placeholder="01767 014 524" 
              className="w-full px-3 py-2 border rounded-md text-sm font-sans" 
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-700">মাদ্রাসার ঠিকানা / অবস্থান</label>
            <input 
              type="text" 
              required 
              value={location} 
              onChange={(e) => setLocation(e.target.value)} 
              placeholder="নতুন পল্লান পাড়া, টেকনাফ পৌরসভা, টেকনাফ, কক্সবাজার।" 
              className="w-full px-3 py-2 border rounded-md text-sm font-sans" 
            />
          </div>
        </div>
      </div>

      {/* ২. মাদ্রাসার অনন্য বৈশিষ্ট্যসমূহ */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 shadow-xs space-y-4">
        <h4 className="text-sm font-bold uppercase tracking-wider text-emerald-800 border-b border-gray-100 pb-2 flex items-center gap-2 font-mono">
          <Shield className="h-4 w-4" />
          ২. মাদ্রাসার অনন্য বৈশিষ্ট্যসমূহ (৪টি প্রধান বৈশিষ্ট্য)
        </h4>
        <div className="grid md:grid-cols-2 gap-6 pt-2">
          {highlights.map((h, i) => (
            <div key={i} className="p-4 border border-gray-100 rounded-xl bg-gray-50/50 space-y-3">
              <span className="text-xs font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                বৈশিষ্ট্য {i + 1}
              </span>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700">শিরোনাম</label>
                <input 
                  type="text" 
                  required 
                  value={h.title || ""} 
                  onChange={(e) => handleHighlightChange(i, "title", e.target.value)} 
                  placeholder="বৈশিষ্ট্যের শিরোনাম" 
                  className="w-full px-3 py-2 border rounded-md text-sm font-sans" 
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700">বর্ণনা</label>
                <textarea 
                  required 
                  rows={2}
                  value={h.desc || ""} 
                  onChange={(e) => handleHighlightChange(i, "desc", e.target.value)} 
                  placeholder="বৈশিষ্ট্যের বিস্তারিত বিবরণ" 
                  className="w-full px-3 py-2 border rounded-md text-sm resize-none font-sans" 
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ৩. মাদ্রাসার শিক্ষা বিভাগসমূহ */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 shadow-xs space-y-4">
        <h4 className="text-sm font-bold uppercase tracking-wider text-emerald-800 border-b border-gray-100 pb-2 flex items-center gap-2 font-mono">
          <BookOpen className="h-4 w-4" />
          ৩. মাদ্রাসার শিক্ষা বিভাগসমূহ (৪টি স্তর)
        </h4>
        <div className="grid md:grid-cols-2 gap-6 pt-2">
          {departments.map((dept, i) => (
            <div key={i} className="p-4 border border-gray-100 rounded-xl bg-gray-50/50 space-y-3">
              <span className="text-xs font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                বিভাগ {i + 1} ({dept.level || ""})
              </span>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700">স্তরের নাম (যেমন: প্রাথমিক স্তর)</label>
                  <input 
                    type="text" 
                    required 
                    value={dept.level || ""} 
                    onChange={(e) => handleDepartmentChange(i, "level", e.target.value)} 
                    placeholder="যেমন: প্রাথমিক স্তর" 
                    className="w-full px-3 py-2 border rounded-md text-sm font-sans" 
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700">শাখার নাম (যেমন: ইবতেদায়ী শাখা)</label>
                  <input 
                    type="text" 
                    required 
                    value={dept.title || ""} 
                    onChange={(e) => handleDepartmentChange(i, "title", e.target.value)} 
                    placeholder="যেমন: ইবতেদায়ী শাখা" 
                    className="w-full px-3 py-2 border rounded-md text-sm font-sans" 
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700">বর্ণনা</label>
                <textarea 
                  required 
                  rows={2}
                  value={dept.desc || ""} 
                  onChange={(e) => handleDepartmentChange(i, "desc", e.target.value)} 
                  placeholder="বিভাগের পড়াশোনা বা কারিকুলাম বর্ণনা" 
                  className="w-full px-3 py-2 border rounded-md text-sm resize-none font-sans" 
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700">ফুটনোট / সাব-কারিকুলাম</label>
                <input 
                  type="text" 
                  required 
                  value={dept.footer || ""} 
                  onChange={(e) => handleDepartmentChange(i, "footer", e.target.value)} 
                  placeholder="যেমন: কুরআন পাঠ ও প্রাথমিক কারিকুলাম" 
                  className="w-full px-3 py-2 border rounded-md text-sm font-sans" 
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ৪. ভর্তির যোগ্যতা ও প্রয়োজনীয় কাগজপত্র */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* ৪.১ ভর্তির যোগ্যতা */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 shadow-xs space-y-4">
          <h4 className="text-sm font-bold uppercase tracking-wider text-emerald-800 border-b border-gray-100 pb-2 flex items-center gap-2 font-mono">
            <CheckCircle2 className="h-4 w-4 text-emerald-700" />
            ৪. ভর্তির যোগ্যতা (৩টি পয়েন্ট)
          </h4>
          <div className="space-y-4 pt-2">
            {eligibility.map((item, idx) => (
              <div key={idx} className="space-y-1">
                <label className="text-xs font-bold text-gray-600">পয়েন্ট {idx + 1}</label>
                <textarea 
                  required 
                  rows={2}
                  value={item || ""} 
                  onChange={(e) => handleEligibilityChange(idx, e.target.value)} 
                  className="w-full px-3 py-2 border rounded-md text-sm resize-none font-sans" 
                />
              </div>
            ))}
          </div>
        </div>

        {/* ৪.২ প্রয়োজনীয় কাগজপত্র */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 shadow-xs space-y-4">
          <h4 className="text-sm font-bold uppercase tracking-wider text-emerald-800 border-b border-gray-100 pb-2 flex items-center gap-2 font-mono">
            <CheckCircle2 className="h-4 w-4 text-amber-500" />
            ৫. প্রয়োজনীয় কাগজপত্র (৪টি পয়েন্ট)
          </h4>
          <div className="space-y-4 pt-2">
            {documents.map((item, idx) => (
              <div key={idx} className="space-y-1">
                <label className="text-xs font-bold text-gray-600">পয়েন্ট {idx + 1}</label>
                <textarea 
                  required 
                  rows={2}
                  value={item || ""} 
                  onChange={(e) => handleDocumentChange(idx, e.target.value)} 
                  className="w-full px-3 py-2 border rounded-md text-sm resize-none font-sans" 
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ৫. অন্যান্য সুযোগ-সুবিধা ও পরিচিতি বৈশিষ্ট্যসমূহ */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 shadow-xs space-y-4">
        <h4 className="text-sm font-bold uppercase tracking-wider text-emerald-800 border-b border-gray-100 pb-2 flex items-center gap-2 font-mono">
          <Users className="h-4 w-4" />
          ৬. অন্যান্য সুযোগ-সুবিধা ও বৈশিষ্ট্য তালিকা (প্রতি লাইনে একটি বৈশিষ্ট্য)
        </h4>
        <div className="space-y-1 pt-2">
          <label className="text-xs font-bold text-gray-700">সুযোগ-সুবিধাসমূহ (Enter চেপে পরবর্তী লাইনে নতুন আইটেম লিখুন)</label>
          <textarea 
            required 
            rows={10}
            value={featuresText} 
            onChange={(e) => setFeaturesText(e.target.value)} 
            placeholder="প্রতি লাইনে ১টি করে সুযোগ সুবিধা বা বৈশিষ্ট্য লিখুন..." 
            className="w-full px-4 py-3 border rounded-md text-sm font-sans leading-relaxed" 
          />
          <p className="text-[10px] text-gray-400 font-mono mt-1">
            * প্রতিটি নতুন লাইনে লিখলে তা মেইন পেজে আলাদা একটি সবুজ চেকমার্ক বুলেট পয়েন্ট হিসেবে দৃশ্যমান হবে।
          </p>
        </div>
      </div>

      {/* ফরম একশন বাটন */}
      <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-100 justify-end">
        <button
          type="button"
          onClick={handleResetToDefault}
          className="bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 font-bold px-5 py-3 rounded-xl text-xs select-none transition-all flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <RefreshCw className="h-4 w-4" />
          <span>ডিফল্ট রিসেট করুন</span>
        </button>
        <button
          type="submit"
          disabled={isSaving}
          className="bg-emerald-800 hover:bg-emerald-950 text-amber-400 font-bold px-8 py-3 rounded-xl text-xs shadow-md select-none transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
        >
          {isSaving ? (
            <span>আপডেট হচ্ছে...</span>
          ) : (
            <>
              <Save className="h-4 w-4" />
              <span>রিয়েল-টাইম তথ্য আপডেট করুন</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}
