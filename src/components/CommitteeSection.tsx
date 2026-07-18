import React from "react";
import { collection, query, orderBy } from "firebase/firestore";
import { db, StreamBuilder } from "../lib/firebase";
import { CommitteeMember } from "../types";
import { Users, Award, BookOpen, ArrowRight } from "lucide-react";

const committeeQuery = query(collection(db, "committee"), orderBy("rank", "asc"));

interface CommitteeSectionProps {
  onSelectMember?: (member: CommitteeMember) => void;
}

export default function CommitteeSection({ onSelectMember }: CommitteeSectionProps) {
  // Helper to determine if speech/bio is 6 lines or more
  const isSpeechLong = (speech?: string) => {
    if (!speech) return false;
    return speech.split("\n").length >= 6 || speech.length >= 220;
  };

  return (
    <div id="committee-section" className="space-y-12 py-8 w-full px-4 max-w-6xl mx-auto animate-fade-in font-alinur">
      {/* Title Header */}
      <div className="text-center w-full space-y-2 font-alinur">
        <h2 className="text-2xl sm:text-4xl font-black text-emerald-900 tracking-tight" style={{ fontFamily: "Ador Noirit, sans-serif" }}>
          মাদ্রাসা পরিচালনা কমিটির সদস্যবৃন্দ
        </h2>
        <p className="text-sm sm:text-base text-gray-500 font-medium" style={{ fontFamily: "Ador Noirit, sans-serif" }}>
          মাদ্রাসার সুষ্ঠু ও সুশৃঙ্খল পরিচালনায় নিয়োজিত পরিচালনা কমিটির সম্মানিত সদস্যবৃন্দ
        </p>
        <div className="h-1.5 w-24 bg-amber-500 mx-auto rounded-full mt-3"></div>
      </div>

      <StreamBuilder
        stream={committeeQuery}
        builder={(committeeData: any, loading: boolean, error: any) => {
          const committee = (committeeData || []) as CommitteeMember[];
          if (loading) {
            return (
              <div className="py-12 text-center text-gray-400 font-alinur">
                তথ্য লোড হচ্ছে...
              </div>
            );
          }

          if (error) {
            return (
              <div className="py-12 text-center text-red-500 font-alinur">
                তথ্য লোড করতে ত্রুটি ঘটেছে। অনুগ্রহ করে পরে আবার চেষ্টা করুন।
              </div>
            );
          }

          if (!committee || committee.length === 0) {
            return (
              <div className="py-12 text-center text-gray-500 font-alinur bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                বর্তমানে পরিচালনা পরিষদের কোনো তথ্য পাওয়া যায়নি।
              </div>
            );
          }

          const president = committee.find(m => m.role?.includes("সভাপতি") || m.rank === 1 || m.role?.toLowerCase().includes("president"));
          const superMember = committee.find(m => (m.role?.includes("সুপার") || m.rank === 2 || m.role?.toLowerCase().includes("super")) && m.id !== president?.id);
          const otherMembers = committee.filter(m => m.id !== president?.id && m.id !== superMember?.id).sort((a, b) => (a.rank || 0) - (b.rank || 0));

          return (
            <div className="space-y-12 w-full font-alinur">
              {/* President & Super Speeches Section */}
              <div className="grid md:grid-cols-2 gap-8 w-full max-w-5xl mx-auto">
                {/* President Card with Top Ribbon Banner */}
                {president && (
                  <div className="bg-white rounded-2xl border border-emerald-100/60 shadow-lg hover:shadow-xl transition-all duration-300 flex flex-col items-center overflow-hidden group">
                    {/* Ribbon Header banner */}
                    <div 
                      className="w-full bg-gradient-to-r from-amber-500 to-orange-600 p-3.5 text-center text-white font-extrabold text-sm sm:text-base border-b-4 border-amber-600 font-alinur"
                      style={{ fontFamily: "Ador Noirit, sans-serif" }}
                    >
                      {president.role}
                    </div>

                    <div className="p-6 sm:p-8 flex flex-col items-center text-center space-y-4 w-full flex-1">
                      {/* Centered Border Circle picture Frame */}
                      <div className="w-32 h-32 sm:w-36 sm:h-36 rounded-full border-4 border-amber-500 overflow-hidden shadow-md bg-white transition-transform duration-500 group-hover:scale-105 shrink-0">
                        <img
                          src={president.imageUrl}
                          alt={president.name}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                      </div>

                      <div className="space-y-1 w-full border-b border-gray-100 pb-3">
                        <h3 className="font-extrabold text-lg sm:text-xl text-emerald-950 font-alinur">{president.name}</h3>
                        <p className="text-xs text-emerald-600 font-semibold font-alinur">সভাপতি, সুফিয়া নূরীয়া দাখিল মাদ্রাসা</p>
                      </div>

                      <p className="text-xs sm:text-sm text-gray-600 leading-relaxed font-medium italic text-justify whitespace-pre-line flex-1 w-full">
                        {president.speech ? (president.speech.length > 180 ? president.speech.substring(0, 180) + "..." : president.speech) : "বাণী উপলব্ধ নয়।"}
                      </p>

                      {/* Dynamic Details Button */}
                      {isSpeechLong(president.speech) && onSelectMember && (
                        <button
                          onClick={() => onSelectMember(president)}
                          className="inline-flex items-center gap-1.5 px-4.5 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-emerald-950 font-extrabold text-xs rounded-full border border-amber-300 shadow-sm hover:shadow hover:scale-105 transition-all duration-200 cursor-pointer"
                        >
                          <span>বিস্তারিত</span>
                          <ArrowRight className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Super Card with Top Ribbon Banner */}
                {superMember && (
                  <div className="bg-white rounded-2xl border border-emerald-100/60 shadow-lg hover:shadow-xl transition-all duration-300 flex flex-col items-center overflow-hidden group">
                    {/* Ribbon Header banner */}
                    <div 
                      className="w-full bg-gradient-to-r from-emerald-800 to-emerald-950 p-3.5 text-center text-white font-extrabold text-sm sm:text-base border-b-4 border-amber-500 font-alinur"
                      style={{ fontFamily: "Ador Noirit, sans-serif" }}
                    >
                      {superMember.role}
                    </div>

                    <div className="p-6 sm:p-8 flex flex-col items-center text-center space-y-4 w-full flex-1">
                      {/* Centered Border Circle picture Frame */}
                      <div className="w-32 h-32 sm:w-36 sm:h-36 rounded-full border-4 border-emerald-800 overflow-hidden shadow-md bg-white transition-transform duration-500 group-hover:scale-105 shrink-0">
                        <img
                          src={superMember.imageUrl}
                          alt={superMember.name}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                      </div>

                      <div className="space-y-1 w-full border-b border-gray-100 pb-3">
                        <h3 className="font-extrabold text-lg sm:text-xl text-emerald-950 font-alinur">{superMember.name}</h3>
                        <p className="text-xs text-emerald-600 font-semibold font-alinur">সদস্য সচিব, সুফিয়া নূরীয়া দাখিল মাদ্রাসা</p>
                      </div>

                      <p className="text-xs sm:text-sm text-gray-600 leading-relaxed font-medium italic text-justify whitespace-pre-line flex-1 w-full">
                        {superMember.speech ? (superMember.speech.length > 180 ? superMember.speech.substring(0, 180) + "..." : superMember.speech) : "বাণী উপলব্ধ নয়।"}
                      </p>

                      {/* Dynamic Details Button */}
                      {isSpeechLong(superMember.speech) && onSelectMember && (
                        <button
                          onClick={() => onSelectMember(superMember)}
                          className="inline-flex items-center gap-1.5 px-4.5 py-2 bg-gradient-to-r from-emerald-800 to-emerald-900 text-white font-extrabold text-xs rounded-full border border-emerald-600 shadow-sm hover:shadow hover:scale-105 transition-all duration-200 cursor-pointer"
                        >
                          <span>বিস্তারিত</span>
                          <ArrowRight className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* All Other Committee Members Grid */}
              {otherMembers.length > 0 && (
                <div className="space-y-6 pt-6 max-w-5xl mx-auto w-full font-alinur">
                  <h3 className="text-center font-extrabold text-lg sm:text-2xl text-emerald-800 font-alinur tracking-tight border-b-2 border-emerald-50 pb-2 flex items-center justify-center gap-2">
                    <Users className="h-6 w-6 text-emerald-800" />
                    অন্যান্য সম্মানিত সদস্যবৃন্দ ({otherMembers.length} জন)
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6 w-full justify-center">
                    {otherMembers.map((member, idx) => (
                      <div
                        key={member.id}
                        className="bg-white rounded-2xl border border-gray-100 shadow-md hover:shadow-lg hover:border-emerald-100/80 transition-all duration-300 flex flex-col items-center overflow-hidden group"
                      >
                        {/* Colorful Top Ribbon Header banner */}
                        <div 
                          className={`w-full p-2.5 text-center text-white font-extrabold text-xs sm:text-sm border-b-2 font-alinur ${
                            idx % 2 === 0 
                              ? "bg-gradient-to-r from-emerald-700 to-emerald-900 border-amber-500" 
                              : "bg-gradient-to-r from-amber-600 to-orange-700 border-emerald-600"
                          }`}
                          style={{ fontFamily: "Ador Noirit, sans-serif" }}
                        >
                          {member.role || "সদস্য"}
                        </div>

                        <div className="p-4 flex flex-col items-center text-center space-y-3.5 w-full flex-1">
                          {/* Centered Border Circle picture Frame */}
                          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full border-2 border-emerald-600 overflow-hidden shadow-md bg-white transition-transform duration-500 group-hover:scale-105 shrink-0">
                            <img
                              src={member.imageUrl}
                              alt={member.name}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover"
                            />
                          </div>

                          <div className="w-full">
                            <h4 className="font-extrabold text-xs sm:text-sm text-emerald-950 leading-tight font-alinur">
                              {member.name}
                            </h4>
                          </div>

                          {/* Dynamic Details Button */}
                          {isSpeechLong(member.speech) && onSelectMember && (
                            <button
                              onClick={() => onSelectMember(member)}
                              className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 font-extrabold text-[10px] rounded-full transition-all duration-200 cursor-pointer"
                            >
                              <span>বিস্তারিত</span>
                              <ArrowRight className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        }}
      />
    </div>
  );
}
