import React, { useState, useEffect } from "react";
import { db, StreamBuilder } from "../lib/firebase";
import { collection, query, doc, setDoc } from "firebase/firestore";
import { Save, RefreshCw, CheckCircle, Phone, MessageSquare, Mail, Megaphone, FileText } from "lucide-react";

const sodossoQuery = query(collection(db, "sodosso_form_settings"));

interface SodossoContact {
  name: string;
  designation: string;
  phone: string;
}

interface SodossoFormData {
  id?: string;
  noticeText: string;
  contacts: SodossoContact[];
  whatsapps: SodossoContact[];
  emails: string[];
}

const DEFAULT_SODOSSO: SodossoFormData = {
  noticeText: "সদস্য ফরম গ্রহণ ও নিবন্ধন সংক্রান্ত গুরুত্বপূর্ণ নির্দেশনা: সম্মানিত শুভাকাঙ্ক্ষী ও সুধী মহল, সুফিয়া নূরীয়া দাখিল মাদ্রাসার সদস্য ফরম গ্রহণ ও নিবন্ধন কার্যক্রম শুরু হয়েছে। আগ্রহী ব্যক্তিবর্গকে মাদ্রাসার কার্যালয় থেকে অথবা অনলাইন থেকে ফরম সংগ্রহ করে আগামী ৩০ই আগস্ট ২০২৬ ইংরেজি তারিখের মধ্যে প্রয়োজনীয় কাগজপত্রাদিসহ আবেদনপত্র জমা দেওয়ার জন্য বিশেষভাবে অনুরোধ করা হলো। বিস্তারিত তথ্যের জন্য নিম্নোক্ত কর্মকর্তাদের সাথে যোগাযোগ করুন।",
  contacts: [
    { name: "মাওলানা মোহাম্মদ আবু বকর", designation: "সুপার (অধ্যক্ষ)", phone: "০১৭১১-১২৩৪৫৬" },
    { name: "হাফেজ মাওলানা আব্দুর রহমান", designation: "সহকারী সুপার", phone: "০১৭২২-২৩৪৫৬৭" },
    { name: "আলহাজ্ব ইঞ্জিনিয়ার শামসুল আলম", designation: "সভাপতি (গভর্নিং বডি)", phone: "০১৭৩৩-৩৪৫৬৭৮" }
  ],
  whatsapps: [
    { name: "মাওলানা মোহাম্মদ আবু বকর (সুপার)", designation: "সুপার (অধ্যক্ষ)", phone: "০১৭১১-১২৩৪৫৬" },
    { name: "হাফেজ মাওলানা আব্দুর রহমান (সহকারী সুপার)", designation: "সহকারী সুপার", phone: "০১৭২২-২৩৪৫৬৭" },
    { name: "মাদ্রাসা অফিশিয়াল সেল", designation: "কার্যালয়", phone: "০১৭৩৩-৩৪৫৬৭৮" }
  ],
  emails: [
    "info@sufianooria.edu.bd",
    "super@sufianooria.edu.bd",
    "contact@sufianooria.edu.bd"
  ]
};

export default function SodossoFormUpdateForm() {
  return (
    <StreamBuilder<SodossoFormData>
      stream={sodossoQuery}
      builder={(list, loading, error) => {
        if (loading) {
          return (
            <div className="py-12 text-center text-emerald-800 font-sans animate-pulse">
              সদস্য ফরম কন্টেন্ট লোড হচ্ছে...
            </div>
          );
        }

        const rawData = list && list.length > 0 ? (list.find(item => item.id === "main") || list[0]) : DEFAULT_SODOSSO;
        return <SodossoFormUpdateFormInner rawData={rawData} />;
      }}
    />
  );
}

function SodossoFormUpdateFormInner({ rawData }: { rawData: SodossoFormData }) {
  const [noticeText, setNoticeText] = useState("");
  const [contacts, setContacts] = useState<SodossoContact[]>([]);
  const [whatsapps, setWhatsapps] = useState<SodossoContact[]>([]);
  const [emails, setEmails] = useState<string[]>([]);

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState("");

  // Sync state with dynamic database updates
  useEffect(() => {
    setNoticeText(rawData.noticeText || DEFAULT_SODOSSO.noticeText);
    
    // Ensure we have exactly 3 entries for contacts, whatsapps, and emails (with fallback to default if missing)
    const rawContacts = rawData.contacts || [];
    const syncContacts = [0, 1, 2].map(idx => ({
      name: rawContacts[idx]?.name || DEFAULT_SODOSSO.contacts[idx]?.name || "",
      designation: rawContacts[idx]?.designation || DEFAULT_SODOSSO.contacts[idx]?.designation || "",
      phone: rawContacts[idx]?.phone || DEFAULT_SODOSSO.contacts[idx]?.phone || ""
    }));
    setContacts(syncContacts);

    const rawWhatsapps = rawData.whatsapps || [];
    const syncWhatsapps = [0, 1, 2].map(idx => ({
      name: rawWhatsapps[idx]?.name || DEFAULT_SODOSSO.whatsapps[idx]?.name || "",
      designation: rawWhatsapps[idx]?.designation || DEFAULT_SODOSSO.whatsapps[idx]?.designation || "",
      phone: rawWhatsapps[idx]?.phone || DEFAULT_SODOSSO.whatsapps[idx]?.phone || ""
    }));
    setWhatsapps(syncWhatsapps);

    const rawEmails = rawData.emails || [];
    const syncEmails = [0, 1, 2].map(idx => rawEmails[idx] || DEFAULT_SODOSSO.emails[idx] || "");
    setEmails(syncEmails);
  }, [rawData]);

  const handleContactChange = (index: number, key: keyof SodossoContact, val: string) => {
    const updated = [...contacts];
    updated[index] = { ...updated[index], [key]: val };
    setContacts(updated);
  };

  const handleWhatsappChange = (index: number, key: keyof SodossoContact, val: string) => {
    const updated = [...whatsapps];
    updated[index] = { ...updated[index], [key]: val };
    setWhatsapps(updated);
  };

  const handleEmailChange = (index: number, val: string) => {
    const updated = [...emails];
    updated[index] = val;
    setEmails(updated);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);
    setSaveError("");

    try {
      // Filter out empty entries to keep Firestore clean (but keep minimum arrays)
      const cleanedContacts = contacts.filter(c => c.name.trim() || c.phone.trim());
      const cleanedWhatsapps = whatsapps.filter(w => w.name.trim() || w.phone.trim());
      const cleanedEmails = emails.filter(email => email.trim());

      const payload = {
        noticeText: noticeText.trim(),
        contacts: cleanedContacts,
        whatsapps: cleanedWhatsapps,
        emails: cleanedEmails
      };

      await setDoc(doc(db, "sodosso_form_settings", "main"), payload);
      setSaveSuccess(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err: any) {
      console.error("Error saving sodosso form data:", err);
      setSaveError("ডাটাবেজে তথ্য সংরক্ষণ করতে ব্যর্থ হয়েছে। পুনরায় চেষ্টা করুন।");
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetToDefault = () => {
    if (window.confirm("আপনি কি নিশ্চিতভাবে সদস্য ফরমের সমস্ত তথ্য আদি বা ডিফল্ট অবস্থায় রিসেট করতে চান?")) {
      setNoticeText(DEFAULT_SODOSSO.noticeText);
      setContacts(JSON.parse(JSON.stringify(DEFAULT_SODOSSO.contacts)));
      setWhatsapps(JSON.parse(JSON.stringify(DEFAULT_SODOSSO.whatsapps)));
      setEmails([...DEFAULT_SODOSSO.emails]);
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-8 pb-12">
      {saveSuccess && (
        <div className="bg-emerald-100 border border-emerald-300 text-emerald-900 px-4 py-3 rounded-xl flex items-center gap-2 animate-fade-in font-sans text-sm">
          <CheckCircle className="h-5 w-5 text-emerald-600 shrink-0" />
          <span>সদস্য ফরম পেজের সকল কন্টেন্ট সফলভাবে রিয়েল-টাইম আপডেট করা হয়েছে!</span>
        </div>
      )}

      {saveError && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-xl flex items-center gap-2 font-sans text-sm">
          <span className="text-red-500 shrink-0">❌</span>
          <span>{saveError}</span>
        </div>
      )}

      {/* ১. সদস্য ফরম নোটিশ */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 shadow-xs space-y-4">
        <h4 className="text-sm font-bold uppercase tracking-wider text-emerald-800 border-b border-gray-100 pb-2 flex items-center gap-2 font-mono">
          <Megaphone className="h-4 w-4" />
          ১. সদস্য ফরম নোটিশ ও সাধারণ নির্দেশনা
        </h4>
        <div className="space-y-1.5 pt-2">
          <label className="text-xs font-bold text-gray-700">গুরুত্বপূর্ণ নোটিশ টেক্সট</label>
          <textarea
            required
            rows={5}
            value={noticeText}
            onChange={(e) => setNoticeText(e.target.value)}
            placeholder="সদস্য ফরম গ্রহণ ও নিবন্ধন সংক্রান্ত গুরুত্বপূর্ণ নির্দেশনা এখানে লিখুন..."
            className="w-full px-4 py-3 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all text-emerald-950 font-sans"
          />
        </div>
      </div>

      {/* ২. কন্টাক্ট নাম্বার */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 shadow-xs space-y-4">
        <h4 className="text-sm font-bold uppercase tracking-wider text-emerald-800 border-b border-gray-100 pb-2 flex items-center gap-2 font-mono">
          <Phone className="h-4 w-4" />
          ২. কন্টাক্ট নাম্বার সেকশন (সর্বোচ্চ ৩টি)
        </h4>
        <div className="grid md:grid-cols-3 gap-6 pt-2">
          {contacts.map((c, i) => (
            <div key={i} className="p-4 border border-gray-100 rounded-xl bg-gray-50/50 space-y-3">
              <span className="text-xs font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                কন্টাক্ট {i + 1}
              </span>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700">কর্মকর্তা/সদস্যের নাম</label>
                <input
                  type="text"
                  value={c.name}
                  onChange={(e) => handleContactChange(i, "name", e.target.value)}
                  placeholder="নাম লিখুন"
                  className="w-full px-3 py-2 border rounded-md text-sm font-sans"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700">পদবী / পদের নাম</label>
                <input
                  type="text"
                  value={c.designation}
                  onChange={(e) => handleContactChange(i, "designation", e.target.value)}
                  placeholder="যেমন: সুপার (অধ্যক্ষ)"
                  className="w-full px-3 py-2 border rounded-md text-sm font-sans"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700">মোবাইল নম্বর</label>
                <input
                  type="text"
                  value={c.phone}
                  onChange={(e) => handleContactChange(i, "phone", e.target.value)}
                  placeholder="যেমন: ০১৭১১-১২৩৪৫৬"
                  className="w-full px-3 py-2 border rounded-md text-sm font-mono"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ৩. হোয়াটসঅ্যাপ নাম্বার */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 shadow-xs space-y-4">
        <h4 className="text-sm font-bold uppercase tracking-wider text-emerald-800 border-b border-gray-100 pb-2 flex items-center gap-2 font-mono">
          <MessageSquare className="h-4 w-4" />
          ৩. হোয়াটসঅ্যাপ নাম্বার সেকশন (সর্বোচ্চ ৩টি)
        </h4>
        <div className="grid md:grid-cols-3 gap-6 pt-2">
          {whatsapps.map((w, i) => (
            <div key={i} className="p-4 border border-gray-100 rounded-xl bg-gray-50/50 space-y-3">
              <span className="text-xs font-bold bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                হোয়াটসঅ্যাপ {i + 1}
              </span>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700">কর্মকর্তা/সদস্যের নাম</label>
                <input
                  type="text"
                  value={w.name}
                  onChange={(e) => handleWhatsappChange(i, "name", e.target.value)}
                  placeholder="নাম লিখুন"
                  className="w-full px-3 py-2 border rounded-md text-sm font-sans"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700">পদবী / পদের নাম</label>
                <input
                  type="text"
                  value={w.designation}
                  onChange={(e) => handleWhatsappChange(i, "designation", e.target.value)}
                  placeholder="যেমন: সহকারী সুপার"
                  className="w-full px-3 py-2 border rounded-md text-sm font-sans"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700">হোয়াটসঅ্যাপ নম্বর</label>
                <input
                  type="text"
                  value={w.phone}
                  onChange={(e) => handleWhatsappChange(i, "phone", e.target.value)}
                  placeholder="যেমন: ০১৭২২-২৩৪৫৬৭"
                  className="w-full px-3 py-2 border rounded-md text-sm font-mono"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ৪. অফিশিয়াল ইমেইল */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 shadow-xs space-y-4">
        <h4 className="text-sm font-bold uppercase tracking-wider text-emerald-800 border-b border-gray-100 pb-2 flex items-center gap-2 font-mono">
          <Mail className="h-4 w-4" />
          ৪. অফিশিয়াল ইমেইল সেকশন (সর্বোচ্চ ৩টি)
        </h4>
        <div className="grid md:grid-cols-3 gap-6 pt-2">
          {emails.map((email, i) => (
            <div key={i} className="p-4 border border-gray-100 rounded-xl bg-gray-50/50 space-y-2">
              <span className="text-xs font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                ইমেইল {i + 1}
              </span>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700">ইমেইল ঠিকানা</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => handleEmailChange(i, e.target.value)}
                  placeholder="যেমন: info@domain.com"
                  className="w-full px-3 py-2 border rounded-md text-sm font-mono"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* অ্যাকশন বাটনসমূহ */}
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
