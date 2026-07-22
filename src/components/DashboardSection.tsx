import React, { useEffect, useState, useMemo } from "react";
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, query, orderBy, setDoc, getDocs, getDoc, serverTimestamp, where, limit } from "firebase/firestore";
import { db, handleFirestoreError, OperationType, uploadFileToImgBB, StreamBuilder } from "../lib/firebase";
import { checkDuplicatePhoneNumberGlobal, checkUniqueLoginIdGlobal } from "../lib/validation";
import { Teacher, SuccessStory, CommitteeMember, HonoredPerson, AdmissionForm, Routine, ContactMessage } from "../types";
import { Trash2, Edit3, Plus, Check, X, CreditCard, Mail, UserPlus, Users, GraduationCap, Calendar, Award, MessageSquare, Heart, CheckCircle2, XCircle, Settings, Megaphone, ChevronDown, ChevronRight, LayoutDashboard, Globe, Lock, ArrowLeft, CheckCircle, AlertCircle, AlertTriangle, CalendarCheck, CalendarRange, ClipboardList, Loader2, BookOpen, Home, Compass, HelpCircle, Send, Clock, LogOut, Activity, TrendingUp, History, Search, Menu, Phone, MapPin, User, Info, FileText, TrendingDown, FilePlus } from "lucide-react";
import PathdanUpdateForm from "./PathdanUpdateForm";
import SodossoFormUpdateForm from "./SodossoFormUpdateForm";
import KormochariUpdateForm from "./KormochariUpdateForm";
import HafizgonUpdateForm from "./HafizgonUpdateForm";
import TeacherManagement from "./TeacherManagement";
import AdminControlSection from "./AdminControlSection";
import AdminHomeworkSubjectManagement from "./AdminHomeworkSubjectManagement";
import { motion, AnimatePresence } from "motion/react";

const toBengaliDigits = (numStr: string | number | undefined | null): string => {
  if (numStr === undefined || numStr === null) return "";
  const banglaDigits = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
  return numStr.toString().replace(/[0-9]/g, (match) => banglaDigits[parseInt(match, 10)]);
};

const toEnglishDigits = (numStr: string | number | undefined | null): string => {
  if (numStr === undefined || numStr === null) return "";
  const banglaToEnglish: { [key: string]: string } = {
    "০": "0", "১": "1", "২": "2", "৩": "3", "৪": "4", "৫": "5", "৬": "6", "৭": "7", "৮": "8", "৯": "9"
  };
  return numStr.toString().replace(/[০-৯]/g, (match) => banglaToEnglish[match]);
};

const compareRolls = (roll1: string | number, roll2: string | number): boolean => {
  if (roll1 === undefined || roll1 === null || roll2 === undefined || roll2 === null) return false;
  const r1Str = toEnglishDigits(roll1.toString().trim()).replace(/^0+/, "");
  const r2Str = toEnglishDigits(roll2.toString().trim()).replace(/^0+/, "");
  return r1Str === r2Str;
};

interface DashboardSectionProps {
  user: { email: string; role: "student" | "teacher" | "admin"; name: string; adminRole?: string };
  setUser: (user: any) => void;
  setActiveTab: (tab: string) => void;
}

// Sub-component to stabilize student-specific queries and prevent re-subscription loops
const StudentDashboardInner = ({ 
  loggedInStudent, 
  studentName, 
  studentClass, 
  studentRoll, 
  studentPhone,
  studentPhoto,
  formattedDate,
  user,
  studentActiveTab,
  setStudentActiveTab,
  setShowLogoutConfirm,
  supportSubject,
  setSupportSubject,
  supportMessage,
  setSupportMessage,
  isSubmittingSupport,
  supportSuccess,
  handleSupportSubmit,
  toBengaliDigits,
  setSelectedHomework,
  setShowHomeworkDetailModal
}: any) => {
  const today = new Date();
  
  // State to load teachers and handle gender suffix automatically
  const [teachersList, setTeachersList] = useState<any[]>([]);
  const [homeworkSubTab, setHomeworkSubTab] = useState<"today" | "pending">("today");
  const [selectedStudySubject, setSelectedStudySubject] = useState<string>("");
  const [showSubjectListDropdown, setShowSubjectListDropdown] = useState<boolean>(false);
  const [showDetailsModal, setShowDetailsModal] = useState<boolean>(false);

  // Leave Application States
  const [showLeaveModal, setShowLeaveModal] = useState<boolean>(false);
  const [leaveStartDate, setLeaveStartDate] = useState<string>("");
  const [leaveEndDate, setLeaveEndDate] = useState<string>("");
  const [leaveReason, setLeaveReason] = useState<string>("");
  const [isSubmittingLeave, setIsSubmittingLeave] = useState<boolean>(false);

  const calculateLeaveDays = (startStr: string, endStr: string) => {
    if (!startStr || !endStr) return 0;
    const s = new Date(startStr).getTime();
    const e = new Date(endStr).getTime();
    if (isNaN(s) || isNaN(e) || e < s) return 0;
    return Math.ceil((e - s) / (1000 * 60 * 60 * 24)) + 1;
  };

  const handleLeaveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leaveStartDate || !leaveEndDate) {
      alert("অনুগ্রহ করে ছুটির শুরুর তারিখ এবং শেষ তারিখ নির্বাচন করুন।");
      return;
    }
    
    const daysCount = calculateLeaveDays(leaveStartDate, leaveEndDate);
    if (daysCount <= 0) {
      alert("শেষ তারিখ অবশ্যই শুরুর তারিখের সমান বা পরবর্তী হতে হবে।");
      return;
    }
    
    if (!leaveReason.trim()) {
      alert("অনুগ্রহ করে ছুটির সুনির্দিষ্ট কারণ লিখুন।");
      return;
    }
    
    setIsSubmittingLeave(true);
    try {
      await addDoc(collection(db, "leaves"), {
        studentName: studentName || "শিক্ষার্থী",
        className: studentClass || "",
        studentRoll: studentRoll || "",
        startDate: leaveStartDate,
        endDate: leaveEndDate,
        totalDays: daysCount,
        reason: leaveReason.trim(),
        status: "Pending",
        createdAt: serverTimestamp()
      });
      alert("আপনার ছুটির আবেদন জমা হয়েছে! অনুগ্রহ করে অপেক্ষা করুন।");
      setLeaveStartDate("");
      setLeaveEndDate("");
      setLeaveReason("");
      setShowLeaveModal(false);
    } catch (err) {
      console.error("Error submitting leave application:", err);
      alert("আবেদন জমা দিতে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।");
    } finally {
      setIsSubmittingLeave(false);
    }
  };

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "teachers"), (snapshot) => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTeachersList(list);
    }, (error) => {
      console.error("Error loading teachers for student display suffix:", error);
    });
    return () => unsubscribe();
  }, []);

  const getTeacherDisplayName = (name: string) => {
    if (!name) return "মাদ্রাসা শিক্ষক";
    const nameLower = name.trim().toLowerCase();
    const matchedTeacher = teachersList.find(t => t.name?.trim().toLowerCase() === nameLower);
    const gender = matchedTeacher?.gender || "পুরুষ";
    const isFemale = gender === "নারী" || gender === "মহিলা" || 
                     nameLower.includes("ম্যাডাম") || 
                     nameLower.includes("খাতুন") || 
                     nameLower.includes("বেগম") || 
                     nameLower.includes("মোসাম্মৎ") || 
                     nameLower.includes("মোসাঃ") ||
                     nameLower.includes("মিস") || 
                     nameLower.includes("মিজ");
    if (isFemale) {
      if (name.endsWith("ম্যাডাম")) return name;
      return `${name} ম্যাডাম`;
    } else {
      if (name.endsWith("স্যার")) return name;
      return `${name} স্যার`;
    }
  };

  const getLastLoginStatus = () => {
    let lastLoginTime = null;
    try {
      const savedUserStr = localStorage.getItem("sndm_user");
      if (savedUserStr) {
        const savedUser = JSON.parse(savedUserStr);
        if (savedUser && savedUser.lastLogin) {
          lastLoginTime = new Date(savedUser.lastLogin);
        }
      }
    } catch (e) {
      console.error("Error reading last login info:", e);
    }
    
    if (!lastLoginTime && user?.lastLogin) {
      lastLoginTime = new Date(user.lastLogin);
    }
    
    if (!lastLoginTime) {
      lastLoginTime = new Date();
    }
    
    return lastLoginTime.toLocaleString('bn-BD', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  // Memoize student-specific queries to prevent infinite re-listening loops
  const attendanceQuery = useMemo(() => {
    if (!studentRoll) return null;
    return query(
      collection(db, "attendance"), 
      where("studentRoll", "==", studentRoll), 
      where("month", "==", today.toLocaleString('en-US', { month: 'long' }))
    );
  }, [studentRoll]);

  const resultsQuery = useMemo(() => {
    if (!studentRoll) return null;
    return query(
      collection(db, "results"), 
      where("roll", "==", studentRoll), 
      orderBy("year", "desc")
    );
  }, [studentRoll]);

  const homeworkQuery = useMemo(() => {
    return query(collection(db, "homework"), orderBy("createdAt", "desc"));
  }, []);

  return (
    <div className="relative -mt-8 -mx-2 bg-[#f8fafc] pb-28 min-h-screen">
      {/* সলিড গ্রীন হেডার ব্লক (Solid Green Header Block) - Hidden on "পড়া" (homework) & "ফিচার" (features) tabs */}
      {studentActiveTab !== "homework" && studentActiveTab !== "features" && (
        <div className="bg-emerald-900 pt-16 pb-28 px-6 rounded-b-[40px] shadow-lg relative z-0">
          {/* ড্রয়ার নেভিগেশন মেনু বাটন (Top Left Menu Button) */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => window.dispatchEvent(new CustomEvent('toggle-sidebar'))}
            className="absolute top-8 left-6 p-2.5 bg-amber-500 hover:bg-amber-400 text-emerald-950 rounded-2xl shadow-md transition-all cursor-pointer z-20 flex items-center justify-center border border-amber-300 active:scale-95"
            title="মেনু খুলুন"
          >
            <Menu className="h-5 w-5 stroke-[2.5]" />
          </motion.button>

          {/* অ্যানিমেটেড লগআউট বাটন (Top Right Logout Button) */}
          <motion.button
            whileHover={{ scale: 1.1, rotate: 90 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setShowLogoutConfirm(true)}
            className="absolute top-8 right-6 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white/90 backdrop-blur-sm border border-white/10 transition-all cursor-pointer z-20"
            title="লগআউট করুন"
          >
            <LogOut className="h-5 w-5" />
          </motion.button>

          <div className="max-w-md mx-auto text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
              >
                <Clock className="h-4 w-4 text-amber-400" />
              </motion.div>
              <p className="text-emerald-300 font-bold text-sm tracking-wide opacity-90" style={{ fontFamily: 'Alinur Tatsama' }}>{formattedDate}</p>
            </div>
            <motion.h2 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-3xl font-black text-white mt-1 leading-tight" 
              style={{ fontFamily: 'Alinur Tatsama' }}
            >
              {studentName}
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-emerald-100/80 font-bold text-lg mt-1" 
              style={{ fontFamily: 'Alinur Tatsama' }}
            >
              {studentClass}
            </motion.p>
          </div>
        </div>
      )}

      {/* Main Sub-view Content based on studentActiveTab */}
      <div className={`px-6 max-w-lg mx-auto overflow-visible ${studentActiveTab === "homework" || studentActiveTab === "features" ? "pt-6" : "mt-8"}`}>
        <AnimatePresence mode="wait">
          {studentActiveTab === "home" && (
            <motion.div
              key="home"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-6 overflow-visible"
              style={{ fontFamily: 'Alinur Tatsama' }}
            >
              {/* টপ মোস্ট প্রোফাইল কার্ড (Top-most Profile Card) - Overlapping */}
              <div className="relative z-20 -mt-20 mb-6 overflow-visible">
                <motion.div 
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  className="bg-white rounded-[32px] p-6 shadow-[0_20px_50px_rgba(0,0,0,0.06)] border border-slate-100 flex flex-col items-center relative z-20 overflow-visible"
                >
                  <div className="relative group mb-3 p-1 overflow-visible z-30">
                    <div className="absolute inset-0 bg-emerald-500/20 rounded-full blur-lg opacity-30 group-hover:opacity-50 transition-opacity"></div>
                    <div className="h-28 w-28 sm:h-32 sm:w-32 rounded-full border-4 border-emerald-600 shadow-xl overflow-hidden relative z-10 bg-slate-100 flex items-center justify-center shrink-0 p-0.5">
                      <img 
                        src={studentPhoto} 
                        alt={studentName} 
                        className="h-full w-full object-cover object-center rounded-full"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div className="absolute bottom-1 right-1 h-8 w-8 bg-amber-500 rounded-full border-2 border-white flex items-center justify-center shadow-md z-20">
                      <Award className="h-4 w-4 text-emerald-950" />
                    </div>
                  </div>

                  <div className="text-center space-y-1">
                    <h3 className="text-xl font-black text-emerald-950 leading-tight">{studentName}</h3>
                    <p className="text-xs text-slate-500 font-bold">{studentClass}</p>
                    <div className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-800 px-3.5 py-1 rounded-full text-xs font-black border border-emerald-100/80 mt-1">
                      <span>রোল নম্বর:</span>
                      <span className="text-emerald-950 text-sm font-black">{toBengaliDigits(studentRoll)}</span>
                    </div>

                    {/* Active Approved Leave Badge Display */}
                    <StreamBuilder<any>
                      stream={query(collection(db, "leaves"))}
                      builder={(allLeaves) => {
                        const d = new Date();
                        const todayFormatted = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                        const activeLeave = allLeaves.find(l => {
                          const isApproved = l.status === "Approved" || l.status === "approved";
                          if (!isApproved) return false;
                          const matchesUser = compareRolls(l.studentRoll, studentRoll) || l.studentName === studentName;
                          return matchesUser && l.endDate >= todayFormatted && l.startDate <= todayFormatted;
                        });

                        if (!activeLeave) return null;

                        const nowMs = new Date(todayFormatted).getTime();
                        const endMs = new Date(activeLeave.endDate).getTime();
                        const remainingDays = Math.max(0, Math.ceil((endMs - nowMs) / (1000 * 60 * 60 * 24)));

                        return (
                          <motion.div 
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="mt-2.5 bg-emerald-50 border border-emerald-200 text-emerald-950 px-3.5 py-2 rounded-2xl text-xs font-black flex items-center justify-center gap-1.5 shadow-2xs"
                          >
                            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                            <span>আপনার ছুটি শেষ হতে <span className="text-emerald-800 font-black text-sm">{toBengaliDigits(remainingDays)}</span> দিন বাকি।</span>
                          </motion.div>
                        );
                      }}
                    />
                  </div>

                  {/* আকর্ষণীয় "বিস্তারিত" (Details) বাটন */}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowDetailsModal(true)}
                    className="w-full mt-5 py-3.5 px-6 bg-gradient-to-r from-emerald-800 to-emerald-900 hover:from-emerald-900 hover:to-emerald-950 text-amber-400 font-black rounded-2xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 text-sm border border-emerald-700/50 cursor-pointer"
                  >
                    <Info className="h-4.5 w-4.5 text-amber-400" />
                    <span>বিস্তারিত</span>
                  </motion.button>
                </motion.div>
              </div>

              {/* ড্যাশবোর্ড ট্র্যাকিং মডিউল (Academic Tracking Modules) */}
              <div className="grid grid-cols-1 gap-4">
                {/* আজকের হাজিরা ও মাসিক পারসেন্টেজ (Combined Stream for Attendance) */}
                {attendanceQuery && (
                  <StreamBuilder
                    stream={attendanceQuery}
                    builder={(attendanceRecords: any[]) => {
                      const isPresentToday = attendanceRecords.some(r => r.date === today.toISOString().split('T')[0] && r.status === "Present");
                      const currentMonthName = today.toLocaleString('bn-BD', { month: 'long' });
                      const totalDaysInMonth = attendanceRecords.length;
                      const presentDays = attendanceRecords.filter(r => r.status === "Present").length;
                      const percentage = totalDaysInMonth > 0 ? Math.round((presentDays / totalDaysInMonth) * 100) : 90; // Default 90% if no data

                      return (
                        <div className="grid grid-cols-2 gap-4">
                          {/* আজকের হাজিরা স্ট্যাটাস */}
                          <motion.div 
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="bg-white rounded-[28px] p-4 shadow-[0_10px_30px_rgba(0,0,0,0.04)] border border-slate-50 flex flex-col items-center text-center"
                          >
                            <div className={`h-10 w-10 rounded-2xl flex items-center justify-center mb-2 ${isPresentToday ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"}`}>
                              <CalendarCheck className="h-6 w-6" />
                            </div>
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1" style={{ fontFamily: 'Alinur Tatsama' }}>আজকের হাজিরা</span>
                            <span className={`text-lg font-black ${isPresentToday ? "text-emerald-700" : "text-amber-700"}`} style={{ fontFamily: 'Alinur Tatsama' }}>
                              {isPresentToday ? "উপস্থিত (P)" : "তথ্য নেই"}
                            </span>
                          </motion.div>

                          {/* মাসিক হাজিরার হার */}
                          <motion.div 
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="bg-white rounded-[28px] p-4 shadow-[0_10px_30px_rgba(0,0,0,0.04)] border border-slate-50 flex flex-col items-center text-center"
                          >
                            <div className="h-10 w-10 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-2">
                              <TrendingUp className="h-6 w-6" />
                            </div>
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1" style={{ fontFamily: 'Alinur Tatsama' }}>{currentMonthName} মাসের হাজিরা</span>
                            <div className="flex flex-col items-center">
                              <span className="text-xl font-black text-indigo-900" style={{ fontFamily: 'Alinur Tatsama' }}>{toBengaliDigits(percentage)}%</span>
                              <div className="w-16 h-1 bg-slate-100 rounded-full mt-1 overflow-hidden">
                                <motion.div 
                                  initial={{ width: 0 }}
                                  animate={{ width: `${percentage}%` }}
                                  className="h-full bg-indigo-500"
                                />
                              </div>
                            </div>
                          </motion.div>
                        </div>
                      );
                    }}
                  />
                )}

                {/* সর্বশেষ রেজাল্ট স্ট্যাটাস */}
                {resultsQuery && (
                  <StreamBuilder
                    stream={resultsQuery}
                    builder={(results: any[]) => {
                      const latestResult = results[0] || { examType: "বার্ষিক পরীক্ষা", year: "২০২৬", gpa: "৪.৮৫", grade: "A" };
                      return (
                        <motion.div 
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="bg-white rounded-[28px] p-5 shadow-[0_10px_40px_rgba(0,0,0,0.05)] border border-emerald-100/50 flex items-center justify-between group overflow-hidden relative"
                        >
                          <div className="absolute right-0 top-0 bottom-0 w-24 bg-emerald-500/5 -skew-x-12 translate-x-8 group-hover:translate-x-4 transition-transform" />
                          
                          <div className="flex items-center gap-4 relative z-10">
                            <div className="h-12 w-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center border border-amber-100 shadow-sm">
                              <Award className="h-7 w-7" />
                            </div>
                            <div>
                              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5" style={{ fontFamily: 'Alinur Tatsama' }}>সর্বশেষ রেজাল্ট স্ট্যাটাস</p>
                              <h4 className="text-lg font-black text-emerald-950" style={{ fontFamily: 'Alinur Tatsama' }}>{latestResult.examType} - {toBengaliDigits(latestResult.year)}</h4>
                            </div>
                          </div>
                          
                          <div className="text-right relative z-10">
                            <span className="block text-2xl font-black text-emerald-700 leading-none" style={{ fontFamily: 'Alinur Tatsama' }}>{toBengaliDigits(latestResult.gpa)}</span>
                            <span className="text-[10px] font-bold text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100 mt-1 inline-block" style={{ fontFamily: 'Alinur Tatsama' }}>গ্রেড: {latestResult.grade}</span>
                          </div>
                        </motion.div>
                      );
                    }}
                  />
                )}
              </div>
            </motion.div>
          )}

          {studentActiveTab === "homework" && (
            <motion.div
              key="homework"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              style={{ fontFamily: 'Alinur Tatsama' }}
              className="space-y-4"
            >
              {/* পড়া সাব-ট্যাবস */}
              <div className="flex bg-slate-100 p-1 rounded-2xl mb-4">
                <button
                  onClick={() => setHomeworkSubTab("today")}
                  className={`flex-1 py-3 text-sm font-black rounded-xl transition-all ${
                    homeworkSubTab === "today" 
                      ? "bg-white text-emerald-900 shadow-sm" 
                      : "text-slate-500 hover:text-slate-850"
                  }`}
                >
                  আজকের হোমওয়ার্ক
                </button>
                <button
                  onClick={() => setHomeworkSubTab("pending")}
                  className={`flex-1 py-3 text-sm font-black rounded-xl transition-all ${
                    homeworkSubTab === "pending" 
                      ? "bg-white text-emerald-900 shadow-sm" 
                      : "text-slate-500 hover:text-slate-850"
                  }`}
                >
                  বাকি হোমওয়ার্ক
                </button>
              </div>

              {/* Real-time Homework stream builder */}
              <StreamBuilder<any>
                stream={homeworkQuery}
                builder={(homeworkList: any[], loadingHw: boolean, errorHw: any) => {
                  if (loadingHw) {
                    return (
                      <div className="text-center py-12" style={{ fontFamily: 'Alinur Tatsama' }}>
                        <Loader2 className="h-8 w-8 text-emerald-800 animate-spin mx-auto" />
                        <p className="text-sm text-gray-500 mt-2 font-bold">হোমওয়ার্ক লোড হচ্ছে...</p>
                      </div>
                    );
                  }

                  // Filter homeworks for current student class
                  const rawClassHomework = homeworkList.filter((hw: any) => 
                    hw.className === studentClass || hw.class === studentClass || !hw.className
                  );

                  const d = new Date();
                  const todayStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                  const nowMs = Date.now();
                  const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

                  const isToday = (date: Date) => {
                    return date.getFullYear() === d.getFullYear() &&
                           date.getMonth() === d.getMonth() &&
                           date.getDate() === d.getDate();
                  };

                  const classHomework: any[] = [];

                  // Process lifecycle, auto-expire & 24hr auto-delete cleanup
                  rawClassHomework.forEach((hw: any) => {
                    if (!hw.id) return;
                    let isCompleted = hw.status === "completed" || hw.status === "Completed";
                    const isExpired = hw.dueDate ? (hw.dueDate < todayStr) : false;

                    // 1. Auto-mark completed if deadline expired
                    if (isExpired && !isCompleted) {
                      updateDoc(doc(db, "homework", hw.id), {
                        status: "completed",
                        completedAt: serverTimestamp()
                      }).catch((err) => console.error("Error marking expired homework completed:", err));
                      isCompleted = true;
                      hw.status = "completed";
                    }

                    if (isCompleted) {
                      let completedMs = 0;
                      if (hw.completedAt) {
                        if (typeof hw.completedAt.toMillis === 'function') {
                          completedMs = hw.completedAt.toMillis();
                        } else if (hw.completedAt.seconds) {
                          completedMs = hw.completedAt.seconds * 1000;
                        } else {
                          completedMs = new Date(hw.completedAt).getTime();
                        }
                      } else if (hw.createdAt) {
                        if (typeof hw.createdAt.toMillis === 'function') {
                          completedMs = hw.createdAt.toMillis();
                        } else if (hw.createdAt.seconds) {
                          completedMs = hw.createdAt.seconds * 1000;
                        } else {
                          completedMs = new Date(hw.createdAt).getTime();
                        }
                      }

                      // 2. Permanently delete from Firestore if completed > 24 hours (86,400s)
                      if (completedMs > 0 && (nowMs - completedMs >= TWENTY_FOUR_HOURS_MS)) {
                        deleteDoc(doc(db, "homework", hw.id)).catch((err) => console.error("Error auto-deleting homework:", err));
                        return; // Exclude from rendering
                      }
                    }

                    classHomework.push(hw);
                  });

                  // TODAY'S / COMPLETED HOMEWORK: Given today OR completed within 24 hours
                  const todaysHomeworks = classHomework.filter(hw => {
                    const isCompleted = hw.status === "completed" || hw.status === "Completed";
                    if (isCompleted) return true;
                    if (!hw.createdAt) return false;
                    const createdDate = hw.createdAt.toDate ? hw.createdAt.toDate() : new Date(hw.createdAt);
                    return isToday(createdDate);
                  });

                  // PENDING HOMEWORK: Only active homeworks (Not completed & Not expired)
                  const pendingHomeworks = classHomework.filter(hw => {
                    const isCompleted = hw.status === "completed" || hw.status === "Completed";
                    const isExpired = hw.dueDate ? (hw.dueDate < todayStr) : false;
                    return !isCompleted && !isExpired;
                  });

                  if (homeworkSubTab === "today") {
                    const availableSubjects = Array.from(new Set(todaysHomeworks.map((h: any) => h.subject))).sort() as string[];
                    const currentSubject = availableSubjects.includes(selectedStudySubject) 
                      ? selectedStudySubject 
                      : (availableSubjects[0] || "");

                    return (
                      <div className="space-y-4" style={{ fontFamily: 'Alinur Tatsama' }}>
                        {/* Digital Count Badge */}
                        <div 
                          onClick={() => {
                            if (todaysHomeworks.length > 0) {
                              setShowSubjectListDropdown(!showSubjectListDropdown);
                            }
                          }}
                          className="bg-emerald-900 text-amber-400 font-black text-center py-4 px-6 rounded-3xl shadow-lg border border-emerald-800 cursor-pointer hover:bg-emerald-950 transition-all flex items-center justify-between gap-3"
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">📊</span>
                            <span className="text-base font-bold">আজকের মোট কাজ: {toBengaliDigits(todaysHomeworks.length)}টি</span>
                          </div>
                          {todaysHomeworks.length > 0 && (
                            <ChevronDown className={`h-5 w-5 text-amber-400 transition-transform duration-300 ${showSubjectListDropdown ? "rotate-180" : ""}`} />
                          )}
                        </div>

                        {/* Dropdown list of subjects */}
                        {showSubjectListDropdown && todaysHomeworks.length > 0 && (
                          <motion.div 
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            className="bg-white rounded-2xl border border-slate-100 shadow-xl p-3 grid grid-cols-2 gap-2"
                          >
                            {todaysHomeworks.map((hw: any, idx: number) => (
                              <button
                                key={hw.id || idx}
                                onClick={() => {
                                  setSelectedStudySubject(hw.subject);
                                  setShowSubjectListDropdown(false);
                                }}
                                className={`p-2.5 rounded-xl text-xs font-black transition-all border ${
                                  currentSubject === hw.subject 
                                    ? "bg-emerald-800 text-amber-400 border-emerald-800" 
                                    : "bg-slate-50 text-slate-700 border-transparent hover:bg-slate-100"
                                }`}
                              >
                                📖 {hw.subject}
                              </button>
                            ))}
                          </motion.div>
                        )}

                        {todaysHomeworks.length === 0 ? (
                          <div className="bg-white rounded-3xl p-10 border border-slate-100 shadow-sm text-center space-y-4 mt-2">
                            <div className="bg-emerald-50 h-20 w-20 rounded-full flex items-center justify-center mx-auto border border-emerald-100">
                              <ClipboardList className="h-10 w-10 text-emerald-700" />
                            </div>
                            <h4 className="font-bold text-xl text-slate-800" style={{ fontFamily: 'Alinur Tatsama' }}>কোনো হোমওয়ার্ক পাওয়া যায়নি</h4>
                            <p className="text-sm text-slate-500 max-w-xs mx-auto" style={{ fontFamily: 'Alinur Tatsama' }}>
                              আপনার শ্রেণী ({studentClass}) এর জন্য আজ কোনো নতুন বা সম্পন্ন হোমওয়ার্ক নেই।
                            </p>
                          </div>
                        ) : (
                          <>
                            {/* Subject selector Tabs */}
                            <div className="mt-4">
                              <span className="text-[11px] font-black text-slate-400 block mb-2 uppercase">বিষয় ভিত্তিক ফিল্টার:</span>
                              <div className="flex flex-wrap gap-2">
                                {availableSubjects.map((subj: string) => (
                                  <button
                                    key={subj}
                                    onClick={() => setSelectedStudySubject(subj)}
                                    className={`px-4 py-2 rounded-2xl text-xs font-black transition-all border ${
                                      currentSubject === subj 
                                        ? "bg-emerald-800 text-amber-400 border-emerald-800 shadow-md" 
                                        : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                                    }`}
                                  >
                                    {subj}
                                  </button>
                                ))}
                              </div>
                            </div>

                            {/* Detailed Homework view */}
                            <div className="space-y-4 mt-2">
                              {todaysHomeworks.filter(h => h.subject === currentSubject).map((hw: any, index: number) => {
                                const pubDate = hw.createdAt ? (hw.createdAt.toDate ? hw.createdAt.toDate() : new Date(hw.createdAt)) : null;
                                const formattedPubDate = pubDate ? pubDate.toLocaleDateString('bn-BD', { year: 'numeric', month: 'long', day: 'numeric' }) : "আজ";
                                const isHwCompleted = hw.status === "completed" || hw.status === "Completed";
                                return (
                                  <motion.div
                                    key={hw.id || index}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="bg-white rounded-3xl p-6 border border-slate-100 shadow-[0_8px_30px_rgba(0,0,0,0.02)] space-y-4 relative overflow-hidden"
                                  >
                                    <div className="flex items-center justify-between border-b border-slate-50 pb-3">
                                      <div>
                                        <span className="text-[10px] text-slate-400 font-bold uppercase block">বিষয়</span>
                                        <h4 className="font-black text-emerald-950 text-base">{hw.subject}</h4>
                                      </div>
                                      <div className="text-right flex flex-col items-end gap-1">
                                        {isHwCompleted ? (
                                          <span className="text-[10px] font-black bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full border border-emerald-200 flex items-center gap-1 shadow-xs">
                                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> সম্পন্ন
                                          </span>
                                        ) : (
                                          <span className="text-[10px] font-black bg-amber-50 text-amber-800 px-3 py-1 rounded-full border border-amber-200 flex items-center gap-1">
                                            <Clock className="h-3.5 w-3.5 text-amber-600" /> চলমান
                                          </span>
                                        )}
                                        <span className="text-xs font-black text-rose-600 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-100">
                                          শেষ: {toBengaliDigits(hw.dueDate)}
                                        </span>
                                      </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 text-xs font-bold">
                                      <div>
                                        <span className="text-[10px] text-slate-400 font-bold block mb-0.5">প্রকাশের তারিখ:</span>
                                        <span className="text-slate-700">{toBengaliDigits(formattedPubDate)}</span>
                                      </div>
                                      <div>
                                        <span className="text-[10px] text-slate-400 font-bold block mb-0.5">শিক্ষক:</span>
                                        <span className="text-emerald-800">{getTeacherDisplayName(hw.teacherName)}</span>
                                      </div>
                                    </div>

                                    <div className="space-y-1 pt-1">
                                      <span className="text-[10px] text-slate-400 font-bold block">পাঠের শিরোনাম:</span>
                                      <p className="font-black text-slate-850 text-sm">{hw.headline}</p>
                                    </div>

                                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-1.5">
                                      <span className="text-[10px] text-slate-400 font-bold block">হোমওয়ার্ক বিবরণ:</span>
                                      <p className="text-xs text-slate-600 leading-relaxed font-bold whitespace-pre-line">{hw.details}</p>
                                    </div>
                                  </motion.div>
                                );
                              })}
                            </div>
                          </>
                        )}
                      </div>
                    );
                  } else {
                    // PENDING HOMEWORK RENDERING
                    return (
                      <div className="space-y-4" style={{ fontFamily: 'Alinur Tatsama' }}>
                        {pendingHomeworks.length === 0 ? (
                          <div className="bg-white rounded-3xl p-8 text-center space-y-3 border border-slate-50 shadow-sm mt-2">
                            <div className="h-16 w-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto text-emerald-600 border border-emerald-100">
                              <CheckCircle2 className="h-8 w-8" />
                            </div>
                            <h4 className="font-black text-lg text-slate-800">কোনো বাকি হোমওয়ার্ক নেই</h4>
                            <p className="text-xs text-slate-500">আপনার সব পূর্ববর্তী হোমওয়ার্ক সফলভাবে সম্পন্ন হয়েছে!</p>
                          </div>
                        ) : (
                          <div className="space-y-4 mt-2">
                            {pendingHomeworks.map((hw: any, idx: number) => {
                              const pubDate = hw.createdAt ? (hw.createdAt.toDate ? hw.createdAt.toDate() : new Date(hw.createdAt)) : null;
                              const formattedPubDate = pubDate ? pubDate.toLocaleDateString('bn-BD', { year: 'numeric', month: 'long', day: 'numeric' }) : "পূর্বে";
                              return (
                                <motion.div
                                  key={hw.id || idx}
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  className="bg-white rounded-3xl p-5 border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.02)] space-y-3"
                                >
                                  <div className="flex justify-between items-start">
                                    <div>
                                      <span className="bg-amber-50 text-amber-700 text-[10px] font-black px-2.5 py-1 rounded-full border border-amber-100">
                                        {hw.subject}
                                      </span>
                                      <h4 className="font-black text-slate-800 text-sm mt-2">{hw.headline}</h4>
                                    </div>
                                    <div className="text-right shrink-0">
                                      <span className="text-[9px] text-slate-400 block font-bold">শেষ তারিখ</span>
                                      <span className="text-xs font-black text-rose-600 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-100">
                                        {toBengaliDigits(hw.dueDate)}
                                      </span>
                                    </div>
                                  </div>

                                  <div className="bg-slate-50/50 p-3.5 rounded-xl border border-slate-50 text-xs text-slate-600 font-bold whitespace-pre-line leading-relaxed">
                                    {hw.details}
                                  </div>

                                  <div className="flex justify-between items-center text-[10px] text-slate-400 pt-2 font-bold border-t border-slate-50">
                                    <span>প্রকাশ: {toBengaliDigits(formattedPubDate)}</span>
                                    <span>... {getTeacherDisplayName(hw.teacherName)}</span>
                                  </div>
                                </motion.div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  }
                }}
              />
            </motion.div>
          )}

          {studentActiveTab === "features" && (
            <motion.div
              key="features"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-6"
              style={{ fontFamily: 'Alinur Tatsama' }}
            >
              {/* Header Banner */}
              <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-800 text-white rounded-3xl p-6 shadow-md border border-emerald-700/40 relative overflow-hidden">
                <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 w-32 h-32 bg-amber-400/10 rounded-full blur-2xl pointer-events-none"></div>
                <span className="text-[10px] uppercase tracking-widest text-amber-300 font-black bg-white/10 px-3 py-1 rounded-full border border-white/10 inline-block mb-2">
                  সুফিয়া নূরীয়া দাখিল মাদ্রাসা
                </span>
                <h3 className="font-black text-xl flex items-center gap-2.5 text-white" style={{ fontFamily: 'Alinur Tatsama' }}>
                  <Compass className="h-6 w-6 text-amber-400" />
                  <span>শিক্ষার্থী ফিচার ও রিসোর্স সেন্টার</span>
                </h3>
                <p className="text-xs text-emerald-100/90 mt-1 font-bold leading-relaxed" style={{ fontFamily: 'Alinur Tatsama' }}>
                  ছুটির অনলাইন আবেদন, রেজাল্ট হিস্ট্রি এবং পারফর্মেন্স গ্রোথ ট্র্যাকার এক জায়গায়।
                </p>
              </div>

              {/* Section 1: ছুটির আবেদন সিস্টেম (Leave Application System) */}
              <div className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-100 space-y-5">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="h-11 w-11 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center border border-amber-100">
                      <CalendarCheck className="h-6 w-6" />
                    </div>
                    <div>
                      <h4 className="font-black text-lg text-emerald-950">ছুটির আবেদন সেকশন</h4>
                      <p className="text-xs text-slate-400 font-bold">অনলাইনে ছুটির আবেদন জমা দিন ও স্ট্যাটাস ট্র্যাক করুন</p>
                    </div>
                  </div>
                </div>

                {/* Button to open Leave Application Form */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowLeaveModal(true)}
                  className="w-full bg-gradient-to-r from-emerald-800 to-teal-800 hover:from-emerald-900 hover:to-teal-900 text-amber-400 py-4 px-6 rounded-2xl font-black text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2.5 border border-emerald-700/50 cursor-pointer"
                >
                  <FilePlus className="h-5 w-5 text-amber-400" />
                  <span>ছুটির আবেদন জমা দিন</span>
                </motion.button>

                {/* Stream of Submitted Requests */}
                <StreamBuilder<any>
                  stream={query(collection(db, "leaves"))}
                  builder={(allLeaves) => {
                    const d = new Date();
                    const todayFormatted = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                    
                    const myLeaves = allLeaves.filter(l => 
                      compareRolls(l.studentRoll, studentRoll) || l.studentName === studentName
                    ).sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));

                    const activeApproved = myLeaves.find(l => {
                      const isApproved = l.status === "Approved" || l.status === "approved";
                      if (!isApproved) return false;
                      return l.endDate >= todayFormatted && l.startDate <= todayFormatted;
                    });

                    let remainingDays = 0;
                    if (activeApproved) {
                      const nowMs = new Date(todayFormatted).getTime();
                      const endMs = new Date(activeApproved.endDate).getTime();
                      remainingDays = Math.max(0, Math.ceil((endMs - nowMs) / (1000 * 60 * 60 * 24)));
                    }

                    return (
                      <div className="space-y-4 pt-1">
                        {/* Active Approved Leave Banner */}
                        {activeApproved && (
                          <motion.div 
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="bg-emerald-800 text-white p-4.5 rounded-2xl border border-emerald-700 shadow-md space-y-1.5"
                          >
                            <div className="flex items-center gap-2 text-amber-300 font-black text-sm">
                              <CheckCircle2 className="h-5 w-5 shrink-0" />
                              <span>আপনার একটি ছুটির আবেদন মঞ্জুরকৃত আছে!</span>
                            </div>
                            <p className="text-xs text-emerald-100 font-bold">
                              আপনার ছুটি শেষ হতে <span className="text-amber-300 font-black text-base">{toBengaliDigits(remainingDays)}</span> দিন বাকি।
                            </p>
                            <div className="text-[11px] text-emerald-200 font-bold flex justify-between border-t border-emerald-700/60 pt-2 mt-2">
                              <span>তারিখ: {toBengaliDigits(activeApproved.startDate)} থেকে {toBengaliDigits(activeApproved.endDate)} ({toBengaliDigits(activeApproved.totalDays)} দিন)</span>
                              <span>কারণ: {activeApproved.reason}</span>
                            </div>
                          </motion.div>
                        )}

                        {/* Submitted Applications History */}
                        <div className="space-y-3">
                          <h5 className="text-xs font-black text-slate-500 uppercase tracking-wide">আপনার আবেদন তালিকা ({toBengaliDigits(myLeaves.length)}টি)</h5>
                          
                          {myLeaves.length === 0 ? (
                            <div className="bg-slate-50 rounded-2xl p-6 text-center border border-slate-100 space-y-1">
                              <p className="text-xs font-bold text-slate-500">আপনার কোনো পূর্ববর্তী ছুটির আবেদন পাওয়া যায়নি।</p>
                              <p className="text-[10px] text-slate-400">প্রয়োজনে ওপরের বাটন ক্লিক করে নতুন আবেদন করুন।</p>
                            </div>
                          ) : (
                            myLeaves.map((l: any, idx: number) => {
                              const isApproved = l.status === "Approved" || l.status === "approved";
                              const isRejected = l.status === "Rejected" || l.status === "rejected";
                              const isPending = !isApproved && !isRejected;

                              return (
                                <div key={l.id || idx} className="bg-slate-50/80 rounded-2xl p-4 border border-slate-200/80 space-y-2.5">
                                  <div className="flex justify-between items-start">
                                    <div>
                                      <span className="text-xs font-black text-emerald-950 block">{toBengaliDigits(l.startDate)} থেকে {toBengaliDigits(l.endDate)}</span>
                                      <span className="text-[11px] font-bold text-slate-500">মোট দিন: {toBengaliDigits(l.totalDays || calculateLeaveDays(l.startDate, l.endDate))} দিন</span>
                                    </div>
                                    <div>
                                      {isApproved && (
                                        <span className="bg-emerald-100 text-emerald-800 border border-emerald-200 text-[11px] font-black px-3 py-1 rounded-full flex items-center gap-1 shadow-2xs">
                                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> মঞ্জুরকৃত
                                        </span>
                                      )}
                                      {isRejected && (
                                        <span className="bg-rose-100 text-rose-800 border border-rose-200 text-[11px] font-black px-3 py-1 rounded-full flex items-center gap-1 shadow-2xs">
                                          <XCircle className="h-3.5 w-3.5 text-rose-600" /> বাতিলকৃত
                                        </span>
                                      )}
                                      {isPending && (
                                        <span className="bg-amber-100 text-amber-800 border border-amber-200 text-[11px] font-black px-3 py-1 rounded-full flex items-center gap-1 shadow-2xs">
                                          <Clock className="h-3.5 w-3.5 text-amber-600" /> পেন্ডিং
                                        </span>
                                      )}
                                    </div>
                                  </div>

                                  <p className="text-xs text-slate-600 font-bold bg-white p-2.5 rounded-xl border border-slate-100 leading-relaxed">
                                    <span className="text-slate-400 font-bold block text-[10px]">আবেদনের কারণ:</span>
                                    {l.reason}
                                  </p>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>
                    );
                  }}
                />
              </div>

              {/* Section 2: রেজাল্ট হিস্ট্রি ও % গ্রোথ ট্র্যাকার (Result History & Growth/Degrowth Tracker) */}
              <div className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-100 space-y-5">
                <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                  <div className="h-11 w-11 bg-emerald-50 text-emerald-700 rounded-2xl flex items-center justify-center border border-emerald-100">
                    <Award className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="font-black text-lg text-emerald-950">রেজাল্ট হিস্ট্রি ও গ্রোথ ট্র্যাকার</h4>
                    <p className="text-xs text-slate-400 font-bold">পরীক্ষার ফলাফল ও স্বয়ংক্রিয় শতাংশ অগ্রগতি পর্যবেক্ষণ</p>
                  </div>
                </div>

                <StreamBuilder<any>
                  stream={query(collection(db, "results"))}
                  builder={(allResults) => {
                    const myResults = allResults.filter(r => 
                      compareRolls(r.roll || r.studentId, studentRoll) || r.studentName === studentName
                    );

                    // Sort descending by year / createdAt
                    const sortedResults = [...myResults].sort((a, b) => {
                      const yA = parseInt((a.year || "0").replace(/[^0-9]/g, '')) || 0;
                      const yB = parseInt((b.year || "0").replace(/[^0-9]/g, '')) || 0;
                      if (yB !== yA) return yB - yA;
                      return (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0);
                    });

                    if (sortedResults.length === 0) {
                      return (
                        <div className="bg-slate-50 rounded-2xl p-8 text-center border border-slate-100 space-y-2">
                          <Award className="h-12 w-12 text-slate-300 mx-auto" />
                          <h5 className="font-bold text-slate-700 text-sm">কোনো প্রকাশিত রেজাল্ট পাওয়া যায়নি</h5>
                          <p className="text-xs text-slate-400 max-w-xs mx-auto">
                            আপনার রোল ({toBengaliDigits(studentRoll)}) এর বিপরীতে এখনো কোনো পরীক্ষার ফলাফল সিস্টেম অফিশিয়ালি প্রকাশ করেনি।
                          </p>
                        </div>
                      );
                    }

                    const getScore = (res: any) => {
                      if (res.totalMarks && Number(res.totalMarks) > 0) return Number(res.totalMarks);
                      if (res.subjects && Array.isArray(res.subjects) && res.subjects.length > 0) {
                        return res.subjects.reduce((sum: number, s: any) => sum + (Number(s.marks) || 0), 0);
                      }
                      if (res.gpa) return parseFloat(res.gpa) * 100;
                      return 0;
                    };

                    const latestRes = sortedResults[0];
                    const prevRes = sortedResults.length > 1 ? sortedResults[1] : null;

                    const latestScore = getScore(latestRes);
                    const prevScore = prevRes ? getScore(prevRes) : 0;

                    let pctChange = 0;
                    if (prevRes && prevScore > 0) {
                      pctChange = ((latestScore - prevScore) / prevScore) * 100;
                    }

                    const isGrowth = pctChange >= 0;

                    return (
                      <div className="space-y-5">
                        {/* Growth / Degrowth Summary Card */}
                        {prevRes ? (
                          <div className={`p-5 rounded-2xl border text-white shadow-md relative overflow-hidden ${
                            isGrowth 
                              ? "bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 border-emerald-600" 
                              : "bg-gradient-to-r from-rose-800 via-rose-700 to-amber-900 border-rose-600"
                          }`}>
                            <div className="flex justify-between items-start mb-3">
                              <div>
                                <span className="text-[10px] uppercase font-black tracking-widest text-emerald-200 block mb-0.5">
                                  স্বয়ংক্রিয় এনালাইটিক্স
                                </span>
                                <h5 className="font-black text-base text-white">সর্বশেষ পারফর্মেন্স ট্র্যাকার</h5>
                              </div>

                              <div className={`px-3.5 py-1.5 rounded-full font-black text-xs border shadow-xs flex items-center gap-1.5 ${
                                isGrowth 
                                  ? "bg-amber-400 text-emerald-950 border-amber-300" 
                                  : "bg-amber-400 text-rose-950 border-amber-300"
                              }`}>
                                {isGrowth ? (
                                  <>
                                    <TrendingUp className="h-4 w-4" />
                                    <span>+{toBengaliDigits(Math.abs(pctChange).toFixed(1))}% গ্রোথ 📈</span>
                                  </>
                                ) : (
                                  <>
                                    <TrendingDown className="h-4 w-4" />
                                    <span>-{toBengaliDigits(Math.abs(pctChange).toFixed(1))}% ডিগ্রোথ 📉</span>
                                  </>
                                )}
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3 text-xs bg-black/20 p-3 rounded-xl border border-white/10 font-bold">
                              <div className="border-r border-white/10 pr-2">
                                <span className="text-[10px] text-emerald-200 block font-normal">সর্বশেষ পরীক্ষা ({latestRes.year || "২০২৬"}):</span>
                                <span className="text-white block font-black text-sm">{latestRes.examType || latestRes.examName || "একাডেমিক পরীক্ষা"}</span>
                                <span className="text-amber-300 text-[11px] block mt-0.5">মার্ক্স: {toBengaliDigits(latestScore)} • GPA: {toBengaliDigits(latestRes.gpa || "0.00")}</span>
                              </div>
                              <div className="pl-2">
                                <span className="text-[10px] text-emerald-200 block font-normal">পূর্ববর্তী পরীক্ষা ({prevRes.year || "২০২৫"}):</span>
                                <span className="text-white block font-black text-sm">{prevRes.examType || prevRes.examName || "একাডেমিক পরীক্ষা"}</span>
                                <span className="text-emerald-200 text-[11px] block mt-0.5">মার্ক্স: {toBengaliDigits(prevScore)} • GPA: {toBengaliDigits(prevRes.gpa || "0.00")}</span>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-800 to-emerald-800 text-white border border-indigo-700 shadow-xs flex items-center justify-between">
                            <div>
                              <h5 className="font-black text-sm">১ম পরীক্ষার রেজাল্ট ট্র্যাকার</h5>
                              <p className="text-[11px] text-indigo-100 font-bold mt-0.5">পরবর্তী পরীক্ষা প্রকাশিত হলে স্বয়ংক্রিয় শতাংশ গ্রোথ দেখাবে।</p>
                            </div>
                            <span className="bg-amber-400 text-emerald-950 font-black text-xs px-3 py-1 rounded-full shadow-xs shrink-0">
                              প্রথম প্রকাশিত 📊
                            </span>
                          </div>
                        )}

                        {/* List of Published Result Cards */}
                        <div className="space-y-4">
                          <h5 className="text-xs font-black text-slate-500 uppercase tracking-wide">সকল পরীক্ষার ফলাফল ({toBengaliDigits(sortedResults.length)}টি)</h5>

                          {sortedResults.map((res: any, idx: number) => {
                            const examTitle = res.examType || res.examName || res.exam || "একাডেমিক পরীক্ষা";
                            const totMarks = getScore(res);
                            const isLatest = idx === 0;

                            return (
                              <motion.div
                                key={res.id || idx}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-[0_4px_20px_rgba(0,0,0,0.03)] space-y-3"
                              >
                                <div className="flex justify-between items-start border-b border-slate-100 pb-3">
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <span className="bg-emerald-100 text-emerald-900 font-black text-[10px] px-2.5 py-0.5 rounded-full border border-emerald-200">
                                        {toBengaliDigits(res.year || "২০২৬")}
                                      </span>
                                      {isLatest && (
                                        <span className="bg-amber-100 text-amber-800 font-black text-[10px] px-2 py-0.5 rounded-full border border-amber-200">
                                          সর্বশেষ
                                        </span>
                                      )}
                                    </div>
                                    <h5 className="font-black text-emerald-950 text-base mt-1">{examTitle}</h5>
                                    <span className="text-xs text-slate-400 font-bold block">{res.className || studentClass}</span>
                                  </div>

                                  <div className="text-right">
                                    <span className="bg-emerald-800 text-amber-300 font-black text-sm px-3 py-1 rounded-xl shadow-2xs block">
                                      GPA: {toBengaliDigits(res.gpa || "০.০০")}
                                    </span>
                                    <span className="text-[10px] font-bold text-slate-400 block mt-1">গ্রেড: <span className="font-black text-emerald-900">{res.grade || "A+"}</span></span>
                                  </div>
                                </div>

                                <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs font-bold">
                                  <span className="text-slate-500">অর্জিত মোট নম্বর:</span>
                                  <span className="text-emerald-950 font-black text-sm">{toBengaliDigits(totMarks)}</span>
                                </div>

                                {/* Subject Marks List if present */}
                                {res.subjects && Array.isArray(res.subjects) && res.subjects.length > 0 && (
                                  <div className="space-y-1.5 pt-1">
                                    <span className="text-[10px] text-slate-400 font-bold block uppercase">বিষয়ভিত্তিক মার্ক্সশিট:</span>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                      {res.subjects.map((sub: any, sIdx: number) => (
                                        <div key={sIdx} className="bg-slate-50/80 p-2 rounded-xl border border-slate-100 text-[11px]">
                                          <span className="font-bold text-slate-700 block truncate">{sub.name}</span>
                                          <div className="flex justify-between items-center font-black mt-0.5">
                                            <span className="text-emerald-900">{toBengaliDigits(sub.marks)} নম্বর</span>
                                            <span className="text-amber-600 bg-amber-50 px-1.5 rounded text-[10px]">{sub.grade}</span>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </motion.div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  }}
                />
              </div>

              {/* Leave Application Modal (ছুটির আবেদন পপআপ ফর্ম) */}
              <AnimatePresence>
                {showLeaveModal && (
                  <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: 15 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: 15 }}
                      className="bg-white rounded-[32px] p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-100 space-y-5 max-h-[90vh] overflow-y-auto"
                      style={{ fontFamily: 'Alinur Tatsama' }}
                    >
                      <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                        <div className="flex items-center gap-2.5">
                          <div className="h-10 w-10 bg-emerald-50 text-emerald-800 rounded-2xl flex items-center justify-center border border-emerald-100">
                            <Calendar className="h-5 w-5" />
                          </div>
                          <div>
                            <h4 className="font-black text-lg text-emerald-950">ছুটির আবেদন জমা দিন</h4>
                            <p className="text-xs text-slate-400 font-bold">সুফিয়া নূরীয়া দাখিল মাদ্রাসা</p>
                          </div>
                        </div>
                        <button 
                          onClick={() => setShowLeaveModal(false)}
                          className="p-2 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-full transition-colors cursor-pointer"
                        >
                          <X className="h-5 w-5" />
                        </button>
                      </div>

                      <form onSubmit={handleLeaveSubmit} className="space-y-4">
                        {/* Read-Only Locked Student Info */}
                        <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 space-y-2 text-xs">
                          <div className="flex items-center justify-between text-slate-500 font-bold border-b border-slate-200/60 pb-1.5">
                            <span className="flex items-center gap-1 text-[11px]"><Lock className="h-3.5 w-3.5 text-emerald-700" /> অটোমেটিক সেশন তথ্য (Read-Only):</span>
                            <span className="text-[10px] text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full font-black">লক করা</span>
                          </div>
                          <div className="grid grid-cols-3 gap-2 text-slate-800 font-black">
                            <div>
                              <span className="text-[9px] text-slate-400 block font-normal">নাম</span>
                              <span className="truncate block text-[11px]">{studentName}</span>
                            </div>
                            <div>
                              <span className="text-[9px] text-slate-400 block font-normal">শ্রেণী</span>
                              <span className="truncate block text-[11px]">{studentClass}</span>
                            </div>
                            <div>
                              <span className="text-[9px] text-slate-400 block font-normal">রোল</span>
                              <span className="truncate block text-[11px]">{toBengaliDigits(studentRoll)}</span>
                            </div>
                          </div>
                        </div>

                        {/* Date Selectors */}
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-700 block">শুরুর তারিখ <span className="text-rose-500">*</span></label>
                            <input
                              type="date"
                              required
                              value={leaveStartDate}
                              onChange={(e) => setLeaveStartDate(e.target.value)}
                              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2.5 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-700 block">শেষ তারিখ <span className="text-rose-500">*</span></label>
                            <input
                              type="date"
                              required
                              value={leaveEndDate}
                              onChange={(e) => setLeaveEndDate(e.target.value)}
                              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2.5 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none"
                            />
                          </div>
                        </div>

                        {/* Dynamic Live Text Notification */}
                        {(() => {
                          const calculatedDays = calculateLeaveDays(leaveStartDate, leaveEndDate);
                          if (calculatedDays > 0) {
                            return (
                              <motion.div 
                                initial={{ opacity: 0, y: 5 }} 
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-emerald-50 border border-emerald-200 text-emerald-950 p-3.5 rounded-2xl text-xs font-bold space-y-1 shadow-2xs"
                              >
                                <div className="flex items-center gap-1.5 text-emerald-800">
                                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                                  <span>ছুটির দিন গণনা:</span>
                                </div>
                                <p className="leading-relaxed">
                                  প্রিয় <span className="font-black text-emerald-900">{studentName}</span>, আপনি <span className="font-black text-emerald-900 bg-emerald-100/90 px-2 py-0.5 rounded-md border border-emerald-300">{toBengaliDigits(calculatedDays)}</span> দিন ছুটি সিলেক্ট করেছেন।
                                </p>
                              </motion.div>
                            );
                          }
                          return null;
                        })()}

                        {/* Reason / Details Text Area */}
                        <div className="space-y-1">
                          <div className="flex justify-between items-center">
                            <label className="text-xs font-bold text-slate-700">আবেদনের কারণ <span className="text-rose-500">*</span></label>
                            <span className="text-[10px] text-slate-400 font-bold">{toBengaliDigits(leaveReason.length)}/৩০০ অক্ষর</span>
                          </div>
                          <textarea
                            rows={3}
                            required
                            maxLength={300}
                            value={leaveReason}
                            onChange={(e) => setLeaveReason(e.target.value)}
                            placeholder="ছুটির সুনির্দিষ্ট কারণ লিখুন (সর্বোচ্চ ৩০০ অক্ষর)..."
                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3.5 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none resize-none"
                          />
                        </div>

                        {/* Submit Button */}
                        <button
                          type="submit"
                          disabled={isSubmittingLeave}
                          className="w-full bg-gradient-to-r from-emerald-800 to-emerald-900 text-amber-400 font-black py-3.5 rounded-2xl shadow-lg shadow-emerald-900/20 hover:from-emerald-900 hover:to-emerald-950 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer text-sm border border-emerald-700/50"
                        >
                          {isSubmittingLeave ? (
                            <>
                              <Loader2 className="h-5 w-5 animate-spin text-amber-400" />
                              <span>জমা হচ্ছে...</span>
                            </>
                          ) : (
                            <>
                              <Send className="h-5 w-5 text-amber-400" />
                              <span>আবেদন জমা দিন</span>
                            </>
                          )}
                        </button>
                      </form>
                    </motion.div>
                  </div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {studentActiveTab === "support" && (
            <motion.div
              key="support"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-6"
              style={{ fontFamily: 'Alinur Tatsama' }}
            >
              <div className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-100 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
                    <HelpCircle className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-black text-xl text-emerald-950" style={{ fontFamily: 'Alinur Tatsama' }}>সহায়তা কেন্দ্র</h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">সরাসরি মাদ্রাসা কর্তৃপক্ষের সাথে কথা বলুন</p>
                  </div>
                </div>

                <form onSubmit={handleSupportSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-emerald-900 ml-1">বার্তার বিষয়</label>
                    <input 
                      type="text" 
                      value={supportSubject}
                      onChange={(e) => setSupportSubject(e.target.value)}
                      placeholder="যেমন: আইডি কার্ড সংশোধন"
                      className="w-full bg-slate-50 border-none rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-emerald-900 ml-1">আপনার বার্তা</label>
                    <textarea 
                      rows={4}
                      value={supportMessage}
                      onChange={(e) => setSupportMessage(e.target.value)}
                      placeholder="এখানে আপনার সমস্যা বিস্তারিত লিখুন..."
                      className="w-full bg-slate-50 border-none rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                  </div>
                  <button 
                    disabled={isSubmittingSupport}
                    className="w-full bg-emerald-900 text-amber-400 font-black py-4 rounded-2xl shadow-xl shadow-emerald-900/20 flex items-center justify-center gap-2 group disabled:opacity-50"
                  >
                    <Send className={`h-5 w-5 ${isSubmittingSupport ? 'animate-ping' : 'group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform'}`} />
                    <span>{isSubmittingSupport ? "পাঠানো হচ্ছে..." : "বার্তা পাঠান"}</span>
                  </button>
                  
                  {supportSuccess && (
                    <motion.p 
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="text-center text-xs font-bold text-emerald-600 bg-emerald-50 py-2 rounded-xl border border-emerald-100"
                    >
                      আপনার বার্তাটি সফলভাবে পাঠানো হয়েছে!
                    </motion.p>
                  )}
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* বটম ফিক্সড কালারফুল নেভিগেশন বার (Bottom Fixed Colorful Navigation Bar) */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-150/80 shadow-[0_-8px_30px_rgba(0,0,0,0.06)] px-4 py-2 z-40 max-w-lg mx-auto rounded-t-[30px] pb-safe">
        <div className="flex items-center justify-around">
          {[
            { id: "home", label: "হোম", icon: Home, activeColor: "text-emerald-700 bg-emerald-50" },
            { id: "homework", label: "পড়া", icon: BookOpen, activeColor: "text-amber-600 bg-amber-50" },
            { id: "features", label: "ফিচার", icon: Compass, activeColor: "text-indigo-600 bg-indigo-50" },
            { id: "support", label: "সাপোর্ট", icon: HelpCircle, activeColor: "text-rose-600 bg-rose-50" }
          ].map((tab: any) => {
            const isActive = studentActiveTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setStudentActiveTab(tab.id as any)}
                className={`flex flex-col items-center gap-1 py-1.5 px-4 rounded-2xl transition-all relative ${
                  isActive ? tab.activeColor : "text-slate-400 hover:text-slate-600"
                }`}
              >
                <tab.icon className={`h-5 w-5 ${isActive ? "scale-110 animate-bounce" : ""} transition-transform duration-200`} />
                <span className="text-[10px] font-black tracking-tight" style={{ fontFamily: 'Alinur Tatsama' }}>{tab.label}</span>
                {isActive && (
                  <motion.div 
                    layoutId="activeTabIndicator" 
                    className="absolute -bottom-0.5 w-1.5 h-1.5 bg-current rounded-full" 
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* শিক্ষার্থীর বিস্তারিত প্রোফাইল পপআপ ডায়ালগ (Profile Details Modal) */}
      <AnimatePresence>
        {showDetailsModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden font-alinur relative"
              style={{ fontFamily: 'Alinur Tatsama' }}
            >
              {/* Modal Header */}
              <div className="bg-emerald-900 p-6 text-white relative text-center">
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all cursor-pointer"
                  title="বন্ধ করুন"
                >
                  <X className="h-5 w-5" />
                </button>
                <div className="h-20 w-20 mx-auto rounded-full border-2 border-amber-400 shadow-md overflow-hidden bg-slate-100 mb-3">
                  <img src={studentPhoto} alt={studentName} className="h-full w-full object-cover object-center" referrerPolicy="no-referrer" />
                </div>
                <h3 className="text-xl font-black text-amber-300">{studentName}</h3>
                <p className="text-emerald-200 text-xs font-bold mt-0.5">{studentClass} | রোল নম্বর: {toBengaliDigits(studentRoll)}</p>
              </div>

              {/* Modal Body - Detailed Profile Info */}
              <div className="p-6 space-y-3 max-h-[60vh] overflow-y-auto text-sm">
                <h4 className="text-xs font-black text-emerald-900 uppercase tracking-wider border-b border-slate-100 pb-2 mb-3 text-center">
                  শিক্ষার্থীর বিস্তারিত তথ্য
                </h4>

                <div className="flex justify-between items-center py-2 border-b border-slate-50">
                  <span className="font-bold text-slate-800 text-xs">{studentName}</span>
                  <span className="text-slate-400 font-bold text-xs flex items-center gap-1.5"><User className="h-3.5 w-3.5 text-emerald-600" /> শিক্ষার্থীর নাম:</span>
                </div>

                <div className="flex justify-between items-center py-2 border-b border-slate-50">
                  <span className="font-bold text-slate-800 text-xs">{studentClass} (রোল: {toBengaliDigits(studentRoll)})</span>
                  <span className="text-slate-400 font-bold text-xs flex items-center gap-1.5"><BookOpen className="h-3.5 w-3.5 text-emerald-600" /> শ্রেণী ও রোল:</span>
                </div>

                <div className="flex justify-between items-center py-2 border-b border-slate-50">
                  <span className="font-bold text-slate-800 text-xs">{loggedInStudent?.g1Name || loggedInStudent?.father_name || "মো: আবদুর রহমান"}</span>
                  <span className="text-slate-400 font-bold text-xs flex items-center gap-1.5"><User className="h-3.5 w-3.5 text-emerald-600" /> অভিভাবকের নাম (১):</span>
                </div>

                <div className="flex justify-between items-center py-2 border-b border-slate-50">
                  <span className="font-bold text-slate-800 text-xs">{loggedInStudent?.g2Name || loggedInStudent?.mother_name || "মোরশেদা বেগম"}</span>
                  <span className="text-slate-400 font-bold text-xs flex items-center gap-1.5"><User className="h-3.5 w-3.5 text-emerald-600" /> অভিভাবকের নাম (২):</span>
                </div>

                <div className="flex justify-between items-center py-2 border-b border-slate-50">
                  <span className="font-bold text-slate-800 text-xs">{toBengaliDigits(loggedInStudent?.g1Phone || loggedInStudent?.phone || "০১৭১২৩৪৫৬৭৮")}</span>
                  <span className="text-slate-400 font-bold text-xs flex items-center gap-1.5"><Phone className="h-3.5 w-3.5 text-emerald-600" /> অভিভাবকের মোবাইল:</span>
                </div>

                <div className="flex justify-between items-center py-2 border-b border-slate-50">
                  <span className="font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-100 text-xs">{loggedInStudent?.bloodGroup || "O+"}</span>
                  <span className="text-slate-400 font-bold text-xs flex items-center gap-1.5"><Heart className="h-3.5 w-3.5 text-rose-400" /> রক্তের গ্রুপ:</span>
                </div>

                <div className="flex justify-between items-center py-2 border-b border-slate-50">
                  <span className="font-bold text-slate-800 text-xs">{loggedInStudent?.gender || "পুরুষ"}</span>
                  <span className="text-slate-400 font-bold text-xs flex items-center gap-1.5"><Users className="h-3.5 w-3.5 text-emerald-600" /> জেন্ডার / লিঙ্গ:</span>
                </div>

                <div className="flex justify-between items-start py-2 border-b border-slate-50 gap-3">
                  <span className="font-bold text-slate-800 text-xs text-right leading-relaxed max-w-[200px]">{loggedInStudent?.studentPermanentAddress || loggedInStudent?.permanentAddress || "মাদরাসা কোয়ার্টার, ফেনী"}</span>
                  <span className="text-slate-400 font-bold text-xs flex items-center gap-1.5 shrink-0"><MapPin className="h-3.5 w-3.5 text-emerald-600" /> স্থায়ী ঠিকানা:</span>
                </div>

                <div className="flex justify-between items-start py-2 border-b border-slate-50 gap-3">
                  <span className="font-bold text-slate-800 text-xs text-right leading-relaxed max-w-[200px]">{loggedInStudent?.studentPresentAddress || loggedInStudent?.presentAddress || "মাদরাসা কোয়ার্টার, ফেনী"}</span>
                  <span className="text-slate-400 font-bold text-xs flex items-center gap-1.5 shrink-0"><MapPin className="h-3.5 w-3.5 text-emerald-600" /> বর্তমান ঠিকানা:</span>
                </div>

                <div className="flex justify-between items-center py-2">
                  <span className="font-bold text-emerald-700 text-xs">{getLastLoginStatus()}</span>
                  <span className="text-slate-400 font-bold text-xs flex items-center gap-1.5"><Clock className="h-3.5 w-3.5 text-emerald-600" /> সর্বশেষ লগইন স্ট্যাটাস:</span>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-4 bg-slate-50 border-t border-slate-100 text-center">
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="w-full py-2.5 bg-emerald-800 hover:bg-emerald-950 text-amber-400 font-black rounded-xl text-xs transition-all shadow-sm cursor-pointer"
                >
                  বন্ধ করুন
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const LeaveBadge = ({ studentRoll, className, todayStr }: any) => {
  if (studentRoll === undefined || studentRoll === null || !className || !todayStr) return null;
  return (
    <StreamBuilder<any>
      stream={query(
        collection(db, "leaves"), 
        where("studentRoll", "==", studentRoll), 
        where("className", "==", className), 
        where("status", "==", "Approved")
      )}
      builder={(leaves) => {
        const activeLeave = leaves.find(l => {
          const start = new Date(l.startDate);
          const end = new Date(l.endDate);
          const today = new Date(todayStr);
          return today >= start && today <= end;
        });

        if (!activeLeave) return null;

        return (
          <button 
            onClick={() => {
              alert(`ছুটির বিবরণ: ${activeLeave.reason}\nঅনুমোদনকারী: ${activeLeave.teacherName}\nতারিখ: ${activeLeave.startDate} থেকে ${activeLeave.endDate}`);
            }}
            className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full border border-indigo-100 text-[9px] font-black"
          >
            ছুটি
          </button>
        );
      }}
    />
  );
};

const TeacherStudentManagement = ({ teacherData, toBengaliDigits }: any) => {
  const [selectedClass, setSelectedClass] = useState("১০ম শ্রেণী");
  const [showClassPopup, setShowClassPopup] = useState(false);
  const [homeworkSubject, setHomeworkSubject] = useState("");
  const [homeworkDate, setHomeworkDate] = useState("");
  const [homeworkHeadline, setHomeworkHeadline] = useState("");
  const [homeworkDetails, setHomeworkDetails] = useState("");
  const [isSubmittingHomework, setIsSubmittingHomework] = useState(false);
  const [attendanceMarkers, setAttendanceMarkers] = useState<{ [roll: string]: string }>({});
  const [isSubmittingAttendance, setIsSubmittingAttendance] = useState(false);
  const [lockStatus, setLockStatus] = useState<any>(null);
  const [timeLeft, setTimeLeft] = useState("");
  
  // Navigation / sub-views: "menu", "homework", "homework_history", "attendance"
  const [activeSubView, setActiveSubView] = useState("menu");
  const [attendanceTab, setAttendanceTab] = useState<"register" | "report">("register");
  const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]);

  const [availableSubjects, setAvailableSubjects] = useState<any[]>([]);
  const [duplicateConfirmData, setDuplicateConfirmData] = useState<{
    teacherName: string;
    onConfirm: () => void;
  } | null>(null);

  useEffect(() => {
    const q = query(
      collection(db, "homework_subjects"),
      where("className", "==", selectedClass)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAvailableSubjects(list);
    }, (err) => {
      console.error("Error subscribing to homework subjects:", err);
    });
    return () => unsubscribe();
  }, [selectedClass]);

  useEffect(() => {
    if (availableSubjects.length > 0) {
      setHomeworkSubject(availableSubjects[0].subjectName);
    } else {
      setHomeworkSubject("");
    }
  }, [availableSubjects]);

  const studentsRef = React.useRef<any[]>([]);

  const classes = [
    "শিশু শ্রেণী", "১ম শ্রেণী", "২য় শ্রেণী", "৩য় শ্রেণী", "৪র্থ শ্রেণী", 
    "৫ম শ্রেণী", "৬ষ্ঠ শ্রেণী", "৭ম শ্রেণী", "৮ম শ্রেণী", "৯ম শ্রেণী", "১০ম শ্রেণী", "হিফজ বিভাগ"
  ];

  const [currentDate, setCurrentDate] = useState(() => new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      if (
        now.getDate() !== currentDate.getDate() ||
        now.getMonth() !== currentDate.getMonth() ||
        now.getFullYear() !== currentDate.getFullYear()
      ) {
        setCurrentDate(now);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [currentDate]);

  const today = currentDate;
  const todayStr = today.toISOString().split('T')[0];
  const isFriday = today.getDay() === 5;

  // Stabilized Firestore queries to prevent re-renders, infinite loops, and API re-connections
  const totalStudentsQuery = useMemo(() => {
    return query(collection(db, "students"), where("className", "==", selectedClass || ""));
  }, [selectedClass]);

  const homeworkHistoryQuery = useMemo(() => {
    return query(collection(db, "homework"), where("className", "==", selectedClass || ""), orderBy("createdAt", "desc"), limit(15));
  }, [selectedClass]);

  const activeStudentsQuery = useMemo(() => {
    return query(collection(db, "students"), where("className", "==", selectedClass || ""), orderBy("roll"));
  }, [selectedClass]);

  const attendanceReportQuery = useMemo(() => {
    return query(collection(db, "attendance"), where("className", "==", selectedClass || ""), where("date", "==", reportDate || ""), orderBy("studentRoll"));
  }, [selectedClass, reportDate]);

  // Track lockStatus for the selected class today
  useEffect(() => {
    const q = query(
      collection(db, "class_attendance_locks"),
      where("className", "==", selectedClass),
      where("date", "==", todayStr),
      limit(1)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        setLockStatus(snapshot.docs[0].data());
      } else {
        setLockStatus(null);
      }
    });
    return () => unsubscribe();
  }, [selectedClass, todayStr]);

  // Countdown timer for daily calendar lock (until 11:59:59 PM today, midnight refresh)
  useEffect(() => {
    if (!lockStatus) return;
    const timer = setInterval(() => {
      const now = new Date();
      const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      const diff = tomorrow.getTime() - now.getTime();
      if (diff <= 0) {
        setTimeLeft("");
        clearInterval(timer);
      } else {
        const h = Math.floor(diff / (1000 * 60 * 60));
        const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const s = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeLeft(`${h}:${m < 10 ? '0' + m : m}:${s < 10 ? '0' + s : s}`);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [lockStatus]);

  // Handle hardware/software back button navigation with History API to prevent state loss
  useEffect(() => {
    // Replace initial state
    window.history.replaceState({ subView: "menu" }, "");

    const handlePopState = (event: PopStateEvent) => {
      if (event.state && event.state.subView) {
        setActiveSubView(event.state.subView);
      } else {
        setActiveSubView("menu");
      }
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const navigateTo = (subView: string) => {
    setActiveSubView(subView);
    window.history.pushState({ subView }, "");
  };

  const goBack = () => {
    window.history.back();
  };

  const saveHomeworkDirectly = async () => {
    setIsSubmittingHomework(true);
    try {
      await addDoc(collection(db, "homework"), {
        subject: homeworkSubject,
        dueDate: homeworkDate,
        headline: homeworkHeadline,
        details: homeworkDetails,
        className: selectedClass,
        teacherName: teacherData.name,
        createdAt: serverTimestamp(),
        status: "New"
      });
      setHomeworkSubject("");
      setHomeworkDate("");
      setHomeworkHeadline("");
      setHomeworkDetails("");
      alert("হোমওয়ার্ক সফলভাবে পাঠানো হয়েছে!");
      goBack(); // Go back to menu upon successful homework submission
    } catch (error) {
      console.error("Homework error:", error);
      alert("হোমওয়ার্ক সাবমিট করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।");
    } finally {
      setIsSubmittingHomework(false);
    }
  };

  const handleHomeworkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!homeworkSubject || !homeworkDate || !homeworkHeadline || !homeworkDetails) {
      alert("সবগুলো তথ্য সঠিকভাবে পূরণ করুন।");
      return;
    }
    setIsSubmittingHomework(true);
    try {
      // Query homeworks for this class to check if a homework for the same subject was already posted today
      const q = query(
        collection(db, "homework"),
        where("className", "==", selectedClass)
      );
      const querySnapshot = await getDocs(q);
      let duplicateHomework: any = null;

      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        if (data.subject === homeworkSubject && data.createdAt) {
          const createdDate = data.createdAt.toDate ? data.createdAt.toDate() : new Date(data.createdAt);
          if (
            createdDate.getFullYear() === today.getFullYear() &&
            createdDate.getMonth() === today.getMonth() &&
            createdDate.getDate() === today.getDate()
          ) {
            duplicateHomework = data;
          }
        }
      });

      if (duplicateHomework) {
        setIsSubmittingHomework(false);
        setDuplicateConfirmData({
          teacherName: duplicateHomework.teacherName || "অন্য শিক্ষক",
          onConfirm: () => {
            saveHomeworkDirectly();
            setDuplicateConfirmData(null);
          }
        });
      } else {
        await saveHomeworkDirectly();
      }
    } catch (err) {
      console.error("Error checking duplicate homework: ", err);
      // Fail safe: try to submit anyway if query fails
      await saveHomeworkDirectly();
    }
  };

  const handleAttendanceSubmit = async () => {
    if (lockStatus) {
      const formattedDay = today.toLocaleDateString('bn-BD', { weekday: 'long' });
      const formattedDateBengali = today.toLocaleDateString('bn-BD', { year: 'numeric', month: 'long', day: 'numeric' });
      alert(`আজ ${formattedDateBengali} ${formattedDay} ${lockStatus.teacherName} এই ক্লাসের হাজিরা সম্পন্ন করেছেন। আগামী কাল আবার নতুন হাজিরা দিতে পারবেন।`);
      return;
    }
    if (Object.keys(attendanceMarkers).length === 0) {
      alert("অন্তত একজন শিক্ষার্থীর হাজিরা নিশ্চিত করুন।");
      return;
    }
    setIsSubmittingAttendance(true);
    try {
      const batchPromises = Object.entries(attendanceMarkers).map(([roll, status]) => {
        const studentObj = studentsRef.current.find(s => s.roll === roll);
        return addDoc(collection(db, "attendance"), {
          studentRoll: roll,
          studentName: studentObj ? studentObj.name : "শিক্ষার্থী",
          className: selectedClass,
          date: todayStr,
          status: status,
          month: today.toLocaleString('en-US', { month: 'long' }),
          year: today.getFullYear().toString(),
          teacherName: teacherData.name,
          timestamp: serverTimestamp()
        });
      });

      await Promise.all(batchPromises);
      
      // Add a lock document
      await addDoc(collection(db, "class_attendance_locks"), {
        className: selectedClass,
        date: todayStr,
        teacherName: teacherData.name,
        timestamp: serverTimestamp()
      });

      setAttendanceMarkers({});
      alert("হাজিরা সফলভাবে সম্পন্ন হয়েছে!");
      setAttendanceTab("report"); // Switch to report view to see the submitted attendance
    } catch (error) {
      console.error("Attendance error:", error);
    } finally {
      setIsSubmittingAttendance(false);
    }
  };

  if (activeSubView === "menu") {
    return (
      <div className="space-y-6 pb-12 font-alinur animate-fade-in px-4 pt-8">
        {/* 1. Class Selection Dropdown/Popup */}
        <div className="relative">
          <button 
            onClick={() => setShowClassPopup(!showClassPopup)}
            className="w-full bg-white rounded-2xl p-4 shadow-sm border border-emerald-100 flex items-center justify-between group active:scale-95 transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                <Users className="h-5 w-5" />
              </div>
              <div className="text-left">
                <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest block mb-0.5">শ্রেণী নির্বাচন করুন</span>
                <span className="text-lg font-black text-emerald-950">{selectedClass}</span>
              </div>
            </div>
            <ChevronDown className={`h-5 w-5 text-emerald-600 transition-transform ${showClassPopup ? 'rotate-180' : ''}`} />
          </button>

          <AnimatePresence>
            {showClassPopup && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-emerald-100 z-50 p-2 grid grid-cols-2 gap-2 max-h-64 overflow-y-auto custom-scrollbar"
              >
                {classes.map(cls => (
                  <button
                    key={cls}
                    onClick={() => {
                      setSelectedClass(cls);
                      setShowClassPopup(false);
                      setAttendanceMarkers({});
                    }}
                    className={`py-2.5 px-4 rounded-xl text-sm font-bold text-center transition-all ${selectedClass === cls ? 'bg-emerald-800 text-white shadow-md' : 'bg-emerald-50 text-emerald-900 hover:bg-emerald-100'}`}
                  >
                    {cls}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* 2. Total Student Count Card */}
        <StreamBuilder<any>
          stream={totalStudentsQuery}
          builder={(students) => (
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-gradient-to-br from-emerald-800 to-teal-700 rounded-3xl p-6 text-white shadow-lg shadow-emerald-900/20 relative overflow-hidden"
            >
              <div className="absolute right-0 top-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
              <div className="flex items-center justify-between relative z-10">
                <div>
                  <h3 className="text-xl font-black text-amber-400 leading-tight">মোট শিক্ষার্থী</h3>
                  <p className="text-emerald-100/80 text-xs font-bold uppercase tracking-widest mt-1">Real-time Class Count</p>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-black text-white">{toBengaliDigits(students.length)}</span>
                  <span className="text-sm font-bold text-emerald-200">জন</span>
                </div>
              </div>
            </motion.div>
          )}
        />

        {/* 3. Sub-page Navigation Cards */}
        <div className="grid grid-cols-1 gap-4">
          {/* Card A: Homework posting */}
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => navigateTo("homework")}
            className="w-full bg-white rounded-3xl p-5 shadow-xs border border-slate-100 text-left hover:shadow-md transition-all flex items-center justify-between group"
          >
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center">
                <BookOpen className="h-6 w-6" />
              </div>
              <div>
                <h4 className="font-black text-base text-emerald-950">হোমওয়ার্ক দিন</h4>
                <p className="text-xs text-slate-400 font-bold mt-0.5">নতুন হোমওয়ার্ক এসাইন ও পোস্ট করুন</p>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-emerald-600/50 group-hover:text-emerald-700 group-hover:translate-x-1 transition-all" />
          </motion.button>

          {/* Card B: Homework History */}
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => navigateTo("homework_history")}
            className="w-full bg-white rounded-3xl p-5 shadow-xs border border-slate-100 text-left hover:shadow-md transition-all flex items-center justify-between group"
          >
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">
                <History className="h-6 w-6" />
              </div>
              <div>
                <h4 className="font-black text-base text-emerald-950">হোমওয়ার্ক হিস্ট্রি ও আপডেট</h4>
                <p className="text-xs text-slate-400 font-bold mt-0.5">পূর্বের কাজসমূহ ম্যানেজ ও আপডেট করুন</p>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-indigo-600/50 group-hover:text-indigo-700 group-hover:translate-x-1 transition-all" />
          </motion.button>

          {/* Card C: Smart Attendance */}
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => navigateTo("attendance")}
            className="w-full bg-white rounded-3xl p-5 shadow-xs border border-slate-100 text-left hover:shadow-md transition-all flex items-center justify-between group relative overflow-hidden"
          >
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 bg-emerald-950 text-amber-400 rounded-2xl flex items-center justify-center">
                <CalendarCheck className="h-6 w-6" />
              </div>
              <div>
                <h4 className="font-black text-base text-emerald-950">শিক্ষার্থী হাজিরা রেজিস্টার</h4>
                <p className="text-xs text-slate-400 font-bold mt-0.5">উপস্থিতি, অনুপস্থিতি ও ছুটি ট্র্যাকিং</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {lockStatus ? (
                <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-full text-[10px] font-black flex items-center gap-1">
                  <span className="h-1.5 w-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                  সম্পন্ন
                </span>
              ) : (
                <span className="bg-orange-50 text-orange-700 border border-orange-200 px-2.5 py-1 rounded-full text-[10px] font-black flex items-center gap-1">
                  <span className="h-1.5 w-1.5 bg-orange-500 rounded-full animate-pulse"></span>
                  বাকি আছে
                </span>
              )}
              <ChevronRight className="h-5 w-5 text-emerald-950/50 group-hover:text-emerald-950 group-hover:translate-x-1 transition-all" />
            </div>
          </motion.button>
        </div>
      </div>
    );
  }

  if (activeSubView === "homework") {
    return (
      <div className="space-y-6 pb-12 font-alinur animate-fade-in px-4 pt-6">
        {/* Back navigation header */}
        <div className="flex items-center gap-3">
          <button 
            onClick={goBack}
            className="h-10 w-10 bg-white rounded-xl border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-all"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h3 className="text-xl font-black text-emerald-950">নতুন হোমওয়ার্ক দিন</h3>
            <p className="text-xs text-emerald-700 font-bold">শ্রেণী: {selectedClass}</p>
          </div>
        </div>

        {/* Homework Card */}
        <div className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-100 space-y-5">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
              <BookOpen className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-black text-lg text-emerald-950">হোমওয়ার্ক ফর্ম (Assign)</h3>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Create a task for {selectedClass}</p>
            </div>
          </div>

          <form onSubmit={handleHomeworkSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-emerald-900 ml-1">সাবজেক্ট নাম</label>
                <select 
                  required
                  value={homeworkSubject}
                  onChange={(e) => setHomeworkSubject(e.target.value)}
                  className="w-full bg-slate-50 border-none rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none font-bold text-slate-800"
                >
                  {availableSubjects.length === 0 ? (
                    <option value="">কোনো বিষয় নেই (এডমিন প্যানেলে যোগ করুন)</option>
                  ) : (
                    <>
                      <option value="">বিষয় সিলেক্ট করুন</option>
                      {availableSubjects.map((subj) => (
                        <option key={subj.id} value={subj.subjectName}>
                          {subj.subjectName}
                        </option>
                      ))}
                    </>
                  )}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-emerald-900 ml-1">শেষ তারিখ</label>
                <input 
                  type="date" 
                  value={homeworkDate}
                  onChange={(e) => setHomeworkDate(e.target.value)}
                  className="w-full bg-slate-50 border-none rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none font-bold"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-emerald-900 ml-1">হোমওয়ার্ক হেডলাইন</label>
              <input 
                type="text" 
                value={homeworkHeadline}
                onChange={(e) => setHomeworkHeadline(e.target.value)}
                placeholder="হোমওয়ার্কের সংক্ষিপ্ত নাম"
                className="w-full bg-slate-50 border-none rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none font-bold"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-emerald-900 ml-1">বিস্তারিত</label>
              <textarea 
                rows={4}
                value={homeworkDetails}
                onChange={(e) => setHomeworkDetails(e.target.value)}
                placeholder="হোমওয়ার্কের বিস্তারিত বিবরণ লিখুন..."
                className="w-full bg-slate-50 border-none rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none font-bold"
              />
            </div>
            <button 
              type="submit"
              disabled={isSubmittingHomework}
              className="w-full bg-emerald-900 text-amber-400 font-black py-4 rounded-2xl shadow-xl shadow-emerald-900/20 flex items-center justify-center gap-2 group disabled:opacity-50 active:scale-[0.99] transition-all"
            >
              <Plus className="h-5 w-5 group-hover:rotate-90 transition-transform" />
              <span>{isSubmittingHomework ? "পাঠানো হচ্ছে..." : "সাবমিট করুন"}</span>
            </button>
          </form>
        </div>

        {duplicateConfirmData && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in font-serif" style={{ fontFamily: "'Noto Serif Bengali', serif" }}>
            <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full border border-gray-100 overflow-hidden transform transition-all p-6 space-y-6">
              <div className="flex flex-col items-center text-center space-y-3">
                <div className="h-16 w-16 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center">
                  <AlertCircle className="h-8 w-8 text-amber-600" />
                </div>
                <h3 className="font-black text-lg text-slate-950">হোমওয়ার্ক ডুপ্লিকেট সতর্কতা</h3>
                <p className="text-sm text-slate-600 leading-relaxed font-bold">
                  আজ জনাব <span className="text-emerald-800 font-black">[{duplicateConfirmData.teacherName}]</span> এই বিষয়ে হোমওয়ার্ক সাবমিট করেছেন, আপনি কি আবারও হোমওয়ার্ক এড করতে চান?
                </p>
              </div>
              
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    duplicateConfirmData.onConfirm();
                  }}
                  className="flex-1 bg-emerald-800 hover:bg-emerald-900 text-amber-400 font-black py-3 px-4 rounded-xl text-sm transition-all shadow-sm cursor-pointer"
                >
                  হ্যাঁ
                </button>
                <button
                  type="button"
                  onClick={() => setDuplicateConfirmData(null)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black py-3 px-4 rounded-xl text-sm transition-all cursor-pointer"
                >
                  না
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (activeSubView === "homework_history") {
    return (
      <div className="space-y-6 pb-12 font-alinur animate-fade-in px-4 pt-6">
        {/* Back navigation header */}
        <div className="flex items-center gap-3">
          <button 
            onClick={goBack}
            className="h-10 w-10 bg-white rounded-xl border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-all"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h3 className="text-xl font-black text-emerald-950">হোমওয়ার্ক হিস্ট্রি ও আপডেট</h3>
            <p className="text-xs text-emerald-700 font-bold">শ্রেণী: {selectedClass}</p>
          </div>
        </div>

        {/* History List */}
        <div className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-100 space-y-5">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
              <History className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-black text-lg text-emerald-950">হোমওয়ার্ক তালিকা</h3>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Previous homework entries</p>
            </div>
          </div>

          <StreamBuilder<any>
            stream={homeworkHistoryQuery}
            builder={(homeworks) => {
              if (homeworks.length === 0) return <p className="text-center py-10 text-slate-400 text-sm font-bold">কোনো হোমওয়ার্ক পাওয়া যায়নি।</p>;
              return (
                <div className="space-y-4 max-h-[55vh] overflow-y-auto pr-1 custom-scrollbar">
                  {homeworks.map((hw: any, idx: number) => (
                    <div key={hw.id} className="bg-emerald-50/40 rounded-2xl p-4 border border-emerald-100 space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-black text-sm text-emerald-900">{hw.headline}</h4>
                          <p className="text-xs text-emerald-700 font-bold mt-0.5">{hw.subject} • শেষ তারিখ: {toBengaliDigits(hw.dueDate)}</p>
                        </div>
                        {idx === 0 && (
                          <span className="text-[10px] font-black bg-emerald-200 text-emerald-800 px-2 py-0.5 rounded-full uppercase tracking-tighter">সর্বশেষ</span>
                        )}
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed font-bold">{hw.details}</p>
                      {hw.status !== "Completed" && hw.status !== "completed" ? (
                        <div className="flex gap-2 pt-2">
                          <button 
                            onClick={() => {
                              const newDate = prompt("নতুন তারিখ দিন (YYYY-MM-DD):", hw.dueDate);
                              if (newDate) {
                                updateDoc(doc(db, "homework", hw.id), { 
                                  dueDate: newDate, 
                                  isUpdated: true,
                                  updateStatus: "সময় বাড়ানো হয়েছে"
                                }).then(() => alert("তারিখ আপডেট করা হয়েছে!"));
                              }
                            }}
                            className="flex-1 bg-white text-emerald-800 border border-emerald-200 py-2 rounded-xl text-xs font-black shadow-xs active:scale-[0.98] transition-all"
                          >
                            তারিখ বাড়ান
                          </button>
                          <button 
                            onClick={() => {
                              updateDoc(doc(db, "homework", hw.id), { 
                                status: "completed", 
                                completedAt: serverTimestamp() 
                              }).then(() => alert("হোমওয়ার্ক সম্পন্ন করা হয়েছে!"));
                            }}
                            className="flex-1 bg-emerald-800 text-white py-2 rounded-xl text-xs font-black shadow-xs active:scale-[0.98] transition-all"
                          >
                            কমপ্লিট করুন
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-black bg-emerald-100/50 px-3 py-1.5 rounded-xl w-fit">
                          <Check className="h-4 w-4" />
                          <span>হোমওয়ার্ক সম্পন্ন হয়েছে</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              );
            }}
          />
        </div>
      </div>
    );
  }

  if (activeSubView === "attendance") {
    const formattedDay = today.toLocaleDateString('bn-BD', { weekday: 'long' });
    const formattedDateBengali = today.toLocaleDateString('bn-BD', { year: 'numeric', month: 'long', day: 'numeric' });

    return (
      <div className="space-y-6 pb-12 font-alinur animate-fade-in px-4 pt-6">
        {/* Back navigation header */}
        <div className="flex items-center gap-3">
          <button 
            onClick={goBack}
            className="h-10 w-10 bg-white rounded-xl border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-all"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h3 className="text-xl font-black text-emerald-950">শিক্ষার্থী হাজিরা রেজিস্টার</h3>
            <p className="text-xs text-emerald-700 font-bold">শ্রেণী: {selectedClass}</p>
          </div>
        </div>

        {/* Tab Controls for Register vs Report */}
        <div className="bg-emerald-50 p-1 rounded-2xl flex border border-emerald-100">
          <button
            onClick={() => setAttendanceTab("register")}
            className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all ${attendanceTab === "register" ? 'bg-emerald-800 text-white shadow-sm' : 'text-emerald-950'}`}
          >
            হাজিরা রেজিস্টার
          </button>
          <button
            onClick={() => setAttendanceTab("report")}
            className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all ${attendanceTab === "report" ? 'bg-emerald-800 text-white shadow-sm' : 'text-emerald-950'}`}
          >
            হাজিরা রিপোর্ট ও হিস্ট্রি
          </button>
        </div>

        {attendanceTab === "register" ? (
          /* REGISTER TAB */
          <div className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-100 space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-emerald-950 text-amber-400 rounded-xl flex items-center justify-center">
                  <CalendarCheck className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-black text-lg text-emerald-950">স্মার্ট হাজিরা রেজিস্টার</h3>
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Attendance Sheet</p>
                </div>
              </div>
              {lockStatus && (
                <div className="bg-amber-50 text-amber-700 px-3 py-1 rounded-full border border-amber-100 text-[10px] font-black flex items-center gap-1.5">
                  <span className="h-2 w-2 bg-amber-500 rounded-full animate-pulse"></span>
                  {toBengaliDigits(timeLeft)}
                </div>
              )}
            </div>

            {lockStatus && (
              <div 
                onClick={() => {
                  alert(`আজ ${formattedDateBengali} ${formattedDay} ${lockStatus.teacherName} এই ক্লাসের হাজিরা সম্পন্ন করেছেন। আগামী কাল আবার নতুন হাজিরা দিতে পারবেন।`);
                }}
                className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-amber-900 cursor-pointer text-xs font-bold leading-relaxed space-y-1 relative overflow-hidden"
              >
                <div className="absolute right-0 top-0 h-full w-2 bg-amber-400"></div>
                <p className="font-black text-sm text-amber-950">আজকের হাজিরা লকড</p>
                <p>আজ {formattedDateBengali} {formattedDay} {lockStatus.teacherName} এই ক্লাসের হাজিরা সম্পন্ন করেছেন।</p>
                <p className="font-black mt-2 text-emerald-800">আগামী কাল আবার নতুন হাজিরা দিতে পারবেন। (আর {toBengaliDigits(timeLeft)} পর হাজিরা উন্মুক্ত হবে)</p>
              </div>
            )}

            {isFriday ? (
              <div className="py-10 text-center bg-rose-50 rounded-2xl border border-dashed border-rose-100">
                <Calendar className="h-10 w-10 text-rose-300 mx-auto mb-2" />
                <h4 className="font-black text-rose-700 text-base">আজ শুক্রবার - সাপ্তাহিক ছুটি</h4>
                <p className="text-xs text-rose-500 font-bold mt-1">আজ কোনো হাজিরা কাউন্ট হবে না।</p>
              </div>
            ) : (
              <div className="space-y-4">
                <StreamBuilder<any>
                  stream={activeStudentsQuery}
                  loadingNode={
                    <div className="space-y-3 max-h-[42vh] overflow-y-auto pr-1">
                      {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="bg-slate-50/50 rounded-2xl p-4 border border-slate-100 flex flex-col gap-3 animate-pulse">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 bg-slate-200 rounded-xl shrink-0"></div>
                            <div className="min-w-0 space-y-2 w-full">
                              <div className="h-4 bg-slate-200 rounded-md w-1/3"></div>
                              <div className="h-3 bg-slate-200 rounded-md w-1/4"></div>
                            </div>
                          </div>
                          <div className="grid grid-cols-4 gap-1.5 w-full mt-1">
                            {[1, 2, 3, 4].map((j) => (
                              <div key={j} className="h-8 bg-slate-200 rounded-xl"></div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  }
                  builder={(students) => {
                    studentsRef.current = students; // Store the student names in ref for looking up when submitting
                    if (students.length === 0) return <p className="text-center py-10 text-slate-400 text-sm font-bold">কোনো শিক্ষার্থী পাওয়া যায়নি।</p>;
                    return (
                      <div className="space-y-3 max-h-[42vh] overflow-y-auto pr-1 custom-scrollbar">
                        {students.map((student: any) => (
                          <div key={student.id} className="bg-slate-50/50 rounded-2xl p-4 border border-slate-100 flex flex-col gap-3">
                            {/* Top info row: Roll, Name, Phone */}
                            <div className="flex items-center justify-between gap-3">
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="h-10 w-10 bg-white rounded-xl border border-slate-200 flex items-center justify-center text-emerald-800 font-black shrink-0 shadow-xs">
                                  {toBengaliDigits(student.roll)}
                                </div>
                                <div className="min-w-0">
                                  <h4 className="font-black text-sm text-emerald-950 truncate">{student.name}</h4>
                                  <div className="flex items-center gap-2 mt-0.5">
                                    <a href={`tel:${student.phone}`} className="h-6 w-6 bg-emerald-100 text-emerald-700 rounded-lg flex items-center justify-center hover:bg-emerald-700 hover:text-white transition-all">
                                      <Activity className="h-3.5 w-3.5" />
                                    </a>
                                    <LeaveBadge studentRoll={student.roll} className={selectedClass} todayStr={todayStr} />
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Requirement 3: Vertical layout directly below student name */}
                            <div className="grid grid-cols-4 gap-1.5 w-full mt-1">
                              {[
                                { id: "Present", label: "উপস্থিত", color: "bg-emerald-600 border-emerald-600 text-white" },
                                { id: "Absent", label: "অনুপস্থিত", color: "bg-rose-600 border-rose-600 text-white" },
                                { id: "Late", label: "লেইট", color: "bg-amber-500 border-amber-500 text-white" },
                                { id: "Leave", label: "ছুটি", color: "bg-indigo-600 border-indigo-600 text-white" }
                              ].map(s => {
                                const isActive = attendanceMarkers[student.roll] === s.id;
                                return (
                                  <button
                                    key={s.id}
                                    disabled={!!lockStatus}
                                    onClick={() => setAttendanceMarkers(prev => ({ ...prev, [student.roll]: s.id }))}
                                    className={`py-2 rounded-xl text-xs font-black transition-all border text-center ${
                                      isActive 
                                        ? `${s.color} shadow-sm font-black` 
                                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                                    } disabled:opacity-40`}
                                  >
                                    {s.label}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  }}
                />

                {/* Submit button - handles duplicate submission lock elegantly */}
                <button 
                  onClick={handleAttendanceSubmit}
                  className="w-full bg-emerald-950 text-white font-black py-4 rounded-2xl shadow-xl shadow-emerald-900/20 flex items-center justify-center gap-2 group transition-all"
                >
                  <CheckCircle className="h-5 w-5" />
                  <span>{isSubmittingAttendance ? "সাবমিট হচ্ছে..." : "হাজিরা সাবমিট করুন"}</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          /* REPORT & HISTORY TAB */
          <div className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-100 space-y-5">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
                <Users className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-black text-lg text-emerald-950">হাজিরা রিপোর্ট বিবরণী</h3>
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Attendance Report logs</p>
              </div>
            </div>

            {/* Date filter picker */}
            <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100 flex items-center gap-3">
              <div className="h-9 w-9 bg-white rounded-xl flex items-center justify-center text-emerald-600 shadow-xs">
                <Search className="h-4 w-4" />
              </div>
              <div className="flex-1">
                <span className="text-[10px] font-black text-emerald-700 uppercase block mb-0.5">তারিখ পরিবর্তন করুন</span>
                <input 
                  type="date" 
                  value={reportDate}
                  onChange={(e) => setReportDate(e.target.value)}
                  className="bg-transparent border-none outline-none text-sm font-black text-emerald-900 w-full"
                />
              </div>
            </div>

            {/* Attendance Report Data */}
            <div className="overflow-y-auto max-h-[42vh] pr-1 custom-scrollbar space-y-3">
              <StreamBuilder<any>
                stream={attendanceReportQuery}
                builder={(attendance) => {
                  if (attendance.length === 0) return (
                    <div className="text-center py-10 text-slate-400 font-bold space-y-2">
                      <Calendar className="h-10 w-10 text-slate-200 mx-auto" />
                      <p className="text-sm">এই তারিখে ({toBengaliDigits(reportDate)}) কোনো হাজিরার রেকর্ড পাওয়া যায়নি।</p>
                    </div>
                  );
                  return (
                    <div className="space-y-2.5">
                      {attendance.map((item: any) => (
                        <div key={item.id} className="bg-slate-50 border border-slate-150 rounded-2xl p-4 flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="h-9 w-9 bg-white rounded-lg border border-slate-200 flex items-center justify-center text-emerald-800 font-black shrink-0">
                              {toBengaliDigits(item.studentRoll)}
                            </div>
                            <div className="min-w-0">
                              <h4 className="font-black text-sm text-emerald-950 truncate">{item.studentName || "শিক্ষার্থী"}</h4>
                              <p className="text-[10px] text-slate-400 font-bold mt-0.5">শিক্ষক: {item.teacherName}</p>
                            </div>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-black ${
                            item.status === "Present" ? "bg-emerald-100 text-emerald-700 border border-emerald-200" :
                            item.status === "Absent" ? "bg-rose-100 text-rose-700 border border-rose-200" :
                            item.status === "Late" ? "bg-amber-100 text-amber-700 border border-amber-200" : "bg-indigo-100 text-indigo-700 border border-indigo-200"
                          }`}>
                            {item.status === "Present" ? "উপস্থিত" : item.status === "Absent" ? "অনুপস্থিত" : item.status === "Late" ? "লেইট" : "ছুটি"}
                          </span>
                        </div>
                      ))}
                    </div>
                  );
                }}
              />
            </div>
          </div>
        )}
      </div>
    );
  }

  return null;
};

const TeacherLeaveSection = ({ teacherData, toBengaliDigits }: any) => {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const calculateDays = (start: string, end: string) => {
    if (!start || !end) return 1;
    try {
      const s = new Date(start);
      const e = new Date(end);
      const diffTime = e.getTime() - s.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      return diffDays > 0 ? diffDays : 1;
    } catch {
      return 1;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate || !endDate || !reason.trim()) {
      alert("অনুগ্রহ করে সকল ঘর সঠিকভাবে পূরণ করুন।");
      return;
    }

    setIsSubmitting(true);
    try {
      const totalDays = calculateDays(startDate, endDate);
      await addDoc(collection(db, "teacher_leaves"), {
        teacherId: teacherData?.id || "",
        teacherName: teacherData?.name || teacherData?.teacherName || "শিক্ষক",
        designation: teacherData?.designation || "সহকারী শিক্ষক",
        applicantType: "teacher",
        startDate,
        endDate,
        totalDays,
        reason: reason.trim(),
        status: "Pending",
        createdAt: serverTimestamp()
      });

      alert("আপনার ছুটির আবেদন সফলভাবে জমা দেয়া হয়েছে। অ্যাডমিন পর্যালোচনার অপেক্ষায় থাকবে।");
      setStartDate("");
      setEndDate("");
      setReason("");
    } catch (error) {
      console.error("Error submitting teacher leave:", error);
      alert("আবেদন জমা দিতে সমস্যা হয়েছে। আবার চেষ্টা করুন।");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 font-alinur animate-fade-in">
      {/* Leave Application Form */}
      <div className="bg-white rounded-[32px] p-6 shadow-xl border border-slate-100 space-y-5">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
          <div className="h-12 w-12 bg-emerald-50 text-emerald-800 rounded-2xl flex items-center justify-center font-black shadow-xs border border-emerald-100">
            <CalendarRange className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-lg font-black text-emerald-950 font-serif">শিক্ষক ছুটির আবেদন</h3>
            <p className="text-xs text-slate-500 font-bold">ছুটির জন্য প্রয়োজনীয় তথ্য জমা দিন</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-black text-slate-700 block">ছুটি শুরুর তারিখ:</label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white transition-all"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-black text-slate-700 block">ছুটি শেষের তারিখ:</label>
              <input
                type="date"
                required
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white transition-all"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-black text-slate-700 block">ছুটির সুনির্দিষ্ট কারণ:</label>
            <textarea
              required
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="জরুরী পারিবারিক কাজ / শারীরিক অসুস্থতা..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-emerald-800 hover:bg-emerald-950 text-amber-400 py-3.5 rounded-2xl text-xs font-black shadow-lg shadow-emerald-900/20 active:scale-98 transition-all flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <Loader2 className="h-5 w-5 animate-spin text-white" />
            ) : (
              <>
                <Send className="h-4 w-4" />
                <span>আবেদন জমা দিন</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* Submitted Leave History & Live Status */}
      <div className="bg-white rounded-[32px] p-6 shadow-xl border border-slate-100 space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <Clock className="h-5 w-5 text-amber-500" />
          <h4 className="font-black text-sm text-emerald-950 font-serif">আপনার জমাকৃত ছুটির আবেদনের তালিকা</h4>
        </div>

        <StreamBuilder<any>
          stream={query(collection(db, "teacher_leaves"), orderBy("createdAt", "desc"))}
          builder={(leaves) => {
            const myLeaves = leaves.filter(
              (l: any) =>
                l.teacherName === teacherData?.name ||
                l.teacherId === teacherData?.id
            );

            if (myLeaves.length === 0) {
              return (
                <div className="text-center py-8 opacity-40 space-y-1">
                  <ClipboardList className="h-10 w-10 mx-auto text-slate-400" />
                  <p className="text-xs font-bold text-slate-600">আপনি এখনও কোনো ছুটির আবেদন করেননি</p>
                </div>
              );
            }

            return (
              <div className="space-y-3">
                {myLeaves.map((l: any) => {
                  const isApproved = l.status === "Approved" || l.status === "approved";
                  const isRejected = l.status === "Rejected" || l.status === "rejected";
                  const isPending = !isApproved && !isRejected;

                  return (
                    <div
                      key={l.id}
                      className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-3 relative hover:border-emerald-300 transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 text-emerald-600" />
                          {toBengaliDigits(l.startDate)} থেকে {toBengaliDigits(l.endDate)} ({toBengaliDigits(l.totalDays || 1)} দিন)
                        </span>

                        {isApproved && (
                          <span className="text-[10px] font-black bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3 text-emerald-600" /> মঞ্জুরকৃত
                          </span>
                        )}
                        {isRejected && (
                          <span className="text-[10px] font-black bg-rose-100 text-rose-800 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                            <XCircle className="h-3 w-3 text-rose-600" /> বাতিলকৃত
                          </span>
                        )}
                        {isPending && (
                          <span className="text-[10px] font-black bg-amber-100 text-amber-800 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                            <Clock className="h-3 w-3 text-amber-600" /> পেন্ডিং
                          </span>
                        )}
                      </div>

                      <div className="bg-white p-2.5 rounded-xl border border-slate-100 text-xs text-slate-700">
                        <p className="text-[10px] text-slate-400 font-black uppercase">কারণ</p>
                        <p className="font-bold">{l.reason}</p>
                      </div>

                      {(l.admin_note || l.adminNote) && (
                        <div className="bg-amber-50 p-2.5 rounded-xl border border-amber-200/60 text-xs">
                          <p className="text-[10px] text-amber-800 font-black uppercase">অ্যাডমিন মন্তব্য</p>
                          <p className="font-bold text-amber-950">{l.admin_note || l.adminNote}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          }}
        />
      </div>
    </div>
  );
};

const TeacherDashboardInner = ({ 
  user, 
  setShowLogoutConfirm,
  toBengaliDigits 
}: any) => {
  const [teacherData, setTeacherData] = useState<Teacher | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [attendanceStatus, setAttendanceStatus] = useState<any>(null);
  const [monthlyAttendance, setMonthlyAttendance] = useState<any[]>([]);
  const [isSubmittingAttendance, setIsSubmittingAttendance] = useState(false);
  const [showNoticeModal, setShowNoticeModal] = useState(false);
  const [selectedNotice, setSelectedNotice] = useState<any>(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyFilterDate, setHistoryFilterDate] = useState("");
  const [activeTeacherTab, setActiveTeacherTab] = useState("home");

  const today = useMemo(() => new Date(), []);
  const todayStr = useMemo(() => today.toISOString().split('T')[0], [today]);
  const dayName = useMemo(() => {
    try {
      return today.toLocaleDateString('bn-BD', { weekday: 'long' }) || "আজ";
    } catch (e) {
      return "আজ";
    }
  }, [today]);
  const formattedDate = useMemo(() => {
    try {
      return today.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
    } catch (e) {
      return today.toDateString();
    }
  }, [today]);
  const isFriday = today.getDay() === 5;
  const currentMonth = today.toLocaleString('en-US', { month: 'long', year: 'numeric' });

  // 1. Fetch Teacher Profile
  useEffect(() => {
    if (!user?.email) {
      setLoadingProfile(false);
      return;
    }
    const q = query(collection(db, "teachers"), where("email", "==", user.email), limit(1));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        setTeacherData({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as Teacher);
      }
      setLoadingProfile(false);
    }, (error) => {
      console.error("Profile fetch error:", error);
      setLoadingProfile(false);
    });
    return () => unsubscribe();
  }, [user?.email]);

  // 2. Fetch Today's Attendance Status
  useEffect(() => {
    if (!teacherData?.id) return;
    const q = query(
      collection(db, "teacher_attendance"), 
      where("teacherId", "==", teacherData.id),
      where("date", "==", todayStr)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        setAttendanceStatus(snapshot.docs[0].data());
      } else {
        setAttendanceStatus(null);
      }
    });
    return () => unsubscribe();
  }, [teacherData?.id, todayStr]);

  // 3. Fetch Monthly Attendance for Chart
  useEffect(() => {
    if (!teacherData?.id) return;
    const q = query(
      collection(db, "teacher_attendance"),
      where("teacherId", "==", teacherData.id),
      where("month", "==", currentMonth),
      where("status", "==", "Present")
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMonthlyAttendance(snapshot.docs.map(d => d.data()));
    });
    return () => unsubscribe();
  }, [teacherData?.id, currentMonth]);

  const handleConfirmAttendance = async () => {
    if (isFriday || (attendanceStatus && attendanceStatus.status !== "Absent") || isSubmittingAttendance || !teacherData) return;
    setIsSubmittingAttendance(true);
    try {
      await addDoc(collection(db, "teacher_attendance"), {
        teacherId: teacherData.id,
        teacherName: teacherData.name,
        teacherPhoto: teacherData.photoUrl,
        teacherDesignation: teacherData.designation,
        date: todayStr,
        status: "Pending",
        timestamp: serverTimestamp(),
        month: currentMonth
      });
    } catch (error) {
      console.error("Attendance error:", error);
    } finally {
      setIsSubmittingAttendance(false);
    }
  };

  if (loadingProfile) return (
    <div className="h-[80vh] flex flex-col items-center justify-center bg-[#f8fafc] rounded-[40px] m-4 space-y-4">
      <div className="relative">
        <div className="h-20 w-20 border-4 border-emerald-100 border-t-emerald-600 rounded-full animate-spin"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <GraduationCap className="h-8 w-8 text-emerald-600" />
        </div>
      </div>
      <div className="text-center">
        <p className="text-emerald-900 font-black text-lg animate-pulse" style={{ fontFamily: 'Noto Serif Bengali' }}>অ্যাকাউন্ট লোড হচ্ছে...</p>
        <p className="text-slate-400 text-xs font-bold mt-1">অনুগ্রহ করে কিছুক্ষণ অপেক্ষা করুন</p>
      </div>
    </div>
  );

  if (!teacherData) return (
    <div className="h-[80vh] flex flex-col items-center justify-center bg-[#f8fafc] rounded-[40px] m-4 p-8 text-center border-2 border-dashed border-slate-200">
      <div className="h-20 w-20 bg-rose-50 rounded-full flex items-center justify-center text-rose-500 mb-6">
        <AlertTriangle className="h-10 w-10" />
      </div>
      <h2 className="text-2xl font-black text-slate-800 mb-2" style={{ fontFamily: 'Noto Serif Bengali' }}>শিক্ষক প্রোফাইল পাওয়া যায়নি</h2>
      <p className="text-slate-500 text-sm mb-8 leading-relaxed max-w-xs">আপনার ইমেইল দিয়ে কোনো শিক্ষক প্রোফাইল নিবন্ধন করা হয়নি। দয়া করে এডমিনের সাথে যোগাযোগ করুন।</p>
      <button 
        onClick={() => setShowLogoutConfirm(true)}
        className="bg-emerald-800 text-white px-8 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-lg shadow-emerald-900/20 active:scale-95 transition-all"
      >
        <LogOut className="h-5 w-5" />
        লগ আউট করুন
      </button>
    </div>
  );

  const attendanceCount = monthlyAttendance?.length || 0;
  // Assuming 26 working days max for chart
  const attendancePercentage = Math.min(100, Math.max(0, Math.round((attendanceCount / 26) * 100))) || 0;

  return (
    <div className="relative -mt-8 -mx-2 bg-[#f8fafc] pb-28 min-h-screen">
      {/* Premium Green Header Card */}
      {activeTeacherTab !== "students" && (
        <div className="bg-gradient-to-br from-emerald-900 via-emerald-800 to-orange-800 pt-10 pb-36 px-6 rounded-b-[50px] shadow-2xl relative z-0 overflow-hidden">
          {/* Abstract Background Shapes */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-20 -mt-20"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl -ml-20 -mb-20"></div>

          <div className="max-w-md mx-auto text-center relative z-10">
             <h2 className="text-3xl font-black text-white mt-1 leading-tight tracking-tight" style={{ fontFamily: 'Alinur Tatsama' }}>
              শিক্ষক ড্যাশবোর্ড
            </h2>
            <div className="flex items-center justify-center gap-2 mt-3">
              <div className="bg-white/10 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/10 flex items-center gap-2">
                <Clock className="h-4 w-4 text-amber-400" />
                <p className="text-emerald-50 font-bold text-xs tracking-wide">{formattedDate}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Teacher Profile Card - Overlapping */}
      {activeTeacherTab === "home" && (
        <>
          <div className="px-4 -mt-28 relative z-10 max-w-lg mx-auto">
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-gradient-to-b from-white to-emerald-50/30 rounded-[40px] p-5 shadow-[0_25px_60px_rgba(5,150,105,0.12)] border border-white/80 flex flex-col items-center relative overflow-hidden group"
        >
          {/* Top Floating Buttons inside Profile Card */}
          <div className="absolute top-6 left-6 right-6 flex items-center justify-between z-30">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => window.dispatchEvent(new CustomEvent('toggle-sidebar'))}
              className="h-10 w-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 border border-emerald-100 shadow-sm hover:bg-emerald-600 hover:text-white transition-all cursor-pointer"
            >
              <Menu className="h-5 w-5" />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setShowLogoutConfirm(true)}
              className="h-10 w-10 bg-rose-50 rounded-xl flex items-center justify-center text-rose-500 border border-rose-100 shadow-sm hover:bg-rose-500 hover:text-white transition-all cursor-pointer"
            >
              <LogOut className="h-5 w-5" />
            </motion.button>
          </div>
          {/* Decorative Glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-1 bg-gradient-to-r from-transparent via-orange-400 to-transparent opacity-50"></div>

          <div className="relative group">
            {/* Square Glowing Ring Animation */}
            <motion.div 
              animate={{ rotate: [0, 90, 180, 270, 360] }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="absolute -inset-3 bg-gradient-to-tr from-emerald-500 via-orange-400 to-emerald-600 rounded-[32px] blur-[3px] opacity-40 group-hover:opacity-80 transition-opacity"
            ></motion.div>
            
            <div className="h-28 w-28 rounded-[28px] border-4 border-white shadow-2xl overflow-hidden relative z-10 bg-slate-100 ring-4 ring-emerald-500/10">
              <img 
                key={teacherData?.photoUrl || "placeholder"}
                src={teacherData?.photoUrl || "https://ui-avatars.com/api/?name=" + encodeURIComponent(teacherData?.name || "Teacher") + "&background=059669&color=fff"} 
                alt="Profile" 
                className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-700"
                referrerPolicy="no-referrer"
                onError={(e: any) => {
                  e.target.src = "https://ui-avatars.com/api/?name=" + encodeURIComponent(teacherData?.name || "Teacher") + "&background=059669&color=fff";
                }}
              />
            </div>
          </div>

          <div className="mt-3 text-center">
            <h3 className="text-2xl font-black text-emerald-950 tracking-tight" style={{ fontFamily: 'Noto Serif Bengali' }}>{teacherData?.name || "নাম পাওয়া যায়নি"}</h3>
            <div className="flex items-center justify-center gap-2 mt-0.5">
              <span className="h-1.5 w-1.5 bg-orange-500 rounded-full animate-pulse"></span>
              <p className="text-emerald-600 font-black text-xs uppercase tracking-widest">{teacherData?.designation || "পদবি পাওয়া যায়নি"}</p>
            </div>
          </div>

          <div className="mt-3 flex justify-center w-full border-t border-emerald-100/50 pt-3">
            <div className="bg-emerald-50/50 px-5 py-2.5 rounded-2xl border border-emerald-100/30 flex items-center gap-3 group/phone">
              <div className="h-8 w-8 bg-white rounded-xl flex items-center justify-center text-emerald-600 shadow-sm group-hover/phone:bg-emerald-600 group-hover/phone:text-white transition-all">
                <Activity className="h-4 w-4" />
              </div>
              <div className="text-left">
                <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest block leading-none mb-0.5">মোবাইল নাম্বার</span>
                <span className="text-sm font-black text-emerald-900 tracking-wider leading-none">{teacherData?.phone || "N/A"}</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Attendance Section */}
      <div className="px-2 mt-8 max-w-lg mx-auto font-alinur">
        <div className="bg-gradient-to-br from-[#1e1b4b] via-[#312e81] to-[#4338ca] rounded-[32px] p-6 shadow-[0_30px_70px_rgba(49,46,129,0.3)] border-2 border-indigo-400/20 flex flex-col items-center gap-6 relative overflow-hidden group ring-1 ring-white/10 text-white">
          {/* Animated Background Glow */}
          <div className="absolute -top-32 -right-32 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl opacity-60 group-hover:bg-purple-500/20 transition-colors duration-1000"></div>
          <div className="absolute -bottom-32 -left-32 w-64 h-64 bg-fuchsia-500/20 rounded-full blur-3xl opacity-60 group-hover:bg-indigo-400/20 transition-colors duration-1000"></div>

          <div className="w-full relative z-10">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 bg-gradient-to-br from-amber-400 to-orange-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-orange-600/30 ring-4 ring-white/10">
                  <CalendarCheck className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="font-black text-lg text-white leading-tight bg-gradient-to-r from-emerald-500 to-emerald-700 px-4 py-1.5 rounded-full shadow-lg shadow-emerald-950/20 border border-white/10">উপস্থিতি নিশ্চিত</h4>
                  <p className="text-[10px] text-amber-300 font-black uppercase tracking-widest opacity-80 mt-1">Daily Attendance Tracker</p>
                </div>
              </div>

              {/* Status Badge in Header */}
              {attendanceStatus && (
                <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-2 border shadow-sm ${
                  attendanceStatus.status === "Pending" ? "bg-amber-500/20 text-amber-200 border-amber-400/30" :
                  attendanceStatus.status === "Present" ? "bg-emerald-500/20 text-emerald-200 border-emerald-400/30" :
                  "bg-rose-500/20 text-rose-200 border-rose-400/30"
                }`}>
                  <span className={`h-2 w-2 rounded-full animate-pulse ${
                    attendanceStatus.status === "Pending" ? "bg-amber-500" :
                    attendanceStatus.status === "Present" ? "bg-emerald-500" : "bg-rose-500"
                  }`}></span>
                  {attendanceStatus.status === "Pending" ? "অপেক্ষমান" : 
                   attendanceStatus.status === "Present" ? "নিশ্চিত" : "অনুপস্থিত"}
                </div>
              )}
            </div>

            {isFriday ? (
              <div className="bg-white/5 backdrop-blur-sm text-white/60 py-6 rounded-[24px] text-center border-2 border-dashed border-white/10 font-black flex flex-col items-center gap-2">
                <div className="h-10 w-10 bg-white/10 rounded-full flex items-center justify-center mb-1">
                  <Calendar className="h-5 w-5 opacity-50" />
                </div>
                আজ শুক্রবার - সাপ্তাহিক ছুটি
              </div>
            ) : attendanceStatus ? (
              <div className={`p-6 rounded-[24px] border-2 transition-all relative overflow-hidden group/status ${
                attendanceStatus.status === "Pending" 
                  ? "bg-amber-500/10 text-white border-amber-400/20 shadow-[0_10px_30px_rgba(245,158,11,0.1)]" 
                  : attendanceStatus.status === "Present"
                  ? "bg-emerald-500/10 text-white border-emerald-400/20 shadow-[0_10px_30_rgba(16,185,129,0.1)]"
                  : "bg-rose-500/10 text-white border-rose-400/20 shadow-[0_10px_30px_rgba(244,63,94,0.1)]"
              }`}>
                <div className="flex items-center gap-5 relative z-10">
                  <motion.div 
                    initial={{ scale: 0.5, rotate: -45 }}
                    animate={{ scale: 1, rotate: 0 }}
                    className={`h-14 w-14 rounded-2xl flex items-center justify-center shadow-lg shrink-0 ${
                      attendanceStatus.status === "Pending" ? "bg-amber-500 text-white" :
                      attendanceStatus.status === "Present" ? "bg-emerald-600 text-white" : "bg-rose-500 text-white"
                    }`}
                  >
                    {attendanceStatus.status === "Pending" ? <Clock className="h-7 w-7" /> :
                     attendanceStatus.status === "Present" ? (
                       <motion.div
                         animate={{ scale: [1, 1.2, 1] }}
                         transition={{ duration: 1.5, repeat: Infinity }}
                       >
                         <CheckCircle2 className="h-7 w-7" />
                       </motion.div>
                     ) : (
                       <motion.div
                         animate={{ x: [-2, 2, -2] }}
                         transition={{ duration: 0.5, repeat: Infinity }}
                       >
                         <XCircle className="h-7 w-7" />
                       </motion.div>
                     )}
                  </motion.div>
                  
                  <div className="flex-1">
                    <p className="text-lg font-black leading-tight mb-1 text-white" style={{ fontFamily: 'Noto Serif Bengali' }}>
                      {attendanceStatus.status === "Pending" 
                        ? "উপস্থিতি পেন্ডিং রয়েছে!" 
                        : attendanceStatus.status === "Present"
                        ? "উপস্থিতি নিশ্চিত করা হয়েছে!"
                        : "আজ আপনি অনুপস্থিত!"}
                    </p>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold opacity-70 flex items-center gap-1 text-white">
                        <Clock className="h-3 w-3" /> আজ: {dayName}
                      </span>
                      <span className="h-1 w-1 bg-white/20 rounded-full"></span>
                      <span className="text-xs font-black text-amber-300 bg-white/10 px-2 py-0.5 rounded-lg border border-white/10 flex items-center gap-1">
                        <Calendar className="h-3 w-3" /> উপস্থিত: {toBengaliDigits(attendanceCount)} দিন
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <motion.button
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleConfirmAttendance}
                disabled={isSubmittingAttendance}
                className="w-full bg-gradient-to-r from-emerald-600 via-emerald-700 to-emerald-900 text-white font-black py-5 rounded-[24px] shadow-2xl shadow-emerald-900/30 flex items-center justify-center gap-4 active:scale-95 transition-all relative overflow-hidden group/btn"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-1000"></div>
                {isSubmittingAttendance ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : (
                  <>
                    <Activity className="h-6 w-6 animate-pulse text-amber-300" />
                    <span className="text-lg">উপস্থিতি নিশ্চিত করুন</span>
                    <div className="bg-white/10 px-3 py-1 rounded-lg text-xs border border-white/10">{dayName}</div>
                  </>
                )}
              </motion.button>
            )}
            
            <button 
              onClick={() => setShowHistoryModal(true)}
              className="mt-4 w-full bg-white/5 hover:bg-white/10 text-white font-bold py-3 rounded-2xl border border-white/10 transition-all flex items-center justify-center gap-2 group/hist"
            >
              <History className="h-4 w-4 group-hover:rotate-[-30deg] transition-transform text-amber-400" />
              <span>উপস্থিতি বিবরণী দেখুন</span>
            </button>
          </div>

          <div className="w-full h-[1px] bg-white/10 my-2 relative z-10"></div>

          {/* Monthly Attendance Chart - Row Alignment */}
          <div className="w-full flex items-center justify-between gap-6 relative z-10 px-2 text-white">
            <div className="flex-1">
              <h5 className="font-black text-amber-200 text-sm mb-1">চলমান মাসের রিপোর্ট</h5>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-emerald-400" />
                <p className="text-xs text-white/70 font-bold">মোট উপস্থিতি: <span className="text-white font-black">{toBengaliDigits(attendanceCount)} দিন</span></p>
              </div>
            </div>
            
            <div className="relative h-20 w-20 flex items-center justify-center shrink-0">
              <svg className="h-full w-full -rotate-90 drop-shadow-sm" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="16" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="4" />
                <motion.circle 
                  cx="18" cy="18" r="16" fill="none" stroke="url(#attendanceGradient)" strokeWidth="4"
                  strokeDasharray="100, 100"
                  strokeDashoffset={100 - attendancePercentage}
                  strokeLinecap="round"
                  initial={{ strokeDashoffset: 100 }}
                  animate={{ strokeDashoffset: 100 - attendancePercentage }}
                  transition={{ duration: 2, ease: "circOut" }}
                />
                <defs>
                  <linearGradient id="attendanceGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#fbbf24" />
                    <stop offset="100%" stopColor="#f59e0b" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xl font-black text-white leading-none">{toBengaliDigits(attendancePercentage)}<span className="text-[10px] ml-0.5">%</span></span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Teacher Notice Section - Full Width Fitting */}
      <div className="mt-10 px-0 sm:px-2 max-w-lg mx-auto font-alinur">
        <div className="bg-white sm:rounded-[32px] p-6 sm:p-8 shadow-[0_20px_60px_rgba(0,0,0,0.05)] border-y sm:border border-slate-100 relative overflow-hidden">
           {/* Subtle Pattern Background */}
           <div className="absolute top-0 right-0 p-4 opacity-[0.03] pointer-events-none">
             <Megaphone className="h-32 w-32 -rotate-12" />
           </div>

           <div className="flex items-center justify-between mb-8 relative z-10">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-600 shadow-sm border border-orange-100">
                <Megaphone className="h-6 w-6" />
              </div>
              <div>
                <h4 className="font-black text-xl text-emerald-950">শিক্ষকদের জন্য নোটিশ</h4>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Official Notifications</p>
              </div>
            </div>
            <div className="h-1 w-12 bg-emerald-100 rounded-full"></div>
          </div>
          
          <StreamBuilder
            stream={query(collection(db, "teacher_notices"), orderBy("timestamp", "desc"), limit(2))}
            builder={(notices: any[]) => {
              if (notices.length === 0) return (
                <div className="text-center py-12 flex flex-col items-center gap-3 bg-slate-50/50 rounded-3xl border border-dashed border-slate-200">
                  <MessageSquare className="h-10 w-10 text-slate-200" />
                  <p className="text-sm text-slate-400 font-bold">আপাতত কোনো নোটিশ নেই</p>
                </div>
              );
              return (
                <div className="grid gap-5 relative z-10">
                  {notices.map((notice) => (
                    <motion.div 
                      key={notice.id} 
                      whileHover={{ y: -4 }}
                      onClick={() => {
                        setSelectedNotice(notice);
                        setShowNoticeModal(true);
                      }}
                      className="p-6 bg-gradient-to-br from-slate-50/50 to-white rounded-[24px] border border-slate-100 flex items-start gap-4 group cursor-pointer hover:shadow-xl hover:shadow-emerald-900/5 transition-all"
                    >
                       <div className="h-12 w-12 bg-white rounded-2xl flex items-center justify-center text-emerald-600 shadow-sm border border-emerald-50 shrink-0 group-hover:bg-emerald-600 group-hover:text-white transition-all duration-500">
                          <Award className="h-6 w-6" />
                       </div>
                       <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] font-black text-orange-600 uppercase tracking-widest">New Update</span>
                            <span className="h-1 w-1 bg-slate-300 rounded-full"></span>
                            <span className="text-[10px] text-slate-400 font-bold">{notice.timestamp ? new Date(notice.timestamp.seconds * 1000).toLocaleDateString('bn-BD') : "আজ"}</span>
                          </div>
                          <h5 className="font-black text-emerald-950 text-base mb-1 truncate group-hover:text-emerald-700 transition-colors">{notice.title}</h5>
                          <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">{notice.description}</p>
                          <div className="flex items-center gap-2 mt-4 text-[10px] font-black text-emerald-600 group-hover:translate-x-1 transition-transform">
                            <span>বিস্তারিত পড়ুন</span>
                            <ChevronDown className="h-3 w-3 -rotate-90" />
                          </div>
                       </div>
                    </motion.div>
                  ))}
                </div>
              );
            }}
          />
        </div>
      </div>

        </>
      )}

      {activeTeacherTab === "students" && (
        <TeacherStudentManagement teacherData={teacherData} toBengaliDigits={toBengaliDigits} />
      )}

      {activeTeacherTab === "routine" && (
        <div className="px-6 py-24 text-center animate-fade-in">
           <ClipboardList className="h-20 w-20 mx-auto text-emerald-100 mb-6" />
           <h3 className="text-2xl font-black text-emerald-950">রুটিন ও রেজাল্ট</h3>
           <p className="text-slate-500 font-bold">এই বিভাগটি শীঘ্রই আপডেট করা হবে।</p>
        </div>
      )}

      {activeTeacherTab === "others" && (
        <div className="px-4 -mt-24 relative z-10 max-w-lg mx-auto space-y-6 font-alinur pb-12">
          <TeacherLeaveSection teacherData={teacherData} toBengaliDigits={toBengaliDigits} />
        </div>
      )}

      {/* Fixed Bottom Menu Bar - Slim Glassmorphism */}
      <div className="fixed bottom-0 left-0 right-0 z-40 px-6 pb-4 pt-3 bg-emerald-950/90 backdrop-blur-2xl border-t border-white/10 flex items-center justify-around shadow-[0_-15px_40px_rgba(0,0,0,0.3)] rounded-t-[30px]">
         {[
          { id: "home", label: "হোম", icon: Home },
          { id: "students", label: "শিক্ষার্থী", icon: Users },
          { id: "routine", label: "রুটিন ও রেজাল্ট", icon: ClipboardList },
          { id: "others", label: "অন্যান্য", icon: Compass }
         ].map((tab) => {
           const isActive = activeTeacherTab === tab.id;
           return (
             <motion.button 
               key={tab.id} 
               whileTap={{ scale: 0.9 }}
               onClick={() => setActiveTeacherTab(tab.id)}
               className="flex flex-col items-center gap-0.5 group relative"
             >
               {isActive && (
                 <motion.div 
                   layoutId="activeTab"
                   className="absolute -top-1 w-1 h-1 bg-orange-400 rounded-full shadow-[0_0_8px_#fb923c]"
                 ></motion.div>
               )}
               <div className={`p-2 rounded-xl transition-all duration-300 ${
                 isActive 
                  ? "bg-gradient-to-br from-orange-400 to-orange-600 text-white shadow-lg shadow-orange-500/20 -translate-y-1" 
                  : "text-emerald-100/40 group-hover:text-emerald-50"
               }`}>
                 <tab.icon className="h-5 w-5" />
               </div>
               <span className={`text-[9px] font-black tracking-tight transition-all duration-300 ${
                 isActive ? "text-orange-400" : "text-emerald-100/30"
               }`}>{tab.label}</span>
             </motion.button>
           );
         })}
      </div>

      {/* Attendance History Modal */}
      <AnimatePresence>
        {showHistoryModal && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-md p-0 sm:p-4">
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="bg-white rounded-t-[40px] sm:rounded-[40px] p-8 max-w-lg w-full shadow-2xl relative overflow-hidden font-alinur h-[85vh] sm:h-auto sm:max-h-[80vh] flex flex-col"
            >
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-slate-200 rounded-full mt-3 sm:hidden"></div>
              
              <div className="flex items-center justify-between mb-8 mt-2 sm:mt-0">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center shadow-inner">
                    <History className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-emerald-950">উপস্থিতি বিবরণী</h3>
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Personal Attendance Logs</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowHistoryModal(false)}
                  className="p-2.5 bg-slate-100 rounded-2xl hover:bg-slate-200 transition-colors shadow-sm"
                >
                  <X className="h-6 w-6 text-slate-600" />
                </button>
              </div>

              {/* Date Filter */}
              <div className="bg-emerald-50/50 p-4 rounded-3xl border border-emerald-100 mb-6 flex items-center gap-4 group/search focus-within:ring-2 focus-within:ring-emerald-500 transition-all">
                <div className="h-10 w-10 bg-white rounded-2xl flex items-center justify-center text-emerald-600 shadow-sm">
                  <Search className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest block mb-0.5">তারিখ দিয়ে খুঁজুন</span>
                  <input 
                    type="date" 
                    value={historyFilterDate}
                    onChange={(e) => setHistoryFilterDate(e.target.value)}
                    className="w-full bg-transparent border-none outline-none text-sm font-black text-emerald-900"
                  />
                </div>
                {historyFilterDate && (
                  <button 
                    onClick={() => setHistoryFilterDate("")}
                    className="text-xs font-black text-rose-500 hover:bg-rose-50 px-2 py-1 rounded-lg"
                  >
                    মুছুন
                  </button>
                )}
              </div>

              <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                <StreamBuilder<any>
                  stream={query(
                    collection(db, "teacher_attendance"),
                    where("teacherId", "==", teacherData?.id || ""),
                    orderBy("date", "desc")
                  )}
                  builder={(history, loading) => {
                    if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-10 w-10 animate-spin text-emerald-600 opacity-20" /></div>;
                    
                    const filtered = history?.filter(h => !historyFilterDate || h.date === historyFilterDate) || [];
                    
                    if (filtered.length === 0) return (
                      <div className="text-center py-20 opacity-30 flex flex-col items-center">
                        <CalendarRange className="h-16 w-16 mb-4" />
                        <p className="font-black text-lg">কোনো তথ্য পাওয়া যায়নি</p>
                      </div>
                    );

                    return (
                      <div className="space-y-4">
                        {filtered.map((item, idx) => {
                          const dateObj = new Date(item.date);
                          const isFri = dateObj.getDay() === 5;
                          return (
                            <motion.div 
                              initial={{ x: -20, opacity: 0 }}
                              animate={{ x: 0, opacity: 1 }}
                              transition={{ delay: idx * 0.05 }}
                              key={item.id || idx} 
                              className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between group hover:border-emerald-200 transition-all"
                            >
                              <div className="flex items-center gap-4">
                                <div className={`h-12 w-12 rounded-2xl flex items-center justify-center font-black text-lg shadow-sm ${
                                  item.status === "Present" ? "bg-emerald-50 text-emerald-600" :
                                  item.status === "Pending" ? "bg-amber-50 text-amber-600" :
                                  "bg-rose-50 text-rose-600"
                                }`}>
                                  {toBengaliDigits(dateObj.getDate())}
                                </div>
                                <div>
                                  <p className="font-black text-emerald-950 text-sm">{dateObj.toLocaleDateString('bn-BD', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{dateObj.toLocaleDateString('bn-BD', { weekday: 'long' })}</p>
                                </div>
                              </div>
                              <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-2 border ${
                                item.status === "Present" ? "bg-emerald-600 text-white border-emerald-600 shadow-lg shadow-emerald-600/20" :
                                item.status === "Pending" ? "bg-amber-50 text-amber-700 border-amber-200" :
                                "bg-rose-50 text-rose-700 border-rose-200"
                              }`}>
                                {item.status === "Present" ? "উপস্থিত" : item.status === "Pending" ? "অপেক্ষমান" : "অনুপস্থিত"}
                                {item.status === "Present" && <CheckCircle2 className="h-3 w-3" />}
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    );
                  }}
                />
              </div>
              
              <div className="mt-6 pt-6 border-t border-slate-100 flex justify-center">
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">End of History</p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Notice Detail Modal */}
      <AnimatePresence>
        {showNoticeModal && selectedNotice && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white rounded-[32px] p-8 max-w-md w-full shadow-2xl relative overflow-hidden font-alinur"
            >
              <button 
                onClick={() => setShowNoticeModal(false)}
                className="absolute top-4 right-4 p-2 bg-slate-100 rounded-full hover:bg-slate-200 transition-colors"
              >
                <X className="h-5 w-5 text-slate-600" />
              </button>
              <div className="text-center mb-6">
                <div className="h-16 w-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Megaphone className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-black text-emerald-950">{selectedNotice.title}</h3>
              </div>
              <div className="bg-slate-50 p-6 rounded-2xl max-h-[50vh] overflow-y-auto">
                <p className="text-sm text-slate-700 leading-relaxed text-justify">
                  {selectedNotice.description}
                </p>
              </div>
              <div className="mt-6 flex justify-center">
                <button 
                   onClick={() => setShowNoticeModal(false)}
                   className="bg-emerald-800 text-white px-8 py-2.5 rounded-full font-bold text-sm shadow-lg shadow-emerald-900/20"
                >
                  বন্ধ করুন
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const AdminStudentManagement = ({ toBengaliDigits }: any) => {
  const [selectedClass, setSelectedClass] = useState("১০ম শ্রেণী");
  const classes = [
    "শিশু শ্রেণী", "১ম শ্রেণী", "২য় শ্রেণী", "৩য় শ্রেণী", "৪র্থ শ্রেণী", 
    "৫ম শ্রেণী", "৬ষ্ঠ শ্রেণী", "৭ম শ্রেণী", "৮ম শ্রেণী", "৯ম শ্রেণী", "১০ম শ্রেণী", "হিফজ বিভাগ"
  ];
  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div className="space-y-6 font-alinur animate-fade-in">
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
              <CalendarCheck className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-emerald-950 font-serif">শ্রেণীভিত্তিক হাজিরা স্ট্যাটাস</h3>
              <p className="text-xs text-gray-500">আজকের ({toBengaliDigits(todayStr)}) হাজিরা রিপোর্ট</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {classes.map(cls => (
            <div key={cls}>
              <StreamBuilder<any>
                stream={query(collection(db, "class_attendance_locks"), where("className", "==", cls), where("date", "==", todayStr), limit(1))}
                builder={(locks) => {
                const isDone = locks.length > 0;
                return (
                  <div className={`p-4 rounded-xl border transition-all ${isDone ? 'bg-emerald-50 border-emerald-200 shadow-sm' : 'bg-rose-50 border-rose-100 shadow-xs'}`}>
                    <div className="flex justify-between items-center">
                      <span className={`text-sm font-bold ${isDone ? 'text-emerald-900' : 'text-rose-900'}`}>{cls}</span>
                      {isDone ? (
                        <div className="bg-emerald-500 text-white p-1 rounded-full shadow-sm">
                          <Check className="h-3 w-3" />
                        </div>
                      ) : (
                        <div className="bg-rose-500 text-white p-1 rounded-full shadow-sm">
                          <X className="h-3 w-3" />
                        </div>
                      )}
                    </div>
                    <p className="text-[10px] font-bold mt-1 opacity-70">
                      {isDone ? `${locks[0].teacherName} হাজিরা নিয়েছেন` : "এখনও হাজিরা নেওয়া হয়নি"}
                    </p>
                  </div>
                );
              }}
            />
          </div>
          ))}
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-10 w-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-emerald-950 font-serif">শিক্ষার্থী হাজিরা বিবরণী</h3>
            <div className="flex items-center gap-2 mt-1">
              <select 
                value={selectedClass} 
                onChange={(e) => setSelectedClass(e.target.value)}
                className="text-[10px] font-bold bg-slate-50 border border-slate-200 rounded px-2 py-1 outline-none"
              >
                {classes.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-500 border-b">
                <th className="p-3 font-black">রোল</th>
                <th className="p-3 font-black">নাম</th>
                <th className="p-3 font-black">অবস্থা</th>
                <th className="p-3 font-black">শিক্ষক</th>
                <th className="p-3 font-black">সময়</th>
              </tr>
            </thead>
            <StreamBuilder<any>
              stream={query(collection(db, "attendance"), where("className", "==", selectedClass), where("date", "==", todayStr), orderBy("studentRoll"))}
              builder={(attendance) => (
                <tbody className="divide-y divide-slate-100">
                  {attendance.length === 0 ? (
                    <tr><td colSpan={5} className="p-8 text-center text-slate-400 font-bold">আজকের কোনো ডাটা পাওয়া যায়নি।</td></tr>
                  ) : (
                    attendance.map((item: any) => (
                      <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-3 font-black text-emerald-950">{toBengaliDigits(item.studentRoll)}</td>
                        <td className="p-3 font-bold text-slate-700">{item.studentName || "শিক্ষার্থী"}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                            item.status === "Present" ? "bg-emerald-100 text-emerald-700" :
                            item.status === "Absent" ? "bg-rose-100 text-rose-700" : "bg-amber-100 text-amber-700"
                          }`}>
                            {item.status === "Present" ? "উপস্থিত" : item.status === "Absent" ? "অনুপস্থিত" : item.status}
                          </span>
                        </td>
                        <td className="p-3 text-slate-500">{item.teacherName}</td>
                        <td className="p-3 text-slate-400 font-mono">
                          {item.timestamp?.toMillis ? new Date(item.timestamp.toMillis()).toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' }) : "---"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              )}
            />
          </table>
        </div>
      </div>
    </div>
  );
};

const AdminLeaveManagement = ({ activeTab = "teacher", toBengaliDigits }: any) => {
  const [subTab, setSubTab] = useState<"teacher" | "student">(
    activeTab === "student" ? "student" : "teacher"
  );
  const [statusFilter, setStatusFilter] = useState<"all" | "Pending" | "Approved" | "Rejected">("all");

  // Action Modal State
  const [selectedLeave, setSelectedLeave] = useState<any>(null);
  const [actionType, setActionType] = useState<"approve" | "reject">("approve");
  const [adminNoteInput, setAdminNoteInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync subTab if prop changes
  useEffect(() => {
    if (activeTab === "student" || activeTab === "teacher") {
      setSubTab(activeTab);
    }
  }, [activeTab]);

  const handleOpenActionModal = (leaveDoc: any, type: "approve" | "reject") => {
    setSelectedLeave(leaveDoc);
    setActionType(type);
    setAdminNoteInput(leaveDoc.admin_note || leaveDoc.adminNote || "");
  };

  const handleConfirmAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLeave) return;

    setIsSubmitting(true);
    try {
      const targetStatus = actionType === "approve" ? "Approved" : "Rejected";
      const collectionName = selectedLeave.collectionName || (subTab === "teacher" ? "teacher_leaves" : "leaves");

      await updateDoc(doc(db, collectionName, selectedLeave.id), {
        status: targetStatus,
        admin_note: adminNoteInput.trim(),
        adminNote: adminNoteInput.trim(),
        adminHandledAt: serverTimestamp()
      });

      alert(
        actionType === "approve"
          ? "আবেদন সফলভাবে গ্রহণ/অনুমোদন করা হয়েছে।"
          : "আবেদন সফলভাবে বাতিল করা হয়েছে।"
      );
      setSelectedLeave(null);
      setAdminNoteInput("");
    } catch (error) {
      console.error("Error updating leave action:", error);
      alert("সিদ্ধান্ত আপডেট করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper to calculate total leave days
  const calculateDays = (start: string, end: string) => {
    if (!start || !end) return 1;
    try {
      const s = new Date(start);
      const e = new Date(end);
      const diffTime = e.getTime() - s.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      return diffDays > 0 ? diffDays : 1;
    } catch {
      return 1;
    }
  };

  return (
    <div className="space-y-6 font-alinur animate-fade-in">
      {/* Sub-menu Toggle Tabs */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSubTab("teacher")}
            className={`px-5 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 ${
              subTab === "teacher"
                ? "bg-emerald-800 text-white shadow-md shadow-emerald-900/20"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            <GraduationCap className="h-4 w-4 text-amber-400" />
            <span>শিক্ষক ছুটির আবেদন</span>
          </button>

          <button
            onClick={() => setSubTab("student")}
            className={`px-5 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 ${
              subTab === "student"
                ? "bg-emerald-800 text-white shadow-md shadow-emerald-900/20"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            <Users className="h-4 w-4 text-amber-400" />
            <span>শিক্ষার্থী ছুটির আবেদন</span>
          </button>
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-bold">
          {(["all", "Pending", "Approved", "Rejected"] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                statusFilter === st
                  ? "bg-white text-emerald-950 shadow-xs font-black"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              {st === "all" ? "সকল" : st === "Pending" ? "পেন্ডিং" : st === "Approved" ? "অনুমোদিত" : "বাতিলকৃত"}
            </button>
          ))}
        </div>
      </div>

      {/* Main Leave List Section */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
          <div className="h-10 w-10 bg-emerald-50 text-emerald-700 rounded-xl flex items-center justify-center border border-emerald-100">
            <ClipboardList className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-emerald-950 font-serif">
              {subTab === "teacher" ? "শিক্ষক ছুটির আবেদনসমূহ" : "শিক্ষার্থী ছুটির আবেদনসমূহ"}
            </h3>
            <p className="text-xs text-slate-500">
              {subTab === "teacher"
                ? "শিক্ষকদের জমাকৃত সকল ছুটির আবেদন ও পর্যালোচনা"
                : "শিক্ষার্থীদের পাঠানো সকল ছুটির আবেদন ও পর্যালোচনা"}
            </p>
          </div>
        </div>

        {/* StreamBuilder for Data */}
        <StreamBuilder<any>
          stream={
            subTab === "teacher"
              ? query(collection(db, "teacher_leaves"), orderBy("createdAt", "desc"))
              : query(collection(db, "leaves"), orderBy("createdAt", "desc"))
          }
          builder={(allLeaves) => {
            let displayLeaves = allLeaves;

            // Filter for student vs teacher if in leaves collection
            if (subTab === "teacher") {
              displayLeaves = displayLeaves.filter((l: any) => l.applicantType === "teacher" || l.teacherName || l.designation);
            } else {
              displayLeaves = displayLeaves.filter((l: any) => l.applicantType !== "teacher");
            }

            // Apply status filter
            if (statusFilter !== "all") {
              displayLeaves = displayLeaves.filter((l: any) => {
                const s = l.status || "Pending";
                if (statusFilter === "Pending") return s === "Pending" || s === "pending";
                if (statusFilter === "Approved") return s === "Approved" || s === "approved";
                if (statusFilter === "Rejected") return s === "Rejected" || s === "rejected";
                return true;
              });
            }

            if (displayLeaves.length === 0) {
              return (
                <div className="text-center py-12 opacity-50 space-y-2">
                  <ClipboardList className="h-16 w-16 mx-auto text-slate-400" />
                  <p className="font-bold text-slate-600">কোনো ছুটির আবেদন পাওয়া যায়নি</p>
                  <p className="text-xs text-slate-400">ফিল্টার পরিবর্তন করে চেক করুন</p>
                </div>
              );
            }

            return (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {displayLeaves.map((l: any) => {
                  const isApproved = l.status === "Approved" || l.status === "approved";
                  const isRejected = l.status === "Rejected" || l.status === "rejected";
                  const isPending = !isApproved && !isRejected;
                  const daysCount = l.totalDays || calculateDays(l.startDate, l.endDate);

                  return (
                    <div
                      key={l.id}
                      className="bg-slate-50/90 border border-slate-200 rounded-2xl p-5 space-y-4 hover:border-emerald-300 transition-all shadow-2xs relative"
                    >
                      {/* Card Header */}
                      <div className="flex justify-between items-start gap-3">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 bg-emerald-100/60 rounded-xl flex items-center justify-center text-emerald-800 font-black text-sm">
                            {subTab === "teacher" ? <GraduationCap className="h-5 w-5" /> : <User className="h-5 w-5" />}
                          </div>
                          <div>
                            <h4 className="font-black text-emerald-950 text-sm">
                              {l.teacherName || l.studentName || l.applicantName || "আবেদনকারী"}
                            </h4>
                            <p className="text-xs text-slate-500 font-bold mt-0.5">
                              {subTab === "teacher" ? (
                                <span>{l.designation || l.teacherDesignation || "শিক্ষক"}</span>
                              ) : (
                                <span>{l.className || "শ্রেণী"} • রোল: {toBengaliDigits(l.studentRoll || l.roll || "---")}</span>
                              )}
                            </p>
                          </div>
                        </div>

                        {/* Status Badge */}
                        <div>
                          {isApproved && (
                            <span className="text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200 px-2.5 py-1 rounded-full uppercase flex items-center gap-1">
                              <CheckCircle2 className="h-3 w-3 text-emerald-600" /> গ্রহণকৃত
                            </span>
                          )}
                          {isRejected && (
                            <span className="text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-200 px-2.5 py-1 rounded-full uppercase flex items-center gap-1">
                              <XCircle className="h-3 w-3 text-rose-600" /> বাতিলকৃত
                            </span>
                          )}
                          {isPending && (
                            <span className="text-[10px] font-black bg-amber-100 text-amber-800 border border-amber-200 px-2.5 py-1 rounded-full uppercase flex items-center gap-1">
                              <Clock className="h-3 w-3 text-amber-600" /> পেন্ডিং
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Date Range & Total Days */}
                      <div className="bg-white p-3 rounded-xl border border-slate-200/80 flex items-center justify-between text-xs font-bold text-slate-700">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-4 w-4 text-emerald-600" />
                          <span>{toBengaliDigits(l.startDate)} থেকে {toBengaliDigits(l.endDate)}</span>
                        </div>
                        <span className="bg-emerald-50 text-emerald-800 px-2.5 py-0.5 rounded-md text-[11px] font-black">
                          {toBengaliDigits(daysCount)} দিন
                        </span>
                      </div>

                      {/* Reason */}
                      <div className="bg-white p-3 rounded-xl border border-slate-200/80 space-y-1">
                        <p className="text-[10px] text-slate-400 uppercase font-black tracking-wide">ছুটির বিস্তারিত কারণ</p>
                        <p className="text-xs font-bold text-slate-700 leading-relaxed">{l.reason || "কোনো বিবরণ প্রদান করা হয়নি।"}</p>
                      </div>

                      {/* Admin Note if present */}
                      {(l.admin_note || l.adminNote) && (
                        <div className="bg-amber-50/80 border border-amber-200/60 p-3 rounded-xl space-y-0.5 text-xs">
                          <p className="text-[10px] text-amber-800 uppercase font-black tracking-wide">অ্যাডমিন নোট / সিদ্ধান্ত কারণ</p>
                          <p className="font-bold text-amber-950">{l.admin_note || l.adminNote}</p>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex gap-2 pt-2 border-t border-slate-200/60">
                        <button
                          onClick={() => handleOpenActionModal({ ...l, collectionName: subTab === "teacher" ? "teacher_leaves" : "leaves" }, "approve")}
                          className="flex-1 bg-emerald-800 hover:bg-emerald-950 text-white py-2.5 rounded-xl text-xs font-black shadow-xs active:scale-95 transition-all flex items-center justify-center gap-1.5"
                        >
                          <Check className="h-4 w-4 text-amber-400" />
                          <span>গ্রহণ করুন</span>
                        </button>
                        <button
                          onClick={() => handleOpenActionModal({ ...l, collectionName: subTab === "teacher" ? "teacher_leaves" : "leaves" }, "reject")}
                          className="flex-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 py-2.5 rounded-xl text-xs font-black shadow-xs active:scale-95 transition-all flex items-center justify-center gap-1.5"
                        >
                          <X className="h-4 w-4 text-rose-600" />
                          <span>বাতিল করুন</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          }}
        />
      </div>

      {/* Action Modal (কাস্টম পপআপ ডায়ালগ for Reason/Note) */}
      {selectedLeave && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 font-alinur animate-fade-in">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-5 relative"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div
                  className={`h-11 w-11 rounded-2xl flex items-center justify-center border ${
                    actionType === "approve"
                      ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                      : "bg-rose-50 text-rose-700 border-rose-100"
                  }`}
                >
                  {actionType === "approve" ? <CheckCircle2 className="h-6 w-6" /> : <XCircle className="h-6 w-6" />}
                </div>
                <div>
                  <h3 className="font-black text-base text-emerald-950">
                    {actionType === "approve" ? "ছুটি গ্রহণ ও অনুমোদন সিদ্ধান্ত" : "ছুটির আবেদন বাতিল সিদ্ধান্ত"}
                  </h3>
                  <p className="text-xs text-slate-500 font-bold">
                    {selectedLeave.teacherName || selectedLeave.studentName || selectedLeave.applicantName || "আবেদনকারী"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedLeave(null)}
                className="h-8 w-8 bg-slate-100 hover:bg-slate-200 rounded-full flex items-center justify-center text-slate-500 transition-all"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Leave Details Summary Box */}
            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 space-y-1.5 text-xs font-bold text-slate-700">
              <div className="flex justify-between">
                <span className="text-slate-400">আবেদনের তারিখ:</span>
                <span>{toBengaliDigits(selectedLeave.startDate)} থেকে {toBengaliDigits(selectedLeave.endDate)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">মোট দিন:</span>
                <span className="text-emerald-800">{toBengaliDigits(selectedLeave.totalDays || calculateDays(selectedLeave.startDate, selectedLeave.endDate))} দিন</span>
              </div>
              <div className="pt-1 border-t border-slate-200/60">
                <span className="text-slate-400 block text-[10px] uppercase">আবেদনের কারণ:</span>
                <p className="text-slate-800 text-xs font-bold mt-0.5">{selectedLeave.reason || "---"}</p>
              </div>
            </div>

            {/* Reason/Note Input Form */}
            <form onSubmit={handleConfirmAction} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-800 block">
                  সিদ্ধান্ত গ্রহণের নির্দিষ্ট কারণ বা অ্যাডমিন মন্তব্য (Reason/Note):
                </label>
                <textarea
                  required
                  rows={3}
                  value={adminNoteInput}
                  onChange={(e) => setAdminNoteInput(e.target.value)}
                  placeholder="যেমন: আবেদন গ্রহণযোগ্য বিবেচিত হয়েছে / তথ্যের অমিলের কারণে বাতিল..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs font-bold focus:bg-white focus:ring-2 focus:ring-emerald-600 focus:border-transparent outline-none transition-all"
                />
              </div>

              {/* Modal Buttons */}
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedLeave(null)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 rounded-xl text-xs font-black transition-all"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`flex-1 text-white py-3 rounded-xl text-xs font-black shadow-md transition-all flex items-center justify-center gap-2 ${
                    actionType === "approve"
                      ? "bg-emerald-800 hover:bg-emerald-950 shadow-emerald-900/20"
                      : "bg-rose-600 hover:bg-rose-700 shadow-rose-900/20"
                  }`}
                >
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : actionType === "approve" ? (
                    <span>অনুমোদন নিশ্চিত করুন</span>
                  ) : (
                    <span>বাতিল নিশ্চিত করুন</span>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

const AdminAttendanceSection = ({ toBengaliDigits }: any) => {
  const [activeSubView, setActiveSubView] = useState<"pending" | "history">("pending");
  const todayStr = new Date().toISOString().split('T')[0];

  const pendingQuery = useMemo(() => query(
    collection(db, "teacher_attendance"),
    where("date", "==", todayStr),
    where("status", "==", "Pending")
  ), [todayStr]);

  const allTodayQuery = useMemo(() => query(
    collection(db, "teacher_attendance"),
    where("date", "==", todayStr)
  ), [todayStr]);

  const handleUpdateStatus = async (id: string, status: "Present" | "Absent") => {
    try {
      await updateDoc(doc(db, "teacher_attendance", id), { status });
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  return (
    <div className="space-y-6 font-alinur">
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-2">
        <button 
          onClick={() => setActiveSubView("pending")}
          className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${activeSubView === "pending" ? "bg-emerald-800 text-white shadow-lg shadow-emerald-900/20" : "bg-slate-50 text-slate-500 hover:bg-slate-100"}`}
        >
          <CalendarCheck className="h-4 w-4" />
          আজকের হাজিরা রিকোয়েস্ট
        </button>
        <button 
          onClick={() => setActiveSubView("history")}
          className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${activeSubView === "history" ? "bg-emerald-800 text-white shadow-lg shadow-emerald-900/20" : "bg-slate-50 text-slate-500 hover:bg-slate-100"}`}
        >
          <CalendarRange className="h-4 w-4" />
          হাজিরা হিস্ট্রি ও রিপোর্ট
        </button>
      </div>

      {activeSubView === "pending" ? (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
            <h4 className="font-black text-lg text-emerald-950 mb-4 flex items-center gap-2">
              <Clock className="h-5 w-5 text-amber-500" />
              পেন্ডিং হাজিরা লিস্ট
            </h4>
            <StreamBuilder
              stream={pendingQuery}
              builder={(list: any[]) => {
                if (list.length === 0) return (
                  <div className="text-center py-12 space-y-3">
                    <div className="h-16 w-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto text-emerald-600">
                      <CheckCircle2 className="h-8 w-8" />
                    </div>
                    <p className="text-sm text-slate-400 font-bold">কোনো পেন্ডিং রিকোয়েস্ট নেই</p>
                  </div>
                );
                return (
                  <div className="grid gap-4">
                    {list.map((item) => (
                      <div key={item.id} className="flex flex-col sm:flex-row items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 gap-4 group hover:bg-white hover:shadow-md transition-all">
                        <div className="flex items-center gap-3">
                          <img src={item.teacherPhoto} className="h-12 w-12 rounded-full object-cover border-2 border-white shadow-sm" referrerPolicy="no-referrer" />
                          <div>
                            <h5 className="font-bold text-emerald-900">{item.teacherName}</h5>
                            <p className="text-[10px] text-slate-500 font-bold">{item.teacherDesignation}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                          <button 
                            onClick={() => handleUpdateStatus(item.id, "Present")}
                            className="flex-1 sm:flex-none bg-emerald-600 text-white px-5 py-2.5 rounded-xl text-xs font-black hover:bg-emerald-700 transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-600/10"
                          >
                            <CheckCircle2 className="h-4 w-4" />
                            উপস্থিত
                          </button>
                          <button 
                            onClick={() => handleUpdateStatus(item.id, "Absent")}
                            className="flex-1 sm:flex-none bg-rose-500 text-white px-5 py-2.5 rounded-xl text-xs font-black hover:bg-rose-600 transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-rose-500/10"
                          >
                            <XCircle className="h-4 w-4" />
                            অনুপস্থিত
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              }}
            />
          </div>

          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
             <h4 className="font-black text-lg text-emerald-950 mb-6 flex items-center gap-2">
              <Users className="h-5 w-5 text-indigo-500" />
              আজকের হাজিরার সারসংক্ষেপ
            </h4>
            <StreamBuilder
              stream={query(collection(db, "teachers"))}
              builder={(teachers: any[]) => (
                <StreamBuilder
                  stream={allTodayQuery}
                  builder={(todayAttendance: any[]) => {
                    const requestedIds = todayAttendance.map(a => a.teacherId);
                    const notRequested = teachers.filter(t => !requestedIds.includes(t.id));
                    const requested = teachers.filter(t => requestedIds.includes(t.id));

                    return (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                          <div className="flex items-center justify-between border-b border-emerald-100 pb-2">
                            <h5 className="text-xs font-black text-emerald-600 uppercase tracking-widest flex items-center gap-2">
                              <span className="h-2 w-2 bg-emerald-500 rounded-full animate-pulse"></span>
                              রিকোয়েস্ট দিয়েছে ({toBengaliDigits(requested.length)})
                            </h5>
                          </div>
                          <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                            {requested.length === 0 ? (
                               <p className="text-[10px] text-slate-400 text-center py-4">এখনও কেউ রিকোয়েস্ট দেয়নি</p>
                            ) : requested.map(t => {
                               const att = todayAttendance.find(a => a.teacherId === t.id);
                               return (
                                <div key={t.id} className="flex items-center justify-between p-3 bg-emerald-50/30 rounded-xl transition-all border border-emerald-50">
                                  <span className="text-xs font-bold text-emerald-950">{t.name}</span>
                                  <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border ${
                                    att?.status === "Present" ? "bg-emerald-100 text-emerald-700 border-emerald-200" :
                                    att?.status === "Absent" ? "bg-rose-100 text-rose-700 border-rose-200" :
                                    "bg-amber-100 text-amber-700 border-amber-200"
                                  }`}>
                                    {att?.status === "Present" ? "উপস্থিত" : att?.status === "Absent" ? "অনুপস্থিত" : "পেন্ডিং"}
                                  </span>
                                </div>
                               );
                            })}
                          </div>
                        </div>
                        <div className="space-y-4">
                           <div className="flex items-center justify-between border-b border-rose-100 pb-2">
                            <h5 className="text-xs font-black text-rose-600 uppercase tracking-widest flex items-center gap-2">
                              <span className="h-2 w-2 bg-rose-500 rounded-full animate-pulse"></span>
                              রিকোয়েস্ট দেয়নি ({toBengaliDigits(notRequested.length)})
                            </h5>
                          </div>
                           <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                            {notRequested.length === 0 ? (
                               <p className="text-[10px] text-slate-400 text-center py-4">সবাই রিকোয়েস্ট পাঠিয়েছে</p>
                            ) : notRequested.map(t => (
                              <div key={t.id} className="flex items-center justify-between p-3 bg-rose-50/30 rounded-xl transition-all border border-rose-50">
                                <span className="text-xs font-bold text-slate-700">{t.name}</span>
                                <span className="text-[9px] font-black bg-rose-50 text-rose-600 px-2 py-0.5 rounded-full border border-rose-100">Not Sent</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  }}
                />
              )}
            />
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 overflow-hidden">
           <div className="flex items-center justify-between mb-8">
            <h4 className="font-black text-lg text-emerald-950 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-emerald-600" />
              শিক্ষক হাজিরা হিস্ট্রি ও রিপোর্ট
            </h4>
            <div className="bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
               <span className="text-[10px] font-black text-emerald-700 uppercase">বিগত ১ বছর</span>
            </div>
          </div>
          <StreamBuilder
            stream={query(collection(db, "teachers"))}
            builder={(teachers: any[]) => (
              <StreamBuilder
                stream={query(collection(db, "teacher_attendance"), where("status", "==", "Present"))}
                builder={(allPresents: any[]) => {
                    const reports = (teachers || []).map(t => {
                    const teacherPresents = (allPresents || []).filter(p => p.teacherId === t.id);
                    // Standard working days in a year roughly 280-300
                    const totalWorkingDays = 300; 
                    const count = teacherPresents.length || 0;
                    const percentage = Math.round((count / totalWorkingDays) * 100) || 0;
                    return { ...t, percentage, count };
                  }).sort((a, b) => b.percentage - a.percentage);

                  return (
                    <div className="overflow-x-auto -mx-6 px-6">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="border-b border-slate-50">
                            <th className="pb-4 font-black text-slate-400 text-[10px] uppercase tracking-widest">শিক্ষক প্রোফাইল</th>
                            <th className="pb-4 font-black text-slate-400 text-[10px] uppercase tracking-widest text-center">মোট উপস্থিতি</th>
                            <th className="pb-4 font-black text-slate-400 text-[10px] uppercase tracking-widest text-right">পারসেন্টেজ (%)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {reports.map((r) => (
                            <tr key={r.id} className="hover:bg-emerald-50/30 transition-all group">
                              <td className="py-4">
                                <div className="flex items-center gap-3">
                                   <div className="relative">
                                      <img 
                                        src={r.photoUrl || "https://ui-avatars.com/api/?name=" + encodeURIComponent(r.name || "Teacher")} 
                                        className="h-10 w-10 rounded-full object-cover border-2 border-white shadow-sm bg-slate-100" 
                                        referrerPolicy="no-referrer" 
                                        onError={(e: any) => e.target.src = "https://ui-avatars.com/api/?name=" + encodeURIComponent(r.name || "Teacher")}
                                      />
                                      {(r.percentage || 0) >= 90 && (
                                        <div className="absolute -top-1 -right-1 bg-amber-400 rounded-full p-0.5 border border-white">
                                          <Award className="h-2 w-2 text-white" />
                                        </div>
                                      )}
                                   </div>
                                   <div>
                                      <span className="font-black text-emerald-950 text-sm block">{r.name || "অজানা শিক্ষক"}</span>
                                      <span className="text-[10px] text-slate-400 font-bold">{r.designation || "পদবিহীন"}</span>
                                   </div>
                                </div>
                              </td>
                              <td className="py-4 text-center">
                                 <span className="font-black text-emerald-800 text-sm bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-100">
                                   {toBengaliDigits(r.count || 0)} দিন
                                 </span>
                              </td>
                              <td className="py-4 text-right">
                                <div className="flex flex-col items-end gap-1">
                                  <span className={`text-base font-black ${(r.percentage || 0) < 50 ? "text-rose-600" : "text-emerald-700"}`}>
                                    {toBengaliDigits(r.percentage || 0)}%
                                  </span>
                                  {(r.percentage || 0) < 50 && (
                                    <span className="text-[8px] font-black bg-rose-100 text-rose-600 px-1.5 py-0.5 rounded animate-pulse">Low Attendance</span>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  );
                }}
              />
            )}
          />
        </div>
      )}
    </div>
  );
};

export default function DashboardSection({ user, setUser, setActiveTab }: DashboardSectionProps) {
  const [activeAdminSubTab, setActiveAdminSubTab] = useState<string>("dashboard");
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [selectedClass, setSelectedClass] = useState<string>("All");
  
  // Student Dashboard state variables
  const [studentActiveTab, setStudentActiveTab] = useState<"home" | "homework" | "features" | "support">("home");
  const [supportSubject, setSupportSubject] = useState("");
  const [supportMessage, setSupportMessage] = useState("");
  const [isSubmittingSupport, setIsSubmittingSupport] = useState(false);
  const [supportSuccess, setSupportSuccess] = useState(false);
  
  // Real-time collections state
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [stories, setStories] = useState<SuccessStory[]>([]);
  const [committee, setCommittee] = useState<CommitteeMember[]>([]);
  const [honored, setHonored] = useState<HonoredPerson[]>([]);
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [admissions, setAdmissions] = useState<AdmissionForm[]>([]);
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);
  const [websiteLogoUrl, setWebsiteLogoUrl] = useState("");
  const [logoSaveSuccess, setLogoSaveSuccess] = useState(false);

  // Hero Dropdown, Settings Dropdown and Notice states
  const [isHeroDropdownOpen, setIsHeroDropdownOpen] = useState(false);
  const [isNoticeDropdownOpen, setIsNoticeDropdownOpen] = useState(false);
  const [isSettingsDropdownOpen, setIsSettingsDropdownOpen] = useState(false);
  const [isMenuBarDropdownOpen, setIsMenuBarDropdownOpen] = useState(false);
  const [isHomepageDropdownOpen, setIsHomepageDropdownOpen] = useState(false);
  const [isStudentMgmtDropdownOpen, setIsStudentMgmtDropdownOpen] = useState(false);
  const [isLeaveDropdownOpen, setIsLeaveDropdownOpen] = useState(false);
  const [newNoticeText, setNewNoticeText] = useState("");
  const [teacherNoticeTitle, setTeacherNoticeTitle] = useState("");
  const [teacherNoticeDescription, setTeacherNoticeDescription] = useState("");
  const [isNoticeUploading, setIsNoticeUploading] = useState(false);

  // Public Notice state
  const [publicNoticeTitle, setPublicNoticeTitle] = useState("");
  const [publicNoticeDescription, setPublicNoticeDescription] = useState("");
  const [editingPublicNoticeId, setEditingPublicNoticeId] = useState<string | null>(null);
  const [isPublicNoticeUploading, setIsPublicNoticeUploading] = useState(false);
  const [publicNoticeTitleError, setPublicNoticeTitleError] = useState("");
  const [publicNoticeDescriptionError, setPublicNoticeDescriptionError] = useState("");
  const [isPublicNoticeFormOpen, setIsPublicNoticeFormOpen] = useState(false);

  // Notice Editing Modal state
  const [editNoticeType, setEditNoticeType] = useState<"running" | "public" | "teacher" | null>(null);
  const [editNoticeId, setEditNoticeId] = useState<string | null>(null);
  const [editNoticeText, setEditNoticeText] = useState("");
  const [editNoticeTitle, setEditNoticeTitle] = useState("");
  const [editNoticeDescription, setEditNoticeDescription] = useState("");
  const [isEditNoticeSaving, setIsEditNoticeSaving] = useState(false);

  // Contact update inputs state (should start empty as per instructions)
  const [contactAddressInput, setContactAddressInput] = useState("");
  const [contactOfficePhoneInput, setContactOfficePhoneInput] = useState("");
  const [contactPrincipalPhoneInput, setContactPrincipalPhoneInput] = useState("");
  const [contactEmailInput, setContactEmailInput] = useState("");
  const [contactFacebookInput, setContactFacebookInput] = useState("");
  const [contactLinkedinInput, setContactLinkedinInput] = useState("");
  const [contactTelegramInput, setContactTelegramInput] = useState("");
  const [contactWhatsappInput, setContactWhatsappInput] = useState("");
  const [isUpdatingContact, setIsUpdatingContact] = useState(false);
  const [contactSaveSuccess, setContactSaveSuccess] = useState(false);

  // Hero background state
  const [heroBgUrl, setHeroBgUrl] = useState("");
  const [heroBgSaveSuccess, setHeroBgSaveSuccess] = useState(false);
  const [isUploadingHeroBg, setIsUploadingHeroBg] = useState(false);
  const [heroBgError, setHeroBgError] = useState("");

  // Modals / Form inputs states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form Fields (shared between entities for simplicity)
  const [field1, setField1] = useState("");
  const [field2, setField2] = useState("");
  const [field3, setField3] = useState("");
  const [field4, setField4] = useState("");
  const [field5, setField5] = useState("");
  const [field6, setField6] = useState("");
  const [isPhoneDuplicate, setIsPhoneDuplicate] = useState(false);
  const [duplicateUserInfo, setDuplicateUserInfo] = useState<{ name: string; id: string } | null>(null);
  const [isCheckingPhone, setIsCheckingPhone] = useState(false);

  // Extra Fields for Committee Bio-Data (Required empty defaults)
  const [commJoiningDate, setCommJoiningDate] = useState("");
  const [commBirthDate, setCommBirthDate] = useState("");
  const [commBloodGroup, setCommBloodGroup] = useState("");
  const [commQualification, setCommQualification] = useState("");
  const [commPhone, setCommPhone] = useState("");
  const [commEmail, setCommEmail] = useState("");
  const [commAddress, setCommAddress] = useState("");
  const [commFacebook, setCommFacebook] = useState("");
  const [commWhatsapp, setCommWhatsapp] = useState("");
  const [commPhoneNum, setCommPhoneNum] = useState("");

  // Crop states
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [cropZoom, setCropZoom] = useState<number>(1);
  const [cropX, setCropX] = useState<number>(0);
  const [cropY, setCropY] = useState<number>(0);
  const [cropFile, setCropFile] = useState<File | null>(null);
  const [cropFieldSetter, setCropFieldSetter] = useState<((val: string) => void) | null>(null);

  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [isMainLogoUploaded, setIsMainLogoUploaded] = useState(false);
  const [isContactLogoUploaded, setIsContactLogoUploaded] = useState(false);
  const [showLogoSuccessPopup, setShowLogoSuccessPopup] = useState(false);

  // Admissions Sub-Views States
  const [admissionView, setAdmissionView] = useState<"list" | "detail" | "config">("list");
  const [selectedAdmissionId, setSelectedAdmissionId] = useState<string | null>(null);
  const [selectedAdmission, setSelectedAdmission] = useState<any | null>(null);
  const [configAdmission, setConfigAdmission] = useState<any | null>(null);
  const [accountLoginId, setAccountLoginId] = useState("");
  const [accountLoginIdStatus, setAccountLoginIdStatus] = useState<{status: 'idle' | 'checking' | 'unique' | 'duplicate', duplicateInfo: any | null}>({status: 'idle', duplicateInfo: null});
  const [accountPassword, setAccountPassword] = useState("");
  const [selectedRoll, setSelectedRoll] = useState("");
  const [duplicateStudentName, setDuplicateStudentName] = useState("");
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [showStudentDetailsModal, setShowStudentDetailsModal] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isUploadingProfile, setIsUploadingProfile] = useState(false);
  const [selectedHomework, setSelectedHomework] = useState<any | null>(null);
  const [showHomeworkDetailModal, setShowHomeworkDetailModal] = useState(false);
  const [isConfigSaving, setIsConfigSaving] = useState(false);
  const [configError, setConfigError] = useState("");

  // Rejection Reason Popup States
  const [rejectionAdmission, setRejectionAdmission] = useState<any | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isRejectionSaving, setIsRejectionSaving] = useState(false);
  const [showRejectionModal, setShowRejectionModal] = useState(false);

  // Stable Firestore Queries for StreamBuilder
  const studentsQuery = useMemo(() => query(collection(db, "students")), []);
  const settingsQuery = useMemo(() => query(collection(db, "settings")), []);
  const admissionsQuery = useMemo(() => query(collection(db, "admissions")), []);
  const teachersQuery = useMemo(() => query(collection(db, "teachers")), []);
  const employeesQuery = useMemo(() => query(collection(db, "employees")), []);
  const honoredQuery = useMemo(() => query(collection(db, "honored_persons")), []);
  const runningNoticesQuery = useMemo(() => query(collection(db, "running_notices"), orderBy("createdAt", "desc")), []);
  const messagesQuery = useMemo(() => query(collection(db, "messages"), orderBy("date", "desc")), []);
  const admissionsOrderedQuery = useMemo(() => query(collection(db, "admissions"), orderBy("date", "desc")), []);
  const routinesQuery = useMemo(() => query(collection(db, "routines")), []);
  const teacherNoticesQuery = useMemo(() => query(collection(db, "teacher_notices"), orderBy("timestamp", "desc")), []);
  const noticesQuery = useMemo(() => query(collection(db, "notices"), orderBy("timestamp", "desc")), []);
  const brandingDocQuery = useMemo(() => query(collection(db, "settings")), []); // Fallback for settings branding
  const homeSettingsQuery = useMemo(() => query(collection(db, "settings")), []);

  // Dedicated class routines form states
  const [routineClassInput, setRoutineClassInput] = useState("");
  const [routineDayInput, setRoutineDayInput] = useState("");
  const [routineSubjects, setRoutineSubjects] = useState<Array<{
    subject: string;
    time: string;
    teacherName: string;
    room: string;
  }>>([{ subject: "", time: "", teacherName: "", room: "" }]);

  const [routineClassError, setRoutineClassError] = useState("");
  const [routineDayError, setRoutineDayError] = useState("");
  const [rowValidationErrors, setRowValidationErrors] = useState<Array<{
    subject?: string;
    time?: string;
    teacherName?: string;
  }>>([]);

  const [editingRoutineId, setEditingRoutineId] = useState<string | null>(null);
  const [isRoutineFormOpen, setIsRoutineFormOpen] = useState(false);
  const [activeRoutineSubMenu, setActiveRoutineSubMenu] = useState("class_routine");
  const [routineSaveSuccess, setRoutineSaveSuccess] = useState(false);

  // Exam Routine Form states
  const [examNameInput, setExamNameInput] = useState("");
  const [examClassInput, setExamClassInput] = useState("");
  const [examGuidelinesInput, setExamGuidelinesInput] = useState<string[]>([""]);
  const [examSubjects, setExamSubjects] = useState<Array<{
    date: string;
    subject: string;
    time: string;
    totalMarks: string;
    subjectCode: string;
  }>>([{ date: "", subject: "", time: "", totalMarks: "", subjectCode: "" }]);

  const [isExamFormOpen, setIsExamFormOpen] = useState(false);
  const [editingExamId, setEditingExamId] = useState<string | null>(null);
  const [examSaveSuccess, setExamSaveSuccess] = useState(false);
  const [examClassError, setExamClassError] = useState("");
  const [examNameError, setExamNameError] = useState("");
  const [rowExamValidationErrors, setRowExamValidationErrors] = useState<Array<{
    date?: string;
    subject?: string;
    time?: string;
    totalMarks?: string;
    subjectCode?: string;
  }>>([]);

  const handleSaveExamRoutine = async (e: React.FormEvent) => {
    e.preventDefault();

    let isValid = true;
    if (!examClassInput.trim()) {
      setExamClassError("অনুগ্রহ করে একটি ক্লাস সিলেক্ট বা ইনপুট করুন");
      isValid = false;
    } else {
      setExamClassError("");
    }
    if (!examNameInput.trim()) {
      setExamNameError("অনুগ্রহ করে পরীক্ষার নাম লিখুন (যেমন: অর্ধ-বার্ষিক পরীক্ষা)");
      isValid = false;
    } else {
      setExamNameError("");
    }

    const errors: Array<{ date?: string; subject?: string; time?: string; totalMarks?: string; subjectCode?: string }> = [];
    let hasRowErrors = false;
    examSubjects.forEach((row, idx) => {
      const rowErr: { date?: string; subject?: string; time?: string; totalMarks?: string; subjectCode?: string } = {};
      if (!row.date.trim()) {
        rowErr.date = "তারিখ আবশ্যক";
        hasRowErrors = true;
      }
      if (!row.subject.trim()) {
        rowErr.subject = "বিষয় আবশ্যক";
        hasRowErrors = true;
      }
      if (!row.time.trim()) {
        rowErr.time = "সময় আবশ্যক";
        hasRowErrors = true;
      }
      if (!row.totalMarks.trim()) {
        rowErr.totalMarks = "নাম্বার আবশ্যক";
        hasRowErrors = true;
      }
      if (!row.subjectCode.trim()) {
        rowErr.subjectCode = "কোড আবশ্যক";
        hasRowErrors = true;
      }
      errors[idx] = rowErr;
    });

    setRowExamValidationErrors(errors);
    if (!isValid || hasRowErrors) return;

    try {
      if (!editingExamId) {
        // Overwrite Logic: Delete all previous exam routines for this class
        const q = query(
          collection(db, "routines"),
          where("type", "==", "exam"),
          where("className", "==", examClassInput)
        );
        const snapshot = await getDocs(q);
        const deletePromises = snapshot.docs.map(d => deleteDoc(doc(db, "routines", d.id)));
        await Promise.all(deletePromises);
      }

      const activeGuidelines = examGuidelinesInput.filter(gl => gl.trim() !== "");

      const payload = {
        type: "exam",
        className: examClassInput,
        examName: examNameInput,
        subjects: examSubjects,
        guidelines: activeGuidelines.length > 0 ? activeGuidelines : [""],
        isEdited: editingExamId ? true : false,
        editedAt: editingExamId ? new Date().toISOString() : ""
      };

      if (editingExamId) {
        await updateDoc(doc(db, "routines", editingExamId), payload);
      } else {
        await addDoc(collection(db, "routines"), payload);
      }

      // Reset
      setExamClassInput("");
      setExamNameInput("");
      setExamSubjects([{ date: "", subject: "", time: "", totalMarks: "", subjectCode: "" }]);
      setExamGuidelinesInput([""]);
      setRowExamValidationErrors([]);
      setEditingExamId(null);
      setIsExamFormOpen(false);
      setExamSaveSuccess(true);
      setTimeout(() => setExamSaveSuccess(false), 3000);
    } catch (err) {
      console.error("Error saving exam routine:", err);
      alert("পরীক্ষা রুটিন সংরক্ষণ করতে সমস্যা হয়েছে।");
    }
  };

  const handleEditExamLocal = (item: Routine) => {
    setEditingExamId(item.id);
    setExamClassInput(item.className);
    setExamNameInput(item.examName || "");
    setExamSubjects(item.subjects || [{ date: "", subject: "", time: "", totalMarks: "", subjectCode: "" }]);
    setExamGuidelinesInput(item.guidelines || [""]);
    setRowExamValidationErrors([]);
    setIsExamFormOpen(true);
    setExamClassError("");
    setExamNameError("");

    setTimeout(() => {
      const formElement = document.getElementById("exam-routine-form-section");
      if (formElement) {
        formElement.scrollIntoView({ behavior: "smooth" });
      }
    }, 100);
  };

  const handleCancelEditExam = () => {
    setEditingExamId(null);
    setExamClassInput("");
    setExamNameInput("");
    setExamSubjects([{ date: "", subject: "", time: "", totalMarks: "", subjectCode: "" }]);
    setExamGuidelinesInput([""]);
    setRowExamValidationErrors([]);
    setExamClassError("");
    setExamNameError("");
    setIsExamFormOpen(false);
  };

  const handleAddExamSubjectRow = () => {
    setExamSubjects([...examSubjects, { date: "", subject: "", time: "", totalMarks: "", subjectCode: "" }]);
  };

  const handleRemoveExamSubjectRow = (idx: number) => {
    if (examSubjects.length > 1) {
      setExamSubjects(examSubjects.filter((_, i) => i !== idx));
    }
  };

  const handleUpdateExamSubjectRowField = (idx: number, field: string, value: string) => {
    const updated = [...examSubjects];
    updated[idx] = { ...updated[idx], [field]: value };
    setExamSubjects(updated);
  };

  const handleUpdateExamGuideline = (idx: number, value: string) => {
    const updated = [...examGuidelinesInput];
    updated[idx] = value;
    setExamGuidelinesInput(updated);
  };

  const handleSaveRoutine = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Strict validation
    let isValid = true;
    if (!routineClassInput.trim()) {
      setRoutineClassError("অনুগ্রহ করে একটি ক্লাস সিলেক্ট বা ইনপুট করুন");
      isValid = false;
    } else {
      setRoutineClassError("");
    }
    if (!routineDayInput.trim()) {
      setRoutineDayError("অনুগ্রহ করে একটি দিন সিলেক্ট বা ইনপুট করুন");
      isValid = false;
    } else {
      setRoutineDayError("");
    }

    // Dynamic rows validation
    const errors: Array<{ subject?: string; time?: string; teacherName?: string }> = [];
    let hasRowErrors = false;
    routineSubjects.forEach((row, idx) => {
      const rowErr: { subject?: string; time?: string; teacherName?: string } = {};
      if (!row.subject.trim()) {
        rowErr.subject = "বিষয় আবশ্যক";
        hasRowErrors = true;
      }
      if (!row.time.trim()) {
        rowErr.time = "সময় আবশ্যক";
        hasRowErrors = true;
      }
      if (!row.teacherName.trim()) {
        rowErr.teacherName = "শিক্ষক আবশ্যক";
        hasRowErrors = true;
      }
      errors[idx] = rowErr;
    });

    setRowValidationErrors(errors);
    if (!isValid || hasRowErrors) return;

    try {
      if (editingRoutineId) {
        // Edit mode (only updates 1 item)
        const row = routineSubjects[0];
        const payload = {
          type: "class",
          className: routineClassInput,
          subject: row.subject,
          time: row.time,
          dayOrDate: routineDayInput,
          room: row.room || "১০১",
          teacherName: row.teacherName,
          isEdited: true,
          editedAt: new Date().toISOString()
        };
        await updateDoc(doc(db, "routines", editingRoutineId), payload);
      } else {
        // Overwrite Logic: Delete all previous class routines for this class
        const q = query(
          collection(db, "routines"),
          where("type", "==", "class"),
          where("className", "==", routineClassInput)
        );
        const snapshot = await getDocs(q);
        const deletePromises = snapshot.docs.map(d => deleteDoc(doc(db, "routines", d.id)));
        await Promise.all(deletePromises);

        // Add mode (creates multiple documents in routines)
        for (const row of routineSubjects) {
          const payload = {
            type: "class",
            className: routineClassInput,
            subject: row.subject,
            time: row.time,
            dayOrDate: routineDayInput,
            room: row.room || "১০১",
            teacherName: row.teacherName,
            isEdited: false,
            editedAt: ""
          };
          await addDoc(collection(db, "routines"), payload);
        }
      }

      // Reset form
      setRoutineClassInput("");
      setRoutineDayInput("");
      setRoutineSubjects([{ subject: "", time: "", teacherName: "", room: "" }]);
      setRowValidationErrors([]);
      setEditingRoutineId(null);
      setIsRoutineFormOpen(false); // Close form after successful save
      setRoutineSaveSuccess(true);
      setTimeout(() => setRoutineSaveSuccess(false), 3000);
    } catch (err) {
      console.error("Error saving routine:", err);
      alert("রুটিন সংরক্ষণ করতে সমস্যা হয়েছে।");
    }
  };

  const handleEditRoutineLocal = (item: Routine) => {
    setEditingRoutineId(item.id);
    setRoutineClassInput(item.className);
    setRoutineDayInput(item.dayOrDate);
    setRoutineSubjects([{
      subject: item.subject,
      time: item.time,
      teacherName: item.teacherName || "",
      room: item.room || ""
    }]);
    setRowValidationErrors([]);
    setIsRoutineFormOpen(true); // Open form on edit
    
    // Clear validation errors
    setRoutineClassError("");
    setRoutineDayError("");
    
    // Scroll smoothly to form
    const formElement = document.getElementById("local-routine-form-section");
    if (formElement) {
      formElement.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleCancelEditRoutine = () => {
    setEditingRoutineId(null);
    setRoutineClassInput("");
    setRoutineDayInput("");
    setRoutineSubjects([{ subject: "", time: "", teacherName: "", room: "" }]);
    setRowValidationErrors([]);
    setRoutineClassError("");
    setRoutineDayError("");
    setIsRoutineFormOpen(false); // Close form
  };

  const handleAddSubjectRow = () => {
    setRoutineSubjects([...routineSubjects, { subject: "", time: "", teacherName: "", room: "" }]);
  };

  const handleRemoveSubjectRow = (index: number) => {
    if (routineSubjects.length > 1) {
      setRoutineSubjects(routineSubjects.filter((_, i) => i !== index));
    }
  };

  const handleUpdateSubjectRowField = (index: number, field: string, value: string) => {
    const updated = [...routineSubjects];
    updated[index] = { ...updated[index], [field]: value };
    setRoutineSubjects(updated);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, fieldSetter: (val: string) => void, folderName: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Strict validation for committee members before upload
    if (activeAdminSubTab === "committee") {
      if (
        !field1.trim() || 
        !field2.trim() || 
        !field3.trim() || 
        !field4.trim() || 
        !commJoiningDate.trim() || 
        !commBirthDate.trim() || 
        !commBloodGroup.trim() || 
        !commQualification.trim() || 
        !commPhone.trim() || 
        !commEmail.trim() || 
        !commAddress.trim()
      ) {
        setUploadError("⚠️ ছবি আপলোড ব্লকড! অনুগ্রহ করে প্রথমে ফরমের সকল টেক্সট ফিল্ড (নাম, পদবী, বাণী, র‍্যাংক এবং বায়ো-ডাটার ৭টি ফিল্ড) সম্পূর্ণ ও সঠিকভাবে পূরণ করুন।");
        e.target.value = ""; // reset file input
        return;
      }

      // Read selected image file as data URL to start crop process
      const reader = new FileReader();
      reader.onload = () => {
        setCropSrc(reader.result as string);
        setCropZoom(1);
        setCropX(0);
        setCropY(0);
        setCropFile(file);
        setCropFieldSetter(() => fieldSetter);
      };
      reader.readAsDataURL(file);
      e.target.value = ""; // Reset file input so same file can be selected again
      return;
    }

    setIsUploading(true);
    setUploadError("");
    try {
      const downloadUrl = await uploadFileToImgBB(file);
      fieldSetter(downloadUrl);
    } catch (error: any) {
      console.error("Error uploading file:", error);
      setUploadError("ফাইল আপলোড করতে ব্যর্থ হয়েছে। পুনরায় চেষ্টা করুন।");
    } finally {
      setIsUploading(false);
    }
  };

  // Subscriptions
  useEffect(() => {
    const unsubTeachers = onSnapshot(collection(db, "teachers"), (snap) => {
      const items: Teacher[] = [];
      snap.forEach((d) => items.push({ id: d.id, ...d.data() } as Teacher));
      setTeachers(items);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, "teachers");
    });

    const unsubStories = onSnapshot(query(collection(db, "success_stories"), orderBy("timestamp", "desc")), (snap) => {
      const items: SuccessStory[] = [];
      snap.forEach((d) => items.push({ id: d.id, ...d.data() } as SuccessStory));
      setStories(items);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, "success_stories");
    });

    const unsubCommittee = onSnapshot(query(collection(db, "committee"), orderBy("rank", "asc")), (snap) => {
      const items: CommitteeMember[] = [];
      snap.forEach((d) => items.push({ id: d.id, ...d.data() } as CommitteeMember));
      setCommittee(items);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, "committee");
    });

    const unsubHonored = onSnapshot(collection(db, "honored_persons"), (snap) => {
      const items: HonoredPerson[] = [];
      snap.forEach((d) => items.push({ id: d.id, ...d.data() } as HonoredPerson));
      setHonored(items);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, "honored_persons");
    });

    const unsubRoutines = onSnapshot(collection(db, "routines"), (snap) => {
      const items: Routine[] = [];
      snap.forEach((d) => items.push({ id: d.id, ...d.data() } as Routine));
      setRoutines(items);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, "routines");
    });

    const unsubAdmissions = onSnapshot(collection(db, "admissions"), (snap) => {
      const items: AdmissionForm[] = [];
      snap.forEach((d) => items.push({ id: d.id, ...d.data() } as unknown as AdmissionForm));
      setAdmissions(items);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, "admissions");
    });

    const unsubMessages = onSnapshot(query(collection(db, "messages"), orderBy("date", "desc")), (snap) => {
      const items: ContactMessage[] = [];
      snap.forEach((d) => items.push({ id: d.id, ...d.data() } as ContactMessage));
      setMessages(items);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, "messages");
    });

    const unsubSettings = onSnapshot(doc(db, "settings", "website"), (snap) => {
      if (snap.exists()) {
        setWebsiteLogoUrl(snap.data().logoUrl || "");
        setHeroBgUrl(snap.data().heroBgUrl || "");
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, "settings/website");
    });

    const unsubBranding = onSnapshot(doc(db, "settings", "branding"), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setIsMainLogoUploaded(!!data.isMainLogoUploaded || !!data.isLogoUploaded);
        setIsContactLogoUploaded(!!data.isContactLogoUploaded);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, "settings/branding");
    });

    return () => {
      unsubTeachers();
      unsubStories();
      unsubCommittee();
      unsubHonored();
      unsubRoutines();
      unsubAdmissions();
      unsubMessages();
      unsubSettings();
      unsubBranding();
    };
  }, []);

  // Real-time Account Login ID validation for Admissions
  useEffect(() => {
    if (!accountLoginId || accountLoginId.length < 5) {
      setAccountLoginIdStatus({status: 'idle', duplicateInfo: null});
      return;
    }
    const check = async () => {
      setAccountLoginIdStatus({status: 'checking', duplicateInfo: null});
      const duplicate = await checkUniqueLoginIdGlobal(accountLoginId);
      if (duplicate) {
        setAccountLoginIdStatus({status: 'duplicate', duplicateInfo: duplicate});
      } else {
        setAccountLoginIdStatus({status: 'unique', duplicateInfo: null});
      }
    };
    const timer = setTimeout(check, 500);
    return () => clearTimeout(timer);
  }, [accountLoginId]);

  // Live Phone Number Validation
  useEffect(() => {
    const checkPhone = async () => {
      if (user.role === "admin" && activeAdminSubTab === "teachers" && isFormOpen && field3.length >= 11) {
        setIsCheckingPhone(true);
        try {
          const targetPhone = field3.trim();
          const duplicate = await checkDuplicatePhoneNumberGlobal(targetPhone);
          
          if (duplicate && duplicate.id !== editingId) {
            setIsPhoneDuplicate(true);
            setDuplicateUserInfo({ name: duplicate.name, id: duplicate.id });
          } else {
            setIsPhoneDuplicate(false);
            setDuplicateUserInfo(null);
          }
        } catch (err) {
          console.error("Error checking phone duplicate:", err);
        } finally {
          setIsCheckingPhone(false);
        }
      } else {
        setIsPhoneDuplicate(false);
        setDuplicateUserInfo(null);
      }
    };

    const timeoutId = setTimeout(checkPhone, 500); // Debounce
    return () => clearTimeout(timeoutId);
  }, [field3, isFormOpen, activeAdminSubTab, editingId, user.role]);

  // Pre-populate contact fields with current Firestore data when contact_update tab is active
  useEffect(() => {
    if (activeAdminSubTab === "contact_update") {
      const fetchContactData = async () => {
        try {
          const snap = await getDoc(doc(db, "settings", "contact"));
          if (snap.exists()) {
            const data = snap.data();
            setContactAddressInput(data.address || "");
            setContactOfficePhoneInput(data.officePhone || "");
            setContactPrincipalPhoneInput(data.principalPhone || "");
            setContactEmailInput(data.email || "");
            setContactFacebookInput(data.facebook || "");
            setContactLinkedinInput(data.linkedin || "");
            setContactTelegramInput(data.telegram || "");
            setContactWhatsappInput(data.whatsapp || "");
          }
        } catch (err) {
          console.error("Error fetching contact data for admin prepopulate:", err);
        }
      };
      fetchContactData();
    }
  }, [activeAdminSubTab]);

  const handleHeroBgUpload = async (file: File) => {
    setIsUploadingHeroBg(true);
    setHeroBgError("");
    try {
      const downloadUrl = await uploadFileToImgBB(file);
      await setDoc(doc(db, "settings", "website"), { heroBgUrl: downloadUrl }, { merge: true });
      setHeroBgSaveSuccess(true);
      setTimeout(() => setHeroBgSaveSuccess(false), 3000);
    } catch (err: any) {
      console.error("Error uploading hero background:", err);
      setHeroBgError("ছবি আপলোড করতে ব্যর্থ হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।");
    } finally {
      setIsUploadingHeroBg(false);
    }
  };

  const handleClearHeroBg = async () => {
    try {
      await setDoc(doc(db, "settings", "website"), { heroBgUrl: "" }, { merge: true });
      setHeroBgSaveSuccess(true);
      setTimeout(() => setHeroBgSaveSuccess(false), 3000);
    } catch (err) {
      console.error("Error clearing hero background:", err);
      setHeroBgError("ব্যাকগ্রাউন্ড ছবি মুছতে ব্যর্থ হয়েছে।");
    }
  };

  const handleContactUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (contactOfficePhoneInput && contactOfficePhoneInput.trim().length !== 11) {
      alert("অফিস কন্টাক্ট নাম্বার অবশ্যই ১১ সংখ্যার হতে হবে।");
      return;
    }
    if (contactPrincipalPhoneInput && contactPrincipalPhoneInput.trim().length !== 11) {
      alert("প্রধান শিক্ষকের নাম্বার অবশ্যই ১১ সংখ্যার হতে হবে।");
      return;
    }

    setIsUpdatingContact(true);
    setContactSaveSuccess(false);
    try {
      await setDoc(doc(db, "settings", "contact"), {
        address: contactAddressInput,
        officePhone: contactOfficePhoneInput,
        principalPhone: contactPrincipalPhoneInput,
        email: contactEmailInput,
        facebook: contactFacebookInput,
        linkedin: contactLinkedinInput,
        telegram: contactTelegramInput,
        whatsapp: contactWhatsappInput,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      
      setContactSaveSuccess(true);
      setTimeout(() => setContactSaveSuccess(false), 4000);
    } catch (err: any) {
      console.error("Error updating contact settings:", err);
      handleFirestoreError(err, OperationType.UPDATE, "settings/contact");
      alert("দুঃখিত, তথ্য সংরক্ষণ করা যায়নি। অনুগ্রহ করে আবার চেষ্টা করুন।");
    } finally {
      setIsUpdatingContact(false);
    }
  };

  // CRUD handlers
  const handleOpenAddForm = () => {
    setEditingId(null);
    setField1(""); setField2(""); setField3(""); setField4(""); setField5(""); setField6("");
    setCommJoiningDate("");
    setCommBirthDate("");
    setCommBloodGroup("");
    setCommQualification("");
    setCommPhone("");
    setCommEmail("");
    setCommAddress("");
    setCommFacebook("");
    setCommWhatsapp("");
    setCommPhoneNum("");
    setUploadError("");
    setIsFormOpen(true);
  };

  const handleEdit = (item: any, type: string) => {
    setEditingId(item.id);
    setUploadError("");
    setIsFormOpen(true);
    if (type === "stories") {
      setField1(item.student_name || "");
      setField2(item.achievement || "");
      setField3(item.year?.toString() || "");
      setField4(item.imageUrl || "");
    } else if (type === "committee") {
      setField1(item.name || "");
      setField2(item.role || "");
      setField3(item.speech || "");
      setField4(item.rank?.toString() || "");
      setField5(item.imageUrl || "");
      setCommJoiningDate(item.joiningDate || "");
      setCommBirthDate(item.birthDate || "");
      setCommBloodGroup(item.bloodGroup || "");
      setCommQualification(item.qualification || "");
      setCommPhone(item.phone || "");
      setCommEmail(item.email || "");
      setCommAddress(item.address || "");
      setCommFacebook(item.facebookUrl || "");
      setCommWhatsapp(item.whatsAppNum || "");
      setCommPhoneNum(item.phoneNum || "");
    } else if (type === "honored") {
      setField1(item.name || "");
      setField2(item.birth_death || "");
      setField3(item.contribution || "");
      setField4(item.imageUrl || "");
    } else if (type === "routines") {
      setField1(item.type || "class");
      setField2(item.className || "");
      setField3(item.subject || "");
      setField4(item.time || "");
      setField5(item.dayOrDate || "");
      setField6(item.room || "");
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const subTab = user.role === "teacher" ? "routines" : activeAdminSubTab;

    try {
      if (subTab === "teachers") {
        const payload = { name: field1, designation: field2, phone: field3, email: field4, photoUrl: field5 || "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80", uid: editingId || `teacher_${Date.now()}` };
        if (editingId) {
          await updateDoc(doc(db, "teachers", editingId), payload);
        } else {
          await addDoc(collection(db, "teachers"), payload);
        }
      } else if (subTab === "stories") {
        const payload = { 
          student_name: field1, 
          achievement: field2, 
          year: parseInt(field3) || 2026, 
          imageUrl: field4 || "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=300&q=80",
          timestamp: new Date() // Added for auto-delete logic
        };
        if (editingId) {
          await updateDoc(doc(db, "success_stories", editingId), payload);
        } else {
          // Auto-Delete Oldest Record Logic
          const successCol = collection(db, "success_stories");
          const q = query(successCol, orderBy("timestamp", "asc"), limit(1));
          const snap = await getDocs(q);
          
          await addDoc(successCol, payload);
          
          if (!snap.empty) {
            await deleteDoc(doc(db, "success_stories", snap.docs[0].id));
          }
        }
      } else if (subTab === "committee") {
        const payload = { 
          name: field1, 
          role: field2, 
          speech: field3, 
          rank: parseInt(field4) || 10, 
          imageUrl: field5 || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=300&q=80",
          joiningDate: commJoiningDate,
          birthDate: commBirthDate,
          bloodGroup: commBloodGroup,
          qualification: commQualification,
          phone: commPhone,
          email: commEmail,
          address: commAddress,
          facebookUrl: commFacebook,
          whatsAppNum: commWhatsapp,
          phoneNum: commPhoneNum
        };
        if (editingId) {
          await updateDoc(doc(db, "committee", editingId), payload);
        } else {
          await addDoc(collection(db, "committee"), payload);
        }
      } else if (subTab === "honored") {
        const payload = { name: field1, birth_death: field2, contribution: field3, imageUrl: field4 || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80" };
        if (editingId) {
          await updateDoc(doc(db, "honored_persons", editingId), payload);
        } else {
          await addDoc(collection(db, "honored_persons"), payload);
        }
      } else if (subTab === "routines") {
        const payload = { type: field1 as "class" | "exam", className: field2, subject: field3, time: field4, dayOrDate: field5, room: field6, teacherName: user.name };
        if (editingId) {
          await updateDoc(doc(db, "routines", editingId), payload);
        } else {
          await addDoc(collection(db, "routines"), payload);
        }
      }

      setIsFormOpen(false);
      setEditingId(null);
    } catch (err) {
      console.error("Error saving doc:", err);
      alert("ডাটা সংরক্ষণ করতে সমস্যা হয়েছে।");
      handleFirestoreError(err, editingId ? OperationType.UPDATE : OperationType.CREATE, subTab);
    }
  };

  const handleDelete = async (id: string, colName: string) => {
    if (!window.confirm("আপনি কি নিশ্চিতভাবে এটি ডিলিট করতে চান?")) return;
    try {
      await deleteDoc(doc(db, colName, id));
    } catch (err) {
      console.error("Error deleting doc:", err);
      handleFirestoreError(err, OperationType.DELETE, `${colName}/${id}`);
    }
  };

  const handleUpdateAdmissionStatus = async (id: string, status: "Approved" | "Rejected") => {
    try {
      await updateDoc(doc(db, "admissions", id), { status });
    } catch (err) {
      console.error("Error updating admission status:", err);
      handleFirestoreError(err, OperationType.UPDATE, `admissions/${id}`);
    }
  };

  const handleToggleAdmissionPayment = async (id: string, currentPayment: string) => {
    const newPayment = currentPayment === "Paid" ? "Unpaid" : "Paid";
    try {
      await updateDoc(doc(db, "admissions", id), { payment_status: newPayment });
    } catch (err) {
      console.error("Error updating payment status:", err);
      handleFirestoreError(err, OperationType.UPDATE, `admissions/${id}`);
    }
  };

  const handleAddRunningNotice = async (noticeText: string) => {
    if (!noticeText.trim()) return;
    try {
      // 1. Fetch current notices ordered by createdAt descending (newest first)
      const noticesSnapshot = await getDocs(
        query(collection(db, "running_notices"), orderBy("createdAt", "desc"))
      );
      
      const currentNotices: { id: string; createdAt: any }[] = [];
      noticesSnapshot.forEach((doc) => {
        currentNotices.push({ id: doc.id, ...doc.data() } as any);
      });

      // 2. Queue Logic: If already 2 or more notices exist, we delete the oldest one(s).
      if (currentNotices.length >= 2) {
        // Since currentNotices is sorted desc, the oldest are from index 1 and onwards.
        // We delete them to make space for the new notice.
        for (let i = 1; i < currentNotices.length; i++) {
          await deleteDoc(doc(db, "running_notices", currentNotices[i].id));
        }
      }

      // 3. Add the new notice (createdAt as ISO string is fully supported)
      await addDoc(collection(db, "running_notices"), {
        text: noticeText,
        createdAt: new Date().toISOString(),
      });

      setNewNoticeText("");
      alert("চলমান নোটিশটি সফলভাবে আপলোড করা হয়েছে!");
    } catch (err) {
      console.error("Error adding running notice:", err);
      alert("নোটিশ যোগ করতে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।");
    }
  };

  const handleAddTeacherNotice = async () => {
    if (!teacherNoticeTitle.trim() || !teacherNoticeDescription.trim()) return;
    setIsNoticeUploading(true);
    try {
      const noticesSnapshot = await getDocs(
        query(collection(db, "teacher_notices"), orderBy("timestamp", "asc"))
      );
      
      // If we already have 2 notices, delete the oldest one (first one in ASC order)
      if (noticesSnapshot.size >= 2) {
        const oldestDoc = noticesSnapshot.docs[0];
        await deleteDoc(doc(db, "teacher_notices", oldestDoc.id));
      }

      await addDoc(collection(db, "teacher_notices"), {
        title: teacherNoticeTitle,
        description: teacherNoticeDescription,
        timestamp: serverTimestamp(),
      });

      setTeacherNoticeTitle("");
      setTeacherNoticeDescription("");
      alert("শিক্ষক নোটিশটি সফলভাবে আপলোড করা হয়েছে!");
    } catch (err) {
      console.error("Error adding teacher notice:", err);
      alert("নোটিশ যোগ করতে সমস্যা হয়েছে।");
    } finally {
      setIsNoticeUploading(false);
    }
  };

  // Unified Notice Editing Handler
  const handleSaveNoticeEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editNoticeId || !editNoticeType) return;
    setIsEditNoticeSaving(true);
    try {
      if (editNoticeType === "running") {
        if (!editNoticeText.trim()) {
          alert("দয়া করে নোটিশের বিবরণ দিন।");
          setIsEditNoticeSaving(false);
          return;
        }
        await updateDoc(doc(db, "running_notices", editNoticeId), {
          text: editNoticeText
        });
        alert("চলমান নোটিশটি সফলভাবে আপডেট করা হয়েছে!");
      } else if (editNoticeType === "public") {
        if (!editNoticeTitle.trim() || !editNoticeDescription.trim()) {
          alert("দয়া করে নোটিশের টাইটেল ও বিবরণ দিন।");
          setIsEditNoticeSaving(false);
          return;
        }
        await updateDoc(doc(db, "notices", editNoticeId), {
          title: editNoticeTitle,
          description: editNoticeDescription,
          isEdited: true
        });
        alert("পাবলিক নোটিশটি সফলভাবে আপডেট করা হয়েছে!");
      } else if (editNoticeType === "teacher") {
        if (!editNoticeTitle.trim() || !editNoticeDescription.trim()) {
          alert("দয়া করে নোটিশের টাইটেল ও বিবরণ দিন।");
          setIsEditNoticeSaving(false);
          return;
        }
        await updateDoc(doc(db, "teacher_notices", editNoticeId), {
          title: editNoticeTitle,
          description: editNoticeDescription
        });
        alert("শিক্ষক নোটিশটি সফলভাবে আপডেট করা হয়েছে!");
      }
      // Reset state
      setEditNoticeType(null);
      setEditNoticeId(null);
      setEditNoticeText("");
      setEditNoticeTitle("");
      setEditNoticeDescription("");
    } catch (err) {
      console.error("Error updating notice:", err);
      alert("দুঃখিত, নোটিশ আপডেট করা যায়নি।");
    } finally {
      setIsEditNoticeSaving(false);
    }
  };

  const renderAdmissionVerifyField = (adm: any, labelBn: string, labelEn: string, fieldKey: string, value: string) => {
    const verifiedFields = adm.verifiedFields || {};
    const isVerified = !!verifiedFields[fieldKey];
    return (
      <div key={fieldKey} className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 bg-slate-50 hover:bg-emerald-50/20 rounded-xl border border-slate-100 transition-all gap-3">
        <div>
          <span className="text-xs text-slate-500 font-bold block">{labelBn} <span className="font-sans text-[10px] text-slate-400">({labelEn})</span></span>
          <span className="text-sm text-emerald-950 font-black mt-0.5 block">{value || "N/A"}</span>
        </div>
        <button
          type="button"
          onClick={async () => {
            try {
              const docRef = doc(db, "admissions", adm.id);
              await setDoc(docRef, {
                verifiedFields: {
                  [fieldKey]: !isVerified
                }
              }, { merge: true });
            } catch (e) {
              console.error("Field verify error:", e);
            }
          }}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border cursor-pointer ${
            isVerified
              ? "bg-emerald-100 text-emerald-800 border-emerald-200 shadow-xs"
              : "bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200"
          }`}
        >
          {isVerified ? (
            <>
              <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
              <span>ভেরিফাইড (Verified)</span>
            </>
          ) : (
            <>
              <AlertCircle className="w-3.5 h-3.5 text-slate-400" />
              <span>যাচাই করুন (Verify)</span>
            </>
          )}
        </button>
      </div>
    );
  };

  return (
    <div id="dashboard-section" className="space-y-8 py-6 w-full px-2">
      {/* ------------------- STUDENT DASHBOARD ------------------- */}
      {user.role === "student" && (
        <div id="student-dashboard" className="space-y-6 pb-24 font-alinur" style={{ fontFamily: 'Alinur Tatsama' }}>
          <StreamBuilder<any>
            stream={studentsQuery}
            builder={(students: any[], loading: boolean, error: any) => {
              const loggedInStudent = students.find((s: any) => 
                (s.email && s.email.trim().toLowerCase() === user.email.trim().toLowerCase()) ||
                (s.loginId && s.loginId.trim().toLowerCase() === user.email.trim().toLowerCase()) ||
                (s.phone && s.phone.trim().toLowerCase() === user.email.trim().toLowerCase()) ||
                (s.name && s.name.trim().toLowerCase() === user.name.trim().toLowerCase())
              );

              const studentName = loggedInStudent?.studentNameBn || loggedInStudent?.name || user.name || "মোহাম্মদ আলী";
              const studentClass = loggedInStudent?.className || "১০ম শ্রেণী";
              const studentRoll = loggedInStudent?.roll || "০১";
              const studentPhone = loggedInStudent?.phone || "";

              // Current Date logic
              const today = new Date();
              const formattedDate = today.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
              
              const defaultPhoto = loggedInStudent?.gender === "নারী" 
                ? "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&h=300&q=80" 
                : "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=300&h=300&q=80";
              const studentPhoto = loggedInStudent?.photoUrl || loggedInStudent?.imageUrl || defaultPhoto;
              
              const handleSupportSubmit = async (e: React.FormEvent) => {
                e.preventDefault();
                if (!supportMessage.trim()) return;
                setIsSubmittingSupport(true);
                try {
                  await addDoc(collection(db, "messages"), {
                    name: studentName,
                    email: user.email,
                    phone: studentPhone || "শিক্ষার্থী পোর্টাল",
                    subject: supportSubject || "শিক্ষার্থী পোর্টাল সাপোর্ট বার্তা",
                    message: supportMessage,
                    createdAt: new Date().toISOString(),
                    isRead: false
                  });
                  setSupportSuccess(true);
                  setSupportMessage("");
                  setSupportSubject("");
                  setTimeout(() => setSupportSuccess(false), 5000);
                } catch (err) {
                  console.error("Support message error:", err);
                } finally {
                  setIsSubmittingSupport(false);
                }
              };

              return (
                <StudentDashboardInner
                  loggedInStudent={loggedInStudent}
                  studentName={studentName}
                  studentClass={studentClass}
                  studentRoll={studentRoll}
                  studentPhone={studentPhone}
                  studentPhoto={studentPhoto}
                  formattedDate={formattedDate}
                  user={user}
                  studentActiveTab={studentActiveTab}
                  setStudentActiveTab={setStudentActiveTab}
                  setShowLogoutConfirm={setShowLogoutConfirm}
                  supportSubject={supportSubject}
                  setSupportSubject={setSupportSubject}
                  supportMessage={supportMessage}
                  setSupportMessage={setSupportMessage}
                  isSubmittingSupport={isSubmittingSupport}
                  supportSuccess={supportSuccess}
                  handleSupportSubmit={handleSupportSubmit}
                  toBengaliDigits={toBengaliDigits}
                  setSelectedHomework={setSelectedHomework}
                  setShowHomeworkDetailModal={setShowHomeworkDetailModal}
                />
              );
            }}
          />
        </div>
      )}

      {/* ------------------- TEACHER DASHBOARD ------------------- */}
      {user.role === "teacher" && (
        <TeacherDashboardInner 
          user={user} 
          setShowLogoutConfirm={setShowLogoutConfirm}
          toBengaliDigits={toBengaliDigits}
        />
      )}

      {/* ------------------- ADMIN DASHBOARD ------------------- */}
      {user.role === "admin" && (
        <div id="admin-dashboard" className="space-y-6">
          {/* Admin Tabs */}
          <div className="flex flex-wrap items-center gap-2 border-b border-gray-200 pb-2 font-alinur">
            {[
              { id: "dashboard", label: "ড্যাশবোর্ড", icon: LayoutDashboard },
              { id: "leave_mgmt", label: "ছুটির আবেদন", icon: CalendarRange },
              { id: "admissions", label: "অনলাইন আবেদন ট্র্যাকিং", icon: UserPlus },
              { id: "teachers", label: "শিক্ষক তালিকা", icon: GraduationCap },
              { id: "teacher_attendance", label: "শিক্ষক হাজিরা", icon: CalendarCheck },
              { id: "stories", label: "শিক্ষার্থীদের সাফল্য", icon: Award },
              { id: "committee", label: "গভর্নিং বডি", icon: Users },
              { id: "honored", label: "স্মরণীয় ব্যক্তিত্ব", icon: Heart },
              { id: "routines", label: "রুটিন শিডিউল", icon: Calendar },
              { id: "hafizgon", label: "হিফজ বিভাগ", icon: BookOpen },
              { id: "homework_subjects", label: "হোমওয়ার্ক সাবজেক্ট", icon: ClipboardList },
              ...(user.adminRole === "mother_admin" || user.adminRole === "super_admin" ? [{ id: "admin_control", label: "এডমিন কন্ট্রোল", icon: Lock }] : []),
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  id={`admin-subtab-${tab.id}`}
                  onClick={() => {
                    setActiveAdminSubTab(tab.id as any);
                    setIsNoticeDropdownOpen(false);
                    setIsHeroDropdownOpen(false);
                    setIsSettingsDropdownOpen(false);
                    setIsMenuBarDropdownOpen(false);
                  }}
                  className={`flex items-center space-x-1.5 px-4 py-2.5 rounded-lg text-xs font-bold transition-all ${
                    activeAdminSubTab === tab.id
                      ? "bg-emerald-800 text-white shadow-sm"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}

            {/* Notice Tab with Dropdown */}
            <div className="relative">
              <button
                id="admin-notice-dropdown-trigger"
                onClick={() => {
                  setIsNoticeDropdownOpen(!isNoticeDropdownOpen);
                  setIsHeroDropdownOpen(false);
                  setIsSettingsDropdownOpen(false);
                  setIsMenuBarDropdownOpen(false);
                }}
                className={`flex items-center space-x-1.5 px-4 py-2.5 rounded-lg text-xs font-bold transition-all ${
                  activeAdminSubTab === "running_notices"
                    ? "bg-emerald-800 text-white shadow-sm"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                <Megaphone className="h-4 w-4" />
                <span>নোটিশ</span>
                <ChevronDown className={`h-3 w-3 transition-transform duration-200 ${isNoticeDropdownOpen ? "rotate-180" : ""}`} />
              </button>
              
              {isNoticeDropdownOpen && (
                <div className="absolute left-0 mt-1.5 w-48 bg-white border border-gray-100 rounded-lg shadow-lg py-1 z-30">
                  <button
                    id="admin-subtab-running-notice"
                    onClick={() => {
                      setActiveAdminSubTab("running_notices");
                      setIsNoticeDropdownOpen(false);
                    }}
                    className={`flex items-center space-x-2 w-full text-left px-4 py-2 text-xs font-bold ${
                      activeAdminSubTab === "running_notices"
                        ? "bg-emerald-50 text-emerald-850"
                        : "text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    <div className="h-1.5 w-1.5 rounded-full bg-amber-500"></div>
                    <span>চলমান নোটিশ</span>
                  </button>

                  <button
                    id="admin-subtab-public-notice"
                    onClick={() => {
                      setActiveAdminSubTab("public_notices");
                      setIsNoticeDropdownOpen(false);
                    }}
                    className={`flex items-center space-x-2 w-full text-left px-4 py-2 text-xs font-bold ${
                      activeAdminSubTab === "public_notices"
                        ? "bg-emerald-50 text-emerald-850"
                        : "text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-800"></div>
                    <span>নোটিশ পাবলিক</span>
                  </button>

                  <button
                    id="admin-subtab-teacher-notice"
                    onClick={() => {
                      setActiveAdminSubTab("teacher_notices");
                      setIsNoticeDropdownOpen(false);
                    }}
                    className={`flex items-center space-x-2 w-full text-left px-4 py-2 text-xs font-bold ${
                      activeAdminSubTab === "teacher_notices"
                        ? "bg-emerald-50 text-emerald-850"
                        : "text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    <div className="h-1.5 w-1.5 rounded-full bg-rose-500"></div>
                    <span>শিক্ষক নোটিশ</span>
                  </button>
                </div>
              )}
            </div>

            {/* Hero Section Update Tab with Dropdown */}
            <div className="relative">
              <button
                id="admin-hero-dropdown-trigger"
                onClick={() => {
                  setIsHeroDropdownOpen(!isHeroDropdownOpen);
                  setIsNoticeDropdownOpen(false);
                  setIsSettingsDropdownOpen(false);
                  setIsMenuBarDropdownOpen(false);
                }}
                className={`flex items-center space-x-1.5 px-4 py-2.5 rounded-lg text-xs font-bold transition-all ${
                  activeAdminSubTab === "pathdan_update"
                    ? "bg-emerald-800 text-white shadow-sm"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                <Settings className="h-4 w-4 text-amber-500" />
                <span>হিরো সেকশন আপডেট</span>
                <ChevronDown className={`h-3 w-3 transition-transform duration-200 ${isHeroDropdownOpen ? "rotate-180" : ""}`} />
              </button>
              
              {isHeroDropdownOpen && (
                <div className="absolute left-0 mt-1.5 w-56 bg-white border border-gray-100 rounded-lg shadow-lg py-1 z-30">
                  <button
                    id="admin-subtab-pathdan-update"
                    onClick={() => {
                      setActiveAdminSubTab("pathdan_update");
                      setIsHeroDropdownOpen(false);
                    }}
                    className={`flex items-center space-x-2 w-full text-left px-4 py-2 text-xs font-bold ${
                      activeAdminSubTab === "pathdan_update"
                        ? "bg-emerald-50 text-emerald-850"
                        : "text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    <div className="h-1.5 w-1.5 rounded-full bg-amber-500"></div>
                    <span>এক নজরে পাঠদান আপডেট</span>
                  </button>
                </div>
              )}
            </div>

            {/* Website Settings Tab with Dropdown */}
            <div className="relative">
              <button
                id="admin-settings-dropdown-trigger"
                onClick={() => {
                  setIsSettingsDropdownOpen(!isSettingsDropdownOpen);
                  setIsNoticeDropdownOpen(false);
                  setIsHeroDropdownOpen(false);
                  setIsMenuBarDropdownOpen(false);
                }}
                className={`flex items-center space-x-1.5 px-4 py-2.5 rounded-lg text-xs font-bold transition-all ${
                  activeAdminSubTab === "settings" || activeAdminSubTab === "hero_background"
                    ? "bg-emerald-800 text-white shadow-sm"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                <Settings className="h-4 w-4 text-amber-500" />
                <span>ওয়েবসাইট সেটিংস</span>
                <ChevronDown className={`h-3 w-3 transition-transform duration-200 ${isSettingsDropdownOpen ? "rotate-180" : ""}`} />
              </button>
              
              {isSettingsDropdownOpen && (
                <div className="absolute left-0 mt-1.5 w-56 bg-white border border-gray-100 rounded-lg shadow-lg py-1 z-30">
                  <button
                    id="admin-subtab-hero-bg-update"
                    onClick={() => {
                      setActiveAdminSubTab("hero_background");
                      setIsSettingsDropdownOpen(false);
                    }}
                    className={`flex items-center space-x-2 w-full text-left px-4 py-2 text-xs font-bold ${
                      activeAdminSubTab === "hero_background"
                        ? "bg-emerald-50 text-emerald-850"
                        : "text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    <div className="h-1.5 w-1.5 rounded-full bg-amber-500"></div>
                    <span>হিরো ব্যাকগ্রাউন্ড আপডেট</span>
                  </button>

                  <button
                    id="admin-subtab-logo-update"
                    onClick={() => {
                      setActiveAdminSubTab("settings");
                      setIsSettingsDropdownOpen(false);
                    }}
                    className={`flex items-center space-x-2 w-full text-left px-4 py-2 text-xs font-bold ${
                      activeAdminSubTab === "settings"
                        ? "bg-emerald-50 text-emerald-850"
                        : "text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    <div className="h-1.5 w-1.5 rounded-full bg-amber-500"></div>
                    <span>লগো আপডেট</span>
                  </button>
                </div>
              )}
            </div>

            {/* Homepage Update Tab with Dropdown */}
            <div className="relative">
              <button
                id="admin-homepage-dropdown-trigger"
                onClick={() => {
                  setIsHomepageDropdownOpen(!isHomepageDropdownOpen);
                  setIsNoticeDropdownOpen(false);
                  setIsHeroDropdownOpen(false);
                  setIsSettingsDropdownOpen(false);
                  setIsMenuBarDropdownOpen(false);
                }}
                className={`flex items-center space-x-1.5 px-4 py-2.5 rounded-lg text-xs font-bold transition-all ${
                  activeAdminSubTab === "contact_update"
                    ? "bg-emerald-800 text-white shadow-sm"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                <Globe className="h-4 w-4 text-amber-500" />
                <span>হোমপেজ আপডেট</span>
                <ChevronDown className={`h-3 w-3 transition-transform duration-200 ${isHomepageDropdownOpen ? "rotate-180" : ""}`} />
              </button>
              
              {isHomepageDropdownOpen && (
                <div className="absolute left-0 mt-1.5 w-56 bg-white border border-gray-100 rounded-lg shadow-lg py-1 z-30">
                  <button
                    id="admin-subtab-contact-update"
                    onClick={() => {
                      setActiveAdminSubTab("contact_update");
                      setIsHomepageDropdownOpen(false);
                    }}
                    className={`flex items-center space-x-2 w-full text-left px-4 py-2 text-xs font-bold ${
                      activeAdminSubTab === "contact_update"
                        ? "bg-emerald-50 text-emerald-850"
                        : "text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    <div className="h-1.5 w-1.5 rounded-full bg-amber-500"></div>
                    <span>কন্টাক্ট আপডেট</span>
                  </button>
                </div>
              )}
            </div>

            {/* Menu Bar Update Tab with Dropdown */}
            <div className="relative">
              <button
                id="admin-menubar-dropdown-trigger"
                onClick={() => {
                  setIsMenuBarDropdownOpen(!isMenuBarDropdownOpen);
                  setIsNoticeDropdownOpen(false);
                  setIsHeroDropdownOpen(false);
                  setIsSettingsDropdownOpen(false);
                }}
                className={`flex items-center space-x-1.5 px-4 py-2.5 rounded-lg text-xs font-bold transition-all ${
                  activeAdminSubTab === "sodosso_form_settings" || activeAdminSubTab === "kormochari_panel"
                    ? "bg-emerald-800 text-white shadow-sm"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                <Settings className="h-4 w-4 text-amber-500" />
                <span>মেনুবার আপডেট</span>
                <ChevronDown className={`h-3 w-3 transition-transform duration-200 ${isMenuBarDropdownOpen ? "rotate-180" : ""}`} />
              </button>
              
              {isMenuBarDropdownOpen && (
                <div className="absolute left-0 mt-1.5 w-56 bg-white border border-gray-100 rounded-lg shadow-lg py-1 z-30">
                  <button
                    id="admin-subtab-sodosso-form"
                    onClick={() => {
                      setActiveAdminSubTab("sodosso_form_settings");
                      setIsMenuBarDropdownOpen(false);
                    }}
                    className={`flex items-center space-x-2 w-full text-left px-4 py-2 text-xs font-bold ${
                      activeAdminSubTab === "sodosso_form_settings"
                        ? "bg-emerald-50 text-emerald-850"
                        : "text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    <div className="h-1.5 w-1.5 rounded-full bg-amber-500"></div>
                    <span>সদস্য ফরম</span>
                  </button>

                  <button
                    id="admin-subtab-kormochari-panel"
                    onClick={() => {
                      setActiveAdminSubTab("kormochari_panel");
                      setIsMenuBarDropdownOpen(false);
                    }}
                    className={`flex items-center space-x-2 w-full text-left px-4 py-2 text-xs font-bold ${
                      activeAdminSubTab === "kormochari_panel"
                        ? "bg-emerald-50 text-emerald-850"
                        : "text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-800"></div>
                    <span>কর্মচারী প্যানেল</span>
                  </button>
                </div>
              )}
            </div>

            {/* Student Management Tab with Dropdown */}
            <div className="relative">
              <button
                id="admin-student-mgmt-dropdown-trigger"
                onClick={() => {
                  setIsMenuBarDropdownOpen(false);
                  setIsNoticeDropdownOpen(false);
                  setIsHeroDropdownOpen(false);
                  setIsSettingsDropdownOpen(false);
                  setIsHomepageDropdownOpen(false);
                  setIsStudentMgmtDropdownOpen(!isStudentMgmtDropdownOpen);
                }}
                className={`flex items-center space-x-1.5 px-4 py-2.5 rounded-lg text-xs font-bold transition-all ${
                  activeAdminSubTab === "student_leave" || activeAdminSubTab === "student_attendance_check"
                    ? "bg-emerald-800 text-white shadow-sm"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                <Users className="h-4 w-4 text-amber-500" />
                <span>শিক্ষার্থী ব্যবস্থাপনা</span>
                <ChevronDown className={`h-3 w-3 transition-transform duration-200 ${isStudentMgmtDropdownOpen ? "rotate-180" : ""}`} />
              </button>
              
              {isStudentMgmtDropdownOpen && (
                <div className="absolute left-0 mt-1.5 w-56 bg-white border border-gray-100 rounded-lg shadow-lg py-1 z-30">
                  <button
                    onClick={() => {
                      setActiveAdminSubTab("student_leave");
                      setIsStudentMgmtDropdownOpen(false);
                    }}
                    className={`flex items-center space-x-2 w-full text-left px-4 py-2 text-xs font-bold ${
                      activeAdminSubTab === "student_leave"
                        ? "bg-emerald-50 text-emerald-850"
                        : "text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    <div className="h-1.5 w-1.5 rounded-full bg-amber-500"></div>
                    <span>শিক্ষার্থী ছুটি আবেদন</span>
                  </button>

                  <button
                    onClick={() => {
                      setActiveAdminSubTab("student_attendance_check");
                      setIsStudentMgmtDropdownOpen(false);
                    }}
                    className={`flex items-center space-x-2 w-full text-left px-4 py-2 text-xs font-bold ${
                      activeAdminSubTab === "student_attendance_check"
                        ? "bg-emerald-50 text-emerald-850"
                        : "text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-800"></div>
                    <span>শিক্ষার্থী হাজিরা চেক</span>
                  </button>
                </div>
              )}
            </div>

            {/* Leave Requests Dropdown Tab (ছুটির আবেদন) */}
            <div className="relative">
              <button
                id="admin-leave-mgmt-dropdown-trigger"
                onClick={() => {
                  setIsMenuBarDropdownOpen(false);
                  setIsNoticeDropdownOpen(false);
                  setIsHeroDropdownOpen(false);
                  setIsSettingsDropdownOpen(false);
                  setIsHomepageDropdownOpen(false);
                  setIsStudentMgmtDropdownOpen(false);
                  setIsLeaveDropdownOpen(!isLeaveDropdownOpen);
                }}
                className={`flex items-center space-x-1.5 px-4 py-2.5 rounded-lg text-xs font-bold transition-all ${
                  activeAdminSubTab === "leave_mgmt" || activeAdminSubTab === "teacher_leave" || activeAdminSubTab === "student_leave"
                    ? "bg-emerald-800 text-white shadow-sm"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                <ClipboardList className="h-4 w-4 text-amber-500" />
                <span>ছুটির আবেদন</span>
                <ChevronDown className={`h-3 w-3 transition-transform duration-200 ${isLeaveDropdownOpen ? "rotate-180" : ""}`} />
              </button>
              
              {isLeaveDropdownOpen && (
                <div className="absolute left-0 mt-1.5 w-56 bg-white border border-gray-100 rounded-lg shadow-lg py-1 z-30 font-alinur">
                  <button
                    id="admin-subtab-teacher-leave"
                    onClick={() => {
                      setActiveAdminSubTab("teacher_leave");
                      setIsLeaveDropdownOpen(false);
                    }}
                    className={`flex items-center space-x-2 w-full text-left px-4 py-2 text-xs font-bold ${
                      activeAdminSubTab === "teacher_leave"
                        ? "bg-emerald-50 text-emerald-850"
                        : "text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-800"></div>
                    <span>শিক্ষক ছুটির আবেদন</span>
                  </button>

                  <button
                    id="admin-subtab-student-leave"
                    onClick={() => {
                      setActiveAdminSubTab("student_leave");
                      setIsLeaveDropdownOpen(false);
                    }}
                    className={`flex items-center space-x-2 w-full text-left px-4 py-2 text-xs font-bold ${
                      activeAdminSubTab === "student_leave"
                        ? "bg-emerald-50 text-emerald-850"
                        : "text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    <div className="h-1.5 w-1.5 rounded-full bg-amber-500"></div>
                    <span>শিক্ষার্থী ছুটির আবেদন</span>
                  </button>
                </div>
              )}
            </div>

            {/* Messages tab as simple button */}
            <button
              id="admin-subtab-messages"
              onClick={() => {
                setActiveAdminSubTab("messages");
                setIsNoticeDropdownOpen(false);
                setIsHeroDropdownOpen(false);
                setIsSettingsDropdownOpen(false);
                setIsMenuBarDropdownOpen(false);
              }}
              className={`flex items-center space-x-1.5 px-4 py-2.5 rounded-lg text-xs font-bold transition-all ${
                activeAdminSubTab === "messages"
                  ? "bg-emerald-800 text-white shadow-sm"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              <Mail className="h-4 w-4" />
              <span>কন্টাক্ট বার্তা সমূহ</span>
            </button>
          </div>

          {/* Active List Headers */}
          <div className="flex justify-between items-center font-alinur">
            <div>
              <h3 className="text-lg font-bold text-emerald-950 font-serif">
                {activeAdminSubTab === "leave_mgmt" && "ছুটির আবেদন ব্যবস্থাপনা (শিক্ষক ও শিক্ষার্থী)"}
                {activeAdminSubTab === "teacher_leave" && "শিক্ষক ছুটির আবেদন ও পর্যালোচনা"}
                {activeAdminSubTab === "student_leave" && "শিক্ষার্থী ছুটির আবেদন ও পর্যালোচনা"}
                {activeAdminSubTab === "student_attendance_check" && "শিক্ষার্থী হাজিরা ট্র্যাকিং ও ডেইলি রিপোর্ট"}
                {activeAdminSubTab === "dashboard" && "ড্যাশবোর্ড ও সার্বিক পরিসংখ্যান"}
                {activeAdminSubTab === "admissions" && "ভর্তি আবেদন ট্র্যাকিং ও পেমেন্ট আপডেট"}
                {activeAdminSubTab === "teachers" && "শিক্ষক ও ফ্যাকাল্টি লিস্ট"}
                {activeAdminSubTab === "stories" && "শিক্ষার্থীদের সাকসেস স্টোরি কার্ডসমূহ"}
                {activeAdminSubTab === "committee" && "কমিটি সদস্যবৃন্দ ও দিকনির্দেশনা"}
                {activeAdminSubTab === "honored" && "স্মরণীয় ব্যক্তিগণ তালিকা"}
                {activeAdminSubTab === "routines" && "শ্রেণী ও পরীক্ষা রুটিনসমূহ"}
                {activeAdminSubTab === "messages" && "কন্টাক্ট মেসেজ ও অফিশিয়াল বার্তা"}
                {activeAdminSubTab === "settings" && "লগো আপডেট"}
                {activeAdminSubTab === "hero_background" && "হিরো সেকশন ব্যাকগ্রাউন্ড ইমেজ কাস্টমাইজেশন"}
                {activeAdminSubTab === "running_notices" && "চলমান নোটিশবোর্ড ও লাইভ নোটিশ ফিড"}
                {activeAdminSubTab === "public_notices" && "পাবলিক নোটিশবোর্ড ও লাইভ নোটিশ কন্টেন্ট"}
                {activeAdminSubTab === "pathdan_update" && "এক নজরে পাঠদান তথ্য এডিট ও কাস্টমাইজেশন"}
                {activeAdminSubTab === "sodosso_form_settings" && "সদস্য ফরম কন্টেন্ট এডিট ও কাস্টমাইজেশন"}
                {activeAdminSubTab === "contact_update" && "প্রাতিষ্ঠানিক যোগাযোগ ও ঠিকানা আপডেট"}
                {activeAdminSubTab === "hafizgon" && "হিফজ বিভাগ - হাফেজদের তথ্য ও প্রোফাইল ডাটাবেস"}
                {activeAdminSubTab === "admin_control" && "এডমিন কন্ট্রোল প্যানেল ও সিকিউরিটি লজিক"}
                {activeAdminSubTab === "homework_subjects" && "ক্লাসভিত্তিক হোমওয়ার্ক সাবজেক্ট ম্যানেজমেন্ট"}
              </h3>
            </div>
            {activeAdminSubTab !== "dashboard" && activeAdminSubTab !== "admissions" && activeAdminSubTab !== "messages" && activeAdminSubTab !== "settings" && activeAdminSubTab !== "hero_background" && activeAdminSubTab !== "running_notices" && activeAdminSubTab !== "public_notices" && activeAdminSubTab !== "pathdan_update" && activeAdminSubTab !== "sodosso_form_settings" && activeAdminSubTab !== "contact_update" && activeAdminSubTab !== "routines" && activeAdminSubTab !== "hafizgon" && activeAdminSubTab !== "teachers" && activeAdminSubTab !== "admin_control" && activeAdminSubTab !== "leave_mgmt" && activeAdminSubTab !== "teacher_leave" && activeAdminSubTab !== "student_leave" && activeAdminSubTab !== "student_attendance_check" && activeAdminSubTab !== "homework_subjects" && (
              <button
                id="admin-add-new-btn"
                onClick={handleOpenAddForm}
                className="flex items-center space-x-1.5 bg-emerald-800 hover:bg-emerald-950 text-amber-400 font-bold py-2 px-3.5 rounded-lg text-xs shadow-sm transition-all"
              >
                <Plus className="h-4 w-4" />
                <span>নতুন যোগ করুন</span>
              </button>
            )}
          </div>

          {/* Leave Applications Management Content */}
          {(activeAdminSubTab === "leave_mgmt" || activeAdminSubTab === "teacher_leave" || activeAdminSubTab === "student_leave") && (
            <AdminLeaveManagement activeTab={activeAdminSubTab === "student_leave" ? "student" : "teacher"} toBengaliDigits={toBengaliDigits} />
          )}

          {activeAdminSubTab === "student_attendance_check" && (
            <AdminStudentManagement toBengaliDigits={toBengaliDigits} />
          )}

          {/* 0. Dashboard Overview */}
          {activeAdminSubTab === "dashboard" && (
            <div className="space-y-6 font-alinur">
              {/* Header Info */}
              <div className="bg-emerald-50 border-l-4 border-amber-500 p-4 rounded-r-xl shadow-xs">
                <h4 className="text-sm font-bold text-emerald-950">মাদ্রাসার সার্বিক রিয়েল-টাইম পরিসংখ্যান ও ড্যাশবোর্ড</h4>
                <p className="text-xs text-gray-600 mt-1">এখানে মাদ্রাসার রানিং সেশনের মোট শিক্ষার্থী, শিক্ষক, কর্মচারী এবং অনলাইন ভর্তির লাইভ ডেটা প্রদর্শিত হচ্ছে।</p>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                
                {/* 1. Total Students Card */}
                <div className="bg-white rounded-2xl p-5 border border-emerald-100 shadow-xs relative overflow-hidden flex flex-col justify-between min-h-[140px] hover:shadow-md transition-all">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-xs font-bold text-gray-500 block">মোট শিক্ষার্থী</span>
                      <div className="flex items-center gap-2 mt-2">
                        <select
                          value={selectedClass}
                          onChange={(e) => setSelectedClass(e.target.value)}
                          className="text-xs font-bold bg-emerald-50 text-emerald-900 border border-emerald-200 rounded-lg px-2 py-1 focus:outline-none"
                        >
                          <option value="All">সকল শ্রেণী</option>
                          <option value="৬ষ্ঠ শ্রেণী">৬ষ্ঠ শ্রেণী</option>
                          <option value="৭ম শ্রেণী">৭ম শ্রেণী</option>
                          <option value="৮ম শ্রেণী">৮ম শ্রেণী</option>
                          <option value="৯ম শ্রেণী">৯ম শ্রেণী</option>
                          <option value="১০ম শ্রেণী">১০ম শ্রেণী</option>
                        </select>
                      </div>
                    </div>
                    <div className="bg-emerald-50 p-2.5 rounded-xl border border-emerald-100">
                      <Users className="h-5 w-5 text-emerald-800" />
                    </div>
                  </div>
                  <div className="mt-3">
                    <StreamBuilder<any>
                      stream={studentsQuery}
                      builder={(students, loading, error) => {
                        if (loading) return <span className="text-sm font-bold text-emerald-800 animate-pulse">লোড হচ্ছে...</span>;
                        if (error) return <span className="text-xs text-red-500">ত্রুটি</span>;
                        const filtered = selectedClass === "All" 
                          ? students 
                          : students.filter(s => s.className === selectedClass);
                        return (
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-3xl font-black text-emerald-950 font-mono tracking-tight">{filtered.length}</span>
                            <span className="text-xs font-bold text-emerald-800">জন</span>
                          </div>
                        );
                      }}
                    />
                  </div>
                  <div className="absolute right-0 bottom-0 h-1.5 w-full bg-emerald-700/80"></div>
                </div>

                {/* 2. Total Teachers Card */}
                <div className="bg-white rounded-2xl p-5 border border-emerald-100 shadow-xs relative overflow-hidden flex flex-col justify-between min-h-[140px] hover:shadow-md transition-all">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-xs font-bold text-gray-500 block">মোট শিক্ষক</span>
                      <span className="text-[11px] font-bold text-emerald-700 block mt-1">শিক্ষক প্যানেল</span>
                    </div>
                    <div className="bg-emerald-50 p-2.5 rounded-xl border border-emerald-100">
                      <GraduationCap className="h-5 w-5 text-emerald-800" />
                    </div>
                  </div>
                  <div className="mt-3">
                    <StreamBuilder<any>
                      stream={teachersQuery}
                      builder={(teachers, loading, error) => {
                        if (loading) return <span className="text-sm font-bold text-emerald-800 animate-pulse">লোড হচ্ছে...</span>;
                        if (error) return <span className="text-xs text-red-500">ত্রুটি</span>;
                        return (
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-3xl font-black text-emerald-950 font-mono tracking-tight">{teachers.length}</span>
                            <span className="text-xs font-bold text-emerald-800">জন</span>
                          </div>
                        );
                      }}
                    />
                  </div>
                  <div className="absolute right-0 bottom-0 h-1.5 w-full bg-amber-500/80"></div>
                </div>

                {/* 3. Total Employees Card */}
                <div className="bg-white rounded-2xl p-5 border border-emerald-100 shadow-xs relative overflow-hidden flex flex-col justify-between min-h-[140px] hover:shadow-md transition-all">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-xs font-bold text-gray-500 block">মোট কর্মচারী</span>
                      <span className="text-[11px] font-bold text-emerald-700 block mt-1">কর্মচারী প্যানেল</span>
                    </div>
                    <div className="bg-emerald-50 p-2.5 rounded-xl border border-emerald-100">
                      <Users className="h-5 w-5 text-emerald-800" />
                    </div>
                  </div>
                  <div className="mt-3">
                    <StreamBuilder<any>
                      stream={employeesQuery}
                      builder={(employees, loading, error) => {
                        if (loading) return <span className="text-sm font-bold text-emerald-800 animate-pulse">লোড হচ্ছে...</span>;
                        if (error) return <span className="text-xs text-red-500">ত্রুটি</span>;
                        return (
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-3xl font-black text-emerald-950 font-mono tracking-tight">{employees.length}</span>
                            <span className="text-xs font-bold text-emerald-800">জন</span>
                          </div>
                        );
                      }}
                    />
                  </div>
                  <div className="absolute right-0 bottom-0 h-1.5 w-full bg-emerald-850"></div>
                </div>

                {/* 4. Pending Applications Card */}
                <div className="bg-white rounded-2xl p-5 border border-emerald-100 shadow-xs relative overflow-hidden flex flex-col justify-between min-h-[140px] hover:shadow-md transition-all">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-xs font-bold text-gray-500 block">পেন্ডিং আবেদন</span>
                      <span className="text-[11px] font-bold text-red-600 block mt-1">অনলাইন ভর্তি</span>
                    </div>
                    <div className="bg-red-50 p-2.5 rounded-xl border border-red-100">
                      <Mail className="h-5 w-5 text-red-600" />
                    </div>
                  </div>
                  <div className="mt-3">
                    <StreamBuilder<any>
                      stream={admissionsQuery}
                      builder={(admissions, loading, error) => {
                        if (loading) return <span className="text-sm font-bold text-emerald-800 animate-pulse">লোড হচ্ছে...</span>;
                        if (error) return <span className="text-xs text-red-500">ত্রুটি</span>;
                        const pending = admissions.filter(a => a.status === "Pending");
                        return (
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-3xl font-black text-red-600 font-mono tracking-tight">{pending.length}</span>
                            <span className="text-xs font-bold text-red-600">টি</span>
                          </div>
                        );
                      }}
                    />
                  </div>
                  <div className="absolute right-0 bottom-0 h-1.5 w-full bg-red-500/85"></div>
                </div>

              </div>

              {/* Graphical Overview Block / Quick Navigation */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
                <h3 className="font-bold text-base text-emerald-950 font-serif">মাদ্রাসার ক্লাসভিত্তিক শিক্ষার্থীর সংক্ষিপ্ত বিবরণী</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs sm:text-sm">
                    <thead>
                      <tr className="bg-emerald-50 text-emerald-950 font-bold border-b border-gray-100">
                        <th className="p-3">শ্রেণী</th>
                        <th className="p-3">রোল রেঞ্জ</th>
                        <th className="p-3 text-center">মোট শিক্ষার্থী</th>
                        <th className="p-3 text-center">স্ট্যাটাস</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {[
                        { name: "৬ষ্ঠ শ্রেণী", rolls: "১০১ - ১০৫" },
                        { name: "৭ম শ্রেণী", rolls: "২০১ - ২০৪" },
                        { name: "৮ম শ্রেণী", rolls: "৩০১ - ৩০৬" },
                        { name: "৯ম শ্রেণী", rolls: "৪০১ - ৪০৫" },
                        { name: "১০ম শ্রেণী", rolls: "৫০১ - ৫০৮" }
                      ].map((cls, idx) => (
                        <tr key={idx} className="hover:bg-emerald-50/10">
                          <td className="p-3 font-bold text-emerald-950">{cls.name}</td>
                          <td className="p-3 font-mono text-gray-500">{cls.rolls}</td>
                          <td className="p-3 text-center font-bold font-mono text-emerald-900">
                            {React.createElement(StreamBuilder, {
                              stream: studentsQuery,
                              builder: (students: any[]) => {
                                const count = students.filter(s => s.className === cls.name).length;
                                return <span>{count} জন</span>;
                              }
                            })}
                          </td>
                          <td className="p-3 text-center">
                            <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-100">সক্রিয়</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* 1. Admissions Tracking List with Real-Time StreamBuilder */}
          {activeAdminSubTab === "admissions" && (
            <div style={{ fontFamily: 'Alinur Tatsama' }} className="font-alinur space-y-6">
              {React.createElement(StreamBuilder, {
                stream: admissionsQuery,
                builder: (admissionsList: any[], loading: any, error: any) => {
                  if (loading) {
                    return (
                      <div className="flex flex-col items-center justify-center p-16 text-emerald-800 bg-white border border-slate-200 rounded-xl shadow-xs gap-3">
                        <span className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></span>
                        <span className="text-sm font-bold">সার্ভার থেকে ডেটা লোড হচ্ছে...</span>
                      </div>
                    );
                  }
                  if (error) {
                    return (
                      <div className="p-8 text-center text-red-500 font-bold bg-white border border-slate-200 rounded-xl shadow-xs">
                        <XCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
                        <span>ডেটা লোড করতে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।</span>
                      </div>
                    );
                  }

                  // 1. LIST VIEW
                  if (admissionView === "list") {
                    const pendingAdmissions = admissionsList.filter((adm: any) => {
                      const s = (adm.status || "pending").toLowerCase();
                      return s !== "approved" && s !== "accepted" && s !== "rejected";
                    });

                    // Compute dynamic stats based on admissionsList (which contains all records)
                    const getAdmissionDate = (adm: any): Date | null => {
                      if (adm.createdAt) {
                        try {
                          return adm.createdAt.toDate ? adm.createdAt.toDate() : new Date(adm.createdAt);
                        } catch (e) {}
                      }
                      if (adm.date) {
                        try {
                          const parts = adm.date.split("/");
                          if (parts.length === 3) {
                            const day = parseInt(parts[0], 10);
                            const month = parseInt(parts[1], 10) - 1;
                            const year = parseInt(parts[2], 10);
                            return new Date(year, month, day);
                          }
                          return new Date(adm.date);
                        } catch (e) {}
                      }
                      return null;
                    };

                    const today = new Date();
                    let todayTotal = 0;
                    let todayApproved = 0;
                    let todayRejected = 0;

                    let monthTotal = 0;
                    let monthApproved = 0;
                    let monthRejected = 0;

                    let totalAll = 0;
                    let totalApproved = 0;
                    let totalRejected = 0;

                    admissionsList.forEach((adm: any) => {
                      const status = (adm.status || "pending").toLowerCase();
                      const isAppr = status === "approved" || status === "accepted";
                      const isRej = status === "rejected";

                      totalAll++;
                      if (isAppr) totalApproved++;
                      if (isRej) totalRejected++;

                      const d = getAdmissionDate(adm);
                      if (d) {
                        const isT = d.getDate() === today.getDate() &&
                                    d.getMonth() === today.getMonth() &&
                                    d.getFullYear() === today.getFullYear();
                        if (isT) {
                          todayTotal++;
                          if (isAppr) todayApproved++;
                          if (isRej) todayRejected++;
                        }

                        const isM = d.getMonth() === today.getMonth() &&
                                    d.getFullYear() === today.getFullYear();
                        if (isM) {
                          monthTotal++;
                          if (isAppr) monthApproved++;
                          if (isRej) monthRejected++;
                        }
                      }
                    });

                    return (
                      <div className="space-y-6">
                        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                          <div className="bg-emerald-800/5 border-b border-emerald-800/10 p-5">
                            <h3 className="text-base font-bold text-emerald-950">অনলাইন ভর্তি আবেদন ট্র্যাকিং</h3>
                            <p className="text-xs text-gray-500 mt-1">শিক্ষার্থীদের জমাকৃত অনলাইন ভর্তি আবেদন রিয়েল-টাইমে পর্যবেক্ষণ ও অ্যাকাউন্ট কনফিগার করুন।</p>
                          </div>
                          <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse text-sm">
                              <thead>
                                <tr className="bg-emerald-50 text-emerald-950 font-bold border-b border-gray-200">
                                  <th className="p-4">স্ট্যাটাস</th>
                                  <th className="p-4">আবেদনের তারিখ</th>
                                  <th className="p-4">শিক্ষার্থীর নাম</th>
                                  <th className="p-4">শ্রেণী</th>
                                  <th className="p-4">আবেদন নাম্বার</th>
                                  <th className="p-4">পিতার নাম</th>
                                  <th className="p-4 text-center">অ্যাকশন</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-100">
                                {pendingAdmissions.length === 0 ? (
                                  <tr>
                                    <td colSpan={7} className="p-12 text-center text-gray-400 font-bold">
                                      কোনো অনলাইন আবেদন পাওয়া যায়নি।
                                    </td>
                                  </tr>
                                ) : (
                                  pendingAdmissions.map((adm: any) => {
                                    // Determine father name
                                    let fatherName = "N/A";
                                    if (adm.g1Relation === "বাবা") {
                                      fatherName = adm.g1Name;
                                    } else if (adm.g2Relation === "বাবা") {
                                      fatherName = adm.g2Name;
                                    } else {
                                      fatherName = adm.father_name || adm.g1Name || "N/A";
                                    }

                                    // Format submission date
                                    let submissionDateStr = "N/A";
                                    if (adm.createdAt) {
                                      try {
                                        const d = adm.createdAt.toDate ? adm.createdAt.toDate() : new Date(adm.createdAt);
                                        const rawDate = d.toLocaleDateString("en-GB"); // dd/mm/yyyy
                                        submissionDateStr = toBengaliDigits(rawDate);
                                      } catch (e) {
                                        submissionDateStr = "N/A";
                                      }
                                    } else if (adm.date) {
                                      submissionDateStr = toBengaliDigits(adm.date);
                                    }

                                    const status = adm.status || "pending";
                                    const displayStatusBn = status === "Approved" || status === "approved" || status === "accepted" ? "অনুমোদিত" : status === "Rejected" || status === "rejected" ? "বাতিল" : "পেন্ডিং";

                                    return (
                                      <tr key={adm.id} className="hover:bg-emerald-50/10">
                                        <td className="p-4">
                                          <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold border ${
                                            status === "Approved" || status === "approved" || status === "accepted"
                                              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                              : status === "Rejected" || status === "rejected"
                                              ? "bg-red-50 text-red-800 border-red-200"
                                              : "bg-amber-50 text-amber-800 border-amber-200"
                                          }`}>
                                            {displayStatusBn}
                                          </span>
                                        </td>
                                        <td className="p-4 font-bold text-gray-700">{submissionDateStr}</td>
                                        <td className="p-4 font-black text-emerald-950">{adm.studentNameBn || adm.student_name}</td>
                                        <td className="p-4 font-bold text-gray-700">{adm.admissionClass || adm.class_name || (adm as any).class}</td>
                                        <td className="p-4 font-mono text-xs font-bold text-slate-500">{adm.id}</td>
                                        <td className="p-4 text-xs text-gray-600 font-bold">{fatherName}</td>
                                        <td className="p-4 text-center">
                                          <div className="flex justify-center gap-1.5">
                                            <button
                                              onClick={() => {
                                                setSelectedAdmission(adm);
                                                setAdmissionView("detail");
                                              }}
                                              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition-all shadow-xs hover:shadow-md cursor-pointer"
                                            >
                                              বিস্তারিত
                                            </button>
                                            <button
                                              onClick={async () => {
                                                if (confirm("আপনি কি এই আবেদনটি মুছে ফেলতে চান?")) {
                                                  try {
                                                    await deleteDoc(doc(db, "admissions", adm.id));
                                                  } catch (e) {
                                                    console.error(e);
                                                  }
                                                }
                                              }}
                                              className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors cursor-pointer"
                                              title="মুছে ফেলুন"
                                            >
                                              <Trash2 className="h-4 w-4" />
                                            </button>
                                          </div>
                                        </td>
                                      </tr>
                                    );
                                  })
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>

                        {/* ৩টি ডাইনামিক স্ট্যাটিস্টিকস ও কাউন্টার কার্ড */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                          {/* Card 1: Today's Admissions */}
                          <div className="bg-gradient-to-br from-emerald-50 to-white border border-emerald-100 rounded-2xl p-6 shadow-xs relative overflow-hidden group hover:shadow-md transition-all duration-300" style={{ fontFamily: 'Alinur Tatsama' }}>
                            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full -mr-6 -mt-6 group-hover:scale-110 transition-transform duration-500"></div>
                            <div className="flex items-center gap-4">
                              <div className="p-3 bg-emerald-600/10 text-emerald-800 rounded-xl">
                                <CalendarCheck className="h-6 w-6" />
                              </div>
                              <div>
                                <p className="text-xs font-bold text-emerald-800/80 tracking-wide">আজকের অনলাইন আবেদন সংখ্যা</p>
                                <h4 className="text-3xl font-black text-emerald-950 mt-1 font-mono">{toBengaliDigits(todayTotal)}</h4>
                              </div>
                            </div>
                            <div className="mt-4 pt-4 border-t border-emerald-100/60 flex items-center justify-between text-xs font-bold text-emerald-900">
                              <span className="flex items-center gap-1.5 bg-emerald-500/10 text-emerald-800 px-2.5 py-1 rounded-lg">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                আজ গৃহীত: {toBengaliDigits(todayApproved)}
                              </span>
                              <span className="flex items-center gap-1.5 bg-red-500/10 text-red-800 px-2.5 py-1 rounded-lg">
                                <span className="w-1.5 h-1.5 rounded-full bg-red-50"></span>
                                আজ বাতিল: {toBengaliDigits(todayRejected)}
                              </span>
                            </div>
                          </div>

                          {/* Card 2: Current Month's Admissions */}
                          <div className="bg-gradient-to-br from-amber-50 to-white border border-amber-100 rounded-2xl p-6 shadow-xs relative overflow-hidden group hover:shadow-md transition-all duration-300" style={{ fontFamily: 'Alinur Tatsama' }}>
                            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full -mr-6 -mt-6 group-hover:scale-110 transition-transform duration-500"></div>
                            <div className="flex items-center gap-4">
                              <div className="p-3 bg-amber-600/10 text-amber-800 rounded-xl">
                                <CalendarRange className="h-6 w-6" />
                              </div>
                              <div>
                                <p className="text-xs font-bold text-amber-800/80 tracking-wide">চলমান মাসের অনলাইন আবেদন সংখ্যা</p>
                                <h4 className="text-3xl font-black text-amber-950 mt-1 font-mono">{toBengaliDigits(monthTotal)}</h4>
                              </div>
                            </div>
                            <div className="mt-4 pt-4 border-t border-amber-100/60 flex items-center justify-between text-xs font-bold text-amber-900">
                              <span className="flex items-center gap-1.5 bg-emerald-500/10 text-emerald-800 px-2.5 py-1 rounded-lg">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                গৃহীত: {toBengaliDigits(monthApproved)}
                              </span>
                              <span className="flex items-center gap-1.5 bg-red-500/10 text-red-800 px-2.5 py-1 rounded-lg">
                                <span className="w-1.5 h-1.5 rounded-full bg-red-50"></span>
                                বাতিল: {toBengaliDigits(monthRejected)}
                              </span>
                            </div>
                          </div>

                          {/* Card 3: Total Admissions */}
                          <div className="bg-gradient-to-br from-slate-50 to-white border border-slate-200/60 rounded-2xl p-6 shadow-xs relative overflow-hidden group hover:shadow-md transition-all duration-300" style={{ fontFamily: 'Alinur Tatsama' }}>
                            <div className="absolute top-0 right-0 w-24 h-24 bg-slate-500/5 rounded-full -mr-6 -mt-6 group-hover:scale-110 transition-transform duration-500"></div>
                            <div className="flex items-center gap-4">
                              <div className="p-3 bg-slate-600/10 text-slate-800 rounded-xl">
                                <ClipboardList className="h-6 w-6" />
                              </div>
                              <div>
                                <p className="text-xs font-bold text-slate-800/80 tracking-wide">টোটাল অনলাইন আবেদন সংখ্যা</p>
                                <h4 className="text-3xl font-black text-slate-950 mt-1 font-mono">{toBengaliDigits(totalAll)}</h4>
                              </div>
                            </div>
                            <div className="mt-4 pt-4 border-t border-slate-200 flex items-center justify-between text-xs font-bold text-slate-900">
                              <span className="flex items-center gap-1.5 bg-emerald-500/10 text-emerald-800 px-2.5 py-1 rounded-lg">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                সর্বমোট গৃহীত: {toBengaliDigits(totalApproved)}
                              </span>
                              <span className="flex items-center gap-1.5 bg-red-500/10 text-red-800 px-2.5 py-1 rounded-lg">
                                <span className="w-1.5 h-1.5 rounded-full bg-red-50"></span>
                                সর্বমোট বাতিল: {toBengaliDigits(totalRejected)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  }

                  // 2. DETAIL VIEW WITH FIELD-LEVEL VERIFICATION
                  if (admissionView === "detail" && selectedAdmission) {
                    const adm = admissionsList.find((a: any) => a.id === selectedAdmission.id) || selectedAdmission;
                    const verifiedFields = adm.verifiedFields || {};

                    // Helper to render field with toggle verify button
                    const renderVerifyField = (labelBn: string, labelEn: string, fieldKey: string, value: string) => {
                      return renderAdmissionVerifyField(adm, labelBn, labelEn, fieldKey, value);
                    };

                    const isClass6to9 = ["৬ষ্ঠ শ্রেণী", "৭ম শ্রেণী", "৮ম শ্রেণী", "৯ম শ্রেণী"].includes(adm.admissionClass || adm.class_name || (adm as any).class);

                    return (
                      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm space-y-6">
                        {/* Header Banner */}
                        <div className="bg-emerald-800 text-white p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => setAdmissionView("list")}
                              className="p-2 hover:bg-emerald-700/50 rounded-lg transition-colors cursor-pointer text-white"
                              title="পেছনে ফিরে যান"
                            >
                              <ArrowLeft className="w-5 h-5" />
                            </button>
                            <div>
                              <h3 className="text-base sm:text-lg font-bold">আবেদনপত্র ভেরিফিকেশন ও বিশদ বিবরণ</h3>
                              <p className="text-xs text-emerald-100 mt-1">শিক্ষার্থীর জমাকৃত সমস্ত ডাটা একক ফিল্ড-লেভেলে যাচাই করে অনুমোদন করুন।</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold bg-emerald-900 text-amber-300 border border-emerald-700 px-3 py-1.5 rounded-lg font-sans">
                              কোড: {adm.id}
                            </span>
                            <span className={`text-xs font-bold px-3 py-1.5 rounded-lg border ${
                              adm.status === "Approved" || adm.status === "approved" || adm.status === "accepted"
                                ? "bg-emerald-950 text-emerald-300 border-emerald-800"
                                : "bg-amber-950 text-amber-300 border-amber-800"
                            }`}>
                              অবস্থা: {adm.status === "Approved" || adm.status === "approved" || adm.status === "accepted" ? "অনুমোদিত" : "পেন্ডিং"}
                            </span>
                          </div>
                        </div>

                        <div className="p-6 space-y-8">
                          {/* 1. Student Personal Information */}
                          <div className="space-y-4">
                            <h4 className="text-sm font-bold text-emerald-900 border-b border-emerald-100 pb-2 flex items-center gap-2">
                              <span className="bg-emerald-800 text-amber-400 w-5 h-5 rounded-full flex items-center justify-center text-[10px]">১</span>
                              শিক্ষার্থীর ব্যক্তিগত তথ্য (Student Personal Info)
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {renderVerifyField("শিক্ষার্থীর নাম (বাংলা)", "Student Name BN", "studentNameBn", adm.studentNameBn || adm.student_name)}
                              {renderVerifyField("শিক্ষার্থীর নাম (ইংরেজি)", "Student Name EN", "studentNameEn", adm.studentNameEn)}
                              {renderVerifyField("ভর্তিচ্ছু শ্রেণী", "Admission Class", "admissionClass", adm.admissionClass || adm.class_name)}
                              {renderVerifyField("মোবাইল নম্বর", "Mobile Number", "applicantPhone", adm.applicantPhone || adm.phone)}
                              {renderVerifyField("রক্তের গ্রুপ", "Blood Group", "bloodGroup", adm.bloodGroup)}
                              {renderVerifyField("লিঙ্গ", "Gender", "gender", adm.gender)}
                              {renderVerifyField("জন্ম নিবন্ধন / এনআইডি", "NID / Birth Cert", "studentNid", adm.studentNid)}
                              {renderVerifyField("জন্ম তারিখ", "Date of Birth", "studentDob", adm.studentDob)}
                              {renderVerifyField("থানা", "Thana", "studentThana", adm.studentThana)}
                              {renderVerifyField("জেলা", "District", "studentDistrict", adm.studentDistrict)}
                              {renderVerifyField("বর্তমান ঠিকানা", "Present Address", "studentPresentAddress", adm.studentPresentAddress)}
                              {renderVerifyField("স্থায়ী ঠিকানা", "Permanent Address", "studentPermanentAddress", adm.studentPermanentAddress)}
                            </div>
                          </div>

                          {/* 2. Guardian 1 Information */}
                          <div className="space-y-4">
                            <h4 className="text-sm font-bold text-emerald-900 border-b border-emerald-100 pb-2 flex items-center gap-2">
                              <span className="bg-emerald-800 text-amber-400 w-5 h-5 rounded-full flex items-center justify-center text-[10px]">২</span>
                              অভিভাবক তথ্য ১ (Guardian 1 Information)
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {renderVerifyField("অভিভাবকের নাম", "Guardian Name", "g1Name", adm.g1Name || adm.father_name)}
                              {renderVerifyField("সম্পর্ক", "Relation", "g1Relation", adm.g1Relation === "অন্যান্য" ? adm.g1RelationOther : adm.g1Relation)}
                              {renderVerifyField("যোগাযোগ নাম্বার", "Contact Phone", "g1Phone", adm.g1Phone)}
                              {renderVerifyField("ইমেইল", "Email Address", "g1Email", adm.g1Email || adm.email)}
                              {renderVerifyField("এনআইডি নাম্বার", "NID Number", "g1Nid", adm.g1Nid)}
                              {renderVerifyField("জন্ম তারিখ", "Date of Birth", "g1Dob", adm.g1Dob)}
                              {renderVerifyField("থানা", "Thana", "g1Thana", adm.g1Thana)}
                              {renderVerifyField("জেলা", "District", "g1District", adm.g1District)}
                              {renderVerifyField("বর্তমান ঠিকানা", "Present Address", "g1PresentAddress", adm.g1PresentAddress)}
                              {renderVerifyField("স্থায়ী ঠিকানা", "Permanent Address", "g1PermanentAddress", adm.g1PermanentAddress)}
                            </div>
                          </div>

                          {/* 3. Guardian 2 Information */}
                          <div className="space-y-4">
                            <h4 className="text-sm font-bold text-emerald-900 border-b border-emerald-100 pb-2 flex items-center gap-2">
                              <span className="bg-emerald-800 text-amber-400 w-5 h-5 rounded-full flex items-center justify-center text-[10px]">৩</span>
                              অভিভাবক তথ্য ২ (Guardian 2 Information)
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {renderVerifyField("অভিভাবকের নাম", "Guardian Name", "g2Name", adm.g2Name || adm.mother_name)}
                              {renderVerifyField("সম্পর্ক", "Relation", "g2Relation", adm.g2Relation === "অন্যান্য" ? adm.g2RelationOther : adm.g2Relation)}
                              {renderVerifyField("যোগাযোগ নাম্বার", "Contact Phone", "g2Phone", adm.g2Phone)}
                              {renderVerifyField("ইমেইল", "Email Address", "g2Email", adm.g2Email)}
                              {renderVerifyField("এনআইডি নাম্বার", "NID Number", "g2Nid", adm.g2Nid)}
                              {renderVerifyField("জন্ম তারিখ", "Date of Birth", "g2Dob", adm.g2Dob)}
                              {renderVerifyField("থানা", "Thana", "g2Thana", adm.g2Thana)}
                              {renderVerifyField("জেলা", "District", "g2District", adm.g2District)}
                              {renderVerifyField("বর্তমান ঠিকানা", "Present Address", "g2PresentAddress", adm.g2PresentAddress)}
                              {renderVerifyField("স্থায়ী ঠিকানা", "Permanent Address", "g2PermanentAddress", adm.g2PermanentAddress)}
                            </div>
                          </div>

                          {/* 4. Extra Fields for Class 6 to 9 */}
                          {isClass6to9 && (
                            <div className="space-y-4">
                              <h4 className="text-sm font-bold text-emerald-900 border-b border-emerald-100 pb-2 flex items-center gap-2">
                                <span className="bg-emerald-800 text-amber-400 w-5 h-5 rounded-full flex items-center justify-center text-[10px]">৪</span>
                                পূর্ববর্তী প্রাতিষ্ঠানিক তথ্য (Previous Academic Info)
                              </h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {renderVerifyField("পূর্বের প্রতিষ্ঠানের নাম", "Prev Institute", "prevInstitute", adm.prevInstitute)}
                                {renderVerifyField("পূর্বের রোল", "Prev Roll", "prevRoll", adm.prevRoll)}
                                {renderVerifyField("শেষ জিপিএ (GPA)", "Prev GPA", "prevGpa", adm.prevGpa)}
                                {renderVerifyField("প্রতিষ্ঠান ত্যাগের কারণ", "Leave Reason", "prevLeaveReason", adm.prevLeaveReason)}
                                {renderVerifyField("ছাড়পত্র প্রদান করা হয়েছে?", "Clearance Doc", "prevClearance", adm.prevClearance)}
                              </div>
                            </div>
                          )}

                          {/* Approval and Rejection controls */}
                          <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4">
                            <button
                              type="button"
                              onClick={() => {
                                setRejectionAdmission(adm);
                                setRejectionReason("");
                                setShowRejectionModal(true);
                              }}
                              className="w-full sm:w-auto px-6 py-3 border-2 border-red-200 text-red-600 hover:bg-red-50 font-bold text-sm rounded-xl transition-all shadow-xs hover:shadow-sm cursor-pointer text-center"
                            >
                              আবেদনটি বাতিল করুন (Reject)
                            </button>
                            
                            <button
                              type="button"
                              onClick={async () => {
                                setConfigAdmission(adm);
                                setAccountLoginId(adm.applicantPhone || adm.phone || "");
                                setAccountPassword("");
                                setSelectedRoll("");
                                setAdmissionView("config");

                                // Precalculate next roll
                                try {
                                  const targetClass = adm.admissionClass || adm.class_name || "শিশু শ্রেণী";
                                  const studentsCol = collection(db, "students");
                                  const qClass = query(studentsCol, where("className", "==", targetClass));
                                  const snapClass = await getDocs(qClass);
                                  const currentClassSize = snapClass.size;
                                  const nextRollInt = currentClassSize + 1;
                                  const nextRollStr = nextRollInt.toString().padStart(2, "0");
                                  const nextRollBn = toBengaliDigits(nextRollStr);
                                  setSelectedRoll(nextRollBn);
                                } catch (e) {
                                  setSelectedRoll("০১");
                                }
                              }}
                              className="w-full sm:w-auto px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl transition-all shadow-md shadow-emerald-600/10 hover:shadow-lg active:scale-98 cursor-pointer text-center"
                            >
                              চূড়ান্তভাবে গ্রহণ করুন (Approve)
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  }

                  // 3. ACCOUNT CONFIGURATION PAGE
                  if (admissionView === "config" && configAdmission) {
                    const handleAccountSetupSubmit = async (e: React.FormEvent) => {
                      e.preventDefault();
                      setConfigError("");
                      
                      if (!accountLoginId.trim()) {
                        setConfigError("লগইন আইডি/মোবাইল নম্বর আবশ্যক।");
                        return;
                      }
                      if (!accountPassword || accountPassword.length <= 5) {
                        setConfigError("পাসওয়ার্ড অবশ্যই কমপক্ষে ৬ সংখ্যার হতে হবে।");
                        return;
                      }
                      if (!selectedRoll.trim()) {
                        setConfigError("রোল নম্বর আবশ্যক।");
                        return;
                      }

                      setIsConfigSaving(true);

                      try {
                        const targetClass = configAdmission.admissionClass || configAdmission.class_name || "শিশু শ্রেণী";
                        const studentsCol = collection(db, "students");
                        const qClass = query(studentsCol, where("className", "==", targetClass));
                        const snapClass = await getDocs(qClass);

                        // Check for duplicate roll in this class
                        let existingStudent: any = null;
                        snapClass.forEach((docSnap) => {
                          const sData = docSnap.data();
                          if (sData.roll && compareRolls(sData.roll, selectedRoll)) {
                            existingStudent = sData;
                          }
                        });

                        if (existingStudent) {
                          const existingName = existingStudent.studentNameBn || existingStudent.name || "অন্য";
                          setDuplicateStudentName(existingName);
                          setShowDuplicateModal(true);
                          setIsConfigSaving(false);
                          return;
                        }

                        // Save student record in students collection
                        await addDoc(collection(db, "students"), {
                          name: configAdmission.studentNameBn || configAdmission.student_name || "নতুন শিক্ষার্থী",
                          studentNameBn: configAdmission.studentNameBn || "",
                          studentNameEn: configAdmission.studentNameEn || "",
                          className: targetClass,
                          roll: selectedRoll.trim(),
                          phone: configAdmission.applicantPhone || configAdmission.phone || "",
                          email: accountLoginId.trim().toLowerCase(), // Check during login
                          loginId: accountLoginId.trim().toLowerCase(), // Check by loginId too
                          password: accountPassword,
                          createdAt: new Date().toISOString(),
                          isDynamicStudent: true,
                          bloodGroup: configAdmission.bloodGroup || "",
                          gender: configAdmission.gender || "",
                          studentNid: configAdmission.studentNid || "",
                          studentDob: configAdmission.studentDob || "",
                          studentThana: configAdmission.studentThana || "",
                          studentDistrict: configAdmission.studentDistrict || "",
                          studentPresentAddress: configAdmission.studentPresentAddress || "",
                          studentPermanentAddress: configAdmission.studentPermanentAddress || "",
                          g1Name: configAdmission.g1Name || "",
                          g1Phone: configAdmission.g1Phone || "",
                          g1Nid: configAdmission.g1Nid || "",
                        });

                        // Set admission form status to Approved
                        await setDoc(doc(db, "admissions", configAdmission.id), {
                          status: "Approved",
                          approvedAt: new Date().toISOString()
                        }, { merge: true });

                        alert(`অভিনন্দন! আবেদনটি অনুমোদিত হয়েছে। শিক্ষার্থীর জন্য ক্লাস: "${targetClass}" এবং রোল: "${selectedRoll.trim()}" বরাদ্দ করা হয়েছে।`);
                        
                        // Redirect back to list
                        setAdmissionView("list");
                        setSelectedAdmission(null);
                        setConfigAdmission(null);
                        setAccountLoginId("");
                        setAccountPassword("");
                        setSelectedRoll("");

                      } catch (err) {
                        console.error("Error configuration save:", err);
                        setConfigError("অ্যাকাউন্ট তৈরি করতে ডাটাবেস ত্রুটি হয়েছে। অনুগ্রহ করে পুনরায় চেষ্টা করুন।");
                      } finally {
                        setIsConfigSaving(false);
                      }
                    };

                    return (
                      <div className="max-w-xl mx-auto bg-white border border-slate-200 rounded-xl overflow-hidden shadow-md">
                        <div className="bg-emerald-800 text-white p-5 flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => setAdmissionView("detail")}
                            className="p-2 hover:bg-emerald-700/50 rounded-lg transition-colors cursor-pointer text-white"
                          >
                            <ArrowLeft className="w-5 h-5" />
                          </button>
                          <div>
                            <h3 className="text-base sm:text-lg font-bold">শিক্ষার্থীর অ্যাকাউন্ট কনফিগারেশন</h3>
                            <p className="text-xs text-emerald-100 mt-1">শিক্ষার্থীর জন্য স্থায়ী লগইন অ্যাকাউন্ট এবং পাসওয়ার্ড সেটআপ করুন।</p>
                          </div>
                        </div>

                        <form onSubmit={handleAccountSetupSubmit} className="p-6 space-y-5">
                          <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100 text-emerald-950 text-xs font-bold leading-relaxed space-y-1">
                            <p>আবেদনকারী: <span className="text-emerald-800 text-sm font-black">{configAdmission.studentNameBn || configAdmission.student_name}</span></p>
                            <p>ভর্তিচ্ছু শ্রেণী: <span className="text-amber-600 font-black">{configAdmission.admissionClass || configAdmission.class_name}</span></p>
                          </div>

                          <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-700 flex items-center gap-1.5 font-sans">
                              <Mail className="h-4 w-4 text-emerald-700" />
                              <span>একাউন্ট লগইন তথ্য (লগইন নাম্বার অথবা ইমেইল)</span>
                            </label>
                            <div className="relative">
                              <input
                                type="text"
                                required
                                value={accountLoginId}
                                onChange={(e) => setAccountLoginId(e.target.value)}
                                placeholder="মোবাইল নাম্বার বা ইমেইল লিখুন"
                                className={`w-full px-4 py-2.5 rounded-lg border text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-sans text-emerald-950 font-bold ${
                                  accountLoginIdStatus.status === 'duplicate' ? 'border-red-400 bg-red-50' : 
                                  accountLoginIdStatus.status === 'unique' ? 'border-emerald-500 bg-emerald-50/30' : 'border-gray-300'
                                }`}
                              />
                              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                {accountLoginIdStatus.status === 'checking' && <Loader2 className="w-4 h-4 animate-spin text-slate-400" />}
                                {accountLoginIdStatus.status === 'unique' && <CheckCircle className="w-4 h-4 text-emerald-500" />}
                                {accountLoginIdStatus.status === 'duplicate' && <XCircle className="w-4 h-4 text-red-500" />}
                              </div>
                            </div>
                            {accountLoginIdStatus.status === 'duplicate' && (
                              <p className="text-[10px] font-bold text-red-500 mt-1">⚠ এই আইডিটি ইতিমধ্যে <strong>{accountLoginIdStatus.duplicateInfo?.name}</strong> ({accountLoginIdStatus.duplicateInfo?.collection}) এর নামে ব্যবহৃত হচ্ছে।</p>
                            )}
                            <p className="text-[10px] text-gray-400 font-bold">আমরা স্বয়ংক্রিয়ভাবে আবেদনকারীর মোবাইল নম্বর প্রিপপুলেট করেছি।</p>
                          </div>

                          <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-700 flex items-center gap-1.5 font-sans">
                              <Lock className="h-4 w-4 text-emerald-700" />
                              <span>পাসওয়ার্ড (কমপক্ষে ৬ সংখ্যার হতে হবে)</span>
                            </label>
                            <input
                              type="text"
                              required
                              value={accountPassword}
                              onChange={(e) => setAccountPassword(e.target.value)}
                              placeholder="যেমন: ১২৩৪৫৬ বা s12345"
                              minLength={6}
                              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all font-sans text-emerald-950 font-bold"
                            />
                          </div>

                          {/* "Select Roll" Field with Alinur Tatsama custom font style */}
                          <div className="space-y-1" style={{ fontFamily: 'Alinur Tatsama' }}>
                            <label className="text-xs font-bold text-gray-700 flex items-center gap-1.5 font-alinur" style={{ fontFamily: 'Alinur Tatsama' }}>
                              <GraduationCap className="h-4 w-4 text-emerald-700" />
                              <span>রোল সিলেক্ট (Select Roll) *</span>
                            </label>
                            <input
                              type="text"
                              required
                              value={selectedRoll}
                              onChange={(e) => setSelectedRoll(e.target.value)}
                              placeholder="রোল নম্বর লিখুন (যেমন: ০১)"
                              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all font-alinur text-emerald-950 font-bold"
                              style={{ fontFamily: 'Alinur Tatsama' }}
                            />
                            <p className="text-[10px] text-emerald-700 font-bold" style={{ fontFamily: 'Alinur Tatsama' }}>
                              রোল নম্বরটি ইউনিক হওয়া আবশ্যক। একই শ্রেণীতে অন্য কারো এই রোল থাকলে অনুমোদন ব্লক হবে।
                            </p>
                          </div>

                          {configError && (
                            <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-lg text-xs font-bold">
                              {configError}
                            </div>
                          )}

                          <button
                            type="submit"
                            disabled={isConfigSaving || accountLoginIdStatus.status === 'duplicate'}
                            className="w-full bg-emerald-800 hover:bg-emerald-950 text-amber-400 hover:text-amber-300 font-bold py-3.5 rounded-xl shadow-md transition-all flex items-center justify-center space-x-2 text-sm disabled:bg-emerald-700 cursor-pointer active:scale-98 font-alinur"
                            style={{ fontFamily: 'Alinur Tatsama' }}
                          >
                            <span style={{ fontFamily: 'Alinur Tatsama' }}>
                              {isConfigSaving ? "অ্যাকাউন্ট তৈরি হচ্ছে..." : "অ্যাকাউন্ট তৈরি ও আবেদন গ্রহণ করুন"}
                            </span>
                          </button>
                        </form>
                      </div>
                    );
                  }

                  return null;
                }
              })}

              {/* Rejection Reason Modal */}
              <AnimatePresence>
                {showRejectionModal && rejectionAdmission && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 0.6 }}
                      exit={{ opacity: 0 }}
                      onClick={() => {
                        if (!isRejectionSaving) {
                          setShowRejectionModal(false);
                          setRejectionAdmission(null);
                        }
                      }}
                      className="absolute inset-0 bg-black/80 backdrop-blur-xs"
                    />

                    {/* Modal Body */}
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: 20 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: 20 }}
                      className="relative bg-white w-full max-w-md rounded-2xl p-6 md:p-8 shadow-2xl border border-red-100 overflow-hidden text-left"
                      style={{ fontFamily: 'Alinur Tatsama' }}
                    >
                      {/* Top Accent Strip */}
                      <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-red-600 to-amber-500"></div>

                      <div className="flex items-center gap-3 mb-6">
                        <div className="p-3 bg-red-50 text-red-600 rounded-xl">
                          <XCircle className="w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="text-lg font-black text-slate-900">ভর্তি আবেদন বাতিলকরণ</h3>
                          <p className="text-xs text-slate-500 font-bold">আবেদনটি বাতিলের সুনির্দিষ্ট কারণ উল্লেখ করুন</p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/60 text-xs font-bold leading-relaxed space-y-1 text-slate-800">
                          <p>শিক্ষার্থী: <span className="text-emerald-900 text-sm font-black">{rejectionAdmission.studentNameBn || rejectionAdmission.student_name}</span></p>
                          <p>ভর্তিচ্ছু শ্রেণী: <span className="text-amber-600 font-black">{rejectionAdmission.admissionClass || rejectionAdmission.class_name}</span></p>
                          <p>মোবাইল নম্বর: <span className="text-slate-600 font-black font-mono">{rejectionAdmission.applicantPhone || rejectionAdmission.phone}</span></p>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1.5">বাতিলকরণের কারণ লিখুন *</label>
                          <textarea
                            required
                            rows={4}
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            placeholder="যেমন: প্রয়োজনীয় কাগজপত্র অসম্পূর্ণ অথবা অভিভাবকের তথ্যে গড়মিল থাকার কারণে আবেদনটি বাতিল হয়েছে।"
                            className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition-all text-slate-900 font-semibold"
                            style={{ fontFamily: 'Alinur Tatsama' }}
                          />
                        </div>

                        <div className="flex justify-end gap-3 pt-4">
                          <button
                            type="button"
                            disabled={isRejectionSaving}
                            onClick={() => {
                              setShowRejectionModal(false);
                              setRejectionAdmission(null);
                            }}
                            className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition-all cursor-pointer"
                          >
                            বন্ধ করুন
                          </button>
                          
                          <button
                            type="button"
                            disabled={isRejectionSaving || !rejectionReason.trim()}
                            onClick={async () => {
                              if (!rejectionReason.trim()) return;
                              setIsRejectionSaving(true);
                              try {
                                await setDoc(
                                  doc(db, "admissions", rejectionAdmission.id),
                                  {
                                    status: "rejected",
                                    rejectionReason: rejectionReason.trim(),
                                    rejectedAt: new Date().toISOString()
                                  },
                                  { merge: true }
                                );
                                alert("আবেদনটি বাতিল করা হয়েছে এবং বাতিলের কারণ সংরক্ষণ করা হয়েছে।");
                                setShowRejectionModal(false);
                                setRejectionAdmission(null);
                                setRejectionReason("");
                                setAdmissionView("list");
                              } catch (e) {
                                console.error("Error rejecting admission:", e);
                                alert("আবেদন বাতিল করতে সমস্যা হয়েছে। দয়া করে আবার চেষ্টা করুন।");
                              } finally {
                                setIsRejectionSaving(false);
                              }
                            }}
                            className="px-5 py-2.5 bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                          >
                            {isRejectionSaving ? (
                              <>
                                <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
                                <span>সংরক্ষণ হচ্ছে...</span>
                              </>
                            ) : (
                              <span>নিশ্চিত করুন</span>
                            )}
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  </div>
                )}

                {showDuplicateModal && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 0.6 }}
                      exit={{ opacity: 0 }}
                      onClick={() => setShowDuplicateModal(false)}
                      className="absolute inset-0 bg-black/80 backdrop-blur-xs"
                    />

                    {/* Modal Body */}
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: 20 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: 20 }}
                      className="relative bg-white w-full max-w-md rounded-2xl p-6 md:p-8 shadow-2xl border border-red-100 overflow-hidden text-center"
                      style={{ fontFamily: 'Alinur Tatsama' }}
                    >
                      {/* Top Accent Strip */}
                      <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-red-600 to-amber-500"></div>

                      <div className="flex flex-col items-center gap-3 mb-6">
                        <div className="p-4 bg-red-50 text-red-600 rounded-full">
                          <AlertCircle className="w-10 h-10" />
                        </div>
                        <h3 className="text-xl font-black text-slate-900 font-alinur" style={{ fontFamily: 'Alinur Tatsama' }}>রোল নম্বর ডুপ্লিকেট সতর্কতা</h3>
                      </div>

                      <div className="space-y-4">
                        <p className="text-base font-bold text-slate-700 leading-relaxed font-alinur" style={{ fontFamily: 'Alinur Tatsama' }}>
                          এই রোলটি ({duplicateStudentName}) শিক্ষার্থীর। অনুগ্রহ করে অন্য রোল সিলেক্ট করুন।
                        </p>

                        <div className="pt-4">
                          <button
                            type="button"
                            onClick={() => setShowDuplicateModal(false)}
                            className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-bold text-sm rounded-xl transition-all shadow-md shadow-red-600/10 cursor-pointer font-alinur"
                            style={{ fontFamily: 'Alinur Tatsama' }}
                          >
                            অন্য রোল সিলেক্ট করুন
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  </div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* 2. Teachers List Management */}
          {activeAdminSubTab === "teachers" && (
            <TeacherManagement />
          )}

          {activeAdminSubTab === "teacher_attendance" && (
            <AdminAttendanceSection toBengaliDigits={toBengaliDigits} />
          )}

          {/* 3. Success Stories List Management */}
          {activeAdminSubTab === "stories" && (
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-emerald-50 text-emerald-950 font-bold border-b border-gray-100">
                    <th className="p-4">ছবি</th>
                    <th className="p-4">শিক্ষার্থীর নাম</th>
                    <th className="p-4">সাফল্য / বিবরণ</th>
                    <th className="p-4">বছর</th>
                    <th className="p-4 text-center">অ্যাকশন</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {stories.map((item) => (
                    <tr key={item.id} className="hover:bg-emerald-50/10">
                      <td className="p-4">
                        <img src={item.imageUrl} alt="" className="w-12 h-10 object-cover rounded-md border" />
                      </td>
                      <td className="p-4 font-bold">{item.student_name}</td>
                      <td className="p-4 text-xs text-gray-600 max-w-sm truncate">{item.achievement}</td>
                      <td className="p-4 font-mono font-bold">{item.year}</td>
                      <td className="p-4 text-center">
                        <div className="flex justify-center space-x-2">
                          <button onClick={() => handleEdit(item, "stories")} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded">
                            <Edit3 className="h-4 w-4" />
                          </button>
                          <button onClick={() => handleDelete(item.id, "success_stories")} className="p-1.5 text-red-600 hover:bg-red-50 rounded">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* 4. Committee List Management */}
          {activeAdminSubTab === "committee" && (
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-emerald-50 text-emerald-950 font-bold border-b border-gray-100">
                    <th className="p-4">সদস্য ছবি</th>
                    <th className="p-4">নাম</th>
                    <th className="p-4">পদবী</th>
                    <th className="p-4">ক্রম (Rank)</th>
                    <th className="p-4">বাণী / বক্তব্য</th>
                    <th className="p-4 text-center">অ্যাকশন</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {committee.map((item) => (
                    <tr key={item.id} className="hover:bg-emerald-50/10">
                      <td className="p-4">
                        <img src={item.imageUrl} alt="" className="w-10 h-10 object-cover rounded-full border border-emerald-500" />
                      </td>
                      <td className="p-4 font-bold">{item.name}</td>
                      <td className="p-4 text-amber-800 font-bold">{item.role}</td>
                      <td className="p-4 font-mono">{item.rank}</td>
                      <td className="p-4 text-xs max-w-xs truncate">{item.speech || "বাণী নেই"}</td>
                      <td className="p-4 text-center">
                        <div className="flex justify-center space-x-2">
                          <button onClick={() => handleEdit(item, "committee")} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded">
                            <Edit3 className="h-4 w-4" />
                          </button>
                          <button onClick={() => handleDelete(item.id, "committee")} className="p-1.5 text-red-600 hover:bg-red-50 rounded">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* 5. Honored Persons List Management */}
          {activeAdminSubTab === "honored" && (
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-emerald-50 text-emerald-950 font-bold border-b border-gray-100">
                    <th className="p-4">ছবি</th>
                    <th className="p-4">স্মরণীয় ব্যক্তিত্ব নাম</th>
                    <th className="p-4">জন্ম ও মৃত্যু সাল</th>
                    <th className="p-4">অবদান ও হিতৈষণা বিবরণ</th>
                    <th className="p-4 text-center">অ্যাকশন</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {honored.map((item) => (
                    <tr key={item.id} className="hover:bg-emerald-50/10">
                      <td className="p-4">
                        <img src={item.imageUrl} alt="" className="w-10 h-10 object-cover rounded-full border" />
                      </td>
                      <td className="p-4 font-bold">{item.name}</td>
                      <td className="p-4 font-mono text-emerald-800 font-bold">{item.birth_death}</td>
                      <td className="p-4 text-xs max-w-sm truncate">{item.contribution}</td>
                      <td className="p-4 text-center">
                        <div className="flex justify-center space-x-2">
                          <button onClick={() => handleEdit(item, "honored")} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded">
                            <Edit3 className="h-4 w-4" />
                          </button>
                          <button onClick={() => handleDelete(item.id, "honored_persons")} className="p-1.5 text-red-600 hover:bg-red-50 rounded">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* 6. Routines List Management with dedicated class routine sub-menu & form validation */}
          {activeAdminSubTab === "routines" && (
            <div className="space-y-6 font-alinur" style={{ fontFamily: '"Alinur Tatsama", "Hind Siliguri", "Anek Bangla", sans-serif' }}>
              {/* Local Sub-Menu bar */}
              <div className="flex border-b border-gray-200 pb-1 gap-2">
                <button
                  onClick={() => setActiveRoutineSubMenu("class_routine")}
                  className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all ${
                    activeRoutineSubMenu === "class_routine"
                      ? "border-indigo-600 text-indigo-700 font-black"
                      : "border-transparent text-gray-500 hover:text-indigo-600"
                  }`}
                  style={{ fontFamily: '"Alinur Tatsama", "Hind Siliguri", "Anek Bangla", sans-serif' }}
                >
                  <Calendar className="h-4 w-4 text-indigo-600" />
                  <span>ক্লাস রুটিন</span>
                </button>
                <button
                  onClick={() => setActiveRoutineSubMenu("exam_routine")}
                  className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all ${
                    activeRoutineSubMenu === "exam_routine"
                      ? "border-indigo-600 text-indigo-700 font-black"
                      : "border-transparent text-gray-500 hover:text-indigo-600"
                  }`}
                  style={{ fontFamily: '"Alinur Tatsama", "Hind Siliguri", "Anek Bangla", sans-serif' }}
                >
                  <Calendar className="h-4 w-4 text-indigo-600" />
                  <span>পরীক্ষা রুটিন</span>
                </button>
              </div>

              {activeRoutineSubMenu === "class_routine" && (
                <div className="space-y-6">
                  {/* Initially Closed Form Button */}
                  {!isRoutineFormOpen && !editingRoutineId && (
                    <div className="flex justify-start">
                      <button
                        onClick={() => {
                          setIsRoutineFormOpen(true);
                          setRoutineSubjects([{ subject: "", time: "", teacherName: "", room: "" }]);
                          setRowValidationErrors([]);
                        }}
                        className="bg-indigo-700 hover:bg-indigo-850 text-white font-bold py-2.5 px-6 rounded-xl text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer"
                        style={{ fontFamily: '"Alinur Tatsama", "Hind Siliguri", "Anek Bangla", sans-serif' }}
                      >
                        <Calendar className="h-4.5 w-4.5" />
                        <span>ক্লাস রুটিন যোগ করুন</span>
                      </button>
                    </div>
                  )}

                  {/* Embedded Form Section */}
                  {(isRoutineFormOpen || editingRoutineId) && (
                    <div 
                      id="local-routine-form-section" 
                      className="bg-white border border-indigo-100 rounded-2xl shadow-xs overflow-hidden p-6 space-y-4"
                    >
                      <div className="flex items-center justify-between border-b border-indigo-50 pb-3">
                        <h4 
                          className="text-base font-black text-indigo-950 flex items-center gap-2"
                          style={{ fontFamily: '"Alinur Tatsama", "Hind Siliguri", "Anek Bangla", sans-serif' }}
                        >
                          <Calendar className="h-5 w-5 text-indigo-600" />
                          <span>{editingRoutineId ? "ক্লাস রুটিন আপডেট ও সংশোধন করুন" : "নতুন ক্লাস রুটিন তৈরি করুন"}</span>
                        </h4>
                        <button
                          onClick={handleCancelEditRoutine}
                          className="text-xs font-bold text-red-600 hover:text-red-800 flex items-center gap-1 cursor-pointer"
                          style={{ fontFamily: '"Alinur Tatsama", "Hind Siliguri", "Anek Bangla", sans-serif' }}
                        >
                          <X className="h-4 w-4" />
                          <span>ফর্ম বন্ধ করুন</span>
                        </button>
                      </div>

                      {routineSaveSuccess && (
                        <div className="bg-emerald-50 border border-emerald-150 text-emerald-800 text-xs font-bold px-4 py-3 rounded-xl">
                          ✓ ক্লাস রুটিন সফলভাবে সংরক্ষিত হয়েছে!
                        </div>
                      )}

                      <form onSubmit={handleSaveRoutine} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Class Dropdown Selection */}
                          <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                              <span>ক্লাস</span>
                              <span className="text-red-500">*</span>
                            </label>
                            <select
                              value={routineClassInput}
                              onChange={(e) => {
                                setRoutineClassInput(e.target.value);
                                if (e.target.value) setRoutineClassError("");
                              }}
                              className={`w-full bg-slate-50 border ${routineClassError ? "border-red-400 focus:ring-red-500" : "border-indigo-100 focus:ring-indigo-500"} rounded-xl px-3 py-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2`}
                              style={{ fontFamily: '"Alinur Tatsama", "Hind Siliguri", "Anek Bangla", sans-serif' }}
                            >
                              <option value="">-- ক্লাস সিলেক্ট করুন --</option>
                              <option value="শিশু শ্রেণি">শিশু শ্রেণি</option>
                              <option value="১ম শ্রেণি">১ম শ্রেণি</option>
                              <option value="২য় শ্রেণি">২য় শ্রেণি</option>
                              <option value="৩য় শ্রেণি">৩য় শ্রেণি</option>
                              <option value="৪র্থ শ্রেণি">৪র্থ শ্রেণি</option>
                              <option value="৫ম শ্রেণি">৫ম শ্রেণি</option>
                              <option value="৬ষ্ঠ শ্রেণি">৬ষ্ঠ শ্রেণি</option>
                              <option value="৭ম শ্রেণি">৭ম শ্রেণি</option>
                              <option value="৮ম শ্রেণি">৮ম শ্রেণি</option>
                              <option value="৯ম শ্রেণি">৯ম শ্রেণি</option>
                              <option value="১০ম শ্রেণি">১০ম শ্রেণি</option>
                            </select>
                            {routineClassError && (
                              <p className="text-red-500 text-[10px] font-bold mt-1">{routineClassError}</p>
                            )}
                          </div>

                          {/* Day Dropdown Selection */}
                          <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                              <span>দিন</span>
                              <span className="text-red-500">*</span>
                            </label>
                            <select
                              value={routineDayInput}
                              onChange={(e) => {
                                setRoutineDayInput(e.target.value);
                                if (e.target.value) setRoutineDayError("");
                              }}
                              className={`w-full bg-slate-50 border ${routineDayError ? "border-red-400 focus:ring-red-500" : "border-indigo-100 focus:ring-indigo-500"} rounded-xl px-3 py-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2`}
                              style={{ fontFamily: '"Alinur Tatsama", "Hind Siliguri", "Anek Bangla", sans-serif' }}
                            >
                              <option value="">-- দিন সিলেক্ট করুন --</option>
                              <option value="শনিবার">শনিবার</option>
                              <option value="রবিবার">রবিবার</option>
                              <option value="সোমবার">সোমবার</option>
                              <option value="মঙ্গলবার">মঙ্গলবার</option>
                              <option value="বুধবার">বুধবার</option>
                              <option value="বৃহস্পতিবার">বৃহস্পতিবার</option>
                            </select>
                            {routineDayError && (
                              <p className="text-red-500 text-[10px] font-bold mt-1">{routineDayError}</p>
                            )}
                          </div>
                        </div>

                        {/* Dynamic Subject Rows */}
                        <div className="space-y-4 pt-4 border-t border-indigo-50">
                          <div className="flex justify-between items-center">
                            <h5 className="text-xs font-black text-indigo-950">রুটিন বিষয়সমূহের তালিকা</h5>
                            {!editingRoutineId && (
                              <button
                                type="button"
                                onClick={handleAddSubjectRow}
                                className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold py-1.5 px-3 rounded-lg text-xs flex items-center gap-1 cursor-pointer transition-colors"
                              >
                                <span>+ সাবজেক্ট যোগ করুন</span>
                              </button>
                            )}
                          </div>

                          <div className="space-y-3">
                            {routineSubjects.map((row, index) => (
                              <div 
                                key={index} 
                                className="bg-slate-50/50 p-4 rounded-xl border border-slate-100 space-y-3 relative md:space-y-0 md:grid md:grid-cols-4 md:gap-3 md:items-end"
                              >
                                {/* Subject Name */}
                                <div className="space-y-1">
                                  <label className="text-[11px] font-bold text-slate-600 block">বিষয় (Subject) *</label>
                                  <input
                                    type="text"
                                    value={row.subject}
                                    onChange={(e) => handleUpdateSubjectRowField(index, "subject", e.target.value)}
                                    placeholder="এখানে সাবজেক্ট এর নাম লিখুন"
                                    className={`w-full bg-white border ${
                                      rowValidationErrors[index]?.subject ? "border-red-400 focus:ring-red-500" : "border-slate-200 focus:ring-indigo-500"
                                    } rounded-lg px-2.5 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2`}
                                    style={{ fontFamily: '"Alinur Tatsama", "Hind Siliguri", "Anek Bangla", sans-serif' }}
                                  />
                                </div>

                                {/* Time */}
                                <div className="space-y-1">
                                  <label className="text-[11px] font-bold text-slate-600 block">সময় ও ঘণ্টা *</label>
                                  <input
                                    type="text"
                                    value={row.time}
                                    onChange={(e) => handleUpdateSubjectRowField(index, "time", e.target.value)}
                                    placeholder="যেমন: ০৯:০০ AM"
                                    className={`w-full bg-white border ${
                                      rowValidationErrors[index]?.time ? "border-red-400 focus:ring-red-500" : "border-slate-200 focus:ring-indigo-500"
                                    } rounded-lg px-2.5 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2`}
                                    style={{ fontFamily: '"Alinur Tatsama", "Hind Siliguri", "Anek Bangla", sans-serif' }}
                                  />
                                </div>

                                {/* Teacher */}
                                <div className="space-y-1">
                                  <label className="text-[11px] font-bold text-slate-600 block">দ্বায়িত্বপ্রাপ্ত শিক্ষক *</label>
                                  <input
                                    type="text"
                                    value={row.teacherName}
                                    onChange={(e) => handleUpdateSubjectRowField(index, "teacherName", e.target.value)}
                                    placeholder="शिक्षকের নাম"
                                    className={`w-full bg-white border ${
                                      rowValidationErrors[index]?.teacherName ? "border-red-400 focus:ring-red-500" : "border-slate-200 focus:ring-indigo-500"
                                    } rounded-lg px-2.5 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2`}
                                    style={{ fontFamily: '"Alinur Tatsama", "Hind Siliguri", "Anek Bangla", sans-serif' }}
                                  />
                                </div>

                                {/* Room Number + Delete row */}
                                <div className="flex gap-2 items-center">
                                  <div className="space-y-1 flex-1">
                                    <label className="text-[11px] font-bold text-slate-600 block">কক্ষ নম্বর (ঐচ্ছিক)</label>
                                    <input
                                      type="text"
                                      value={row.room}
                                      onChange={(e) => handleUpdateSubjectRowField(index, "room", e.target.value)}
                                      placeholder="যেমন: ১০১"
                                      className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                      style={{ fontFamily: '"Alinur Tatsama", "Hind Siliguri", "Anek Bangla", sans-serif' }}
                                    />
                                  </div>

                                  {routineSubjects.length > 1 && !editingRoutineId && (
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveSubjectRow(index)}
                                      className="p-2 bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 rounded-lg mt-5 cursor-pointer transition-colors"
                                      title="বাদ দিন"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Form action buttons */}
                        <div className="flex justify-end gap-2 pt-2 border-t border-indigo-50">
                          <button
                            type="button"
                            onClick={handleCancelEditRoutine}
                            className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-2.5 px-5 rounded-xl text-xs transition-all cursor-pointer"
                            style={{ fontFamily: '"Alinur Tatsama", "Hind Siliguri", "Anek Bangla", sans-serif' }}
                          >
                            বাতিল করুন
                          </button>
                          <button
                            type="submit"
                            className="bg-indigo-700 hover:bg-indigo-850 text-white font-bold py-2.5 px-6 rounded-xl text-xs shadow-sm transition-all cursor-pointer"
                            style={{ fontFamily: '"Alinur Tatsama", "Hind Siliguri", "Anek Bangla", sans-serif' }}
                          >
                            {editingRoutineId ? "আপডেট করুন" : "রুটিন প্রকাশ করুন"}
                          </button>
                        </div>
                      </form>
                    </div>
                  )}

                  {/* Class Routines Table List */}
                  <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                    <div className="bg-slate-50 px-5 py-4 border-b border-gray-100 flex justify-between items-center">
                      <h4 
                        className="text-xs font-bold text-slate-700"
                        style={{ fontFamily: '"Alinur Tatsama", "Hind Siliguri", "Anek Bangla", sans-serif' }}
                      >
                        মোট ক্লাস রুটিন শিডিউল তালিকা ({routines.filter(r => r.type === "class").length} টি)
                      </h4>
                    </div>

                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50/50 text-slate-700 font-bold border-b border-gray-100">
                          <th className="p-4" style={{ fontFamily: '"Alinur Tatsama", "Hind Siliguri", "Anek Bangla", sans-serif' }}>শ্রেণী</th>
                          <th className="p-4" style={{ fontFamily: '"Alinur Tatsama", "Hind Siliguri", "Anek Bangla", sans-serif' }}>বিষয়</th>
                          <th className="p-4" style={{ fontFamily: '"Alinur Tatsama", "Hind Siliguri", "Anek Bangla", sans-serif' }}>সময় ও ঘণ্টা</th>
                          <th className="p-4" style={{ fontFamily: '"Alinur Tatsama", "Hind Siliguri", "Anek Bangla", sans-serif' }}>দিন</th>
                          <th className="p-4" style={{ fontFamily: '"Alinur Tatsama", "Hind Siliguri", "Anek Bangla", sans-serif' }}>শিক্ষক</th>
                          <th className="p-4" style={{ fontFamily: '"Alinur Tatsama", "Hind Siliguri", "Anek Bangla", sans-serif' }}>কক্ষ</th>
                          <th className="p-4 text-center" style={{ fontFamily: '"Alinur Tatsama", "Hind Siliguri", "Anek Bangla", sans-serif' }}>অ্যাকশন</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {routines
                          .filter((item) => item.type === "class")
                          .map((item) => (
                            <tr key={item.id} className="hover:bg-slate-50/50">
                              <td className="p-4 font-bold text-slate-800" style={{ fontFamily: '"Alinur Tatsama", "Hind Siliguri", "Anek Bangla", sans-serif' }}>{item.className}</td>
                              <td className="p-4 text-slate-800" style={{ fontFamily: '"Alinur Tatsama", "Hind Siliguri", "Anek Bangla", sans-serif' }}>{item.subject}</td>
                              <td className="p-4 font-mono font-bold text-slate-600">{item.time}</td>
                              <td className="p-4 font-bold text-slate-700" style={{ fontFamily: '"Alinur Tatsama", "Hind Siliguri", "Anek Bangla", sans-serif' }}>{item.dayOrDate}</td>
                              <td className="p-4 font-bold text-slate-700" style={{ fontFamily: '"Alinur Tatsama", "Hind Siliguri", "Anek Bangla", sans-serif' }}>{item.teacherName || "অনির্দিষ্ট"}</td>
                              <td className="p-4 font-bold text-slate-500" style={{ fontFamily: '"Alinur Tatsama", "Hind Siliguri", "Anek Bangla", sans-serif' }}>{item.room}</td>
                              <td className="p-4 text-center">
                                <div className="flex justify-center space-x-2">
                                  <button
                                    onClick={() => handleEditRoutineLocal(item)}
                                    className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded cursor-pointer"
                                    title="সম্পাদনা করুন"
                                  >
                                    <Edit3 className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={() => handleDelete(item.id, "routines")}
                                    className="p-1.5 text-red-600 hover:bg-red-50 rounded cursor-pointer"
                                    title="মুছে ফেলুন"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        {routines.filter((item) => item.type === "class").length === 0 && (
                          <tr>
                            <td colSpan={7} className="p-8 text-center text-gray-400 font-bold" style={{ fontFamily: '"Alinur Tatsama", "Hind Siliguri", "Anek Bangla", sans-serif' }}>
                              কোনো ক্লাস রুটিন তথ্য পাওয়া যায়নি।
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeRoutineSubMenu === "exam_routine" && (
                <div className="space-y-6">
                  {/* Initially Closed Form Button */}
                  {!isExamFormOpen && !editingExamId && (
                    <div className="flex justify-start">
                      <button
                        onClick={() => {
                          setIsExamFormOpen(true);
                          setExamSubjects([{ date: "", subject: "", time: "", totalMarks: "", subjectCode: "" }]);
                          setExamGuidelinesInput([""]);
                          setRowExamValidationErrors([]);
                        }}
                        className="bg-indigo-700 hover:bg-indigo-850 text-white font-bold py-2.5 px-6 rounded-xl text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer"
                        style={{ fontFamily: '"Alinur Tatsama", "Hind Siliguri", "Anek Bangla", sans-serif' }}
                      >
                        <Calendar className="h-4.5 w-4.5" />
                        <span>পরীক্ষা রুটিন যোগ করুন</span>
                      </button>
                    </div>
                  )}

                  {/* Embedded Exam Form Section */}
                  {(isExamFormOpen || editingExamId) && (
                    <div 
                      id="exam-routine-form-section" 
                      className="bg-white border border-indigo-100 rounded-2xl shadow-xs overflow-hidden p-6 space-y-4"
                    >
                      <div className="flex items-center justify-between border-b border-indigo-50 pb-3">
                        <h4 
                          className="text-base font-black text-indigo-950 flex items-center gap-2"
                          style={{ fontFamily: '"Alinur Tatsama", "Hind Siliguri", "Anek Bangla", sans-serif' }}
                        >
                          <Calendar className="h-5 w-5 text-indigo-600" />
                          <span>{editingExamId ? "পরীক্ষা রুটিন আপডেট ও সংশোধন করুন" : "নতুন পরীক্ষা রুটিন তৈরি করুন"}</span>
                        </h4>
                        <button
                          onClick={handleCancelEditExam}
                          className="text-xs font-bold text-red-600 hover:text-red-800 flex items-center gap-1 cursor-pointer"
                          style={{ fontFamily: '"Alinur Tatsama", "Hind Siliguri", "Anek Bangla", sans-serif' }}
                        >
                          <X className="h-4 w-4" />
                          <span>ফর্ম বন্ধ করুন</span>
                        </button>
                      </div>

                      {examSaveSuccess && (
                        <div className="bg-emerald-50 border border-emerald-150 text-emerald-800 text-xs font-bold px-4 py-3 rounded-xl">
                          ✓ পরীক্ষা রুটিন সফলভাবে সংরক্ষিত হয়েছে!
                        </div>
                      )}

                      <form onSubmit={handleSaveExamRoutine} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Class Dropdown Selection */}
                          <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                              <span>ক্লাস</span>
                              <span className="text-red-500">*</span>
                            </label>
                            <select
                              value={examClassInput}
                              onChange={(e) => {
                                setExamClassInput(e.target.value);
                                if (e.target.value) setExamClassError("");
                              }}
                              className={`w-full bg-slate-50 border ${examClassError ? "border-red-400 focus:ring-red-500" : "border-indigo-100 focus:ring-indigo-500"} rounded-xl px-3 py-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2`}
                              style={{ fontFamily: '"Alinur Tatsama", "Hind Siliguri", "Anek Bangla", sans-serif' }}
                            >
                              <option value="">-- ক্লাস সিলেক্ট করুন --</option>
                              <option value="শিশু শ্রেণি">শিশু শ্রেণি</option>
                              <option value="১ম শ্রেণি">১ম শ্রেণি</option>
                              <option value="২য় শ্রেণি">২য় শ্রেণি</option>
                              <option value="৩য় শ্রেণি">৩য় শ্রেণি</option>
                              <option value="৪র্থ শ্রেণি">৪র্থ শ্রেণি</option>
                              <option value="৫ম শ্রেণি">৫ম শ্রেণি</option>
                              <option value="৬ষ্ঠ শ্রেণি">৬ষ্ঠ শ্রেণি</option>
                              <option value="৭ম শ্রেণি">৭ম শ্রেণি</option>
                              <option value="৮ম শ্রেণি">৮ম শ্রেণি</option>
                              <option value="৯ম শ্রেণি">৯ম শ্রেণি</option>
                              <option value="১০ম শ্রেণি">১০ম শ্রেণি</option>
                            </select>
                            {examClassError && (
                              <p className="text-red-500 text-[10px] font-bold mt-1">{examClassError}</p>
                            )}
                          </div>

                          {/* Exam Name */}
                          <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                              <span>পরীক্ষার নাম</span>
                              <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              value={examNameInput}
                              onChange={(e) => {
                                setExamNameInput(e.target.value);
                                if (e.target.value) setExamNameError("");
                              }}
                              placeholder="যেমন: বার্ষিক পরীক্ষা ২০২৬, অর্ধবার্ষিক পরীক্ষা"
                              className={`w-full bg-slate-50 border ${examNameError ? "border-red-400 focus:ring-red-500" : "border-indigo-100 focus:ring-indigo-500"} rounded-xl px-3 py-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2`}
                              style={{ fontFamily: '"Alinur Tatsama", "Hind Siliguri", "Anek Bangla", sans-serif' }}
                            />
                            {examNameError && (
                              <p className="text-red-500 text-[10px] font-bold mt-1">{examNameError}</p>
                            )}
                          </div>
                        </div>

                        {/* Dynamic Subject Rows */}
                        <div className="space-y-4 pt-4 border-t border-indigo-50">
                          <div className="flex justify-between items-center">
                            <h5 className="text-xs font-black text-indigo-950">পরীক্ষার বিষয় ও সময়সূচী</h5>
                            <button
                              type="button"
                              onClick={handleAddExamSubjectRow}
                              className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold py-1.5 px-3 rounded-lg text-xs flex items-center gap-1 cursor-pointer transition-colors"
                            >
                              <span>+ বিষয় যোগ করুন</span>
                            </button>
                          </div>

                          <div className="space-y-3">
                            {examSubjects.map((row, index) => (
                              <div 
                                key={index} 
                                className="bg-slate-50/50 p-4 rounded-xl border border-slate-100 space-y-3 relative md:space-y-0 md:grid md:grid-cols-5 md:gap-3 md:items-end"
                              >
                                {/* Date */}
                                <div className="space-y-1">
                                  <label className="text-[11px] font-bold text-slate-600 block">তারিখ *</label>
                                  <input
                                    type="text"
                                    value={row.date}
                                    onChange={(e) => handleUpdateExamSubjectRowField(index, "date", e.target.value)}
                                    placeholder="যেমন: ১৫/০৭/২০২৬"
                                    className={`w-full bg-white border ${
                                      rowExamValidationErrors[index]?.date ? "border-red-400 focus:ring-red-500" : "border-slate-200 focus:ring-indigo-500"
                                    } rounded-lg px-2.5 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2`}
                                    style={{ fontFamily: '"Alinur Tatsama", "Hind Siliguri", "Anek Bangla", sans-serif' }}
                                  />
                                </div>

                                {/* Subject Name */}
                                <div className="space-y-1">
                                  <label className="text-[11px] font-bold text-slate-600 block">বিষয় *</label>
                                  <input
                                    type="text"
                                    value={row.subject}
                                    onChange={(e) => handleUpdateExamSubjectRowField(index, "subject", e.target.value)}
                                    placeholder="যেমন: কুরআন মাজীদ"
                                    className={`w-full bg-white border ${
                                      rowExamValidationErrors[index]?.subject ? "border-red-400 focus:ring-red-500" : "border-slate-200 focus:ring-indigo-500"
                                    } rounded-lg px-2.5 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2`}
                                    style={{ fontFamily: '"Alinur Tatsama", "Hind Siliguri", "Anek Bangla", sans-serif' }}
                                  />
                                </div>

                                {/* Time */}
                                <div className="space-y-1">
                                  <label className="text-[11px] font-bold text-slate-600 block">সময় *</label>
                                  <input
                                    type="text"
                                    value={row.time}
                                    onChange={(e) => handleUpdateExamSubjectRowField(index, "time", e.target.value)}
                                    placeholder="যেমন: ১০:০০ - ০১:০০"
                                    className={`w-full bg-white border ${
                                      rowExamValidationErrors[index]?.time ? "border-red-400 focus:ring-red-500" : "border-slate-200 focus:ring-indigo-500"
                                    } rounded-lg px-2.5 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2`}
                                    style={{ fontFamily: '"Alinur Tatsama", "Hind Siliguri", "Anek Bangla", sans-serif' }}
                                  />
                                </div>

                                {/* Total Marks */}
                                <div className="space-y-1">
                                  <label className="text-[11px] font-bold text-slate-600 block">নাম্বার *</label>
                                  <input
                                    type="text"
                                    value={row.totalMarks}
                                    onChange={(e) => handleUpdateExamSubjectRowField(index, "totalMarks", e.target.value)}
                                    placeholder="যেমন: ১০০"
                                    className={`w-full bg-white border ${
                                      rowExamValidationErrors[index]?.totalMarks ? "border-red-400 focus:ring-red-500" : "border-slate-200 focus:ring-indigo-500"
                                    } rounded-lg px-2.5 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2`}
                                    style={{ fontFamily: '"Alinur Tatsama", "Hind Siliguri", "Anek Bangla", sans-serif' }}
                                  />
                                </div>

                                {/* Subject Code */}
                                <div className="flex gap-2 items-center">
                                  <div className="space-y-1 flex-1">
                                    <label className="text-[11px] font-bold text-slate-600 block">বিষয় কোড *</label>
                                    <input
                                      type="text"
                                      value={row.subjectCode}
                                      onChange={(e) => handleUpdateExamSubjectRowField(index, "subjectCode", e.target.value)}
                                      placeholder="যেমন: ১০১"
                                      className={`w-full bg-white border ${
                                        rowExamValidationErrors[index]?.subjectCode ? "border-red-400 focus:ring-red-500" : "border-slate-200 focus:ring-indigo-500"
                                      } rounded-lg px-2.5 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2`}
                                      style={{ fontFamily: '"Alinur Tatsama", "Hind Siliguri", "Anek Bangla", sans-serif' }}
                                    />
                                  </div>

                                  {examSubjects.length > 1 && (
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveExamSubjectRow(index)}
                                      className="p-2 bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 rounded-lg mt-5 cursor-pointer transition-colors"
                                      title="বাদ দিন"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Guidelines (5 lines) */}
                        <div className="space-y-3 pt-4 border-t border-indigo-50">
                          <div className="flex justify-between items-center">
                            <h5 
                              className="text-xs font-black text-indigo-950"
                              style={{ fontFamily: '"Alinur Tatsama", "Hind Siliguri", "Anek Bangla", sans-serif' }}
                            >
                              পরীক্ষার্থীদের সাধারণ নির্দেশনা (সর্বোচ্চ ৫টি)
                            </h5>
                            {examGuidelinesInput.length < 5 && (
                              <button
                                type="button"
                                onClick={() => setExamGuidelinesInput([...examGuidelinesInput, ""])}
                                className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold py-1 px-2.5 rounded-lg text-[10px] flex items-center gap-1 cursor-pointer transition-colors"
                                style={{ fontFamily: '"Alinur Tatsama", "Hind Siliguri", "Anek Bangla", sans-serif' }}
                              >
                                <span>+ নির্দেশনা যোগ করুন</span>
                              </button>
                            )}
                          </div>
                          <div className="grid grid-cols-1 gap-2">
                            {examGuidelinesInput.map((gl, i) => (
                              <div key={i} className="flex items-center gap-2 animate-fade-in">
                                <span className="text-xs font-bold text-indigo-900 w-6 font-mono">
                                  {(() => {
                                    const bnDigits = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
                                    return (i + 1).toString().replace(/[0-9]/g, (d) => bnDigits[parseInt(d)]);
                                  })()}.
                                </span>
                                <input
                                  type="text"
                                  value={gl}
                                  onChange={(e) => handleUpdateExamGuideline(i, e.target.value)}
                                  placeholder="এখানে শিক্ষার্থীদের জন্য নির্দেশনা যোগ করুন"
                                  className="flex-1 bg-slate-50 border border-indigo-100 rounded-lg px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                  style={{ fontFamily: '"Alinur Tatsama", "Hind Siliguri", "Anek Bangla", sans-serif' }}
                                />
                                {examGuidelinesInput.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => setExamGuidelinesInput(examGuidelinesInput.filter((_, idx) => idx !== i))}
                                    className="p-2 bg-red-50 hover:bg-red-100 border border-red-150 text-red-600 rounded-lg cursor-pointer transition-colors"
                                    title="বাদ দিন"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Form action buttons */}
                        <div className="flex justify-end gap-2 pt-4 border-t border-indigo-50">
                          <button
                            type="button"
                            onClick={handleCancelEditExam}
                            className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-2.5 px-5 rounded-xl text-xs transition-all cursor-pointer"
                            style={{ fontFamily: '"Alinur Tatsama", "Hind Siliguri", "Anek Bangla", sans-serif' }}
                          >
                            বাতিল করুন
                          </button>
                          <button
                            type="submit"
                            className="bg-indigo-700 hover:bg-indigo-850 text-white font-bold py-2.5 px-6 rounded-xl text-xs shadow-sm transition-all cursor-pointer"
                            style={{ fontFamily: '"Alinur Tatsama", "Hind Siliguri", "Anek Bangla", sans-serif' }}
                          >
                            {editingExamId ? "আপডেট করুন" : "পরীক্ষা রুটিন প্রকাশ করুন"}
                          </button>
                        </div>
                      </form>
                    </div>
                  )}

                  {/* Exam Routines Table List */}
                  <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                    <div className="bg-slate-50 px-5 py-4 border-b border-gray-100 flex justify-between items-center">
                      <h4 
                        className="text-xs font-bold text-slate-700"
                        style={{ fontFamily: '"Alinur Tatsama", "Hind Siliguri", "Anek Bangla", sans-serif' }}
                      >
                        মোট পরীক্ষা রুটিন শিডিউল তালিকা ({routines.filter(r => r.type === "exam").length} টি)
                      </h4>
                    </div>

                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50/50 text-slate-700 font-bold border-b border-gray-100">
                          <th className="p-4" style={{ fontFamily: '"Alinur Tatsama", "Hind Siliguri", "Anek Bangla", sans-serif' }}>শ্রেণী</th>
                          <th className="p-4" style={{ fontFamily: '"Alinur Tatsama", "Hind Siliguri", "Anek Bangla", sans-serif' }}>পরীক্ষার নাম</th>
                          <th className="p-4 text-center" style={{ fontFamily: '"Alinur Tatsama", "Hind Siliguri", "Anek Bangla", sans-serif' }}>মোট বিষয়</th>
                          <th className="p-4 text-center" style={{ fontFamily: '"Alinur Tatsama", "Hind Siliguri", "Anek Bangla", sans-serif' }}>অ্যাকশন</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {routines
                          .filter((item) => item.type === "exam")
                          .map((item) => (
                            <tr key={item.id} className="hover:bg-slate-50/50">
                              <td className="p-4 font-bold text-slate-800" style={{ fontFamily: '"Alinur Tatsama", "Hind Siliguri", "Anek Bangla", sans-serif' }}>{item.className}</td>
                              <td className="p-4 text-indigo-900 font-black" style={{ fontFamily: '"Alinur Tatsama", "Hind Siliguri", "Anek Bangla", sans-serif' }}>{item.examName}</td>
                              <td className="p-4 text-center font-bold text-slate-600">{(item.subjects || []).length} টি বিষয়</td>
                              <td className="p-4 text-center">
                                <div className="flex justify-center space-x-2">
                                  <button
                                    onClick={() => handleEditExamLocal(item)}
                                    className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded cursor-pointer"
                                    title="সম্পাদনা করুন"
                                  >
                                    <Edit3 className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={() => handleDelete(item.id, "routines")}
                                    className="p-1.5 text-red-600 hover:bg-red-50 rounded cursor-pointer"
                                    title="মুছে ফেলুন"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        {routines.filter((item) => item.type === "exam").length === 0 && (
                          <tr>
                            <td colSpan={4} className="p-8 text-center text-gray-400 font-bold" style={{ fontFamily: '"Alinur Tatsama", "Hind Siliguri", "Anek Bangla", sans-serif' }}>
                              কোনো পরীক্ষা রুটিন তথ্য পাওয়া যায়নি।
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 7. Messages Received */}
          {activeAdminSubTab === "messages" && (
            <div className="space-y-4 font-alinur">
              {messages.length === 0 ? (
                <div className="p-12 text-center text-gray-400 bg-white border border-slate-200 rounded-xl font-alinur">
                  কোনো কন্টাক্ট বার্তা পাওয়া যায়নি।
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 gap-4">
                  {messages.map((msg) => {
                    const isComplaint = msg.formType === "অভিযোগ" || (!msg.formType && msg.subject.includes("নিম্নমানের") || msg.subject.includes("অনিয়ম") || msg.subject.includes("নির্যাতন"));
                    const dateStr = new Date(msg.date).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit"
                    });

                    return (
                      <div
                        key={msg.id}
                        onClick={() => setSelectedMessage(msg)}
                        className="bg-white border-2 border-slate-100 hover:border-emerald-300 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all duration-300 relative cursor-pointer select-none flex flex-col justify-between group"
                      >
                        {/* Delete Button */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(msg.id, "messages");
                          }}
                          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors z-10"
                          title="বার্তা মুছুন"
                        >
                          <Trash2 className="h-4.5 w-4.5" />
                        </button>

                        <div className="space-y-3">
                          {/* Type Badge */}
                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                              isComplaint
                                ? "bg-red-50 text-red-700 border border-red-100"
                                : "bg-emerald-50 text-emerald-700 border border-emerald-100"
                            }`}>
                              {msg.formType || (isComplaint ? "অভিযোগ" : "পরামর্শ")}
                            </span>
                          </div>

                          {/* Subject / Title */}
                          <h4 className="font-extrabold text-emerald-950 text-sm sm:text-base leading-snug group-hover:text-emerald-800 transition-colors">
                            {msg.subject}
                          </h4>
                        </div>

                        {/* Date (English Format) */}
                        <div className="pt-4 mt-2 border-t border-slate-50 flex items-center justify-between text-[11px] text-gray-500 font-sans">
                          <span>{dateStr}</span>
                          <span className="text-emerald-600 font-bold font-alinur group-hover:translate-x-1 transition-transform">
                            বিস্তারিত দেখুন →
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Expand Details Bottom Sheet / Overlay Modal */}
              <AnimatePresence>
                {selectedMessage && (
                  <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[999] font-alinur">
                    <motion.div
                      initial={{ y: 50, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ y: 50, opacity: 0 }}
                      className="bg-white rounded-3xl shadow-2xl max-w-lg w-full border-2 border-emerald-500 overflow-hidden relative"
                    >
                      {/* Top Accent Strip */}
                      <div className="h-2.5 bg-gradient-to-r from-emerald-600 via-amber-400 to-emerald-700"></div>

                      <div className="p-6 sm:p-8 space-y-6">
                        {/* Header */}
                        <div className="flex justify-between items-start gap-4">
                          <div className="space-y-1">
                            <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                              selectedMessage.formType === "অভিযোগ"
                                ? "bg-red-50 text-red-700 border border-red-100"
                                : "bg-emerald-50 text-emerald-700 border border-emerald-100"
                            }`}>
                              {selectedMessage.formType || "বার্তা"}
                            </span>
                            <h3 className="text-lg sm:text-xl font-black text-emerald-950 pt-2 leading-snug">
                              {selectedMessage.subject}
                            </h3>
                          </div>
                          <button
                            type="button"
                            onClick={() => setSelectedMessage(null)}
                            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-slate-100 rounded-lg transition-all"
                          >
                            ✕
                          </button>
                        </div>

                        {/* Submitter Info Grid */}
                        <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl text-xs text-slate-700 font-sans">
                          <div className="space-y-1">
                            <span className="text-[10px] text-gray-500 uppercase font-bold font-alinur block">প্রেরক</span>
                            <span className="font-extrabold text-emerald-950 text-[13px] font-alinur">{selectedMessage.name}</span>
                          </div>
                          <div className="space-y-1">
                            <span className="text-[10px] text-gray-500 uppercase font-bold font-alinur block">ইমেইল ঠিকানা</span>
                            <span className="break-all font-medium text-slate-800 text-[12px]">{selectedMessage.email}</span>
                          </div>
                          <div className="space-y-1">
                            <span className="text-[10px] text-gray-500 uppercase font-bold font-alinur block">ফোন নাম্বার</span>
                            <span className="font-extrabold text-emerald-900 text-[13px]">{selectedMessage.phone || "সংযুক্ত নেই"}</span>
                          </div>
                          <div className="space-y-1">
                            <span className="text-[10px] text-gray-500 uppercase font-bold font-alinur block">ঠিকানা</span>
                            <span className="font-medium text-slate-800 text-[12px] font-alinur">{selectedMessage.address || "সংযুক্ত নেই"}</span>
                          </div>
                        </div>

                        {/* Detailed Description */}
                        <div className="space-y-1.5">
                          <span className="text-xs font-bold text-emerald-900">বার্তার বিবরণ:</span>
                          <div className="bg-emerald-50/40 border border-emerald-100 rounded-2xl p-4 text-xs sm:text-sm text-emerald-950 leading-relaxed font-sans text-justify max-h-[160px] overflow-y-auto">
                            {selectedMessage.message}
                          </div>
                        </div>

                        {/* Bottom Actions */}
                        <div className="flex gap-3 pt-2">
                          <button
                            type="button"
                            onClick={() => setSelectedMessage(null)}
                            className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-3 px-4 rounded-xl text-xs transition-all active:scale-95 cursor-pointer text-center"
                          >
                            বন্ধ করুন
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const msgId = selectedMessage.id;
                              setSelectedMessage(null);
                              handleDelete(msgId, "messages");
                            }}
                            className="bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 font-bold py-3 px-4 rounded-xl text-xs transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
                          >
                            <Trash2 className="h-4 w-4" />
                            <span>বার্তা মুছুন</span>
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  </div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* 8. Website Settings */}
          {activeAdminSubTab === "settings" && (
            <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 shadow-sm space-y-6">
              <div className="border-b pb-4">
                <h4 className="text-base font-bold text-emerald-950 font-serif">মাদ্রাসার অফিসিয়াল লোগো আপলোড</h4>
                <p className="text-xs text-gray-500 mt-1">আপনার কম্পিউটার বা মোবাইল ডিভাইস থেকে লোগো ফাইলটি সিলেক্ট করে সরাসরি ওয়েবসাইট হেডার, ফুটার ও ব্যানার এ যুক্ত করুন।</p>
              </div>

              <div className="grid md:grid-cols-3 gap-8 items-center">
                {/* Logo Preview */}
                <div className="flex flex-col items-center justify-center p-4 bg-emerald-50/20 border border-dashed border-emerald-200 rounded-xl space-y-3">
                  <span className="text-xs text-emerald-800 font-bold">বর্তমান লোগো প্রিভিউ</span>
                  {websiteLogoUrl ? (
                    <img
                      src={websiteLogoUrl}
                      alt="Current logo"
                      className="h-28 w-28 object-contain rounded-full bg-white p-2 border-2 border-amber-400 shadow-sm"
                    />
                  ) : (
                    <div className="h-28 w-28 rounded-full bg-amber-500/10 border-2 border-dashed border-amber-400 flex items-center justify-center text-amber-500 font-bold text-3xl">
                      🕌
                    </div>
                  )}
                  {websiteLogoUrl && (
                    <button
                      onClick={async () => {
                        try {
                          await setDoc(doc(db, "settings", "website"), { logoUrl: "" }, { merge: true });
                          await setDoc(doc(db, "settings", "branding"), { logoUrl: "", isMainLogoUploaded: false, isLogoUploaded: false }, { merge: true });
                          setWebsiteLogoUrl("");
                          setLogoSaveSuccess(true);
                          setTimeout(() => setLogoSaveSuccess(false), 3000);
                        } catch (err) {
                          console.error("Error clearing logo:", err);
                        }
                      }}
                      className="text-xs text-red-600 hover:underline font-bold"
                    >
                      লোগোটি মুছুন
                    </button>
                  )}
                </div>

                {/* Logo Uploader Controls */}
                <div className="md:col-span-2 space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-700 block">লোগো ইমেজ ফাইল সিলেক্ট করুন</label>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <label className="bg-emerald-800 hover:bg-emerald-900 text-white font-bold px-4 py-2.5 rounded-lg text-xs cursor-pointer flex items-center justify-center gap-1.5 shadow-sm select-none">
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;

                            setLogoSaveSuccess(false);
                            const reader = new FileReader();
                            reader.onload = () => {
                              setCropZoom(1);
                              setCropX(0);
                              setCropY(0);
                              setCropFile(file);
                              setCropSrc(reader.result as string);
                              setCropFieldSetter(() => async (downloadUrl: string) => {
                                try {
                                  setIsUploading(true);
                                  await setDoc(doc(db, "settings", "website"), {
                                    logoUrl: downloadUrl,
                                    updatedAt: new Date().toISOString()
                                  }, { merge: true });
                                  await setDoc(doc(db, "settings", "branding"), {
                                    logoUrl: downloadUrl,
                                    isMainLogoUploaded: true,
                                    isLogoUploaded: true,
                                    updatedAt: new Date().toISOString()
                                  }, { merge: true });
                                  setWebsiteLogoUrl(downloadUrl);
                                  setShowLogoSuccessPopup(true);
                                } catch (error: any) {
                                  console.error("Error setting logo from cropper:", error);
                                } finally {
                                  setIsUploading(false);
                                }
                              });
                            };
                            reader.readAsDataURL(file);
                          }}
                          disabled={isUploading}
                        />
                        {isUploading ? "আপলোড হচ্ছে..." : "আপনার লোগো আপলোড করুন"}
                      </label>
                      
                      <div className="flex-1 min-w-0">
                        <input
                          type="text"
                          value={websiteLogoUrl}
                          onChange={async (e) => {
                            const val = e.target.value;
                            setWebsiteLogoUrl(val);
                            try {
                              await setDoc(doc(db, "settings", "website"), {
                                logoUrl: val,
                                updatedAt: new Date().toISOString()
                              }, { merge: true });
                              if (val) {
                                await setDoc(doc(db, "settings", "branding"), {
                                  logoUrl: val,
                                  isMainLogoUploaded: true,
                                  isLogoUploaded: true,
                                  updatedAt: new Date().toISOString()
                                }, { merge: true });
                                setShowLogoSuccessPopup(true);
                              }
                            } catch (err) {
                              console.error("Error updating logo URL manual:", err);
                            }
                          }}
                          placeholder="অথবা সরাসরি ছবির লিঙ্ক দিন (URL)"
                          className="w-full px-3 py-2 border rounded-md text-xs font-mono"
                        />
                      </div>
                    </div>
                    <p className="text-[10px] text-gray-500">সমর্থিত ফরম্যাট: .png, .jpg, .jpeg, .svg, .webp ইত্যাদি।</p>
                  </div>

                  {logoSaveSuccess && (
                    <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs px-3.5 py-2 rounded-lg font-bold flex items-center space-x-1">
                      <Check className="h-4 w-4" />
                      <span>লোগো সফলভাবে আপলোড ও আপডেট করা হয়েছে! হোমপেজে পরিবর্তন অটোমেটিক যুক্ত হয়েছে।</span>
                    </div>
                  )}
                </div>
              </div>

              {!isContactLogoUploaded && (
                <div className="mt-8 pt-6 border-t border-slate-200">
                  <div className="bg-amber-50/50 border border-amber-200 rounded-xl p-5 space-y-4">
                    <div>
                      <h4 className="text-md font-bold text-amber-900 flex items-center gap-2">
                        <span>কন্টাক্ট সেকশনের ঘূর্ণন লোগো (One-Time Upload)</span>
                      </h4>
                      <p className="text-xs text-amber-700 mt-1">
                        এই লোগোটি হোমপেজের কন্টাক্ট সেকশনে ঘুরতে থাকবে। এটি শুধুমাত্র <strong className="font-bold">একবার</strong> আপলোড করা যাবে। আপলোডের পর এই অপশনটি চিরতরে বন্ধ হয়ে যাবে।
                      </p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">
                      <label className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-4 py-2.5 rounded-lg text-xs cursor-pointer flex items-center justify-center gap-1.5 shadow-sm select-none">
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;

                            const reader = new FileReader();
                            reader.onload = () => {
                              setCropZoom(1);
                              setCropX(0);
                              setCropY(0);
                              setCropFile(file);
                              setCropSrc(reader.result as string);
                              setCropFieldSetter(() => async (downloadUrl: string) => {
                                try {
                                  setIsUploading(true);
                                  await setDoc(doc(db, "settings", "branding"), {
                                    contactLogoUrl: downloadUrl,
                                    isContactLogoUploaded: true,
                                    updatedAt: new Date().toISOString()
                                  }, { merge: true });
                                  setIsContactLogoUploaded(true);
                                  setShowLogoSuccessPopup(true);
                                } catch (error: any) {
                                  console.error("Error setting contact logo:", error);
                                } finally {
                                  setIsUploading(false);
                                }
                              });
                            };
                            reader.readAsDataURL(file);
                          }}
                          disabled={isUploading}
                        />
                        {isUploading ? "আপলোড হচ্ছে..." : "ঘূর্ণন লোগো আপলোড করুন"}
                      </label>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Hero Background Update */}
          {activeAdminSubTab === "hero_background" && (
            <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 shadow-sm space-y-6">
              <div className="border-b pb-4">
                <h4 className="text-lg font-bold text-emerald-950 font-serif">হিরো সেকশন ব্যাকগ্রাউন্ড ছবি আপডেট</h4>
                <p className="text-xs text-gray-500 mt-1">মাদ্রাসার হোম পেজের সবুজ হিরো ব্যানারটির পেছনে একটি সুন্দর ও আকর্ষণীয় ব্যাকগ্রাউন্ড ছবি যুক্ত করুন।</p>
              </div>

              <div className="grid md:grid-cols-1 gap-8">
                {/* Live Preview & Settings */}
                <div className="space-y-4">
                  <div className="bg-emerald-50/20 border border-emerald-200 rounded-xl p-4 space-y-4">
                    <span className="text-xs text-emerald-850 font-bold block">বর্তমান ব্যাকগ্রাউন্ড ইমেজ ও প্রিভিউ</span>
                    
                    {/* Interactive Hero Preview inside Admin Dashboard */}
                    <div className="relative h-44 w-full bg-emerald-950 rounded-xl overflow-hidden flex items-center justify-center border-2 border-emerald-850">
                      {heroBgUrl ? (
                        <div 
                          className="absolute inset-0 bg-cover bg-center"
                          style={{ backgroundImage: `url(${heroBgUrl})` }}
                        />
                      ) : (
                        <div className="absolute inset-0 bg-[linear-gradient(to_right,#047857_1px,transparent_1px),linear-gradient(to_bottom,#047857_1px,transparent_1px)] bg-[size:2rem_2rem] opacity-20" />
                      )}
                      
                      {/* Dark Overlay */}
                      <div className="absolute inset-0 bg-emerald-950/80 mix-blend-multiply z-0"></div>
                      
                      <div className="relative text-center z-10 px-4 space-y-1">
                        <h1 className="text-lg sm:text-xl font-bold text-amber-400 font-serif">
                          সুফিয়া নূরিয়া দাখিল মাদ্রাসা
                        </h1>
                        <p className="text-[9px] text-emerald-200 font-mono tracking-widest">
                          SUFIA NOORIA DAKHIL MADRASAH
                        </p>
                      </div>
                    </div>

                    {heroBgUrl && (
                      <div className="flex justify-between items-center bg-white p-3 rounded-lg border border-slate-100 shadow-sm text-xs">
                        <div className="truncate text-gray-600 font-mono max-w-[70%]">
                          {heroBgUrl}
                        </div>
                        <button
                          onClick={handleClearHeroBg}
                          className="text-red-600 hover:text-red-700 font-bold flex items-center space-x-1 hover:bg-red-50 px-2.5 py-1 rounded transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          <span>ছবি মুছে ফেলুন</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Upload Controls */}
                  <div className="space-y-3">
                    <div className="flex flex-col sm:flex-row gap-3 items-center">
                      <label className={`w-full sm:w-auto flex items-center justify-center space-x-2 px-5 py-3 border-2 border-dashed rounded-lg cursor-pointer transition-all font-bold text-sm ${
                        isUploadingHeroBg 
                          ? "bg-gray-50 border-gray-300 text-gray-400 cursor-not-allowed" 
                          : "bg-emerald-50 border-emerald-300 text-emerald-800 hover:bg-emerald-100"
                      }`}>
                        <Plus className="h-5 w-5" />
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              await handleHeroBgUpload(file);
                            }
                          }}
                          disabled={isUploadingHeroBg}
                        />
                        <span>{isUploadingHeroBg ? "আপলোড হচ্ছে..." : "নতুন ছবি আপলোড করুন"}</span>
                      </label>
                      
                      <div className="flex-1 w-full">
                        <input
                          type="text"
                          value={heroBgUrl}
                          onChange={async (e) => {
                            const val = e.target.value;
                            setHeroBgUrl(val);
                            try {
                              await setDoc(doc(db, "settings", "website"), {
                                heroBgUrl: val,
                                updatedAt: new Date().toISOString()
                              }, { merge: true });
                            } catch (err) {
                              console.error("Error updating hero background URL manual:", err);
                            }
                          }}
                          placeholder="অথবা সরাসরি ছবির লিঙ্ক দিন (URL)"
                          className="w-full px-3.5 py-2.5 border rounded-lg text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>
                    </div>
                    
                    {heroBgError && (
                      <div className="text-red-600 text-xs font-bold flex items-center space-x-1">
                        <XCircle className="h-4 w-4" />
                        <span>{heroBgError}</span>
                      </div>
                    )}

                    {heroBgSaveSuccess && (
                      <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs px-3.5 py-2.5 rounded-lg font-bold flex items-center space-x-1.5 shadow-sm">
                        <Check className="h-4 w-4 text-emerald-600" />
                        <span>ব্যাকগ্রাউন্ড ছবি সফলভাবে আপডেট করা হয়েছে! হোমপেজে পরিবর্তন তাৎক্ষণিকভাবে দেখতে পাবেন।</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Integration Info */}
                <div className="bg-amber-50/40 border border-amber-200/50 rounded-xl p-4 space-y-2">
                  <h5 className="text-xs font-bold text-amber-900 flex items-center space-x-1">
                    <CheckCircle2 className="h-4 w-4 text-amber-600" />
                    <span>প্রয়োজনীয় নির্দেশনা ও বৈশিষ্ট্য:</span>
                  </h5>
                  <ul className="text-[11px] text-amber-800 space-y-1.5 list-disc pl-4 leading-relaxed">
                    <li><strong>স্বয়ংক্রিয় কম্প্রেশন:</strong> সিলেক্ট করা ছবিটির সাইজ ১ মেগাবাইটের বেশি হলেও সিস্টেম স্বয়ংক্রিয়ভাবে সেটিকে অপ্টিমাইজ ও কম্প্রেস করে ছোট করবে।</li>
                    <li><strong>আকার অনুপাত (Aspect Ratio):</strong> ছবিটির আদর্শ সাইজ হলো ১৯২০ x ১০৮০ পিক্সেল (১৬:৯ ল্যান্ডস্কেপ)।</li>
                    <li><strong>রিয়েল-টাইম অটো-আপডেট:</strong> এখানে ছবি সেভ বা ডিলিট করার সাথে সাথে হোম পেজ রিলোড করা ছাড়াই ফায়ারস্টোর StreamBuilder এর মাধ্যমে সরাসরি ব্যাকগ্রাউন্ড ছবি পরিবর্তন হয়ে যাবে।</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* 9. Running Notices */}
          {activeAdminSubTab === "running_notices" && (
            <div className="space-y-6">
              {/* Add New Notice Form */}
              <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 shadow-sm space-y-4">
                <h4 className="text-base font-bold text-emerald-950 font-serif">নতুন চলমান নোটিশ যোগ করুন</h4>
                <p className="text-xs text-gray-500">চলমান নোটিশবোর্ডে সর্বোচ্চ ২টি নোটিশ সংরক্ষিত থাকবে। নতুন নোটিশ যুক্ত করলে সবচেয়ে পুরাতন নোটিশটি স্বয়ংক্রিয়ভাবে মুছে যাবে।</p>
                
                <div className="space-y-2">
                  <textarea
                    rows={3}
                    value={newNoticeText}
                    onChange={(e) => setNewNoticeText(e.target.value)}
                    placeholder="যেমন: আগামী ১০ই মার্চ মাদ্রাসার বার্ষিক ক্রীড়া প্রতিযোগিতা অনুষ্ঠিত হইবে।"
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all text-emerald-950 font-sans"
                  />
                </div>
                
                <button
                  onClick={() => handleAddRunningNotice(newNoticeText)}
                  disabled={!newNoticeText.trim() || isNoticeUploading}
                  className="bg-emerald-800 hover:bg-emerald-900 text-amber-400 font-bold px-5 py-2.5 rounded-lg text-xs shadow-sm select-none transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  <Plus className="h-4 w-4" />
                  <span>নোটিশ আপলোড করুন</span>
                </button>
              </div>

              {/* Running Notices List */}
              <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 shadow-sm space-y-4">
                <h4 className="text-base font-bold text-emerald-950 font-serif">বর্তমানে চলমান নোটিশ সমূহ</h4>
                <div className="space-y-3">
                  <StreamBuilder<any>
                    stream={runningNoticesQuery}
                    builder={(notices, loading, error) => {
                      if (loading) return <p className="text-xs text-emerald-800 animate-pulse">নোটিশ তালিকা লোড হচ্ছে...</p>;
                      if (error) return <p className="text-xs text-red-500">নোটিশ লোড করতে সমস্যা হয়েছে</p>;
                      if (!notices || notices.length === 0) {
                        return (
                          <div className="text-center py-8 text-gray-400 border border-dashed rounded-lg">
                            কোনো চলমান নোটিশ পাওয়া যায়নি।
                          </div>
                        );
                      }
                      return (
                        <div className="grid gap-4">
                          {notices.map((notice, index) => (
                            <div key={notice.id} className="p-4 rounded-xl border border-gray-100 flex items-start justify-between gap-4 bg-gray-50/50 hover:bg-gray-50 transition-colors">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                                    নোটিশ {index + 1}
                                  </span>
                                  <span className="text-[10px] text-gray-400 font-mono">
                                    {notice.createdAt ? new Date(notice.createdAt).toLocaleString("bn-BD") : ""}
                                  </span>
                                </div>
                                <p className="text-sm text-gray-800 font-medium leading-relaxed font-sans">{notice.text}</p>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditNoticeId(notice.id);
                                    setEditNoticeText(notice.text || "");
                                    setEditNoticeType("running");
                                  }}
                                  className="p-1.5 text-blue-600 hover:bg-blue-50 rounded cursor-pointer"
                                  title="সম্পাদনা করুন"
                                >
                                  <Edit3 className="h-4 w-4" />
                                </button>
                                <button
                                  type="button"
                                  disabled={false}
                                  onClick={async (e) => {
                                    e.preventDefault();
                                    if (window.confirm("আপনি কি নিশ্চিতভাবে এই নোটিশটি ডিলিট করতে চান?")) {
                                      try {
                                        await deleteDoc(doc(db, "running_notices", notice.id));
                                        alert("নোটিশটি সম্পূর্ণ মুছে ফেলা হয়েছে।");
                                      } catch (err) {
                                        console.error("Error deleting notice:", err);
                                        alert("মুছে ফেলতে ত্রুটি হয়েছে: " + (err instanceof Error ? err.message : String(err)));
                                      }
                                    }
                                  }}
                                  className="p-1.5 text-red-600 hover:bg-red-50 rounded cursor-pointer opacity-100 pointer-events-auto"
                                  title="ডিলিট করুন"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* 9b. Public Notices (Notice Public) */}
          {activeAdminSubTab === "public_notices" && (
            <div className="space-y-6">
              {/* Header with Add Notice toggle button */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between bg-emerald-50/40 border border-emerald-100 rounded-xl p-5 gap-4">
                <div>
                  <h3 className="text-base font-bold text-emerald-950 font-serif">মাদ্রাসার পাবলিক নোটিশসমূহ</h3>
                  <p className="text-xs text-gray-500">মাদ্রাসার মূল ওয়েবসাইটের নোটিশ কর্ণার পেজের নোটিশ ও জরুরি আপডেটগুলো পরিচালনা করুন।</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsPublicNoticeFormOpen(!isPublicNoticeFormOpen);
                    if (isPublicNoticeFormOpen) {
                      setPublicNoticeTitle("");
                      setPublicNoticeDescription("");
                      setPublicNoticeTitleError("");
                      setPublicNoticeDescriptionError("");
                      setEditingPublicNoticeId(null);
                    }
                  }}
                  className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 flex items-center gap-2 cursor-pointer shadow-sm select-none ${
                    isPublicNoticeFormOpen
                      ? "bg-red-50 text-red-700 hover:bg-red-100 border border-red-200"
                      : "bg-emerald-800 text-white hover:bg-emerald-950 animate-button-pulse-glow"
                  }`}
                >
                  {isPublicNoticeFormOpen ? (
                    <>
                      <X className="h-4 w-4" />
                      <span>ফর্ম বন্ধ করুন</span>
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4" />
                      <span>নোটিশ যোগ করুন</span>
                    </>
                  )}
                </button>
              </div>

              {/* Form to Add or Edit Public Notice with dynamic visibility and animation */}
              <AnimatePresence initial={false}>
                {isPublicNoticeFormOpen && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.25, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 shadow-sm space-y-4 font-alinur mt-2">
                      <h4 className="text-base font-bold text-emerald-950 font-serif">
                        {editingPublicNoticeId ? "নোটিশ তথ্য আংশিক বা সম্পূর্ণ সংশোধন করুন" : "নতুন পাবলিক নোটিশ প্রকাশ করুন"}
                      </h4>
                      <p className="text-xs text-gray-500">
                        এখান থেকে প্রকাশিত নোটিশ সরাসরি মাদ্রাসার মূল ওয়েবসাইটের "নোটিশ কর্ণার" পেজে রিয়েল-টাইমে প্রদর্শিত হবে।
                      </p>

                      <form
                        onSubmit={async (e) => {
                          e.preventDefault();
                          
                          let hasError = false;
                          if (!publicNoticeTitle.trim()) {
                            setPublicNoticeTitleError("আপনি এই ঘরটি পূরণ করেননি");
                            hasError = true;
                          } else {
                            setPublicNoticeTitleError("");
                          }

                          if (!publicNoticeDescription.trim()) {
                            setPublicNoticeDescriptionError("আপনি এই ঘরটি পূরণ করেননি");
                            hasError = true;
                          } else {
                            setPublicNoticeDescriptionError("");
                          }

                          if (hasError) return;

                          setIsPublicNoticeUploading(true);
                          try {
                            if (editingPublicNoticeId) {
                              await updateDoc(doc(db, "notices", editingPublicNoticeId), {
                                title: publicNoticeTitle,
                                description: publicNoticeDescription,
                                isEdited: true
                              });
                              alert("নোটিশটি সফলভাবে আপডেট করা হয়েছে!");
                            } else {
                              await addDoc(collection(db, "notices"), {
                                title: publicNoticeTitle,
                                description: publicNoticeDescription,
                                timestamp: serverTimestamp()
                              });
                              alert("নতুন নোটিশটি সফলভাবে প্রকাশ করা হয়েছে!");
                            }
                            setPublicNoticeTitle("");
                            setPublicNoticeDescription("");
                            setPublicNoticeTitleError("");
                            setPublicNoticeDescriptionError("");
                            setEditingPublicNoticeId(null);
                            setIsPublicNoticeFormOpen(false);
                          } catch (err) {
                            console.error("Error saving public notice:", err);
                            alert("দুঃখিত, নোটিশ সংরক্ষণ করা যায়নি।");
                          } finally {
                            setIsPublicNoticeUploading(false);
                          }
                        }}
                        className="space-y-4"
                      >
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-gray-700 block">নোটিশ টাইটেল (Title)</label>
                          <input
                            type="text"
                            value={publicNoticeTitle}
                            onChange={(e) => {
                              setPublicNoticeTitle(e.target.value);
                              if (e.target.value.trim()) {
                                setPublicNoticeTitleError("");
                              }
                            }}
                            placeholder="যেমন: দাখিল পরীক্ষা ২০২৬ এর প্রবেশপত্র বিতরণ সংক্রান্ত নোটিশ"
                            className={`w-full px-4 py-2.5 rounded-lg border text-xs focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all text-emerald-950 ${
                              publicNoticeTitleError ? "border-red-500 ring-1 ring-red-500" : "border-gray-300"
                            }`}
                          />
                          {publicNoticeTitleError && (
                            <p className="text-[11px] text-red-500 font-bold mt-1">
                              {publicNoticeTitleError}
                            </p>
                          )}
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-bold text-gray-700 block">নোটিশ বিস্তারিত বিবরণ (Body Description)</label>
                          <textarea
                            rows={5}
                            value={publicNoticeDescription}
                            onChange={(e) => {
                              setPublicNoticeDescription(e.target.value);
                              if (e.target.value.trim()) {
                                setPublicNoticeDescriptionError("");
                              }
                            }}
                            placeholder="এখানে নোটিশের বিস্তারিত বিবরণ অনুচ্ছেদ আকারে লিখুন..."
                            className={`w-full px-4 py-2.5 rounded-lg border text-xs focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all text-emerald-950 ${
                              publicNoticeDescriptionError ? "border-red-500 ring-1 ring-red-500" : "border-gray-300"
                            }`}
                          />
                          {publicNoticeDescriptionError && (
                            <p className="text-[11px] text-red-500 font-bold mt-1">
                              {publicNoticeDescriptionError}
                            </p>
                          )}
                        </div>

                        <div className="flex gap-3">
                          <button
                            type="submit"
                            disabled={isPublicNoticeUploading}
                            className="bg-emerald-800 hover:bg-emerald-900 text-white font-bold px-5 py-2.5 rounded-lg text-xs shadow-sm select-none transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
                          >
                            <Plus className="h-4 w-4" />
                            <span>{editingPublicNoticeId ? "নোটিশ আপডেট সম্পন্ন করুন" : "নোটিশ প্রকাশ করুন"}</span>
                          </button>

                          {editingPublicNoticeId && (
                            <button
                              type="button"
                              onClick={() => {
                                setPublicNoticeTitle("");
                                setPublicNoticeDescription("");
                                setPublicNoticeTitleError("");
                                setPublicNoticeDescriptionError("");
                                setEditingPublicNoticeId(null);
                                setIsPublicNoticeFormOpen(false);
                              }}
                              className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold px-5 py-2.5 rounded-lg text-xs transition-all cursor-pointer"
                            >
                              সংশোধন বাতিল করুন
                            </button>
                          )}
                        </div>
                      </form>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Published Public Notices List */}
              <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 shadow-sm space-y-4 font-alinur">
                <h4 className="text-base font-bold text-emerald-950 font-serif">ইতিপূর্বে প্রকাশিত পাবলিক নোটিশ সমূহ</h4>
                <div className="space-y-3">
                  <StreamBuilder<any>
                    stream={noticesQuery}
                    builder={(notices, loading, error) => {
                      if (loading) return <p className="text-xs text-emerald-800 animate-pulse font-bold">নোটিশ তালিকা লোড হচ্ছে...</p>;
                      if (error) return <p className="text-xs text-red-500 font-bold">নোটিশ লোড করতে সমস্যা হয়েছে</p>;
                      if (!notices || notices.length === 0) {
                        return (
                          <div className="text-center py-8 text-gray-400 border border-dashed rounded-lg text-xs font-bold">
                            কোনো পাবলিক নোটিশ পাওয়া যায়নি।
                          </div>
                        );
                      }
                      
                      const toBanglaNum = (str: string | number | undefined | null): string => {
                        if (str === undefined || str === null) return "";
                        const digits = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
                        return str.toString().replace(/\d/g, (d) => digits[parseInt(d)]);
                      };

                      const formatBanglaDate = (timestamp: any) => {
                        if (!timestamp) return "";
                        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
                        const day = date.getDate();
                        const month = date.getMonth() + 1;
                        const year = date.getFullYear();
                        return `${toBanglaNum(day)}/${toBanglaNum(month)}/${toBanglaNum(year)}`;
                      };

                      return (
                        <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                          <table className="w-full text-left border-collapse text-xs sm:text-sm">
                            <thead>
                              <tr className="bg-emerald-50 text-emerald-950 font-bold border-b border-gray-100">
                                <th className="p-3">প্রকাশের তারিখ</th>
                                <th className="p-3">নোটিশ টাইটেল</th>
                                <th className="p-3">অবস্থা (Status)</th>
                                <th className="p-3 text-center">অ্যাকশন</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                              {notices.map((item) => (
                                <tr key={item.id} className="hover:bg-emerald-50/10">
                                  <td className="p-3 text-gray-500 font-mono">
                                    {formatBanglaDate(item.timestamp)}
                                  </td>
                                  <td className="p-3 font-bold text-gray-800 max-w-[200px] truncate">
                                    {item.title}
                                  </td>
                                  <td className="p-3">
                                    {item.isEdited ? (
                                      <span className="text-red-600 bg-red-50 border border-red-100 px-2 py-0.5 rounded-full font-bold text-[10px]">
                                        সংশোধিত
                                      </span>
                                    ) : (
                                      <span className="text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full font-bold text-[10px]">
                                        মূল সংস্করণ
                                      </span>
                                    )}
                                  </td>
                                  <td className="p-3 text-center">
                                    <div className="flex justify-center space-x-2">
                                      <button
                                        onClick={() => {
                                          setEditNoticeId(item.id);
                                          setEditNoticeTitle(item.title || "");
                                          setEditNoticeDescription(item.description || "");
                                          setEditNoticeType("public");
                                        }}
                                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded cursor-pointer"
                                        title="সম্পাদনা করুন"
                                      >
                                        <Edit3 className="h-4 w-4" />
                                      </button>
                                      <button
                                        type="button"
                                        disabled={false}
                                        onClick={async (e) => {
                                          e.preventDefault();
                                          if (window.confirm("আপনি কি নিশ্চিতভাবে এই নোটিশটি ডিলিট করতে চান?")) {
                                            try {
                                              await deleteDoc(doc(db, "notices", item.id));
                                              alert("নোটিশটি সম্পূর্ণ মুছে ফেলা হয়েছে।");
                                            } catch (err) {
                                              console.error("Error deleting public notice:", err);
                                              alert("মুছে ফেলতে ত্রুটি হয়েছে: " + (err instanceof Error ? err.message : String(err)));
                                            }
                                          }
                                        }}
                                        className="p-1.5 text-red-600 hover:bg-red-50 rounded cursor-pointer opacity-100 pointer-events-auto"
                                        title="ডিলিট করুন"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      );
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* 10. Pathdan Overview Update Form */}
          {/* 9c. Teacher Notices */}
          {activeAdminSubTab === "teacher_notices" && (
            <div className="space-y-6">
              {/* Add New Teacher Notice Form */}
              <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 shadow-sm space-y-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="h-10 w-10 bg-rose-50 rounded-xl flex items-center justify-center text-rose-600">
                    <Megaphone className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-emerald-950 font-serif">নতুন শিক্ষক নোটিশ যোগ করুন</h4>
                    <p className="text-xs text-gray-500">শিক্ষক ড্যাশবোর্ডে সর্বোচ্চ ২টি নোটিশ সক্রিয় থাকবে। ৩য় নোটিশ যুক্ত করলে পুরাতনটি মুছে যাবে।</p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <input
                    type="text"
                    value={teacherNoticeTitle}
                    onChange={(e) => setTeacherNoticeTitle(e.target.value)}
                    placeholder="নোটিশের শিরোনাম (যেমন: মিটিং নোটিশ)"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-rose-500 outline-none transition-all font-sans"
                  />
                  <textarea
                    rows={3}
                    value={teacherNoticeDescription}
                    onChange={(e) => setTeacherNoticeDescription(e.target.value)}
                    placeholder="নোটিশের বিস্তারিত বিবরণ..."
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-rose-500 outline-none transition-all text-emerald-950 font-sans"
                  />
                </div>
                
                <button
                  onClick={handleAddTeacherNotice}
                  disabled={!teacherNoticeTitle.trim() || !teacherNoticeDescription.trim() || isNoticeUploading}
                  className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-6 py-3 rounded-xl text-xs shadow-lg shadow-rose-600/20 select-none transition-all flex items-center justify-center gap-2 disabled:opacity-50 active:scale-95"
                >
                  {isNoticeUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  <span>শিক্ষক নোটিশ আপলোড করুন</span>
                </button>
              </div>

              {/* Teacher Notices List */}
              <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 shadow-sm space-y-4">
                <h4 className="text-base font-bold text-emerald-950 font-serif">বর্তমানে সক্রিয় শিক্ষক নোটিশ সমূহ</h4>
                <div className="space-y-3">
                  <StreamBuilder<any>
                    stream={teacherNoticesQuery}
                    builder={(notices, loading, error) => {
                      if (loading) return <p className="text-xs text-emerald-800 animate-pulse">লোড হচ্ছে...</p>;
                      if (error) return <p className="text-xs text-red-500">লোড করতে সমস্যা হয়েছে</p>;
                      if (!notices || notices.length === 0) {
                        return (
                          <div className="text-center py-10 text-gray-400 border border-dashed rounded-xl bg-gray-50/30">
                            কোনো সক্রিয় শিক্ষক নোটিশ পাওয়া যায়নি।
                          </div>
                        );
                      }
                      return (
                        <div className="grid gap-4">
                          {notices.map((notice, index) => (
                            <div key={notice.id} className="p-5 rounded-2xl border border-gray-100 flex items-start justify-between gap-4 bg-gray-50/50 hover:bg-white hover:shadow-md transition-all group">
                              <div className="space-y-2">
                                <div className="flex items-center gap-3">
                                  <span className="text-[10px] font-black bg-rose-100 text-rose-700 px-2.5 py-1 rounded-lg uppercase tracking-wider">
                                    নোটিশ {toBengaliDigits(index + 1)}
                                  </span>
                                  <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {notice.timestamp ? new Date(notice.timestamp.seconds * 1000).toLocaleString("bn-BD") : "এখনই"}
                                  </span>
                                </div>
                                <h5 className="font-bold text-emerald-950 text-sm">{notice.title}</h5>
                                <p className="text-xs text-slate-600 leading-relaxed font-sans">{notice.description}</p>
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0">
                                <button
                                  onClick={() => {
                                    setEditNoticeId(notice.id);
                                    setEditNoticeTitle(notice.title || "");
                                    setEditNoticeDescription(notice.description || "");
                                    setEditNoticeType("teacher");
                                  }}
                                  className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all cursor-pointer"
                                  title="সম্পাদনা করুন"
                                >
                                  <Edit3 className="h-5 w-5" />
                                </button>
                                <button
                                  type="button"
                                  disabled={false}
                                  onClick={async (e) => {
                                    e.preventDefault();
                                    if (window.confirm("আপনি কি নিশ্চিতভাবে এই নোটিশটি ডিলিট করতে চান?")) {
                                      try {
                                        await deleteDoc(doc(db, "teacher_notices", notice.id));
                                        alert("নোটিশটি সম্পূর্ণ মুছে ফেলা হয়েছে।");
                                      } catch (err) {
                                        console.error("Error deleting notice:", err);
                                        alert("মুছে ফেলতে ত্রুটি হয়েছে: " + (err instanceof Error ? err.message : String(err)));
                                      }
                                    }
                                  }}
                                  className="p-2 text-red-600 hover:bg-red-50 rounded-xl transition-all cursor-pointer opacity-100 pointer-events-auto"
                                  title="ডিলিট করুন"
                                >
                                  <Trash2 className="h-5 w-5" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {activeAdminSubTab === "pathdan_update" && (
            <PathdanUpdateForm />
          )}

          {/* 11. Sodosso Form Settings Update Form */}
          {activeAdminSubTab === "sodosso_form_settings" && (
            <SodossoFormUpdateForm />
          )}

          {/* 12. Kormochari Update Form */}
          {activeAdminSubTab === "kormochari_panel" && (
            <KormochariUpdateForm />
          )}

          {/* 13. Contact Info Update Form */}
          {activeAdminSubTab === "contact_update" && (
            <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 shadow-sm space-y-6 font-alinur">
              <div className="border-b pb-4">
                <h4 className="text-base font-bold text-emerald-950 font-alinur text-lg sm:text-xl">মাদ্রাসার প্রাতিষ্ঠানিক যোগাযোগ ও ঠিকানা কাস্টমাইজেশন</h4>
                <p className="text-xs text-gray-500 mt-1">হোমপেজের কন্টাক্ট সেকশনের ঠিকানা, কন্টাক্ট নাম্বার ও সোস্যাল মিডিয়া লিংকগুলো এখান থেকে ডাইনামিকালি আপডেট করুন।</p>
              </div>

              <form onSubmit={handleContactUpdateSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Address field (Full width) */}
                  <div className="md:col-span-2 space-y-2">
                    <label className="text-xs font-bold text-gray-700 block">মাদ্রাসার ঠিকানা</label>
                    <textarea
                      required
                      rows={2}
                      value={contactAddressInput}
                      onChange={(e) => setContactAddressInput(e.target.value)}
                      placeholder="প্রতিষ্ঠানের পূর্ণ ঠিকানা লিখুন"
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs"
                    />
                  </div>

                  {/* Office Phone */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-700 block">অফিস কন্টাক্ট নাম্বার</label>
                    <input
                      type="text"
                      required
                      value={contactOfficePhoneInput}
                      onChange={(e) => setContactOfficePhoneInput(e.target.value)}
                      placeholder="অফিস কন্টাক্ট নাম্বার ১১ সংখ্যায় লিখুন"
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs"
                    />
                  </div>

                  {/* Principal Phone */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-700 block">প্রধান শিক্ষকের নাম্বার</label>
                    <input
                      type="text"
                      required
                      value={contactPrincipalPhoneInput}
                      onChange={(e) => setContactPrincipalPhoneInput(e.target.value)}
                      placeholder="প্রধান শিক্ষকের নাম্বার ১১ সংখ্যায় লিখুন"
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs"
                    />
                  </div>

                  {/* Official Email */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-700 block">অফিসিয়াল ইমেইল</label>
                    <input
                      type="email"
                      required
                      value={contactEmailInput}
                      onChange={(e) => setContactEmailInput(e.target.value)}
                      placeholder="অফিসিয়াল ইমেইল এড্রেস লিখুন"
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs"
                    />
                  </div>

                  {/* Facebook Link */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-700 block">ফেসবুক লিংক</label>
                    <input
                      type="url"
                      value={contactFacebookInput}
                      onChange={(e) => setContactFacebookInput(e.target.value)}
                      placeholder="সংশ্লিষ্ট সোস্যাল মিডিয়া লিংকটি লিখুন"
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs"
                    />
                  </div>

                  {/* LinkedIn Link */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-700 block">লিঙ্কডইন লিংক</label>
                    <input
                      type="url"
                      value={contactLinkedinInput}
                      onChange={(e) => setContactLinkedinInput(e.target.value)}
                      placeholder="সংশ্লিষ্ট সোস্যাল মিডিয়া লিংকটি লিখুন"
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs"
                    />
                  </div>

                  {/* Telegram Link */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-700 block">টেলিগ্রাম লিংক</label>
                    <input
                      type="url"
                      value={contactTelegramInput}
                      onChange={(e) => setContactTelegramInput(e.target.value)}
                      placeholder="সংশ্লিষ্ট সোস্যাল মিডিয়া লিংকটি লিখুন"
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs"
                    />
                  </div>

                  {/* WhatsApp Link */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-700 block">হোয়াটসঅ্যাপ লিংক</label>
                    <input
                      type="url"
                      value={contactWhatsappInput}
                      onChange={(e) => setContactWhatsappInput(e.target.value)}
                      placeholder="সংশ্লিষ্ট সোস্যাল মিডিয়া লিংকটি লিখুন"
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs"
                    />
                  </div>
                </div>

                {contactSaveSuccess && (
                  <div className="bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg p-3 text-xs font-bold flex items-center gap-1.5 animate-fade-in">
                    <Check className="h-4 w-4 text-emerald-600" />
                    <span>সফলভাবে কন্টাক্ট এবং সামাজিক যোগাযোগ লিংক আপডেট করা হয়েছে! হোমপেজে সাথে সাথেই এই পরিবর্তন দেখা যাবে।</span>
                  </div>
                )}

                <div className="flex justify-end pt-4 border-t">
                  <button
                    type="submit"
                    disabled={isUpdatingContact}
                    className="bg-emerald-800 hover:bg-emerald-950 text-amber-400 font-bold py-2.5 px-6 rounded-lg text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isUpdatingContact ? "আপডেট হচ্ছে..." : "সংরক্ষণ করুন"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* 14. Hafizgon Update Form */}
          {activeAdminSubTab === "hafizgon" && (
            <HafizgonUpdateForm />
          )}

          {/* 14.5. Homework Subject Management */}
          {activeAdminSubTab === "homework_subjects" && (
            <AdminHomeworkSubjectManagement />
          )}

          {/* 15. Admin Control Section */}
          {activeAdminSubTab === "admin_control" && (
            <AdminControlSection user={user} />
          )}
        </div>
      )}

      {/* ------------------- NOTICE EDIT DIALOG MODAL ------------------- */}
      {editNoticeType !== null && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full border border-gray-200 overflow-hidden my-8 animate-fade-in" style={{ fontFamily: "'Noto Serif Bengali', serif" }}>
            <div className="bg-emerald-800 text-white p-5 flex justify-between items-center border-b-4 border-amber-500">
              <h3 className="font-bold text-base sm:text-lg">
                {editNoticeType === "running" && "চলমান নোটিশ সংশোধন করুন"}
                {editNoticeType === "public" && "পাবলিক নোটিশ সংশোধন করুন"}
                {editNoticeType === "teacher" && "শিক্ষক নোটিশ সংশোধন করুন"}
              </h3>
              <button
                onClick={() => {
                  setEditNoticeType(null);
                  setEditNoticeId(null);
                  setEditNoticeText("");
                  setEditNoticeTitle("");
                  setEditNoticeDescription("");
                }}
                className="text-emerald-100 hover:text-white"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSaveNoticeEdit} className="p-6 space-y-4">
              {editNoticeType === "running" && (
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700 block">চলমান নোটিশের বিবরণ</label>
                  <textarea
                    rows={4}
                    required
                    value={editNoticeText}
                    onChange={(e) => setEditNoticeText(e.target.value)}
                    placeholder="চলমান নোটিশের বিবরণ লিখুন..."
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-emerald-950 font-sans"
                  />
                </div>
              )}

              {(editNoticeType === "public" || editNoticeType === "teacher") && (
                <>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-700 block">নোটিশ টাইটেল (Title)</label>
                    <input
                      type="text"
                      required
                      value={editNoticeTitle}
                      onChange={(e) => setEditNoticeTitle(e.target.value)}
                      placeholder="নোটিশের শিরোনাম লিখুন..."
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-emerald-950"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-700 block">নোটিশ বিস্তারিত বিবরণ (Body Description)</label>
                    <textarea
                      rows={5}
                      required
                      value={editNoticeDescription}
                      onChange={(e) => setEditNoticeDescription(e.target.value)}
                      placeholder="নোটিশের বিস্তারিত বিবরণ লিখুন..."
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-emerald-950 font-sans"
                    />
                  </div>
                </>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setEditNoticeType(null);
                    setEditNoticeId(null);
                    setEditNoticeText("");
                    setEditNoticeTitle("");
                    setEditNoticeDescription("");
                  }}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold px-4 py-2.5 rounded-lg text-xs transition-all cursor-pointer"
                >
                  বাতিল করুন
                </button>
                <button
                  type="submit"
                  disabled={isEditNoticeSaving}
                  className="bg-emerald-800 hover:bg-emerald-900 text-white font-bold px-5 py-2.5 rounded-lg text-xs shadow-sm select-none transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  {isEditNoticeSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>আপডেট হচ্ছে...</span>
                    </>
                  ) : (
                    <span>আপডেট সম্পন্ন করুন</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------- ADD/EDIT DIALOG MODAL ------------------- */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full border border-gray-200 overflow-hidden my-8">
            <div className="bg-emerald-800 text-white p-5 flex justify-between items-center border-b-4 border-amber-500">
              <h3 className="font-bold text-base sm:text-lg">
                {editingId ? "তথ্য এডিট ও মডিফাই করুন" : "নতুন তথ্য তালিকাভুক্ত করুন"}
              </h3>
              <button onClick={() => setIsFormOpen(false)} className="text-emerald-100 hover:text-white">
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {/* Dynamic form inputs based on entity type */}
              {(user.role === "teacher" || activeAdminSubTab === "routines") && (
                <>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-700">রুটিন টাইপ</label>
                    <select value={field1} onChange={(e) => setField1(e.target.value)} className="w-full px-3 py-2 border rounded-md text-sm">
                      <option value="class">ক্লাস রুটিন</option>
                      <option value="exam">পরীক্ষা রুটিন</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-700">শ্রেণী</label>
                    <input type="text" required value={field2} onChange={(e) => setField2(e.target.value)} placeholder="যেমন: ১০ম শ্রেণী" className="w-full px-3 py-2 border rounded-md text-sm" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-700">বিষয়</label>
                    <input type="text" required value={field3} onChange={(e) => setField3(e.target.value)} placeholder="যেমন: কুরআন মাজীদ" className="w-full px-3 py-2 border rounded-md text-sm" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-700">সময় ও ঘণ্টা</label>
                    <input type="text" required value={field4} onChange={(e) => setField4(e.target.value)} placeholder="যেমন: ০৯:০০ AM - ০৯:৪৫ AM" className="w-full px-3 py-2 border rounded-md text-sm" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-700">দিন বা তারিখ</label>
                    <input type="text" required value={field5} onChange={(e) => setField5(e.target.value)} placeholder="যেমন: রবিবার বা ২০২৬-১০-১৫" className="w-full px-3 py-2 border rounded-md text-sm" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-700">কক্ষ নম্বর</label>
                    <input type="text" required value={field6} onChange={(e) => setField6(e.target.value)} placeholder="যেমন: ১০১" className="w-full px-3 py-2 border rounded-md text-sm" />
                  </div>
                </>
              )}

              {user.role === "admin" && activeAdminSubTab === "teachers" && (
                <>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-700">শিক্ষকের নাম</label>
                    <input type="text" required value={field1} onChange={(e) => setField1(e.target.value)} placeholder="যেমন: মাওলানা মোহাম্মদ আব্দুর রহমান" className="w-full px-3 py-2 border rounded-md text-sm" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-700">পদবী</label>
                    <input type="text" required value={field2} onChange={(e) => setField2(e.target.value)} placeholder="যেমন: সহকারী সুপার" className="w-full px-3 py-2 border rounded-md text-sm" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-700">মোবাইল ফোন নম্বর</label>
                    <input 
                      type="text" 
                      required 
                      value={field3} 
                      onChange={(e) => setField3(e.target.value)} 
                      placeholder="যেমন: ০১৭১১-১২৩৪৫৬" 
                      className={`w-full px-3 py-2 border rounded-md text-sm transition-colors ${isPhoneDuplicate ? 'border-red-500 bg-red-50' : 'border-gray-300'}`} 
                    />
                    {isCheckingPhone && <p className="text-[10px] text-emerald-600 font-bold animate-pulse">নম্বর চেক করা হচ্ছে...</p>}
                    {isPhoneDuplicate && duplicateUserInfo && (
                      <div className="bg-red-100 border border-red-200 p-2 rounded-lg mt-1 flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
                        <p className="text-[11px] text-red-700 font-bold leading-tight">
                          এই নম্বরটি ইতিমধ্যে ব্যবহৃত হয়েছে! এটি <span className="text-red-900">{duplicateUserInfo.name}</span> (আইডি: <span className="text-red-900">{duplicateUserInfo.id}</span>) এর অ্যাকাউন্টে নিবন্ধিত আছে।
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-700">ইমেইল</label>
                    <input type="email" required value={field4} onChange={(e) => setField4(e.target.value)} placeholder="যেমন: mail@domain.com" className="w-full px-3 py-2 border rounded-md text-sm" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-700">প্রোফাইল ফটো ইউআরএল (Photo URL)</label>
                    <div className="flex gap-2">
                      <input type="text" value={field5} onChange={(e) => setField5(e.target.value)} placeholder="Unsplash / Image URL" className="flex-1 min-w-0 px-3 py-2 border rounded-md text-sm" />
                      <label className="bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 font-bold px-3 py-1.5 rounded-md text-xs cursor-pointer flex items-center justify-center gap-1 select-none shrink-0">
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleFileUpload(e, setField5, "teachers")}
                          disabled={isUploading}
                        />
                        {isUploading ? "আপলোড..." : "ফাইল সিলেক্ট"}
                      </label>
                    </div>
                    {uploadError && <p className="text-[11px] text-red-500 font-medium mt-1">{uploadError}</p>}
                  </div>
                </>
              )}

              {user.role === "admin" && activeAdminSubTab === "stories" && (
                <>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-700">শিক্ষার্থীর নাম</label>
                    <input type="text" required value={field1} onChange={(e) => setField1(e.target.value)} placeholder="যেমন: মোহাম্মদ মিনহাজুল ইসলাম" className="w-full px-3 py-2 border rounded-md text-sm" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-700">সাফল্য / কৃতিত্ব বিবরণ</label>
                    <textarea required rows={3} value={field2} onChange={(e) => setField2(e.target.value)} placeholder="যেমন: দাখিল পরীক্ষায় জিপিএ ৫.০০..." className="w-full px-3 py-2 border rounded-md text-sm resize-none"></textarea>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-700">অর্জনের বছর</label>
                    <input type="number" required value={field3} onChange={(e) => setField3(e.target.value)} placeholder="যেমন: ২০২৫" className="w-full px-3 py-2 border rounded-md text-sm" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-700">ছবি ইউআরএল (Student Photo URL)</label>
                    <div className="flex gap-2">
                      <input type="text" value={field4} onChange={(e) => setField4(e.target.value)} placeholder="Image URL" className="flex-1 min-w-0 px-3 py-2 border rounded-md text-sm" />
                      <label className="bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 font-bold px-3 py-1.5 rounded-md text-xs cursor-pointer flex items-center justify-center gap-1 select-none shrink-0">
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleFileUpload(e, setField4, "stories")}
                          disabled={isUploading}
                        />
                        {isUploading ? "আপলোড..." : "ফাইল সিলেক্ট"}
                      </label>
                    </div>
                    {uploadError && <p className="text-[11px] text-red-500 font-medium mt-1">{uploadError}</p>}
                  </div>
                </>
              )}

              {user.role === "admin" && activeAdminSubTab === "committee" && (
                <div className="font-alinur space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-700 font-alinur">সদস্যের নাম</label>
                    <input 
                      type="text" 
                      required 
                      value={field1} 
                      onChange={(e) => setField1(e.target.value)} 
                      placeholder="গভর্ণিং বডি সদস্যের নাম লিখুন" 
                      className="w-full px-3 py-2 border rounded-md text-sm text-emerald-950 font-alinur" 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-700 font-alinur">পদবী (Role)</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        required
                        value={field2}
                        onChange={(e) => setField2(e.target.value)}
                        placeholder="সদস্যের পদবি লিখুন"
                        className="flex-1 min-w-0 px-3 py-2 border rounded-md text-sm text-emerald-950 font-alinur"
                      />
                      <select
                        onChange={(e) => {
                          if (e.target.value) setField2(e.target.value);
                        }}
                        className="px-2 py-2 border rounded-md text-xs bg-gray-50 text-gray-700 shrink-0 font-alinur"
                      >
                        <option value="">পদবী তালিকা...</option>
                        <option value="সভাপতি">সভাপতি</option>
                        <option value="সুপার ও সদস্য সচিব">সুপার ও সদস্য সচিব</option>
                        <option value="দাতা সদস্য">দাতা সদস্য</option>
                        <option value="বিদ্যুৎসাহী সদস্য">বিদ্যুৎসাহী সদস্য</option>
                        <option value="অভিভাবক সদস্য">অভিভাবক সদস্য</option>
                        <option value="শিক্ষক প্রতিনিধি">শিক্ষক প্রতিনিধি</option>
                        <option value="সদস্য">সদস্য</option>
                      </select>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-700 font-alinur">দিকনির্দেশনামূলক বাণী বা দীর্ঘ বক্তব্য</label>
                    <textarea 
                      rows={4} 
                      required
                      value={field3} 
                      onChange={(e) => setField3(e.target.value)} 
                      placeholder="মাদ্রাসার উদ্দেশ্যে মূল্যবান বাণী ও সংক্ষিপ্ত বিবরণ লিখুন" 
                      className="w-full px-3 py-2 border rounded-md text-sm resize-none text-emerald-950 font-alinur"
                    ></textarea>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-700 font-alinur">অগ্রাধিকার বা রাঙ্ক (Rank - ক্রমানুসারে দেখানোর জন্য)</label>
                    <input 
                      type="number" 
                      required 
                      value={field4} 
                      onChange={(e) => setField4(e.target.value)} 
                      placeholder="র‍্যাংক নির্ধারণ করুন (যেমন: ১ বা ২ বা ৩ ইত্যাদি)" 
                      className="w-full px-3 py-2 border rounded-md text-sm text-emerald-950 font-alinur" 
                    />
                  </div>

                  {/* 7 Custom Bio-Data Fields */}
                  <div className="border-t border-dashed border-gray-200 pt-4 mt-4 space-y-3 font-alinur">
                    <h4 className="text-xs font-bold text-emerald-800 font-alinur">সদস্যের ব্যক্তিগত বায়ো-ডাটা (Bio-Data)</h4>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-750 font-alinur">যোগদানের তারিখ</label>
                        <input 
                          type="text" 
                          required 
                          value={commJoiningDate} 
                          onChange={(e) => setCommJoiningDate(e.target.value)} 
                          placeholder="যোগদানের তারিখ লিখুন (দিন মাস, সাল)" 
                          className="w-full px-3 py-2 border rounded-md text-sm text-emerald-950 font-alinur" 
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-750 font-alinur">জন্ম তারিখ</label>
                        <input 
                          type="text" 
                          required 
                          value={commBirthDate} 
                          onChange={(e) => setCommBirthDate(e.target.value)} 
                          placeholder="জন্ম তারিখ লিখুন (দিন মাস, সাল)" 
                          className="w-full px-3 py-2 border rounded-md text-sm text-emerald-950 font-alinur" 
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-750 font-alinur">রক্তের গ্রুপ</label>
                        <input 
                          type="text" 
                          required 
                          value={commBloodGroup} 
                          onChange={(e) => setCommBloodGroup(e.target.value)} 
                          placeholder="রক্তের গ্রুপ লিখুন" 
                          className="w-full px-3 py-2 border rounded-md text-sm text-emerald-950 font-alinur" 
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-750 font-alinur">শিক্ষাগত যোগ্যতা</label>
                        <input 
                          type="text" 
                          required 
                          value={commQualification} 
                          onChange={(e) => setCommQualification(e.target.value)} 
                          placeholder="শিক্ষাগত যোগ্যতা লিখুন" 
                          className="w-full px-3 py-2 border rounded-md text-sm text-emerald-950 font-alinur" 
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-750 font-alinur">মোবাইল ফোন নম্বর</label>
                        <input 
                          type="text" 
                          required 
                          value={commPhone} 
                          onChange={(e) => setCommPhone(e.target.value)} 
                          placeholder="ফোন নম্বর লিখুন" 
                          className="w-full px-3 py-2 border rounded-md text-sm text-emerald-950 font-alinur" 
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-750 font-alinur">ইমেইল এড্রেস</label>
                        <input 
                          type="text" 
                          required 
                          value={commEmail} 
                          onChange={(e) => setCommEmail(e.target.value)} 
                          placeholder="ইমেইল ঠিকানা লিখুন" 
                          className="w-full px-3 py-2 border rounded-md text-sm text-emerald-950 font-alinur" 
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-750 font-alinur">স্থায়ী ও বর্তমান ঠিকানা</label>
                      <textarea 
                        rows={2} 
                        required 
                        value={commAddress} 
                        onChange={(e) => setCommAddress(e.target.value)} 
                        placeholder="স্থায়ী ও বর্তমান ঠিকানা লিখুন" 
                        className="w-full px-3 py-2 border rounded-md text-sm resize-none text-emerald-950 font-alinur" 
                      ></textarea>
                    </div>

                    {/* Optional Contact Fields */}
                    <div className="border-t border-dashed border-gray-200 pt-4 mt-4 space-y-3 font-alinur">
                      <h4 className="text-xs font-bold text-emerald-800 font-alinur">যোগাযোগের লিংক ও তথ্য (ঐচ্ছিক)</h4>
                      
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-750 font-alinur">ফেইজবুক লিংক</label>
                        <input 
                          type="text" 
                          value={commFacebook} 
                          onChange={(e) => setCommFacebook(e.target.value)} 
                          placeholder="ফেইজবুক প্রোফাইল লিংক লিখুন (অপশনাল)" 
                          className="w-full px-3 py-2 border rounded-md text-sm text-emerald-950 font-alinur" 
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-gray-750 font-alinur">হোয়াটসঅ্যাপ নম্বর</label>
                          <input 
                            type="text" 
                            value={commWhatsapp} 
                            onChange={(e) => setCommWhatsapp(e.target.value)} 
                            placeholder="হোয়াটসঅ্যাপ নম্বর লিখুন (অপশনাল)" 
                            className="w-full px-3 py-2 border rounded-md text-sm text-emerald-950 font-alinur" 
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-gray-750 font-alinur">মোবাইল নম্বর</label>
                          <input 
                            type="text" 
                            value={commPhoneNum} 
                            onChange={(e) => setCommPhoneNum(e.target.value)} 
                            placeholder="মোবাইল নম্বর লিখুন (অপশনাল)" 
                            className="w-full px-3 py-2 border rounded-md text-sm text-emerald-950 font-alinur" 
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Strict Image Upload Section */}
                  <div className="border-t border-dashed border-gray-200 pt-4 mt-4 space-y-2">
                    <label className="text-xs font-bold text-gray-700 block">ছবি আপলোড</label>
                    <div className="bg-amber-50/80 border border-amber-200 p-2.5 rounded-lg text-amber-900 text-[11px] leading-relaxed mb-2 font-sans flex items-start gap-1.5">
                      <span className="text-base shrink-0">⚠️</span>
                      <div>
                        <strong>কঠিন ইমেজ ভ্যালিডেশন:</strong> আপনি যতক্ষণ না ফরমের ওপরের সবকটি টেক্সট ফিল্ড (নাম, পদবী, বাণী, র‍্যাংক এবং কাস্টম ৭টি বায়ো-ডাটা ফিল্ড) সম্পূর্ণ ও সঠিকভাবে পূরণ করছেন, ততক্ষণ পর্যন্ত ছবি আপলোড বা প্রসেস করা যাবে না।
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        value={field5} 
                        onChange={(e) => setField5(e.target.value)} 
                        placeholder="সরাসরি ছবির লিঙ্ক (URL) দিতে পারেন অথবা পাশের বাটনে ফাইল সিলেক্ট করুন" 
                        className="flex-1 min-w-0 px-3 py-2 border rounded-md text-xs font-mono" 
                      />
                      <label className="bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 font-bold px-3 py-1.5 rounded-md text-xs cursor-pointer flex items-center justify-center gap-1 select-none shrink-0 font-sans">
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleFileUpload(e, setField5, "committee")}
                          disabled={isUploading}
                        />
                        {isUploading ? "আপলোড..." : "গ্যালারি থেকে প্রোফাইল ছবি সিলেক্ট করুন"}
                      </label>
                    </div>
                    {uploadError && (
                      <p className="text-[11px] text-red-600 font-bold mt-1.5 bg-red-50 border border-red-200 p-2 rounded-md font-sans">
                        {uploadError}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {user.role === "admin" && activeAdminSubTab === "honored" && (
                <>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-700">স্মরণীয় ব্যক্তিত্ব নাম</label>
                    <input type="text" required value={field1} onChange={(e) => setField1(e.target.value)} placeholder="স্মরণীয় ব্যক্তিত্ব নাম লিখুন" className="w-full px-3 py-2 border rounded-md text-sm" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-700">জীবনকাল (যেমন: ১৯১০ - ১৯৮৫)</label>
                    <input type="text" required value={field2} onChange={(e) => setField2(e.target.value)} placeholder="জীবনকাল লিখুন (জন্মসাল -মৃত্যুসাল)" className="w-full px-3 py-2 border rounded-md text-sm" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-700">অবদান ও অনন্য ত্যাগের সংক্ষিপ্ত বিবরণ</label>
                    <textarea required rows={4} value={field3} onChange={(e) => setField3(e.target.value)} placeholder="অবদান ও অনন্য ত্যাগের সংক্ষিপ্ত বিবরণ লিখুন" className="w-full px-3 py-2 border rounded-md text-sm resize-none"></textarea>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-700">স্মৃতি ছবি ইউআরএল</label>
                    <div className="flex gap-2">
                      <input type="text" value={field4} onChange={(e) => setField4(e.target.value)} placeholder="Image URL" className="flex-1 min-w-0 px-3 py-2 border rounded-md text-sm" />
                      <label className="bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 font-bold px-3 py-1.5 rounded-md text-xs cursor-pointer flex items-center justify-center gap-1 select-none shrink-0">
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleFileUpload(e, setField4, "honored")}
                          disabled={isUploading}
                        />
                        {isUploading ? "আপলোড..." : "গ্যালারি থেকে ছবি সিলেক্ট করুন"}
                      </label>
                    </div>
                    {uploadError && <p className="text-[11px] text-red-500 font-medium mt-1">{uploadError}</p>}
                  </div>
                </>
              )}

              <button
                type="submit"
                disabled={user.role === "admin" && activeAdminSubTab === "teachers" && (isPhoneDuplicate || field3.trim().length !== 11 || isCheckingPhone)}
                className={`w-full font-bold py-2.5 rounded-lg text-sm transition-all ${
                  activeAdminSubTab === "committee" ? "font-alinur" : ""
                } ${
                  (user.role === "admin" && activeAdminSubTab === "teachers" && (isPhoneDuplicate || field3.trim().length !== 11 || isCheckingPhone))
                  ? "bg-gray-400 cursor-not-allowed text-gray-200"
                  : "bg-emerald-800 hover:bg-emerald-950 text-white"
                }`}
              >
                {editingId ? "আপডেট করুন" : "দাখিল বা সংরক্ষণ করুন"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 1:1 Image Cropper Modal for Governing Body member profile photo */}
      {cropSrc && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in font-alinur">
          <div className="bg-white border-2 border-emerald-600 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-6">
            <div className="text-center space-y-1 border-b border-emerald-100 pb-3">
              <h3 className="text-lg font-black text-emerald-950 font-alinur">ছবি ক্রপ ও সাইজ সেটআপ (১:১ রেশিও)</h3>
              <p className="text-xs text-emerald-800 font-bold">নিখুঁত চারকোনা ছবি প্রদর্শনের জন্য জুমিং ও পজিশন কন্ট্রোল করুন</p>
            </div>

            {/* Interactive Preview Viewport */}
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="w-56 h-56 overflow-hidden rounded-2xl relative border-4 border-emerald-600 bg-slate-900 shadow-inner flex items-center justify-center">
                <img
                  src={cropSrc}
                  alt="To Crop"
                  style={{
                    transform: `scale(${cropZoom}) translate(${cropX}px, ${cropY}px)`,
                    transition: 'none',
                  }}
                  className="max-w-full max-h-full object-contain pointer-events-none"
                />
                {/* Visual crop guidelines helper overlays */}
                <div className="absolute inset-0 border border-emerald-400/20 pointer-events-none grid grid-cols-3 grid-rows-3">
                  <div className="border-r border-b border-white/20"></div>
                  <div className="border-r border-b border-white/20"></div>
                  <div className="border-b border-white/20"></div>
                  <div className="border-r border-b border-white/20"></div>
                  <div className="border-r border-b border-white/20"></div>
                  <div className="border-b border-white/20"></div>
                  <div className="border-r border-white/20"></div>
                  <div className="border-r border-white/20"></div>
                  <div></div>
                </div>
              </div>
              <span className="text-[10px] bg-emerald-50 text-emerald-800 px-3 py-1 rounded-full font-bold">১:১ স্কয়ার ক্রপ প্রিভিউ</span>
            </div>

            {/* Interactive Sliders */}
            <div className="space-y-4 bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100">
              {/* Zoom Slider */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold text-emerald-950">
                  <span>জুম ইন / আউট (Zoom)</span>
                  <span className="font-mono text-xs">{cropZoom.toFixed(2)}x</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="3"
                  step="0.05"
                  value={cropZoom}
                  onChange={(e) => setCropZoom(parseFloat(e.target.value))}
                  className="w-full h-2 bg-emerald-200 rounded-lg appearance-none cursor-pointer accent-emerald-700"
                />
              </div>

              {/* X position (Horizontal translation) */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold text-emerald-950">
                  <span>ডানে / বামে সরান (Horizontal)</span>
                  <span className="font-mono text-xs">{cropX}px</span>
                </div>
                <input
                  type="range"
                  min="-100"
                  max="100"
                  step="1"
                  value={cropX}
                  onChange={(e) => setCropX(parseInt(e.target.value))}
                  className="w-full h-2 bg-emerald-200 rounded-lg appearance-none cursor-pointer accent-emerald-700"
                />
              </div>

              {/* Y position (Vertical translation) */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold text-emerald-950">
                  <span>ওপরে / নিচে সরান (Vertical)</span>
                  <span className="font-mono text-xs">{cropY}px</span>
                </div>
                <input
                  type="range"
                  min="-100"
                  max="100"
                  step="1"
                  value={cropY}
                  onChange={(e) => setCropY(parseInt(e.target.value))}
                  className="w-full h-2 bg-emerald-200 rounded-lg appearance-none cursor-pointer accent-emerald-700"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setCropSrc(null);
                  setCropFile(null);
                  setCropFieldSetter(null);
                }}
                className="flex-1 bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 font-extrabold text-xs py-2.5 rounded-full transition-colors cursor-pointer text-center"
              >
                বাতিল করুন
              </button>
              <button
                type="button"
                onClick={async () => {
                  const img = new Image();
                  img.src = cropSrc;
                  img.onload = () => {
                    const canvas = document.createElement("canvas");
                    canvas.width = 500;
                    canvas.height = 500;
                    const ctx = canvas.getContext("2d");
                    if (ctx) {
                      ctx.fillStyle = "#ffffff";
                      ctx.fillRect(0, 0, 500, 500);

                      const size = Math.min(img.width, img.height);
                      const cropSize = size / cropZoom;
                      
                      const shiftX = (cropX / 100) * (img.width - cropSize) * 0.5;
                      const shiftY = (cropY / 100) * (img.height - cropSize) * 0.5;
                      
                      const sx = Math.max(0, Math.min(img.width - cropSize, (img.width - cropSize) / 2 - shiftX));
                      const sy = Math.max(0, Math.min(img.height - cropSize, (img.height - cropSize) / 2 - shiftY));
                      
                      ctx.drawImage(img, sx, sy, cropSize, cropSize, 0, 0, 500, 500);
                    }

                    canvas.toBlob(async (blob) => {
                      if (!blob) return;
                      const croppedFile = new File([blob], cropFile?.name || "cropped_profile.jpg", { type: "image/jpeg" });
                      
                      // Close modal
                      setCropSrc(null);
                      
                      // Upload to ImgBB
                      setIsUploading(true);
                      setUploadError("");
                      try {
                        const downloadUrl = await uploadFileToImgBB(croppedFile);
                        if (cropFieldSetter) {
                          cropFieldSetter(downloadUrl);
                        }
                      } catch (error: any) {
                        console.error("Error uploading cropped file:", error);
                        setUploadError("ক্রপ করা ছবি আপলোড করতে ব্যর্থ হয়েছে। পুনরায় চেষ্টা করুন।");
                      } finally {
                        setIsUploading(false);
                      }
                    }, "image/jpeg", 0.9);
                  };
                }}
                className="flex-1 bg-emerald-800 hover:bg-emerald-950 text-white font-extrabold text-xs py-2.5 rounded-full transition-colors cursor-pointer text-center shadow-md shadow-emerald-800/10"
              >
                ক্রপ ও আপলোড সম্পন্ন করুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Immersive uploading loading overlay */}
      {isUploading && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in font-alinur">
          <div className="bg-white border-2 border-emerald-600 rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl space-y-6">
            <div className="flex justify-center">
              <div className="relative h-20 w-20 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border-4 border-emerald-100 animate-pulse"></div>
                <div className="absolute inset-0 rounded-full border-4 border-t-emerald-800 animate-spin"></div>
                <div className="h-10 w-10 bg-emerald-800 rounded-full flex items-center justify-center text-white font-bold animate-bounce text-sm">
                  🕌
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="text-base font-extrabold text-emerald-950">লোগো আপলোড হচ্ছে...</h3>
              <p className="text-[11px] text-gray-500 leading-relaxed font-bold animate-pulse">
                ফাইলটি সার্ভারে প্রসেস করা হচ্ছে। অনুগ্রহ করে কিছু সময় অপেক্ষা করুন।
              </p>
            </div>
            {/* Smooth Progress Wave / Bar Simulation */}
            <div className="h-2 w-full bg-emerald-50 rounded-full overflow-hidden relative border border-emerald-100">
              <div className="absolute top-0 bottom-0 left-0 bg-gradient-to-r from-emerald-600 via-amber-500 to-emerald-600 rounded-full animate-[pulse_1.5s_infinite] w-full"></div>
            </div>
          </div>
        </div>
      )}

      {/* Logout Loading Modal */}
      {isLoggingOut && (
        <div className="fixed inset-0 bg-emerald-950/90 backdrop-blur-xl flex items-center justify-center p-4 z-[110] font-alinur">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex flex-col items-center gap-6"
          >
            <div className="relative">
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="h-20 w-20 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full shadow-[0_0_30px_rgba(16,185,129,0.3)]"
              ></motion.div>
              <div className="absolute inset-0 flex items-center justify-center">
                <LogOut className="h-8 w-8 text-white animate-pulse" />
              </div>
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-2xl font-black text-white tracking-widest uppercase">লগআউট হচ্ছে...</h3>
              <p className="text-emerald-400 text-xs font-bold animate-pulse">অনুগ্রহ করে কিছুক্ষণ অপেক্ষা করুন</p>
            </div>
          </motion.div>
        </div>
      )}

      {/* Logout Confirmation Modal */}
      <AnimatePresence>
        {showLogoutConfirm && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 z-[100] font-alinur">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white border-2 border-emerald-600 rounded-[32px] p-8 max-w-sm w-full text-center shadow-2xl space-y-6"
            >
              <div className="flex justify-center">
                <div className="h-20 w-20 bg-rose-50 rounded-full flex items-center justify-center text-rose-500 shadow-inner">
                  <LogOut className="h-10 w-10" />
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-black text-emerald-950">লগআউট কনফার্মেশন</h3>
                <p className="text-sm text-gray-500 font-bold">আপনি কি নিশ্চিতভাবে লগআউট করতে চান?</p>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  className="flex-1 px-6 py-3 border-2 border-slate-200 text-slate-600 font-black text-sm rounded-2xl hover:bg-slate-50 transition-all cursor-pointer"
                >
                  না
                </button>
                <button
                  onClick={() => {
                    setShowLogoutConfirm(false);
                    setIsLoggingOut(true);
                    setTimeout(() => {
                      setUser(null);
                      localStorage.removeItem("sndm_user");
                      setActiveTab("home");
                    }, 2000);
                  }}
                  className="flex-1 px-6 py-3 bg-rose-500 hover:bg-rose-600 text-white font-black text-sm rounded-2xl shadow-lg shadow-rose-200 transition-all cursor-pointer"
                >
                  হ্যাঁ
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Madrasah Logo Upload Success Modal Dialog */}
      {showLogoSuccessPopup && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in font-alinur">
          <div className="bg-white border-2 border-emerald-600 rounded-3xl p-6 max-w-sm w-full text-center shadow-2xl space-y-4">
            <div className="flex justify-center">
              <div className="h-16 w-16 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600">
                <Check className="h-10 w-10 stroke-[3]" />
              </div>
            </div>
            <h3 className="text-xl font-extrabold text-emerald-950 font-alinur">আপনার লগো আপডেট সফল</h3>
            <p className="text-xs text-gray-600 leading-relaxed font-bold">
              মাদ্রাসার অফিসিয়াল লোগোটি সফলভাবে আপডেট করা হয়েছে এবং সম্পূর্ণ ওয়েবসাইটে পরিবর্তন রিয়েল-টাইমে যুক্ত করা হয়েছে।
            </p>
            <button
              onClick={() => {
                setShowLogoSuccessPopup(false);
              }}
              className="w-full bg-emerald-800 hover:bg-emerald-900 text-white font-extrabold text-xs py-2.5 rounded-full transition-colors cursor-pointer text-center shadow-md shadow-emerald-800/10"
            >
              ঠিক আছে
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
