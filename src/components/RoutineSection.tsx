import { useEffect, useState } from "react";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "../lib/firebase";
import { Routine } from "../types";
import { Printer, Calendar, Clock, MapPin, Download, BookOpen, GraduationCap } from "lucide-react";

export default function RoutineSection() {
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [activeType, setActiveType] = useState<"class" | "exam">("class");
  const [selectedClass, setSelectedClass] = useState<string>("All");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "routines"), (snapshot) => {
      const routineList: Routine[] = [];
      snapshot.forEach((doc) => {
        routineList.push({ id: doc.id, ...doc.data() } as Routine);
      });
      setRoutines(routineList);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, "routines");
    });

    return () => unsubscribe();
  }, []);

  // Filter routines based on active type and class name
  const filteredRoutines = routines.filter((r) => {
    const typeMatch = r.type === activeType;
    const classMatch = selectedClass === "All" || r.className === selectedClass;
    return typeMatch && classMatch;
  });

  // Extract unique class names for filters
  const classes = ["All", ...Array.from(new Set(routines.filter(r => r.type === activeType).map(r => r.className)))];

  // Print Routine function
  const handlePrint = () => {
    window.print();
  };

  // Download Routine as Text File
  const handleDownloadText = () => {
    let content = `সুফিয়া নূরিয়া দাখিল মাদ্রাসা - ${activeType === "class" ? "ক্লাস" : "পরীক্ষা"} রুটিন\n`;
    content += `শ্রেণী/পরীক্ষা: ${selectedClass === "All" ? "সকল শ্রেণী" : selectedClass}\n`;
    content += `তারিখ: ${new Date().toLocaleDateString("bn-BD")}\n`;
    content += `=========================================\n\n`;

    filteredRoutines.forEach((r, idx) => {
      content += `${idx + 1}. বিষয়: ${r.subject}\n`;
      content += `   শ্রেণী: ${r.className}\n`;
      content += `   সময়: ${r.time}\n`;
      content += `   দিন/তারিখ: ${r.dayOrDate}\n`;
      content += `   কক্ষ নম্বর: ${r.room}\n`;
      content += `   শিক্ষক: ${r.teacherName}\n`;
      content += `-----------------------------------------\n`;
    });

    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `SNDM_Routine_${activeType}_${selectedClass}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div id="routine-section" className="space-y-8 py-6 w-full px-2">
      <div className="text-center w-full space-y-2 print:hidden">
        <h2 className="text-2xl sm:text-3xl font-bold text-emerald-900 font-serif">
          ক্লাস ও পরীক্ষা রুটিন
        </h2>
        <p className="text-sm text-gray-500">
          রুটিন ডাউনলোড অথবা সরাসরি প্রিন্ট করার আধুনিক সুবিধা
        </p>
        <div className="h-1.5 w-24 bg-amber-500 mx-auto rounded-full mt-3"></div>
      </div>

      {/* Routine Type Selector & Action Buttons */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-emerald-50 p-4 rounded-xl border border-emerald-100/60 print:hidden">
        <div className="flex bg-white p-1 rounded-xl shadow-sm border border-emerald-100">
          <button
            id="routine-type-class"
            onClick={() => {
              setActiveType("class");
              setSelectedClass("All");
            }}
            className={`px-5 py-2 rounded-lg text-sm font-bold transition-all ${
              activeType === "class"
                ? "bg-emerald-800 text-white shadow-sm"
                : "text-emerald-800 hover:bg-emerald-50"
            }`}
          >
            ক্লাস রুটিন
          </button>
          <button
            id="routine-type-exam"
            onClick={() => {
              setActiveType("exam");
              setSelectedClass("All");
            }}
            className={`px-5 py-2 rounded-lg text-sm font-bold transition-all ${
              activeType === "exam"
                ? "bg-emerald-800 text-white shadow-sm"
                : "text-emerald-800 hover:bg-emerald-50"
            }`}
          >
            পরীক্ষা রুটিন
          </button>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Class Filter */}
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-emerald-950 font-sans">শ্রেণী:</span>
            <select
              id="routine-class-filter"
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="bg-white border border-gray-300 rounded-lg text-xs font-sans px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 text-emerald-950"
            >
              {classes.map((cls) => (
                <option key={cls} value={cls}>
                  {cls === "All" ? "সকল শ্রেণী" : cls}
                </option>
              ))}
            </select>
          </div>

          <button
            id="routine-print-btn"
            onClick={handlePrint}
            className="flex items-center space-x-1.5 bg-white border border-emerald-200 text-emerald-800 hover:bg-emerald-50 font-bold py-2 px-3.5 rounded-lg text-xs shadow-sm transition-all"
          >
            <Printer className="h-4 w-4" />
            <span>প্রিন্ট করুন</span>
          </button>

          <button
            id="routine-download-btn"
            onClick={handleDownloadText}
            className="flex items-center space-x-1.5 bg-emerald-800 hover:bg-emerald-950 text-amber-400 font-bold py-2 px-3.5 rounded-lg text-xs shadow-sm transition-all"
          >
            <Download className="h-4 w-4" />
            <span>ডাউনলোড করুন</span>
          </button>
        </div>
      </div>

      {/* Routine Display Title for Print only */}
      <div className="hidden print:block text-center space-y-2 border-b-2 border-emerald-800 pb-4 mb-6">
        <h1 className="text-2xl font-bold text-emerald-950">সুফিয়া নূরিয়া দাখিল মাদ্রাসা</h1>
        <p className="text-sm text-gray-600">লালদীঘি সংলগ্ন, মাদ্রাসা রোড, সুজানগর, পাবনা।</p>
        <h2 className="text-lg font-bold bg-emerald-50 inline-block px-4 py-1.5 rounded-lg border border-emerald-800 text-emerald-900">
          {activeType === "class" ? "দৈনিক ক্লাস রুটিন" : "পরীক্ষা সময়সূচী ও রুটিন"} (শ্রেণী: {selectedClass === "All" ? "সকল" : selectedClass})
        </h2>
      </div>

      {loading ? (
        <div className="py-12 text-center text-gray-400 font-sans">
          রুটিন লোড হচ্ছে...
        </div>
      ) : filteredRoutines.length === 0 ? (
        <div className="py-12 text-center text-gray-500 font-sans bg-gray-50 rounded-2xl border border-dashed border-gray-200 print:border-none">
          কোনো রুটিন পাওয়া যায়নি।
        </div>
      ) : (
        /* Routine Table/Cards Layout */
        <div className="overflow-hidden bg-white border border-slate-200/80 rounded-xl shadow-sm print:shadow-none print:border-none">
          <div className="overflow-x-auto">
            <table id="routine-data-table" className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-emerald-800 text-amber-400 border-b border-emerald-900 print:bg-gray-100 print:text-black">
                  <th className="p-4 text-xs font-bold uppercase tracking-wider font-sans text-center">ক্রমিক</th>
                  <th className="p-4 text-xs font-bold uppercase tracking-wider font-sans">বিষয়</th>
                  <th className="p-4 text-xs font-bold uppercase tracking-wider font-sans">শ্রেণী</th>
                  <th className="p-4 text-xs font-bold uppercase tracking-wider font-sans">সময় ও ঘণ্টা</th>
                  <th className="p-4 text-xs font-bold uppercase tracking-wider font-sans">দিন / তারিখ</th>
                  <th className="p-4 text-xs font-bold uppercase tracking-wider font-sans text-center">কক্ষ নং</th>
                  <th className="p-4 text-xs font-bold uppercase tracking-wider font-sans">দায়িত্বপ্রাপ্ত শিক্ষক</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredRoutines.map((routine, index) => (
                  <tr
                    key={routine.id}
                    className="hover:bg-emerald-50/20 transition-colors odd:bg-gray-50/40 print:hover:bg-transparent"
                  >
                    <td className="p-4 text-sm text-gray-500 font-sans text-center font-bold">
                      {index + 1}
                    </td>
                    <td className="p-4 text-sm font-bold text-emerald-950 font-sans flex items-center space-x-2">
                      <BookOpen className="h-4 w-4 text-emerald-700 mr-1 flex-shrink-0 print:hidden" />
                      <span>{routine.subject}</span>
                    </td>
                    <td className="p-4 text-sm text-gray-700 font-sans font-medium">
                      {routine.className}
                    </td>
                    <td className="p-4 text-sm text-gray-700 font-sans font-medium">
                      <div className="flex items-center space-x-1">
                        <Clock className="h-3.5 w-3.5 text-gray-400 mr-1 flex-shrink-0 print:hidden" />
                        <span>{routine.time}</span>
                      </div>
                    </td>
                    <td className="p-4 text-sm text-gray-700 font-sans font-bold">
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-3.5 w-3.5 text-gray-400 mr-1 flex-shrink-0 print:hidden" />
                        <span>{routine.dayOrDate}</span>
                      </div>
                    </td>
                    <td className="p-4 text-sm text-gray-700 font-sans text-center font-bold">
                      <div className="inline-flex items-center space-x-1 bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-md text-xs print:bg-transparent print:border-none print:text-black">
                        <MapPin className="h-3.5 w-3.5 mr-0.5 flex-shrink-0 print:hidden" />
                        <span>{routine.room}</span>
                      </div>
                    </td>
                    <td className="p-4 text-sm text-gray-700 font-sans flex items-center space-x-2">
                      <GraduationCap className="h-4 w-4 text-emerald-700 mr-1 flex-shrink-0 print:hidden" />
                      <span>{routine.teacherName}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
