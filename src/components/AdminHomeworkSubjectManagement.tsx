import React, { useState, useMemo } from "react";
import { db, StreamBuilder } from "../lib/firebase";
import { collection, addDoc, updateDoc, deleteDoc, doc, query, orderBy, where } from "firebase/firestore";
import { Plus, Edit3, Trash2, Check, X, BookOpen, AlertCircle } from "lucide-react";

export default function AdminHomeworkSubjectManagement() {
  const classes = [
    "১ম শ্রেণী", "২য় শ্রেণী", "৩য় শ্রেণী", "৪র্থ শ্রেণী",
    "৫ম শ্রেণী", "৬ষ্ঠ শ্রেণী", "৭ম শ্রেণী", "৮ম শ্রেণী", "৯ম শ্রেণী", "১০ম শ্রেণী", "হিফজ বিভাগ"
  ];

  const [selectedClass, setSelectedClass] = useState<string>("১০ম শ্রেণী");
  const [newSubject, setNewSubject] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Firestore query for subjects of the selected class
  const subjectsQuery = useMemo(() => {
    return query(
      collection(db, "homework_subjects"),
      where("className", "==", selectedClass),
      orderBy("subjectName", "asc")
    );
  }, [selectedClass]);

  const handleAddSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubject.trim()) return;
    
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, "homework_subjects"), {
        className: selectedClass,
        subjectName: newSubject.trim(),
        createdAt: new Date().toISOString()
      });
      setNewSubject("");
    } catch (err) {
      console.error("Error adding subject: ", err);
      alert("বিষয় যোগ করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartEdit = (id: string, name: string) => {
    setEditingId(id);
    setEditingName(name);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingName("");
  };

  const handleUpdateSubject = async (id: string) => {
    if (!editingName.trim()) return;
    setIsSubmitting(true);
    try {
      const docRef = doc(db, "homework_subjects", id);
      await updateDoc(docRef, {
        subjectName: editingName.trim()
      });
      setEditingId(null);
      setEditingName("");
    } catch (err) {
      console.error("Error updating subject: ", err);
      alert("বিষয় আপডেট করতে সমস্যা হয়েছে।");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteSubject = async (id: string, name: string) => {
    if (confirm(`আপনি কি নিশ্চিতভাবে "${name}" বিষয়টি মুছে ফেলতে চান?`)) {
      try {
        await deleteDoc(doc(db, "homework_subjects", id));
      } catch (err) {
        console.error("Error deleting subject: ", err);
        alert("বিষয় মুছতে সমস্যা হয়েছে।");
      }
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 sm:p-6 space-y-6 font-serif" style={{ fontFamily: "'Noto Serif Bengali', serif" }}>
      {/* Description / Instructions */}
      <div className="bg-emerald-50/50 border-l-4 border-emerald-600 p-4 rounded-r-xl flex gap-3">
        <BookOpen className="h-5 w-5 text-emerald-700 shrink-0 mt-0.5" />
        <div className="text-xs sm:text-sm text-emerald-950 space-y-1">
          <p className="font-bold">হোমওয়ার্ক সাবজেক্ট ম্যানেজমেন্ট নির্দেশনা:</p>
          <p>এখানে প্রতিটি শ্রেণীর জন্য আলাদা আলাদা বিষয় নির্ধারণ করতে পারবেন। শিক্ষকেরা হোমওয়ার্ক দেয়ার সময় এই বিষয়গুলো ড্রপডাউন থেকে সিলেক্ট করতে পারবেন।</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Class Selection & Add Form */}
        <div className="md:col-span-1 space-y-4">
          <div className="bg-slate-50 border border-slate-150 rounded-2xl p-4 space-y-4">
            <h4 className="text-sm font-bold text-slate-800 border-b pb-2">শ্রেণী ও বিষয় যোগ</h4>
            
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-600">শ্রেণী নির্বাচন করুন</label>
              <select
                value={selectedClass}
                onChange={(e) => {
                  setSelectedClass(e.target.value);
                  handleCancelEdit();
                }}
                className="w-full px-3 py-2 border border-slate-200 bg-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-slate-800"
              >
                {classes.map((cls) => (
                  <option key={cls} value={cls}>
                    {cls}
                  </option>
                ))}
              </select>
            </div>

            <form onSubmit={handleAddSubject} className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-600">নতুন বিষয়ের নাম</label>
                <input
                  type="text"
                  required
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  placeholder="যেমন: আল-আকাইদ ওয়াল ফিকহ্"
                  className="w-full px-3 py-2 border border-slate-200 bg-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 font-medium"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !newSubject.trim()}
                className="w-full flex items-center justify-center gap-1.5 bg-emerald-800 hover:bg-emerald-900 text-amber-400 font-bold py-2.5 px-4 rounded-xl text-xs shadow-sm transition-all cursor-pointer disabled:opacity-50"
              >
                <Plus className="h-4 w-4" />
                <span>বিষয় যুক্ত করুন</span>
              </button>
            </form>
          </div>
        </div>

        {/* Subjects List */}
        <div className="md:col-span-2 space-y-4">
          <div className="bg-slate-50 border border-slate-150 rounded-2xl p-4 min-h-[300px] flex flex-col">
            <div className="flex justify-between items-center border-b pb-2 mb-3">
              <h4 className="text-sm font-bold text-slate-800">
                <span className="text-emerald-700 font-black">{selectedClass}</span> - এর নির্ধারিত বিষয়সমূহ
              </h4>
            </div>

            <div className="flex-1 overflow-y-auto max-h-[350px] pr-1 space-y-2">
              <StreamBuilder<any>
                stream={subjectsQuery}
                builder={(subjects, loading) => {
                  if (loading && subjects.length === 0) {
                    return (
                      <div className="text-center py-12 text-slate-400 text-xs">
                        লোড হচ্ছে...
                      </div>
                    );
                  }
                  if (subjects.length === 0) {
                    return (
                      <div className="text-center py-12 text-slate-400 text-xs font-bold flex flex-col items-center justify-center gap-2">
                        <AlertCircle className="h-8 w-8 text-amber-500/80" />
                        <span>এই শ্রেণীর জন্য কোনো বিষয় যোগ করা হয়নি। বামপাশের ফর্ম থেকে বিষয় যুক্ত করুন।</span>
                      </div>
                    );
                  }

                  return (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {subjects.map((subj) => (
                        <div
                          key={subj.id}
                          className="bg-white border border-slate-100 rounded-xl p-3 flex items-center justify-between shadow-xs hover:border-emerald-200 transition-all group"
                        >
                          {editingId === subj.id ? (
                            <div className="flex items-center gap-1.5 w-full">
                              <input
                                type="text"
                                value={editingName}
                                onChange={(e) => setEditingName(e.target.value)}
                                className="flex-1 px-2.5 py-1 border border-slate-350 rounded-lg text-xs font-medium focus:ring-1 focus:ring-emerald-500"
                              />
                              <button
                                onClick={() => handleUpdateSubject(subj.id)}
                                disabled={isSubmitting}
                                className="p-1 text-emerald-700 hover:bg-emerald-50 rounded-md shrink-0 cursor-pointer"
                                title="সংরক্ষণ"
                              >
                                <Check className="h-4 w-4" />
                              </button>
                              <button
                                onClick={handleCancelEdit}
                                className="p-1 text-rose-600 hover:bg-rose-50 rounded-md shrink-0 cursor-pointer"
                                title="বাতিল"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          ) : (
                            <>
                              <span className="text-xs sm:text-sm font-bold text-slate-800">
                                {subj.subjectName}
                              </span>
                              <div className="flex items-center gap-1 opacity-80 sm:opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                <button
                                  onClick={() => handleStartEdit(subj.id, subj.subjectName)}
                                  className="p-1 text-slate-600 hover:text-emerald-700 hover:bg-slate-100 rounded-lg cursor-pointer"
                                  title="এডিট"
                                >
                                  <Edit3 className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteSubject(subj.id, subj.subjectName)}
                                  className="p-1 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                                  title="মুছুন"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  );
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
