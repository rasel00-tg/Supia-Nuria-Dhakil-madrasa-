import React, { useState, useEffect } from "react";
import { collection, doc, setDoc, updateDoc, deleteDoc, query, onSnapshot, getDoc, serverTimestamp, where, getDocs } from "firebase/firestore";
import { db, StreamBuilder, handleFirestoreError, OperationType } from "../lib/firebase";
import { checkDuplicatePhoneNumberGlobal, checkDuplicateEmailGlobal } from "../lib/validation";
import { Admin, AdminSystem } from "../types";
import { Lock, UserPlus, Users, Trash2, ShieldAlert, CheckCircle, XCircle, Clock, Save, Loader2, Key, ShieldCheck, Search, Shield, Mail } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface AdminControlSectionProps {
  user: { email: string; role: string; name: string };
}

export default function AdminControlSection({ user }: AdminControlSectionProps) {
  const [setupState, setSetupState] = useState<AdminSystem | null>(null);
  const [loadingSetup, setLoadingSetup] = useState(true);
  const [isSubmittingSetup, setIsSubmittingSetup] = useState(false);
  const [isSubmittingAdmin, setIsSubmittingAdmin] = useState(false);
  
  // Setup Form
  const [setupEmail, setSetupEmail] = useState("");
  const [setupPassword, setSetupPassword] = useState("");
  
  // Admin Form
  const [adminName, setAdminName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [adminPhone, setAdminPhone] = useState("");
  const [phoneStatus, setPhoneStatus] = useState<{status: 'idle' | 'checking' | 'unique' | 'duplicate', duplicateInfo: any | null}>({status: 'idle', duplicateInfo: null});
  const [emailStatus, setEmailStatus] = useState<{status: 'idle' | 'checking' | 'unique' | 'duplicate', duplicateInfo: any | null}>({status: 'idle', duplicateInfo: null});

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

  useEffect(() => {
    if (!adminEmail || !adminEmail.includes("@")) {
      setEmailStatus({status: 'idle', duplicateInfo: null});
      return;
    }
    const check = async () => {
      setEmailStatus({status: 'checking', duplicateInfo: null});
      const duplicate = await checkDuplicateEmailGlobal(adminEmail);
      if (duplicate) {
        setEmailStatus({status: 'duplicate', duplicateInfo: duplicate});
      } else {
        setEmailStatus({status: 'unique', duplicateInfo: null});
      }
    };
    const timer = setTimeout(check, 500);
    return () => clearTimeout(timer);
  }, [adminEmail]);

  const [adminRole, setAdminRole] = useState<Admin["role"]>("assistant_admin");
  const [adminExpiry, setAdminExpiry] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const [motherAdminCount, setMotherAdminCount] = useState(0);

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
    setIsSubmittingSetup(true);
    try {
      const adminId = `admin_${Date.now()}`;
      // Create first Mother Admin
      await setDoc(doc(db, "admins", adminId), {
        name: "মাদার এডমিন",
        email: setupEmail,
        loginId: setupEmail.toLowerCase(),
        phone: "01700000000", // Default
        password: setupPassword,
        role: "mother_admin",
        status: "active",
        createdAt: serverTimestamp()
      });

      // Mark setup as complete
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
    if (!adminName || !adminEmail || !adminPassword || !adminPhone) {
      alert("সবগুলো তথ্য সঠিকভাবে পূরণ করুন।");
      return;
    }

    if (adminRole === "mother_admin" && motherAdminCount >= 2) {
      alert("মাদার এডমিন সর্বোচ্চ ২ জন হতে পারবে।");
      return;
    }

    if (adminRole === "assistant_admin" && !adminExpiry) {
      alert("সহকারী এডমিনের জন্য মেয়াদের তারিখ নির্ধারণ করুন।");
      return;
    }

    setIsSubmittingAdmin(true);
    try {
      const adminId = `admin_${Date.now()}`;
      const payload: any = {
        name: adminName,
        email: adminEmail,
        loginId: adminEmail.toLowerCase(),
        phone: adminPhone,
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
      setAdminEmail("");
      setAdminPassword("");
      setAdminPhone("");
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

  const handleUpdateStatus = async (id: string, newStatus: "active" | "suspended") => {
    try {
      await updateDoc(doc(db, "admins", id), { status: newStatus });
    } catch (err) {
      console.error("Error updating status:", err);
    }
  };

  const handleDeleteAdmin = async (id: string) => {
    if (!window.confirm("আপনি কি নিশ্চিতভাবে এই এডমিন একাউন্টটি ডিলিট করতে চান?")) return;
    try {
      await deleteDoc(doc(db, "admins", id));
      alert("একাউন্ট ডিলিট করা হয়েছে");
    } catch (err) {
      console.error("Error deleting admin:", err);
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

  // 1. One-time setup form
  if (!setupState?.isSetupComplete) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md mx-auto bg-white border border-emerald-100 rounded-[2rem] shadow-2xl overflow-hidden mt-10 font-alinur"
        style={{ fontFamily: 'Alinur Tatsama' }}
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
            <label className="text-xs font-bold text-slate-700 block ml-1">সিক্রেট পাসওয়ার্ড</label>
            <div className="relative">
              <Key className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input 
                type="password"
                required
                value={setupPassword}
                onChange={(e) => setSetupPassword(e.target.value)}
                placeholder="******"
                className="w-full pl-11 pr-4 py-3 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-sm font-sans"
              />
            </div>
          </div>

          <button 
            type="submit"
            disabled={isSubmittingSetup}
            className="w-full py-4 bg-emerald-800 hover:bg-emerald-950 text-amber-400 font-black rounded-2xl shadow-xl shadow-emerald-900/20 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            {isSubmittingSetup ? <Loader2 className="h-5 w-5 animate-spin" /> : <ShieldCheck className="h-5 w-5" />}
            <span>সেটআপ সম্পূর্ণ করুন</span>
          </button>
        </form>
      </motion.div>
    );
  }

  // 2. Main Admin Control Dashboard
  return (
    <div className="space-y-6 font-alinur" style={{ fontFamily: 'Alinur Tatsama' }}>
      {/* Top Header & Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-emerald-800 text-white rounded-2xl p-5 shadow-sm flex items-center gap-4">
          <div className="bg-white/10 p-3 rounded-xl">
            <Shield className="h-6 w-6 text-amber-400" />
          </div>
          <div>
            <p className="text-xs text-emerald-100 font-bold">মাদার এডমিন</p>
            <p className="text-2xl font-black">{motherAdminCount} / 2</p>
          </div>
        </div>
        
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex items-center gap-4">
          <div className="bg-emerald-50 p-3 rounded-xl">
            <Users className="h-6 w-6 text-emerald-800" />
          </div>
          <StreamBuilder<Admin>
            stream={collection(db, "admins")}
            builder={(admins, loading) => (
              <div>
                <p className="text-xs text-slate-500 font-bold">মোট এডমিন</p>
                <p className="text-2xl font-black text-emerald-950">{loading ? "..." : admins.length}</p>
              </div>
            )}
          />
        </div>

        <button 
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-amber-500 hover:bg-amber-600 text-emerald-950 rounded-2xl p-5 shadow-sm flex items-center justify-center gap-3 transition-all font-black group"
        >
          <UserPlus className="h-6 w-6 group-hover:scale-110 transition-transform" />
          <span>নতুন এডমিন যোগ করুন</span>
        </button>
      </div>

      {/* Add Admin Form */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-white border-2 border-emerald-100 rounded-3xl p-6 shadow-lg space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <h3 className="text-lg font-black text-emerald-950 flex items-center gap-2">
                  <UserPlus className="h-5 w-5 text-emerald-600" />
                  নতুন এডমিন রেজিস্ট্রেশন ফরম
                </h3>
                <button onClick={() => setShowAddForm(false)} className="text-slate-400 hover:text-red-500 transition-colors">
                  <XCircle className="h-6 w-6" />
                </button>
              </div>

              <form onSubmit={handleAddAdmin} className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 ml-1">এডমিনের নাম</label>
                  <input 
                    type="text"
                    required
                    value={adminName}
                    onChange={(e) => setAdminName(e.target.value)}
                    placeholder="নাম লিখুন"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 ml-1">ইমেইল ঠিকানা</label>
                  <div className="relative">
                    <input 
                      type="email"
                      required
                      value={adminEmail}
                      onChange={(e) => setAdminEmail(e.target.value)}
                      placeholder="email@example.com"
                      className={`w-full px-4 py-3 rounded-xl border outline-none transition-all text-sm ${
                        emailStatus.status === 'duplicate' ? 'border-red-400 bg-red-50' : 
                        emailStatus.status === 'unique' ? 'border-emerald-500 bg-emerald-50/30' : 'border-slate-200 focus:ring-2 focus:ring-emerald-500'
                      }`}
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      {emailStatus.status === 'checking' && <Loader2 className="w-4 h-4 animate-spin text-slate-400" />}
                      {emailStatus.status === 'unique' && <CheckCircle className="w-4 h-4 text-emerald-500" />}
                      {emailStatus.status === 'duplicate' && <XCircle className="w-4 h-4 text-red-500" />}
                    </div>
                  </div>
                  {emailStatus.status === 'duplicate' && (
                    <p className="text-[10px] font-bold text-red-500 mt-1">⚠ এই ইমেইলটি ইতিমধ্যে <strong>{emailStatus.duplicateInfo?.name}</strong> ({emailStatus.duplicateInfo?.collection}) এর নামে ব্যবহৃত হচ্ছে।</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 ml-1">মোবাইল নাম্বার</label>
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
                    <p className="text-[10px] font-bold text-red-500 mt-1">⚠ এই নাম্বারটি ইতিমধ্যে <strong>{phoneStatus.duplicateInfo?.name}</strong> ({phoneStatus.duplicateInfo?.collection}) এর নামে ব্যবহৃত হচ্ছে।</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 ml-1">সিক্রেট পাসওয়ার্ড</label>
                  <input 
                    type="password"
                    required
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    placeholder="******"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-sm font-sans"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 ml-1">এডমিন রোল (Role)</label>
                  <select 
                    value={adminRole}
                    onChange={(e) => setAdminRole(e.target.value as any)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-sm"
                  >
                    <option value="mother_admin" disabled={motherAdminCount >= 2}>মাদার এডমিন (Mother Admin)</option>
                    <option value="super_admin">সুপার এডমিন (Super Admin)</option>
                    <option value="assistant_admin">সহকারী এডমিন (Assistant Admin)</option>
                  </select>
                </div>

                {adminRole === "assistant_admin" && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 ml-1">মেয়াদ শেষ হওয়ার তারিখ</label>
                    <input 
                      type="date"
                      required
                      value={adminExpiry}
                      onChange={(e) => setAdminExpiry(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-sm font-sans"
                    />
                  </div>
                )}

                <div className="md:col-span-2 pt-2">
                  <button 
                    type="submit"
                    disabled={isSubmittingAdmin || phoneStatus.status === 'duplicate' || emailStatus.status === 'duplicate'}
                    className="w-full py-4 bg-emerald-800 hover:bg-emerald-950 text-amber-400 font-black rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
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

      {/* Admin List with StreamBuilder */}
      <div className="bg-white border border-slate-200 rounded-[2rem] shadow-sm overflow-hidden">
        <div className="p-6 bg-slate-50/50 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h3 className="font-black text-emerald-950 flex items-center gap-2">
            <Users className="h-5 w-5 text-emerald-600" />
            বর্তমান এডমিন তালিকা (লাইভ)
          </h3>
          <div className="relative max-w-xs w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input 
              type="text"
              placeholder="এডমিন খুজুন..."
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
              if (loading) return <div className="p-20 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto text-emerald-600" /></div>;
              
              const filteredAdmins = admins.filter(a => 
                a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                a.email.toLowerCase().includes(searchQuery.toLowerCase())
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
                    <tr className="bg-slate-50/50 text-[11px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-100">
                      <th className="p-5">নাম ও ইমেইল</th>
                      <th className="p-5">রোল (Role)</th>
                      <th className="p-5">স্ট্যাটাস</th>
                      <th className="p-5">অ্যাকশন</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {filteredAdmins.map((admin) => (
                      <tr key={admin.id} className="hover:bg-emerald-50/20 transition-colors group">
                        <td className="p-5">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-white shadow-sm ${
                              admin.role === 'mother_admin' ? 'bg-emerald-800' : admin.role === 'super_admin' ? 'bg-amber-500' : 'bg-slate-400'
                            }`}>
                              {admin.name.charAt(0)}
                            </div>
                            <div>
                              <p className="font-black text-slate-900 text-sm leading-none">{admin.name}</p>
                              <p className="text-[11px] text-slate-500 mt-1 font-sans">{admin.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-5">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black ${
                            admin.role === 'mother_admin' ? 'bg-emerald-100 text-emerald-800' : 
                            admin.role === 'super_admin' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {admin.role === 'mother_admin' ? 'মাদার এডমিন' : 
                             admin.role === 'super_admin' ? 'সুপার এডমিন' : 'সহকারী এডমিন'}
                            {admin.role === 'assistant_admin' && admin.expiryTimestamp && (
                              <span className="text-[9px] opacity-70 font-sans border-l border-slate-300 pl-1.5 ml-1">
                                {new Date(admin.expiryTimestamp).toLocaleDateString()}
                              </span>
                            )}
                          </span>
                        </td>
                        <td className="p-5">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                            admin.status === 'active' ? 'text-emerald-600 bg-emerald-50' : 'text-red-600 bg-red-50'
                          }`}>
                            <div className={`h-1.5 w-1.5 rounded-full ${admin.status === 'active' ? 'bg-emerald-600' : 'bg-red-600'}`}></div>
                            {admin.status === 'active' ? 'সক্রিয়' : 'স্থগিত'}
                          </span>
                        </td>
                        <td className="p-5">
                          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            {admin.status === 'active' ? (
                              <button 
                                onClick={() => handleUpdateStatus(admin.id, 'suspended')}
                                title="স্থগিত করুন"
                                className="p-2 text-amber-600 hover:bg-amber-50 rounded-xl transition-colors"
                              >
                                <ShieldAlert className="h-4.5 w-4.5" />
                              </button>
                            ) : (
                              <button 
                                onClick={() => handleUpdateStatus(admin.id, 'active')}
                                title="সক্রিয় করুন"
                                className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-xl transition-colors"
                              >
                                <CheckCircle className="h-4.5 w-4.5" />
                              </button>
                            )}
                            <button 
                              onClick={() => handleDeleteAdmin(admin.id)}
                              title="ডিলিট করুন"
                              className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-colors"
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
    </div>
  );
}
