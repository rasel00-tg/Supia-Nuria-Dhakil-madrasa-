import React, { useState } from "react";
import { collection, addDoc } from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "../lib/firebase";
import { FileText, Printer, CheckCircle, CreditCard, Send, Sparkles, Phone, Mail, User } from "lucide-react";

export default function AdmissionSection() {
  const [studentName, setStudentName] = useState("");
  const [fatherName, setFatherName] = useState("");
  const [motherName, setMotherName] = useState("");
  const [className, setClassName] = useState("৬ষ্ঠ শ্রেণী");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [paymentStatus, setPaymentStatus] = useState<"Paid" | "Unpaid">("Unpaid");
  
  // Simulated payment transaction details
  const [trxId, setTrxId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("bKash");

  const [loading, setLoading] = useState(false);
  const [receipt, setReceipt] = useState<any | null>(null);

  const classes = ["৬ষ্ঠ শ্রেণী", "৭ম শ্রেণী", "৮ম শ্রেণী", "৯ম শ্রেণী (সাধারণ)", "৯ম শ্রেণী (বিজ্ঞান)", "১০ম শ্রেণী"];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentName || !fatherName || !motherName || !phone) return;

    setLoading(true);

    // Generate a unique Form ID
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const formId = `SNDM-ADM-2026-${randomNum}`;

    const admissionData = {
      form_id: formId,
      student_name: studentName,
      father_name: fatherName,
      mother_name: motherName,
      class: className,
      phone: phone,
      email: email || "N/A",
      payment_status: paymentStatus,
      payment_details: paymentStatus === "Paid" ? {
        method: paymentMethod,
        trx_id: trxId || `BK2607${Math.floor(100000 + Math.random() * 900000)}`
      } : null,
      status: "Pending",
      date: new Date().toISOString().split("T")[0]
    };

    try {
      await addDoc(collection(db, "admissions"), admissionData);
      setReceipt(admissionData);
      
      // Clear form
      setStudentName("");
      setFatherName("");
      setMotherName("");
      setPhone("");
      setEmail("");
      setPaymentStatus("Unpaid");
      setTrxId("");
    } catch (err) {
      console.error("Error creating admission form:", err);
      alert("আবেদন জমা দিতে সমস্যা হয়েছে। অনুগ্রহ করে পুনরায় চেষ্টা করুন।");
      handleFirestoreError(err, OperationType.CREATE, "admissions");
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div id="admission-section" className="space-y-8 py-6 w-full px-2">
      <div className="text-center w-full space-y-2 print:hidden">
        <h2 className="text-2xl sm:text-3xl font-bold text-emerald-900 font-serif">
          অনলাইন ভর্তি আবেদন ফরম
        </h2>
        <p className="text-sm text-gray-500">
          সুফিয়া নূরিয়া দাখিল মাদ্রাসায় নতুন ভর্তিচ্ছু শিক্ষার্থীদের অনলাইন ফর্ম পূরণ পোর্টাল
        </p>
        <div className="h-1.5 w-24 bg-amber-500 mx-auto rounded-full mt-3"></div>
      </div>

      {!receipt ? (
        /* Form Container */
        <div className="bg-white border border-slate-200/80 rounded-xl shadow-sm overflow-hidden print:hidden">
          {/* Header Banner */}
          <div className="bg-emerald-800 p-6 sm:p-8 text-white border-b-4 border-amber-500 flex items-center justify-between">
            <div className="space-y-1">
              <h3 className="text-lg sm:text-xl font-bold text-amber-400 font-serif">শিক্ষাবর্ষ: ২০২৬-২০২৭</h3>
              <p className="text-xs text-emerald-100">সঠিক তথ্য দিয়ে নিচের আবেদন ফরমটি পূরণ করুন</p>
            </div>
            <div className="bg-emerald-900 px-4 py-2 rounded-lg border border-emerald-700/60 flex items-center space-x-2 text-xs font-bold text-amber-300">
              <Sparkles className="h-4 w-4 text-amber-400" />
              <span>অনলাইন এডমিশন</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6 sm:p-10 space-y-6">
            <div className="grid sm:grid-cols-2 gap-6">
              {/* Student Name */}
              <div className="space-y-1.5">
                <label htmlFor="adm-name" className="text-xs font-bold text-gray-700 flex items-center">
                  <User className="h-4 w-4 text-emerald-700 mr-1 flex-shrink-0" />
                  <span>শিক্ষার্থীর পূর্ণ নাম (বাংলায়) <span className="text-red-500">*</span></span>
                </label>
                <input
                  id="adm-name"
                  type="text"
                  required
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  placeholder="যেমন: মোহাম্মদ সাজ্জাদ হোসেন"
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all font-sans text-emerald-950"
                />
              </div>

              {/* Class Name Selection */}
              <div className="space-y-1.5">
                <label htmlFor="adm-class" className="text-xs font-bold text-gray-700">ভর্তির কাঙ্ক্ষিত শ্রেণী <span className="text-red-500">*</span></label>
                <select
                  id="adm-class"
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all font-sans text-emerald-950"
                >
                  {classes.map((cls) => (
                    <option key={cls} value={cls}>
                      {cls}
                    </option>
                  ))}
                </select>
              </div>

              {/* Father's Name */}
              <div className="space-y-1.5">
                <label htmlFor="adm-father" className="text-xs font-bold text-gray-700">পিতার নাম <span className="text-red-500">*</span></label>
                <input
                  id="adm-father"
                  type="text"
                  required
                  value={fatherName}
                  onChange={(e) => setFatherName(e.target.value)}
                  placeholder="যেমন: মোঃ আজহার আলী"
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all font-sans text-emerald-950"
                />
              </div>

              {/* Mother's Name */}
              <div className="space-y-1.5">
                <label htmlFor="adm-mother" className="text-xs font-bold text-gray-700">মাতার নাম <span className="text-red-500">*</span></label>
                <input
                  id="adm-mother"
                  type="text"
                  required
                  value={motherName}
                  onChange={(e) => setMotherName(e.target.value)}
                  placeholder="যেমন: রাশেদা বেগম"
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all font-sans text-emerald-950"
                />
              </div>

              {/* Phone Number */}
              <div className="space-y-1.5">
                <label htmlFor="adm-phone" className="text-xs font-bold text-gray-700 flex items-center">
                  <Phone className="h-4 w-4 text-emerald-700 mr-1 flex-shrink-0" />
                  <span>মোবাইল নম্বর <span className="text-red-500">*</span></span>
                </label>
                <input
                  id="adm-phone"
                  type="text"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="যেমন: ০১৭১১-২২৩৩৪৪"
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all font-sans text-emerald-950"
                />
              </div>

              {/* Email Address */}
              <div className="space-y-1.5">
                <label htmlFor="adm-email" className="text-xs font-bold text-gray-700 flex items-center">
                  <Mail className="h-4 w-4 text-emerald-700 mr-1 flex-shrink-0" />
                  <span>ইমেইল ঠিকানা (ঐচ্ছিক)</span>
                </label>
                <input
                  id="adm-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="যেমন: student@example.com"
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all font-sans text-emerald-950"
                />
              </div>
            </div>

            {/* Admission Fee & Payment Simulation */}
            <div className="bg-emerald-50/50 rounded-xl p-5 border border-emerald-100/60 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-emerald-100 pb-3">
                <div>
                  <h4 className="font-bold text-sm text-emerald-950 flex items-center">
                    <CreditCard className="h-4 w-4 text-emerald-700 mr-1.5 flex-shrink-0" />
                    ভর্তি ফরম ফি এবং পেমেন্ট সেটিং
                  </h4>
                  <p className="text-xs text-gray-500">অনলাইনে ভর্তি ফি পরিশোধ করে আবেদনটি সম্পন্ন করুন।</p>
                </div>
                <div className="text-right">
                  <span className="text-xs text-gray-500">ফরম ফি:</span>
                  <span className="block font-sans font-black text-emerald-900 text-lg">২০০/- টাকা</span>
                </div>
              </div>

              {/* Payment status Toggle for Mock Demo */}
              <div className="space-y-3">
                <div className="flex items-center space-x-6">
                  <label className="inline-flex items-center space-x-2 text-xs font-bold text-gray-700 cursor-pointer">
                    <input
                      type="radio"
                      name="payment_toggle"
                      checked={paymentStatus === "Unpaid"}
                      onChange={() => setPaymentStatus("Unpaid")}
                      className="text-emerald-700 focus:ring-emerald-500 h-4 w-4"
                    />
                    <span>পরে অফিসে পেমেন্ট করব (Unpaid)</span>
                  </label>
                  <label className="inline-flex items-center space-x-2 text-xs font-bold text-gray-700 cursor-pointer">
                    <input
                      type="radio"
                      name="payment_toggle"
                      checked={paymentStatus === "Paid"}
                      onChange={() => setPaymentStatus("Paid")}
                      className="text-emerald-700 focus:ring-emerald-500 h-4 w-4"
                    />
                    <span>মোবাইল ব্যাংকিং পেমেন্ট করব (Paid)</span>
                  </label>
                </div>

                {/* Simulated mobile payment fields */}
                {paymentStatus === "Paid" && (
                  <div className="grid sm:grid-cols-2 gap-4 bg-white p-4 rounded-lg border border-emerald-100 shadow-sm">
                    <div className="space-y-1">
                      <label htmlFor="adm-payment-method" className="text-xs font-bold text-gray-700">পেমেন্ট মাধ্যম</label>
                      <select
                        id="adm-payment-method"
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-xs focus:ring-emerald-500 focus:border-transparent outline-none"
                      >
                        <option value="bKash">বিকাশ (bKash)</option>
                        <option value="Nagad">নগদ (Nagad)</option>
                        <option value="Rocket">রকেট (Rocket)</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label htmlFor="adm-trx-id" className="text-xs font-bold text-gray-700">TrxID / ট্রানজেকশন আইডি</label>
                      <input
                        id="adm-trx-id"
                        type="text"
                        value={trxId}
                        onChange={(e) => setTrxId(e.target.value)}
                        placeholder="যেমন: BK928374928"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-xs focus:ring-emerald-500 focus:border-transparent outline-none font-sans"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            <button
              id="adm-submit-btn"
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-800 hover:bg-emerald-950 text-amber-400 hover:text-amber-300 font-bold py-3.5 px-4 rounded-xl shadow-lg transition-all flex items-center justify-center space-x-2 text-sm disabled:bg-emerald-700 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span>আবেদন জমা হচ্ছে...</span>
              ) : (
                <>
                  <Send className="h-4.5 w-4.5" />
                  <span>আবেদনপত্র সাবমিট করুন</span>
                </>
              )}
            </button>
          </form>
        </div>
      ) : (
        /* Submission Success Receipt */
        <div
          id="admission-receipt"
          className="bg-white border-4 border-emerald-800 rounded-2xl p-6 sm:p-10 shadow-2xl relative overflow-hidden print:shadow-none print:border-emerald-800"
        >
          {/* Success Check circle icon */}
          <div className="absolute top-4 right-4 text-emerald-100 flex-shrink-0 opacity-40 pointer-events-none select-none z-0">
            <CheckCircle className="h-48 w-48 text-emerald-900/10" />
          </div>

          <div className="relative z-10 space-y-6">
            <div className="text-center space-y-2 border-b-2 border-emerald-800 pb-5">
              <div className="bg-emerald-100 text-emerald-800 inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold mb-2 print:hidden">
                <CheckCircle className="h-4 w-4" />
                <span>আবেদন সফলভাবে গৃহীত হয়েছে</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-emerald-900 font-sans">
                সুফিয়া নূরিয়া দাখিল মাদ্রাসা
              </h1>
              <p className="text-xs text-gray-500">অনলাইন ভর্তি আবেদনপত্র রিসিভ কপি</p>
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-center bg-amber-50 border border-amber-200 p-4 rounded-xl text-center sm:text-left gap-2">
              <div>
                <span className="text-xs text-amber-800 font-bold block">ভর্তি ট্র্যাকিং কোড (Form ID):</span>
                <span className="text-lg font-bold font-sans text-emerald-950">{receipt.form_id}</span>
              </div>
              <div className="text-center sm:text-right">
                <span className="text-xs text-amber-800 font-bold block">পেমেন্ট স্ট্যাটাস:</span>
                <span
                  className={`inline-block px-3 py-0.5 rounded-full text-xs font-bold mt-1 ${
                    receipt.payment_status === "Paid"
                      ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                      : "bg-red-100 text-red-800 border border-red-300"
                  }`}
                >
                  {receipt.payment_status === "Paid" ? "পরিশোধিত (Paid)" : "অপরিশোধিত (Unpaid)"}
                </span>
              </div>
            </div>

            {/* Receipt Details Grid */}
            <div className="border border-gray-200 rounded-xl overflow-hidden text-sm">
              <div className="grid grid-cols-3 border-b border-gray-200 bg-gray-50/50 p-3">
                <span className="font-bold text-gray-600 col-span-1">শিক্ষার্থীর নাম:</span>
                <span className="text-emerald-950 col-span-2 font-bold">{receipt.student_name}</span>
              </div>
              <div className="grid grid-cols-3 border-b border-gray-200 p-3">
                <span className="font-bold text-gray-600 col-span-1">ভর্তির শ্রেণী:</span>
                <span className="text-gray-800 col-span-2 font-bold">{receipt.class}</span>
              </div>
              <div className="grid grid-cols-3 border-b border-gray-200 bg-gray-50/50 p-3">
                <span className="font-bold text-gray-600 col-span-1">পিতার নাম:</span>
                <span className="text-gray-800 col-span-2">{receipt.father_name}</span>
              </div>
              <div className="grid grid-cols-3 border-b border-gray-200 p-3">
                <span className="font-bold text-gray-600 col-span-1">মাতার নাম:</span>
                <span className="text-gray-800 col-span-2">{receipt.mother_name}</span>
              </div>
              <div className="grid grid-cols-3 border-b border-gray-200 bg-gray-50/50 p-3">
                <span className="font-bold text-gray-600 col-span-1">মোবাইল নম্বর:</span>
                <span className="text-gray-800 col-span-2 font-sans">{receipt.phone}</span>
              </div>
              <div className="grid grid-cols-3 border-b border-gray-200 p-3">
                <span className="font-bold text-gray-600 col-span-1">আবেদনের তারিখ:</span>
                <span className="text-gray-800 col-span-2 font-sans">{receipt.date}</span>
              </div>
              {receipt.payment_details && (
                <div className="grid grid-cols-3 bg-emerald-50/30 p-3">
                  <span className="font-bold text-emerald-900 col-span-1">পেমেন্ট ট্রানজেকশন:</span>
                  <span className="text-emerald-950 col-span-2 font-sans">
                    {receipt.payment_details.method} - <b>{receipt.payment_details.trx_id}</b>
                  </span>
                </div>
              )}
            </div>

            {/* Print & Return action panel */}
            <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4 print:hidden">
              <button
                id="receipt-print-btn"
                onClick={handlePrint}
                className="flex items-center justify-center space-x-1.5 bg-emerald-800 hover:bg-emerald-950 text-white font-bold py-2.5 px-6 rounded-lg text-sm shadow-md transition-all"
              >
                <Printer className="h-4 w-4" />
                <span>রশিদ প্রিন্ট করুন</span>
              </button>
              <button
                id="receipt-new-btn"
                onClick={() => setReceipt(null)}
                className="flex items-center justify-center space-x-1.5 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 font-bold py-2.5 px-6 rounded-lg text-sm shadow-sm transition-all"
              >
                <FileText className="h-4 w-4" />
                <span>নতুন আবেদন করুন</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
