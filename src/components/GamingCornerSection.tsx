import React, { useState, useEffect } from "react";
import { collection, query, writeBatch, doc, getDocs } from "firebase/firestore";
import { db, StreamBuilder } from "../lib/firebase";
import { Brain, Calculator, BookOpen, Clock, Trophy, Frown, RotateCcw } from "lucide-react";

type Question = {
  id: string;
  category: "math" | "islamic" | "bengali";
  question: string;
  options: string[];
  answer: string;
};

const seedQuestions = async () => {
  const colRef = collection(db, "gaming_corner_questions");
  const snap = await getDocs(colRef);
  if (snap.empty) {
    const batch = writeBatch(db);
    const questions: Omit<Question, "id">[] = [
      // Math
      { category: "math", question: "৫ + ৫ = ?", options: ["১০", "৮", "১২", "১৫"], answer: "১০" },
      { category: "math", question: "১০ - ৩ = ?", options: ["৭", "৬", "৮", "৫"], answer: "৭" },
      { category: "math", question: "৪ x ৫ = ?", options: ["২০", "১৫", "২৫", "৩০"], answer: "২০" },
      { category: "math", question: "২০ / ৪ = ?", options: ["৫", "৪", "৬", "৮"], answer: "৫" },
      { category: "math", question: "৩ + ৭ = ?", options: ["১০", "৯", "১১", "১২"], answer: "১০" },
      { category: "math", question: "১৫ - ৫ = ?", options: ["১০", "৮", "৫", "১২"], answer: "১০" },
      { category: "math", question: "৬ x ৩ = ?", options: ["১৮", "১৬", "১২", "১৫"], answer: "১৮" },
      { category: "math", question: "২৫ / ৫ = ?", options: ["৫", "৪", "৬", "১০"], answer: "৫" },
      { category: "math", question: "৮ + ৪ = ?", options: ["১২", "১০", "১৪", "১৬"], answer: "১২" },
      { category: "math", question: "৯ x ২ = ?", options: ["১৮", "১৬", "২০", "১৪"], answer: "১৮" },
      // Islamic
      { category: "islamic", question: "ইসলামের মূল স্তম্ভ কয়টি?", options: ["৫টি", "৪টি", "৬টি", "৩টি"], answer: "৫টি" },
      { category: "islamic", question: "কুরআনের সূরা সংখ্যা কত?", options: ["১১৪টি", "১২০টি", "১১২টি", "১০৮টি"], answer: "১১৪টি" },
      { category: "islamic", question: "শেষ নবীর নাম কী?", options: ["হযরত মুহাম্মদ (সা.)", "হযরত ঈসা (আ.)", "হযরত মুসা (আ.)", "হযরত ইব্রাহিম (আ.)"], answer: "হযরত মুহাম্মদ (সা.)" },
      { category: "islamic", question: "নামাজের ফরজ কয়টি?", options: ["১৩টি", "১৪টি", "১২টি", "১৫টি"], answer: "১৩টি" },
      { category: "islamic", question: "ওযুর ফরজ কয়টি?", options: ["৪টি", "৩টি", "৫টি", "৬টি"], answer: "৪টি" },
      { category: "islamic", question: "প্রথম খলিফা কে ছিলেন?", options: ["হযরত আবু বকর (রা.)", "হযরত উমর (রা.)", "হযরত উসমান (রা.)", "হযরত আলী (রা.)"], answer: "হযরত আবু বকর (রা.)" },
      { category: "islamic", question: "হজের ফরজ কয়টি?", options: ["৩টি", "৪টি", "৫টি", "৬টি"], answer: "৩টি" },
      { category: "islamic", question: "কুরআনের সবচেয়ে বড় সূরা কোনটি?", options: ["সূরা বাকারা", "সূরা ইয়াসিন", "সূরা ফাতিহা", "সূরা ইমরান"], answer: "সূরা বাকারা" },
      { category: "islamic", question: "রোজার আরবি শব্দ কী?", options: ["সাওম", "সালাত", "যাকাত", "হজ"], answer: "সাওম" },
      { category: "islamic", question: "কালেমা কয়টি?", options: ["৫টি", "৪টি", "৬টি", "৩টি"], answer: "৫টি" },
      // Bengali
      { category: "bengali", question: "বাংলাদেশের জাতীয় ফুল কী?", options: ["শাপলা", "গোলাপ", "পদ্ম", "জবা"], answer: "শাপলা" },
      { category: "bengali", question: "বাংলাদেশের জাতীয় ফল কী?", options: ["কাঁঠাল", "আম", "জাম", "লিচু"], answer: "কাঁঠাল" },
      { category: "bengali", question: "বাংলাদেশের জাতীয় পাখি কী?", options: ["দোয়েল", "ময়না", "কোকিল", "টিয়া"], answer: "দোয়েল" },
      { category: "bengali", question: "বাংলাদেশের জাতীয় পশু কী?", options: ["রয়েল বেঙ্গল টাইগার", "হরিণ", "হাতি", "সিংহ"], answer: "রয়েল বেঙ্গল টাইগার" },
      { category: "bengali", question: "বাংলাদেশের জাতীয় মাছ কী?", options: ["ইলিশ", "রুই", "কাতলা", "পাঙ্গাস"], answer: "ইলিশ" },
      { category: "bengali", question: "বাংলাদেশের রাজধানীর নাম কী?", options: ["ঢাকা", "চট্টগ্রাম", "রাজশাহী", "খুলনা"], answer: "ঢাকা" },
      { category: "bengali", question: "বাংলাদেশের ভাষা কী?", options: ["বাংলা", "ইংরেজি", "আরবি", "হিন্দি"], answer: "বাংলা" },
      { category: "bengali", question: "বাংলাদেশের স্বাধীনতা দিবস কবে?", options: ["২৬শে মার্চ", "১৬ই ডিসেম্বর", "২১শে ফেব্রুয়ারি", "পহেলা বৈশাখ"], answer: "২৬শে মার্চ" },
      { category: "bengali", question: "বাংলাদেশের বিজয় দিবস কবে?", options: ["১৬ই ডিসেম্বর", "২৬শে মার্চ", "২১শে ফেব্রুয়ারি", "পহেলা বৈশাখ"], answer: "১৬ই ডিসেম্বর" },
      { category: "bengali", question: "বাংলাদেশের শহীদ দিবস কবে?", options: ["২১শে ফেব্রুয়ারি", "২৬শে মার্চ", "১৬ই ডিসেম্বর", "পহেলা বৈশাখ"], answer: "২১শে ফেব্রুয়ারি" },
    ];
    questions.forEach((q, i) => {
      const newDoc = doc(colRef);
      batch.set(newDoc, { ...q, id: newDoc.id, order: i });
    });
    await batch.commit();
  }
};

const gamingQuery = query(collection(db, "gaming_corner_questions"));

function QuizApp({ allQuestions }: { allQuestions: Question[] }) {
  const [selectedCategory, setSelectedCategory] = useState<"math" | "islamic" | "bengali" | null>(null);
  const [shuffledQuestions, setShuffledQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [timeLeft, setTimeLeft] = useState(10);

  const currentQuestion = shuffledQuestions[currentQuestionIndex];

  useEffect(() => {
    if (!selectedCategory || showResult || !currentQuestion) return;

    if (timeLeft === 0) {
      handleNextQuestion(false);
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, selectedCategory, showResult, currentQuestion]);

  const handleAnswer = (selectedOption: string) => {
    if (!currentQuestion) return;
    const isCorrect = selectedOption === currentQuestion.answer;
    if (isCorrect) setScore(prev => prev + 1);
    handleNextQuestion(isCorrect);
  };

  const handleNextQuestion = (wasCorrect: boolean) => {
    if (currentQuestionIndex + 1 < shuffledQuestions.length) {
      setCurrentQuestionIndex(prev => prev + 1);
      setTimeLeft(10);
    } else {
      setShowResult(true);
    }
  };

  const handleCategorySelect = (category: "math" | "islamic" | "bengali") => {
    const cats = allQuestions.filter(q => q.category === category);
    setShuffledQuestions([...cats].sort(() => Math.random() - 0.5));
    setSelectedCategory(category);
    setTimeLeft(10);
  };

  const resetQuiz = () => {
    setSelectedCategory(null);
    setShuffledQuestions([]);
    setCurrentQuestionIndex(0);
    setScore(0);
    setShowResult(false);
    setTimeLeft(10);
  };

  if (!selectedCategory) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4 font-alinur">
        <h2 className="text-3xl sm:text-4xl font-bold text-center text-emerald-900 mb-10 drop-shadow-sm">গেমিং কর্ণার</h2>
        <p className="text-center text-lg text-emerald-700 mb-12">আপনার পছন্দের কুইজ ক্যাটাগরি নির্বাচন করুন</p>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
          <div 
            onClick={() => handleCategorySelect("math")}
            className="bg-white rounded-[20px] shadow-md border-2 border-amber-200 p-5 flex flex-col items-center justify-center cursor-pointer hover:bg-amber-50 hover:-translate-y-1 hover:scale-[1.02] hover:shadow-xl hover:shadow-amber-200/50 transition-all duration-300 group"
          >
            <div className="w-14 h-14 rounded-full bg-amber-100 flex items-center justify-center mb-3 group-hover:scale-110 group-hover:rotate-3 transition-transform">
              <Calculator className="w-7 h-7 text-amber-600" />
            </div>
            <h3 className="text-xl font-bold text-emerald-900">গনিত সমাধান</h3>
          </div>

          <div 
            onClick={() => handleCategorySelect("islamic")}
            className="bg-white rounded-[20px] shadow-md border-2 border-emerald-200 p-5 flex flex-col items-center justify-center cursor-pointer hover:bg-emerald-50 hover:-translate-y-1 hover:scale-[1.02] hover:shadow-xl hover:shadow-emerald-200/50 transition-all duration-300 group"
          >
            <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mb-3 group-hover:scale-110 group-hover:rotate-3 transition-transform">
              <BookOpen className="w-7 h-7 text-emerald-600" />
            </div>
            <h3 className="text-xl font-bold text-emerald-900">ইসলামিক কুইজ</h3>
          </div>

          <div 
            onClick={() => handleCategorySelect("bengali")}
            className="bg-white rounded-[20px] shadow-md border-2 border-orange-200 p-5 flex flex-col items-center justify-center cursor-pointer hover:bg-orange-50 hover:-translate-y-1 hover:scale-[1.02] hover:shadow-xl hover:shadow-orange-200/50 transition-all duration-300 group"
          >
            <div className="w-14 h-14 rounded-full bg-orange-100 flex items-center justify-center mb-3 group-hover:scale-110 group-hover:rotate-3 transition-transform">
              <Brain className="w-7 h-7 text-orange-600" />
            </div>
            <h3 className="text-xl font-bold text-emerald-900">বাংলা প্রশ্ন</h3>
          </div>
        </div>
      </div>
    );
  }

  if (showResult) {
    const isSuccess = score >= 5;
    const percentage = Math.round((score / shuffledQuestions.length) * 100);

    return (
      <div className="max-w-2xl mx-auto py-12 px-4 font-alinur flex flex-col items-center justify-center min-h-[60vh]">
        <div className={`w-full bg-white rounded-3xl shadow-2xl overflow-hidden border-4 ${isSuccess ? 'border-emerald-500' : 'border-amber-500'}`}>
          <div className={`p-8 text-center ${isSuccess ? 'bg-emerald-50' : 'bg-amber-50'}`}>
            <div className="flex justify-center mb-6">
              {isSuccess ? (
                <div className="w-24 h-24 rounded-full bg-emerald-100 flex items-center justify-center animate-bounce">
                  <Trophy className="w-12 h-12 text-emerald-600" />
                </div>
              ) : (
                <div className="w-24 h-24 rounded-full bg-amber-100 flex items-center justify-center">
                  <Frown className="w-12 h-12 text-amber-600" />
                </div>
              )}
            </div>
            
            <h2 className={`text-4xl font-bold mb-4 ${isSuccess ? 'text-emerald-700' : 'text-amber-700'}`}>
              {isSuccess ? 'অভিনন্দন! ভালো পারফরমেন্স' : 'সান্তনামূলক বাণী'}
            </h2>
            
            <p className="text-xl text-slate-700 mb-8 px-4">
              {isSuccess 
                ? `মাশাআল্লাহ! আপনি কুইজে চমৎকার ফলাফল করেছেন। আপনার মেধার এই ধারা অব্যাহত থাকুক।` 
                : `হতাশ হবেন না! "ধৈর্য ইমানের অঙ্গ"। চেষ্টা চালিয়ে যান, ইনশাআল্লাহ আগামীতে আপনি আরও ভালো করবেন।`
              }
            </p>

            <div className="grid grid-cols-2 gap-4 max-w-md mx-auto mb-8">
              <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                <p className="text-slate-500 mb-1">আপনার স্কোর</p>
                <p className="text-3xl font-bold text-emerald-600">{score} / {shuffledQuestions.length}</p>
              </div>
              <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                <p className="text-slate-500 mb-1">সঠিক উত্তর</p>
                <p className="text-3xl font-bold text-emerald-600">{percentage}%</p>
              </div>
            </div>

            <button
              onClick={resetQuiz}
              className={`px-8 py-4 rounded-xl text-xl font-bold text-white shadow-lg transition-all hover:-translate-y-1 ${
                isSuccess ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-amber-500 hover:bg-amber-600'
              } flex items-center justify-center mx-auto gap-2`}
            >
              <RotateCcw className="w-6 h-6" />
              আবার চেষ্টা করুন
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-12 px-4 font-alinur">
      <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-emerald-100">
        <div className="bg-emerald-900 text-white p-6 flex items-center justify-between">
          <h3 className="text-2xl font-bold">
            {selectedCategory === 'math' && 'গনিত সমাধান'}
            {selectedCategory === 'islamic' && 'ইসলামিক কুইজ'}
            {selectedCategory === 'bengali' && 'বাংলা প্রশ্ন'}
          </h3>
          <div className="flex items-center gap-4">
            <span className="text-emerald-200 font-bold">
              প্রশ্ন: {currentQuestionIndex + 1} / {shuffledQuestions.length}
            </span>
            <div className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold text-lg ${timeLeft <= 3 ? 'bg-red-500 text-white animate-pulse' : 'bg-amber-400 text-emerald-950'}`}>
              <Clock className="w-5 h-5" />
              {timeLeft} সেকেন্ড
            </div>
          </div>
        </div>

        <div className="p-8 sm:p-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-emerald-950 mb-10 text-center leading-tight">
            {currentQuestion.question}
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            {currentQuestion.options.map((option, idx) => (
              <button
                key={idx}
                onClick={() => handleAnswer(option)}
                className="w-full bg-slate-50 hover:bg-emerald-50 border-2 border-slate-200 hover:border-emerald-400 text-emerald-900 text-xl font-bold py-5 px-6 rounded-2xl transition-all duration-200 hover:shadow-md active:scale-95 text-center"
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function GamingCornerSection({ logoUrl }: { logoUrl?: string | null }) {
  useEffect(() => {
    seedQuestions();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50/50 py-10 font-alinur">
      <StreamBuilder<Question>
        stream={gamingQuery}
        builder={(questions) => {
          if (!questions || questions.length === 0) {
            return (
              <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <div className="w-16 h-16 border-4 border-amber-400 border-t-emerald-600 rounded-full animate-spin mb-4"></div>
                <h3 className="text-xl font-bold text-emerald-900">গেমিং কর্ণার প্রস্তুত হচ্ছে...</h3>
              </div>
            );
          }
          return <QuizApp allQuestions={questions} />;
        }}
      />
    </div>
  );
}
