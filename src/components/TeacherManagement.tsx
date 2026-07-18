import React, { useState, useEffect } from "react";
import { collection, query, orderBy, doc, addDoc, updateDoc, deleteDoc, serverTimestamp, where, getDocs } from "firebase/firestore";
import { db, StreamBuilder, uploadFileToImgBB } from "../lib/firebase";
import { Teacher } from "../types";
import { 
  UserPlus, Users, GraduationCap, CreditCard, Building2, Lock, 
  Trash2, Edit3, Plus, X, Check, Camera, Loader2, ChevronRight, 
  ChevronDown, Phone, Mail, MapPin, Hash, Briefcase, Info, 
  Search, ShieldCheck, Globe, Trash
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

const teachersCollection = collection(db, "teachers");
const teachersQuery = query(teachersCollection, orderBy("createdAt", "desc"));

export default function TeacherManagement() {
  const [view, setView] = useState<"list" | "form">("list");
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTeacherForDetail, setSelectedTeacherForDetail] = useState<Teacher | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleEdit = (teacher: Teacher) => {
    setEditingTeacher(teacher);
    setView("form");
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("আপনি কি নিশ্চিতভাবে এই শিক্ষকের তথ্য ডিলিট করতে চান?")) return;
    try {
      await deleteDoc(doc(db, "teachers", id));
    } catch (err) {
      console.error("Delete error:", err);
      alert("তথ্য ডিলিট করতে সমস্যা হয়েছে।");
    }
  };

  if (view === "form") {
    return (
      <TeacherFullPageForm 
        teacher={editingTeacher} 
        onClose={() => setView("list")} 
      />
    );
  }

  return (
    <div className="w-full min-h-screen bg-[#fdfdfb] p-2 sm:p-6 font-alinur" style={{ fontFamily: 'Alinur Tatsama' }}>
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-[2.5rem] border-2 border-emerald-50 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full -mr-32 -mt-32"></div>
          <div className="relative z-10 space-y-2">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-700 shadow-inner">
                <Users className="w-8 h-8" />
              </div>
              <div>
                <h2 className="text-3xl font-black text-emerald-950">শিক্ষক ব্যবস্থাপনা প্যানেল</h2>
                <p className="text-[10px] font-black text-emerald-600/60 uppercase tracking-[0.2em] mt-1">সুফিয়া নূরীয়া দাখিল মাদ্রাসা</p>
              </div>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-4 relative z-10">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
              <input 
                type="text" 
                placeholder="শিক্ষক খুঁজুন..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 pr-6 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm focus:border-emerald-500 focus:bg-white outline-none transition-all w-full md:w-64 font-bold"
              />
            </div>
            <button 
              onClick={() => { setEditingTeacher(null); setView("form"); }}
              className="flex items-center gap-2.5 bg-emerald-600 text-white px-8 py-4 rounded-2xl font-black hover:bg-emerald-700 shadow-xl shadow-emerald-600/20 active:scale-95 transition-all group"
            >
              <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
              নতুন শিক্ষক যোগ
            </button>
          </div>
        </div>

        <div className="bg-white rounded-[3rem] border-2 border-emerald-50 overflow-hidden shadow-sm min-h-[400px]">
          <StreamBuilder<Teacher>
            stream={teachersQuery}
            builder={(teachers, loading) => {
              if (loading) return (
                <div className="flex flex-col items-center justify-center py-32 space-y-4">
                  <div className="w-12 h-12 border-4 border-emerald-100 border-t-emerald-600 rounded-full animate-spin"></div>
                  <p className="text-emerald-900/60 font-bold animate-pulse">সম্মানিত শিক্ষকদের তালিকা প্রস্তুত হচ্ছে...</p>
                </div>
              );

              const filtered = teachers.filter(t => 
                t.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                t.designation.toLowerCase().includes(searchTerm.toLowerCase()) ||
                t.phone.includes(searchTerm)
              );

              if (filtered.length === 0) return (
                <div className="flex flex-col items-center justify-center py-32 text-center space-y-4">
                  <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-300">
                    <Info className="w-10 h-10" />
                  </div>
                  <p className="text-slate-400 font-bold text-lg">কোনো শিক্ষকের তথ্য পাওয়া যায়নি।</p>
                </div>
              );

              return (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-emerald-900 text-amber-300 uppercase text-[11px] font-black tracking-[0.2em] border-b-4 border-amber-500">
                        <th className="px-8 py-5">ছবি ও নাম</th>
                        <th className="px-6 py-5">পদবী ও বিষয়</th>
                        <th className="px-6 py-5">যোগাযোগ</th>
                        <th className="px-6 py-5 text-right">অ্যাকশন</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-emerald-50/50">
                      {filtered.map((teacher, idx) => (
                        <motion.tr 
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          key={teacher.id} 
                          className="hover:bg-emerald-50/20 transition-colors group"
                        >
                          <td className="px-8 py-5">
                            <div className="flex items-center gap-5">
                              <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-white shadow-md ring-2 ring-emerald-50 group-hover:ring-amber-200 transition-all">
                                <img 
                                  src={teacher.photoUrl || "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80"} 
                                  alt={teacher.name} 
                                  className="w-full h-full object-cover"
                                  referrerPolicy="no-referrer"
                                />
                              </div>
                              <div className="space-y-1">
                                <p className="text-lg font-black text-emerald-950 group-hover:text-emerald-700 transition-colors">{teacher.name}</p>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{teacher.nameEn || "N/A"}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-5">
                            <div className="space-y-1.5">
                              <span className="inline-block px-3 py-1 bg-emerald-100 text-emerald-800 rounded-lg text-xs font-black shadow-sm">
                                {teacher.designation}
                              </span>
                              {teacher.subject && (
                                <div className="text-xs text-slate-500 font-bold flex items-center gap-1.5">
                                  <div className="w-1.5 h-1.5 bg-amber-500 rounded-full"></div>
                                  {teacher.subject}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-5">
                            <div className="space-y-2">
                              <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
                                <Phone className="w-3.5 h-3.5 text-emerald-600" />
                                {teacher.phone}
                              </div>
                              {teacher.email && (
                                <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                                  <Mail className="w-3.5 h-3.5 text-slate-300" />
                                  {teacher.email}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-5">
                            <div className="flex items-center justify-end gap-3">
                              <button 
                                onClick={() => setSelectedTeacherForDetail(teacher)}
                                className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center hover:bg-emerald-100 hover:scale-110 transition-all shadow-sm"
                                title="বিস্তারিত দেখুন"
                              >
                                <Info className="w-4.5 h-4.5" />
                              </button>
                              <button 
                                onClick={() => handleEdit(teacher)}
                                className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center hover:bg-amber-100 hover:scale-110 transition-all shadow-sm"
                                title="এডিট করুন"
                              >
                                <Edit3 className="w-4.5 h-4.5" />
                              </button>
                              <button 
                                onClick={() => handleDelete(teacher.id)}
                                className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center hover:bg-rose-100 hover:scale-110 transition-all shadow-sm"
                              >
                                <Trash2 className="w-4.5 h-4.5" />
                              </button>
                            </div>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            }}
          />
        </div>
      </div>
      
      <AnimatePresence>
        {selectedTeacherForDetail && (
          <TeacherDetailModal 
            teacher={selectedTeacherForDetail} 
            onClose={() => setSelectedTeacherForDetail(null)}
            onSuccess={(msg) => setSuccessMessage(msg)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {successMessage && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 pointer-events-none font-alinur" style={{ fontFamily: 'Alinur Tatsama' }}>
            <motion.div 
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-emerald-900 text-white px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-3 border-2 border-emerald-500/30 backdrop-blur-xl pointer-events-auto"
            >
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <Check className="w-5 h-5 text-emerald-300" />
              </div>
              <p className="font-black text-lg">{successMessage}</p>
              <button onClick={() => setSuccessMessage(null)} className="ml-4 hover:opacity-70 transition-opacity">
                <X className="w-5 h-5" />
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function TeacherDetailModal({ teacher, onClose, onSuccess }: { teacher: Teacher, onClose: () => void, onSuccess: (msg: string) => void }) {
  const [isResetting, setIsResetting] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [isUpdatingId, setIsUpdatingId] = useState(false);
  const [newLoginId, setNewLoginId] = useState(teacher.loginId || "");
  const [idStatus, setIdStatus] = useState<'idle' | 'checking' | 'unique' | 'duplicate'>('idle');

  useEffect(() => {
    if (newLoginId === teacher.loginId) {
      setIdStatus('idle');
      return;
    }
    
    const check = async () => {
      setIdStatus('checking');
      const isUnique = await checkUniqueLoginId(newLoginId, teacher.id);
      setIdStatus(isUnique ? 'unique' : 'duplicate');
    };

    const timer = setTimeout(check, 500);
    return () => clearTimeout(timer);
  }, [newLoginId, teacher.id, teacher.loginId]);

  const handleUpdateLoginId = async () => {
    if (idStatus !== 'unique') return;

    setIsUpdatingId(true);
    try {
      await updateDoc(doc(db, "teachers", teacher.id), { loginId: newLoginId });
      onSuccess("নাম্বার আপডেট সম্পন্ন");
      setIsUpdatingId(false);
    } catch (err) {
      console.error(err);
      alert("আপডেট করতে সমস্যা হয়েছে।");
      setIsUpdatingId(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-emerald-950/40 backdrop-blur-sm font-alinur"
      style={{ fontFamily: 'Alinur Tatsama' }}
    >
      <motion.div 
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="bg-white w-full max-w-4xl max-h-[90vh] rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col"
      >
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-emerald-900 text-white">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl overflow-hidden border-2 border-white/20">
              <img src={teacher.photoUrl || ""} alt="" className="w-full h-full object-cover" />
            </div>
            <div>
              <h3 className="text-xl font-black">{teacher.name}</h3>
              <p className="text-[10px] text-emerald-200 font-bold uppercase tracking-widest">{teacher.designation}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar">
          {/* Detailed Info Categories */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="bg-emerald-50/50 p-6 rounded-2xl border border-emerald-100">
                <h4 className="text-sm font-black text-emerald-900 mb-4 flex items-center gap-2">
                  <UserPlus className="w-4 h-4" /> ব্যক্তিগত ও স্থায়ী তথ্য
                </h4>
                <div className="space-y-3 text-sm">
                  <p className="flex justify-between"><strong>মোবাইল:</strong> <span>{teacher.phone}</span></p>
                  <p className="flex justify-between"><strong>এনআইডি:</strong> <span>{teacher.nid}</span></p>
                  <p className="flex justify-between"><strong>ইমেইল:</strong> <span>{teacher.email || "N/A"}</span></p>
                  <p className="flex justify-between"><strong>জন্মসাল:</strong> <span>{teacher.birthYear}</span></p>
                  <p className="flex justify-between"><strong>পিতার নাম:</strong> <span>{teacher.fatherName}</span></p>
                  <p className="flex justify-between"><strong>মাতার নাম:</strong> <span>{teacher.motherName}</span></p>
                </div>
              </div>

              <div className="bg-amber-50/50 p-6 rounded-2xl border border-amber-100">
                <h4 className="text-sm font-black text-amber-900 mb-4 flex items-center gap-2">
                  <GraduationCap className="w-4 h-4" /> শিক্ষাগত যোগ্যতা
                </h4>
                <div className="space-y-4">
                  {Object.entries(teacher.qualifications || {}).map(([key, q]: [string, any]) => q.instituteName && (
                    <div key={key} className="text-xs border-b border-amber-200/50 pb-2 last:border-0">
                      <p className="font-black text-amber-800 uppercase">{key}</p>
                      <p className="text-amber-700">{q.instituteName} - {q.passingYear}</p>
                      <p className="text-amber-600 font-bold">ফলাফল: {q.result}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-indigo-50/50 p-6 rounded-2xl border border-indigo-100">
                <h4 className="text-sm font-black text-indigo-900 mb-4 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4" /> প্রাতিষ্ঠানিক ও অ্যাকাউন্ট
                </h4>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <p className="text-[10px] font-black text-indigo-400 uppercase">লগইন আইডি (ইউনিক)</p>
                    <div className="flex flex-col gap-2">
                      <div className="relative flex-1">
                        <input 
                          type="text" 
                          value={newLoginId} 
                          onChange={(e) => setNewLoginId(e.target.value)}
                          className={`w-full px-3 py-2 bg-white border-2 rounded-lg text-sm font-bold outline-none transition-all ${
                            idStatus === 'unique' ? 'border-emerald-500' : 
                            idStatus === 'duplicate' ? 'border-rose-400' : 'border-indigo-200'
                          }`}
                          placeholder="লগইন আইডি দিন"
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          {idStatus === 'checking' && <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />}
                          {idStatus === 'unique' && <div className="w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center shadow-sm shadow-emerald-500/20 animate-bounce"><Check className="w-3 h-3 text-white" /></div>}
                        </div>
                      </div>
                      
                      {idStatus === 'duplicate' && (
                        <div className="flex items-center justify-between gap-2 p-2 bg-rose-50 border border-rose-100 rounded-lg animate-pulse">
                          <p className="text-[10px] font-black text-rose-600">এই আইডিটি ইতিমধ্যে ব্যবহৃত হচ্ছে!</p>
                          <span className="px-2 py-0.5 bg-rose-500 text-white rounded text-[8px] font-black uppercase">আপডেট করুন</span>
                        </div>
                      )}

                      <button 
                        onClick={handleUpdateLoginId}
                        disabled={isUpdatingId || idStatus !== 'unique'}
                        className="w-full py-2 bg-indigo-600 text-white rounded-lg text-xs font-black hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-md active:scale-95"
                      >
                        {isUpdatingId ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "আইডি আপডেট সম্পন্ন করুন"}
                      </button>
                    </div>
                  </div>
                  <div className="pt-4 border-t border-indigo-100">
                    <button 
                      onClick={() => setShowResetModal(true)}
                      className="w-full py-3 bg-rose-500 text-white rounded-xl font-black text-sm flex items-center justify-center gap-2 hover:bg-rose-600 active:scale-95 transition-all shadow-lg shadow-rose-500/20"
                    >
                      <Lock className="w-4 h-4" />
                      পাসওয়ার্ড রিসেট করুন
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                <h4 className="text-sm font-black text-slate-700 mb-4 flex items-center gap-2">
                  <CreditCard className="w-4 h-4" /> ফিন্যান্সিয়াল তথ্য
                </h4>
                <div className="space-y-3 text-xs">
                  <p className="flex justify-between"><strong>ব্যাংক:</strong> <span>{teacher.bankInfo?.bankName || "N/A"}</span></p>
                  <p className="flex justify-between"><strong>একাউন্ট নং:</strong> <span>{teacher.bankInfo?.accountNo || "N/A"}</span></p>
                  <p className="flex justify-between"><strong>মোবাইল ব্যাংকিং:</strong> <span>{teacher.mobileBanking?.serviceName} - {teacher.mobileBanking?.number}</span></p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Custom Password Reset Modal */}
      <AnimatePresence>
        {showResetModal && (
          <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl p-8 space-y-6 border border-slate-100"
            >
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-500">
                  <Lock className="w-6 h-6" />
                </div>
                <button onClick={() => setShowResetModal(false)} className="p-2 hover:bg-slate-50 rounded-full">
                  <X className="w-6 h-6 text-slate-400" />
                </button>
              </div>

              <div className="space-y-2">
                <h4 className="text-2xl font-black text-slate-900">পাসওয়ার্ড রিসেট</h4>
                <p className="text-xs font-bold text-slate-500">অনুগ্রহ করে নতুন পাসওয়ার্ড সেট করুন</p>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100">
                  <label className="block text-[10px] font-black text-amber-500 uppercase tracking-widest mb-1">পুরাতন পাসওয়ার্ড</label>
                  <p className="text-lg font-black text-amber-900 font-mono tracking-widest">{teacher.password}</p>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">নতুন পাসওয়ার্ড</label>
                  <input 
                    type="text" 
                    id="new_password_input"
                    className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl text-sm font-bold outline-none focus:border-rose-500 focus:bg-white transition-all font-mono tracking-widest"
                    placeholder="••••••••"
                  />
                </div>

                <button 
                  onClick={async () => {
                    const input = document.getElementById('new_password_input') as HTMLInputElement;
                    const val = input.value;
                    if (!val || val.length < 6) {
                      alert("পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।");
                      return;
                    }
                    setIsResetting(true);
                    try {
                      await updateDoc(doc(db, "teachers", teacher.id), { password: val });
                      onSuccess("পাসওয়ার্ড আপডেট হয়েছে!");
                      setShowResetModal(false);
                    } catch (err) {
                      alert("ত্রুটি হয়েছে।");
                    } finally {
                      setIsResetting(false);
                    }
                  }}
                  disabled={isResetting}
                  className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-black text-sm flex items-center justify-center gap-2 hover:bg-emerald-700 shadow-xl shadow-emerald-600/20 active:scale-95 transition-all"
                >
                  {isResetting ? <Loader2 className="w-5 h-5 animate-spin" /> : "নতুন পাসওয়ার্ড নিশ্চিত করুন"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

const checkUniqueLoginId = async (loginId: string, currentDocId?: string) => {
  const collections = ["teachers", "students", "admins"];
  for (const coll of collections) {
    // Check loginId field
    const q = query(collection(db, coll), where("loginId", "==", loginId));
    const snap = await getDocs(q);
    if (!snap.empty) {
      if (currentDocId && coll === "teachers") {
        const isSelf = snap.docs.some(d => d.id === currentDocId);
        if (!isSelf) return false;
      } else {
        return false;
      }
    }
    
    // Also check phone field
    const qPhone = query(collection(db, coll), where("phone", "==", loginId));
    const snapPhone = await getDocs(qPhone);
    if (!snapPhone.empty) {
      if (currentDocId && coll === "teachers") {
        const isSelf = snapPhone.docs.some(d => d.id === currentDocId);
        if (!isSelf) return false;
      } else {
        return false;
      }
    }
  }
  return true;
};

function TeacherFullPageForm({ teacher, onClose }: { teacher: Teacher | null; onClose: () => void }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [photoPreview, setPhotoPreview] = useState(teacher?.photoUrl || "");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showErrors, setShowErrors] = useState(false);
  const [idStatus, setIdStatus] = useState<'idle' | 'checking' | 'unique' | 'duplicate'>('idle');

  const [formData, setFormData] = useState<Partial<Teacher>>(() => {
    // 1. If editing existing teacher, use that
    if (teacher) return { ...teacher };
    
    // 2. Try to load from local storage draft
    const savedDraft = localStorage.getItem("teacher_form_draft");
    if (savedDraft) {
      try {
        return JSON.parse(savedDraft);
      } catch (e) {
        console.error("Error parsing draft", e);
      }
    }

    // 3. Default empty form
    return {
      name: "", nameEn: "", designation: "", phone: "", email: "", whatsapp: "",
      presentAddress: "", permanentAddress: "", wardNo: "", thana: "", district: "", division: "",
      nid: "", birthYear: "", religion: "ইসলাম", nationality: "বাংলাদেশী",
      fatherName: "", motherName: "", fatherNid: "", motherNid: "",
      guardianPresentAddress: "", guardianPermanentAddress: "",
      guardianWardNo: "", guardianThana: "", guardianDistrict: "", guardianDivision: "",
      guardianReligion: "ইসলাম", guardianNationality: "বাংলাদেশী",
      qualifications: {
        ssc: { boardOrUniv: "", instituteName: "", departmentOrGroup: "", passingYear: "", result: "" },
        hsc: { boardOrUniv: "", instituteName: "", departmentOrGroup: "", passingYear: "", result: "" },
        bachelor: { boardOrUniv: "", instituteName: "", departmentOrGroup: "", passingYear: "", result: "" },
        masters: { boardOrUniv: "", instituteName: "", departmentOrGroup: "", passingYear: "", result: "" },
        bed: { boardOrUniv: "", instituteName: "", departmentOrGroup: "", passingYear: "", result: "" },
        med: { boardOrUniv: "", instituteName: "", departmentOrGroup: "", passingYear: "", result: "" },
        others: { boardOrUniv: "", instituteName: "", departmentOrGroup: "", passingYear: "", result: "" }
      },
      bankInfo: { bankName: "", accountName: "", accountNo: "", branchName: "", routingNo: "" },
      mobileBanking: { serviceName: "বিকাশ", number: "" },
      subject: "", loginId: "", password: ""
    };
  });

  // Save to localStorage on change
  useEffect(() => {
    if (!teacher) {
      localStorage.setItem("teacher_form_draft", JSON.stringify(formData));
    }
  }, [formData, teacher]);

  useEffect(() => {
    if (!formData.loginId || formData.loginId === teacher?.loginId) {
      setIdStatus('idle');
      return;
    }

    const check = async () => {
      setIdStatus('checking');
      const isUnique = await checkUniqueLoginId(formData.loginId!, teacher?.id);
      setIdStatus(isUnique ? 'unique' : 'duplicate');
    };

    const timer = setTimeout(check, 500);
    return () => clearTimeout(timer);
  }, [formData.loginId, teacher?.id, teacher?.loginId]);

  const convertToEnglish = (input: string) => {
    return input.replace(/[০-৯]/g, (match) => {
      const charCode = match.charCodeAt(0);
      return String.fromCharCode(charCode - 0x09E6 + 0x0030);
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Numeric fields that need sanitization
    const numericFields = ['phone', 'nid', 'birthYear', 'whatsapp', 'wardNo', 'accountNo', 'number', 'routingNo'];
    let processedValue = value;
    
    if (numericFields.some(field => name.endsWith(field))) {
      processedValue = convertToEnglish(value);
    }

    if (name.includes('.')) {
      const parts = name.split('.');
      if (parts.length === 2) {
        const [parent, child] = parts;
        setFormData(prev => ({
          ...prev,
          [parent]: {
            ...(prev[parent as keyof Teacher] as any),
            [child]: processedValue
          }
        }));
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: processedValue }));
    }
  };

  const handleQualificationChange = (type: string, field: string, value: string) => {
    let processedValue = value;
    if (field === 'passingYear' || field === 'result') {
      processedValue = convertToEnglish(value);
    }
    
    setFormData(prev => ({
      ...prev,
      qualifications: {
        ...prev.qualifications!,
        [type]: {
          ...(prev.qualifications as any)[type],
          [field]: processedValue
        }
      }
    }));
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    try {
      const url = await uploadFileToImgBB(file);
      setPhotoPreview(url);
      setFormData(prev => ({ ...prev, photoUrl: url }));
    } catch (err) {
      console.error("Upload error:", err);
      alert("ছবি আপলোড ব্যর্থ হয়েছে।");
    } finally {
      setUploadingImage(false);
    }
  };

  // Validation Logic
  const requiredFields = {
    name: !!formData.name,
    designation: !!formData.designation,
    phone: !!formData.phone && formData.phone.length === 11,
    nid: !!formData.nid,
    fatherName: !!formData.fatherName,
    motherName: !!formData.motherName,
    loginId: !!formData.loginId,
    password: !!formData.password && formData.password.length >= 6,
    sscInstitute: !!formData.qualifications?.ssc?.instituteName
  };

  const isFormValid = Object.values(requiredFields).every(Boolean);

  const handleSubmit = async () => {
    if (!isFormValid) {
      setShowErrors(true);
      if (formData.phone && formData.phone.length !== 11) {
        alert("অবশ্যই ১১ সংখ্যার মোবাইল নাম্বার দিন।");
      } else {
        alert("অনুগ্রহ করে সকল রিকোয়ার্ড ফিল্ড সঠিকভাবে পূরণ করুন।");
      }
      return;
    }

    setIsSubmitting(true);
    try {
      // Global Unique Login ID Validation
      const isUnique = await checkUniqueLoginId(formData.loginId!, teacher?.id);
      if (!isUnique) {
        alert("এই নাম্বার/ইমেইলটি ইতিমধ্যে নিবন্ধিত! অনুগ্রহ করে অন্য আইডি ব্যবহার করুন।");
        setIsSubmitting(false);
        return;
      }

      const payload = {
        ...formData,
        createdAt: teacher ? teacher.createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        uid: teacher?.uid || `teacher_${Date.now()}`
      };

      if (teacher?.id) {
        await updateDoc(doc(db, "teachers", teacher.id), payload);
      } else {
        await addDoc(collection(db, "teachers"), payload);
        localStorage.removeItem("teacher_form_draft");
      }
      onClose();
    } catch (err) {
      console.error("Save error:", err);
      alert("তথ্য সংরক্ষণ করতে সমস্যা হয়েছে।");
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClasses = (isError: boolean = false) => `w-full px-4 py-2.5 bg-white border-2 ${isError ? 'border-red-400' : 'border-slate-100'} rounded-xl text-sm font-bold focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 focus:bg-white outline-none transition-all duration-300 placeholder:text-slate-300 shadow-sm`;
  const labelClasses = "block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1";
  
  const renderQualificationSet = (type: string, label: string) => (
    <div key={type} className="p-5 bg-white rounded-2xl border border-slate-100 space-y-4 shadow-sm">
      <div className="flex items-center gap-2 mb-1">
        <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center text-amber-600">
          <GraduationCap className="w-4 h-4" />
        </div>
        <h4 className="text-sm font-black text-slate-800">{label}</h4>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div><label className={labelClasses}>বোর্ড / বিশ্ববিদ্যালয়</label><input className={inputClasses()} value={(formData.qualifications as any)[type]?.boardOrUniv} onChange={(e) => handleQualificationChange(type, 'boardOrUniv', e.target.value)} /></div>
        <div>
          <label className={labelClasses}>প্রতিষ্ঠানের নাম {type === 'ssc' && "*"}</label>
          <input className={inputClasses(showErrors && type === 'ssc' && !formData.qualifications?.ssc?.instituteName)} value={(formData.qualifications as any)[type]?.instituteName} onChange={(e) => handleQualificationChange(type, 'instituteName', e.target.value)} />
        </div>
        <div><label className={labelClasses}>বিভাগ / বিষয়</label><input className={inputClasses()} value={(formData.qualifications as any)[type]?.departmentOrGroup} onChange={(e) => handleQualificationChange(type, 'departmentOrGroup', e.target.value)} /></div>
        <div><label className={labelClasses}>পাশের বছর</label><input className={inputClasses()} value={(formData.qualifications as any)[type]?.passingYear} onChange={(e) => handleQualificationChange(type, 'passingYear', e.target.value)} /></div>
        <div><label className={labelClasses}>ফলাফল (জিপিএ/সিজিপিএ)</label><input className={inputClasses()} value={(formData.qualifications as any)[type]?.result} onChange={(e) => handleQualificationChange(type, 'result', e.target.value)} /></div>
      </div>
    </div>
  );

  const SectionTitle = ({ icon: Icon, title, subtitle }: { icon: any, title: string, subtitle?: string }) => (
    <div className="flex items-center gap-4 mb-6 border-b border-slate-100 pb-4">
      <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center shadow-sm">
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <h4 className="text-xl font-black text-slate-800">{title}</h4>
        {subtitle && <p className="text-[10px] font-black text-emerald-600/60 uppercase tracking-widest">{subtitle}</p>}
      </div>
    </div>
  );

  return (
    <div className="w-full min-h-screen bg-[#fdfdfb] flex flex-col font-alinur pb-24" style={{ fontFamily: 'Alinur Tatsama' }}>
      {/* Page Header */}
      <div className="px-6 py-6 sm:px-10 bg-white border-b-2 border-slate-50 flex items-center justify-between sticky top-0 z-[100] shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-600/20">
            {teacher ? <Edit3 className="w-6 h-6" /> : <UserPlus className="w-6 h-6" />}
          </div>
          <div>
            <h3 className="text-2xl font-black text-slate-800">
              {teacher ? "শিক্ষকের তথ্য আপডেট" : "নতুন শিক্ষক নিবন্ধন"}
            </h3>
            <p className="text-[10px] font-black text-emerald-600/60 uppercase tracking-[0.2em] mt-0.5">সুফিয়া নূরীয়া দাখিল মাদ্রাসা</p>
          </div>
        </div>
        <button 
          onClick={onClose}
          className="px-6 py-3 bg-slate-100 text-slate-500 rounded-xl flex items-center gap-2 text-sm font-black hover:bg-rose-50 hover:text-rose-500 transition-all active:scale-95"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>তালিকায় ফিরুন</span>
        </button>
      </div>

      {/* Form Content - Single Scrolling Page */}
      <div className="max-w-6xl mx-auto w-full p-4 sm:p-10 space-y-16">
        
        {/* Category 1: Personal Info */}
        <section id="personal" className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm scroll-mt-32">
          <SectionTitle icon={UserPlus} title="ব্যক্তিগত তথ্য" subtitle="Personal Information" />
          
          <div className="flex flex-col md:flex-row gap-10">
            <div className="flex flex-col items-center">
              <div className="relative group">
                <div className="w-40 h-40 rounded-[2.5rem] bg-slate-50 border-4 border-white shadow-xl overflow-hidden flex items-center justify-center relative ring-4 ring-emerald-50 transition-transform hover:scale-105 duration-500">
                  {photoPreview ? (
                    <img src={photoPreview} alt="Teacher" className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-slate-300">
                      {uploadingImage ? <Loader2 className="w-8 h-8 animate-spin text-emerald-500" /> : <Camera className="w-8 h-8" />}
                    </div>
                  )}
                  <input type="file" accept="image/*" onChange={handlePhotoUpload} className="absolute inset-0 opacity-0 cursor-pointer z-20" />
                  <div className="absolute inset-0 bg-emerald-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-black text-[10px] uppercase tracking-widest z-10">
                    ছবি দিন
                  </div>
                </div>
              </div>
            </div>

            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              <div><label className={labelClasses}>পূর্ণ নাম (বাংলায়) *</label><input name="name" className={inputClasses(showErrors && !formData.name)} value={formData.name} onChange={handleInputChange} /></div>
              <div><label className={labelClasses}>পূর্ণ নাম (ইংরেজিতে)</label><input name="nameEn" className={inputClasses()} value={formData.nameEn} onChange={handleInputChange} /></div>
              <div><label className={labelClasses}>পদবী *</label><input name="designation" className={inputClasses(showErrors && !formData.designation)} value={formData.designation} onChange={handleInputChange} /></div>
              <div>
                <label className={labelClasses}>মোবাইল নাম্বার *</label>
                <input name="phone" className={inputClasses(showErrors && (!formData.phone || formData.phone.length !== 11))} value={formData.phone} onChange={handleInputChange} placeholder="01XXXXXXXXX" />
                {showErrors && formData.phone && formData.phone.length !== 11 && (
                  <p className="text-[9px] text-red-500 font-black mt-1 ml-1 animate-pulse">অবশ্যই ১১ সংখ্যার মোবাইল নাম্বার দিন</p>
                )}
              </div>
              <div><label className={labelClasses}>ইমেইল</label><input name="email" type="email" className={inputClasses()} value={formData.email} onChange={handleInputChange} /></div>
              <div><label className={labelClasses}>হোয়াটসঅ্যাপ</label><input name="whatsapp" className={inputClasses()} value={formData.whatsapp} onChange={handleInputChange} /></div>
              <div><label className={labelClasses}>এনআইডি নাম্বার *</label><input name="nid" className={inputClasses(showErrors && !formData.nid)} value={formData.nid} onChange={handleInputChange} /></div>
              <div><label className={labelClasses}>জন্মসাল *</label><input name="birthYear" className={inputClasses(showErrors && !formData.birthYear)} value={formData.birthYear} onChange={handleInputChange} /></div>
              <div>
                <label className={labelClasses}>ধর্ম</label>
                <select name="religion" className={inputClasses()} value={formData.religion} onChange={handleInputChange}>
                  <option value="ইসলাম">ইসলাম</option>
                  <option value="হিন্দু">হিন্দু</option>
                  <option value="খ্রিষ্টান">খ্রিষ্টান</option>
                  <option value="বৌদ্ধ">বৌদ্ধ</option>
                  <option value="অন্যান্য">অন্যান্য</option>
                </select>
              </div>
              <div className="md:col-span-2"><label className={labelClasses}>বর্তমান ঠিকানা</label><input name="presentAddress" className={inputClasses()} value={formData.presentAddress} onChange={handleInputChange} /></div>
              <div><label className={labelClasses}>ওয়ার্ড নং</label><input name="wardNo" className={inputClasses()} value={formData.wardNo} onChange={handleInputChange} /></div>
              <div className="md:col-span-2"><label className={labelClasses}>স্থায়ী ঠিকানা</label><input name="permanentAddress" className={inputClasses()} value={formData.permanentAddress} onChange={handleInputChange} /></div>
              <div><label className={labelClasses}>থানা</label><input name="thana" className={inputClasses()} value={formData.thana} onChange={handleInputChange} /></div>
              <div><label className={labelClasses}>জেলা</label><input name="district" className={inputClasses()} value={formData.district} onChange={handleInputChange} /></div>
              <div><label className={labelClasses}>বিভাগ</label><input name="division" className={inputClasses()} value={formData.division} onChange={handleInputChange} /></div>
            </div>
          </div>
        </section>

        {/* Category 2: Guardian Info */}
        <section id="guardian" className="bg-slate-50/50 p-8 rounded-[2.5rem] border border-slate-100 scroll-mt-32">
          <SectionTitle icon={Users} title="অভিভাবকের তথ্য" subtitle="Guardian Information" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            <div><label className={labelClasses}>পিতার নাম *</label><input name="fatherName" className={inputClasses(showErrors && !formData.fatherName)} value={formData.fatherName} onChange={handleInputChange} /></div>
            <div><label className={labelClasses}>মাতার নাম *</label><input name="motherName" className={inputClasses(showErrors && !formData.motherName)} value={formData.motherName} onChange={handleInputChange} /></div>
            <div><label className={labelClasses}>পিতার এনআইডি</label><input name="fatherNid" className={inputClasses()} value={formData.fatherNid} onChange={handleInputChange} /></div>
            <div><label className={labelClasses}>মাতার এনআইডি</label><input name="motherNid" className={inputClasses()} value={formData.motherNid} onChange={handleInputChange} /></div>
            <div className="md:col-span-2 lg:col-span-3"><label className={labelClasses}>অভিভাবকের বর্তমান ঠিকানা</label><input name="guardianPresentAddress" className={inputClasses()} value={formData.guardianPresentAddress} onChange={handleInputChange} /></div>
            <div className="md:col-span-2 lg:col-span-3"><label className={labelClasses}>অভিভাবকের স্থায়ী ঠিকানা</label><input name="guardianPermanentAddress" className={inputClasses()} value={formData.guardianPermanentAddress} onChange={handleInputChange} /></div>
          </div>
        </section>

        {/* Category 3: Qualifications */}
        <section id="education" className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm scroll-mt-32">
          <SectionTitle icon={GraduationCap} title="শিক্ষাগত যোগ্যতা" subtitle="Educational Qualifications" />
          <div className="space-y-6">
            {renderQualificationSet('ssc', 'এসএসসি / দাখিল (SSC / Dakhil) *')}
            {renderQualificationSet('hsc', 'এইচএসসি / আলিম (HSC / Alim)')}
            {renderQualificationSet('bachelor', 'স্নাতক (Bachelor)')}
            {renderQualificationSet('masters', 'স্নাতকোত্তর (Masters)')}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {renderQualificationSet('bed', 'বি.এড. (B.Ed)')}
              {renderQualificationSet('med', 'এম.এড. (M.Ed)')}
            </div>
          </div>
        </section>

        {/* Category 4: Financial */}
        <section id="financial" className="bg-slate-50/50 p-8 rounded-[2.5rem] border border-slate-100 scroll-mt-32">
          <SectionTitle icon={CreditCard} title="ফিন্যান্সিয়াল তথ্য" subtitle="Financial & Banking" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-5">
              <h5 className="text-sm font-black text-slate-700 flex items-center gap-2"><Building2 className="w-4 h-4 text-indigo-500" /> ব্যাংক একাউন্ট</h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className={labelClasses}>ব্যাংক নাম</label><input name="bankInfo.bankName" className={inputClasses()} value={formData.bankInfo?.bankName} onChange={handleInputChange} /></div>
                <div><label className={labelClasses}>একাউন্ট নাম্বার</label><input name="bankInfo.accountNo" className={inputClasses()} value={formData.bankInfo?.accountNo} onChange={handleInputChange} /></div>
                <div><label className={labelClasses}>একাউন্ট নাম</label><input name="bankInfo.accountName" className={inputClasses()} value={formData.bankInfo?.accountName} onChange={handleInputChange} /></div>
                <div><label className={labelClasses}>শাখা ও রাউটিং</label><input name="bankInfo.branchName" className={inputClasses()} value={formData.bankInfo?.branchName} onChange={handleInputChange} placeholder="শাখা / রাউটিং" /></div>
              </div>
            </div>
            <div className="bg-rose-50/30 p-6 rounded-2xl border border-rose-100 space-y-5">
              <h5 className="text-sm font-black text-rose-800 flex items-center gap-2"><Phone className="w-4 h-4 text-rose-500" /> মোবাইল ব্যাংকিং</h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelClasses}>সার্ভিস</label>
                  <select name="mobileBanking.serviceName" className={inputClasses()} value={formData.mobileBanking?.serviceName} onChange={handleInputChange}>
                    {["বিকাশ", "নগদ", "রকেট", "উপায়"].map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>
                <div><label className={labelClasses}>নাম্বার</label><input name="mobileBanking.number" className={inputClasses()} value={formData.mobileBanking?.number} onChange={handleInputChange} placeholder="01XXXXXXXXX" /></div>
              </div>
            </div>
          </div>
        </section>

        {/* Category 5: Institutional & Login */}
        <section id="institutional" className="bg-slate-900 p-10 rounded-[3rem] shadow-2xl relative overflow-hidden scroll-mt-32">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32"></div>
          <div className="relative z-10">
            <SectionTitle icon={ShieldCheck} title="প্রাতিষ্ঠানিক ও লগইন তথ্য" subtitle="Institutional & Account Access" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
              <div><label className={`${labelClasses} text-slate-400`}>পদবী (আবারও নিশ্চিত করুন) *</label><input name="designation" className={`${inputClasses()} bg-white border-slate-700 text-emerald-950 focus:border-amber-500`} value={formData.designation} onChange={handleInputChange} /></div>
              <div><label className={`${labelClasses} text-slate-400`}>বিষয় (ঐচ্ছিক)</label><input name="subject" className={`${inputClasses()} bg-white border-slate-700 text-emerald-950 focus:border-amber-500`} value={formData.subject} onChange={handleInputChange} /></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <label className={`${labelClasses} text-slate-400`}>লগইন আইডি (ইউনিক) *</label>
                <div className="relative">
                  <input 
                    name="loginId" 
                    className={`${inputClasses(showErrors && !formData.loginId)} bg-white border-slate-700 text-emerald-950 focus:border-amber-500 pr-12 ${
                      idStatus === 'unique' ? 'border-emerald-500 ring-4 ring-emerald-500/10' : 
                      idStatus === 'duplicate' ? 'border-rose-400 ring-4 ring-rose-400/10' : ''
                    }`} 
                    value={formData.loginId} 
                    onChange={handleInputChange} 
                    placeholder="Login ID" 
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                    {idStatus === 'checking' && <Loader2 className="w-4 h-4 animate-spin text-emerald-500" />}
                    {idStatus === 'unique' && (
                      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/20">
                        <Check className="w-4 h-4 text-white" />
                      </motion.div>
                    )}
                    {idStatus === 'duplicate' && (
                      <motion.div initial={{ x: 10, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="flex items-center gap-1 bg-rose-50 px-2 py-1 rounded-lg border border-rose-100">
                        <span className="text-[8px] font-black text-rose-600 uppercase">আপডেট করুন</span>
                      </motion.div>
                    )}
                  </div>
                </div>
              </div>
              <div>
                <label className={`${labelClasses} text-slate-400`}>পাসওয়ার্ড * (কমপক্ষে ৬ অক্ষর)</label>
                <input name="password" type="password" className={`${inputClasses(showErrors && (!formData.password || formData.password.length < 6))} bg-white border-slate-700 text-emerald-950 focus:border-amber-500`} value={formData.password} onChange={handleInputChange} placeholder="••••••••" />
              </div>
            </div>
          </div>
        </section>

      </div>

      {/* Strict Submission Footer */}
      <div className="fixed bottom-0 left-0 right-0 p-5 bg-white/90 backdrop-blur-xl border-t border-slate-100 flex items-center justify-center z-[110] shadow-2xl">
        <button 
          onClick={handleSubmit}
          disabled={isSubmitting}
          className={`px-16 py-4 rounded-2xl font-black text-sm shadow-xl transition-all flex items-center gap-3 active:scale-95 ${
            isFormValid 
              ? "bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-600/20" 
              : "bg-slate-200 text-slate-400 cursor-not-allowed"
          }`}
        >
          {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : (isFormValid ? <Check className="w-5 h-5" /> : <Lock className="w-5 h-5" />)}
          {teacher ? "আপডেট সম্পন্ন করুন" : "নিবন্ধন সম্পন্ন করুন"}
          {!isFormValid && <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-md ml-2 opacity-60">অসম্পূর্ণ</span>}
        </button>
      </div>

      <style>{`
        .font-alinur { font-family: 'Ador Noirit', 'Alinur Tatsama', sans-serif !important; }
        input, select, textarea, button, h1, h2, h3, h4, h5, p, span, div { font-family: 'Ador Noirit', 'Alinur Tatsama', sans-serif !important; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}

const ArrowLeft = (props: any) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>
);
