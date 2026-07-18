import React, { useState, useEffect } from "react";
import { collection, addDoc, query, where, getDocs, Timestamp, doc, setDoc } from "firebase/firestore";
import { db, StreamBuilder, uploadFileToImgBB } from "../lib/firebase";
import { FileText, Upload, CheckCircle, AlertCircle, X, ChevronDown, Download } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

const convertBengaliToEnglishDigits = (str: string): string => {
  const banglaDigits = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
  return str.replace(/[০-৯]/g, (match) => banglaDigits.indexOf(match).toString());
};

const toBengaliDigits = (numStr: string | number): string => {
  const banglaDigits = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
  return numStr.toString().replace(/[0-9]/g, (match) => banglaDigits[parseInt(match, 10)]);
};

export default function AdmissionSection({ onFormStateChange, logoUrl }: { onFormStateChange?: (isOpen: boolean) => void; logoUrl?: string | null }) {
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    if (onFormStateChange) {
      onFormStateChange(showForm);
    }
  }, [showForm, onFormStateChange]);

  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [popupMessage, setPopupMessage] = useState<{type: 'error' | 'success' | 'alert', text: string} | null>(null);

  const initialFormData = {
    applicantPhone: "",
    admissionClass: "শিশু শ্রেণী",
    
    // Student Info
    studentNameBn: "",
    studentNameEn: "",
    bloodGroup: "A+",
    gender: "পুরুষ",
    studentNid: "",
    studentDob: "",
    studentThana: "",
    studentDistrict: "",
    studentPresentAddress: "",
    studentPermanentAddress: "",

    // Guardian 1
    g1Name: "",
    g1Relation: "বাবা",
    g1RelationOther: "",
    g1Phone: "",
    g1Email: "",
    g1Nid: "",
    g1Dob: "",
    g1Thana: "",
    g1District: "",
    g1PresentAddress: "",
    g1PermanentAddress: "",

    // Guardian 2
    g2Name: "",
    g2Relation: "মা",
    g2RelationOther: "",
    g2Phone: "",
    g2Email: "",
    g2Nid: "",
    g2Dob: "",
    g2Thana: "",
    g2District: "",
    g2PresentAddress: "",
    g2PermanentAddress: "",

    // Conditional Extra Fields
    prevInstitute: "",
    prevRoll: "",
    prevGpa: "",
    prevLeaveReason: "",
    prevClearance: "হ্যাঁ"
  };

  const [formData, setFormData] = useState(initialFormData);
  const [submittedData, setSubmittedData] = useState<any>(null);
  const [acceptedRules, setAcceptedRules] = useState(false);

  const bannerConfigQuery = query(collection(db, "global_config"));

  const classes = ["শিশু শ্রেণী", "১ম শ্রেণী", "২য় শ্রেণী", "৩য় শ্রেণী", "৪র্থ শ্রেণী", "৫ম শ্রেণী", "৬ষ্ঠ শ্রেণী", "৭ম শ্রেণী", "৮ম শ্রেণী", "৯ম শ্রেণী"];
  const bloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
  const genders = ["পুরুষ", "নারী"];
  const relations = ["বাবা", "মা", "বড় ভাই", "বড় বোন", "চাচা", "চাচী", "মামা", "খালা", "দাদা", "দাদী", "নানা", "নানী", "অন্যান্য"];

  const showExtraFields = ["৬ষ্ঠ শ্রেণী", "৭ম শ্রেণী", "৮ম শ্রেণী", "৯ম শ্রেণী"].includes(formData.admissionClass);

  const validatePhone = (phone: string): string | null => {
    if (!phone) return null;
    const isOnlyDigits = /^[0-9]+$/.test(phone);
    if (!isOnlyDigits) {
      return "মোবাইল নম্বরটি শুধুমাত্র ইংরেজি সংখ্যায় হতে হবে।";
    }
    if (!phone.startsWith("01")) {
      return "মোবাইল নম্বরটি অবশ্যই '01' দিয়ে শুরু হতে হবে।";
    }
    if (phone.length !== 11) {
      return `মোবাইল নম্বরটি অবশ্যই ১১ ডিজিটের হতে হবে (বর্তমানে ${toBengaliDigits(phone.length)} ডিজিট)।`;
    }
    return null;
  };

  const applicantPhoneError = validatePhone(formData.applicantPhone);
  const g1PhoneError = validatePhone(formData.g1Phone);
  const g2PhoneError = validatePhone(formData.g2Phone);

  const isFormPhoneValid = 
    formData.applicantPhone?.length === 11 && !applicantPhoneError &&
    formData.g1Phone?.length === 11 && !g1PhoneError &&
    formData.g2Phone?.length === 11 && !g2PhoneError;

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const url = await uploadFileToImgBB(file);
      const configRef = doc(db, "global_config", "admission_banner_config");
      await setDoc(configRef, {
        isAdmissionBannerUploaded: true,
        admissionBannerUrl: url
      }, { merge: true });
    } catch (error) {
      console.error("Banner upload failed:", error);
      alert("ব্যানার আপলোড ব্যর্থ হয়েছে। আবার চেষ্টা করুন।");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!acceptedRules) return;

    setIsSubmitting(true);
    setPopupMessage(null);

    try {
      // 1. Check pending status in admissions
      const admissionsRef = collection(db, "admissions");
      const qAdmission = query(admissionsRef, where("applicantPhone", "==", formData.applicantPhone));
      const admissionSnap = await getDocs(qAdmission);
      
      let hasPending = false;
      admissionSnap.forEach(doc => {
        if (doc.data().status === "pending") {
          hasPending = true;
        }
      });

      if (hasPending) {
        setPopupMessage({type: 'error', text: "বর্তমান নাম্বার দিয়ে আবেদন করা হয়েছে স্টাটাস -পেন্ডিং"});
        setIsSubmitting(false);
        return;
      }

      // 2. Check if already a student
      const studentsRef = collection(db, "students");
      const qStudent = query(studentsRef, where("phone", "==", formData.applicantPhone));
      const studentSnap = await getDocs(qStudent);

      if (!studentSnap.empty) {
        const sData = studentSnap.docs[0].data();
        setPopupMessage({
          type: 'alert',
          text: `নাম: ${sData.studentName || sData.name || 'অজানা'}, শ্রেনী: ${sData.className || sData.class || 'অজানা'}, রোল: ${sData.rollNo || sData.roll || 'অজানা'}`
        });
        setIsSubmitting(false);
        return;
      }

      // 3. Submit
      await addDoc(admissionsRef, {
        ...formData,
        status: "pending",
        createdAt: Timestamp.now()
      });

      setSubmittedData(formData);
      setPopupMessage({type: 'success', text: "আপনার আবেদনটি সফলভাবে সাবমিট হয়েছে, কতৃপক্ষের ফিডব্যাকের জন্য অপেক্ষা করুন বা আবেদনে ট্রেকিং চেক করুন"});
      setFormData(initialFormData);
      setAcceptedRules(false);

    } catch (error) {
      console.error("Admission submit failed:", error);
      setPopupMessage({type: 'error', text: "আবেদন সাবমিট করতে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।"});
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    const numericFields = [
      "applicantPhone", 
      "studentNid", 
      "studentDob",
      "g1Phone", 
      "g1Nid", 
      "g1Dob",
      "g2Phone", 
      "g2Nid", 
      "g2Dob",
      "prevRoll", 
      "prevGpa"
    ];
    let finalValue = value;
    if (numericFields.includes(field)) {
      finalValue = convertBengaliToEnglishDigits(value);
    }
    if (["applicantPhone", "g1Phone", "g2Phone"].includes(field)) {
      finalValue = finalValue.slice(0, 11);
    }
    setFormData(prev => ({ ...prev, [field]: finalValue }));
  };

  const downloadApplicationPDF = async () => {
    const element = document.getElementById("application-form-pdf-template");
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
      pdf.save(`SNDM_Admission_Form_${submittedData?.applicantPhone || 'New'}.pdf`);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("পিডিএফ ডাউনলোড করতে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-alinur pb-20">
      
      {/* Header & Banner */}
      <div className="bg-emerald-900 text-center py-6 shadow-md border-b-4 border-amber-400">
        <h1 className="text-3xl md:text-5xl font-black text-white drop-shadow-md">অনলাইন ভর্তি আবেদন পোর্টাল</h1>
      </div>

      {!showForm && (
        <StreamBuilder<any>
          stream={bannerConfigQuery}
          builder={(configs) => {
            const config = configs?.find(c => c.id === "admission_banner_config") || {};
            
            return (
              <div className="relative w-full">
                {config.admissionBannerUrl && (
                  <div className="w-full shadow-xl border-b border-emerald-500/30">
                    <img src={config.admissionBannerUrl} alt="ভর্তি ব্যানার" className="w-full h-auto object-contain" />
                  </div>
                )}
                
                {!config.isAdmissionBannerUploaded && (
                  <div className="absolute top-4 right-4 z-10">
                    <label className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl shadow-lg cursor-pointer flex items-center gap-2 transition-all font-bold border border-emerald-400">
                      <Upload className="w-5 h-5" />
                      {isUploading ? "আপলোড হচ্ছে..." : "ব্যানার আপলোড করুন"}
                      <input type="file" accept="image/*" onChange={handleBannerUpload} className="hidden" disabled={isUploading} />
                    </label>
                  </div>
                )}
              </div>
            );
          }}
        />
      )}

      <div className="max-w-5xl mx-auto px-4 mt-8 text-center">
        {!showForm && (
          <button 
            onClick={() => setShowForm(true)}
            className="bg-gradient-to-r from-emerald-600 to-emerald-800 hover:from-emerald-500 hover:to-emerald-700 text-white px-8 py-4 rounded-full shadow-lg hover:shadow-xl flex items-center justify-center gap-3 mx-auto text-xl font-bold transition-all hover:scale-105 border border-emerald-400/50"
          >
            <FileText className="w-6 h-6" />
            ভর্তি আবেদন ফরম খুলুন
          </button>
        )}
      </div>

      {showForm && (
        <div className="max-w-4xl mx-auto px-4 mt-8">
          <form onSubmit={handleSubmit} className="bg-white p-6 md:p-10 rounded-3xl shadow-2xl border border-emerald-100">
            
            <div className="grid md:grid-cols-2 gap-6 mb-8 bg-emerald-50 p-6 rounded-2xl border border-emerald-200">
              <div>
                <label className="block text-emerald-900 font-bold mb-2">আবেদনকারীর নাম্বার *</label>
                <div className="relative">
                  <input 
                    type="tel" 
                    required
                    maxLength={11}
                    value={formData.applicantPhone}
                    onChange={e => handleInputChange("applicantPhone", e.target.value)}
                    placeholder="01XXXXXXXXX"
                    className={`w-full border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white font-alinur ${
                      applicantPhoneError ? "border-red-500 focus:ring-red-500" : "border-emerald-300"
                    }`}
                    style={{ fontFamily: 'Ador Noirit' }}
                  />
                  {applicantPhoneError && (
                    <p className="text-red-500 text-xs font-bold mt-1.5" style={{ fontFamily: 'Ador Noirit' }}>
                      {applicantPhoneError}
                    </p>
                  )}
                  <div className="text-right mt-1">
                    <span className="text-xs text-slate-500 font-bold" style={{ fontFamily: 'Ador Noirit' }}>
                      {`${toBengaliDigits(11 - (formData.applicantPhone?.length || 0))}টি বাকি`}
                    </span>
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-emerald-900 font-bold mb-2">ভর্তি ইচ্ছুক শ্রেণী সিলেক্ট *</label>
                <div className="relative">
                  <select 
                    value={formData.admissionClass}
                    onChange={e => handleInputChange("admissionClass", e.target.value)}
                    className="w-full border border-emerald-300 rounded-xl px-4 py-3 appearance-none focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white font-alinur"
                    style={{ fontFamily: 'Ador Noirit' }}
                  >
                    {classes.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <ChevronDown className="absolute right-4 top-3.5 text-emerald-600 pointer-events-none w-5 h-5" />
                </div>
              </div>
            </div>

            {/* Student Info */}
            <div className="mb-8">
              <h3 className="text-2xl font-bold text-emerald-800 border-b-2 border-amber-400 pb-2 mb-6">শিক্ষার্থী তথ্য</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">বাংলা পূর্ণ নাম *</label>
                  <input type="text" required value={formData.studentNameBn} onChange={e => handleInputChange("studentNameBn", e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 font-alinur" style={{ fontFamily: 'Ador Noirit' }} placeholder="বাংলায় নাম" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">ইংরেজি পূর্ণ নাম *</label>
                  <input type="text" required value={formData.studentNameEn} onChange={e => handleInputChange("studentNameEn", e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 font-alinur" style={{ fontFamily: 'Ador Noirit' }} placeholder="ইংরেজিতে নাম" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">রক্তের গ্রুপ</label>
                  <select value={formData.bloodGroup} onChange={e => handleInputChange("bloodGroup", e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 font-alinur" style={{ fontFamily: 'Ador Noirit' }}>
                    {bloodGroups.map(bg => <option key={bg} value={bg}>{bg}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">লিঙ্গ</label>
                  <select value={formData.gender} onChange={e => handleInputChange("gender", e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 font-alinur" style={{ fontFamily: 'Ador Noirit' }}>
                    {genders.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">এনআইডি/নিবন্ধন নাম্বার *</label>
                  <input type="text" required value={formData.studentNid} onChange={e => handleInputChange("studentNid", e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 font-alinur" style={{ fontFamily: 'Ador Noirit' }} placeholder="জন্ম নিবন্ধন বা এনআইডি" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">জন্মসাল *</label>
                  <input type="date" required value={formData.studentDob} onChange={e => handleInputChange("studentDob", e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 font-alinur" style={{ fontFamily: 'Ador Noirit' }} />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">থানা *</label>
                  <input type="text" required value={formData.studentThana} onChange={e => handleInputChange("studentThana", e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 font-alinur" style={{ fontFamily: 'Ador Noirit' }} placeholder="থানার নাম" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">জেলা *</label>
                  <input type="text" required value={formData.studentDistrict} onChange={e => handleInputChange("studentDistrict", e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 font-alinur" style={{ fontFamily: 'Ador Noirit' }} placeholder="জেলার নাম" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-slate-700 mb-1">বর্তমান ঠিকানা *</label>
                  <input type="text" required value={formData.studentPresentAddress} onChange={e => handleInputChange("studentPresentAddress", e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 font-alinur" style={{ fontFamily: 'Ador Noirit' }} placeholder="বর্তমান ঠিকানা বিস্তারিত" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-slate-700 mb-1">স্থায়ী ঠিকানা *</label>
                  <input type="text" required value={formData.studentPermanentAddress} onChange={e => handleInputChange("studentPermanentAddress", e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 font-alinur" style={{ fontFamily: 'Ador Noirit' }} placeholder="স্থায়ী ঠিকানা বিস্তারিত" />
                </div>
              </div>
            </div>

            {/* Guardian 1 */}
            <div className="mb-8 bg-slate-50 p-6 rounded-2xl border border-slate-200">
              <h3 className="text-xl font-bold text-emerald-800 mb-4">অভিভাবক তথ্য ১</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">অভিভাবকের নাম *</label>
                  <input type="text" required value={formData.g1Name} onChange={e => handleInputChange("g1Name", e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 font-alinur" style={{ fontFamily: 'Ador Noirit' }} placeholder="নাম" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">সম্পর্ক *</label>
                  <select value={formData.g1Relation} onChange={e => handleInputChange("g1Relation", e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 font-alinur" style={{ fontFamily: 'Ador Noirit' }}>
                    {relations.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                  {formData.g1Relation === "অন্যান্য" && (
                    <input type="text" required value={formData.g1RelationOther} onChange={e => handleInputChange("g1RelationOther", e.target.value)} placeholder="সম্পর্ক উল্লেখ করুন" className="w-full border border-slate-300 rounded-lg px-3 py-2 mt-2 focus:ring-2 focus:ring-emerald-500 font-alinur" style={{ fontFamily: 'Ador Noirit' }} />
                  )}
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">যোগাযোগ নাম্বার *</label>
                  <div className="relative">
                    <input 
                      type="tel" 
                      required 
                      maxLength={11}
                      value={formData.g1Phone} 
                      onChange={e => handleInputChange("g1Phone", e.target.value)} 
                      className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 font-alinur ${
                        g1PhoneError ? "border-red-500 focus:ring-red-500" : "border-slate-300"
                      }`}
                      style={{ fontFamily: 'Ador Noirit' }}
                      placeholder="মোবাইল নাম্বার" 
                    />
                    {g1PhoneError && (
                      <p className="text-red-500 text-xs font-bold mt-1" style={{ fontFamily: 'Ador Noirit' }}>
                        {g1PhoneError}
                      </p>
                    )}
                    <div className="text-right mt-1">
                      <span className="text-xs text-slate-500 font-bold" style={{ fontFamily: 'Ador Noirit' }}>
                        {`${toBengaliDigits(11 - (formData.g1Phone?.length || 0))}টি বাকি`}
                      </span>
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">ইমেইল (ঐচ্ছিক)</label>
                  <input type="email" value={formData.g1Email} onChange={e => handleInputChange("g1Email", e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 font-alinur" style={{ fontFamily: 'Ador Noirit' }} placeholder="ইমেইল এড্রেস" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">এনআইডি নাম্বার *</label>
                  <input type="text" required value={formData.g1Nid} onChange={e => handleInputChange("g1Nid", e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 font-alinur" style={{ fontFamily: 'Ador Noirit' }} placeholder="এনআইডি নাম্বার" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">জন্মসাল *</label>
                  <input type="date" required value={formData.g1Dob} onChange={e => handleInputChange("g1Dob", e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 font-alinur" style={{ fontFamily: 'Ador Noirit' }} />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">থানা *</label>
                  <input type="text" required value={formData.g1Thana} onChange={e => handleInputChange("g1Thana", e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 font-alinur" style={{ fontFamily: 'Ador Noirit' }} placeholder="থানার নাম" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">জেলা *</label>
                  <input type="text" required value={formData.g1District} onChange={e => handleInputChange("g1District", e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 font-alinur" style={{ fontFamily: 'Ador Noirit' }} placeholder="জেলার নাম" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-slate-700 mb-1">বর্তমান ঠিকানা *</label>
                  <input type="text" required value={formData.g1PresentAddress} onChange={e => handleInputChange("g1PresentAddress", e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 font-alinur" style={{ fontFamily: 'Ador Noirit' }} placeholder="বর্তমান ঠিকানা বিস্তারিত" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-slate-700 mb-1">স্থায়ী ঠিকানা *</label>
                  <input type="text" required value={formData.g1PermanentAddress} onChange={e => handleInputChange("g1PermanentAddress", e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 font-alinur" style={{ fontFamily: 'Ador Noirit' }} placeholder="স্থায়ী ঠিকানা বিস্তারিত" />
                </div>
              </div>
            </div>

            {/* Guardian 2 */}
            <div className="mb-8 bg-slate-50 p-6 rounded-2xl border border-slate-200">
              <h3 className="text-xl font-bold text-emerald-800 mb-4">অভিভাবক তথ্য ২</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">অভিভাবকের নাম *</label>
                  <input type="text" required value={formData.g2Name} onChange={e => handleInputChange("g2Name", e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 font-alinur" style={{ fontFamily: 'Ador Noirit' }} placeholder="নাম" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">সম্পর্ক *</label>
                  <select value={formData.g2Relation} onChange={e => handleInputChange("g2Relation", e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 font-alinur" style={{ fontFamily: 'Ador Noirit' }}>
                    {relations.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                  {formData.g2Relation === "অন্যান্য" && (
                    <input type="text" required value={formData.g2RelationOther} onChange={e => handleInputChange("g2RelationOther", e.target.value)} placeholder="সম্পর্ক উল্লেখ করুন" className="w-full border border-slate-300 rounded-lg px-3 py-2 mt-2 focus:ring-2 focus:ring-emerald-500 font-alinur" style={{ fontFamily: 'Ador Noirit' }} />
                  )}
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">যোগাযোগ নাম্বার *</label>
                  <div className="relative">
                    <input 
                      type="tel" 
                      required 
                      maxLength={11}
                      value={formData.g2Phone} 
                      onChange={e => handleInputChange("g2Phone", e.target.value)} 
                      className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 font-alinur ${
                        g2PhoneError ? "border-red-500 focus:ring-red-500" : "border-slate-300"
                      }`}
                      style={{ fontFamily: 'Ador Noirit' }}
                      placeholder="মোবাইল নাম্বার" 
                    />
                    {g2PhoneError && (
                      <p className="text-red-500 text-xs font-bold mt-1" style={{ fontFamily: 'Ador Noirit' }}>
                        {g2PhoneError}
                      </p>
                    )}
                    <div className="text-right mt-1">
                      <span className="text-xs text-slate-500 font-bold" style={{ fontFamily: 'Ador Noirit' }}>
                        {`${toBengaliDigits(11 - (formData.g2Phone?.length || 0))}টি বাকি`}
                      </span>
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">ইমেইল (ঐচ্ছিক)</label>
                  <input type="email" value={formData.g2Email} onChange={e => handleInputChange("g2Email", e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 font-alinur" style={{ fontFamily: 'Ador Noirit' }} placeholder="ইমেইল এড্রেস" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">এনআইডি নাম্বার *</label>
                  <input type="text" required value={formData.g2Nid} onChange={e => handleInputChange("g2Nid", e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 font-alinur" style={{ fontFamily: 'Ador Noirit' }} placeholder="এনআইডি নাম্বার" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">জন্মসাল *</label>
                  <input type="date" required value={formData.g2Dob} onChange={e => handleInputChange("g2Dob", e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 font-alinur" style={{ fontFamily: 'Ador Noirit' }} />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">থানা *</label>
                  <input type="text" required value={formData.g2Thana} onChange={e => handleInputChange("g2Thana", e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 font-alinur" style={{ fontFamily: 'Ador Noirit' }} placeholder="থানার নাম" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">জেলা *</label>
                  <input type="text" required value={formData.g2District} onChange={e => handleInputChange("g2District", e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 font-alinur" style={{ fontFamily: 'Ador Noirit' }} placeholder="জেলার নাম" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-slate-700 mb-1">বর্তমান ঠিকানা *</label>
                  <input type="text" required value={formData.g2PresentAddress} onChange={e => handleInputChange("g2PresentAddress", e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 font-alinur" style={{ fontFamily: 'Ador Noirit' }} placeholder="বর্তমান ঠিকানা বিস্তারিত" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-slate-700 mb-1">স্থায়ী ঠিকানা *</label>
                  <input type="text" required value={formData.g2PermanentAddress} onChange={e => handleInputChange("g2PermanentAddress", e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 font-alinur" style={{ fontFamily: 'Ador Noirit' }} placeholder="স্থায়ী ঠিকানা বিস্তারিত" />
                </div>
              </div>
            </div>

            {/* Conditional Extra Fields */}
            {showExtraFields && (
              <div className="mb-8 bg-amber-50 p-6 rounded-2xl border border-amber-200">
                <h3 className="text-xl font-bold text-amber-800 mb-4">পূর্বের শিক্ষাপ্রতিষ্ঠানের তথ্য</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-slate-700 mb-1">পূর্বের প্রতিষ্ঠানের নাম *</label>
                    <input type="text" required={showExtraFields} value={formData.prevInstitute} onChange={e => handleInputChange("prevInstitute", e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-500 font-alinur" style={{ fontFamily: 'Ador Noirit' }} placeholder="প্রতিষ্ঠানের নাম" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">রোল *</label>
                    <input type="text" required={showExtraFields} value={formData.prevRoll} onChange={e => handleInputChange("prevRoll", e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-500 font-alinur" style={{ fontFamily: 'Ador Noirit' }} placeholder="রোল নাম্বার" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">শেষ জিপিএ *</label>
                    <input type="text" required={showExtraFields} value={formData.prevGpa} onChange={e => handleInputChange("prevGpa", e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-500 font-alinur" style={{ fontFamily: 'Ador Noirit' }} placeholder="জিপিএ" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-slate-700 mb-1">পূর্বের প্রতিষ্ঠান ত্যাগ করার কারণ * (সর্বোচ্চ ১০০ অক্ষর)</label>
                    <input type="text" maxLength={100} required={showExtraFields} value={formData.prevLeaveReason} onChange={e => handleInputChange("prevLeaveReason", e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-500 font-alinur" style={{ fontFamily: 'Ador Noirit' }} placeholder="কারণ উল্লেখ করুন" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">পূর্বের প্রতিষ্ঠানের ছাড়পত্র আছে কিনা? *</label>
                    <select required={showExtraFields} value={formData.prevClearance} onChange={e => handleInputChange("prevClearance", e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-500 font-alinur" style={{ fontFamily: 'Ador Noirit' }}>
                      <option value="হ্যাঁ">হ্যাঁ</option>
                      <option value="না">না</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Rules */}
            <div className="mb-8 border-t-2 border-emerald-100 pt-8">
              <h3 className="text-xl font-bold text-emerald-800 mb-4">নিয়মাবলি</h3>
              <ul className="list-decimal pl-6 space-y-2 text-slate-700 font-medium mb-6">
                <li>বিদ্যালয়ের সকল নিয়ম-কানুন মেনে চলতে হবে।</li>
                <li>নির্ধারিত সময়ে বিদ্যালয়ে উপস্থিত হতে হবে।</li>
                <li>বিদ্যালয়ের নির্ধারিত ইউনিফর্ম পরিধান বাধ্যতামূলক।</li>
                <li>শিক্ষক-শিক্ষিকা ও সহপাঠীদের প্রতি সম্মানজনক আচরণ করতে হবে।</li>
                <li>বিদ্যালয়ের শৃঙ্খলা ভঙ্গ করলে কর্তৃপক্ষের সিদ্ধান্ত চূড়ান্ত বলে গণ্য হবে।</li>
                <li>বিদ্যালয়ের সম্পদের ক্ষতি করা যাবে না।</li>
                <li>প্রয়োজনীয় ক্ষেত্রে অভিভাবকের উপস্থিতি বাধ্যতামূলক।</li>
                <li>ভর্তি বাতিল বা নিয়ম সংশোধনের অধিকার বিদ্যালয় কর্তৃপক্ষ সংরক্ষণ করে।</li>
              </ul>

              <label className="flex items-start gap-3 cursor-pointer p-4 bg-slate-50 rounded-xl border border-slate-200 hover:bg-slate-100 transition-colors">
                <input 
                  type="checkbox" 
                  checked={acceptedRules} 
                  onChange={e => setAcceptedRules(e.target.checked)}
                  className="mt-1 w-5 h-5 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
                />
                <span className="text-slate-800 font-bold select-none">আইডিয়া/চেকবক্স - আমি সকল নির্দেশনা মেনে চলবো</span>
              </label>
            </div>

            <button 
              type="submit" 
              disabled={!acceptedRules || !isFormPhoneValid || isSubmitting}
              className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all ${
                acceptedRules && isFormPhoneValid && !isSubmitting
                  ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/30" 
                  : "bg-slate-300 text-slate-500 cursor-not-allowed"
              }`}
              style={{ fontFamily: 'Ador Noirit' }}
            >
              {isSubmitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  সাবমিট হচ্ছে...
                </>
              ) : (
                "আবেদন সাবমিট করুন"
              )}
            </button>
          </form>
        </div>
      )}

      {/* Popups */}
      <AnimatePresence>
        {popupMessage && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 font-alinur"
            style={{ fontFamily: 'Ador Noirit' }}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white max-w-md w-full rounded-3xl p-6 shadow-2xl relative"
              style={{ fontFamily: 'Ador Noirit' }}
            >
              <button 
                onClick={() => setPopupMessage(null)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 bg-slate-100 rounded-full p-1"
                style={{ fontFamily: 'Ador Noirit' }}
              >
                <X className="w-5 h-5" />
              </button>
              
              <div className="text-center py-4" style={{ fontFamily: 'Ador Noirit' }}>
                {popupMessage.type === 'error' && <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />}
                {popupMessage.type === 'success' && <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-4" />}
                {popupMessage.type === 'alert' && <AlertCircle className="w-16 h-16 text-amber-500 mx-auto mb-4" />}
                
                <p className={`text-xl font-bold ${
                  popupMessage.type === 'error' ? 'text-red-600' : 
                  popupMessage.type === 'success' ? 'text-emerald-600' : 
                  'text-amber-600'
                }`} style={{ fontFamily: 'Ador Noirit' }}>
                  {popupMessage.text}
                </p>

                {popupMessage.type === 'success' && submittedData && (
                  <button 
                    onClick={downloadApplicationPDF}
                    className="mt-6 mx-auto bg-gradient-to-r from-emerald-600 to-emerald-800 hover:from-emerald-500 hover:to-emerald-700 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl flex items-center justify-center gap-3 font-bold transition-all hover:scale-105 border border-emerald-400"
                    style={{ fontFamily: 'Ador Noirit' }}
                  >
                    <Download className="w-5 h-5" />
                    আবেদন ফরম ডাউনলোড
                  </button>
                )}
                
                <button 
                  onClick={() => setPopupMessage(null)}
                  className="mt-8 bg-slate-800 text-white px-8 py-2 rounded-lg font-bold hover:bg-slate-700 transition-colors"
                  style={{ fontFamily: 'Ador Noirit' }}
                >
                  বন্ধ করুন
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hidden PDF Template */}
      {submittedData && (
        <div style={{ position: "absolute", left: "-9999px", top: "-9999px" }}>
          <div id="application-form-pdf-template" className="w-[210mm] p-10 font-alinur" style={{ backgroundColor: '#ffffff', color: '#0f172a', borderColor: '#cbd5e1', borderWidth: '1px' }}>
            {/* Header */}
            <div className="flex flex-col items-center pb-6 mb-6" style={{ borderBottomWidth: '2px', borderColor: '#065f46' }}>
              {logoUrl ? (
                <img src={logoUrl} alt="Logo" className="w-24 h-24 mb-4 object-contain" crossOrigin="anonymous" />
              ) : (
                <div className="w-24 h-24 mb-4 rounded-full flex items-center justify-center" style={{ backgroundColor: '#f1f5f9' }}>লোগো</div>
              )}
              <h1 className="text-3xl font-bold mb-2" style={{ color: '#064e3b' }}>সুফিয়া নূরীয়া দাখিল মাদ্রাসা</h1>
              <p className="text-sm font-semibold" style={{ color: '#334155' }}>নতুন পল্লান পাড়া, ৪নং ওয়ার্ড, টেকনাফ, কক্সবাজার</p>
              <h2 className="text-xl font-bold mt-4 px-6 py-2 rounded-full" style={{ backgroundColor: '#d1fae5', borderColor: '#6ee7b7', borderWidth: '1px' }}>ভর্তি আবেদন ফরম</h2>
            </div>

            {/* Photo Box */}
            <div className="absolute top-10 right-10 w-32 h-36 border-2 border-dashed flex items-center justify-center text-center p-2" style={{ borderColor: '#94a3b8' }}>
              <span className="text-xs font-bold" style={{ color: '#64748b' }}>পাসপোর্ট সাইজ<br/>ছবি সংযুক্ত করুন</span>
            </div>

            {/* Data Table */}
            <div className="space-y-6 relative z-10">
              <div className="rounded-lg overflow-hidden" style={{ borderWidth: '1px', borderColor: '#cbd5e1' }}>
                <div className="px-4 py-2 font-bold" style={{ backgroundColor: '#f1f5f9', color: '#065f46', borderBottomWidth: '1px', borderColor: '#cbd5e1' }}>প্রাথমিক তথ্য</div>
                <div className="grid grid-cols-2 p-4 gap-4 text-sm">
                  <div><span className="font-bold">আবেদনকারীর নাম্বার:</span> {submittedData.applicantPhone}</div>
                  <div><span className="font-bold">ভর্তি ইচ্ছুক শ্রেণী:</span> {submittedData.admissionClass}</div>
                </div>
              </div>

              <div className="rounded-lg overflow-hidden" style={{ borderWidth: '1px', borderColor: '#cbd5e1' }}>
                <div className="px-4 py-2 font-bold" style={{ backgroundColor: '#f1f5f9', color: '#065f46', borderBottomWidth: '1px', borderColor: '#cbd5e1' }}>শিক্ষার্থী তথ্য</div>
                <div className="grid grid-cols-2 p-4 gap-x-4 gap-y-3 text-sm">
                  <div><span className="font-bold">বাংলা নাম:</span> {submittedData.studentNameBn}</div>
                  <div><span className="font-bold">ইংরেজি নাম:</span> {submittedData.studentNameEn}</div>
                  <div><span className="font-bold">জন্মসাল:</span> {submittedData.studentDob}</div>
                  <div><span className="font-bold">রক্তের গ্রুপ:</span> {submittedData.bloodGroup}</div>
                  <div><span className="font-bold">লিঙ্গ:</span> {submittedData.gender}</div>
                  <div><span className="font-bold">এনআইডি/নিবন্ধন:</span> {submittedData.studentNid}</div>
                  <div className="col-span-2"><span className="font-bold">বর্তমান ঠিকানা:</span> {submittedData.studentPresentAddress}, {submittedData.studentThana}, {submittedData.studentDistrict}</div>
                  <div className="col-span-2"><span className="font-bold">স্থায়ী ঠিকানা:</span> {submittedData.studentPermanentAddress}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg overflow-hidden" style={{ borderWidth: '1px', borderColor: '#cbd5e1' }}>
                  <div className="px-4 py-2 font-bold" style={{ backgroundColor: '#f1f5f9', color: '#065f46', borderBottomWidth: '1px', borderColor: '#cbd5e1' }}>অভিভাবক ১ (প্রথম)</div>
                  <div className="p-4 space-y-2 text-xs">
                    <div><span className="font-bold">নাম:</span> {submittedData.g1Name}</div>
                    <div><span className="font-bold">সম্পর্ক:</span> {submittedData.g1Relation === 'অন্যান্য' ? submittedData.g1RelationOther : submittedData.g1Relation}</div>
                    <div><span className="font-bold">নাম্বার:</span> {submittedData.g1Phone}</div>
                    <div><span className="font-bold">এনআইডি:</span> {submittedData.g1Nid}</div>
                    <div><span className="font-bold">পেশা/ইমেইল:</span> {submittedData.g1Email || "N/A"}</div>
                    <div><span className="font-bold">ঠিকানা:</span> {submittedData.g1PresentAddress}</div>
                  </div>
                </div>
                
                <div className="rounded-lg overflow-hidden" style={{ borderWidth: '1px', borderColor: '#cbd5e1' }}>
                  <div className="px-4 py-2 font-bold" style={{ backgroundColor: '#f1f5f9', color: '#065f46', borderBottomWidth: '1px', borderColor: '#cbd5e1' }}>অভিভাবক ২ (দ্বিতীয়)</div>
                  <div className="p-4 space-y-2 text-xs">
                    <div><span className="font-bold">নাম:</span> {submittedData.g2Name}</div>
                    <div><span className="font-bold">সম্পর্ক:</span> {submittedData.g2Relation === 'অন্যান্য' ? submittedData.g2RelationOther : submittedData.g2Relation}</div>
                    <div><span className="font-bold">নাম্বার:</span> {submittedData.g2Phone}</div>
                    <div><span className="font-bold">এনআইডি:</span> {submittedData.g2Nid}</div>
                    <div><span className="font-bold">পেশা/ইমেইল:</span> {submittedData.g2Email || "N/A"}</div>
                    <div><span className="font-bold">ঠিকানা:</span> {submittedData.g2PresentAddress}</div>
                  </div>
                </div>
              </div>

              {["৬ষ্ঠ শ্রেণী", "৭ম শ্রেণী", "৮ম শ্রেণী", "৯ম শ্রেণী"].includes(submittedData.admissionClass) && (
                <div className="rounded-lg overflow-hidden" style={{ borderWidth: '1px', borderColor: '#cbd5e1' }}>
                  <div className="px-4 py-2 font-bold" style={{ backgroundColor: '#f1f5f9', color: '#065f46', borderBottomWidth: '1px', borderColor: '#cbd5e1' }}>পূর্বের শিক্ষাপ্রতিষ্ঠানের তথ্য</div>
                  <div className="grid grid-cols-2 p-4 gap-x-4 gap-y-3 text-sm">
                    <div><span className="font-bold">প্রতিষ্ঠানের নাম:</span> {submittedData.prevInstitute}</div>
                    <div><span className="font-bold">রোল:</span> {submittedData.prevRoll}</div>
                    <div><span className="font-bold">শেষ জিপিএ:</span> {submittedData.prevGpa}</div>
                    <div><span className="font-bold">ছাড়পত্র:</span> {submittedData.prevClearance}</div>
                    <div className="col-span-2"><span className="font-bold">ত্যাগ করার কারণ:</span> {submittedData.prevLeaveReason}</div>
                  </div>
                </div>
              )}
            </div>

            {/* Signatures */}
            <div className="mt-24 pt-8 flex justify-between items-end relative z-10">
              <div className="text-center w-48">
                <div className="pt-2 font-bold text-sm" style={{ borderTopWidth: '2px', borderColor: '#1e293b' }}>শিক্ষার্থীর স্বাক্ষর</div>
              </div>
              <div className="text-center w-48">
                <div className="pt-2 font-bold text-sm" style={{ borderTopWidth: '2px', borderColor: '#1e293b' }}>সুপার/প্রধান শিক্ষকের স্বাক্ষর</div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
