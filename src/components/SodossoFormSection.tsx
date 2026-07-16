import { db, StreamBuilder } from "../lib/firebase";
import { collection, query } from "firebase/firestore";
import { Phone, MessageSquare, Mail, Shield, AlertTriangle, CheckCircle } from "lucide-react";
import { motion } from "motion/react";

interface SodossoFormSectionProps {
  logoUrl?: string | null;
}

// Helpers to convert Bengali numerals to English digits for URL schemes
const convertToEnglishDigits = (str: string): string => {
  const bengaliToEnglish: Record<string, string> = {
    '০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4',
    '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9'
  };
  return str.split('').map(char => bengaliToEnglish[char] || char).join('');
};

const getTelLink = (phoneStr: string): string => {
  const englishPhone = convertToEnglishDigits(phoneStr);
  const cleaned = englishPhone.replace(/[^0-9+]/g, "");
  return `tel:${cleaned}`;
};

const getWhatsAppLink = (phoneStr: string): string => {
  const englishPhone = convertToEnglishDigits(phoneStr);
  let cleaned = englishPhone.replace(/[^0-9]/g, "");
  // Add Bangladesh country code if missing
  if (cleaned.startsWith('0') && cleaned.length === 11) {
    cleaned = '88' + cleaned;
  }
  return `https://wa.me/${cleaned}`;
};

export default function SodossoFormSection({ logoUrl }: SodossoFormSectionProps) {
  return (
    <div id="sodosso-form-section" className="py-12 bg-[#faf9f6] min-h-screen font-alinur">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 font-alinur">
        
        {/* StreamBuilder for Sodosso Form Settings */}
        <StreamBuilder<any>
          stream={query(collection(db, "sodosso_form_settings"))}
          builder={(data, loading, error) => {
            if (loading) {
              return (
                <div className="flex flex-col items-center justify-center py-20 space-y-4 font-alinur">
                  <div className="h-12 w-12 border-4 border-emerald-800 border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-emerald-950 font-bold animate-pulse">লোড হচ্ছে, অনুগ্রহ করে অপেক্ষা করুন...</p>
                </div>
              );
            }

            if (error) {
              return (
                <div className="bg-red-50 border border-red-200 text-red-800 p-6 rounded-2xl text-center space-y-3 shadow-sm font-alinur">
                  <AlertTriangle className="h-10 w-10 text-red-600 mx-auto" />
                  <p className="font-bold text-lg">তথ্য লোড করতে সমস্যা হয়েছে</p>
                  <p className="text-sm">অনুগ্রহ করে ইন্টারনেট কানেকশন চেক করুন অথবা কিছুক্ষণ পর আবার চেষ্টা করুন।</p>
                </div>
              );
            }

            // Get the settings document (default to our main document, or first doc)
            const settings = data?.find(item => item.id === "main") || data?.[0] || {
              noticeText: "সদস্য ফরম গ্রহণ ও নিবন্ধন সংক্রান্ত গুরুত্বপূর্ণ নির্দেশনা লোড করা যায়নি।",
              contacts: [],
              whatsapps: [],
              emails: []
            };

            const noticeText = settings.noticeText || "সদস্য ফরম গ্রহণ ও নিবন্ধন সংক্রান্ত গুরুত্বপূর্ণ নির্দেশনা...";
            const contacts = settings.contacts || [];
            const whatsapps = settings.whatsapps || [];
            const emails = settings.emails || [];

            return (
              <div className="space-y-10 font-alinur">
                
                {/* Header Card: Madrasah Logo and Title */}
                <motion.div 
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200 shadow-md text-center space-y-6 relative overflow-hidden font-alinur"
                >
                  {/* Background branding subtle gradient accent */}
                  <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-emerald-800 via-amber-500 to-emerald-900" />
                  
                  {/* Logo Container */}
                  <div className="flex justify-center">
                    <div className="relative p-2.5 bg-white border-2 border-emerald-800/20 rounded-full shadow-lg">
                      <img 
                        src={logoUrl || "/photo/logo.png"} 
                        alt="সুফিয়া নূরীয়া দাখিল মাদ্রাসা লোগো" 
                        className="h-24 w-24 object-contain rounded-full bg-white p-0.5"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = "https://cdn-icons-png.flaticon.com/512/2913/2913520.png";
                        }}
                      />
                    </div>
                  </div>

                  {/* Title and Badge */}
                  <div className="space-y-2 font-alinur">
                    <span className="inline-block px-4 py-1.5 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-850 font-bold text-xs sm:text-sm tracking-wide">
                      ইনস্টিটিউট ক্যাটাগরি
                    </span>
                    <h1 className="text-2xl sm:text-3xl font-bold text-emerald-950 tracking-tight leading-tight">
                      সদস্য ফরম ও নিবন্ধন প্যানেল
                    </h1>
                    <p className="text-xs sm:text-sm text-gray-500 font-mono">
                      Sufia Nooria Dakhil Madrasah - Membership Form Information
                    </p>
                  </div>
                </motion.div>

                {/* Important Instructions/Notice Section */}
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.1, duration: 0.5 }}
                  className="bg-gradient-to-br from-emerald-900 to-emerald-950 text-white rounded-3xl p-8 sm:p-10 border-l-8 border-amber-500 shadow-xl space-y-6 font-alinur"
                >
                  <div className="flex items-center space-x-3">
                    <div className="bg-amber-500/20 p-2 rounded-lg text-amber-400">
                      <Shield className="h-6 w-6 stroke-[2]" />
                    </div>
                    <h3 className="text-lg sm:text-xl font-bold text-amber-400">
                      গুরুত্বপূর্ণ নোটিশ ও নির্দেশনা
                    </h3>
                  </div>

                  <div className="border-t border-emerald-800/60 pt-4">
                    <p className="text-emerald-50 text-sm sm:text-base leading-relaxed text-justify whitespace-pre-line font-medium">
                      {noticeText}
                    </p>
                  </div>

                  <div className="flex items-center space-x-2 text-xs text-amber-300 bg-emerald-950/40 p-3 rounded-xl border border-emerald-800/40 font-medium">
                    <CheckCircle className="h-4 w-4 shrink-0" />
                    <span>যেকোনো সমস্যা বা সহায়তার জন্য নিম্নোক্ত কন্টাক্ট সেকশনে যোগাযোগ করতে পারেন।</span>
                  </div>
                </motion.div>

                {/* Contact Information Section: 3 Categories */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.5 }}
                  className="grid grid-cols-1 md:grid-cols-3 gap-6 font-alinur"
                >
                  
                  {/* Category 1: কন্টাক্ট নাম্বার */}
                  <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm flex flex-col justify-between font-alinur">
                    <div className="space-y-4">
                      <div className="flex items-center space-x-2.5 pb-3 border-b border-gray-100">
                        <div className="bg-emerald-50 text-emerald-800 p-2 rounded-xl border border-emerald-100">
                          <Phone className="h-5 w-5" />
                        </div>
                        <h4 className="font-bold text-emerald-950 text-base">কন্টাক্ট নাম্বার</h4>
                      </div>

                      <div className="space-y-5">
                        {contacts.length === 0 ? (
                          <p className="text-xs text-gray-400 italic">কোনো কন্টাক্ট নাম্বার পাওয়া যায়নি।</p>
                        ) : (
                          contacts.slice(0, 3).map((item: any, idx: number) => (
                            <div key={idx} className="p-3 bg-slate-50/50 rounded-xl border border-slate-100 space-y-1.5 hover:border-emerald-200 transition-all">
                              <div>
                                <p className="text-xs font-bold text-emerald-950 leading-tight">{item.name}</p>
                                <p className="text-[11px] text-gray-500 leading-none mt-0.5">{item.designation}</p>
                              </div>
                              <p className="text-xs font-bold text-emerald-900 font-mono">{item.phone}</p>
                              
                              <a
                                href={getTelLink(item.phone)}
                                className="inline-flex items-center justify-center gap-1.5 w-full py-1.5 text-[11px] font-bold bg-emerald-800 hover:bg-emerald-900 text-amber-400 rounded-lg transition-colors shadow-xs"
                                title="সরাসরি কল করতে ক্লিক করুন"
                              >
                                <Phone className="h-3 w-3" />
                                <span>সরাসরি কল করুন</span>
                              </a>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Category 2: হোয়াটসঅ্যাপ নাম্বার */}
                  <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm flex flex-col justify-between font-alinur">
                    <div className="space-y-4">
                      <div className="flex items-center space-x-2.5 pb-3 border-b border-gray-100">
                        <div className="bg-green-50 text-green-700 p-2 rounded-xl border border-green-100">
                          <MessageSquare className="h-5 w-5" />
                        </div>
                        <h4 className="font-bold text-emerald-950 text-base">হোয়াটসঅ্যাপ নাম্বার</h4>
                      </div>

                      <div className="space-y-5">
                        {whatsapps.length === 0 ? (
                          <p className="text-xs text-gray-400 italic">কোনো হোয়াটসঅ্যাপ নাম্বার পাওয়া যায়নি।</p>
                        ) : (
                          whatsapps.slice(0, 3).map((item: any, idx: number) => (
                            <div key={idx} className="p-3 bg-slate-50/50 rounded-xl border border-slate-100 space-y-1.5 hover:border-green-200 transition-all">
                              <div>
                                <p className="text-xs font-bold text-emerald-950 leading-tight">{item.name}</p>
                                <p className="text-[11px] text-gray-500 leading-none mt-0.5">{item.designation}</p>
                              </div>
                              <p className="text-xs font-bold text-green-800 font-mono">{item.phone}</p>
                              
                              <a
                                href={getWhatsAppLink(item.phone)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center justify-center gap-1.5 w-full py-1.5 text-[11px] font-bold bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors shadow-xs"
                                title="হোয়াটসঅ্যাপে মেসেজ পাঠান"
                              >
                                <MessageSquare className="h-3 w-3" />
                                <span>হোয়াটসঅ্যাপ মেসেজ</span>
                              </a>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Category 3: ইমেইল */}
                  <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm flex flex-col justify-between font-alinur">
                    <div className="space-y-4">
                      <div className="flex items-center space-x-2.5 pb-3 border-b border-gray-100">
                        <div className="bg-amber-50 text-amber-600 p-2 rounded-xl border border-amber-100">
                          <Mail className="h-5 w-5" />
                        </div>
                        <h4 className="font-bold text-emerald-950 text-base">অফিশিয়াল ইমেইল</h4>
                      </div>

                      <div className="space-y-5">
                        {emails.length === 0 ? (
                          <p className="text-xs text-gray-400 italic">কোনো ইমেইল ঠিকানা পাওয়া যায়নি।</p>
                        ) : (
                          emails.slice(0, 3).map((email: string, idx: number) => (
                            <div key={idx} className="p-3 bg-slate-50/50 rounded-xl border border-slate-100 space-y-2 hover:border-amber-200 transition-all flex flex-col justify-between">
                              <p className="text-xs font-bold text-gray-700 break-all font-mono select-all">
                                {email}
                              </p>
                              
                              <a
                                href={`mailto:${email}`}
                                className="inline-flex items-center justify-center gap-1.5 w-full py-1.5 text-[11px] font-bold bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-colors shadow-xs"
                                title="ইমেইল পাঠাতে ক্লিক করুন"
                              >
                                <Mail className="h-3 w-3" />
                                <span>ইমেইল পাঠান</span>
                              </a>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>

                </motion.div>

              </div>
            );
          }}
        />

      </div>
    </div>
  );
}
