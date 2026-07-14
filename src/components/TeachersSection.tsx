import { useEffect, useState } from "react";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "../lib/firebase";
import { Teacher } from "../types";
import { Phone, Mail, GraduationCap } from "lucide-react";

export default function TeachersSection() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Sort teachers: Super (principal) first, then Vice Super, then others
    const q = query(collection(db, "teachers"), orderBy("uid", "asc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const teacherList: Teacher[] = [];
      snapshot.forEach((doc) => {
        teacherList.push({ id: doc.id, ...doc.data() } as Teacher);
      });
      setTeachers(teacherList);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, "teachers");
    });

    return () => unsubscribe();
  }, []);

  return (
    <div id="teachers-section" className="space-y-8 py-6 w-full px-2">
      <div className="text-center w-full space-y-2">
        <h2 className="text-2xl sm:text-3xl font-bold text-emerald-900 font-serif">
          আমাদের শ্রদ্ধেয় শিক্ষক শিক্ষিকাবৃন্দ
        </h2>
        <p className="text-sm text-gray-500">
          অভিজ্ঞ ও আন্তরিক আলেম এবং আধুনিক বিষয়ের শিক্ষকমণ্ডলীর পরিচিতি
        </p>
        <div className="h-1.5 w-24 bg-amber-500 mx-auto rounded-full mt-3"></div>
      </div>

      {loading ? (
        <div className="py-12 text-center text-gray-400 font-sans">
          শিক্ষকদের তালিকা লোড হচ্ছে...
        </div>
      ) : teachers.length === 0 ? (
        <div className="py-12 text-center text-gray-500 font-sans bg-gray-50 rounded-2xl border border-dashed border-gray-200">
          কোনো শিক্ষকের তথ্য পাওয়া যায়নি।
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-8">
          {teachers.map((teacher) => (
            <div
              key={teacher.id}
              className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden flex flex-col justify-between group hover:shadow-md transition-all duration-300 transform hover:-translate-y-0.5"
            >
              <div>
                <div className="relative h-64 bg-emerald-50 overflow-hidden">
                  <img
                    src={teacher.photoUrl || "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80"}
                    alt={teacher.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/80 via-transparent to-transparent opacity-60"></div>
                </div>

                <div className="p-6 space-y-3">
                  <div>
                    <h3 className="font-bold text-lg text-emerald-900 font-serif group-hover:text-emerald-700 transition-colors">
                      {teacher.name}
                    </h3>
                    <p className="text-xs font-bold text-amber-700 bg-amber-50 inline-block px-2.5 py-0.5 rounded-full border border-amber-200 mt-1">
                      {teacher.designation}
                    </p>
                  </div>

                  <div className="space-y-2 pt-2 text-sm text-gray-600 border-t border-gray-50">
                    <div className="flex items-center space-x-2.5">
                      <Phone className="h-4 w-4 text-emerald-700 flex-shrink-0" />
                      <span className="font-sans">{teacher.phone}</span>
                    </div>
                    {teacher.email && (
                      <div className="flex items-center space-x-2.5 overflow-hidden">
                        <Mail className="h-4 w-4 text-emerald-700 flex-shrink-0" />
                        <span className="font-sans text-xs truncate" title={teacher.email}>
                          {teacher.email}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="px-6 py-4 bg-emerald-50/50 border-t border-gray-50 flex items-center justify-between text-xs font-bold text-emerald-800">
                <span className="flex items-center space-x-1">
                  <GraduationCap className="h-4 w-4 text-emerald-700 mr-1" />
                  <span>SNDM ফ্যাকাল্টি</span>
                </span>
                <span className="text-emerald-700">অনলাইন পরিচিতি</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
