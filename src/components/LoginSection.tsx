import React, { useState } from "react";
import { Lock, Mail, Eye, EyeOff, ShieldCheck, Info } from "lucide-react";

interface LoginSectionProps {
  onLoginSuccess: (user: { email: string; role: "student" | "teacher" | "admin"; name: string }) => void;
}

export default function LoginSection({ onLoginSuccess }: LoginSectionProps) {
  const [role, setRole] = useState<"student" | "teacher" | "admin">("student");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Simulated verification matching dbSeeder
    setTimeout(() => {
      const trimmedEmail = email.trim().toLowerCase();
      
      if (role === "admin" && trimmedEmail === "admin@madrasah.com" && password === "admin123") {
        onLoginSuccess({ email: "admin@madrasah.com", role: "admin", name: "প্রধান এডমিনিস্ট্রেটর" });
      } else if (role === "teacher" && trimmedEmail === "teacher@madrasah.com" && password === "teacher123") {
        onLoginSuccess({ email: "teacher@madrasah.com", role: "teacher", name: "হাফেজ মাওলানা আব্দুর রহমান" });
      } else if (role === "student" && trimmedEmail === "student@madrasah.com" && password === "student123") {
        onLoginSuccess({ email: "student@madrasah.com", role: "student", name: "মোহাম্মদ আলী" });
      } else {
        setError("দুঃখিত, আপনার দেওয়া ইমেইল অথবা পাসওয়ার্ডটি সঠিক নয়। অনুগ্রহ করে নিচের নির্দেশনা দেখুন।");
      }
      setLoading(false);
    }, 600);
  };

  const handleFillCredentials = (selectedRole: "student" | "teacher" | "admin") => {
    setRole(selectedRole);
    if (selectedRole === "admin") {
      setEmail("admin@madrasah.com");
      setPassword("admin123");
    } else if (selectedRole === "teacher") {
      setEmail("teacher@madrasah.com");
      setPassword("teacher123");
    } else {
      setEmail("student@madrasah.com");
      setPassword("student123");
    }
  };

  return (
    <div id="login-section" className="space-y-8 py-6 w-full px-2">
      <div className="text-center space-y-2">
        <h2 className="text-2xl sm:text-3xl font-bold text-emerald-900 font-serif">
          নিরাপদ লগইন পোর্টাল
        </h2>
        <p className="text-sm text-gray-500">মাদ্রাসার অনলাইন ইকোসিস্টেম ড্যাশবোর্ড এক্সেস</p>
        <div className="h-1.5 w-16 bg-amber-500 mx-auto rounded-full mt-2"></div>
      </div>

      <div className="bg-white border border-slate-200/80 rounded-xl shadow-sm overflow-hidden">
        {/* Role Selector Tabs */}
        <div className="grid grid-cols-3 bg-emerald-50 border-b border-emerald-100 p-1">
          {(["student", "teacher", "admin"] as const).map((r) => (
            <button
              key={r}
              type="button"
              id={`login-role-tab-${r}`}
              onClick={() => {
                setRole(r);
                setError("");
              }}
              className={`py-3 rounded-xl text-xs font-bold transition-all ${
                role === r
                  ? "bg-white text-emerald-900 shadow-sm border border-emerald-100/40"
                  : "text-emerald-700 hover:text-emerald-950"
              }`}
            >
              {r === "student" ? "🎓 শিক্ষার্থী" : r === "teacher" ? "📖 শিক্ষক" : "🛠️ এডমিন"}
            </button>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="space-y-1">
            <label htmlFor="login-email" className="text-xs font-bold text-gray-700 flex items-center">
              <Mail className="h-3.5 w-3.5 text-emerald-700 mr-1.5" />
              <span>ইমেইল ঠিকানা</span>
            </label>
            <input
              id="login-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="যেমন: admin@madrasah.com"
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all font-sans text-emerald-950"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="login-password" className="text-xs font-bold text-gray-700 flex items-center">
              <Lock className="h-3.5 w-3.5 text-emerald-700 mr-1.5" />
              <span>সিক্রেট পাসওয়ার্ড</span>
            </label>
            <div className="relative">
              <input
                id="login-password"
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="******"
                className="w-full pl-4 pr-10 py-2.5 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all font-sans text-emerald-950"
              />
              <button
                id="login-toggle-password"
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-emerald-800"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {error && (
            <div id="login-error-alert" className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-lg text-xs font-medium">
              {error}
            </div>
          )}

          <button
            id="login-submit-btn"
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-800 hover:bg-emerald-950 text-amber-400 hover:text-amber-300 font-bold py-3 rounded-lg shadow-md transition-all flex items-center justify-center space-x-2 text-sm disabled:bg-emerald-700"
          >
            {loading ? (
              <span>যাচাই করা হচ্ছে...</span>
            ) : (
              <>
                <ShieldCheck className="h-4.5 w-4.5" />
                <span>লগইন করুন</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* Interactive Quick-Login Panel for Testing */}
      <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-5 space-y-3.5 font-sans">
        <h3 className="font-bold text-sm text-amber-900 flex items-center">
          <Info className="h-4.5 w-4.5 text-amber-700 mr-1.5 flex-shrink-0" />
          রিয়েল-টাইম ডেমো লগইন ক্রেডেনশিয়াল (Quick Access)
        </h3>
        <p className="text-xs text-amber-800 leading-relaxed">
          নিচের বাটনগুলোতে ক্লিক করলেই ইমেইল ও পাসওয়ার্ড অটোমেটিক বসে যাবে, এরপর সরাসরি লগইন বাটনে ক্লিক করে ড্যাশবোর্ড পরীক্ষা করুন:
        </p>
        <div className="flex flex-col gap-2 pt-1.5">
          <button
            id="quick-login-student"
            onClick={() => handleFillCredentials("student")}
            className="flex items-center justify-between text-left text-xs bg-white hover:bg-emerald-50 border border-emerald-100 p-2.5 rounded-lg shadow-sm transition-colors text-emerald-900"
          >
            <span className="font-bold">🎓 শিক্ষার্থীর ড্যাশবোর্ড</span>
            <span className="text-gray-500 font-mono">student@madrasah.com</span>
          </button>
          <button
            id="quick-login-teacher"
            onClick={() => handleFillCredentials("teacher")}
            className="flex items-center justify-between text-left text-xs bg-white hover:bg-emerald-50 border border-emerald-100 p-2.5 rounded-lg shadow-sm transition-colors text-emerald-900"
          >
            <span className="font-bold">📖 শিক্ষকের ড্যাশবোর্ড</span>
            <span className="text-gray-500 font-mono">teacher@madrasah.com</span>
          </button>
          <button
            id="quick-login-admin"
            onClick={() => handleFillCredentials("admin")}
            className="flex items-center justify-between text-left text-xs bg-white hover:bg-emerald-50 border border-emerald-100 p-2.5 rounded-lg shadow-sm transition-colors text-emerald-900"
          >
            <span className="font-bold">🛠️ এডমিন প্যানেল ড্যাশবোর্ড</span>
            <span className="text-gray-500 font-mono">admin@madrasah.com</span>
          </button>
        </div>
      </div>
    </div>
  );
}
