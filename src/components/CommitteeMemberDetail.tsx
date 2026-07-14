import React from "react";
import { CommitteeMember } from "../types";
import { 
  ArrowLeft, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar, 
  Award, 
  Heart, 
  GraduationCap,
  Facebook,
  Twitter,
  Linkedin,
  MessageCircle,
  Clock
} from "lucide-react";

interface CommitteeMemberDetailProps {
  member: CommitteeMember;
  onBack: () => void;
}

function toEnglishDigits(str: string | undefined | null): string {
  if (!str) return "";
  const banglaToEnglish: { [key: string]: string } = {
    '০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4',
    '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9'
  };
  return str.replace(/[০-৯]/g, (match) => banglaToEnglish[match]);
}

export default function CommitteeMemberDetail({ member, onBack }: CommitteeMemberDetailProps) {
  // Format WhatsApp Link
  const englishPhone = toEnglishDigits(member.phone || "");
  const cleanPhone = englishPhone ? englishPhone.replace(/[^0-9]/g, "") : "";
  const whatsappUrl = cleanPhone ? `https://wa.me/${cleanPhone.startsWith("88") ? cleanPhone : "88" + cleanPhone}` : "";

  // Contact modal popup state
  const [showPopup, setShowPopup] = React.useState(false);

  // Helper to format WhatsApp link if number is provided
  const formatWhatsAppLink = (num: string) => {
    const englishNum = toEnglishDigits(num);
    const clean = englishNum.replace(/[^0-9]/g, "");
    return `https://wa.me/${clean.startsWith("88") ? clean : "88" + clean}`;
  };

  return (
    <div id="committee-member-detail-page" className="min-h-screen bg-[#fcfcf9] py-6 sm:py-12 px-4 max-w-4xl mx-auto font-alinur animate-fade-in">
      {/* Action Popup Dialog for missing contact */}
      {showPopup && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in font-alinur">
          <div className="bg-white border-2 border-red-500/30 rounded-2xl p-6 max-w-sm w-full shadow-2xl space-y-4 text-center">
            <div className="bg-red-50 text-red-500 w-12 h-12 rounded-full flex items-center justify-center mx-auto border border-red-200">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 animate-bounce">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m0-10.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.75c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.75h-.152c-3.196 0-6.1-1.249-8.25-3.286zm0 13.036h.008v.008H12v-.008z" />
              </svg>
            </div>
            <div className="space-y-1.5">
              <h4 className="text-base font-extrabold text-red-600">কন্টাক্ট ইনফরমেশন</h4>
              <p className="text-sm font-bold text-gray-750">কন্টাক্ট আপলোড দেওয়া নেই</p>
            </div>
            <button
              onClick={() => setShowPopup(false)}
              className="bg-emerald-800 hover:bg-emerald-950 text-white font-extrabold text-xs py-2 px-6 rounded-full transition-colors cursor-pointer shadow-xs"
            >
              বন্ধ করুন
            </button>
          </div>
        </div>
      )}

      {/* Dynamic Back Navigation Header */}
      <div className="mb-6 sm:mb-8 flex items-center justify-between border-b border-emerald-100 pb-4">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-extrabold text-xs sm:text-sm border border-emerald-200 transition-all shadow-xs cursor-pointer group"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
          <span>পূর্ববর্তী পেজে ফিরুন</span>
        </button>
        <span className="text-xs font-bold text-emerald-600 bg-emerald-50/50 px-3 py-1 rounded-full border border-emerald-100/50">
          সদস্য পরিচিতি কার্ড
        </span>
      </div>

      {/* Main Grid Card */}
      <div className="bg-white rounded-3xl border border-emerald-100/80 shadow-xl overflow-hidden">
        {/* Ribbon banner */}
        <div className="bg-gradient-to-r from-emerald-800 via-emerald-900 to-amber-700 p-4 sm:p-6 text-center border-b-4 border-amber-500 relative">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(#ffffff08_1px,transparent_1px)] bg-[size:16px_16px] opacity-30"></div>
          <span className="relative inline-block text-amber-400 bg-amber-950/40 backdrop-blur-xs px-6 py-1.5 rounded-full text-xs sm:text-sm font-extrabold border border-amber-400/30 tracking-wide uppercase">
            {member.role || "সম্মানিত সদস্য"}
          </span>
          <h1 className="relative text-xl sm:text-3xl font-black text-white mt-2 font-alinur truncate whitespace-nowrap max-w-full" title={member.name}>
            {member.name}
          </h1>
          <p className="relative text-[10px] sm:text-xs text-emerald-200 font-medium tracking-wide mt-1 font-mono">
            SUFIA NOORIA DAKHIL MADRASAH GOVERNING BODY
          </p>
        </div>

        <div className="p-6 sm:p-10">
          <div className="grid md:grid-cols-12 gap-8 items-start">
            {/* Left Column: Big Image & Social Accounts */}
            <div className="md:col-span-5 flex flex-col items-center space-y-6">
              <div className="relative w-full max-w-[280px] aspect-square rounded-2xl border-4 border-emerald-800 shadow-xl overflow-hidden bg-emerald-50/20 group">
                <img
                  src={member.imageUrl || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=300&q=80"}
                  alt={member.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              </div>

              {/* 3 Action Contact Icons */}
              <div className="flex items-center justify-center gap-4 bg-emerald-50/50 px-5 py-3.5 rounded-2xl border border-emerald-100/50 w-full max-w-[280px]">
                {/* Facebook Contact */}
                {member.facebookUrl ? (
                  <a
                    href={member.facebookUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2.5 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white rounded-xl transition-all hover:scale-110 shadow-xs border border-blue-200/50"
                    title="Facebook Profile"
                  >
                    <Facebook className="h-5 w-5" />
                  </a>
                ) : (
                  <button
                    onClick={() => setShowPopup(true)}
                    className="p-2.5 bg-red-50 text-red-500 hover:bg-red-100 rounded-xl transition-all border border-red-200 shadow-xs cursor-pointer"
                    title="Facebook (কন্টাক্ট আপলোড দেওয়া নেই)"
                  >
                    <Facebook className="h-5 w-5" />
                  </button>
                )}

                {/* WhatsApp Contact */}
                {member.whatsAppNum ? (
                  <a
                    href={formatWhatsAppLink(member.whatsAppNum)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white rounded-xl transition-all hover:scale-110 shadow-xs border border-emerald-200/50"
                    title="WhatsApp Chat"
                  >
                    <MessageCircle className="h-5 w-5" />
                  </a>
                ) : (
                  <button
                    onClick={() => setShowPopup(true)}
                    className="p-2.5 bg-red-50 text-red-500 hover:bg-red-100 rounded-xl transition-all border border-red-200 shadow-xs cursor-pointer"
                    title="WhatsApp (কন্টাক্ট আপলোড দেওয়া নেই)"
                  >
                    <MessageCircle className="h-5 w-5" />
                  </button>
                )}

                {/* Phone Contact */}
                {member.phoneNum ? (
                  <a
                    href={`tel:${member.phoneNum}`}
                    className="p-2.5 bg-amber-50 text-amber-700 hover:bg-amber-600 hover:text-white rounded-xl transition-all hover:scale-110 shadow-xs border border-amber-200/50"
                    title="Phone Call"
                  >
                    <Phone className="h-5 w-5" />
                  </a>
                ) : (
                  <button
                    onClick={() => setShowPopup(true)}
                    className="p-2.5 bg-red-50 text-red-500 hover:bg-red-100 rounded-xl transition-all border border-red-200 shadow-xs cursor-pointer"
                    title="Phone (কন্টাক্ট আপলোড দেওয়া নেই)"
                  >
                    <Phone className="h-5 w-5" />
                  </button>
                )}
              </div>
            </div>

            {/* Right Column: Bio-Data Table */}
            <div className="md:col-span-7 space-y-6">
              <div className="bg-emerald-50/20 rounded-2xl border border-emerald-100 p-1.5 overflow-hidden">
                <table className="w-full text-left border-collapse text-xs sm:text-sm font-alinur">
                  <tbody>
                    {/* Joining Date */}
                    <tr className="border-b border-emerald-100/50 hover:bg-emerald-50/30 transition-colors">
                      <td className="p-3 font-extrabold text-emerald-950 flex items-center gap-2">
                        <Clock className="h-4 w-4 text-amber-600 shrink-0" />
                        <span>যোগদানের তারিখ</span>
                      </td>
                      <td className="p-3 text-gray-700 text-right font-medium">
                        {toEnglishDigits(member.joiningDate) || "উল্লেখ নেই"}
                      </td>
                    </tr>
                    {/* Birth Date */}
                    <tr className="border-b border-emerald-100/50 hover:bg-emerald-50/30 transition-colors">
                      <td className="p-3 font-extrabold text-emerald-950 flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-amber-600 shrink-0" />
                        <span>জন্ম তারিখ</span>
                      </td>
                      <td className="p-3 text-gray-700 text-right font-medium">
                        {toEnglishDigits(member.birthDate) || "উল্লেখ নেই"}
                      </td>
                    </tr>
                    {/* Blood Group */}
                    <tr className="border-b border-emerald-100/50 hover:bg-emerald-50/30 transition-colors">
                      <td className="p-3 font-extrabold text-emerald-950 flex items-center gap-2">
                        <Heart className="h-4 w-4 text-red-500 shrink-0" />
                        <span>রক্তের গ্রুপ</span>
                      </td>
                      <td className="p-3 text-gray-700 text-right font-extrabold text-red-600">
                        {toEnglishDigits(member.bloodGroup) || "উল্লেখ নেই"}
                      </td>
                    </tr>
                    {/* Educational Qualification */}
                    <tr className="border-b border-emerald-100/50 hover:bg-emerald-50/30 transition-colors">
                      <td className="p-3 font-extrabold text-emerald-950 flex items-center gap-2">
                        <GraduationCap className="h-4 w-4 text-amber-600 shrink-0" />
                        <span>শিক্ষাগত যোগ্যতা</span>
                      </td>
                      <td className="p-3 text-gray-700 text-right font-medium">
                        {member.qualification || "উল্লেখ নেই"}
                      </td>
                    </tr>
                    {/* Phone Number */}
                    <tr className="border-b border-emerald-100/50 hover:bg-emerald-50/30 transition-colors">
                      <td className="p-3 font-extrabold text-emerald-950 flex items-center gap-2">
                        <Phone className="h-4 w-4 text-amber-600 shrink-0" />
                        <span>মোবাইল নম্বর</span>
                      </td>
                      <td className="p-3 text-gray-700 text-right font-mono font-bold text-xs sm:text-sm">
                        {toEnglishDigits(member.phone || member.phoneNum) || "উল্লেখ নেই"}
                      </td>
                    </tr>
                    {/* Email Address */}
                    <tr className="border-b border-emerald-100/50 hover:bg-emerald-50/30 transition-colors">
                      <td className="p-3 font-extrabold text-emerald-950 flex items-center gap-2">
                        <Mail className="h-4 w-4 text-amber-600 shrink-0" />
                        <span>ইমেইল এড্রেস</span>
                      </td>
                      <td className="p-3 text-gray-700 text-right font-mono text-xs sm:text-sm truncate max-w-[200px]">
                        {member.email || "উল্লেখ নেই"}
                      </td>
                    </tr>
                    {/* Address (Present/Permanent) */}
                    <tr className="hover:bg-emerald-50/30 transition-colors">
                      <td className="p-3 font-extrabold text-emerald-950 flex items-start gap-2 pt-4">
                        <MapPin className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                        <span>বর্তমান ও স্থায়ী ঠিকানা</span>
                      </td>
                      <td className="p-3 text-gray-700 text-justify font-medium leading-relaxed max-w-[220px]">
                        {member.address || "লালদীঘি সংলগ্ন, সুজানগর উপজেলা, পাবনা, বাংলাদেশ।"}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Speech Section / Message Board */}
          <div className="mt-10 pt-8 border-t border-gray-100 space-y-4">
            <h3 className="font-extrabold text-lg sm:text-xl text-emerald-900 border-b-2 border-emerald-50 pb-2 flex items-center gap-2">
              <Award className="h-5 w-5 text-amber-500" />
              <span>দিকনির্দেশনামূলক বাণী ও মূল্যবান বক্তব্য</span>
            </h3>
            <div className="bg-gradient-to-br from-emerald-50/20 to-amber-50/10 border border-emerald-100/50 rounded-2xl p-6 relative">
              <span className="absolute top-3 left-4 text-emerald-200/50 text-6xl font-serif pointer-events-none select-none">
                “
              </span>
              <p className="text-sm sm:text-base text-slate-700 leading-relaxed font-medium text-justify whitespace-pre-line z-10 relative font-alinur indent-6">
                {member.speech || "সুফিয়া নূূরিয়া দাখিল মাদ্রাসার উত্তরোত্তর সার্বিক কল্যাণ ও দ্বীনি শিক্ষার প্রসার আমাদের লক্ষ্য। মাদ্রাসার সুষ্ঠু ও সুন্দর শিক্ষাবান্ধব পরিবেশ বজায় রাখতে এবং শিক্ষার্থীদের যোগ্য আদর্শ নাগরিক হিসেবে গড়ে তুলতে আমাদের প্রচেষ্টা সর্বদা অব্যাহত থাকবে। ইনশাআল্লাহ।"}
              </p>
              <div className="absolute bottom-3 right-4 text-emerald-200/50 text-6xl font-serif pointer-events-none select-none">
                ”
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
