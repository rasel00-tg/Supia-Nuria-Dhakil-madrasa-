import React, { useState, useEffect } from "react";
import { collection, doc, setDoc, updateDoc, deleteDoc, query, onSnapshot, serverTimestamp } from "firebase/firestore";
import { db, StreamBuilder, handleFirestoreError, OperationType } from "../lib/firebase";
import { checkDuplicatePhoneNumberGlobal, checkDuplicateEmailGlobal } from "../lib/validation";
import { Admin, AdminSystem } from "../types";
import { 
  Lock, UserPlus, Users, Trash2, ShieldAlert, CheckCircle, XCircle, 
  Save, Loader2, Key, Search, Mail, Eye, Phone, MapPin, FileText, 
  Calendar, AlertCircle, X, Shield, User
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface AdminControlSectionProps {
  user: { email: string; role: string; name: string; adminRole?: string };
}

export default function AdminControlSection({ user }: AdminControlSectionProps) {
  const currentUserRole = user?.adminRole || "mother_admin";

  const [setupState, setSetupState] = useState<AdminSystem | null>(null);
  const [loadingSetup, setLoadingSetup] = useState(true);
  const [isSubmittingSetup, setIsSubmittingSetup] = useState(false);
  const [isSubmittingAdmin, setIsSubmittingAdmin] = useState(false);

  // Initial Setup Form
  const [setupEmail, setSetupEmail] = useState("");
  const [setupPassword, setSetupPassword] = useState("");

  // New Admin Registration Form Fields
  // Personal Info
  const [adminName, setAdminName] = useState("");
  const [fatherName, setFatherName] = useState("");
  const [motherName, setMotherName] = useState("");
  const [adminPhone, setAdminPhone] = useState("");
  const [address, setAddress] = useState("");
  const [nid, setNid] = useState("");
  const [fatherNid, setFatherNid] = useState("");
  const [motherNid, setMotherNid] = useState("");

  // Login Info
  const [adminLoginInput, setAdminLoginInput] = useState(""); // "মোবাইল অথবা ইমেইল"
  const [adminPassword, setAdminPassword] = useState("");

  // Role & Expiry Info
  const [adminRole, setAdminRole] = useState<Admin["role"]>("assistant_admin");
  const [adminExpiry, setAdminExpiry] = useState(""); // DateTime picker

  // Duplicate Check States
  const [phoneStatus, setPhoneStatus] = useState<{status: 'idle' | 'checking' | 'unique' | 'duplicate', duplicateInfo: any | null}>({status: 'idle', duplicateInfo: null});
  const [loginInputStatus, setLoginInputStatus] = useState<{status: 'idle' | 'checking' | 'unique' | 'duplicate', duplicateInfo: any | null}>({status: 'idle', duplicateInfo: null});

  // UI / Modal States
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [motherAdminCount, setMotherAdminCount] = useState(0);

  // Modals
  const [selectedAdminForDetail, setSelectedAdminForDetail] = useState<Admin | null>(null);
  const [selectedAdminForPasswordReset, setSelectedAdminForPasswordReset] = useState<Admin | null>(null);
  const [resetPasswordInput, setResetPasswordInput] = useState("");
  const [resetPasswordError, setResetPasswordError] = useState("");
  const [isSubmittingReset, setIsSubmittingReset] = useState(false);

  // Phone duplication check
  useEffect(() => {
    if (!adminPhone || adminPhone.length < 11) {
      setPhoneStatus({status: 'idle', duplicateInfo: null});
      return;
    }
    const check = async () => {
      setPhoneStatus({status: 'checking', duplicateInfo: null});
      const duplicate = await checkDuplicatePhoneNumberGlobal(adminPhone);
      if (duplicate) {
        setPhoneStatus({status: 'duplicate', duplicateInfo: duplicate});
      } else {
        setPhoneStatus({status: 'unique', duplicateInfo: null});
      }
    };
    const timer = setTimeout(check, 500);
    return () => clearTimeout(timer);
  }, [adminPhone]);

  // Login ID / Email duplication check
  useEffect(() => {
    if (!adminLoginInput || adminLoginInput.trim().length < 3) {
      setLoginInputStatus({status: 'idle', duplicateInfo: null});
      return;
    }
    const check = async () => {
      setLoginInputStatus({status: 'checking', duplicateInfo: null});
      if (adminLoginInput.includes("@")) {
        const duplicate = await checkDuplicateEmailGlobal(adminLoginInput.trim());
        if (duplicate) {
          setLoginInputStatus({status: 'duplicate', duplicateInfo: duplicate});
        } else {
          setLoginInputStatus({status: 'unique', duplicateInfo: null});
        }
      } else {
        const duplicate = await checkDuplicatePhoneNumberGlobal(adminLoginInput.trim());
        if (duplicate) {
          setLoginInputStatus({status: 'duplicate', duplicateInfo: duplicate});
        } else {
          setLoginInputStatus({status: 'unique', duplicateInfo: null});
        }
      }
    };
    const timer = setTimeout(check, 500);
    return () => clearTimeout(timer);
  }, [adminLoginInput]);

  useEffect(() => {
    const unsubSetup = onSnapshot(doc(db, "admin_system", "config"), (snap) => {
      if (snap.exists()) {
        setSetupState(snap.data() as AdminSystem);
      } else {
        setSetupState({ isSetupComplete: false });
      }
      setLoadingSetup(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, "admin_system/config");
      setLoadingSetup(false);
    });

    const unsubAdmins = onSnapshot(collection(db, "admins"), (snap) => {
      const mothers = snap.docs.filter(d => d.data().role === "mother_admin");
      setMotherAdminCount(mothers.length);
    });

    return () => {
      unsubSetup();
      unsubAdmins();
    };
  }, []);

  const handleInitialSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!setupEmail || !setupPassword) return;
    if (setupPassword.length < 8) {
      alert("পাসওয়ার্ড কমপক্ষে ৮ সংখ্যার বা অক্ষরের হতে হবে।");
      return;
    }
    setIsSubmittingSetup(true);
    try {
      const adminId = `admin_${Date.now()}`;
      await setDoc(doc(db, "admins", adminId), {
        name: "মাদার এডমিন",
        fatherName: "প্রধান অভিভাবক",
        motherName: "প্রধান অভিভাবক",
        email: setupEmail.toLowerCase(),
        loginId: setupEmail.toLowerCase(),
        phone: "01700000000",
        address: "মাদ্রাসা ক্যাম্পাস",
        nid: "1234567890",
        password: setupPassword,
        role: "mother_admin",
        status: "active",
        createdAt: serverTimestamp()
      });

      await setDoc(doc(db, "admin_system", "config"), {
        isSetupComplete: true
      });

      alert("মাদার এডমিন সেটআপ সফল হয়েছে!");
    } catch (err) {
      console.error("Initial setup failed:", err);
      alert("সেটআপ ব্যর্থ হয়েছে। পুনরায় চেষ্টা করুন।");
    } finally {
      setIsSubmittingSetup(false);
    }
  };

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();

    // Required field validation
    if (!adminName || !fatherName || !motherName || !adminPhone || !address || !nid || !adminLoginInput || !adminPassword) {
      alert("সকল বাধ্যতামূলক ঘরগুলো সঠিকভাবে পূরণ করুন।");
      return;
    }

    // Strict Password validation (min 8 characters)
    if (adminPassword.length < 8) {
      alert("পাসওয়ার্ড কমপক্ষে ৮ সংখ্যার বা অক্ষরের হতে হবে।");
      return;
    }

    if (adminRole === "mother_admin" && motherAdminCount >= 2) {
      alert("মাদার এডমিন সর্বোচ্চ ২ জন হতে পারবে।");
      return;
    }

    if (adminRole === "assistant_admin" && !adminExpiry) {
      alert("সহকারী এডমিনের জন্য মেয়াদের তারিখ ও সময় নির্ধারণ করুন।");
      return;
    }

    setIsSubmittingAdmin(true);

    try {
      const adminId = `admin_${Date.now()}`;
      const loginIdVal = adminLoginInput.trim().toLowerCase();
      const emailVal = loginIdVal.includes("@") ? loginIdVal : `${adminPhone.trim()}@sufianooria.com`;

      const payload: any = {
        name: adminName.trim(),
        fatherName: fatherName.trim(),
        motherName: motherName.trim(),
        phone: adminPhone.trim(),
        address: address.trim(),
        nid: nid.trim(),
        fatherNid: fatherNid.trim(),
        motherNid: motherNid.trim(),
        loginId: loginIdVal,
        email: emailVal,
        password: adminPassword,
        role: adminRole,
        status: "active",
        createdAt: serverTimestamp()
      };

      if (adminRole === "assistant_admin") {
        payload.expiryTimestamp = adminExpiry;
      }

      await setDoc(doc(db, "admins", adminId), payload);

      // Reset form
      setAdminName("");
      setFatherName("");
      setMotherName("");
      setAdminPhone("");
      setAddress("");
      setNid("");
      setFatherNid("");
      setMotherNid("");
      setAdminLoginInput("");
      setAdminPassword("");
      setAdminRole("assistant_admin");
      setAdminExpiry("");
      setShowAddForm(false);
      alert("নতুন এডমিন সফলভাবে যোগ করা হয়েছে!");
    } catch (err) {
      console.error("Error adding admin:", err);
      alert("এডমিন যোগ করতে সমস্যা হয়েছে।");
    } finally {
      setIsSubmittingAdmin(false);
    }
  };

  // Hierarchical Permission Rules for Status Toggle (Lock/Disable/Active)
  const handleUpdateStatus = async (targetAdmin: Admin, newStatus: "active" | "suspended") => {
    // 1. Mother Admin Rules
    if (targetAdmin.role === "mother_admin") {
      if (currentUserRole === "mother_admin") {
        alert("মাদার এডমিন অন্য কোনো মাদার এডমিনকে লক বা ডিজেবল করতে পারবে না।");
        return;
      }
      if (currentUserRole === "super_admin") {
        alert("সুপার এডমিন মাদার এডমিনকে লক বা ডিজেবল করতে পারবে না।");
        return;
      }
      alert("মাদার এডমিনকে লক বা ডিজেবল করা সম্ভব নয়।");
      return;
    }

    // Assistant Admin cannot toggle admin status
    if (currentUserRole === "assistant_admin") {
      alert("সহকারী এডমিনদের এই কাজের অনুমতি নেই।");
      return;
    }

    try {
      await updateDoc(doc(db, "admins", targetAdmin.id), { status: newStatus });
      alert(`এডমিন একাউন্টটি ${newStatus === 'active' ? 'সক্রিয়' : 'স্থগিত/লক'} করা হয়েছে।`);
    } catch (err) {
      console.error("Error updating status:", err);
      alert("স্ট্যাটাস পরিবর্তন করতে সমস্যা হয়েছে।");
    }
  };

  // Hierarchical Permission Rules for Delete Admin
  const handleDeleteAdmin = async (targetAdmin: Admin) => {
    if (targetAdmin.role === "mother_admin") {
      alert("মাদার এডমিন একাউন্ট ডিলিট করা সম্ভব নয়।");
      return;
    }

    if (currentUserRole === "assistant_admin") {
      alert("সহকারী এডমিনদের এডমিন ডিলিট করার অনুমতি নেই।");
      return;
    }

    if (!window.confirm(`আপনি কি নিশ্চিতভাবে "${targetAdmin.name}" একাউন্টটি ডিলিট করতে চান?`)) return;

    try {
      await deleteDoc(doc(db, "admins", targetAdmin.id));
      alert("এডমিন একাউন্ট সফলভাবে ডিলিট করা হয়েছে।");
    } catch (err) {
      console.error("Error deleting admin:", err);
      alert("ডিলিট করতে সমস্যা হয়েছে।");
    }
  };

  // Open Password Reset Modal with Permission Checks
  const openPasswordResetModal = (targetAdmin: Admin) => {
    // Permission checks:
    // Mother Admin can reset password for Assistant Admin, Super Admin, and Mother Admin ("তবে প্রয়োজন হলে অন্য মাদার এডমিনের পাসওয়ার্ড রিসেট করতে পারবে")
    // Super Admin CANNOT reset Mother Admin password
    if (targetAdmin.role === "mother_admin" && currentUserRole !== "mother_admin") {
      alert("সুপার এডমিন মাদার এডমিনের পাসওয়ার্ড পরিবর্তন করতে পারবে না।");
      return;
    }

    if (currentUserRole === "assistant_admin") {
      alert("সহকারী এডমিনদের পাসওয়ার্ড রিসেট করার অনুমতি নেই।");
      return;
    }

    setSelectedAdminForPasswordReset(targetAdmin);
    setResetPasswordInput("");
    setResetPasswordError("");
  };

  // Submit Password Reset
  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAdminForPasswordReset) return;

    if (resetPasswordInput.length < 8) {
      setResetPasswordError("পাসওয়ার্ড কমপক্ষে ৮ সংখ্যার বা অক্ষরের হতে হবে।");
      return;
    }

    setIsSubmittingReset(true);
    setResetPasswordError("");

    try {
      await updateDoc(doc(db, "admins", selectedAdminForPasswordReset.id), {
        password: resetPasswordInput
      });
      alert(`"${selectedAdminForPasswordReset.name}" এর পাসওয়ার্ড সফলভাবে আপডেট করা হয়েছে।`);
      setSelectedAdminForPasswordReset(null);
      setResetPasswordInput("");
    } catch (err) {
      console.error("Error resetting password:", err);
      setResetPasswordError("পাসওয়ার্ড রিসেট করতে সমস্যা হয়েছে।");
    } finally {
      setIsSubmittingReset(false);
    }
  };

  if (loadingSetup) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <Loader2 className="h-10 w-10 text-emerald-600 animate-spin" />
        <p className="text-slate-500 font-bold">লোড হচ্ছে...</p>
      </div>
    );
  }

  // Initial setup form if not complete
  if (!setupState?.isSetupComplete) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md mx-auto bg-white border border-emerald-100 rounded-[2rem] shadow-2xl overflow-hidden mt-10 font-['Noto_Serif_Bengali']"
      >
        <div className="bg-emerald-800 p-8 text-center space-y-2">
          <div className="bg-amber-400 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto shadow-lg mb-2">
            <Lock className="h-8 w-8 text-emerald-900" />
          </div>
          <h2 className="text-2xl font-black text-white">মাদার এডমিন সেটআপ</h2>
          <p className="text-emerald-100 text-sm opacity-80">প্রথমবারের মতো এডমিন একাউন্ট তৈরি করুন</p>
        </div>

        <form onSubmit={handleInitialSetup} className="p-8 space-y-6">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block ml-1">এডমিন ইমেইল</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input 
                type="email"
                required
                value={setupEmail}
                onChange={(e) => setSetupEmail(e.target.value)}
                placeholder="example@gmail.com"
                className="w-full pl-11 pr-4 py-3 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-sm"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block ml-1">সিক্রেট পাসওয়ার্ড (কমপক্ষে ৮ সংখ্যা)</label>
            <div className="relative">
              <Key className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input 
                type="password"
                required
                value={setupPassword}
                onChange={(e) => setSetupPassword(e.target.value)}
                placeholder="কমপক্ষে ৮ অক্ষরের পাসওয়ার্ড"
                className="w-full pl-11 pr-4 py-3 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-sm font-sans"
              />
            </div>
          </div>

          <button 
            type="submit"
            disabled={isSubmittingSetup}
            className="w-full py-4 bg-emerald-800 hover:bg-emerald-900 text-amber-400 font-black rounded-2xl shadow-xl transition-all flex items-center justify-center space-x-2 text-base disabled:opacity-50"
          >
            {isSubmittingSetup ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
            <span>সেটআপ সম্পন্ন করুন</span>
          </button>
        </form>
      </motion.div>
    );
  }

  return (
    <div className="space-y-8 font-['Noto_Serif_Bengali']">
      {/* Top Banner & Control Header */}
      <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 rounded-[2.5rem] p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-amber-500/10 rounded-full blur-2xl"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 bg-amber-400/20 border border-amber-400/30 backdrop-blur-md px-3 py-1 rounded-full text-amber-300 text-xs font-bold">
              <Shield className="h-3.5 w-3.5" />
              <span>এডমিন এক্সেস কন্ট্রোল</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-amber-300">
              এডমিন কন্ট্রোল ও পারমিশন ম্যানেজমেন্ট
            </h2>
            <p className="text-emerald-100/80 text-xs sm:text-sm max-w-xl">
              নতুন এডমিন রেজিস্ট্রেশন, পারমিশন রোলস (Mother Admin, Super Admin, Assistant Admin) এবং পাসওয়ার্ড রিসেট নিয়ন্ত্রণ করুন।
            </p>
          </div>

          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="bg-amber-400 hover:bg-amber-300 text-emerald-950 px-6 py-3.5 rounded-2xl font-black text-sm shadow-lg transition-all flex items-center justify-center gap-2 shrink-0 active:scale-95"
          >
            <UserPlus className="h-5 w-5" />
            <span>{showAddForm ? "ফর্ম বন্ধ করুন" : "নতুন এডমিন যোগ করুন"}</span>
          </button>
        </div>
      </div>

      {/* Add Admin Form Drawer */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-white border-2 border-emerald-100 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <h3 className="text-lg sm:text-xl font-black text-emerald-950 flex items-center gap-2">
                  <UserPlus className="h-5.5 w-5.5 text-emerald-600" />
                  নতুন এডমিন রেজিস্ট্রেশন ফরম
                </h3>
                <button onClick={() => setShowAddForm(false)} className="text-slate-400 hover:text-red-500 transition-colors p-1">
                  <XCircle className="h-6 w-6" />
                </button>
              </div>

              <form onSubmit={handleAddAdmin} className="space-y-6">
                {/* 1. Personal Information Section */}
                <div className="space-y-4">
                  <h4 className="text-sm font-black text-emerald-800 bg-emerald-50 px-3.5 py-2 rounded-xl border border-emerald-100 inline-flex items-center gap-2">
                    <User className="h-4 w-4 text-emerald-600" />
                    ব্যক্তিগত তথ্য (Personal Information)
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Name */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 ml-1">এডমিনের পূর্ণ নাম <span className="text-red-500">*</span></label>
                      <input 
                        type="text"
                        required
                        value={adminName}
                        onChange={(e) => setAdminName(e.target.value)}
                        placeholder="এডমিনের নাম লিখুন"
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-sm"
                      />
                    </div>

                    {/* Father Name */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 ml-1">পিতার নাম <span className="text-red-500">*</span></label>
                      <input 
                        type="text"
                        required
                        value={fatherName}
                        onChange={(e) => setFatherName(e.target.value)}
                        placeholder="পিতার নাম লিখুন"
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-sm"
                      />
                    </div>

                    {/* Mother Name */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 ml-1">মাতার নাম <span className="text-red-500">*</span></label>
                      <input 
                        type="text"
                        required
                        value={motherName}
                        onChange={(e) => setMotherName(e.target.value)}
                        placeholder="মাতার নাম লিখুন"
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-sm"
                      />
                    </div>

                    {/* Phone Number */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 ml-1">কন্টাক্ট নাম্বার <span className="text-red-500">*</span></label>
                      <div className="relative">
                        <input 
                          type="tel"
                          required
                          value={adminPhone}
                          onChange={(e) => setAdminPhone(e.target.value)}
                          placeholder="01XXXXXXXXX"
                          className={`w-full px-4 py-3 rounded-xl border outline-none transition-all text-sm font-sans ${
                            phoneStatus.status === 'duplicate' ? 'border-red-400 bg-red-50' : 
                            phoneStatus.status === 'unique' ? 'border-emerald-500 bg-emerald-50/30' : 'border-slate-200 focus:ring-2 focus:ring-emerald-500'
                          }`}
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          {phoneStatus.status === 'checking' && <Loader2 className="w-4 h-4 animate-spin text-slate-400" />}
                          {phoneStatus.status === 'unique' && <CheckCircle className="w-4 h-4 text-emerald-500" />}
                          {phoneStatus.status === 'duplicate' && <XCircle className="w-4 h-4 text-red-500" />}
                        </div>
                      </div>
                      {phoneStatus.status === 'duplicate' && (
                        <p className="text-[10px] font-bold text-red-500 mt-1">⚠ এই নাম্বারটি ইতিমধ্যে ব্যবহৃত হচ্ছে।</p>
                      )}
                    </div>

                    {/* Address */}
                    <div className="space-y-1.5 md:col-span-2">
                      <label className="text-xs font-bold text-slate-700 ml-1">বর্তমান ও স্থায়ী ঠিকানা <span className="text-red-500">*</span></label>
                      <input 
                        type="text"
                        required
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="গ্রাম/রাস্তা, ডাকঘর, থানা, জেলা"
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-sm"
                      />
                    </div>

                    {/* NID */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 ml-1">এনআইডি (NID) নাম্বার <span className="text-red-500">*</span></label>
                      <input 
                        type="text"
                        required
                        value={nid}
                        onChange={(e) => setNid(e.target.value)}
                        placeholder="এনআইডি নাম্বার লিখুন"
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-sm font-sans"
                      />
                    </div>

                    {/* Father's NID */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 ml-1">পিতার এনআইডি নাম্বার (ঐচ্ছিক)</label>
                      <input 
                        type="text"
                        value={fatherNid}
                        onChange={(e) => setFatherNid(e.target.value)}
                        placeholder="পিতার এনআইডি নাম্বার"
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-sm font-sans"
                      />
                    </div>

                    {/* Mother's NID */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 ml-1">মাতার এনআইডি নাম্বার (ঐচ্ছিক)</label>
                      <input 
                        type="text"
                        value={motherNid}
                        onChange={(e) => setMotherNid(e.target.value)}
                        placeholder="মাতার এনআইডি নাম্বার"
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-sm font-sans"
                      />
                    </div>
                  </div>
                </div>

                {/* 2. Login Information Section */}
                <div className="space-y-4 pt-2 border-t border-slate-100">
                  <h4 className="text-sm font-black text-emerald-800 bg-emerald-50 px-3.5 py-2 rounded-xl border border-emerald-100 inline-flex items-center gap-2">
                    <Key className="h-4 w-4 text-emerald-600" />
                    লগইন তথ্য (Login Credentials)
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Mobile or Email (Login ID) */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 ml-1">
                        মোবাইল অথবা ইমেইল (লগইন আইডি) <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <input 
                          type="text"
                          required
                          value={adminLoginInput}
                          onChange={(e) => setAdminLoginInput(e.target.value)}
                          placeholder="যেমন: 017XXXXXXXX অথবা example@gmail.com"
                          className={`w-full px-4 py-3 rounded-xl border outline-none transition-all text-sm font-sans ${
                            loginInputStatus.status === 'duplicate' ? 'border-red-400 bg-red-50' : 
                            loginInputStatus.status === 'unique' ? 'border-emerald-500 bg-emerald-50/30' : 'border-slate-200 focus:ring-2 focus:ring-emerald-500'
                          }`}
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          {loginInputStatus.status === 'checking' && <Loader2 className="w-4 h-4 animate-spin text-slate-400" />}
                          {loginInputStatus.status === 'unique' && <CheckCircle className="w-4 h-4 text-emerald-500" />}
                          {loginInputStatus.status === 'duplicate' && <XCircle className="w-4 h-4 text-red-500" />}
                        </div>
                      </div>
                      <p className="text-[10px] text-slate-500 ml-1">যেকোনো একটি দিয়ে সিস্টেমে লগইন করা যাবে।</p>
                    </div>

                    {/* Password with min 8 chars validation */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 ml-1">
                        সিক্রেট পাসওয়ার্ড (কমপক্ষে ৮ সংখ্যা) <span className="text-red-500">*</span>
                      </label>
                      <input 
                        type="password"
                        required
                        minLength={8}
                        value={adminPassword}
                        onChange={(e) => setAdminPassword(e.target.value)}
                        placeholder="কমপক্ষে ৮ সংখ্যার স্ট্রিক্ট পাসওয়ার্ড"
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-sm font-sans"
                      />
                      {adminPassword.length > 0 && adminPassword.length < 8 && (
                        <p className="text-[10px] font-bold text-red-500 ml-1">⚠ পাসওয়ার্ড অন্তত ৮ সংখ্যার বা অক্ষরের হতে হবে।</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* 3. Role & Time Limit Section */}
                <div className="space-y-4 pt-2 border-t border-slate-100">
                  <h4 className="text-sm font-black text-emerald-800 bg-emerald-50 px-3.5 py-2 rounded-xl border border-emerald-100 inline-flex items-center gap-2">
                    <Shield className="h-4 w-4 text-emerald-600" />
                    পারমিশন রোল ও এক্সেস টাইম লিমিট
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Role Select */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 ml-1">এডমিন রোল (Role)</label>
                      <select 
                        value={adminRole}
                        onChange={(e) => setAdminRole(e.target.value as any)}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-sm font-bold"
                      >
                        <option value="assistant_admin">সহকারী এডমিন (Assistant Admin)</option>
                        <option value="super_admin">সুপার এডমিন (Super Admin)</option>
                        <option value="mother_admin" disabled={motherAdminCount >= 2}>
                          মাদার এডমিন (Mother Admin) {motherAdminCount >= 2 ? "(সর্বোচ্চ ২ জন পূরণ)" : ""}
                        </option>
                      </select>
                    </div>

                    {/* Expiry Date/Time Picker for Assistant Admin */}
                    {adminRole === "assistant_admin" && (
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700 ml-1 text-orange-600 flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          টাইম লিমিট / মেয়াদের তারিখ ও সময় <span className="text-red-500">*</span>
                        </label>
                        <input 
                          type="datetime-local"
                          required
                          value={adminExpiry}
                          onChange={(e) => setAdminExpiry(e.target.value)}
                          className="w-full px-4 py-3 rounded-xl border border-orange-300 focus:ring-2 focus:ring-orange-500 outline-none transition-all text-sm font-sans bg-orange-50/20"
                        />
                        <p className="text-[10px] text-orange-600 ml-1">এই সময় পার হয়ে গেলে সহকারী এডমিনের লগইন অটো ব্লক হয়ে যাবে।</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-3">
                  <button 
                    type="submit"
                    disabled={isSubmittingAdmin || phoneStatus.status === 'duplicate' || loginInputStatus.status === 'duplicate' || adminPassword.length < 8}
                    className="w-full py-4 bg-emerald-800 hover:bg-emerald-950 text-amber-400 font-black rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 text-base cursor-pointer"
                  >
                    {isSubmittingAdmin ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                    <span>এডমিন একাউন্ট তৈরি করুন</span>
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Admin List with Firestore StreamBuilder */}
      <div className="bg-white border border-slate-200 rounded-[2rem] shadow-sm overflow-hidden">
        <div className="p-6 bg-slate-50/50 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h3 className="font-black text-emerald-950 flex items-center gap-2 text-lg">
            <Users className="h-5 w-5 text-emerald-600" />
            বর্তমান এডমিন তালিকা (লাইভ ফায়ারস্টোর)
          </h3>
          <div className="relative max-w-xs w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input 
              type="text"
              placeholder="এডমিনের নাম, ইমেইল বা ফোন খুজুন..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <StreamBuilder<Admin>
            stream={collection(db, "admins")}
            builder={(admins, loading) => {
              if (loading) {
                return (
                  <div className="p-20 text-center space-y-3">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-emerald-600" />
                    <p className="text-slate-400 text-xs font-bold">এডমিন ডাটা লোড হচ্ছে...</p>
                  </div>
                );
              }

              const filteredAdmins = admins.filter(a => 
                a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (a.email && a.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
                (a.loginId && a.loginId.toLowerCase().includes(searchQuery.toLowerCase())) ||
                (a.phone && a.phone.includes(searchQuery))
              );

              if (filteredAdmins.length === 0) {
                return (
                  <div className="py-20 text-center space-y-3">
                    <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto">
                      <Users className="h-8 w-8 text-slate-300" />
                    </div>
                    <p className="text-slate-400 font-bold">কোনো এডমিন পাওয়া যায়নি</p>
                  </div>
                );
              }

              return (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/80 text-[11px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-100">
                      <th className="p-5">নাম ও কন্টাক্ট</th>
                      <th className="p-5">রোল (Role)</th>
                      <th className="p-5">স্ট্যাটাস (Status)</th>
                      <th className="p-5">অ্যাকশন (Actions)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredAdmins.map((admin) => (
                      <tr key={admin.id} className="hover:bg-emerald-50/20 transition-colors group">
                        {/* Name & Contact */}
                        <td className="p-5">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-white shadow-sm shrink-0 ${
                              admin.role === 'mother_admin' ? 'bg-emerald-800' : 
                              admin.role === 'super_admin' ? 'bg-amber-500' : 'bg-slate-500'
                            }`}>
                              {admin.name.charAt(0)}
                            </div>
                            <div>
                              <p className="font-black text-slate-900 text-sm leading-tight">{admin.name}</p>
                              <p className="text-[11px] text-slate-500 mt-0.5 font-sans flex items-center gap-2">
                                <span>{admin.phone}</span>
                                {admin.email && <span>• {admin.email}</span>}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Role Badge */}
                        <td className="p-5">
                          <div className="flex flex-col items-start gap-1">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black ${
                              admin.role === 'mother_admin' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 
                              admin.role === 'super_admin' ? 'bg-amber-100 text-amber-900 border border-amber-300' : 'bg-slate-100 text-slate-700 border border-slate-300'
                            }`}>
                              {admin.role === 'mother_admin' ? 'মাদার এডমিন' : 
                               admin.role === 'super_admin' ? 'সুপার এডমিন' : 'সহকারী এডমিন'}
                            </span>

                            {admin.role === 'assistant_admin' && admin.expiryTimestamp && (
                              <span className="text-[9px] text-orange-600 font-bold font-sans flex items-center gap-1 bg-orange-50 px-2 py-0.5 rounded-md border border-orange-200">
                                <Calendar className="h-2.5 w-2.5" />
                                মেয়াদ: {new Date(admin.expiryTimestamp).toLocaleString('bn-BD')}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Status */}
                        <td className="p-5">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold ${
                            admin.status === 'active' ? 'text-emerald-700 bg-emerald-50 border border-emerald-200' : 'text-red-700 bg-red-50 border border-red-200'
                          }`}>
                            <div className={`h-1.5 w-1.5 rounded-full ${admin.status === 'active' ? 'bg-emerald-600' : 'bg-red-600'}`}></div>
                            {admin.status === 'active' ? 'সক্রিয়' : 'স্থগিত/লক'}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="p-5">
                          <div className="flex items-center gap-1.5 sm:gap-2">
                            {/* 1. View Details */}
                            <button 
                              onClick={() => setSelectedAdminForDetail(admin)}
                              title="বিস্তারিত তথ্য দেখুন"
                              className="p-2 text-emerald-700 hover:bg-emerald-100/60 rounded-xl transition-colors cursor-pointer"
                            >
                              <Eye className="h-4.5 w-4.5" />
                            </button>

                            {/* 2. Reset Password */}
                            <button 
                              onClick={() => openPasswordResetModal(admin)}
                              title="পাসওয়ার্ড রিসেট করুন"
                              className="p-2 text-amber-600 hover:bg-amber-100/60 rounded-xl transition-colors cursor-pointer"
                            >
                              <Key className="h-4.5 w-4.5" />
                            </button>

                            {/* 3. Toggle Status (Lock/Active) */}
                            {admin.status === 'active' ? (
                              <button 
                                onClick={() => handleUpdateStatus(admin, 'suspended')}
                                title="স্থগিত/লক করুন"
                                className="p-2 text-rose-600 hover:bg-rose-100/60 rounded-xl transition-colors cursor-pointer"
                              >
                                <ShieldAlert className="h-4.5 w-4.5" />
                              </button>
                            ) : (
                              <button 
                                onClick={() => handleUpdateStatus(admin, 'active')}
                                title="সক্রিয় করুন"
                                className="p-2 text-emerald-600 hover:bg-emerald-100/60 rounded-xl transition-colors cursor-pointer"
                              >
                                <CheckCircle className="h-4.5 w-4.5" />
                              </button>
                            )}

                            {/* 4. Delete Admin */}
                            <button 
                              onClick={() => handleDeleteAdmin(admin)}
                              title="ডিলিট করুন"
                              className="p-2 text-red-500 hover:bg-red-100/60 rounded-xl transition-colors cursor-pointer"
                            >
                              <Trash2 className="h-4.5 w-4.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              );
            }}
          />
        </div>
      </div>

      {/* ----------------- MODAL 1: Admin Details Dialog ----------------- */}
      <AnimatePresence>
        {selectedAdminForDetail && (
          <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl p-6 sm:p-8 relative overflow-hidden font-['Noto_Serif_Bengali'] max-h-[90vh] overflow-y-auto"
            >
              {/* Header Bar */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
                <div className="flex items-center gap-3">
                  <div className="bg-emerald-100 p-3 rounded-2xl text-emerald-800">
                    <FileText className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-900">
                      এডমিনের বিস্তারিত তথ্য
                    </h3>
                    <p className="text-xs text-slate-500">সুফিয়া নূরীয়া দাখিল মাদ্রাসা এডমিন রেকর্ড</p>
                  </div>
                </div>

                <button 
                  onClick={() => setSelectedAdminForDetail(null)}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Details Content */}
              <div className="space-y-6">
                {/* Header Badge Row */}
                <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <span className="text-xs text-slate-500 block">এডমিনের নাম</span>
                    <span className="text-lg font-black text-emerald-950">{selectedAdminForDetail.name}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-black ${
                      selectedAdminForDetail.role === 'mother_admin' ? 'bg-emerald-800 text-amber-300' :
                      selectedAdminForDetail.role === 'super_admin' ? 'bg-amber-500 text-white' : 'bg-slate-700 text-white'
                    }`}>
                      {selectedAdminForDetail.role === 'mother_admin' ? 'মাদার এডমিন' :
                       selectedAdminForDetail.role === 'super_admin' ? 'সুপার এডমিন' : 'সহকারী এডমিন'}
                    </span>

                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      selectedAdminForDetail.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {selectedAdminForDetail.status === 'active' ? 'সক্রিয়' : 'স্থগিত/লক'}
                    </span>
                  </div>
                </div>

                {/* Personal Information Grid */}
                <div className="space-y-3">
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-1">
                    ব্যক্তিগত পরিচিতি
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm">
                    <div className="bg-slate-50 p-3 rounded-xl">
                      <span className="text-slate-400 text-[11px] block">পিতার নাম</span>
                      <span className="font-bold text-slate-800">{selectedAdminForDetail.fatherName || "তথ্য নেই"}</span>
                    </div>

                    <div className="bg-slate-50 p-3 rounded-xl">
                      <span className="text-slate-400 text-[11px] block">মাতার নাম</span>
                      <span className="font-bold text-slate-800">{selectedAdminForDetail.motherName || "তথ্য নেই"}</span>
                    </div>

                    <div className="bg-slate-50 p-3 rounded-xl">
                      <span className="text-slate-400 text-[11px] block">কন্টাক্ট মোবাইল</span>
                      <span className="font-bold text-slate-800 font-sans">{selectedAdminForDetail.phone}</span>
                    </div>

                    <div className="bg-slate-50 p-3 rounded-xl">
                      <span className="text-slate-400 text-[11px] block">ইমেইল / লগইন আইডি</span>
                      <span className="font-bold text-slate-800 font-sans">{selectedAdminForDetail.loginId || selectedAdminForDetail.email}</span>
                    </div>

                    <div className="bg-slate-50 p-3 rounded-xl sm:col-span-2">
                      <span className="text-slate-400 text-[11px] block">ঠিকানা</span>
                      <span className="font-bold text-slate-800">{selectedAdminForDetail.address || "তথ্য নেই"}</span>
                    </div>

                    <div className="bg-slate-50 p-3 rounded-xl">
                      <span className="text-slate-400 text-[11px] block">এনআইডি (NID)</span>
                      <span className="font-bold text-slate-800 font-sans">{selectedAdminForDetail.nid || "তথ্য নেই"}</span>
                    </div>

                    <div className="bg-slate-50 p-3 rounded-xl">
                      <span className="text-slate-400 text-[11px] block">পিতার এনআইডি</span>
                      <span className="font-bold text-slate-800 font-sans">{selectedAdminForDetail.fatherNid || "তথ্য নেই"}</span>
                    </div>

                    <div className="bg-slate-50 p-3 rounded-xl">
                      <span className="text-slate-400 text-[11px] block">মাতার এনআইডি</span>
                      <span className="font-bold text-slate-800 font-sans">{selectedAdminForDetail.motherNid || "তথ্য নেই"}</span>
                    </div>

                    {selectedAdminForDetail.role === "assistant_admin" && (
                      <div className="bg-orange-50 p-3 rounded-xl border border-orange-200 sm:col-span-2">
                        <span className="text-orange-600 text-[11px] font-bold block">সহকারী এডমিন অ্যাক্সেস মেয়াদ</span>
                        <span className="font-bold text-orange-950 font-sans">
                          {selectedAdminForDetail.expiryTimestamp ? new Date(selectedAdminForDetail.expiryTimestamp).toLocaleString('bn-BD') : 'মেয়াদহীন/অসীম'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Close Button */}
              <div className="mt-8 pt-4 border-t border-slate-100 flex justify-end">
                <button
                  onClick={() => setSelectedAdminForDetail(null)}
                  className="px-6 py-3 bg-slate-900 text-white font-black rounded-2xl text-sm shadow-md hover:bg-slate-800 transition-all cursor-pointer"
                >
                  বন্ধ করুন
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ----------------- MODAL 2: Reset Password Dialog ----------------- */}
      <AnimatePresence>
        {selectedAdminForPasswordReset && (
          <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl p-6 sm:p-8 relative overflow-hidden font-['Noto_Serif_Bengali']"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
                <div className="flex items-center gap-2.5">
                  <div className="bg-amber-100 p-2.5 rounded-2xl text-amber-800">
                    <Key className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900">
                      পাসওয়ার্ড রিসেট করুন
                    </h3>
                    <p className="text-xs text-slate-500">{selectedAdminForPasswordReset.name}</p>
                  </div>
                </div>

                <button 
                  onClick={() => setSelectedAdminForPasswordReset(null)}
                  className="p-2 text-slate-400 hover:text-slate-600 rounded-full transition-colors cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">
                    নতুন পাসওয়ার্ড (কমপক্ষে ৮ সংখ্যা) <span className="text-red-500">*</span>
                  </label>
                  <input 
                    type="password"
                    required
                    minLength={8}
                    value={resetPasswordInput}
                    onChange={(e) => setResetPasswordInput(e.target.value)}
                    placeholder="নতুন পাসওয়ার্ড প্রদান করুন"
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-sm font-sans"
                  />
                </div>

                {resetPasswordError && (
                  <p className="text-xs font-bold text-red-500 bg-red-50 p-3 rounded-xl border border-red-200">
                    ⚠ {resetPasswordError}
                  </p>
                )}

                <div className="flex items-center justify-end gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setSelectedAdminForPasswordReset(null)}
                    className="px-5 py-3 bg-slate-100 text-slate-700 font-bold rounded-2xl text-xs hover:bg-slate-200 transition-all cursor-pointer"
                  >
                    বাতিল
                  </button>

                  <button
                    type="submit"
                    disabled={isSubmittingReset || resetPasswordInput.length < 8}
                    className="px-6 py-3 bg-emerald-800 text-amber-400 font-black rounded-2xl text-xs shadow-lg hover:bg-emerald-950 transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                  >
                    {isSubmittingReset ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    <span>পাসওয়ার্ড আপডেট করুন</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
