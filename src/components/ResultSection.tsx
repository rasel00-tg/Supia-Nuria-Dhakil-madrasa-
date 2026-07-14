import React, { useState, useEffect, useRef } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "../lib/firebase";
import { Result } from "../types";
import { Search, Printer, AlertTriangle, Book, User, Award, ShieldAlert } from "lucide-react";

export default function ResultSection() {
  const [studentId, setStudentId] = useState("");
  const [examType, setExamType] = useState("");
  const [departmentSelect, setDepartmentSelect] = useState("");
  const [classSelect, setClassSelect] = useState("");
  const [examYear, setExamYear] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState("");
  const unsubRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    return () => {
      if (unsubRef.current) {
        unsubRef.current();
      }
    };
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentId || !examType || !departmentSelect || !classSelect || !examYear) {
      setError("অনুগ্রহ করে সকল তথ্য সঠিকভাবে পূরণ করুন।");
      return;
    }

    if (unsubRef.current) {
      unsubRef.current();
    }

    setLoading(true);
    setResult(null);
    setSearched(true);
    setError("");

    // Setup a small loading delay for a realistic search experience
    setTimeout(() => {
      const cleanId = studentId.trim();

      // Check for hardcoded demo records for 1000 and 1001
      if (cleanId === "1001") {
        setResult({
          id: "demo_1001",
          studentId: "1001",
          studentName: "মোহাম্মদ মিনহাজুল ইসলাম",
          examType: examType,
          department: departmentSelect,
          branch: classSelect,
          year: examYear,
          gpa: "4.75",
          grade: "A",
          subjects: [
            { name: "কুরআন মাজীদ ও তাজবীদ", marks: 85, grade: "A+" },
            { name: "হাদীস শরীফ", marks: 78, grade: "A" },
            { name: "আরবী প্রথম পত্র", marks: 82, grade: "A+" },
            { name: "আরবী দ্বিতীয় পত্র", marks: 74, grade: "A-" },
            { name: "আকাইদ ও ফিকহ", marks: 88, grade: "A+" },
            { name: "গণিত", marks: 90, grade: "A+" },
            { name: "ইংরেজি", marks: 65, grade: "B" },
            { name: "বাংলা", marks: 72, grade: "A-" }
          ]
        } as any);
        setLoading(false);
        setError("");
        return;
      }

      if (cleanId === "1000") {
        setResult({
          id: "demo_1000",
          studentId: "1000",
          studentName: "উম্মে হাবিবা আক্তার",
          examType: examType,
          department: departmentSelect,
          branch: classSelect,
          year: examYear,
          gpa: "5.00",
          grade: "A+",
          subjects: [
            { name: "কুরআন মাজীদ ও তাজবীদ", marks: 92, grade: "A+" },
            { name: "ইলমে তাজবীদ ও ক্বিরাআত", marks: 95, grade: "A+" },
            { name: "হাদীস শরীফ", marks: 80, grade: "A+" },
            { name: "আরবী প্রথম পত্র", marks: 85, grade: "A+" },
            { name: "আরবী দ্বিতীয় পত্র", marks: 78, grade: "A" },
            { name: "আকাইদ ও ফিকহ", marks: 84, grade: "A+" },
            { name: "গণিত", marks: 76, grade: "A" },
            { name: "বাংলা", marks: 81, grade: "A+" }
          ]
        } as any);
        setLoading(false);
        setError("");
        return;
      }

      // Query real DB otherwise
      const q = query(
        collection(db, "results"),
        where("studentId", "==", cleanId),
        where("examType", "==", examType),
        where("department", "==", departmentSelect),
        where("branch", "==", classSelect),
        where("year", "==", examYear)
      );

      unsubRef.current = onSnapshot(q, (querySnapshot) => {
        setLoading(false);
        if (!querySnapshot.empty) {
          const doc = querySnapshot.docs[0];
          setResult({ id: doc.id, ...doc.data() } as Result);
          setError("");
        } else {
          setResult(null);
          setError("দুঃখিত, আপনার দেওয়া তথ্যের সাথে কোনো ফলাফল পাওয়া যায়নি। অনুগ্রহ করে টেস্ট রোল ১০০০ বা ১০০১ টাইপ করে ট্রাই করুন।");
        }
      }, (err) => {
        console.error("Error searching result:", err);
        setError("ফলাফল খুঁজতে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।");
        setLoading(false);
      });
    }, 450);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div id="result-section" className="space-y-8 py-6 w-full px-2">
      <div className="text-center w-full space-y-2 print:hidden">
        <h2 className="text-2xl sm:text-3xl font-bold text-emerald-900 font-serif">
          ফলাফল অনুসন্ধান
        </h2>
        <p className="text-sm text-gray-500">
          দাখিল ও অভ্যন্তরীণ বার্ষিক পরীক্ষার ফলাফল ও নম্বরপত্র খোঁজার পোর্টাল
        </p>
        <div className="h-1.5 w-24 bg-amber-500 mx-auto rounded-full mt-3"></div>
      </div>

      {/* Result Search Form Card */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-6 sm:p-8 w-full print:hidden">
        <form onSubmit={handleSearch} className="space-y-5">
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="space-y-1">
              <label htmlFor="search-studentId" className="text-xs font-bold text-emerald-950 font-sans flex items-center gap-1">
                <span>স্টুডেন্ট আইডি (যেমন: 1001)</span>
              </label>
              <input
                id="search-studentId"
                type="text"
                required
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                placeholder="আইডি দিন (১০০০ বা ১০০১)"
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all font-sans text-emerald-950"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="search-exam-type" className="text-xs font-bold text-emerald-950 font-sans">পরীক্ষার ধরণ</label>
              <select
                id="search-exam-type"
                required
                value={examType}
                onChange={(e) => setExamType(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all font-sans text-emerald-950 bg-white"
              >
                <option value="">নির্বাচন করুন</option>
                <option value="বার্ষিক পরীক্ষা">বার্ষিক পরীক্ষা</option>
                <option value="অর্ধবার্ষিক পরীক্ষা">অর্ধবার্ষিক পরীক্ষা</option>
                <option value="দাখিল টেস্ট পরীক্ষা">দাখিল টেস্ট পরীক্ষা</option>
              </select>
            </div>

            <div className="space-y-1">
              <label htmlFor="search-department" className="text-xs font-bold text-emerald-950 font-sans">বিভাগ / শাখা</label>
              <select
                id="search-department"
                required
                value={departmentSelect}
                onChange={(e) => setDepartmentSelect(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all font-sans text-emerald-950 bg-white"
              >
                <option value="">নির্বাচন করুন</option>
                <option value="ইবতেদায়ী">ইবতেদায়ী</option>
                <option value="নূরানী">নূরানী</option>
                <option value="দাখিল সাধারণ">দাখিল সাধারণ</option>
                <option value="দাখিল মুজাব্বিদ">দাখিল মুজাব্বিদ</option>
              </select>
            </div>

            <div className="space-y-1">
              <label htmlFor="search-class" className="text-xs font-bold text-emerald-950 font-sans">শ্রেণী</label>
              <select
                id="search-class"
                required
                value={classSelect}
                onChange={(e) => setClassSelect(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all font-sans text-emerald-950 bg-white"
              >
                <option value="">নির্বাচন করুন</option>
                <option value="প্লে গ্রুপ">প্লে গ্রুপ</option>
                <option value="নার্সারি">নার্সারি</option>
                <option value="১ম শ্রেণী">১ম শ্রেণী</option>
                <option value="২য় শ্রেণী">২য় শ্রেণী</option>
                <option value="৩য় শ্রেণী">৩য় শ্রেণী</option>
                <option value="৪র্থ শ্রেণী">৪র্থ শ্রেণী</option>
                <option value="৫ম শ্রেণী">৫ম শ্রেণী</option>
                <option value="৬ষ্ঠ শ্রেণী">৬ষ্ঠ শ্রেণী</option>
                <option value="৭ম শ্রেণী">৭ম শ্রেণী</option>
                <option value="৮ম শ্রেণী">৮ম শ্রেণী</option>
                <option value="৯ম শ্রেণী">৯ম শ্রেণী</option>
                <option value="১০ম শ্রেণী">১০ম শ্রেণী</option>
              </select>
            </div>

            <div className="space-y-1">
              <label htmlFor="search-year" className="text-xs font-bold text-emerald-950 font-sans">সেশন বছর</label>
              <select
                id="search-year"
                required
                value={examYear}
                onChange={(e) => setExamYear(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all font-sans text-emerald-950 bg-white"
              >
                <option value="">নির্বাচন করুন</option>
                <option value="২০২৪">২০২৪</option>
                <option value="২০২৫">২০২৫</option>
                <option value="২০২৬">২০২৬</option>
              </select>
            </div>
          </div>

          <button
            id="result-search-submit"
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-800 hover:bg-emerald-950 text-amber-400 hover:text-amber-300 font-bold py-3 px-4 rounded-full shadow-md transition-all duration-150 flex items-center justify-center space-x-2 text-sm disabled:bg-emerald-700 disabled:cursor-not-allowed cursor-pointer"
          >
            {loading ? (
              <span>অনুসন্ধান করা হচ্ছে...</span>
            ) : (
              <>
                <Search className="h-4 w-4" />
                <span>ফলাফল অনুসন্ধান করুন</span>
              </>
            )}
          </button>
        </form>

        <div className="mt-4 p-3.5 bg-emerald-50 rounded-lg border border-emerald-100 text-xs text-emerald-900 flex items-start space-x-2 font-sans leading-relaxed">
          <AlertTriangle className="h-4.5 w-4.5 text-amber-600 mt-0.5 flex-shrink-0" />
          <div>
            <span className="font-bold text-emerald-950 block mb-1">পরীক্ষামূলক অনুসন্ধানের নির্দেশাবলী:</span>
            <span>১. আইডি (<b>1001</b>), ধরণ (<b>বার্ষিক পরীক্ষা</b>), বিভাগ (<b>দাখিল সাধারণ</b>), শ্রেণী (<b>১০ম শ্রেণী</b>), বছর (<b>২০২৬</b>) লিখে সার্চ করুন।</span>
            <br />
            <span>২. আইডি (<b>1000</b>), ধরণ (<b>বার্ষিক পরীক্ষা</b>), বিভাগ (<b>দাখিল মুজাব্বিদ</b>), শ্রেণী (<b>৯ম শ্রেণী</b>), বছর (<b>২০২৫</b>) লিখে সার্চ করুন।</span>
          </div>
        </div>
      </div>

      {/* Error / Not Found Alert */}
      {searched && error && (
        <div id="result-error-alert" className="p-5 bg-red-50 border border-red-200 text-red-800 rounded-2xl w-full flex items-start space-x-3 shadow-sm print:hidden animate-fade-in">
          <ShieldAlert className="h-5 w-5 text-red-700 mt-0.5 flex-shrink-0" />
          <div className="text-sm font-medium">{error}</div>
        </div>
      )}

      {/* Result Card (Academic Marksheet) */}
      {result && (
        <div
          id="academic-marksheet"
          className="bg-white border-4 border-double border-emerald-800 rounded-2xl p-6 sm:p-10 shadow-2xl relative overflow-hidden print:shadow-none print:border-emerald-800 animate-fade-in"
        >
          {/* Watermark Mock */}
          <div className="absolute inset-0 bg-emerald-50/5 flex items-center justify-center pointer-events-none select-none z-0">
            <Book className="h-96 w-96 text-emerald-900/5 rotate-12" />
          </div>

          <div className="relative z-10 space-y-8">
            {/* Header */}
            <div className="text-center space-y-2 border-b-2 border-emerald-800 pb-5">
              <h1 className="text-2xl sm:text-3xl font-bold text-emerald-900 font-serif tracking-tight">
                সুফিয়া নূরিয়া দাখিল মাদ্রাসা
              </h1>
              <p className="text-xs sm:text-sm text-gray-600 font-sans font-semibold">
                নিউ পল্লান পাড়া, টেকনাফ পৌরসভা, টেকনাফ, কক্সবাজার।
              </p>
              <h2 className="text-base sm:text-lg font-bold bg-emerald-50 text-emerald-950 inline-block px-5 py-1 rounded-full border border-emerald-800 font-serif mt-2">
                অফিসিয়াল একাডেমিক নম্বরপত্র ও গ্রেডশিট ({result.examType})
              </h2>
            </div>

            {/* Student Info Grid */}
            <div className="grid sm:grid-cols-2 gap-4 bg-emerald-50/40 p-4 sm:p-6 rounded-xl border border-emerald-100/60 text-sm">
              <div className="space-y-2">
                <div className="flex">
                  <span className="w-28 font-bold text-emerald-950 flex-shrink-0">শিক্ষার্থীর নাম:</span>
                  <span className="text-gray-800 flex items-center"><User className="h-4 w-4 text-emerald-800 mr-1.5 flex-shrink-0 print:hidden" /> {result.studentName}</span>
                </div>
                <div className="flex">
                  <span className="w-28 font-bold text-emerald-950 flex-shrink-0">বিভাগ/শাখা:</span>
                  <span className="text-gray-800 font-bold">{result.department}</span>
                </div>
                <div className="flex">
                  <span className="w-28 font-bold text-emerald-950 flex-shrink-0">শ্রেণী:</span>
                  <span className="text-gray-800 font-bold">{result.branch}</span>
                </div>
              </div>

              <div className="space-y-2 sm:border-l sm:border-emerald-100 sm:pl-6">
                <div className="flex">
                  <span className="w-28 font-bold text-emerald-950 flex-shrink-0">স্টুডেন্ট আইডি:</span>
                  <span className="text-gray-800 font-sans font-bold">{result.studentId}</span>
                </div>
                <div className="flex">
                  <span className="w-28 font-bold text-emerald-950 flex-shrink-0">সেশন বছর:</span>
                  <span className="text-gray-800 font-sans font-medium">{result.year}</span>
                </div>
                <div className="flex items-center">
                  <span className="w-28 font-bold text-emerald-950 flex-shrink-0">ফলাফল (GPA):</span>
                  <span className="text-emerald-900 font-sans font-extrabold text-lg flex items-center">
                    <Award className="h-4.5 w-4.5 text-amber-500 mr-1 flex-shrink-0 print:hidden" />
                    {result.gpa} ({result.grade})
                  </span>
                </div>
              </div>
            </div>

            {/* Subject-wise Marks Table */}
            <div className="overflow-hidden border border-gray-200 rounded-xl shadow-sm">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-emerald-800 text-amber-400 font-bold">
                    <th className="p-3 text-center w-16">ক্রমিক</th>
                    <th className="p-3">বিষয়ের নাম (Subject Name)</th>
                    <th className="p-3 text-center w-28">প্রাপ্ত নম্বর</th>
                    <th className="p-3 text-center w-28">অর্জিত গ্রেড</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {result.subjects.map((sub, idx) => (
                    <tr key={idx} className="hover:bg-gray-50/50 odd:bg-gray-50/20">
                      <td className="p-3 text-center text-gray-500 font-sans font-bold">{idx + 1}</td>
                      <td className="p-3 font-medium text-emerald-950 font-sans">{sub.name}</td>
                      <td className="p-3 text-center font-sans font-medium">{sub.marks}</td>
                      <td className="p-3 text-center font-sans font-bold text-emerald-850">{sub.grade}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Note and Signatures */}
            <div className="grid sm:grid-cols-2 gap-8 pt-10 text-xs">
              <div className="text-gray-500 leading-relaxed font-sans text-justify">
                * বি.দ্র.: এই মার্কশিটটি সুফিয়া নূরিয়া দাখিল মাদ্রাসার মূল রেকর্ড অনুযায়ী প্রকাশিত। কোনো ধরনের অসঙ্গতি পরিলক্ষিত হলে তা মাদ্রাসার পরীক্ষা কমিটির সাথে যোগাযোগ করে সংশোধন করার জন্য অনুরোধ করা হলো।
              </div>
              <div className="flex flex-col items-center justify-end">
                <div className="w-48 border-t border-emerald-800 pt-1 text-center font-bold text-emerald-950 font-sans">
                  পরীক্ষা নিয়ন্ত্রকের স্বাক্ষর
                </div>
              </div>
            </div>

            {/* Print Action for user convenience */}
            <div className="text-center pt-4 print:hidden">
              <button
                id="result-print-btn"
                onClick={handlePrint}
                className="inline-flex items-center space-x-2 bg-emerald-800 hover:bg-emerald-950 text-white font-bold py-2.5 px-6 rounded-lg text-sm shadow-md transition-all cursor-pointer"
              >
                <Printer className="h-4 w-4" />
                <span>মার্কশিট প্রিন্ট করুন</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
