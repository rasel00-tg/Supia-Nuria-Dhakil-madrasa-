import { useState, useEffect } from "react";
import { collection, query, doc, onSnapshot, setDoc } from "firebase/firestore";
import { db, StreamBuilder, uploadFileToImgBB } from "../lib/firebase";
import { Routine } from "../types";
import { Calendar, Clock, Download, BookOpen, GraduationCap, ArrowLeft, Upload } from "lucide-react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export default function RoutineSection() {
  const [selectedClass, setSelectedClass] = useState<string>("৬ষ্ঠ শ্রেণি");
  const [selectedExamClass, setSelectedExamClass] = useState<string>("৬ষ্ঠ শ্রেণি");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [madrasaAddress, setMadrasaAddress] = useState<string>("নতুন পল্লান পাড়া, ৪নং ওয়ার্ড, টেকনাফ, কক্সবাজার");

  const [activeView, setActiveView] = useState<"cards" | "class" | "exam">("cards");
  const [classFile, setClassFile] = useState<File | null>(null);
  const [examFile, setExamFile] = useState<File | null>(null);
  const [classDragActive, setClassDragActive] = useState(false);
  const [examDragActive, setExamDragActive] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const classOptions = [
    "শিশু শ্রেণি",
    "১ম শ্রেণি",
    "২য় শ্রেণি",
    "৩য় শ্রেণি",
    "৪র্থ শ্রেণি",
    "৫ম শ্রেণি",
    "৬ষ্ঠ শ্রেণি",
    "৭ম শ্রেণি",
    "৮ম শ্রেণি",
    "৯ম শ্রেণি",
    "১০ম শ্রেণি"
  ];

  useEffect(() => {
    let unsubLegacy: (() => void) | null = null;
    const unsub = onSnapshot(
      doc(db, "settings", "branding"),
      (snap) => {
        if (snap.exists()) {
          setLogoUrl(snap.data().logoUrl || null);
        } else {
          if (!unsubLegacy) {
            unsubLegacy = onSnapshot(
              doc(db, "settings", "website"),
              (webSnap) => {
                if (webSnap.exists()) {
                  setLogoUrl(webSnap.data().logoUrl || null);
                }
              },
              (err) => {
                console.warn("Unable to reach legacy website config: ", err);
              }
            );
          }
        }
      },
      (err) => {
        console.warn("Unable to reach branding config (operating in offline/fallback mode): ", err);
      }
    );
    return () => {
      unsub();
      if (unsubLegacy) unsubLegacy();
    };
  }, []);

  const handleUploadAndLock = async () => {
    if (!classFile || !examFile) {
      setUploadError("অনুগ্রহ করে দুটি আইকনই সিলেক্ট করুন।");
      return;
    }
    setUploadError(null);
    setIsUploading(true);
    try {
      const classUrl = await uploadFileToImgBB(classFile);
      const examUrl = await uploadFileToImgBB(examFile);
      
      await setDoc(doc(db, "routine_config", "icons"), {
        isRoutineIconsUploaded: true,
        classIconUrl: classUrl,
        examIconUrl: examUrl
      });
    } catch (error) {
      console.error("Error setting up icons:", error);
      setUploadError("আইকন আপলোড করতে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।");
    } finally {
      setIsUploading(false);
    }
  };

  const toBengaliDigits = (numStr: string) => {
    if (!numStr) return "";
    return numStr.replace(/[0-9]/g, (d) => "০১২৩৪৫৬৭৮৯"[parseInt(d)]);
  };

  const getBengaliFormattedDate = (isoString: string) => {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return "";
    const day = toBengaliDigits(date.getDate().toString());
    const year = toBengaliDigits(date.getFullYear().toString());
    const monthsBn = ["জানুয়ারি", "ফেব্রুয়ারি", "মার্চ", "এপ্রিল", "মে", "জুন", "জুলাই", "আগস্ট", "সেপ্টেম্বর", "অক্টোবর", "নভেম্বর", "ডিসেম্বর"];
    const month = monthsBn[date.getMonth()];
    return `${day} ${month}, ${year}`;
  };

  // Direct client-side PDF download function for class routine
  const downloadRoutinePDF = async (filteredRoutines: Routine[], latestEditedAt: string | null) => {
    const element = document.getElementById("routine-pdf-template");
    if (!element) return;
    
    try {
      const canvas = await html2canvas(element, {
        scale: 3, // Increase resolution for beautiful print quality
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
        logging: false,
      });
      
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const imgWidth = 210;
      const pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);
      pdf.save(`SNDM_Routine_${selectedClass}.pdf`);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("পিডিএফ ডাউনলোড করতে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।");
    }
  };

  // Direct client-side PDF download function for exam routine
  const downloadExamRoutinePDF = async (examName: string) => {
    const element = document.getElementById("exam-routine-pdf-template");
    if (!element) return;
    
    try {
      const canvas = await html2canvas(element, {
        scale: 3,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
        logging: false,
      });
      
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);
      pdf.save(`SNDM_Exam_Routine_${selectedExamClass}_${examName.replace(/\s+/g, '_')}.pdf`);
    } catch (error) {
      console.error("Error generating Exam PDF:", error);
      alert("পিডিএফ ডাউনলোড করতে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।");
    }
  };

  // Build query for routines
  const routinesQuery = query(collection(db, "routines"));

  return (
    <div 
      id="routine-section" 
      className="space-y-8 py-8 w-full px-4 max-w-5xl mx-auto font-alinur"
      style={{ fontFamily: '"Ador Noirit", "Hind Siliguri", "Anek Bangla", sans-serif' }}
    >
      <StreamBuilder<any>
        stream={query(collection(db, "routine_config"))}
        builder={(configList) => {
          const configDoc = configList.find(c => c.id === "icons") || {};
          const isRoutineIconsUploaded = configDoc.isRoutineIconsUploaded || false;
          const classIconUrl = configDoc.classIconUrl || "";
          const examIconUrl = configDoc.examIconUrl || "";

          return (
            <>
              {activeView === "cards" ? (
                <div className="space-y-12 py-6 animate-fade-in print:hidden">
                  {/* Header with Custom Ador Noirit Font */}
                  <div className="text-center w-full space-y-3">
                    <h2 
                      className="text-3xl sm:text-4xl font-extrabold text-indigo-950 tracking-tight"
                      style={{ fontFamily: '"Ador Noirit", "Hind Siliguri", "Anek Bangla", sans-serif' }}
                    >
                      একাডেমিক রুটিন ও সময়সূচী
                    </h2>
                    <p className="text-sm text-gray-500 font-bold">সুফিয়া নূরীয়া দাখিল মাদ্রাসার রুটিন ড্যাশবোর্ডে আপনাকে স্বাগতম</p>
                    <div className="h-1 w-20 bg-indigo-600 mx-auto rounded-full mt-2"></div>
                  </div>

                  {/* The Two Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto w-full px-2">
                    {/* Card 1: Class Routine */}
                    <div 
                      onClick={() => setActiveView("class")}
                      className="group relative overflow-hidden bg-gradient-to-br from-indigo-600 via-indigo-700 to-indigo-800 text-white rounded-3xl p-8 shadow-xl shadow-indigo-100 hover:shadow-2xl hover:shadow-indigo-200 hover:-translate-y-1.5 active:scale-[0.98] transition-all duration-300 cursor-pointer flex flex-col justify-between min-h-[280px]"
                    >
                      <div className="absolute top-0 right-0 -mt-6 -mr-6 w-32 h-32 bg-white/5 rounded-full blur-xl group-hover:scale-125 transition-transform duration-500"></div>
                      <div className="flex justify-between items-start">
                        <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-md">
                          {classIconUrl ? (
                            <img 
                              src={classIconUrl} 
                              alt="Class Routine Icon" 
                              className="h-12 w-12 object-contain" 
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <Calendar className="h-12 w-12 text-white" />
                          )}
                        </div>
                        <span className="text-xs bg-white/20 px-3 py-1 rounded-full font-bold uppercase tracking-wider backdrop-blur-md">১ম অপশন</span>
                      </div>
                      <div className="space-y-2 mt-8">
                        <h3 
                          className="text-2xl sm:text-3xl font-black tracking-tight"
                          style={{ fontFamily: '"Ador Noirit", "Hind Siliguri", "Anek Bangla", sans-serif' }}
                        >
                          ক্লাস রুটিন
                        </h3>
                        <p className="text-sm text-indigo-100 font-medium">
                          নিয়মিত শ্রেণির দৈনিক সময়সূচী, পিরিয়ড ও দায়িত্বপ্রাপ্ত শিক্ষকগণের বিবরণী।
                        </p>
                      </div>
                    </div>

                    {/* Card 2: Exam Routine */}
                    <div 
                      onClick={() => setActiveView("exam")}
                      className="group relative overflow-hidden bg-gradient-to-br from-rose-600 via-rose-700 to-rose-800 text-white rounded-3xl p-8 shadow-xl shadow-rose-100 hover:shadow-2xl hover:shadow-rose-200 hover:-translate-y-1.5 active:scale-[0.98] transition-all duration-300 cursor-pointer flex flex-col justify-between min-h-[280px]"
                    >
                      <div className="absolute top-0 right-0 -mt-6 -mr-6 w-32 h-32 bg-white/5 rounded-full blur-xl group-hover:scale-125 transition-transform duration-500"></div>
                      <div className="flex justify-between items-start">
                        <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-md">
                          {examIconUrl ? (
                            <img 
                              src={examIconUrl} 
                              alt="Exam Routine Icon" 
                              className="h-12 w-12 object-contain" 
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <BookOpen className="h-12 w-12 text-white" />
                          )}
                        </div>
                        <span className="text-xs bg-white/20 px-3 py-1 rounded-full font-bold uppercase tracking-wider backdrop-blur-md">২য় অপশন</span>
                      </div>
                      <div className="space-y-2 mt-8">
                        <h3 
                          className="text-2xl sm:text-3xl font-black tracking-tight"
                          style={{ fontFamily: '"Ador Noirit", "Hind Siliguri", "Anek Bangla", sans-serif' }}
                        >
                          পরীক্ষা রুটিন
                        </h3>
                        <p className="text-sm text-rose-100 font-medium">
                          বার্ষিক, অর্ধবার্ষিক, প্রাক-নির্বাচনী ও অন্যান্য পরীক্ষার বিষয়ভিত্তিক সময়সূচী।
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* One-Time Icon Upload Panel (Only displays if isRoutineIconsUploaded is not true) */}
                  {!isRoutineIconsUploaded && (
                    <div className="max-w-xl mx-auto w-full bg-white p-6 rounded-3xl border border-indigo-100 shadow-xl space-y-6 animate-fade-in mt-12">
                      <div className="text-center space-y-1">
                        <div className="inline-flex items-center justify-center bg-indigo-50 text-indigo-600 p-3 rounded-full mb-2">
                          <Upload className="h-6 w-6" />
                        </div>
                        <h3 
                          className="text-lg font-extrabold text-indigo-950"
                          style={{ fontFamily: '"Ador Noirit", "Hind Siliguri", "Anek Bangla", sans-serif' }}
                        >
                          রুটিন কার্ড আইকন সেটআপ (ওয়ান-টাইম অ্যাকশন)
                        </h3>
                        <p className="text-xs text-gray-500 font-bold px-4">
                          প্রথমবার ক্লাস ও পরীক্ষা রুটিন কার্ড দুটির জন্য আইকন আপলোড করুন। সফলভাবে আপলোড হলে এই প্যানেলটি চিরতরে হাইড হয়ে যাবে।
                        </p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Drag & Drop Card for Class Icon */}
                        <div className="space-y-2">
                          <label className="block text-xs font-bold text-indigo-950">ক্লাস রুটিন আইকন (PNG/JPG)</label>
                          <div
                            onDragOver={(e) => { e.preventDefault(); setClassDragActive(true); }}
                            onDragLeave={(e) => { e.preventDefault(); setClassDragActive(false); }}
                            onDrop={(e) => {
                              e.preventDefault();
                              setClassDragActive(false);
                              const file = e.dataTransfer.files?.[0];
                              if (file && file.type.startsWith("image/")) {
                                setClassFile(file);
                              }
                            }}
                            onClick={() => document.getElementById("class-icon-uploader")?.click()}
                            className={`border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition-all min-h-[140px] flex flex-col justify-center items-center ${
                              classDragActive ? "border-indigo-600 bg-indigo-50/50" : classFile ? "border-emerald-500 bg-emerald-50/10" : "border-indigo-150 bg-slate-50/50 hover:bg-slate-50"
                            }`}
                          >
                            <input
                              type="file"
                              id="class-icon-uploader"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) setClassFile(file);
                              }}
                            />
                            <Upload className="h-6 w-6 text-indigo-400 mb-1.5" />
                            <span className="text-xs font-bold text-slate-700 block line-clamp-1">
                              {classFile ? classFile.name : "টেনে আনুন অথবা ক্লিক করুন"}
                            </span>
                            {classFile && (
                              <span className="text-[10px] text-emerald-600 font-bold block mt-1">✓ সিলেক্ট করা হয়েছে</span>
                            )}
                          </div>
                        </div>

                        {/* Drag & Drop Card for Exam Icon */}
                        <div className="space-y-2">
                          <label className="block text-xs font-bold text-indigo-950">পরীক্ষা রুটিন আইকন (PNG/JPG)</label>
                          <div
                            onDragOver={(e) => { e.preventDefault(); setExamDragActive(true); }}
                            onDragLeave={(e) => { e.preventDefault(); setExamDragActive(false); }}
                            onDrop={(e) => {
                              e.preventDefault();
                              setExamDragActive(false);
                              const file = e.dataTransfer.files?.[0];
                              if (file && file.type.startsWith("image/")) {
                                setExamFile(file);
                              }
                            }}
                            onClick={() => document.getElementById("exam-icon-uploader")?.click()}
                            className={`border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition-all min-h-[140px] flex flex-col justify-center items-center ${
                              examDragActive ? "border-rose-500 bg-rose-50/50" : examFile ? "border-emerald-500 bg-emerald-50/10" : "border-indigo-150 bg-slate-50/50 hover:bg-slate-50"
                            }`}
                          >
                            <input
                              type="file"
                              id="exam-icon-uploader"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) setExamFile(file);
                              }}
                            />
                            <Upload className="h-6 w-6 text-rose-400 mb-1.5" />
                            <span className="text-xs font-bold text-slate-700 block line-clamp-1">
                              {examFile ? examFile.name : "টেনে আনুন অথবা ক্লিক করুন"}
                            </span>
                            {examFile && (
                              <span className="text-[10px] text-emerald-600 font-bold block mt-1">✓ সিলেক্ট করা হয়েছে</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {uploadError && (
                        <p className="text-xs text-red-500 text-center font-bold">{uploadError}</p>
                      )}

                      <button
                        onClick={handleUploadAndLock}
                        disabled={isUploading}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-bold py-3 rounded-xl shadow-lg shadow-indigo-100 transition-all cursor-pointer flex items-center justify-center gap-2 text-sm"
                        style={{ fontFamily: '"Ador Noirit", "Hind Siliguri", "Anek Bangla", sans-serif' }}
                      >
                        {isUploading ? "আইকন আপলোড করা হচ্ছে..." : "আইকন আপলোড এবং লক করুন"}
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-8 animate-fade-in">
                  <div className="flex justify-between items-center print:hidden border-b border-indigo-50 pb-4">
                    <button
                      onClick={() => setActiveView("cards")}
                      className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold bg-white hover:bg-indigo-50/40 text-indigo-950 border border-indigo-100 rounded-xl shadow-xs transition-all cursor-pointer group"
                      style={{ fontFamily: '"Ador Noirit", "Hind Siliguri", "Anek Bangla", sans-serif' }}
                    >
                      <ArrowLeft className="h-4 w-4 text-indigo-600 group-hover:-translate-x-0.5 transition-transform" />
                      <span>রুটিন ড্যাশবোর্ডে ফিরে যান</span>
                    </button>
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                      <span className="text-[11px] font-bold text-indigo-900/60 uppercase tracking-widest">
                        {activeView === "class" ? "ক্লাস রুটিন ভিউ" : "পরীক্ষা রুটিন ভিউ"}
                      </span>
                    </div>
                  </div>

                  {/* Dynamic Header */}
                  <div className="text-center w-full space-y-3 print:hidden">
                    <h2 
                      className="text-3xl sm:text-4xl font-extrabold text-indigo-950 tracking-tight"
                      style={{ fontFamily: '"Ador Noirit", "Hind Siliguri", "Anek Bangla", sans-serif' }}
                    >
                      {activeView === "class" ? "ক্লাস রুটিন দেখতে ঘর সিলেক্ট করুন" : "পরীক্ষা রুটিন দেখতে ঘর সিলেক্ট করুন"}
                    </h2>
                    <div className="h-1 w-20 bg-indigo-600 mx-auto rounded-full mt-2"></div>
                  </div>

      {/* Class Selection Dropdown under "১. ক্লাস রুটিন" */}
      {activeView === "class" && (
        <div className="bg-indigo-50/50 p-6 rounded-2xl border border-indigo-100/80 shadow-sm space-y-4 print:hidden">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="space-y-1">
              <h3 
                className="text-lg font-bold text-indigo-905 flex items-center gap-2"
                style={{ fontFamily: '"Ador Noirit", "Hind Siliguri", "Anek Bangla", sans-serif' }}
              >
                <Calendar className="h-5 w-5 text-indigo-600" />
                <span>১. ক্লাস রুটিন</span>
              </h3>
              <p className="text-xs text-gray-500">
                আপনার নির্দিষ্ট ক্লাসের সময়সূচী জানতে নিচের তালিকা থেকে সিলেক্ট করুন।
              </p>
            </div>

            {/* Custom Select dropdown */}
            <div className="w-full sm:w-auto min-w-[200px]">
              <select
                id="routine-class-filter"
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="w-full bg-white border border-indigo-200 hover:border-indigo-400 rounded-xl px-4 py-2.5 text-sm font-bold text-indigo-950 outline-none focus:ring-2 focus:ring-indigo-500 transition-all cursor-pointer shadow-xs"
                style={{ fontFamily: '"Ador Noirit", "Hind Siliguri", "Anek Bangla", sans-serif' }}
              >
                {classOptions.map((cls) => (
                  <option key={cls} value={cls} className="font-bold text-slate-800">
                    {cls}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Dynamic Routine Data with Real-Time StreamBuilder */}
      <StreamBuilder<Routine>
        stream={routinesQuery}
        builder={(routines, loading, error) => {
          if (loading) {
            return (
              <div className="py-16 text-center text-indigo-600 font-bold text-sm animate-pulse">
                রুটিন ডাটা লোড হচ্ছে, অনুগ্রহ করে অপেক্ষা করুন...
              </div>
            );
          }

          if (error) {
            return (
              <div className="py-12 text-center text-red-600 font-bold text-sm bg-red-50 rounded-2xl border border-red-100">
                দুঃখিত, রুটিন লোড করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।
              </div>
            );
          }

          // Filter class routines for the selected class
          const filtered = routines.filter(
            (r) => r.type === "class" && r.className === selectedClass
          );

          const editedRoutines = filtered.filter(r => r.isEdited && r.editedAt);
          const latestEditedAt = editedRoutines.length > 0
            ? editedRoutines.reduce((latest, r) => {
                if (!latest) return r.editedAt || "";
                return new Date(r.editedAt || "") > new Date(latest) ? (r.editedAt || "") : latest;
              }, "")
            : null;

          // Filter exam routines for the selected exam class
          const examRoutines = routines.filter(
            (r) => r.type === "exam" && r.className === selectedExamClass
          );
          const activeExamRoutine = examRoutines[0];

          return (
            <div className="space-y-12">
              {/* === SECTION 1: CLASS ROUTINE === */}
              {activeView === "class" && (
                <div className="space-y-6">
                {/* Selected class display title */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-indigo-100 pb-4">
                  <h3 
                    className="text-2xl font-black text-indigo-950"
                    style={{ fontFamily: '"Ador Noirit", "Hind Siliguri", "Anek Bangla", sans-serif' }}
                  >
                    {selectedClass}
                  </h3>

                  {/* PDF Download Action */}
                  {filtered.length > 0 && (
                    <div className="flex gap-2 print:hidden w-full sm:w-auto">
                      <button
                        id="routine-download-btn"
                        onClick={() => downloadRoutinePDF(filtered, latestEditedAt)}
                        className="flex-1 sm:flex-initial flex items-center justify-center space-x-1.5 bg-indigo-700 hover:bg-indigo-800 text-white font-bold py-2.5 px-5 rounded-xl text-xs shadow-md transition-all cursor-pointer"
                        style={{ fontFamily: '"Ador Noirit", "Hind Siliguri", "Anek Bangla", sans-serif' }}
                      >
                        <Download className="h-4 w-4" />
                        <span>রুটিন পিডিএফ ডাউনলোড</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Routine table layout */}
                {filtered.length === 0 ? (
                  <div 
                    className="py-16 text-center text-gray-500 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 px-6"
                    style={{ fontFamily: '"Ador Noirit", "Hind Siliguri", "Anek Bangla", sans-serif' }}
                  >
                    <BookOpen className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                    <p className="font-bold text-sm">এই ক্লাসের জন্য কোনো ক্লাস রুটিন তথ্য পাওয়া যায়নি।</p>
                    <p className="text-xs text-gray-400 mt-1">অনুগ্রহ করে অন্য কোনো ক্লাস নির্বাচন করুন।</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="overflow-hidden bg-white border border-indigo-100 rounded-2xl shadow-sm print:shadow-none print:border-none">
                      <div className="overflow-x-auto">
                        <table id="routine-data-table" className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-indigo-950 text-white border-b border-indigo-900 print:bg-slate-100 print:text-black">
                              <th 
                                className="p-4 text-xs font-bold uppercase tracking-wider text-center w-16"
                                style={{ fontFamily: '"Ador Noirit", "Hind Siliguri", "Anek Bangla", sans-serif' }}
                              >
                                ক্রমিক
                              </th>
                              <th 
                                className="p-4 text-xs font-bold uppercase tracking-wider"
                                style={{ fontFamily: '"Ador Noirit", "Hind Siliguri", "Anek Bangla", sans-serif' }}
                              >
                                বিষয়
                              </th>
                              <th 
                                className="p-4 text-xs font-bold uppercase tracking-wider"
                                style={{ fontFamily: '"Ador Noirit", "Hind Siliguri", "Anek Bangla", sans-serif' }}
                              >
                                সময়
                              </th>
                              <th 
                                className="p-4 text-xs font-bold uppercase tracking-wider"
                                style={{ fontFamily: '"Ador Noirit", "Hind Siliguri", "Anek Bangla", sans-serif' }}
                              >
                                দিন
                              </th>
                              <th 
                                className="p-4 text-xs font-bold uppercase tracking-wider"
                                style={{ fontFamily: '"Ador Noirit", "Hind Siliguri", "Anek Bangla", sans-serif' }}
                              >
                                দ্বায়িত্বপ্রাপ্ত শিক্ষক
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-indigo-50/50">
                            {filtered.map((routine, index) => (
                              <tr
                                key={routine.id}
                                className="hover:bg-indigo-50/10 transition-colors odd:bg-slate-50/30 print:hover:bg-transparent"
                              >
                                <td className="p-4 text-xs text-gray-500 text-center font-bold">
                                  {index + 1}
                                </td>
                                <td 
                                  className="p-4 text-xs font-bold text-indigo-950"
                                  style={{ fontFamily: '"Ador Noirit", "Hind Siliguri", "Anek Bangla", sans-serif' }}
                                >
                                  <div className="flex items-center space-x-2">
                                    <BookOpen className="h-4 w-4 text-indigo-600 mr-1.5 flex-shrink-0 print:hidden" />
                                    <span>{routine.subject}</span>
                                  </div>
                                </td>
                                <td 
                                  className="p-4 text-xs text-slate-700 font-medium"
                                  style={{ fontFamily: '"Ador Noirit", "Hind Siliguri", "Anek Bangla", sans-serif' }}
                                >
                                  <div className="flex items-center space-x-1">
                                    <Clock className="h-3.5 w-3.5 text-indigo-400 mr-1.5 flex-shrink-0 print:hidden" />
                                    <span>{routine.time}</span>
                                  </div>
                                </td>
                                <td 
                                  className="p-4 text-xs text-slate-700 font-bold"
                                  style={{ fontFamily: '"Ador Noirit", "Hind Siliguri", "Anek Bangla", sans-serif' }}
                                >
                                  <div className="flex items-center space-x-1">
                                    <Calendar className="h-3.5 w-3.5 text-indigo-400 mr-1.5 flex-shrink-0 print:hidden" />
                                    <span>{routine.dayOrDate}</span>
                                  </div>
                                </td>
                                <td 
                                  className="p-4 text-xs text-slate-700 font-bold"
                                  style={{ fontFamily: '"Ador Noirit", "Hind Siliguri", "Anek Bangla", sans-serif' }}
                                >
                                  <div className="flex items-center space-x-2">
                                    <GraduationCap className="h-4 w-4 text-indigo-600 mr-1.5 flex-shrink-0 print:hidden" />
                                    <span>{routine.teacherName}</span>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Dynamic Last Update Indicator */}
                    {latestEditedAt && (
                      <div 
                        className="p-3 bg-indigo-50/50 border border-indigo-150 rounded-xl text-indigo-900 text-xs font-bold flex items-center gap-2 max-w-fit animate-fade-in"
                        style={{ fontFamily: '"Ador Noirit", "Hind Siliguri", "Anek Bangla", sans-serif' }}
                      >
                        <Clock className="h-4 w-4 text-indigo-600 animate-pulse" />
                        <span>শেষবার আপডেট: {getBengaliFormattedDate(latestEditedAt)}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
              )}

              {/* === SECTION 2: EXAM ROUTINE === */}
              {activeView === "exam" && (
                <div className="space-y-6 pt-8 border-t border-indigo-100/80">
                {/* Selector Header */}
                <div className="bg-indigo-50/50 p-6 rounded-2xl border border-indigo-100/80 shadow-sm space-y-4 print:hidden">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="space-y-1">
                      <h3 
                        className="text-lg font-bold text-indigo-950 flex items-center gap-2"
                        style={{ fontFamily: '"Ador Noirit", "Hind Siliguri", "Anek Bangla", sans-serif' }}
                      >
                        <Calendar className="h-5 w-5 text-indigo-600" />
                        <span>২. পরীক্ষা রুটিন</span>
                      </h3>
                      <p className="text-xs text-gray-500">
                        আপনার নির্দিষ্ট ক্লাসের পরীক্ষা রুটিন দেখতে নিচের তালিকা থেকে সিলেক্ট করুন।
                      </p>
                    </div>

                    {/* Custom Select dropdown for exam routine */}
                    <div className="w-full sm:w-auto min-w-[200px]">
                      <select
                        id="exam-routine-class-filter"
                        value={selectedExamClass}
                        onChange={(e) => setSelectedExamClass(e.target.value)}
                        className="w-full bg-white border border-indigo-200 hover:border-indigo-400 rounded-xl px-4 py-2.5 text-sm font-bold text-indigo-950 outline-none focus:ring-2 focus:ring-indigo-500 transition-all cursor-pointer shadow-xs"
                        style={{ fontFamily: '"Ador Noirit", "Hind Siliguri", "Anek Bangla", sans-serif' }}
                      >
                        {classOptions.map((cls) => (
                          <option key={cls} value={cls} className="font-bold text-slate-800">
                            {cls}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Exam Table and guidelines details */}
                {!activeExamRoutine ? (
                  <div 
                    className="py-16 text-center text-gray-500 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 px-6"
                    style={{ fontFamily: '"Ador Noirit", "Hind Siliguri", "Anek Bangla", sans-serif' }}
                  >
                    <BookOpen className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                    <p className="font-bold text-sm">এই ক্লাসের জন্য কোনো পরীক্ষা রুটিন তথ্য পাওয়া যায়নি।</p>
                    <p className="text-xs text-gray-400 mt-1">অনুগ্রহ করে অন্য কোনো ক্লাস নির্বাচন করুন।</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Selected class display title */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-indigo-100 pb-4">
                      <div className="space-y-1">
                        <h3 
                          className="text-2.5xl font-black text-indigo-950"
                          style={{ fontFamily: '"Ador Noirit", "Hind Siliguri", "Anek Bangla", sans-serif' }}
                        >
                          {selectedExamClass} - {activeExamRoutine.examName}
                        </h3>
                      </div>

                      {/* Exam PDF Download Action */}
                      <div className="flex gap-2 print:hidden w-full sm:w-auto">
                        <button
                          id="exam-routine-download-btn"
                          onClick={() => downloadExamRoutinePDF(activeExamRoutine.examName || "পরীক্ষা")}
                          className="flex-1 sm:flex-initial flex items-center justify-center space-x-1.5 bg-indigo-700 hover:bg-indigo-800 text-white font-bold py-2.5 px-5 rounded-xl text-xs shadow-md transition-all cursor-pointer animate-fade-in"
                          style={{ fontFamily: '"Ador Noirit", "Hind Siliguri", "Anek Bangla", sans-serif' }}
                        >
                          <Download className="h-4 w-4" />
                          <span>পরীক্ষা রুটিন পিডিএফ ডাউনলোড</span>
                        </button>
                      </div>
                    </div>

                    {/* Table with 5 columns: তারিখ, বিষয়, সময়, নাম্বার, বিষয় কোড */}
                    <div className="overflow-hidden bg-white border border-indigo-100 rounded-2xl shadow-sm">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-indigo-950 text-white border-b border-indigo-900">
                              <th 
                                className="p-4 text-xs font-bold uppercase tracking-wider text-center"
                                style={{ fontFamily: '"Ador Noirit", "Hind Siliguri", "Anek Bangla", sans-serif' }}
                              >
                                তারিখ
                              </th>
                              <th 
                                className="p-4 text-xs font-bold uppercase tracking-wider text-center"
                                style={{ fontFamily: '"Ador Noirit", "Hind Siliguri", "Anek Bangla", sans-serif' }}
                              >
                                বিষয়
                              </th>
                              <th 
                                className="p-4 text-xs font-bold uppercase tracking-wider text-center"
                                style={{ fontFamily: '"Ador Noirit", "Hind Siliguri", "Anek Bangla", sans-serif' }}
                              >
                                সময়
                              </th>
                              <th 
                                className="p-4 text-xs font-bold uppercase tracking-wider text-center"
                                style={{ fontFamily: '"Ador Noirit", "Hind Siliguri", "Anek Bangla", sans-serif' }}
                              >
                                নাম্বার
                              </th>
                              <th 
                                className="p-4 text-xs font-bold uppercase tracking-wider text-center"
                                style={{ fontFamily: '"Ador Noirit", "Hind Siliguri", "Anek Bangla", sans-serif' }}
                              >
                                বিষয় কোড
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-indigo-50/50">
                            {Array.isArray(activeExamRoutine.subjects) && activeExamRoutine.subjects.map((sub, index) => (
                              <tr
                                key={index}
                                className="hover:bg-indigo-50/10 transition-colors odd:bg-slate-50/30 text-center"
                              >
                                <td 
                                  className="p-4 text-xs font-bold text-slate-700"
                                  style={{ fontFamily: '"Ador Noirit", "Hind Siliguri", "Anek Bangla", sans-serif' }}
                                >
                                  {sub.date}
                                </td>
                                <td 
                                  className="p-4 text-xs font-bold text-indigo-950"
                                  style={{ fontFamily: '"Ador Noirit", "Hind Siliguri", "Anek Bangla", sans-serif' }}
                                >
                                  {sub.subject}
                                </td>
                                <td 
                                  className="p-4 text-xs text-slate-700 font-medium"
                                  style={{ fontFamily: '"Ador Noirit", "Hind Siliguri", "Anek Bangla", sans-serif' }}
                                >
                                  {sub.time}
                                </td>
                                <td 
                                  className="p-4 text-xs text-slate-700 font-bold"
                                  style={{ fontFamily: '"Ador Noirit", "Hind Siliguri", "Anek Bangla", sans-serif' }}
                                >
                                  {sub.totalMarks}
                                </td>
                                <td 
                                  className="p-4 text-xs text-slate-700 font-bold"
                                  style={{ fontFamily: '"Ador Noirit", "Hind Siliguri", "Anek Bangla", sans-serif' }}
                                >
                                  {sub.subjectCode}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Guidelines Block */}
                    <div className="bg-slate-50 border border-slate-150 p-6 rounded-2xl space-y-3">
                      <h4 
                        className="text-sm font-black text-indigo-950"
                        style={{ fontFamily: '"Ador Noirit", "Hind Siliguri", "Anek Bangla", sans-serif' }}
                      >
                        পরীক্ষার্থীদের জন্য সাধারণ নির্দেশনা:
                      </h4>
                      <ul 
                        className="space-y-2 text-xs text-slate-700"
                        style={{ fontFamily: '"Ador Noirit", "Hind Siliguri", "Anek Bangla", sans-serif' }}
                      >
                        {Array.isArray(activeExamRoutine.guidelines) && activeExamRoutine.guidelines.map((gl, i) => (
                          <li key={i} className="flex gap-2">
                            <span className="font-bold">{toBengaliDigits((i + 1).toString())}.</span>
                            <span>{gl}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Principal Signature Area */}
                    <div className="flex justify-end pt-8">
                      <div className="text-center w-48">
                        <div className="border-t border-slate-400 w-full mb-2"></div>
                        <p 
                          className="text-xs font-bold text-slate-800"
                          style={{ fontFamily: '"Ador Noirit", "Hind Siliguri", "Anek Bangla", sans-serif' }}
                        >
                          প্রধান শিক্ষকের স্বাক্ষর
                        </p>
                      </div>
                    </div>

                    {/* Dynamic Last Update Indicator */}
                    {activeExamRoutine.isEdited && activeExamRoutine.editedAt && (
                      <div 
                        className="p-3 bg-indigo-50/50 border border-indigo-150 rounded-xl text-indigo-900 text-xs font-bold flex items-center gap-2 max-w-fit animate-fade-in"
                        style={{ fontFamily: '"Ador Noirit", "Hind Siliguri", "Anek Bangla", sans-serif' }}
                      >
                        <Clock className="h-4 w-4 text-indigo-600 animate-pulse" />
                        <span>শেষবার আপডেট: {getBengaliFormattedDate(activeExamRoutine.editedAt)}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
              )}

              {/* Hidden A4 template for Class PDF generation */}
              <div style={{ position: "absolute", left: "-9999px", top: "-9999px" }}>
                <div 
                  id="routine-pdf-template" 
                  className="p-12 shadow-md font-alinur animate-fade-in" 
                  style={{ 
                    width: "800px", 
                    minHeight: "1120px", 
                    fontFamily: '"Ador Noirit", "Hind Siliguri", "Anek Bangla", sans-serif',
                    backgroundColor: "#ffffff",
                    border: "1px solid #e2e8f0",
                    color: "#0f172a"
                  }}
                >
                  {/* Top Header section */}
                  <div className="flex items-center justify-between pb-6 mb-8" style={{ borderBottom: "2px solid #312e81" }}>
                    <div className="flex items-center gap-4">
                      <img 
                        src={logoUrl || "/photo/logo.png"} 
                        alt="Madrasa Logo" 
                        className="h-20 w-20 object-contain rounded-full p-1"
                        style={{ backgroundColor: "#ffffff", border: "1px solid #f1f5f9" }}
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = "https://cdn-icons-png.flaticon.com/512/2913/2913520.png";
                        }}
                        crossOrigin="anonymous"
                        referrerPolicy="no-referrer"
                      />
                      <div>
                        <h1 className="text-2xl font-black" style={{ color: "#1e1b4b" }}>সুফিয়া নূরীয়া দাখিল মাদ্রাসা</h1>
                        <p className="text-xs mt-1" style={{ color: "#4b5563" }}>{madrasaAddress}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="inline-block text-xs font-bold px-3 py-1.5 rounded-lg" style={{ backgroundColor: "#eef2ff", border: "1px solid #e0e7ff", color: "#3730a3" }}>
                        অফিসিয়াল ক্লাস রুটিন
                      </span>
                    </div>
                  </div>

                  {/* Highlighted Bold Class Title */}
                  <div className="text-center mb-8">
                    <h2 className="text-2xl font-black py-3 px-6 rounded-2xl inline-block" style={{ color: "#1e1b4b", backgroundColor: "rgba(238, 242, 255, 0.5)", border: "1px solid #e0e7ff" }}>
                      {selectedClass} বার্ষিক ক্লাস রুটিন
                    </h2>
                  </div>

                  {/* Table of 4 columns: "বিষয়", "সময়", "দিন", "দ্বায়িত্বপ্রাপ্ত শিক্ষক" */}
                  <table className="w-full text-left border-collapse rounded-xl overflow-hidden" style={{ border: "1px solid #e0e7ff" }}>
                    <thead>
                      <tr className="text-white text-xs" style={{ backgroundColor: "#1e1b4b" }}>
                        <th className="p-4 font-bold" style={{ border: "1px solid #312e81" }}>বিষয়</th>
                        <th className="p-4 font-bold" style={{ border: "1px solid #312e81" }}>সময়</th>
                        <th className="p-4 font-bold" style={{ border: "1px solid #312e81" }}>দিন</th>
                        <th className="p-4 font-bold" style={{ border: "1px solid #312e81" }}>দ্বায়িত্বপ্রাপ্ত শিক্ষক</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Array.isArray(filtered) && filtered.map((item, rowIdx) => (
                        <tr 
                          key={item.id} 
                          className="text-xs"
                          style={{ backgroundColor: rowIdx % 2 === 0 ? "rgba(248, 250, 252, 0.5)" : "#ffffff" }}
                        >
                          <td className="p-4 font-bold" style={{ border: "1px solid #eef2ff", color: "#1e1b4b" }}>{item.subject}</td>
                          <td className="p-4 font-medium" style={{ border: "1px solid #eef2ff", color: "#334155" }}>{item.time}</td>
                          <td className="p-4 font-bold" style={{ border: "1px solid #eef2ff", color: "#334155" }}>{item.dayOrDate}</td>
                          <td className="p-4 font-bold" style={{ border: "1px solid #eef2ff", color: "#334155" }}>{item.teacherName}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Footer of PDF */}
                  <div className="mt-16 pt-6 flex justify-between items-center text-[11px]" style={{ borderTop: "1px solid #f1f5f9", color: "#6b7280" }}>
                    <div>সুফিয়া নূরীয়া দাখিল মাদ্রাসা © {toBengaliDigits(new Date().getFullYear().toString())} | সর্বস্বত্ব সংরক্ষিত</div>
                    {latestEditedAt && (
                      <div className="font-bold px-2.5 py-1 rounded-md" style={{ color: "#1e1b4b", backgroundColor: "#eef2ff" }}>
                        শেষবার আপডেট: {getBengaliFormattedDate(latestEditedAt)}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Hidden A4 template for Exam PDF generation */}
              {activeExamRoutine && (
                <div style={{ position: "absolute", left: "-9999px", top: "-9999px" }}>
                  <div 
                    id="exam-routine-pdf-template" 
                    className="p-12 shadow-md font-alinur animate-fade-in" 
                    style={{ 
                      width: "800px", 
                      minHeight: "1120px", 
                      fontFamily: '"Ador Noirit", "Hind Siliguri", "Anek Bangla", sans-serif',
                      backgroundColor: "#ffffff",
                      border: "1px solid #e2e8f0",
                      color: "#0f172a"
                    }}
                  >
                    {/* Top Header section */}
                    <div className="flex items-center justify-between pb-6 mb-8" style={{ borderBottom: "2px solid #312e81" }}>
                      <div className="flex items-center gap-4">
                        <img 
                          src={logoUrl || "/photo/logo.png"} 
                          alt="Madrasa Logo" 
                          className="h-20 w-20 object-contain rounded-full p-1"
                          style={{ backgroundColor: "#ffffff", border: "1px solid #f1f5f9" }}
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = "https://cdn-icons-png.flaticon.com/512/2913/2913520.png";
                          }}
                          crossOrigin="anonymous"
                          referrerPolicy="no-referrer"
                        />
                        <div>
                          <h1 className="text-2xl font-black" style={{ color: "#1e1b4b" }}>সুফিয়া নূরীয়া দাখিল মাদ্রাসা</h1>
                          <p className="text-xs mt-1" style={{ color: "#4b5563" }}>{madrasaAddress}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="inline-block text-xs font-bold px-3 py-1.5 rounded-lg" style={{ backgroundColor: "#eef2ff", border: "1px solid #e0e7ff", color: "#3730a3" }}>
                          অফিসিয়াল পরীক্ষা রুটিন
                        </span>
                      </div>
                    </div>

                    {/* Highlighted Bold Class & Exam Title */}
                    <div className="text-center mb-8">
                      <h2 className="text-2xl font-black py-3 px-6 rounded-2xl inline-block" style={{ color: "#1e1b4b", backgroundColor: "rgba(238, 242, 255, 0.5)", border: "1px solid #e0e7ff" }}>
                        {selectedExamClass} - {activeExamRoutine.examName} রুটিন
                      </h2>
                    </div>

                    {/* Table of 5 columns */}
                    <table className="w-full text-left border-collapse rounded-xl overflow-hidden" style={{ border: "1px solid #e0e7ff" }}>
                      <thead>
                        <tr className="text-white text-xs" style={{ backgroundColor: "#1e1b4b" }}>
                          <th className="p-3 font-bold text-center" style={{ border: "1px solid #312e81" }}>তারিখ</th>
                          <th className="p-3 font-bold text-center" style={{ border: "1px solid #312e81" }}>বিষয়</th>
                          <th className="p-3 font-bold text-center" style={{ border: "1px solid #312e81" }}>সময়</th>
                          <th className="p-3 font-bold text-center" style={{ border: "1px solid #312e81" }}>নাম্বার</th>
                          <th className="p-3 font-bold text-center" style={{ border: "1px solid #312e81" }}>বিষয় কোড</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Array.isArray(activeExamRoutine.subjects) && activeExamRoutine.subjects.map((item, rowIdx) => (
                          <tr 
                            key={rowIdx} 
                            className="text-xs text-center"
                            style={{ backgroundColor: rowIdx % 2 === 0 ? "rgba(248, 250, 252, 0.5)" : "#ffffff" }}
                          >
                            <td className="p-3 font-bold" style={{ border: "1px solid #eef2ff", color: "#334155" }}>{item.date}</td>
                            <td className="p-3 font-bold" style={{ border: "1px solid #eef2ff", color: "#1e1b4b" }}>{item.subject}</td>
                            <td className="p-3 font-medium" style={{ border: "1px solid #eef2ff", color: "#334155" }}>{item.time}</td>
                            <td className="p-3 font-bold" style={{ border: "1px solid #eef2ff", color: "#334155" }}>{item.totalMarks}</td>
                            <td className="p-3 font-bold" style={{ border: "1px solid #eef2ff", color: "#334155" }}>{item.subjectCode}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    {/* Guidelines Section in PDF */}
                    <div className="mt-8 p-6 rounded-2xl" style={{ backgroundColor: "#f8fafc", border: "1px solid #e2e8f0" }}>
                      <h3 className="text-sm font-black mb-3" style={{ color: "#1e1b4b" }}>পরীক্ষার্থীদের জন্য সাধারণ নির্দেশনা:</h3>
                      <ul className="space-y-2 text-xs" style={{ color: "#475569" }}>
                        {Array.isArray(activeExamRoutine.guidelines) && activeExamRoutine.guidelines.map((gl, i) => (
                          <li key={i} className="flex gap-2">
                            <span>{toBengaliDigits((i + 1).toString())}.</span>
                            <span>{gl}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Signature Area */}
                    <div className="mt-16 flex justify-end">
                      <div className="text-center w-48">
                        <div style={{ borderTop: "1px solid #0f172a", width: "100%", margin: "0 auto 8px auto" }}></div>
                        <p className="text-xs font-bold" style={{ color: "#0f172a" }}>প্রধান শিক্ষকের স্বাক্ষর</p>
                      </div>
                    </div>

                    {/* Footer of PDF */}
                    <div className="mt-16 pt-6 flex justify-between items-center text-[11px]" style={{ borderTop: "1px solid #f1f5f9", color: "#6b7280" }}>
                      <div>সুফিয়া নূরীয়া দাখিল মাদ্রাসা © {toBengaliDigits(new Date().getFullYear().toString())} | সর্বস্বত্ব সংরক্ষিত</div>
                      {activeExamRoutine.isEdited && activeExamRoutine.editedAt && (
                        <div className="font-bold px-2.5 py-1 rounded-md" style={{ color: "#1e1b4b", backgroundColor: "#eef2ff" }}>
                          শেষবার আপডেট: {getBengaliFormattedDate(activeExamRoutine.editedAt)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        }}
      />
    </div>
  )}
</>
);
}}
/>
</div>
);
}
