import React, { useState, useRef, useEffect } from "react";
import { collection, addDoc, query, orderBy, doc, updateDoc, getDocs, where } from "firebase/firestore";
import { db, handleFirestoreError, OperationType, StreamBuilder, uploadFileToImgBB } from "../lib/firebase";
import { SuccessStory, CommitteeMember, HonoredPerson } from "../types";
import { Mail, Phone, MapPin, Send, ArrowRight, ArrowLeft, Heart, Award, Facebook, Linkedin, MessageCircle, Trophy } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { loadingService } from "../lib/loadingService";

const COMPLAINT_OPTIONS = [
  "শিক্ষার মান নিম্নমানের",
  "আর্থিক অনিয়ম",
  "শিক্ষকদের অসদাচরণ",
  "শারীরিক বা মানসিক নির্যাতন",
  "হোস্টেলের অব্যবস্থাপনা",
  "প্রশাসনিক অনিয়ম",
  "স্বাস্থ্য ও নিরাপত্তার ঘাটতি"
];

const SUGGESTION_OPTIONS = [
  "শিক্ষার মান উন্নয়নের পরামর্শ",
  "আর্থিক স্বচ্ছতা নিশ্চিত করার পরামর্শ",
  "শিক্ষকদের পেশাগত আচরণ উন্নয়নের পরামর্শ",
  "শারীরিক ও মানসিক নির্যাতন প্রতিরোধের পরামর্শ",
  "হোস্টেল ব্যবস্থাপনা উন্নয়নের পরামর্শ",
  "প্রশাসনিক কার্যক্রমে স্বচ্ছতা ও জবাবদিহিতা বৃদ্ধির পরামর্শ",
  "স্বাস্থ্য, পরিচ্ছন্নতা ও নিরাপত্তা ব্যবস্থা জোরদারের পরামর্শ"
];

const successStoriesQuery = query(collection(db, "success_stories"), orderBy("year", "desc"));
const committeeQuery = query(collection(db, "committee"), orderBy("rank", "asc"));
const honoredPersonsQuery = collection(db, "honored_persons");
const settingsQuery = query(collection(db, "settings"));

interface SuccessStoriesCarouselProps {
  successStories: SuccessStory[];
  setSelectedStory: (story: SuccessStory) => void;
}

function SuccessStoriesCarousel({ successStories, setSelectedStory }: SuccessStoriesCarouselProps) {
  const [activeSuccessIndex, setActiveSuccessIndex] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);

  const parseAchievement = (text: string) => {
    const cleanText = text || "";
    const separator = cleanText.includes("।") ? "।" : cleanText.includes(":") ? ":" : cleanText.includes(" - ") ? " - " : null;
    
    if (separator) {
      const parts = cleanText.split(separator);
      const headline = parts[0].trim() + (separator === "।" ? "।" : "");
      const detail = parts.slice(1).join(separator).trim();
      if (headline && detail) {
        return { headline, detail };
      }
    }
    
    const words = cleanText.split(/\s+/);
    if (words.length > 6) {
      const headline = words.slice(0, 6).join(" ") + "...";
      return { headline, detail: cleanText };
    }
    
    return { headline: cleanText, detail: "" };
  };

  // Auto-scroll effect: 1-Second Auto-Scrolling interval
  useEffect(() => {
    if (!successStories || successStories.length === 0) return;
    
    const interval = setInterval(() => {
      setActiveSuccessIndex((prevIndex) => {
        const total = Math.min(successStories.length, 6);
        if (total <= 1) return 0;
        const nextIndex = (prevIndex + 1) % total;
        
        if (carouselRef.current) {
          const container = carouselRef.current;
          const cardElement = container.children[nextIndex] as HTMLElement;
          if (cardElement) {
            container.scrollTo({
              left: cardElement.offsetLeft - container.offsetLeft,
              behavior: "smooth",
            });
          }
        }
        
        return nextIndex;
      });
    }, 1000); // 1-Second Auto-Scrolling interval
    
    return () => clearInterval(interval);
  }, [successStories]);

  // Handle manual navigation
  const handleNavigate = (direction: "prev" | "next") => {
    if (!successStories || successStories.length === 0) return;
    const total = Math.min(successStories.length, 6);
    if (total <= 1) return;
    
    let newIndex = activeSuccessIndex;
    if (direction === "prev") {
      newIndex = (activeSuccessIndex - 1 + total) % total;
    } else {
      newIndex = (activeSuccessIndex + 1) % total;
    }
    
    setActiveSuccessIndex(newIndex);
    
    if (carouselRef.current) {
      const container = carouselRef.current;
      const cardElement = container.children[newIndex] as HTMLElement;
      if (cardElement) {
        container.scrollTo({
          left: cardElement.offsetLeft - container.offsetLeft,
          behavior: "smooth",
        });
      }
    }
  };

  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeftState, setScrollLeftState] = useState(0);

  // Drag Scroll Event Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!carouselRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - carouselRef.current.offsetLeft);
    setScrollLeftState(carouselRef.current.scrollLeft);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !carouselRef.current) return;
    e.preventDefault();
    const x = e.pageX - carouselRef.current.offsetLeft;
    const walk = (x - startX) * 1.5; // Scroll speed
    carouselRef.current.scrollLeft = scrollLeftState - walk;
  };

  return (
    <section id="success-stories-carousel" className="space-y-6">
      <div className="flex items-center justify-between pb-1 border-b border-emerald-100/50">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black font-alinur tracking-tight bg-gradient-to-r from-emerald-800 via-emerald-950 to-amber-600 bg-clip-text text-transparent flex items-center gap-2">
            <span>শিক্ষার্থীদের অনন্য সাফল্য</span>
            <motion.div
              animate={{ scale: [1, 1.15, 1], rotate: [0, 5, -5, 0] }}
              transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
              className="text-amber-500 cursor-pointer"
            >
              <Trophy className="h-7 w-7 filter drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
            </motion.div>
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 mt-1 font-alinur">আমাদের কৃতি শিক্ষার্থীদের গৌরবোজ্জ্বল অর্জনসমূহ</p>
        </div>

        {/* Manual Navigation Controls (Upper right corner) */}
        {successStories.length > 0 && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleNavigate("prev")}
              className="p-1.5 sm:p-2 rounded-full border border-emerald-200/60 bg-emerald-50/40 hover:bg-emerald-100 text-emerald-800 transition-all shadow-sm cursor-pointer hover:scale-105"
              title="পূর্ববর্তী"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => handleNavigate("next")}
              className="p-1.5 sm:p-2 rounded-full border border-emerald-200/60 bg-emerald-50/40 hover:bg-emerald-100 text-emerald-800 transition-all shadow-sm cursor-pointer hover:scale-105"
              title="পরবর্তী"
            >
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      <div className="relative">
        {/* Swipeable Carousel wrapper */}
        <div
          ref={carouselRef}
          onMouseDown={handleMouseDown}
          onMouseLeave={handleMouseLeave}
          onMouseUp={handleMouseUp}
          onMouseMove={handleMouseMove}
          className={`flex gap-6 overflow-x-auto pb-6 pt-3 snap-x snap-mandatory scroll-smooth scrollbar-thin scrollbar-thumb-emerald-700 scrollbar-track-gray-100 touch-pan-x overscroll-x-contain select-none ${isDragging ? "cursor-grabbing" : "cursor-grab"}`}
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          {successStories.length === 0 ? (
            <div className="w-full py-12 text-center text-gray-400 font-alinur">
              সাফল্যের তথ্য লোড হচ্ছে...
            </div>
          ) : (
            successStories.slice(0, 6).map((story, idx) => {
              const { headline, detail } = parseAchievement(story.achievement);
              const isActive = idx === activeSuccessIndex;
              return (
                <div
                  key={story.id}
                  onClick={() => {
                    if (!isDragging) {
                      setSelectedStory(story);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }
                  }}
                  className={`min-w-[260px] sm:min-w-[290px] max-w-[290px] h-[340px] sm:h-[370px] rounded-2xl relative overflow-hidden flex flex-col justify-end snap-start group cursor-pointer border-2 transition-all duration-300 shadow-md hover:shadow-xl ${
                    isActive 
                      ? "border-amber-500 ring-4 ring-amber-500/20 scale-[1.02]" 
                      : "border-emerald-800/25 hover:border-amber-500/50 ring-4 ring-emerald-950/5 hover:ring-amber-500/20"
                  }`}
                >
                  {/* ১. ফুল-ইমেজ ব্যাকগ্রাউন্ড */}
                  <img
                    src={story.imageUrl}
                    alt={story.student_name}
                    referrerPolicy="no-referrer"
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 z-0"
                  />
                  
                  {/* ২. ছবির ওপরে হালকা কালো বা সবুজ সেমি-ট্রান্সপারেন্ট ওভারলে */}
                  <div className="absolute inset-0 bg-gradient-to-t from-emerald-950 via-emerald-950/70 to-transparent opacity-95 z-10" />

                  {/* সাফল্য অর্জনের বছর বাটন / ব্যাজ (টপ রাইট কর্নারে) */}
                  <div className="absolute top-3.5 right-3.5 bg-amber-500/90 backdrop-blur-xs text-emerald-950 font-bold font-alinur text-[10px] sm:text-xs px-2.5 py-0.5 rounded-full shadow border border-amber-300/30 z-20 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-950 animate-pulse"></span>
                    <span>{story.year}</span>
                  </div>

                  {/* ৩. কন্টেন্ট পজিশনিং (কার্ডের একদম নিচে ছবির ওপর লেয়ার হিসেবে) */}
                  <div className="relative z-20 p-4 sm:p-5 flex flex-col space-y-2.5">
                    {/* শিক্ষার্থীর নাম */}
                    <h3 className="font-extrabold text-base sm:text-lg text-white font-alinur leading-snug drop-shadow-md group-hover:text-amber-300 transition-colors">
                      {story.student_name}
                    </h3>

                    {/* সাফল্য হেডлайн */}
                    <span className="font-bold text-[10px] sm:text-[11px] text-amber-300 font-alinur leading-relaxed bg-emerald-900/80 backdrop-blur-xs px-2.5 py-1 rounded-md border border-emerald-700/50 w-fit line-clamp-1">
                      {headline}
                    </span>

                    {/* সাফল্যের বিস্তারিত */}
                    <p className="text-[10px] sm:text-xs text-emerald-100 font-alinur leading-relaxed text-justify line-clamp-3">
                      {detail}
                    </p>
                    
                    {/* বিস্তারিত দেখুন বাটন */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedStory(story);
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                      className="inline-flex items-center gap-1.5 text-[10px] sm:text-xs font-black text-amber-300 hover:text-amber-400 font-alinur w-fit transition-colors pt-1 cursor-pointer"
                    >
                      <span>বিস্তারিত পড়ুন</span>
                      <span>➔</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </section>
  );
}

export default function HomeSection({ 
  logoUrl, 
  setActiveTab, 
  onSelectMember 
}: { 
  logoUrl?: string | null; 
  setActiveTab?: (tab: string) => void; 
  onSelectMember?: (member: CommitteeMember) => void;
}) {
  const [logoUrlWithCache, setLogoUrlWithCache] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (logoUrl !== undefined) {
      if (logoUrl) {
        const freshUrl = `${logoUrl}${logoUrl.includes('?') ? '&' : '?'}t=${Date.now()}`;
        setLogoUrlWithCache(freshUrl);
        
        // Dynamic preload to <head>
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'image';
        link.href = freshUrl;
        link.setAttribute('fetchpriority', 'high');
        document.head.appendChild(link);
        
        return () => {
          try {
            document.head.removeChild(link);
          } catch (e) {
            // ignore
          }
        };
      } else {
        setLogoUrlWithCache("/photo/logo.png");
      }
    }
  }, [logoUrl]);

  // Contact Form State
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactAddress, setContactAddress] = useState("");
  const [contactFormType, setContactFormType] = useState<"অভিযোগ" | "পরামর্শ">("অভিযোগ");
  const [contactCategory, setContactCategory] = useState(COMPLAINT_OPTIONS[0]);
  const [contactMessage, setContactMessage] = useState("");
  const [formErrors, setFormErrors] = useState<{
    name?: string;
    email?: string;
    phone?: string;
    address?: string;
    category?: string;
    message?: string;
  }>({});
  const [isCurtainOpen, setIsCurtainOpen] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [showWarningPopup, setShowWarningPopup] = useState(false);
  const [warningPopupMessage, setWarningPopupMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync category with form type selection
  useEffect(() => {
    if (contactFormType === "অভিযোগ") {
      setContactCategory(COMPLAINT_OPTIONS[0]);
    } else {
      setContactCategory(SUGGESTION_OPTIONS[0]);
    }
  }, [contactFormType]);
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle");
  const [logoError, setLogoError] = useState(false);
  const [selectedStory, setSelectedStory] = useState<SuccessStory | null>(null);
  const [selectedCommitteeMember, setSelectedCommitteeMember] = useState<CommitteeMember | null>(null);
  const [clampedSpeeches, setClampedSpeeches] = useState<Record<string, boolean>>({});
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [warningMessage, setWarningMessage] = useState("");

  // Secret Contact Icon Upload States
  const [showSecretUpload, setShowSecretUpload] = useState(false);
  const [uploadedIcons, setUploadedIcons] = useState<Record<string, string>>({});
  const [uploadingStatus, setUploadingStatus] = useState<Record<string, string>>({});

  const handleIconUpload = async (iconId: string, file: File) => {
    setUploadingStatus(prev => ({ ...prev, [iconId]: "uploading" }));
    try {
      const url = await uploadFileToImgBB(file);
      setUploadedIcons(prev => ({ ...prev, [iconId]: url }));
      setUploadingStatus(prev => ({ ...prev, [iconId]: "success" }));
    } catch (err) {
      console.error(`Error uploading icon ${iconId}:`, err);
      setUploadingStatus(prev => ({ ...prev, [iconId]: "error" }));
    }
  };

  const handleSaveAndLockIcons = async () => {
    try {
      const contactDocRef = doc(db, "settings", "contact");
      
      const updateData: Record<string, any> = {
        isIconUploaded: true,
      };

      if (uploadedIcons.map) updateData.mapIconUrl = uploadedIcons.map;
      if (uploadedIcons.office_phone) updateData.officePhoneIconUrl = uploadedIcons.office_phone;
      if (uploadedIcons.principal_phone) updateData.principalPhoneIconUrl = uploadedIcons.principal_phone;
      if (uploadedIcons.email) updateData.emailIconUrl = uploadedIcons.email;
      if (uploadedIcons.facebook) updateData.facebookIconUrl = uploadedIcons.facebook;
      if (uploadedIcons.linkedin) updateData.linkedinIconUrl = uploadedIcons.linkedin;
      if (uploadedIcons.telegram) updateData.telegramIconUrl = uploadedIcons.telegram;
      if (uploadedIcons.whatsapp) updateData.whatsappIconUrl = uploadedIcons.whatsapp;

      await updateDoc(contactDocRef, updateData);
      setShowSecretUpload(false);
      alert("আলহামদুলিল্লাহ! কন্টাক্ট আইকনগুলো সফলভাবে সেভ ও চিরতরে লক করা হয়েছে।");
    } catch (err) {
      console.error("Error saving contact icons:", err);
      alert("দুঃখিত, আইকনগুলো সংরক্ষণ করা যায়নি। অনুগ্রহ করে পুনরায় চেষ্টা করুন।");
    }
  };

  React.useEffect(() => {
    if (selectedCommitteeMember) {
      window.history.pushState({ prevView: "committee-detail" }, "");
      
      const handlePopState = (event: PopStateEvent) => {
        event.preventDefault();
        setSelectedCommitteeMember(null);
      };

      window.addEventListener("popstate", handlePopState);
      return () => {
        window.removeEventListener("popstate", handlePopState);
      };
    }
  }, [selectedCommitteeMember]);

  const parseAchievement = (text: string) => {
    const cleanText = text || "";
    const separator = cleanText.includes("।") ? "।" : cleanText.includes(":") ? ":" : cleanText.includes(" - ") ? " - " : null;
    
    if (separator) {
      const parts = cleanText.split(separator);
      const headline = parts[0].trim() + (separator === "।" ? "।" : "");
      const detail = parts.slice(1).join(separator).trim();
      if (headline && detail) {
        return { headline, detail };
      }
    }
    
    const words = cleanText.split(/\s+/);
    if (words.length > 6) {
      const headline = words.slice(0, 6).join(" ") + "...";
      return { headline, detail: cleanText };
    }
    
    return { headline: cleanText, detail: "" };
  };

  const carouselRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeftState, setScrollLeftState] = useState(0);

  // Drag Scroll Event Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!carouselRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - carouselRef.current.offsetLeft);
    setScrollLeftState(carouselRef.current.scrollLeft);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !carouselRef.current) return;
    e.preventDefault();
    const x = e.pageX - carouselRef.current.offsetLeft;
    const walk = (x - startX) * 1.5; // Scroll multiplier
    carouselRef.current.scrollLeft = scrollLeftState - walk;
  };

  // Carousel scroll controls
  const scrollLeft = () => {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({ left: -320, behavior: "smooth" });
    }
  };

  const scrollRight = () => {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({ left: 320, behavior: "smooth" });
    }
  };

  // Handle Contact Form Submit
  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Custom validation
    const errors: typeof formErrors = {};
    if (!contactName.trim()) {
      errors.name = "আপনি এই ঘরটি পূরণ করেননি";
    }
    if (!contactEmail.trim()) {
      errors.email = "আপনি এই ঘরটি পূরণ করেননি";
    }
    if (!contactPhone.trim()) {
      errors.phone = "আপনি এই ঘরটি পূরণ করেননি";
    }
    if (!contactAddress.trim()) {
      errors.address = "আপনি এই ঘরটি পূরণ করেননি";
    }
    if (!contactCategory.trim()) {
      errors.category = "আপনি এই ঘরটি পূরণ করেননি";
    }
    if (!contactMessage.trim()) {
      errors.message = "আপনি এই ঘরটি পূরণ করেননি";
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      setWarningPopupMessage("দয়া করে ফর্মের সবকটি ঘর পূরণ করুন।");
      setShowWarningPopup(true);
      return;
    }

    const cleanPhone = toEnglishDigits(contactPhone).replace(/[^0-9]/g, "");
    if (cleanPhone.length < 10) {
      setFormErrors({ phone: "দয়া করে একটি সঠিক ফোন নম্বর লিখুন" });
      setWarningPopupMessage("দয়া করে একটি সঠিক ফোন নাম্বার লিখুন (যেমন: 018XXXXXXXX)।");
      setShowWarningPopup(true);
      return;
    }

    setFormErrors({});

    const lastSubKey = `last_sub_phone_${cleanPhone}`;
    const localLast = localStorage.getItem(lastSubKey);
    const now = Date.now();
    const DayInMs = 24 * 60 * 60 * 1000;

    if (localLast) {
      const diff = now - parseInt(localLast);
      if (diff < DayInMs) {
        const hoursLeft = Math.ceil((DayInMs - diff) / (1000 * 60 * 60));
        setWarningPopupMessage(`দুঃখিত, আপনি গত ২৪ ঘণ্টায় ইতিমধ্যে একটি বার্তা পাঠিয়েছেন। দয়া করে আরও ${hoursLeft} ঘণ্টা পর পুনরায় চেষ্টা করুন।`);
        setShowWarningPopup(true);
        return;
      }
    }

    // Trigger the premium global loading spinner
    loadingService.show();
    setIsSubmitting(true);
    setSubmitStatus("idle");

    try {
      // Query Firestore for this phone number submitted within the last 24 hours
      const yesterday = new Date(now - DayInMs).toISOString();
      const q = query(
        collection(db, "messages"),
        where("phone", "==", cleanPhone),
        where("date", ">", yesterday)
      );
      const snap = await getDocs(q);

      if (!snap.empty) {
        setWarningPopupMessage("দুঃখিত, এই ফোন নম্বরটি থেকে গত ২৪ ঘণ্টায় ইতিমধ্যে একটি বার্তা পাঠানো হয়েছে। দয়া করে পরে চেষ্টা করুন।");
        setShowWarningPopup(true);
        loadingService.hide();
        return;
      }

      // Add to Firestore
      await addDoc(collection(db, "messages"), {
        name: contactName.trim(),
        email: contactEmail.trim(),
        phone: cleanPhone,
        address: contactAddress.trim(),
        formType: contactFormType,
        subject: contactCategory, // dynamic selected type (অভিযোগ / পরামর্শ এর ধরণ)
        message: contactMessage.trim(),
        date: new Date().toISOString()
      });

      // Update localStorage
      localStorage.setItem(lastSubKey, now.toString());

      setSubmitStatus("success");
      setShowSuccessPopup(true);

      // Clear all inputs
      setContactName("");
      setContactEmail("");
      setContactPhone("");
      setContactAddress("");
      setContactMessage("");
    } catch (err: any) {
      console.error("Error sending message:", err);
      setSubmitStatus("error");
      handleFirestoreError(err, OperationType.CREATE, "messages");
    } finally {
      setIsSubmitting(false);
      loadingService.hide();
    }
  };

  const [isMobile, setIsMobile] = React.useState(false);
  React.useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 640);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleSocialClick = (link: string, label: string) => {
    if (!link || link.trim() === "") {
      setWarningMessage(`${label} লিংক এখনো এড করা হয়নি, অনুগ্রহ করে পরবর্তী আপডেটের জন্য অপেক্ষা করুন।`);
      setShowWarningModal(true);
    } else {
      window.open(link, "_blank", "noopener,noreferrer");
    }
  };

  const toEnglishDigits = (str: string) => {
    if (!str) return "";
    const banglaDigits = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
    return str.replace(/[০-৯]/g, (w) => banglaDigits.indexOf(w).toString());
  };

  return (
    <StreamBuilder<any>
      stream={settingsQuery}
      builder={(settingsList) => {
        const websiteSettings = settingsList.find(s => s.id === "website");
        const heroBgUrl = websiteSettings?.heroBgUrl || "";
        const contactSettings = settingsList.find(s => s.id === "contact");
        const brandingSettings = settingsList.find(s => s.id === "branding");
        const contactLogoUrl = brandingSettings?.contactLogoUrl || logoUrl || "/photo/logo.png";

        return (
          <StreamBuilder<SuccessStory>
            stream={successStoriesQuery}
            builder={(successStories) => (
              <StreamBuilder<CommitteeMember>
                stream={committeeQuery}
                builder={(committee) => (
                  <StreamBuilder<HonoredPerson>
                    stream={honoredPersonsQuery}
                    builder={(honoredPersons) => {
                const president = committee.find(m => m.role?.includes("সভাপতি") || m.rank === 1 || m.role?.toLowerCase().includes("president"));
                const vicePresident = committee.find(m => (m.role?.includes("সহ-সভাপতি") || m.role?.includes("সহ সভাপতি") || m.role?.toLowerCase().includes("vice")) && m.id !== president?.id) || committee.find(m => (m.role?.includes("সুপার") || m.role?.toLowerCase().includes("super") || m.rank === 2) && m.id !== president?.id) || committee.filter(m => m.id !== president?.id).sort((a, b) => (a.rank || 0) - (b.rank || 0))[0];
                const topTwoIds = [president?.id, vicePresident?.id].filter(Boolean) as string[];
                const remainingMembers = committee.filter(m => !topTwoIds.includes(m.id)).sort((a, b) => (a.rank || 0) - (b.rank || 0));

                if (selectedStory) {
                  const { headline, detail } = parseAchievement(selectedStory.achievement);
                  return (
                    <div id="selected-success-story-view" className="w-full min-h-[70vh] bg-[#fdfdfb] py-8 px-4 sm:px-6 lg:px-8">
                      <div className="max-w-3xl mx-auto bg-white rounded-2xl border border-emerald-100 shadow-xl overflow-hidden">
                        {/* Top Decorative Border */}
                        <div className="h-3 bg-gradient-to-r from-emerald-700 via-amber-500 to-emerald-700 w-full" />
                        
                        <div className="p-6 sm:p-10 space-y-8">
                          {/* Back Button */}
                          <button
                            id="back-from-story-btn"
                            onClick={() => {
                              setSelectedStory(null);
                              window.scrollTo({ top: 0, behavior: "smooth" });
                            }}
                            className="inline-flex items-center gap-2 text-emerald-800 hover:text-amber-600 font-bold font-bengali text-sm bg-emerald-50 hover:bg-emerald-100 px-4 py-2 rounded-full transition-all shadow-sm cursor-pointer border border-emerald-100"
                          >
                            <ArrowLeft className="h-4 w-4" />
                            <span>ফিরে যান</span>
                          </button>

                          {/* Student Profile Info */}
                          <div className="flex flex-col items-center text-center space-y-4">
                            <div className="relative">
                              <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-full border-4 border-amber-400 overflow-hidden shadow-lg bg-white">
                                <img
                                  src={selectedStory.imageUrl}
                                  alt={selectedStory.student_name}
                                  referrerPolicy="no-referrer"
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div className="absolute -bottom-2 right-1/2 translate-x-1/2 bg-emerald-700 text-amber-300 font-bold font-bengali text-xs px-4 py-1.5 rounded-full shadow-md border border-amber-400/30 whitespace-nowrap">
                                শিক্ষাবর্ষ: {selectedStory.year}
                              </div>
                            </div>

                            <div className="pt-4 space-y-1">
                              <h2 className="text-2xl sm:text-3xl font-black text-emerald-900 font-bengali">
                                {selectedStory.student_name}
                              </h2>
                              <p className="text-sm font-semibold text-amber-600 tracking-wider uppercase">
                                কৃতী শিক্ষার্থী সাফল্যগাথা
                              </p>
                            </div>
                          </div>

                          {/* Divider */}
                          <div className="h-[1px] bg-gradient-to-r from-transparent via-emerald-100 to-transparent" />

                          {/* Detailed Content */}
                          <div className="space-y-6 max-w-2xl mx-auto">
                            <div className="bg-emerald-50/50 border-l-4 border-amber-500 p-5 rounded-r-xl">
                              <h3 className="text-lg sm:text-xl font-bold text-emerald-900 font-bengali leading-relaxed">
                                {headline}
                              </h3>
                            </div>
                            
                            {(detail || selectedStory.achievement) && (
                              <div className="text-gray-700 leading-relaxed font-bengali text-base sm:text-lg whitespace-pre-line text-justify">
                                {detail || selectedStory.achievement}
                              </div>
                            )}
                          </div>

                          {/* Bottom design accent */}
                          <div className="pt-8 text-center">
                            <div className="inline-flex items-center gap-2 text-emerald-900/60 font-bengali text-xs">
                              <Award className="h-5 w-5 text-amber-500" />
                              <span>সুফিয়া নূরীয়া দাখিল মাদ্রাসা — জ্ঞান ও নৈতিকতার আলোকবর্তিকা</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                }

                if (selectedCommitteeMember) {
                  const speechText = selectedCommitteeMember.speech || "মাদ্রাসার সুষ্ঠু পরিচালনা ও উন্নত শিক্ষার পরিবেশ বজায় রাখতে আমরা সদা সচেষ্ট।";
                  return (
                    <div id="selected-committee-detail-view" className="w-full min-h-[80vh] bg-[#fdfdfb] py-8 px-4 sm:px-6 lg:px-8 font-alinur">
                      <div className="max-w-3xl mx-auto bg-white rounded-3xl border-2 border-emerald-800/20 shadow-2xl overflow-hidden">
                        {/* Top Decorative Border */}
                        <div className="h-3 bg-gradient-to-r from-emerald-700 via-amber-500 to-emerald-700 w-full" />
                        
                        <div className="p-6 sm:p-10 space-y-8">
                          {/* Back Button */}
                          <button
                            id="back-from-committee-btn"
                            onClick={() => {
                              setSelectedCommitteeMember(null);
                              // If there is a state in history, go back to clear it
                              if (window.history.state?.prevView === "committee-detail") {
                                window.history.back();
                              } else {
                                window.scrollTo({ top: 0, behavior: "smooth" });
                              }
                            }}
                            className="inline-flex items-center gap-2 text-emerald-950 hover:text-amber-700 font-bold font-alinur text-sm bg-emerald-50 hover:bg-emerald-100 px-5 py-2.5 rounded-full transition-all shadow-sm cursor-pointer border border-emerald-100/50"
                          >
                            <ArrowLeft className="h-4 w-4 text-emerald-850" />
                            <span>হোম পেজে ফিরে যান</span>
                          </button>

                          {/* Member Profile Info */}
                          <div className="flex flex-col items-center text-center space-y-5">
                            <div className="relative">
                              {/* Glowing Outer Ring */}
                              <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-amber-500 to-emerald-600 blur-md opacity-40 animate-pulse"></div>
                              <div className="relative w-40 h-40 sm:w-48 sm:h-48 rounded-full border-4 border-amber-500 overflow-hidden shadow-xl bg-white">
                                <img
                                  src={selectedCommitteeMember.imageUrl}
                                  alt={selectedCommitteeMember.name}
                                  referrerPolicy="no-referrer"
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div className="absolute -bottom-2 right-1/2 translate-x-1/2 bg-gradient-to-r from-amber-500 to-orange-500 text-emerald-950 font-black text-xs px-5 py-1.5 rounded-full shadow-md border border-amber-300/30 whitespace-nowrap">
                                {selectedCommitteeMember.role}
                              </div>
                            </div>

                            <div className="pt-4 space-y-1">
                              <h2 className="text-2xl sm:text-3xl font-black text-emerald-950">
                                {selectedCommitteeMember.name}
                              </h2>
                              <p className="text-xs sm:text-sm font-semibold text-emerald-800 uppercase tracking-wider">
                                সম্মানিত সদস্য — সুফিয়া নূরীয়া দাখিল মাদ্রাসা পরিচালনা কমিটি
                              </p>
                            </div>
                          </div>

                          {/* Divider */}
                          <div className="h-[1.5px] bg-gradient-to-r from-transparent via-amber-500/30 to-transparent" />

                          {/* Detailed Content / Speech */}
                          <div className="space-y-6 max-w-2xl mx-auto">
                            <div className="bg-gradient-to-r from-emerald-50 to-amber-50/20 border-l-4 border-amber-500 p-5 rounded-r-2xl shadow-xs">
                              <h3 className="text-base sm:text-lg font-black text-emerald-950 leading-relaxed">
                                সম্মানিত সদস্যের বিশেষ বাণী ও পরিচিতি
                              </h3>
                            </div>
                            
                            <div className="text-slate-700 leading-relaxed text-base sm:text-lg whitespace-pre-line text-justify px-2">
                              {speechText}
                            </div>
                          </div>

                          {/* Bottom design accent */}
                          <div className="pt-8 text-center">
                            <div className="inline-flex items-center gap-2 text-emerald-950/60 text-xs">
                              <Award className="h-5 w-5 text-amber-500" />
                              <span>সুফিয়া নূরীয়া দাখিল মাদ্রাসা — দ্বীনি ও নৈতিক শিক্ষার এক অনবদ্য নিকেতন</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                }

                return (
                  <div id="home-section" className="w-full">
                    {/* Hero Banner Section */}
                    <section id="hero-banner" className="relative min-h-[420px] sm:min-h-[460px] md:min-h-[500px] w-full bg-emerald-950 text-white overflow-hidden border-b-8 border-amber-500 flex items-center justify-center py-6 sm:py-8 md:py-10">
                      {heroBgUrl ? (
                        <div 
                          className="absolute inset-0 bg-contain bg-center bg-no-repeat transition-all duration-500 z-0 bg-emerald-950"
                          style={{ backgroundImage: `url(${heroBgUrl})` }}
                        />
                      ) : (
                        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-emerald-800/60 via-emerald-950 to-emerald-950 mix-blend-multiply opacity-90 z-0"></div>
                      )}
                      {/* Color Overlay / Opacity Mask */}
                      <div className="absolute inset-0 bg-emerald-950/85 mix-blend-multiply z-0"></div>
                      {/* Abstract Islamic Geometry Overlay Mock */}
                      <div className="absolute inset-0 bg-[linear-gradient(to_right,#047857_1px,transparent_1px),linear-gradient(to_bottom,#047857_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-25 z-0"></div>
 
                      <div className="relative w-full px-4 py-2 text-center z-10 flex flex-col items-center justify-center space-y-2 sm:space-y-3 max-w-3xl mx-auto h-full">
                        {/* শুরুতে (টপ পজিশনে): মাদ্রাসার অফিশিয়াল লোগো */}
                        <motion.div
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.5 }}
                          className="flex justify-center"
                        >
                          {!logoError ? (
                            <div className="h-24 w-24 sm:h-32 sm:w-32 md:h-36 md:w-36 rounded-full overflow-hidden border-4 border-amber-400 bg-white p-1.5 shadow-[0_8px_24px_rgba(0,0,0,0.3)] filter drop-shadow-[0_8px_12px_rgba(0,0,0,0.4)] transition-all hover:scale-105 duration-300 flex items-center justify-center">
                              {logoUrlWithCache !== undefined ? (
                                <img 
                                  key={logoUrlWithCache}
                                  src={logoUrlWithCache} 
                                  alt="সুফিয়া নূরীয়া দাখিল মাদ্রাসা লোগো" 
                                  loading="eager"
                                  className="w-full h-full object-cover rounded-full" 
                                  onError={() => setLogoError(true)}
                                />
                              ) : (
                                <div className="w-full h-full rounded-full bg-slate-200 animate-pulse"></div>
                              )}
                            </div>
                          ) : (
                            <div className="h-24 w-24 sm:h-32 sm:w-32 md:h-36 md:w-36 rounded-full bg-amber-500/10 border-2 border-amber-400 flex items-center justify-center text-amber-400 font-bold text-3xl sm:text-4xl shadow-lg">
                              🕌
                            </div>
                          )}
                        </motion.div>
 
                        {/* লোগোর ঠিক নিচে: মাদ্রাসার নাম */}
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.5, delay: 0.1 }}
                          className="text-center space-y-1.5"
                        >
                          <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-5.5xl xl:text-6xl font-black text-amber-400 font-alinur tracking-tight leading-tight drop-shadow-md">
                            সুফিয়া নূরীয়া দাখিল মাদ্রাসা
                          </h1>
                          <div className="text-sm sm:text-xl md:text-2xl text-emerald-200 font-arabic tracking-wide leading-none mt-1.5 font-medium">
                            المدرسة السوفية النورية الداخلية
                          </div>
                        </motion.div>
 
                        {/* মাদ্রাসার নামের ঠিক নিচে এবং সাব-টাইটেল/বিবরণীর ঠিক ওপরে: মাদ্রাসার সঠিক ঠিকানা */}
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.5, delay: 0.15 }}
                          className="text-xs sm:text-sm md:text-base text-amber-200/90 font-alinur tracking-wide max-w-2xl text-center px-2 font-semibold"
                        >
                          নতুন পল্লান পাড়া, ৪নং ওয়ার্ড, টেকনাফ, কক্সবাজার।
                        </motion.div>
 
                        {/* নামের ঠিক নিচে: সাব-টাইটেল বা বিবরণী */}
                        <motion.p 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.5, delay: 0.2 }}
                          className="text-xs sm:text-sm md:text-base lg:text-lg text-emerald-100/95 font-alinur leading-relaxed max-w-2xl text-center px-2"
                        >
                          জ্ঞান, প্রজ্ঞা এবং ইসলামি মূল্যবোধে আলোকিত একটি অনুকরণীয় বিদ্যাপীঠ। আমরা শিক্ষার্থীদের নৈতিক চরিত্র এবং একাডেমিক শ্রেষ্ঠত্ব গঠনে প্রতিশ্রুতিবদ্ধ
                        </motion.p>
 
                        {/* বিবরণীর ঠিক নিচে: স্থাপিত ১৯৭৫ খ্রিঃ */}
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.5, delay: 0.3 }}
                          className="border border-amber-500/25 bg-emerald-950/40 px-4 py-1.5 rounded-full text-amber-300 font-alinur text-xs sm:text-sm font-semibold tracking-wide shadow-[0_0_15px_rgba(245,158,11,0.06)] backdrop-blur-xs inline-flex items-center gap-1.5"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
                          <span className="font-alinur">স্থাপিত ১৯৭৫ খ্রিঃ</span>
                        </motion.div>
 
                        {/* সবশেষে (বটম পজিশনে): এক নজরে পাঠদান বাটন */}
                        <motion.div 
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.4, delay: 0.4 }}
                          className="pt-2"
                        >
                          {setActiveTab && (
                            <div className="relative p-[3px] rounded-full overflow-hidden animate-button-pulse-glow inline-block hover:scale-105 transition-transform duration-300">
                              {/* Glowing Spinning Gradient Border */}
                              <div className="absolute -inset-[300%] bg-[conic-gradient(from_0deg,#f59e0b,#10b981,#3b82f6,#f59e0b)] animate-border-glow-spin rounded-full" />
                              
                              <motion.button
                                id="view-overview-hero-btn"
                                onClick={() => {
                                    setActiveTab("overview");
                                    window.scrollTo({ top: 0, behavior: "smooth" });
                                }}
                                whileTap={{ scale: 0.95 }}
                                className="relative inline-flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-emerald-950 font-black py-2.5 px-6 sm:py-3 sm:px-8 rounded-full shadow-md transition-all duration-300 cursor-pointer font-alinur text-xs sm:text-sm md:text-base group z-10"
                              >
                                <span>এক নজরে পাঠদান</span>
                                <span className="text-xs sm:text-sm md:text-base transition-transform duration-300 group-hover:translate-x-0.5">➔</span>
                              </motion.button>
                            </div>
                          )}
                        </motion.div>
                      </div>
                    </section>
 
                    {/* Content Container with 100% width and padding */}
                    <div className="w-full px-2 py-12 space-y-16">
                      {/* ক. শিক্ষার্থীদের সাফল্য (Slider/Carousel Section) */}
                      <SuccessStoriesCarousel successStories={successStories} setSelectedStory={setSelectedStory} />

                      {/* খ. মাদ্রাসা পরিচালনা পর্ষদের সম্মানিত সদস্যবৃন্দ (Consolidated Committee Section) */}
                      <section 
                        id="governing-body" 
                        className="space-y-6 sm:space-y-12 bg-gradient-to-br from-emerald-900 via-emerald-950 to-emerald-900 text-white pt-8 pb-8 sm:pt-14 sm:pb-14 px-2 sm:px-6 rounded-3xl border-2 border-amber-500/40 shadow-2xl relative overflow-hidden"
                      >
                        {/* Subtle Decorative Background Circles */}
                        <div className="absolute top-0 left-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl pointer-events-none"></div>
                        <div className="absolute bottom-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

                        {/* Header Section with Custom font "font-alinur" */}
                        <div className="text-center w-full space-y-1.5 sm:space-y-3 relative z-10 font-alinur font-sans">
                          <h2 className="text-[17px] xs:text-xl sm:text-4xl font-black text-amber-400 tracking-tight leading-none whitespace-nowrap" style={{ fontFamily: "Alinur Tatsama, sans-serif" }}>
                            মাদ্রাসা পরিচালনা কমিটির সদস্যবৃন্দ
                          </h2>
                          <p className="text-[11px] sm:text-base text-emerald-100 font-semibold max-w-2xl mx-auto leading-normal font-sans" style={{ fontFamily: "Alinur Tatsama, sans-serif" }}>
                            মাদ্রাসার সুষ্ঠু ও সুশৃঙ্খল পরিচালনায় নিয়োজিত পরিচালনা কমিটির সম্মানিত সদস্যবৃন্দ
                          </p>
                          <div className="h-1 w-20 sm:h-1.5 sm:w-28 bg-gradient-to-r from-amber-400 via-orange-500 to-amber-400 mx-auto rounded-full mt-2 sm:mt-4 shadow-sm"></div>
                        </div>

                        {/* 2-Column Vertical Grid Layout for All Committee Members */}
                        <div className="grid grid-cols-2 gap-3 sm:gap-6 max-w-4xl mx-auto w-full relative z-10 font-alinur">
                          {committee.map((member, idx) => {
                            const isEven = idx % 2 === 0;
                            const bannerBg = isEven ? "bg-[#046a38]" : "bg-[#e65100]";
                            
                            return (
                              <motion.div
                                key={member.id}
                                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.4, delay: Math.min(idx * 0.05, 0.3) }}
                                className="bg-white rounded-2xl border border-gray-100 shadow-md hover:shadow-xl hover:scale-[1.02] transform transition-all duration-300 flex flex-col overflow-hidden group font-alinur text-slate-800 font-sans"
                              >
                                {/* Top Ribbon Banner (Role) */}
                                <div 
                                  className={`w-full py-2 sm:py-3 px-3 text-center text-white font-extrabold text-[10px] xs:text-xs sm:text-sm select-none truncate ${bannerBg}`}
                                  style={{ fontFamily: "Alinur Tatsama, sans-serif" }}
                                >
                                  {member.role || "সদস্য"}
                                </div>

                                {/* Full-width Square Profile Image Frame (Prevents wasting space) */}
                                <div className="w-full aspect-square border-b border-gray-100 overflow-hidden relative bg-slate-50 shrink-0">
                                  <img
                                    src={member.imageUrl || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=300&q=80"}
                                    alt={member.name}
                                    referrerPolicy="no-referrer"
                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                  />
                                </div>

                                <div className="p-3 sm:p-4 flex flex-col items-center text-center space-y-2 sm:space-y-3 w-full flex-1 justify-between">
                                  {/* Member Name */}
                                  <div className="flex-1 flex items-center justify-center min-h-[1.5rem] sm:min-h-[2.5rem]">
                                    <h4 className="font-extrabold text-[11px] xs:text-sm sm:text-base text-emerald-950 font-alinur leading-tight text-center">
                                      {member.name}
                                    </h4>
                                  </div>

                                  {/* Button Area (Always Visible) */}
                                  <div className="h-6 sm:h-8 flex items-center justify-center shrink-0">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (onSelectMember) {
                                          onSelectMember(member);
                                        } else {
                                          setSelectedCommitteeMember(member);
                                          window.scrollTo({ top: 0, behavior: "smooth" });
                                        }
                                      }}
                                      className="inline-flex items-center gap-1 px-3 py-1 sm:px-4 sm:py-1.5 bg-[#e8f5e9] hover:bg-[#c8e6c9] border border-emerald-200 text-emerald-800 font-extrabold text-[9px] xs:text-[10px] sm:text-xs rounded-full transition-all duration-200 cursor-pointer shadow-xs select-none"
                                    >
                                      <span>বিস্তারিত</span>
                                      <span className="text-xs sm:text-sm font-bold">→</span>
                                    </button>
                                  </div>
                                </div>
                              </motion.div>
                            );
                          })}
                        </div>

                        {/* Premium Navigation Button */}
                        {setActiveTab && (
                          <div className="text-center pt-2 sm:pt-8 relative z-10 font-alinur">
                            <button
                              id="view-all-committee-btn"
                              onClick={() => {
                                setActiveTab("committee");
                                window.scrollTo({ top: 0, behavior: "smooth" });
                              }}
                              className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-600 text-emerald-950 font-black py-3 px-8 sm:py-3.5 sm:px-10 rounded-full border-2 border-amber-300 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 active:scale-95 cursor-pointer text-xs sm:text-base font-alinur"
                            >
                              <span>সকল সদস্য দেখুন</span>
                              <span className="text-base">➔</span>
                            </button>
                          </div>
                        )}
                      </section>

                      {/* ঘ. কন্টাক্ট এবং ইমেইল সেকশন (Contact & Email Form) */}
                      {(() => {
                        const contactData = {
                          address: contactSettings?.address || "নতুন পল্লান পাড়া, ৪নং ওয়ার্ড, টেকনাফ, কক্সবাজার",
                          officePhone: contactSettings?.officePhone || "01811111111",
                          principalPhone: contactSettings?.principalPhone || "01822222222",
                          email: contactSettings?.email || "sufianooria@gmail.com",
                          facebook: contactSettings?.facebook || "",
                          linkedin: contactSettings?.linkedin || "",
                          telegram: contactSettings?.telegram || "",
                          whatsapp: contactSettings?.whatsapp || "",
                        };

                        return (
                          <section id="contact-and-map" className="border border-emerald-100 rounded-3xl overflow-hidden shadow-2xl bg-white font-alinur relative select-none">
                            <div className="grid lg:grid-cols-12 gap-0">
                              {/* Left Column: Contact details and Maps */}
                              <div className={`bg-gradient-to-br from-emerald-900 via-emerald-950 to-emerald-900 text-white p-8 sm:p-12 flex flex-col justify-between relative overflow-hidden min-h-[500px] transition-all duration-700 ${
                                isCurtainOpen ? "lg:col-span-8" : "lg:col-span-12"
                              }`}>
                                {/* Subtle background decoration */}
                                <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-800/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
                                <div className="absolute bottom-0 left-0 w-80 h-80 bg-amber-400/5 rounded-full blur-2xl -ml-24 -mb-24"></div>

                                <div className="relative z-10 space-y-8">
                                  <div className="space-y-3">
                                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/10 border border-amber-400/20 text-amber-300 text-xs font-bold tracking-wider font-alinur">
                                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
                                      অফিসিয়াল যোগাযোগ
                                    </div>
                                    <h3 className="text-2xl sm:text-4xl font-extrabold text-amber-400 font-alinur leading-tight">প্রাতিষ্ঠানিক যোগাযোগ ও ঠিকানা</h3>
                                    <p className="text-emerald-100/80 text-xs sm:text-sm font-alinur">সুফিয়া নূরীয়া দাখিল মাদ্রাসার সাথে যেকোনো তথ্য, পরামর্শ বা অভিযোগের জন্য সরাসরি যোগাযোগ করুন।</p>
                                  </div>

                                  <div className="grid md:grid-cols-2 gap-8 items-center pt-2">
                                    {/* Text details card */}
                                    <div className="space-y-5 bg-emerald-950/40 p-6 rounded-2xl border border-emerald-800/30 backdrop-blur-xs font-alinur">
                                      {/* Address */}
                                      <div className="flex items-start space-x-3.5">
                                        <div className="bg-emerald-800 p-2.5 rounded-xl border border-emerald-700/50 mt-0.5 shadow-md flex-shrink-0">
                                          <motion.div
                                            animate={{ y: [0, -4, 0] }}
                                            transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
                                          >
                                            <MapPin className="h-5 w-5 text-amber-400" />
                                          </motion.div>
                                        </div>
                                        <div>
                                          <h4 className="font-extrabold text-[11px] uppercase tracking-wider text-amber-300 font-alinur">ঠিকানা</h4>
                                          <p className="text-sm text-emerald-100 leading-relaxed font-alinur font-medium mt-0.5">
                                            {contactData.address}
                                          </p>
                                        </div>
                                      </div>

                                      {/* Office Contact */}
                                      <div className="flex items-start space-x-3.5">
                                        <div className="bg-emerald-800 p-2.5 rounded-xl border border-emerald-700/50 mt-0.5 shadow-md flex-shrink-0">
                                          <motion.div
                                            animate={{ rotate: [-8, 8, -8, 8, 0] }}
                                            transition={{ repeat: Infinity, duration: 1.4, ease: "easeInOut" }}
                                          >
                                            <Phone className="h-5 w-5 text-amber-400" />
                                          </motion.div>
                                        </div>
                                        <div>
                                          <h4 className="font-extrabold text-[11px] uppercase tracking-wider text-amber-300 font-alinur">অফিস কন্টাক্ট নাম্বার</h4>
                                          <p className="text-sm text-emerald-100 font-alinur font-bold mt-0.5 tracking-wide">
                                            {toEnglishDigits(contactData.officePhone)}
                                          </p>
                                        </div>
                                      </div>

                                      {/* Principal Contact */}
                                      <div className="flex items-start space-x-3.5">
                                        <div className="bg-emerald-800 p-2.5 rounded-xl border border-emerald-700/50 mt-0.5 shadow-md flex-shrink-0">
                                          <motion.div
                                            animate={{ rotate: [8, -8, 8, -8, 0] }}
                                            transition={{ repeat: Infinity, duration: 1.4, ease: "easeInOut", delay: 0.3 }}
                                          >
                                            <Phone className="h-5 w-5 text-amber-400" />
                                          </motion.div>
                                        </div>
                                        <div>
                                          <h4 className="font-extrabold text-[11px] uppercase tracking-wider text-amber-300 font-alinur">প্রধান শিক্ষকের নাম্বার</h4>
                                          <p className="text-sm text-emerald-100 font-alinur font-bold mt-0.5 tracking-wide">
                                            {toEnglishDigits(contactData.principalPhone)}
                                          </p>
                                        </div>
                                      </div>

                                      {/* Official Email */}
                                      <div className="flex items-start space-x-3.5">
                                        <div className="bg-emerald-800 p-2.5 rounded-xl border border-emerald-700/50 mt-0.5 shadow-md flex-shrink-0">
                                          <motion.div
                                            animate={{ scale: [1, 1.05, 1] }}
                                            transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                                          >
                                            <Mail className="h-5 w-5 text-amber-400" />
                                          </motion.div>
                                        </div>
                                        <div>
                                          <h4 className="font-extrabold text-[11px] uppercase tracking-wider text-amber-300 font-alinur">অফিসিয়াল ইমেইল</h4>
                                          <p className="text-sm text-emerald-100 font-alinur font-medium mt-0.5 break-all">
                                            {contactData.email}
                                          </p>
                                        </div>
                                      </div>

                                      {/* Secret trigger (only if not locked yet) */}
                                      {!contactSettings?.isIconUploaded && (
                                        <div className="mt-4 pt-4 border-t border-emerald-800/20 text-left relative z-20">
                                          <button
                                            type="button"
                                            onClick={() => setShowSecretUpload(!showSecretUpload)}
                                            className="text-[9px] text-emerald-300/40 hover:text-amber-400 font-alinur transition-colors cursor-pointer"
                                          >
                                            {showSecretUpload ? "[আপলোড প্যানেল বন্ধ করুন]" : "[গোপন আইকন আপলোড গেটওয়ে]"}
                                          </button>
                                        </div>
                                      )}
                                    </div>

                                    {/* Orbiting display column with guideline text */}
                                    <div className="flex flex-col justify-center items-center space-y-4 w-full">
                                      <div className="flex justify-center items-center relative overflow-visible h-64 sm:h-80 w-full">
                                        {/* Central Glow Badge */}
                                        <div className="relative w-36 h-36 sm:w-44 sm:h-44 rounded-full bg-emerald-950 border-4 border-amber-400 flex flex-col items-center justify-center text-center shadow-2xl z-10 hover:scale-105 transition-all duration-300 select-none overflow-hidden">
                                          <div className="absolute inset-0 rounded-full bg-amber-400/10 animate-ping duration-[3000ms]"></div>
                                          <img
                                            key={contactLogoUrl}
                                            src={contactLogoUrl}
                                            alt="Madrasah Logo"
                                            loading="eager"
                                            className="absolute inset-0 w-full h-full object-cover rounded-full"
                                            onError={(e) => {
                                              e.currentTarget.onerror = null;
                                              e.currentTarget.src = "https://cdn-icons-png.flaticon.com/512/2913/2913520.png";
                                            }}
                                          />
                                        </div>

                                        {/* Rotating Orbit Path */}
                                        <motion.div
                                          animate={{ rotate: 360 }}
                                          transition={{ repeat: Infinity, duration: 30, ease: "linear" }}
                                          className="absolute w-52 h-52 sm:w-64 sm:h-64 pointer-events-none flex items-center justify-center"
                                        >
                                          {/* Ring Line */}
                                          <div className="absolute inset-0 rounded-full border border-dashed border-amber-400/25"></div>

                                          {/* Orbiting Satellites */}
                                          {[
                                            {
                                              id: "map",
                                              icon: MapPin,
                                              label: "মাদ্রাসার মানচিত্র অবস্থান",
                                              action: () => window.open(`https://maps.google.com/?q=${encodeURIComponent(contactData.address)}`, "_blank"),
                                              isEmpty: false,
                                              colorClass: "bg-emerald-800 hover:bg-emerald-700 border-amber-400 text-amber-400",
                                              uploadedUrl: contactSettings?.mapIconUrl
                                            },
                                            {
                                              id: "office_phone",
                                              icon: Phone,
                                              label: "অফিস নাম্বার কল করুন",
                                              action: () => window.open(`tel:${contactData.officePhone}`),
                                              isEmpty: !contactData.officePhone,
                                              colorClass: "bg-emerald-800 hover:bg-emerald-700 border-amber-400 text-amber-400",
                                              uploadedUrl: contactSettings?.officePhoneIconUrl
                                            },
                                            {
                                              id: "principal_phone",
                                              icon: Phone,
                                              label: "প্রধান শিক্ষককে কল করুন",
                                              action: () => window.open(`tel:${contactData.principalPhone}`),
                                              isEmpty: !contactData.principalPhone,
                                              colorClass: "bg-emerald-800 hover:bg-emerald-700 border-amber-400 text-amber-400",
                                              uploadedUrl: contactSettings?.principalPhoneIconUrl
                                            },
                                            {
                                              id: "email",
                                              icon: Mail,
                                              label: "অফিসিয়াল ইমেল পাঠান",
                                              action: () => window.open(`mailto:${contactData.email}`),
                                              isEmpty: !contactData.email,
                                              colorClass: "bg-emerald-800 hover:bg-emerald-700 border-amber-400 text-amber-400",
                                              uploadedUrl: contactSettings?.emailIconUrl
                                            },
                                            {
                                              id: "facebook",
                                              icon: Facebook,
                                              label: "ফেসবুক পেজ",
                                              action: () => handleSocialClick(contactData.facebook, "ফেসবুক"),
                                              isEmpty: !contactData.facebook,
                                              colorClass: contactData.facebook ? "bg-emerald-800 hover:bg-emerald-700 border-amber-400 text-amber-400" : "bg-red-600 hover:bg-red-500 border-red-400 text-white",
                                              uploadedUrl: contactSettings?.facebookIconUrl
                                            },
                                            {
                                              id: "linkedin",
                                              icon: Linkedin,
                                              label: "লিঙ্কডইন প্রোফাইল",
                                              action: () => handleSocialClick(contactData.linkedin, "লিঙ্কডইন"),
                                              isEmpty: !contactData.linkedin,
                                              colorClass: contactData.linkedin ? "bg-emerald-800 hover:bg-emerald-700 border-amber-400 text-amber-400" : "bg-red-600 hover:bg-red-500 border-red-400 text-white",
                                              uploadedUrl: contactSettings?.linkedinIconUrl
                                            },
                                            {
                                              id: "telegram",
                                              icon: Send,
                                              label: "টেলিগ্রাম গ্রুপ",
                                              action: () => handleSocialClick(contactData.telegram, "টেলিগ্রাম"),
                                              isEmpty: !contactData.telegram,
                                              colorClass: contactData.telegram ? "bg-emerald-800 hover:bg-emerald-700 border-amber-400 text-amber-400" : "bg-red-600 hover:bg-red-500 border-red-400 text-white",
                                              uploadedUrl: contactSettings?.telegramIconUrl
                                            },
                                            {
                                              id: "whatsapp",
                                              icon: MessageCircle,
                                              label: "হোয়াটসঅ্যাপ কন্টাক্ট",
                                              action: () => handleSocialClick(contactData.whatsapp, "হোয়াটসঅ্যাপ"),
                                              isEmpty: !contactData.whatsapp,
                                              colorClass: contactData.whatsapp ? "bg-emerald-800 hover:bg-emerald-700 border-amber-400 text-amber-400" : "bg-red-600 hover:bg-red-500 border-red-400 text-white",
                                              uploadedUrl: contactSettings?.whatsappIconUrl
                                            }
                                          ].map((sat, index) => {
                                            const angleRad = (index * 45 * Math.PI) / 180;
                                            const radius = isMobile ? 96 : 124;
                                            const cosVal = Math.cos(angleRad);
                                            const sinVal = Math.sin(angleRad);
                                            const SatIcon = sat.icon;

                                            return (
                                              <div
                                                key={sat.id}
                                                className="absolute pointer-events-auto"
                                                style={{
                                                  left: "50%",
                                                  top: "50%",
                                                  transform: `translate(-50%, -50%) translate(${cosVal * radius}px, ${sinVal * radius}px)`
                                                }}
                                              >
                                                <button
                                                  type="button"
                                                  onClick={sat.action}
                                                  title={sat.label}
                                                  className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 ${sat.colorClass} flex items-center justify-center cursor-pointer hover:scale-115 active:scale-95 hover:shadow-[0_0_12px_rgba(245,158,11,0.45)] transition-all duration-200 overflow-hidden`}
                                                >
                                                  <motion.div
                                                    animate={{ rotate: -360 }}
                                                    transition={{ repeat: Infinity, duration: 30, ease: "linear" }}
                                                    className="w-full h-full flex items-center justify-center"
                                                  >
                                                    {sat.uploadedUrl ? (
                                                      <img
                                                        src={sat.uploadedUrl}
                                                        alt={sat.label}
                                                        className="w-full h-full object-cover"
                                                        referrerPolicy="no-referrer"
                                                      />
                                                    ) : (
                                                      <SatIcon className="h-5 w-5 sm:h-6 sm:w-6" />
                                                    )}
                                                  </motion.div>
                                                </button>
                                              </div>
                                            );
                                          })}
                                        </motion.div>
                                      </div>

                                      {/* User Guideline Text */}
                                      <p className="text-center text-[10px] sm:text-[11px] text-amber-300 font-bold font-alinur tracking-wide animate-pulse leading-normal pt-1 z-10 max-w-[90%]">
                                        শর্টকাট লিংক দিয়ে যোগাযোগ করতে আইকনে ক্লিক করুন
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Right Column: Theater Curtain Reveal Form */}
                              <div className={`bg-[#fdfdfb] relative overflow-hidden transition-all duration-700 ease-in-out flex flex-col justify-center items-center ${
                                isCurtainOpen
                                  ? "lg:col-span-4 p-6 sm:p-10 min-h-[620px] w-full border-l border-emerald-50"
                                  : "lg:col-span-12 p-3 min-h-0 h-[80px] w-[calc(100%-2rem)] max-w-md mx-auto my-6 rounded-2xl border-2 border-emerald-800 bg-gradient-to-r from-emerald-900 to-emerald-950 shadow-xl"
                              }`}>
                                {/* Curtain Overlay */}
                                <AnimatePresence>
                                  {!isCurtainOpen && (
                                    <motion.div
                                      key="theatre-curtain"
                                      className="absolute inset-0 z-30 flex items-center justify-center overflow-hidden"
                                      exit={{ opacity: 0 }}
                                      transition={{ duration: 0.8, delay: 0.5 }}
                                    >
                                      {/* Left Curtain Panel */}
                                      <motion.div
                                        initial={{ x: 0 }}
                                        exit={{ x: "-100%" }}
                                        transition={{ duration: 1.2, ease: [0.77, 0, 0.175, 1] }}
                                        className="absolute inset-y-0 left-0 w-1/2 bg-gradient-to-r from-emerald-800 via-emerald-900 to-emerald-950 border-r-2 border-amber-400 flex items-center justify-end shadow-2xl"
                                      >
                                        {/* Golden trim detail */}
                                        <div className="absolute inset-y-0 right-1 w-0.5 bg-amber-400/50"></div>
                                        {/* Curtain folds effect */}
                                        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,0.2)_0%,transparent_50%,rgba(0,0,0,0.15)_100%)] bg-[length:30px_100%] opacity-40"></div>
                                      </motion.div>

                                      {/* Right Curtain Panel */}
                                      <motion.div
                                        initial={{ x: 0 }}
                                        exit={{ x: "100%" }}
                                        transition={{ duration: 1.2, ease: [0.77, 0, 0.175, 1] }}
                                        className="absolute inset-y-0 right-0 w-1/2 bg-gradient-to-l from-emerald-800 via-emerald-900 to-emerald-950 border-l-2 border-amber-400 flex items-center justify-start shadow-2xl"
                                      >
                                        {/* Golden trim detail */}
                                        <div className="absolute inset-y-0 left-1 w-0.5 bg-amber-400/50"></div>
                                        {/* Curtain folds effect */}
                                        <div className="absolute inset-0 bg-[linear-gradient(-90deg,rgba(0,0,0,0.2)_0%,transparent_50%,rgba(0,0,0,0.15)_100%)] bg-[length:30px_100%] opacity-40"></div>
                                      </motion.div>

                                      {/* Golden Curtain Rope down the middle */}
                                      <motion.div
                                        initial={{ scaleY: 1 }}
                                        exit={{ scaleY: 0, opacity: 0 }}
                                        transition={{ duration: 0.5 }}
                                        className="absolute inset-y-0 left-[calc(50%-1.5px)] w-[3px] bg-amber-400 z-10 origin-top shadow-[0_0_8px_rgba(245,158,11,0.6)]"
                                      ></motion.div>

                                      {/* Interactive Button */}
                                      <motion.button
                                        type="button"
                                        id="curtain-reveal-trigger"
                                        onClick={() => setIsCurtainOpen(true)}
                                        initial={{ scale: 0.9, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        exit={{ scale: 0.8, opacity: 0 }}
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        className="relative z-20 flex items-center gap-2 px-5 py-3.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-emerald-950 font-alinur font-black text-sm rounded-full shadow-[0_8px_25px_rgba(245,158,11,0.35)] border-2 border-amber-300 transition-all duration-300 cursor-pointer"
                                      >
                                        <span>সরাসরি বার্তা পাঠাতে ক্লিক করুন</span>
                                        {/* Continuously Animated Pointer Icon */}
                                        <motion.span
                                          animate={{ y: [0, -4, 0], scale: [1, 1.12, 1] }}
                                          transition={{ repeat: Infinity, duration: 1.2, ease: "easeInOut" }}
                                          className="text-lg"
                                        >
                                          👇
                                        </motion.span>
                                      </motion.button>
                                    </motion.div>
                                  )}
                                </AnimatePresence>

                                {/* Form Layout (Revealed beneath Curtains) */}
                                <div className={`space-y-4 font-alinur select-none transition-all duration-500 ${
                                  isCurtainOpen ? "opacity-100 pointer-events-auto scale-100" : "opacity-0 pointer-events-none scale-95 h-0 overflow-hidden"
                                }`}>
                                  <div className="space-y-1">
                                    <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-850 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-100 font-alinur">
                                      সরাসরি বার্তা পাঠানোর ফরম
                                    </span>
                                    <h3 className="text-lg sm:text-xl font-bold text-emerald-950 font-alinur leading-snug">
                                      আপনার যেকোন অভিযোগ বা পরামর্শ সরাসরি আমার কাছে পাঠিয়ে দিন
                                    </h3>
                                  </div>

                                  <form onSubmit={handleContactSubmit} className="space-y-3 pt-1" noValidate>
                                    {/* Name Input */}
                                    <div className="space-y-0.5">
                                      <label htmlFor="contact-name" className="text-[11px] font-bold text-emerald-900">আপনার নাম</label>
                                      <input
                                        id="contact-name"
                                        type="text"
                                        value={contactName}
                                        onChange={(e) => {
                                          setContactName(e.target.value);
                                          if (e.target.value.trim()) {
                                            setFormErrors((prev) => ({ ...prev, name: undefined }));
                                          }
                                        }}
                                        placeholder="আপনার নাম লিখুন"
                                        className={`w-full px-3.5 py-2 rounded-xl border text-xs focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all font-alinur ${
                                          formErrors.name ? "border-red-500 bg-red-50/20" : "border-gray-300"
                                        }`}
                                      />
                                      {formErrors.name && (
                                        <p className="text-[10px] text-red-600 font-bold font-alinur pl-1 mt-0.5 animate-pulse">
                                          {formErrors.name}
                                        </p>
                                      )}
                                    </div>

                                    {/* Email Input */}
                                    <div className="space-y-0.5">
                                      <label htmlFor="contact-email" className="text-[11px] font-bold text-emerald-900">ইমেইল ঠিকানা</label>
                                      <input
                                        id="contact-email"
                                        type="email"
                                        value={contactEmail}
                                        onChange={(e) => {
                                          setContactEmail(e.target.value);
                                          if (e.target.value.trim()) {
                                            setFormErrors((prev) => ({ ...prev, email: undefined }));
                                          }
                                        }}
                                        placeholder="আপনার ইমেইল লিখুন"
                                        className={`w-full px-3.5 py-2 rounded-xl border text-xs focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all font-alinur ${
                                          formErrors.email ? "border-red-500 bg-red-50/20" : "border-gray-300"
                                        }`}
                                      />
                                      {formErrors.email && (
                                        <p className="text-[10px] text-red-600 font-bold font-alinur pl-1 mt-0.5 animate-pulse">
                                          {formErrors.email}
                                        </p>
                                      )}
                                    </div>

                                    {/* Phone Input */}
                                    <div className="space-y-0.5">
                                      <label htmlFor="contact-phone" className="text-[11px] font-bold text-emerald-900">ফোন নাম্বার (ইংরেজি সংখ্যায়)</label>
                                      <input
                                        id="contact-phone"
                                        type="text"
                                        value={contactPhone}
                                        onChange={(e) => {
                                          const englishDigits = toEnglishDigits(e.target.value);
                                          const numeric = englishDigits.replace(/[^0-9+]/g, "");
                                          setContactPhone(numeric);
                                          if (numeric.trim()) {
                                            setFormErrors((prev) => ({ ...prev, phone: undefined }));
                                          }
                                        }}
                                        placeholder="আপনার ফোন নাম্বার লিখুন"
                                        className={`w-full px-3.5 py-2 rounded-xl border text-xs focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all font-mono ${
                                          formErrors.phone ? "border-red-500 bg-red-50/20" : "border-gray-300"
                                        }`}
                                      />
                                      {formErrors.phone && (
                                        <p className="text-[10px] text-red-600 font-bold font-alinur pl-1 mt-0.5 animate-pulse">
                                          {formErrors.phone}
                                        </p>
                                      )}
                                    </div>

                                    {/* Address Input */}
                                    <div className="space-y-0.5">
                                      <label htmlFor="contact-address" className="text-[11px] font-bold text-emerald-900">আপনার ঠিকানা</label>
                                      <input
                                        id="contact-address"
                                        type="text"
                                        value={contactAddress}
                                        onChange={(e) => {
                                          setContactAddress(e.target.value);
                                          if (e.target.value.trim()) {
                                            setFormErrors((prev) => ({ ...prev, address: undefined }));
                                          }
                                        }}
                                        placeholder="আপনার ঠিকানা লিখুন"
                                        className={`w-full px-3.5 py-2 rounded-xl border text-xs focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all font-alinur ${
                                          formErrors.address ? "border-red-500 bg-red-50/20" : "border-gray-300"
                                        }`}
                                      />
                                      {formErrors.address && (
                                        <p className="text-[10px] text-red-600 font-bold font-alinur pl-1 mt-0.5 animate-pulse">
                                          {formErrors.address}
                                        </p>
                                      )}
                                    </div>

                                    {/* Conditional Selectors */}
                                    <div className="space-y-1">
                                      <label className="text-[11px] font-bold text-emerald-900">বার্তার ধরণ</label>
                                      <div className="flex gap-4">
                                        <label className="flex items-center space-x-1.5 text-xs text-slate-700 cursor-pointer">
                                          <input
                                            type="radio"
                                            name="contactFormType"
                                            value="অভিযোগ"
                                            checked={contactFormType === "অভিযোগ"}
                                            onChange={() => {
                                              setContactFormType("অভিযোগ");
                                              setContactCategory(COMPLAINT_OPTIONS[0]);
                                              setFormErrors((prev) => ({ ...prev, category: undefined }));
                                            }}
                                            className="accent-emerald-700 h-4 w-4"
                                          />
                                          <span>অভিযোগ</span>
                                        </label>
                                        <label className="flex items-center space-x-1.5 text-xs text-slate-700 cursor-pointer">
                                          <input
                                            type="radio"
                                            name="contactFormType"
                                            value="পরামর্শ"
                                            checked={contactFormType === "পরামর্শ"}
                                            onChange={() => {
                                              setContactFormType("পরামর্শ");
                                              setContactCategory(SUGGESTION_OPTIONS[0]);
                                              setFormErrors((prev) => ({ ...prev, category: undefined }));
                                            }}
                                            className="accent-emerald-700 h-4 w-4"
                                          />
                                          <span>পরামর্শ</span>
                                        </label>
                                      </div>
                                    </div>

                                    {/* Dynamic Category Dropdown */}
                                    <div className="space-y-0.5">
                                      <label htmlFor="contact-category" className="text-[11px] font-bold text-emerald-900">ধরণ সিলেক্ট করুন</label>
                                      <select
                                        id="contact-category"
                                        value={contactCategory}
                                        onChange={(e) => {
                                          setContactCategory(e.target.value);
                                          if (e.target.value.trim()) {
                                            setFormErrors((prev) => ({ ...prev, category: undefined }));
                                          }
                                        }}
                                        className={`w-full px-3 py-2 rounded-xl border text-xs focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all font-alinur bg-white ${
                                          formErrors.category ? "border-red-500 bg-red-50/20" : "border-gray-300"
                                        }`}
                                      >
                                        {(contactFormType === "অভিযোগ" ? COMPLAINT_OPTIONS : SUGGESTION_OPTIONS).map((opt) => (
                                          <option key={opt} value={opt}>
                                            {opt}
                                          </option>
                                        ))}
                                      </select>
                                      {formErrors.category && (
                                        <p className="text-[10px] text-red-600 font-bold font-alinur pl-1 mt-0.5 animate-pulse">
                                          {formErrors.category}
                                        </p>
                                      )}
                                    </div>

                                    {/* Message Textarea */}
                                    <div className="space-y-0.5 relative">
                                      <div className="flex justify-between items-center">
                                        <label htmlFor="contact-message" className="text-[11px] font-bold text-emerald-900">বিস্তারিত লিখুন</label>
                                        <span className="text-[10px] text-gray-500 font-mono">
                                          {contactMessage.length} / ৩০০
                                        </span>
                                      </div>
                                      <textarea
                                        id="contact-message"
                                        maxLength={300}
                                        rows={3}
                                        value={contactMessage}
                                        onChange={(e) => {
                                          setContactMessage(e.target.value);
                                          if (e.target.value.trim()) {
                                            setFormErrors((prev) => ({ ...prev, message: undefined }));
                                          }
                                        }}
                                        placeholder="বিস্তারিত লিখুন"
                                        className={`w-full px-3.5 py-2 rounded-xl border text-xs focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all resize-none font-alinur ${
                                          formErrors.message ? "border-red-500 bg-red-50/20" : "border-gray-300"
                                        }`}
                                      ></textarea>
                                      {formErrors.message && (
                                        <p className="text-[10px] text-red-600 font-bold font-alinur pl-1 mt-0.5 animate-pulse">
                                          {formErrors.message}
                                        </p>
                                      )}
                                    </div>

                                    {/* Submitting Status / Error Display */}
                                    {submitStatus === "error" && (
                                      <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs font-medium">
                                        দুঃখিত, বার্তাটি পাঠানো যায়নি। অনুগ্রহ করে পুনরায় চেষ্টা করুন।
                                      </div>
                                    )}

                                    {/* Submit Button */}
                                    <motion.button
                                      id="contact-submit-btn"
                                      type="submit"
                                      disabled={isSubmitting}
                                      whileHover={{ scale: 1.02 }}
                                      whileTap={{ scale: 0.98 }}
                                      className="w-full bg-emerald-800 hover:bg-emerald-900 text-amber-400 hover:text-amber-300 font-bold py-3 px-4 rounded-xl shadow-md transition-all duration-150 flex items-center justify-center gap-2 text-xs disabled:bg-emerald-700 disabled:cursor-not-allowed cursor-pointer font-alinur"
                                    >
                                      <Send className="h-4 w-4" />
                                      <span>বার্তা পাঠান</span>
                                    </motion.button>
                                  </form>
                                </div>
                              </div>
                            </div>

                            {/* One-Time Imgbb Upload Panel */}
                            {showSecretUpload && !contactSettings?.isIconUploaded && (
                              <div className="border-t border-emerald-100 bg-amber-50/40 p-6 sm:p-8 font-alinur relative z-20">
                                <div className="max-w-4xl mx-auto space-y-6">
                                  <div className="text-center space-y-2">
                                    <h4 className="text-lg font-black text-emerald-900">কন্টাক্ট আইকন ওয়ান-টাইম আপলোড গেটওয়ে</h4>
                                    <p className="text-xs text-emerald-800">
                                      এই প্যানেল থেকে প্রতিটি আইকনের কাস্টম ইমেজ আপলোড করতে পারবেন। সেভ করার সাথে সাথে এই প্যানেলটি চিরতরে লক ও রিমুভ হয়ে যাবে।
                                    </p>
                                  </div>

                                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                                    {[
                                      { id: "map", label: "মানচিত্র (Map)" },
                                      { id: "office_phone", label: "অফিস নাম্বার (Office)" },
                                      { id: "principal_phone", label: "প্রধান শিক্ষক (Principal)" },
                                      { id: "email", label: "অফিসিয়াল ইমেইল (Email)" },
                                      { id: "facebook", label: "ফেসবুক (Facebook)" },
                                      { id: "linkedin", label: "লিঙ্কডইন (LinkedIn)" },
                                      { id: "telegram", label: "টেলিগ্রাম (Telegram)" },
                                      { id: "whatsapp", label: "হোয়াটসঅ্যাপ (WhatsApp)" },
                                    ].map((item) => {
                                      const status = uploadingStatus[item.id] || "idle";
                                      const uploadedUrl = uploadedIcons[item.id];

                                      return (
                                        <div key={item.id} className="bg-white p-4 rounded-xl border border-emerald-100 shadow-sm flex flex-col justify-between space-y-3">
                                          <div className="space-y-1">
                                            <span className="text-xs font-bold text-emerald-950 block">{item.label}</span>
                                            {uploadedUrl ? (
                                              <div className="w-10 h-10 rounded-full border border-emerald-200 overflow-hidden bg-slate-50 flex items-center justify-center">
                                                <img src={uploadedUrl} className="w-full h-full object-cover" />
                                              </div>
                                            ) : (
                                              <div className="w-10 h-10 rounded-full border border-dashed border-gray-300 flex items-center justify-center text-xs text-gray-400">
                                                কোনো ছবি নেই
                                              </div>
                                            )}
                                          </div>

                                          <div className="space-y-2">
                                            <input
                                              type="file"
                                              accept="image/*"
                                              className="hidden"
                                              id={`file-input-${item.id}`}
                                              onChange={async (e) => {
                                                const file = e.target.files?.[0];
                                                if (file) {
                                                  await handleIconUpload(item.id, file);
                                                }
                                              }}
                                            />
                                            <label
                                              htmlFor={`file-input-${item.id}`}
                                              className={`w-full text-center block text-[10px] font-bold py-1.5 px-3 rounded-lg border cursor-pointer transition-all ${
                                                status === "uploading"
                                                  ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                                                  : "bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100"
                                              }`}
                                            >
                                              {status === "uploading" ? "আপলোড হচ্ছে..." : uploadedUrl ? "পরিবর্তন করুন" : "ছবি সিলেক্ট করুন"}
                                            </label>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>

                                  <div className="text-center pt-4">
                                    <button
                                      type="button"
                                      onClick={handleSaveAndLockIcons}
                                      disabled={Object.keys(uploadedIcons).length === 0}
                                      className="bg-emerald-800 hover:bg-emerald-900 text-amber-400 font-extrabold py-3 px-8 rounded-full shadow-lg border-2 border-amber-400 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer text-xs transition-all active:scale-95"
                                    >
                                      সকল আপলোডকৃত আইকন সংরক্ষণ ও লক করুন (চিরতরে হাইড হবে)
                                    </button>
                                  </div>
                                </div>
                              </div>
                            )}
                          </section>
                        );
                      })()}

                      {/* Warning Popup Modal */}
                      {showWarningModal && (
                        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in font-alinur">
                          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full border border-red-100 overflow-hidden text-center p-6 space-y-4">
                            <div className="mx-auto w-16 h-16 rounded-full bg-red-50 flex items-center justify-center text-red-500 animate-pulse">
                              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                              </svg>
                            </div>
                            <h3 className="text-lg font-bold text-red-700">লিংক সংযুক্ত নেই</h3>
                            <p className="text-sm text-gray-600 leading-relaxed font-sans">{warningMessage}</p>
                            <button
                              onClick={() => setShowWarningModal(false)}
                              className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-xl text-xs transition-colors shadow-md active:scale-95 cursor-pointer"
                            >
                              বন্ধ করুন
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Custom Premium Form Success Popup (Alinur Tatsama font) */}
                      <AnimatePresence>
                        {showSuccessPopup && (
                          <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 z-[999] font-alinur">
                            <motion.div
                              initial={{ scale: 0.9, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              exit={{ scale: 0.9, opacity: 0 }}
                              className="bg-white rounded-3xl shadow-2xl max-w-md w-full border-2 border-emerald-500 overflow-hidden relative p-8 text-center space-y-6"
                            >
                              <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-emerald-600 via-amber-400 to-emerald-700"></div>
                              <div className="mx-auto w-20 h-20 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shadow-md">
                                <span className="text-4xl">💚</span>
                              </div>
                              <div className="space-y-2">
                                <h3 className="text-xl sm:text-2xl font-black text-emerald-950">বার্তা সফলভাবে পাঠানো হয়েছে</h3>
                                <p className="text-sm sm:text-base text-emerald-900 font-medium leading-relaxed px-2">
                                  প্রিয় শুভাকাঙ্ক্ষী, আপনার গুরুত্বপূর্ণ মেসেজটি আমরা গুরুত্বের সাথে বিবেচনা করব ইনশাআল্লাহ
                                </p>
                              </div>
                              <button
                                onClick={() => setShowSuccessPopup(false)}
                                className="w-full bg-gradient-to-r from-emerald-700 to-emerald-850 hover:from-emerald-800 hover:to-emerald-950 text-amber-400 font-bold py-3.5 px-6 rounded-2xl text-sm transition-all shadow-lg active:scale-95 cursor-pointer border border-emerald-600"
                              >
                                ঠিক আছে
                              </button>
                            </motion.div>
                          </div>
                        )}
                      </AnimatePresence>

                      {/* Custom Form Warning Popup (Alinur Tatsama font) */}
                      <AnimatePresence>
                        {showWarningPopup && (
                          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[999] font-alinur">
                            <motion.div
                              initial={{ scale: 0.9, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              exit={{ scale: 0.9, opacity: 0 }}
                              className="bg-white rounded-3xl shadow-2xl max-w-md w-full border-2 border-amber-500 overflow-hidden relative p-8 text-center space-y-6"
                            >
                              <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-amber-500 via-orange-400 to-amber-600"></div>
                              <div className="mx-auto w-20 h-20 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shadow-md">
                                <span className="text-4xl">⚠️</span>
                              </div>
                              <div className="space-y-2">
                                <h3 className="text-lg sm:text-xl font-bold text-amber-950">সতর্কবার্তা</h3>
                                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed px-2 font-medium">
                                  {warningPopupMessage}
                                </p>
                              </div>
                              <button
                                onClick={() => setShowWarningPopup(false)}
                                className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-emerald-950 font-bold py-3 px-6 rounded-2xl text-xs transition-all shadow-lg active:scale-95 cursor-pointer border border-amber-300"
                              >
                                বন্ধ করুন
                              </button>
                            </motion.div>
                          </div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                );
              }}
              />
            )}
          />
        )}
      />
        );
      }}
    />
  );
}
