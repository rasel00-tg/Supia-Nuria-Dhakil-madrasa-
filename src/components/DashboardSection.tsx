import React, { useEffect, useState } from "react";
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, query, orderBy, setDoc, getDocs, getDoc, serverTimestamp, where } from "firebase/firestore";
import { db, handleFirestoreError, OperationType, uploadFileToImgBB, StreamBuilder } from "../lib/firebase";
import { Teacher, SuccessStory, CommitteeMember, HonoredPerson, AdmissionForm, Routine, ContactMessage } from "../types";
import { Trash2, Edit3, Plus, Check, X, CreditCard, Mail, UserPlus, Users, GraduationCap, Calendar, Award, MessageSquare, Heart, CheckCircle2, XCircle, Settings, Megaphone, ChevronDown, LayoutDashboard, Globe, Lock } from "lucide-react";
import PathdanUpdateForm from "./PathdanUpdateForm";
import SodossoFormUpdateForm from "./SodossoFormUpdateForm";
import KormochariUpdateForm from "./KormochariUpdateForm";
import { motion, AnimatePresence } from "motion/react";

interface DashboardSectionProps {
  user: { email: string; role: "student" | "teacher" | "admin"; name: string };
}

export default function DashboardSection({ user }: DashboardSectionProps) {
  const [activeAdminSubTab, setActiveAdminSubTab] = useState<string>("dashboard");
  const [selectedClass, setSelectedClass] = useState<string>("All");
  
  // Real-time collections state
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [stories, setStories] = useState<SuccessStory[]>([]);
  const [committee, setCommittee] = useState<CommitteeMember[]>([]);
  const [honored, setHonored] = useState<HonoredPerson[]>([]);
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [admissions, setAdmissions] = useState<AdmissionForm[]>([]);
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);
  const [websiteLogoUrl, setWebsiteLogoUrl] = useState("");
  const [logoSaveSuccess, setLogoSaveSuccess] = useState(false);

  // Hero Dropdown, Settings Dropdown and Notice states
  const [isHeroDropdownOpen, setIsHeroDropdownOpen] = useState(false);
  const [isNoticeDropdownOpen, setIsNoticeDropdownOpen] = useState(false);
  const [isSettingsDropdownOpen, setIsSettingsDropdownOpen] = useState(false);
  const [isMenuBarDropdownOpen, setIsMenuBarDropdownOpen] = useState(false);
  const [isHomepageDropdownOpen, setIsHomepageDropdownOpen] = useState(false);
  const [newNoticeText, setNewNoticeText] = useState("");
  const [isNoticeUploading, setIsNoticeUploading] = useState(false);

  // Public Notice state
  const [publicNoticeTitle, setPublicNoticeTitle] = useState("");
  const [publicNoticeDescription, setPublicNoticeDescription] = useState("");
  const [editingPublicNoticeId, setEditingPublicNoticeId] = useState<string | null>(null);
  const [isPublicNoticeUploading, setIsPublicNoticeUploading] = useState(false);
  const [publicNoticeTitleError, setPublicNoticeTitleError] = useState("");
  const [publicNoticeDescriptionError, setPublicNoticeDescriptionError] = useState("");
  const [isPublicNoticeFormOpen, setIsPublicNoticeFormOpen] = useState(false);

  // Contact update inputs state (should start empty as per instructions)
  const [contactAddressInput, setContactAddressInput] = useState("");
  const [contactOfficePhoneInput, setContactOfficePhoneInput] = useState("");
  const [contactPrincipalPhoneInput, setContactPrincipalPhoneInput] = useState("");
  const [contactEmailInput, setContactEmailInput] = useState("");
  const [contactFacebookInput, setContactFacebookInput] = useState("");
  const [contactLinkedinInput, setContactLinkedinInput] = useState("");
  const [contactTelegramInput, setContactTelegramInput] = useState("");
  const [contactWhatsappInput, setContactWhatsappInput] = useState("");
  const [isUpdatingContact, setIsUpdatingContact] = useState(false);
  const [contactSaveSuccess, setContactSaveSuccess] = useState(false);

  // Hero background state
  const [heroBgUrl, setHeroBgUrl] = useState("");
  const [heroBgSaveSuccess, setHeroBgSaveSuccess] = useState(false);
  const [isUploadingHeroBg, setIsUploadingHeroBg] = useState(false);
  const [heroBgError, setHeroBgError] = useState("");

  // Modals / Form inputs states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form Fields (shared between entities for simplicity)
  const [field1, setField1] = useState("");
  const [field2, setField2] = useState("");
  const [field3, setField3] = useState("");
  const [field4, setField4] = useState("");
  const [field5, setField5] = useState("");
  const [field6, setField6] = useState("");

  // Extra Fields for Committee Bio-Data (Required empty defaults)
  const [commJoiningDate, setCommJoiningDate] = useState("");
  const [commBirthDate, setCommBirthDate] = useState("");
  const [commBloodGroup, setCommBloodGroup] = useState("");
  const [commQualification, setCommQualification] = useState("");
  const [commPhone, setCommPhone] = useState("");
  const [commEmail, setCommEmail] = useState("");
  const [commAddress, setCommAddress] = useState("");
  const [commFacebook, setCommFacebook] = useState("");
  const [commWhatsapp, setCommWhatsapp] = useState("");
  const [commPhoneNum, setCommPhoneNum] = useState("");

  // Crop states
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [cropZoom, setCropZoom] = useState<number>(1);
  const [cropX, setCropX] = useState<number>(0);
  const [cropY, setCropY] = useState<number>(0);
  const [cropFile, setCropFile] = useState<File | null>(null);
  const [cropFieldSetter, setCropFieldSetter] = useState<((val: string) => void) | null>(null);

  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [isMainLogoUploaded, setIsMainLogoUploaded] = useState(false);
  const [showLogoSuccessPopup, setShowLogoSuccessPopup] = useState(false);

  // Dedicated class routines form states
  const [routineClassInput, setRoutineClassInput] = useState("");
  const [routineDayInput, setRoutineDayInput] = useState("");
  const [routineSubjects, setRoutineSubjects] = useState<Array<{
    subject: string;
    time: string;
    teacherName: string;
    room: string;
  }>>([{ subject: "", time: "", teacherName: "", room: "" }]);

  const [routineClassError, setRoutineClassError] = useState("");
  const [routineDayError, setRoutineDayError] = useState("");
  const [rowValidationErrors, setRowValidationErrors] = useState<Array<{
    subject?: string;
    time?: string;
    teacherName?: string;
  }>>([]);

  const [editingRoutineId, setEditingRoutineId] = useState<string | null>(null);
  const [isRoutineFormOpen, setIsRoutineFormOpen] = useState(false);
  const [activeRoutineSubMenu, setActiveRoutineSubMenu] = useState("class_routine");
  const [routineSaveSuccess, setRoutineSaveSuccess] = useState(false);

  // Exam Routine Form states
  const [examNameInput, setExamNameInput] = useState("");
  const [examClassInput, setExamClassInput] = useState("");
  const [examGuidelinesInput, setExamGuidelinesInput] = useState<string[]>([""]);
  const [examSubjects, setExamSubjects] = useState<Array<{
    date: string;
    subject: string;
    time: string;
    totalMarks: string;
    subjectCode: string;
  }>>([{ date: "", subject: "", time: "", totalMarks: "", subjectCode: "" }]);

  const [isExamFormOpen, setIsExamFormOpen] = useState(false);
  const [editingExamId, setEditingExamId] = useState<string | null>(null);
  const [examSaveSuccess, setExamSaveSuccess] = useState(false);
  const [examClassError, setExamClassError] = useState("");
  const [examNameError, setExamNameError] = useState("");
  const [rowExamValidationErrors, setRowExamValidationErrors] = useState<Array<{
    date?: string;
    subject?: string;
    time?: string;
    totalMarks?: string;
    subjectCode?: string;
  }>>([]);

  const handleSaveExamRoutine = async (e: React.FormEvent) => {
    e.preventDefault();

    let isValid = true;
    if (!examClassInput.trim()) {
      setExamClassError("অনুগ্রহ করে একটি ক্লাস সিলেক্ট বা ইনপুট করুন");
      isValid = false;
    } else {
      setExamClassError("");
    }
    if (!examNameInput.trim()) {
      setExamNameError("অনুগ্রহ করে পরীক্ষার নাম লিখুন (যেমন: অর্ধ-বার্ষিক পরীক্ষা)");
      isValid = false;
    } else {
      setExamNameError("");
    }

    const errors: Array<{ date?: string; subject?: string; time?: string; totalMarks?: string; subjectCode?: string }> = [];
    let hasRowErrors = false;
    examSubjects.forEach((row, idx) => {
      const rowErr: { date?: string; subject?: string; time?: string; totalMarks?: string; subjectCode?: string } = {};
      if (!row.date.trim()) {
        rowErr.date = "তারিখ আবশ্যক";
        hasRowErrors = true;
      }
      if (!row.subject.trim()) {
        rowErr.subject = "বিষয় আবশ্যক";
        hasRowErrors = true;
      }
      if (!row.time.trim()) {
        rowErr.time = "সময় আবশ্যক";
        hasRowErrors = true;
      }
      if (!row.totalMarks.trim()) {
        rowErr.totalMarks = "নাম্বার আবশ্যক";
        hasRowErrors = true;
      }
      if (!row.subjectCode.trim()) {
        rowErr.subjectCode = "কোড আবশ্যক";
        hasRowErrors = true;
      }
      errors[idx] = rowErr;
    });

    setRowExamValidationErrors(errors);
    if (!isValid || hasRowErrors) return;

    try {
      if (!editingExamId) {
        // Overwrite Logic: Delete all previous exam routines for this class
        const q = query(
          collection(db, "routines"),
          where("type", "==", "exam"),
          where("className", "==", examClassInput)
        );
        const snapshot = await getDocs(q);
        const deletePromises = snapshot.docs.map(d => deleteDoc(doc(db, "routines", d.id)));
        await Promise.all(deletePromises);
      }

      const activeGuidelines = examGuidelinesInput.filter(gl => gl.trim() !== "");

      const payload = {
        type: "exam",
        className: examClassInput,
        examName: examNameInput,
        subjects: examSubjects,
        guidelines: activeGuidelines.length > 0 ? activeGuidelines : [""],
        isEdited: editingExamId ? true : false,
        editedAt: editingExamId ? new Date().toISOString() : ""
      };

      if (editingExamId) {
        await updateDoc(doc(db, "routines", editingExamId), payload);
      } else {
        await addDoc(collection(db, "routines"), payload);
      }

      // Reset
      setExamClassInput("");
      setExamNameInput("");
      setExamSubjects([{ date: "", subject: "", time: "", totalMarks: "", subjectCode: "" }]);
      setExamGuidelinesInput([""]);
      setRowExamValidationErrors([]);
      setEditingExamId(null);
      setIsExamFormOpen(false);
      setExamSaveSuccess(true);
      setTimeout(() => setExamSaveSuccess(false), 3000);
    } catch (err) {
      console.error("Error saving exam routine:", err);
      alert("পরীক্ষা রুটিন সংরক্ষণ করতে সমস্যা হয়েছে।");
    }
  };

  const handleEditExamLocal = (item: Routine) => {
    setEditingExamId(item.id);
    setExamClassInput(item.className);
    setExamNameInput(item.examName || "");
    setExamSubjects(item.subjects || [{ date: "", subject: "", time: "", totalMarks: "", subjectCode: "" }]);
    setExamGuidelinesInput(item.guidelines || [""]);
    setRowExamValidationErrors([]);
    setIsExamFormOpen(true);
    setExamClassError("");
    setExamNameError("");

    setTimeout(() => {
      const formElement = document.getElementById("exam-routine-form-section");
      if (formElement) {
        formElement.scrollIntoView({ behavior: "smooth" });
      }
    }, 100);
  };

  const handleCancelEditExam = () => {
    setEditingExamId(null);
    setExamClassInput("");
    setExamNameInput("");
    setExamSubjects([{ date: "", subject: "", time: "", totalMarks: "", subjectCode: "" }]);
    setExamGuidelinesInput([""]);
    setRowExamValidationErrors([]);
    setExamClassError("");
    setExamNameError("");
    setIsExamFormOpen(false);
  };

  const handleAddExamSubjectRow = () => {
    setExamSubjects([...examSubjects, { date: "", subject: "", time: "", totalMarks: "", subjectCode: "" }]);
  };

  const handleRemoveExamSubjectRow = (idx: number) => {
    if (examSubjects.length > 1) {
      setExamSubjects(examSubjects.filter((_, i) => i !== idx));
    }
  };

  const handleUpdateExamSubjectRowField = (idx: number, field: string, value: string) => {
    const updated = [...examSubjects];
    updated[idx] = { ...updated[idx], [field]: value };
    setExamSubjects(updated);
  };

  const handleUpdateExamGuideline = (idx: number, value: string) => {
    const updated = [...examGuidelinesInput];
    updated[idx] = value;
    setExamGuidelinesInput(updated);
  };

  const handleSaveRoutine = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Strict validation
    let isValid = true;
    if (!routineClassInput.trim()) {
      setRoutineClassError("অনুগ্রহ করে একটি ক্লাস সিলেক্ট বা ইনপুট করুন");
      isValid = false;
    } else {
      setRoutineClassError("");
    }
    if (!routineDayInput.trim()) {
      setRoutineDayError("অনুগ্রহ করে একটি দিন সিলেক্ট বা ইনপুট করুন");
      isValid = false;
    } else {
      setRoutineDayError("");
    }

    // Dynamic rows validation
    const errors: Array<{ subject?: string; time?: string; teacherName?: string }> = [];
    let hasRowErrors = false;
    routineSubjects.forEach((row, idx) => {
      const rowErr: { subject?: string; time?: string; teacherName?: string } = {};
      if (!row.subject.trim()) {
        rowErr.subject = "বিষয় আবশ্যক";
        hasRowErrors = true;
      }
      if (!row.time.trim()) {
        rowErr.time = "সময় আবশ্যক";
        hasRowErrors = true;
      }
      if (!row.teacherName.trim()) {
        rowErr.teacherName = "শিক্ষক আবশ্যক";
        hasRowErrors = true;
      }
      errors[idx] = rowErr;
    });

    setRowValidationErrors(errors);
    if (!isValid || hasRowErrors) return;

    try {
      if (editingRoutineId) {
        // Edit mode (only updates 1 item)
        const row = routineSubjects[0];
        const payload = {
          type: "class",
          className: routineClassInput,
          subject: row.subject,
          time: row.time,
          dayOrDate: routineDayInput,
          room: row.room || "১০১",
          teacherName: row.teacherName,
          isEdited: true,
          editedAt: new Date().toISOString()
        };
        await updateDoc(doc(db, "routines", editingRoutineId), payload);
      } else {
        // Overwrite Logic: Delete all previous class routines for this class
        const q = query(
          collection(db, "routines"),
          where("type", "==", "class"),
          where("className", "==", routineClassInput)
        );
        const snapshot = await getDocs(q);
        const deletePromises = snapshot.docs.map(d => deleteDoc(doc(db, "routines", d.id)));
        await Promise.all(deletePromises);

        // Add mode (creates multiple documents in routines)
        for (const row of routineSubjects) {
          const payload = {
            type: "class",
            className: routineClassInput,
            subject: row.subject,
            time: row.time,
            dayOrDate: routineDayInput,
            room: row.room || "১০১",
            teacherName: row.teacherName,
            isEdited: false,
            editedAt: ""
          };
          await addDoc(collection(db, "routines"), payload);
        }
      }

      // Reset form
      setRoutineClassInput("");
      setRoutineDayInput("");
      setRoutineSubjects([{ subject: "", time: "", teacherName: "", room: "" }]);
      setRowValidationErrors([]);
      setEditingRoutineId(null);
      setIsRoutineFormOpen(false); // Close form after successful save
      setRoutineSaveSuccess(true);
      setTimeout(() => setRoutineSaveSuccess(false), 3000);
    } catch (err) {
      console.error("Error saving routine:", err);
      alert("রুটিন সংরক্ষণ করতে সমস্যা হয়েছে।");
    }
  };

  const handleEditRoutineLocal = (item: Routine) => {
    setEditingRoutineId(item.id);
    setRoutineClassInput(item.className);
    setRoutineDayInput(item.dayOrDate);
    setRoutineSubjects([{
      subject: item.subject,
      time: item.time,
      teacherName: item.teacherName || "",
      room: item.room || ""
    }]);
    setRowValidationErrors([]);
    setIsRoutineFormOpen(true); // Open form on edit
    
    // Clear validation errors
    setRoutineClassError("");
    setRoutineDayError("");
    
    // Scroll smoothly to form
    const formElement = document.getElementById("local-routine-form-section");
    if (formElement) {
      formElement.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleCancelEditRoutine = () => {
    setEditingRoutineId(null);
    setRoutineClassInput("");
    setRoutineDayInput("");
    setRoutineSubjects([{ subject: "", time: "", teacherName: "", room: "" }]);
    setRowValidationErrors([]);
    setRoutineClassError("");
    setRoutineDayError("");
    setIsRoutineFormOpen(false); // Close form
  };

  const handleAddSubjectRow = () => {
    setRoutineSubjects([...routineSubjects, { subject: "", time: "", teacherName: "", room: "" }]);
  };

  const handleRemoveSubjectRow = (index: number) => {
    if (routineSubjects.length > 1) {
      setRoutineSubjects(routineSubjects.filter((_, i) => i !== index));
    }
  };

  const handleUpdateSubjectRowField = (index: number, field: string, value: string) => {
    const updated = [...routineSubjects];
    updated[index] = { ...updated[index], [field]: value };
    setRoutineSubjects(updated);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, fieldSetter: (val: string) => void, folderName: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Strict validation for committee members before upload
    if (activeAdminSubTab === "committee") {
      if (
        !field1.trim() || 
        !field2.trim() || 
        !field3.trim() || 
        !field4.trim() || 
        !commJoiningDate.trim() || 
        !commBirthDate.trim() || 
        !commBloodGroup.trim() || 
        !commQualification.trim() || 
        !commPhone.trim() || 
        !commEmail.trim() || 
        !commAddress.trim()
      ) {
        setUploadError("⚠️ ছবি আপলোড ব্লকড! অনুগ্রহ করে প্রথমে ফরমের সকল টেক্সট ফিল্ড (নাম, পদবী, বাণী, র‍্যাংক এবং বায়ো-ডাটার ৭টি ফিল্ড) সম্পূর্ণ ও সঠিকভাবে পূরণ করুন।");
        e.target.value = ""; // reset file input
        return;
      }

      // Read selected image file as data URL to start crop process
      const reader = new FileReader();
      reader.onload = () => {
        setCropSrc(reader.result as string);
        setCropZoom(1);
        setCropX(0);
        setCropY(0);
        setCropFile(file);
        setCropFieldSetter(() => fieldSetter);
      };
      reader.readAsDataURL(file);
      e.target.value = ""; // Reset file input so same file can be selected again
      return;
    }

    setIsUploading(true);
    setUploadError("");
    try {
      const downloadUrl = await uploadFileToImgBB(file);
      fieldSetter(downloadUrl);
    } catch (error: any) {
      console.error("Error uploading file:", error);
      setUploadError("ফাইল আপলোড করতে ব্যর্থ হয়েছে। পুনরায় চেষ্টা করুন।");
    } finally {
      setIsUploading(false);
    }
  };

  // Subscriptions
  useEffect(() => {
    const unsubTeachers = onSnapshot(collection(db, "teachers"), (snap) => {
      const items: Teacher[] = [];
      snap.forEach((d) => items.push({ id: d.id, ...d.data() } as Teacher));
      setTeachers(items);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, "teachers");
    });

    const unsubStories = onSnapshot(query(collection(db, "success_stories"), orderBy("year", "desc")), (snap) => {
      const items: SuccessStory[] = [];
      snap.forEach((d) => items.push({ id: d.id, ...d.data() } as SuccessStory));
      setStories(items);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, "success_stories");
    });

    const unsubCommittee = onSnapshot(query(collection(db, "committee"), orderBy("rank", "asc")), (snap) => {
      const items: CommitteeMember[] = [];
      snap.forEach((d) => items.push({ id: d.id, ...d.data() } as CommitteeMember));
      setCommittee(items);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, "committee");
    });

    const unsubHonored = onSnapshot(collection(db, "honored_persons"), (snap) => {
      const items: HonoredPerson[] = [];
      snap.forEach((d) => items.push({ id: d.id, ...d.data() } as HonoredPerson));
      setHonored(items);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, "honored_persons");
    });

    const unsubRoutines = onSnapshot(collection(db, "routines"), (snap) => {
      const items: Routine[] = [];
      snap.forEach((d) => items.push({ id: d.id, ...d.data() } as Routine));
      setRoutines(items);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, "routines");
    });

    const unsubAdmissions = onSnapshot(collection(db, "admissions"), (snap) => {
      const items: AdmissionForm[] = [];
      snap.forEach((d) => items.push({ id: d.id, ...d.data() } as unknown as AdmissionForm));
      setAdmissions(items);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, "admissions");
    });

    const unsubMessages = onSnapshot(query(collection(db, "messages"), orderBy("date", "desc")), (snap) => {
      const items: ContactMessage[] = [];
      snap.forEach((d) => items.push({ id: d.id, ...d.data() } as ContactMessage));
      setMessages(items);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, "messages");
    });

    const unsubSettings = onSnapshot(doc(db, "settings", "website"), (snap) => {
      if (snap.exists()) {
        setWebsiteLogoUrl(snap.data().logoUrl || "");
        setHeroBgUrl(snap.data().heroBgUrl || "");
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, "settings/website");
    });

    const unsubBranding = onSnapshot(doc(db, "settings", "branding"), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setIsMainLogoUploaded(!!data.isMainLogoUploaded || !!data.isLogoUploaded);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, "settings/branding");
    });

    return () => {
      unsubTeachers();
      unsubStories();
      unsubCommittee();
      unsubHonored();
      unsubRoutines();
      unsubAdmissions();
      unsubMessages();
      unsubSettings();
      unsubBranding();
    };
  }, []);

  // Pre-populate contact fields with current Firestore data when contact_update tab is active
  useEffect(() => {
    if (activeAdminSubTab === "contact_update") {
      const fetchContactData = async () => {
        try {
          const snap = await getDoc(doc(db, "settings", "contact"));
          if (snap.exists()) {
            const data = snap.data();
            setContactAddressInput(data.address || "");
            setContactOfficePhoneInput(data.officePhone || "");
            setContactPrincipalPhoneInput(data.principalPhone || "");
            setContactEmailInput(data.email || "");
            setContactFacebookInput(data.facebook || "");
            setContactLinkedinInput(data.linkedin || "");
            setContactTelegramInput(data.telegram || "");
            setContactWhatsappInput(data.whatsapp || "");
          }
        } catch (err) {
          console.error("Error fetching contact data for admin prepopulate:", err);
        }
      };
      fetchContactData();
    }
  }, [activeAdminSubTab]);

  const handleHeroBgUpload = async (file: File) => {
    setIsUploadingHeroBg(true);
    setHeroBgError("");
    try {
      const downloadUrl = await uploadFileToImgBB(file);
      await setDoc(doc(db, "settings", "website"), { heroBgUrl: downloadUrl }, { merge: true });
      setHeroBgSaveSuccess(true);
      setTimeout(() => setHeroBgSaveSuccess(false), 3000);
    } catch (err: any) {
      console.error("Error uploading hero background:", err);
      setHeroBgError("ছবি আপলোড করতে ব্যর্থ হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।");
    } finally {
      setIsUploadingHeroBg(false);
    }
  };

  const handleClearHeroBg = async () => {
    try {
      await setDoc(doc(db, "settings", "website"), { heroBgUrl: "" }, { merge: true });
      setHeroBgSaveSuccess(true);
      setTimeout(() => setHeroBgSaveSuccess(false), 3000);
    } catch (err) {
      console.error("Error clearing hero background:", err);
      setHeroBgError("ব্যাকগ্রাউন্ড ছবি মুছতে ব্যর্থ হয়েছে।");
    }
  };

  const handleContactUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (contactOfficePhoneInput && contactOfficePhoneInput.trim().length !== 11) {
      alert("অফিস কন্টাক্ট নাম্বার অবশ্যই ১১ সংখ্যার হতে হবে।");
      return;
    }
    if (contactPrincipalPhoneInput && contactPrincipalPhoneInput.trim().length !== 11) {
      alert("প্রধান শিক্ষকের নাম্বার অবশ্যই ১১ সংখ্যার হতে হবে।");
      return;
    }

    setIsUpdatingContact(true);
    setContactSaveSuccess(false);
    try {
      await setDoc(doc(db, "settings", "contact"), {
        address: contactAddressInput,
        officePhone: contactOfficePhoneInput,
        principalPhone: contactPrincipalPhoneInput,
        email: contactEmailInput,
        facebook: contactFacebookInput,
        linkedin: contactLinkedinInput,
        telegram: contactTelegramInput,
        whatsapp: contactWhatsappInput,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      
      setContactSaveSuccess(true);
      setTimeout(() => setContactSaveSuccess(false), 4000);
    } catch (err: any) {
      console.error("Error updating contact settings:", err);
      handleFirestoreError(err, OperationType.UPDATE, "settings/contact");
      alert("দুঃখিত, তথ্য সংরক্ষণ করা যায়নি। অনুগ্রহ করে আবার চেষ্টা করুন।");
    } finally {
      setIsUpdatingContact(false);
    }
  };

  // CRUD handlers
  const handleOpenAddForm = () => {
    setEditingId(null);
    setField1(""); setField2(""); setField3(""); setField4(""); setField5(""); setField6("");
    setCommJoiningDate("");
    setCommBirthDate("");
    setCommBloodGroup("");
    setCommQualification("");
    setCommPhone("");
    setCommEmail("");
    setCommAddress("");
    setCommFacebook("");
    setCommWhatsapp("");
    setCommPhoneNum("");
    setUploadError("");
    setIsFormOpen(true);
  };

  const handleEdit = (item: any, type: string) => {
    setEditingId(item.id);
    setUploadError("");
    setIsFormOpen(true);
    if (type === "teachers") {
      setField1(item.name || "");
      setField2(item.designation || "");
      setField3(item.phone || "");
      setField4(item.email || "");
      setField5(item.photoUrl || "");
    } else if (type === "stories") {
      setField1(item.student_name || "");
      setField2(item.achievement || "");
      setField3(item.year?.toString() || "");
      setField4(item.imageUrl || "");
    } else if (type === "committee") {
      setField1(item.name || "");
      setField2(item.role || "");
      setField3(item.speech || "");
      setField4(item.rank?.toString() || "");
      setField5(item.imageUrl || "");
      setCommJoiningDate(item.joiningDate || "");
      setCommBirthDate(item.birthDate || "");
      setCommBloodGroup(item.bloodGroup || "");
      setCommQualification(item.qualification || "");
      setCommPhone(item.phone || "");
      setCommEmail(item.email || "");
      setCommAddress(item.address || "");
      setCommFacebook(item.facebookUrl || "");
      setCommWhatsapp(item.whatsAppNum || "");
      setCommPhoneNum(item.phoneNum || "");
    } else if (type === "honored") {
      setField1(item.name || "");
      setField2(item.birth_death || "");
      setField3(item.contribution || "");
      setField4(item.imageUrl || "");
    } else if (type === "routines") {
      setField1(item.type || "class");
      setField2(item.className || "");
      setField3(item.subject || "");
      setField4(item.time || "");
      setField5(item.dayOrDate || "");
      setField6(item.room || "");
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const subTab = user.role === "teacher" ? "routines" : activeAdminSubTab;

    try {
      if (subTab === "teachers") {
        const payload = { name: field1, designation: field2, phone: field3, email: field4, photoUrl: field5 || "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80", uid: editingId || `teacher_${Date.now()}` };
        if (editingId) {
          await updateDoc(doc(db, "teachers", editingId), payload);
        } else {
          await addDoc(collection(db, "teachers"), payload);
        }
      } else if (subTab === "stories") {
        const payload = { student_name: field1, achievement: field2, year: parseInt(field3) || 2026, imageUrl: field4 || "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=300&q=80" };
        if (editingId) {
          await updateDoc(doc(db, "success_stories", editingId), payload);
        } else {
          await addDoc(collection(db, "success_stories"), payload);
        }
      } else if (subTab === "committee") {
        const payload = { 
          name: field1, 
          role: field2, 
          speech: field3, 
          rank: parseInt(field4) || 10, 
          imageUrl: field5 || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=300&q=80",
          joiningDate: commJoiningDate,
          birthDate: commBirthDate,
          bloodGroup: commBloodGroup,
          qualification: commQualification,
          phone: commPhone,
          email: commEmail,
          address: commAddress,
          facebookUrl: commFacebook,
          whatsAppNum: commWhatsapp,
          phoneNum: commPhoneNum
        };
        if (editingId) {
          await updateDoc(doc(db, "committee", editingId), payload);
        } else {
          await addDoc(collection(db, "committee"), payload);
        }
      } else if (subTab === "honored") {
        const payload = { name: field1, birth_death: field2, contribution: field3, imageUrl: field4 || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80" };
        if (editingId) {
          await updateDoc(doc(db, "honored_persons", editingId), payload);
        } else {
          await addDoc(collection(db, "honored_persons"), payload);
        }
      } else if (subTab === "routines") {
        const payload = { type: field1 as "class" | "exam", className: field2, subject: field3, time: field4, dayOrDate: field5, room: field6, teacherName: user.name };
        if (editingId) {
          await updateDoc(doc(db, "routines", editingId), payload);
        } else {
          await addDoc(collection(db, "routines"), payload);
        }
      }

      setIsFormOpen(false);
      setEditingId(null);
    } catch (err) {
      console.error("Error saving doc:", err);
      alert("ডাটা সংরক্ষণ করতে সমস্যা হয়েছে।");
      handleFirestoreError(err, editingId ? OperationType.UPDATE : OperationType.CREATE, subTab);
    }
  };

  const handleDelete = async (id: string, colName: string) => {
    if (!window.confirm("আপনি কি নিশ্চিতভাবে এটি ডিলিট করতে চান?")) return;
    try {
      await deleteDoc(doc(db, colName, id));
    } catch (err) {
      console.error("Error deleting doc:", err);
      handleFirestoreError(err, OperationType.DELETE, `${colName}/${id}`);
    }
  };

  const handleUpdateAdmissionStatus = async (id: string, status: "Approved" | "Rejected") => {
    try {
      await updateDoc(doc(db, "admissions", id), { status });
    } catch (err) {
      console.error("Error updating admission status:", err);
      handleFirestoreError(err, OperationType.UPDATE, `admissions/${id}`);
    }
  };

  const handleToggleAdmissionPayment = async (id: string, currentPayment: string) => {
    const newPayment = currentPayment === "Paid" ? "Unpaid" : "Paid";
    try {
      await updateDoc(doc(db, "admissions", id), { payment_status: newPayment });
    } catch (err) {
      console.error("Error updating payment status:", err);
      handleFirestoreError(err, OperationType.UPDATE, `admissions/${id}`);
    }
  };

  const handleAddRunningNotice = async (noticeText: string) => {
    if (!noticeText.trim()) return;
    try {
      // 1. Fetch current notices ordered by createdAt descending (newest first)
      const noticesSnapshot = await getDocs(
        query(collection(db, "running_notices"), orderBy("createdAt", "desc"))
      );
      
      const currentNotices: { id: string; createdAt: any }[] = [];
      noticesSnapshot.forEach((doc) => {
        currentNotices.push({ id: doc.id, ...doc.data() } as any);
      });

      // 2. Queue Logic: If already 2 or more notices exist, we delete the oldest one(s).
      if (currentNotices.length >= 2) {
        // Since currentNotices is sorted desc, the oldest are from index 1 and onwards.
        // We delete them to make space for the new notice.
        for (let i = 1; i < currentNotices.length; i++) {
          await deleteDoc(doc(db, "running_notices", currentNotices[i].id));
        }
      }

      // 3. Add the new notice (createdAt as ISO string is fully supported)
      await addDoc(collection(db, "running_notices"), {
        text: noticeText,
        createdAt: new Date().toISOString(),
      });

      setNewNoticeText("");
      alert("চলমান নোটিশটি সফলভাবে আপলোড করা হয়েছে!");
    } catch (err) {
      console.error("Error adding running notice:", err);
      alert("নোটিশ যোগ করতে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।");
    }
  };

  return (
    <div id="dashboard-section" className="space-y-8 py-6 w-full px-2">
      {/* Welcome Banner */}
      <div className="bg-emerald-800 text-white p-6 sm:p-8 rounded-xl border-b-4 border-amber-500 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-amber-300 uppercase tracking-widest font-mono">
            স্বাগতম ড্যাশবোর্ড
          </span>
          <h2 className="text-2xl font-bold font-serif mt-1">{user.name}</h2>
          <p className="text-sm text-emerald-100">{user.email} ({user.role === "admin" ? "অ্যাডমিনিস্ট্রেটর" : user.role === "teacher" ? "মাদ্রাসার শিক্ষক" : "শিক্ষার্থী"})</p>
        </div>
        <div className="flex-shrink-0">
          <div className="bg-emerald-950/40 border border-emerald-700/60 px-4 py-2.5 rounded-xl text-center">
            <span className="text-xs text-emerald-200 block">বর্তমান সেশন</span>
            <span className="text-sm font-bold text-amber-400 font-serif">২০২৬-২০২৭</span>
          </div>
        </div>
      </div>

      {/* ------------------- STUDENT DASHBOARD ------------------- */}
      {user.role === "student" && (
        <div id="student-dashboard" className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl p-6 border border-slate-200/80 shadow-sm space-y-4">
            <div className="bg-emerald-50 h-12 w-12 rounded-xl flex items-center justify-center border border-emerald-100">
              <Calendar className="h-6 w-6 text-emerald-800" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-emerald-950 font-serif">আমার ক্লাস রুটিন</h3>
              <p className="text-sm text-gray-500 mt-1">আপনার রুটিন ও ক্লাস টাইম চেক করুন রুটিন ট্যাব থেকে।</p>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-slate-200/80 shadow-sm space-y-4">
            <div className="bg-emerald-50 h-12 w-12 rounded-xl flex items-center justify-center border border-emerald-100">
              <Award className="h-6 w-6 text-emerald-800" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-emerald-950 font-serif">পরীক্ষার ফলাফল</h3>
              <p className="text-sm text-gray-500 mt-1">ফলাফল ট্যাব ব্যবহার করে রোল ১০০১ এবং রেজিস্ট্রেশন ২০২৬০১ সার্চ করে মার্কশিট দেখুন।</p>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-slate-200/80 shadow-sm space-y-4 col-span-full md:col-span-1">
            <div className="bg-emerald-50 h-12 w-12 rounded-xl flex items-center justify-center border border-emerald-100">
              <CheckCircle2 className="h-6 w-6 text-emerald-800" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-emerald-950 font-serif">ভর্তি স্ট্যাটাস</h3>
              <p className="text-sm text-gray-500 mt-1">আপনার অনলাইন ভর্তির তথ্য এবং আবেদন রিসিভ কপি সুরক্ষিত রয়েছে।</p>
            </div>
          </div>
        </div>
      )}

      {/* ------------------- TEACHER DASHBOARD ------------------- */}
      {user.role === "teacher" && (
        <div id="teacher-dashboard" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-xl font-bold text-emerald-950 font-serif">রুটিন ম্যানেজমেন্ট</h3>
              <p className="text-xs text-gray-500">মাদ্রাসার শিক্ষার্থীদের ক্লাস ও পরীক্ষার রুটিন আপডেট করুন</p>
            </div>
            <button
              id="teacher-add-routine-btn"
              onClick={handleOpenAddForm}
              className="flex items-center space-x-1.5 bg-emerald-800 hover:bg-emerald-950 text-amber-400 font-bold py-2.5 px-4 rounded-lg text-xs shadow-sm transition-all"
            >
              <Plus className="h-4 w-4" />
              <span>নতুন রুটিন যোগ করুন</span>
            </button>
          </div>

          {/* Teacher's Routines list */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-emerald-50 text-emerald-950 font-bold border-b border-gray-100">
                  <th className="p-4">টাইপ</th>
                  <th className="p-4">শ্রেণী</th>
                  <th className="p-4">বিষয়</th>
                  <th className="p-4">সময় ও ঘণ্টা</th>
                  <th className="p-4">দিন / তারিখ</th>
                  <th className="p-4">কক্ষ</th>
                  <th className="p-4 text-center">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {routines.map((item) => (
                  <tr key={item.id} className="hover:bg-emerald-50/10">
                    <td className="p-4">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold ${
                        item.type === "class" ? "bg-blue-50 text-blue-700" : "bg-purple-50 text-purple-700"
                      }`}>
                        {item.type === "class" ? "ক্লাস" : "পরীক্ষা"}
                      </span>
                    </td>
                    <td className="p-4 font-bold">{item.className}</td>
                    <td className="p-4">{item.subject}</td>
                    <td className="p-4 font-mono">{item.time}</td>
                    <td className="p-4">{item.dayOrDate}</td>
                    <td className="p-4 font-bold">{item.room}</td>
                    <td className="p-4 text-center">
                      <div className="flex justify-center space-x-2">
                        <button
                          onClick={() => handleEdit(item, "routines")}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id, "routines")}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ------------------- ADMIN DASHBOARD ------------------- */}
      {user.role === "admin" && (
        <div id="admin-dashboard" className="space-y-6">
          {/* Admin Tabs */}
          <div className="flex flex-wrap items-center gap-2 border-b border-gray-200 pb-2 font-alinur">
            {[
              { id: "dashboard", label: "ড্যাশবোর্ড", icon: LayoutDashboard },
              { id: "admissions", label: "অনলাইন আবেদন ট্র্যাকিং", icon: UserPlus },
              { id: "teachers", label: "শিক্ষক তালিকা", icon: GraduationCap },
              { id: "stories", label: "শিক্ষার্থীদের সাফল্য", icon: Award },
              { id: "committee", label: "গভর্নিং বডি", icon: Users },
              { id: "honored", label: "স্মরণীয় ব্যক্তিত্ব", icon: Heart },
              { id: "routines", label: "রুটিন শিডিউল", icon: Calendar },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  id={`admin-subtab-${tab.id}`}
                  onClick={() => {
                    setActiveAdminSubTab(tab.id as any);
                    setIsNoticeDropdownOpen(false);
                    setIsHeroDropdownOpen(false);
                    setIsSettingsDropdownOpen(false);
                    setIsMenuBarDropdownOpen(false);
                  }}
                  className={`flex items-center space-x-1.5 px-4 py-2.5 rounded-lg text-xs font-bold transition-all ${
                    activeAdminSubTab === tab.id
                      ? "bg-emerald-800 text-white shadow-sm"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}

            {/* Notice Tab with Dropdown */}
            <div className="relative">
              <button
                id="admin-notice-dropdown-trigger"
                onClick={() => {
                  setIsNoticeDropdownOpen(!isNoticeDropdownOpen);
                  setIsHeroDropdownOpen(false);
                  setIsSettingsDropdownOpen(false);
                  setIsMenuBarDropdownOpen(false);
                }}
                className={`flex items-center space-x-1.5 px-4 py-2.5 rounded-lg text-xs font-bold transition-all ${
                  activeAdminSubTab === "running_notices"
                    ? "bg-emerald-800 text-white shadow-sm"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                <Megaphone className="h-4 w-4" />
                <span>নোটিশ</span>
                <ChevronDown className={`h-3 w-3 transition-transform duration-200 ${isNoticeDropdownOpen ? "rotate-180" : ""}`} />
              </button>
              
              {isNoticeDropdownOpen && (
                <div className="absolute left-0 mt-1.5 w-48 bg-white border border-gray-100 rounded-lg shadow-lg py-1 z-30">
                  <button
                    id="admin-subtab-running-notice"
                    onClick={() => {
                      setActiveAdminSubTab("running_notices");
                      setIsNoticeDropdownOpen(false);
                    }}
                    className={`flex items-center space-x-2 w-full text-left px-4 py-2 text-xs font-bold ${
                      activeAdminSubTab === "running_notices"
                        ? "bg-emerald-50 text-emerald-850"
                        : "text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    <div className="h-1.5 w-1.5 rounded-full bg-amber-500"></div>
                    <span>চলমান নোটিশ</span>
                  </button>

                  <button
                    id="admin-subtab-public-notice"
                    onClick={() => {
                      setActiveAdminSubTab("public_notices");
                      setIsNoticeDropdownOpen(false);
                    }}
                    className={`flex items-center space-x-2 w-full text-left px-4 py-2 text-xs font-bold ${
                      activeAdminSubTab === "public_notices"
                        ? "bg-emerald-50 text-emerald-850"
                        : "text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-800"></div>
                    <span>নোটিশ পাবলিক</span>
                  </button>
                </div>
              )}
            </div>

            {/* Hero Section Update Tab with Dropdown */}
            <div className="relative">
              <button
                id="admin-hero-dropdown-trigger"
                onClick={() => {
                  setIsHeroDropdownOpen(!isHeroDropdownOpen);
                  setIsNoticeDropdownOpen(false);
                  setIsSettingsDropdownOpen(false);
                  setIsMenuBarDropdownOpen(false);
                }}
                className={`flex items-center space-x-1.5 px-4 py-2.5 rounded-lg text-xs font-bold transition-all ${
                  activeAdminSubTab === "pathdan_update"
                    ? "bg-emerald-800 text-white shadow-sm"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                <Settings className="h-4 w-4 text-amber-500" />
                <span>হিরো সেকশন আপডেট</span>
                <ChevronDown className={`h-3 w-3 transition-transform duration-200 ${isHeroDropdownOpen ? "rotate-180" : ""}`} />
              </button>
              
              {isHeroDropdownOpen && (
                <div className="absolute left-0 mt-1.5 w-56 bg-white border border-gray-100 rounded-lg shadow-lg py-1 z-30">
                  <button
                    id="admin-subtab-pathdan-update"
                    onClick={() => {
                      setActiveAdminSubTab("pathdan_update");
                      setIsHeroDropdownOpen(false);
                    }}
                    className={`flex items-center space-x-2 w-full text-left px-4 py-2 text-xs font-bold ${
                      activeAdminSubTab === "pathdan_update"
                        ? "bg-emerald-50 text-emerald-850"
                        : "text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    <div className="h-1.5 w-1.5 rounded-full bg-amber-500"></div>
                    <span>এক নজরে পাঠদান আপডেট</span>
                  </button>
                </div>
              )}
            </div>

            {/* Website Settings Tab with Dropdown */}
            <div className="relative">
              <button
                id="admin-settings-dropdown-trigger"
                onClick={() => {
                  setIsSettingsDropdownOpen(!isSettingsDropdownOpen);
                  setIsNoticeDropdownOpen(false);
                  setIsHeroDropdownOpen(false);
                  setIsMenuBarDropdownOpen(false);
                }}
                className={`flex items-center space-x-1.5 px-4 py-2.5 rounded-lg text-xs font-bold transition-all ${
                  activeAdminSubTab === "settings" || activeAdminSubTab === "hero_background"
                    ? "bg-emerald-800 text-white shadow-sm"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                <Settings className="h-4 w-4 text-amber-500" />
                <span>ওয়েবসাইট সেটিংস</span>
                <ChevronDown className={`h-3 w-3 transition-transform duration-200 ${isSettingsDropdownOpen ? "rotate-180" : ""}`} />
              </button>
              
              {isSettingsDropdownOpen && (
                <div className="absolute left-0 mt-1.5 w-56 bg-white border border-gray-100 rounded-lg shadow-lg py-1 z-30">
                  <button
                    id="admin-subtab-hero-bg-update"
                    onClick={() => {
                      setActiveAdminSubTab("hero_background");
                      setIsSettingsDropdownOpen(false);
                    }}
                    className={`flex items-center space-x-2 w-full text-left px-4 py-2 text-xs font-bold ${
                      activeAdminSubTab === "hero_background"
                        ? "bg-emerald-50 text-emerald-850"
                        : "text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    <div className="h-1.5 w-1.5 rounded-full bg-amber-500"></div>
                    <span>হিরো ব্যাকগ্রাউন্ড আপডেট</span>
                  </button>

                  <button
                    id="admin-subtab-logo-update"
                    onClick={() => {
                      setActiveAdminSubTab("settings");
                      setIsSettingsDropdownOpen(false);
                    }}
                    className={`flex items-center space-x-2 w-full text-left px-4 py-2 text-xs font-bold ${
                      activeAdminSubTab === "settings"
                        ? "bg-emerald-50 text-emerald-850"
                        : "text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    <div className="h-1.5 w-1.5 rounded-full bg-amber-500"></div>
                    <span>লগো আপডেট</span>
                  </button>
                </div>
              )}
            </div>

            {/* Homepage Update Tab with Dropdown */}
            <div className="relative">
              <button
                id="admin-homepage-dropdown-trigger"
                onClick={() => {
                  setIsHomepageDropdownOpen(!isHomepageDropdownOpen);
                  setIsNoticeDropdownOpen(false);
                  setIsHeroDropdownOpen(false);
                  setIsSettingsDropdownOpen(false);
                  setIsMenuBarDropdownOpen(false);
                }}
                className={`flex items-center space-x-1.5 px-4 py-2.5 rounded-lg text-xs font-bold transition-all ${
                  activeAdminSubTab === "contact_update"
                    ? "bg-emerald-800 text-white shadow-sm"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                <Globe className="h-4 w-4 text-amber-500" />
                <span>হোমপেজ আপডেট</span>
                <ChevronDown className={`h-3 w-3 transition-transform duration-200 ${isHomepageDropdownOpen ? "rotate-180" : ""}`} />
              </button>
              
              {isHomepageDropdownOpen && (
                <div className="absolute left-0 mt-1.5 w-56 bg-white border border-gray-100 rounded-lg shadow-lg py-1 z-30">
                  <button
                    id="admin-subtab-contact-update"
                    onClick={() => {
                      setActiveAdminSubTab("contact_update");
                      setIsHomepageDropdownOpen(false);
                    }}
                    className={`flex items-center space-x-2 w-full text-left px-4 py-2 text-xs font-bold ${
                      activeAdminSubTab === "contact_update"
                        ? "bg-emerald-50 text-emerald-850"
                        : "text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    <div className="h-1.5 w-1.5 rounded-full bg-amber-500"></div>
                    <span>কন্টাক্ট আপডেট</span>
                  </button>
                </div>
              )}
            </div>

            {/* Menu Bar Update Tab with Dropdown */}
            <div className="relative">
              <button
                id="admin-menubar-dropdown-trigger"
                onClick={() => {
                  setIsMenuBarDropdownOpen(!isMenuBarDropdownOpen);
                  setIsNoticeDropdownOpen(false);
                  setIsHeroDropdownOpen(false);
                  setIsSettingsDropdownOpen(false);
                }}
                className={`flex items-center space-x-1.5 px-4 py-2.5 rounded-lg text-xs font-bold transition-all ${
                  activeAdminSubTab === "sodosso_form_settings" || activeAdminSubTab === "kormochari_panel"
                    ? "bg-emerald-800 text-white shadow-sm"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                <Settings className="h-4 w-4 text-amber-500" />
                <span>মেনুবার আপডেট</span>
                <ChevronDown className={`h-3 w-3 transition-transform duration-200 ${isMenuBarDropdownOpen ? "rotate-180" : ""}`} />
              </button>
              
              {isMenuBarDropdownOpen && (
                <div className="absolute left-0 mt-1.5 w-56 bg-white border border-gray-100 rounded-lg shadow-lg py-1 z-30">
                  <button
                    id="admin-subtab-sodosso-form"
                    onClick={() => {
                      setActiveAdminSubTab("sodosso_form_settings");
                      setIsMenuBarDropdownOpen(false);
                    }}
                    className={`flex items-center space-x-2 w-full text-left px-4 py-2 text-xs font-bold ${
                      activeAdminSubTab === "sodosso_form_settings"
                        ? "bg-emerald-50 text-emerald-850"
                        : "text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    <div className="h-1.5 w-1.5 rounded-full bg-amber-500"></div>
                    <span>সদস্য ফরম</span>
                  </button>

                  <button
                    id="admin-subtab-kormochari-panel"
                    onClick={() => {
                      setActiveAdminSubTab("kormochari_panel");
                      setIsMenuBarDropdownOpen(false);
                    }}
                    className={`flex items-center space-x-2 w-full text-left px-4 py-2 text-xs font-bold ${
                      activeAdminSubTab === "kormochari_panel"
                        ? "bg-emerald-50 text-emerald-850"
                        : "text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-800"></div>
                    <span>কর্মচারী প্যানেল</span>
                  </button>
                </div>
              )}
            </div>

            {/* Messages tab as simple button */}
            <button
              id="admin-subtab-messages"
              onClick={() => {
                setActiveAdminSubTab("messages");
                setIsNoticeDropdownOpen(false);
                setIsHeroDropdownOpen(false);
                setIsSettingsDropdownOpen(false);
                setIsMenuBarDropdownOpen(false);
              }}
              className={`flex items-center space-x-1.5 px-4 py-2.5 rounded-lg text-xs font-bold transition-all ${
                activeAdminSubTab === "messages"
                  ? "bg-emerald-800 text-white shadow-sm"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              <Mail className="h-4 w-4" />
              <span>কন্টাক্ট বার্তা সমূহ</span>
            </button>
          </div>

          {/* Active List Headers */}
          <div className="flex justify-between items-center font-alinur">
            <div>
              <h3 className="text-lg font-bold text-emerald-950 font-serif">
                {activeAdminSubTab === "dashboard" && "ড্যাশবোর্ড ও সার্বিক পরিসংখ্যান"}
                {activeAdminSubTab === "admissions" && "ভর্তি আবেদন ট্র্যাকিং ও পেমেন্ট আপডেট"}
                {activeAdminSubTab === "teachers" && "শিক্ষক ও ফ্যাকাল্টি লিস্ট"}
                {activeAdminSubTab === "stories" && "শিক্ষার্থীদের সাকসেস স্টোরি কার্ডসমূহ"}
                {activeAdminSubTab === "committee" && "কমিটি সদস্যবৃন্দ ও দিকনির্দেশনা"}
                {activeAdminSubTab === "honored" && "স্মরণীয় ব্যক্তিগণ তালিকা"}
                {activeAdminSubTab === "routines" && "শ্রেণী ও পরীক্ষা রুটিনসমূহ"}
                {activeAdminSubTab === "messages" && "কন্টাক্ট মেসেজ ও অফিশিয়াল বার্তা"}
                {activeAdminSubTab === "settings" && "লগো আপডেট"}
                {activeAdminSubTab === "hero_background" && "হিরো সেকশন ব্যাকগ্রাউন্ড ইমেজ কাস্টমাইজেশন"}
                {activeAdminSubTab === "running_notices" && "চলমান নোটিশবোর্ড ও লাইভ নোটিশ ফিড"}
                {activeAdminSubTab === "public_notices" && "পাবলিক নোটিশবোর্ড ও লাইভ নোটিশ কন্টেন্ট"}
                {activeAdminSubTab === "pathdan_update" && "এক নজরে পাঠদান তথ্য এডিট ও কাস্টমাইজেশন"}
                {activeAdminSubTab === "sodosso_form_settings" && "সদস্য ফরম কন্টেন্ট এডিট ও কাস্টমাইজেশন"}
                {activeAdminSubTab === "contact_update" && "প্রাতিষ্ঠানিক যোগাযোগ ও ঠিকানা আপডেট"}
              </h3>
            </div>
            {activeAdminSubTab !== "dashboard" && activeAdminSubTab !== "admissions" && activeAdminSubTab !== "messages" && activeAdminSubTab !== "settings" && activeAdminSubTab !== "hero_background" && activeAdminSubTab !== "running_notices" && activeAdminSubTab !== "public_notices" && activeAdminSubTab !== "pathdan_update" && activeAdminSubTab !== "sodosso_form_settings" && activeAdminSubTab !== "contact_update" && activeAdminSubTab !== "routines" && (
              <button
                id="admin-add-new-btn"
                onClick={handleOpenAddForm}
                className="flex items-center space-x-1.5 bg-emerald-800 hover:bg-emerald-950 text-amber-400 font-bold py-2 px-3.5 rounded-lg text-xs shadow-sm transition-all"
              >
                <Plus className="h-4 w-4" />
                <span>নতুন যোগ করুন</span>
              </button>
            )}
          </div>

          {/* 0. Dashboard Overview */}
          {activeAdminSubTab === "dashboard" && (
            <div className="space-y-6 font-alinur">
              {/* Header Info */}
              <div className="bg-emerald-50 border-l-4 border-amber-500 p-4 rounded-r-xl shadow-xs">
                <h4 className="text-sm font-bold text-emerald-950">মাদ্রাসার সার্বিক রিয়েল-টাইম পরিসংখ্যান ও ড্যাশবোর্ড</h4>
                <p className="text-xs text-gray-600 mt-1">এখানে মাদ্রাসার রানিং সেশনের মোট শিক্ষার্থী, শিক্ষক, কর্মচারী এবং অনলাইন ভর্তির লাইভ ডেটা প্রদর্শিত হচ্ছে।</p>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                
                {/* 1. Total Students Card */}
                <div className="bg-white rounded-2xl p-5 border border-emerald-100 shadow-xs relative overflow-hidden flex flex-col justify-between min-h-[140px] hover:shadow-md transition-all">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-xs font-bold text-gray-500 block">মোট শিক্ষার্থী</span>
                      <div className="flex items-center gap-2 mt-2">
                        <select
                          value={selectedClass}
                          onChange={(e) => setSelectedClass(e.target.value)}
                          className="text-xs font-bold bg-emerald-50 text-emerald-900 border border-emerald-200 rounded-lg px-2 py-1 focus:outline-none"
                        >
                          <option value="All">সকল শ্রেণী</option>
                          <option value="৬ষ্ঠ শ্রেণী">৬ষ্ঠ শ্রেণী</option>
                          <option value="৭ম শ্রেণী">৭ম শ্রেণী</option>
                          <option value="৮ম শ্রেণী">৮ম শ্রেণী</option>
                          <option value="৯ম শ্রেণী">৯ম শ্রেণী</option>
                          <option value="১০ম শ্রেণী">১০ম শ্রেণী</option>
                        </select>
                      </div>
                    </div>
                    <div className="bg-emerald-50 p-2.5 rounded-xl border border-emerald-100">
                      <Users className="h-5 w-5 text-emerald-800" />
                    </div>
                  </div>
                  <div className="mt-3">
                    <StreamBuilder<any>
                      stream={collection(db, "students")}
                      builder={(students, loading, error) => {
                        if (loading) return <span className="text-sm font-bold text-emerald-800 animate-pulse">লোড হচ্ছে...</span>;
                        if (error) return <span className="text-xs text-red-500">ত্রুটি</span>;
                        const filtered = selectedClass === "All" 
                          ? students 
                          : students.filter(s => s.className === selectedClass);
                        return (
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-3xl font-black text-emerald-950 font-mono tracking-tight">{filtered.length}</span>
                            <span className="text-xs font-bold text-emerald-800">জন</span>
                          </div>
                        );
                      }}
                    />
                  </div>
                  <div className="absolute right-0 bottom-0 h-1.5 w-full bg-emerald-700/80"></div>
                </div>

                {/* 2. Total Teachers Card */}
                <div className="bg-white rounded-2xl p-5 border border-emerald-100 shadow-xs relative overflow-hidden flex flex-col justify-between min-h-[140px] hover:shadow-md transition-all">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-xs font-bold text-gray-500 block">মোট শিক্ষক</span>
                      <span className="text-[11px] font-bold text-emerald-700 block mt-1">শিক্ষক প্যানেল</span>
                    </div>
                    <div className="bg-emerald-50 p-2.5 rounded-xl border border-emerald-100">
                      <GraduationCap className="h-5 w-5 text-emerald-800" />
                    </div>
                  </div>
                  <div className="mt-3">
                    <StreamBuilder<any>
                      stream={collection(db, "teachers")}
                      builder={(teachers, loading, error) => {
                        if (loading) return <span className="text-sm font-bold text-emerald-800 animate-pulse">লোড হচ্ছে...</span>;
                        if (error) return <span className="text-xs text-red-500">ত্রুটি</span>;
                        return (
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-3xl font-black text-emerald-950 font-mono tracking-tight">{teachers.length}</span>
                            <span className="text-xs font-bold text-emerald-800">জন</span>
                          </div>
                        );
                      }}
                    />
                  </div>
                  <div className="absolute right-0 bottom-0 h-1.5 w-full bg-amber-500/80"></div>
                </div>

                {/* 3. Total Employees Card */}
                <div className="bg-white rounded-2xl p-5 border border-emerald-100 shadow-xs relative overflow-hidden flex flex-col justify-between min-h-[140px] hover:shadow-md transition-all">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-xs font-bold text-gray-500 block">মোট কর্মচারী</span>
                      <span className="text-[11px] font-bold text-emerald-700 block mt-1">কর্মচারী প্যানেল</span>
                    </div>
                    <div className="bg-emerald-50 p-2.5 rounded-xl border border-emerald-100">
                      <Users className="h-5 w-5 text-emerald-800" />
                    </div>
                  </div>
                  <div className="mt-3">
                    <StreamBuilder<any>
                      stream={collection(db, "employees")}
                      builder={(employees, loading, error) => {
                        if (loading) return <span className="text-sm font-bold text-emerald-800 animate-pulse">লোড হচ্ছে...</span>;
                        if (error) return <span className="text-xs text-red-500">ত্রুটি</span>;
                        return (
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-3xl font-black text-emerald-950 font-mono tracking-tight">{employees.length}</span>
                            <span className="text-xs font-bold text-emerald-800">জন</span>
                          </div>
                        );
                      }}
                    />
                  </div>
                  <div className="absolute right-0 bottom-0 h-1.5 w-full bg-emerald-850"></div>
                </div>

                {/* 4. Pending Applications Card */}
                <div className="bg-white rounded-2xl p-5 border border-emerald-100 shadow-xs relative overflow-hidden flex flex-col justify-between min-h-[140px] hover:shadow-md transition-all">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-xs font-bold text-gray-500 block">পেন্ডিং আবেদন</span>
                      <span className="text-[11px] font-bold text-red-600 block mt-1">অনলাইন ভর্তি</span>
                    </div>
                    <div className="bg-red-50 p-2.5 rounded-xl border border-red-100">
                      <Mail className="h-5 w-5 text-red-600" />
                    </div>
                  </div>
                  <div className="mt-3">
                    <StreamBuilder<any>
                      stream={collection(db, "admissions")}
                      builder={(admissions, loading, error) => {
                        if (loading) return <span className="text-sm font-bold text-emerald-800 animate-pulse">লোড হচ্ছে...</span>;
                        if (error) return <span className="text-xs text-red-500">ত্রুটি</span>;
                        const pending = admissions.filter(a => a.status === "Pending");
                        return (
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-3xl font-black text-red-600 font-mono tracking-tight">{pending.length}</span>
                            <span className="text-xs font-bold text-red-600">টি</span>
                          </div>
                        );
                      }}
                    />
                  </div>
                  <div className="absolute right-0 bottom-0 h-1.5 w-full bg-red-500/85"></div>
                </div>

              </div>

              {/* Graphical Overview Block / Quick Navigation */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
                <h3 className="font-bold text-base text-emerald-950 font-serif">মাদ্রাসার ক্লাসভিত্তিক শিক্ষার্থীর সংক্ষিপ্ত বিবরণী</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs sm:text-sm">
                    <thead>
                      <tr className="bg-emerald-50 text-emerald-950 font-bold border-b border-gray-100">
                        <th className="p-3">শ্রেণী</th>
                        <th className="p-3">রোল রেঞ্জ</th>
                        <th className="p-3 text-center">মোট শিক্ষার্থী</th>
                        <th className="p-3 text-center">স্ট্যাটাস</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {[
                        { name: "৬ষ্ঠ শ্রেণী", rolls: "১০১ - ১০৫" },
                        { name: "৭ম শ্রেণী", rolls: "২০১ - ২০৪" },
                        { name: "৮ম শ্রেণী", rolls: "৩০১ - ৩০৬" },
                        { name: "৯ম শ্রেণী", rolls: "৪০১ - ৪০৫" },
                        { name: "১০ম শ্রেণী", rolls: "৫০১ - ৫০৮" }
                      ].map((cls, idx) => (
                        <tr key={idx} className="hover:bg-emerald-50/10">
                          <td className="p-3 font-bold text-emerald-950">{cls.name}</td>
                          <td className="p-3 font-mono text-gray-500">{cls.rolls}</td>
                          <td className="p-3 text-center font-bold font-mono text-emerald-900">
                            <StreamBuilder<any>
                              stream={collection(db, "students")}
                              builder={(students) => {
                                const count = students.filter(s => s.className === cls.name).length;
                                return <span>{count} জন</span>;
                              }}
                            />
                          </td>
                          <td className="p-3 text-center">
                            <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-100">সক্রিয়</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* 1. Admissions Tracking List */}
          {activeAdminSubTab === "admissions" && (
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-emerald-50 text-emerald-950 font-bold border-b border-gray-100">
                    <th className="p-4">আবেদন কোড</th>
                    <th className="p-4">শিক্ষার্থীর নাম</th>
                    <th className="p-4">শ্রেণী</th>
                    <th className="p-4">পিতার নাম</th>
                    <th className="p-4">মোবাইল নং</th>
                    <th className="p-4">পেমেন্ট</th>
                    <th className="p-4">স্ট্যাটাস</th>
                    <th className="p-4 text-center">অ্যাকশন</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {admissions.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-gray-400 font-sans">
                        কোনো আবেদনের তথ্য পাওয়া যায়নি।
                      </td>
                    </tr>
                  ) : (
                    admissions.map((adm) => (
                      <tr key={adm.id} className="hover:bg-emerald-50/10">
                        <td className="p-4 font-mono font-bold text-xs">{adm.id || adm.form_id || "N/A"}</td>
                        <td className="p-4 font-bold">{adm.student_name}</td>
                        <td className="p-4">{adm.class_name || (adm as any).class}</td>
                        <td className="p-4 text-xs text-gray-600">{adm.father_name}</td>
                        <td className="p-4 font-mono text-xs">{adm.phone}</td>
                        <td className="p-4">
                          <button
                            onClick={() => handleToggleAdmissionPayment(adm.id, adm.payment_status)}
                            className={`flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold transition-all border ${
                              adm.payment_status === "Paid"
                                ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                                : "bg-red-50 text-red-800 border-red-300"
                            }`}
                          >
                            <CreditCard className="h-3 w-3" />
                            <span>{adm.payment_status === "Paid" ? "Paid" : "Unpaid"}</span>
                          </button>
                        </td>
                        <td className="p-4">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold ${
                            adm.status === "Approved" ? "bg-emerald-100 text-emerald-800" : adm.status === "Rejected" ? "bg-red-100 text-red-800" : "bg-amber-100 text-amber-800"
                          }`}>
                            {adm.status === "Approved" ? "অনুমোদিত" : adm.status === "Rejected" ? "বাতিল" : "পেন্ডিং"}
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          <div className="flex justify-center space-x-1">
                            <button
                              onClick={() => handleUpdateAdmissionStatus(adm.id, "Approved")}
                              title="Approve"
                              className="p-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded transition-colors"
                            >
                              <Check className="h-4.5 w-4.5" />
                            </button>
                            <button
                              onClick={() => handleUpdateAdmissionStatus(adm.id, "Rejected")}
                              title="Reject"
                              className="p-1 bg-red-50 hover:bg-red-100 text-red-700 rounded transition-colors"
                            >
                              <X className="h-4.5 w-4.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(adm.id, "admissions")}
                              className="p-1 bg-gray-50 hover:bg-gray-100 text-gray-500 rounded"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* 2. Teachers List Management */}
          {activeAdminSubTab === "teachers" && (
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-emerald-50 text-emerald-950 font-bold border-b border-gray-100">
                    <th className="p-4">ছবি</th>
                    <th className="p-4">নাম</th>
                    <th className="p-4">পদবী</th>
                    <th className="p-4">মোবাইল নং</th>
                    <th className="p-4">ইমেইল</th>
                    <th className="p-4 text-center">অ্যাকশন</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {teachers.map((item) => (
                    <tr key={item.id} className="hover:bg-emerald-50/10">
                      <td className="p-4">
                        <img src={item.photoUrl} alt="" className="w-10 h-10 object-cover rounded-full border border-emerald-600 shadow-sm" />
                      </td>
                      <td className="p-4 font-bold">{item.name}</td>
                      <td className="p-4">{item.designation}</td>
                      <td className="p-4 font-mono">{item.phone}</td>
                      <td className="p-4">{item.email || "N/A"}</td>
                      <td className="p-4 text-center">
                        <div className="flex justify-center space-x-2">
                          <button onClick={() => handleEdit(item, "teachers")} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded">
                            <Edit3 className="h-4 w-4" />
                          </button>
                          <button onClick={() => handleDelete(item.id, "teachers")} className="p-1.5 text-red-600 hover:bg-red-50 rounded">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* 3. Success Stories List Management */}
          {activeAdminSubTab === "stories" && (
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-emerald-50 text-emerald-950 font-bold border-b border-gray-100">
                    <th className="p-4">ছবি</th>
                    <th className="p-4">শিক্ষার্থীর নাম</th>
                    <th className="p-4">সাফল্য / বিবরণ</th>
                    <th className="p-4">বছর</th>
                    <th className="p-4 text-center">অ্যাকশন</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {stories.map((item) => (
                    <tr key={item.id} className="hover:bg-emerald-50/10">
                      <td className="p-4">
                        <img src={item.imageUrl} alt="" className="w-12 h-10 object-cover rounded-md border" />
                      </td>
                      <td className="p-4 font-bold">{item.student_name}</td>
                      <td className="p-4 text-xs text-gray-600 max-w-sm truncate">{item.achievement}</td>
                      <td className="p-4 font-mono font-bold">{item.year}</td>
                      <td className="p-4 text-center">
                        <div className="flex justify-center space-x-2">
                          <button onClick={() => handleEdit(item, "stories")} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded">
                            <Edit3 className="h-4 w-4" />
                          </button>
                          <button onClick={() => handleDelete(item.id, "success_stories")} className="p-1.5 text-red-600 hover:bg-red-50 rounded">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* 4. Committee List Management */}
          {activeAdminSubTab === "committee" && (
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-emerald-50 text-emerald-950 font-bold border-b border-gray-100">
                    <th className="p-4">সদস্য ছবি</th>
                    <th className="p-4">নাম</th>
                    <th className="p-4">পদবী</th>
                    <th className="p-4">ক্রম (Rank)</th>
                    <th className="p-4">বাণী / বক্তব্য</th>
                    <th className="p-4 text-center">অ্যাকশন</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {committee.map((item) => (
                    <tr key={item.id} className="hover:bg-emerald-50/10">
                      <td className="p-4">
                        <img src={item.imageUrl} alt="" className="w-10 h-10 object-cover rounded-full border border-emerald-500" />
                      </td>
                      <td className="p-4 font-bold">{item.name}</td>
                      <td className="p-4 text-amber-800 font-bold">{item.role}</td>
                      <td className="p-4 font-mono">{item.rank}</td>
                      <td className="p-4 text-xs max-w-xs truncate">{item.speech || "বাণী নেই"}</td>
                      <td className="p-4 text-center">
                        <div className="flex justify-center space-x-2">
                          <button onClick={() => handleEdit(item, "committee")} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded">
                            <Edit3 className="h-4 w-4" />
                          </button>
                          <button onClick={() => handleDelete(item.id, "committee")} className="p-1.5 text-red-600 hover:bg-red-50 rounded">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* 5. Honored Persons List Management */}
          {activeAdminSubTab === "honored" && (
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-emerald-50 text-emerald-950 font-bold border-b border-gray-100">
                    <th className="p-4">ছবি</th>
                    <th className="p-4">স্মরণীয় ব্যক্তিত্ব নাম</th>
                    <th className="p-4">জন্ম ও মৃত্যু সাল</th>
                    <th className="p-4">অবদান ও হিতৈষণা বিবরণ</th>
                    <th className="p-4 text-center">অ্যাকশন</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {honored.map((item) => (
                    <tr key={item.id} className="hover:bg-emerald-50/10">
                      <td className="p-4">
                        <img src={item.imageUrl} alt="" className="w-10 h-10 object-cover rounded-full border" />
                      </td>
                      <td className="p-4 font-bold">{item.name}</td>
                      <td className="p-4 font-mono text-emerald-800 font-bold">{item.birth_death}</td>
                      <td className="p-4 text-xs max-w-sm truncate">{item.contribution}</td>
                      <td className="p-4 text-center">
                        <div className="flex justify-center space-x-2">
                          <button onClick={() => handleEdit(item, "honored")} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded">
                            <Edit3 className="h-4 w-4" />
                          </button>
                          <button onClick={() => handleDelete(item.id, "honored_persons")} className="p-1.5 text-red-600 hover:bg-red-50 rounded">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* 6. Routines List Management with dedicated class routine sub-menu & form validation */}
          {activeAdminSubTab === "routines" && (
            <div className="space-y-6 font-alinur" style={{ fontFamily: '"Alinur Tatsama", "Hind Siliguri", "Anek Bangla", sans-serif' }}>
              {/* Local Sub-Menu bar */}
              <div className="flex border-b border-gray-200 pb-1 gap-2">
                <button
                  onClick={() => setActiveRoutineSubMenu("class_routine")}
                  className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all ${
                    activeRoutineSubMenu === "class_routine"
                      ? "border-indigo-600 text-indigo-700 font-black"
                      : "border-transparent text-gray-500 hover:text-indigo-600"
                  }`}
                  style={{ fontFamily: '"Alinur Tatsama", "Hind Siliguri", "Anek Bangla", sans-serif' }}
                >
                  <Calendar className="h-4 w-4 text-indigo-600" />
                  <span>ক্লাস রুটিন</span>
                </button>
                <button
                  onClick={() => setActiveRoutineSubMenu("exam_routine")}
                  className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all ${
                    activeRoutineSubMenu === "exam_routine"
                      ? "border-indigo-600 text-indigo-700 font-black"
                      : "border-transparent text-gray-500 hover:text-indigo-600"
                  }`}
                  style={{ fontFamily: '"Alinur Tatsama", "Hind Siliguri", "Anek Bangla", sans-serif' }}
                >
                  <Calendar className="h-4 w-4 text-indigo-600" />
                  <span>পরীক্ষা রুটিন</span>
                </button>
              </div>

              {activeRoutineSubMenu === "class_routine" && (
                <div className="space-y-6">
                  {/* Initially Closed Form Button */}
                  {!isRoutineFormOpen && !editingRoutineId && (
                    <div className="flex justify-start">
                      <button
                        onClick={() => {
                          setIsRoutineFormOpen(true);
                          setRoutineSubjects([{ subject: "", time: "", teacherName: "", room: "" }]);
                          setRowValidationErrors([]);
                        }}
                        className="bg-indigo-700 hover:bg-indigo-850 text-white font-bold py-2.5 px-6 rounded-xl text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer"
                        style={{ fontFamily: '"Alinur Tatsama", "Hind Siliguri", "Anek Bangla", sans-serif' }}
                      >
                        <Calendar className="h-4.5 w-4.5" />
                        <span>ক্লাস রুটিন যোগ করুন</span>
                      </button>
                    </div>
                  )}

                  {/* Embedded Form Section */}
                  {(isRoutineFormOpen || editingRoutineId) && (
                    <div 
                      id="local-routine-form-section" 
                      className="bg-white border border-indigo-100 rounded-2xl shadow-xs overflow-hidden p-6 space-y-4"
                    >
                      <div className="flex items-center justify-between border-b border-indigo-50 pb-3">
                        <h4 
                          className="text-base font-black text-indigo-950 flex items-center gap-2"
                          style={{ fontFamily: '"Alinur Tatsama", "Hind Siliguri", "Anek Bangla", sans-serif' }}
                        >
                          <Calendar className="h-5 w-5 text-indigo-600" />
                          <span>{editingRoutineId ? "ক্লাস রুটিন আপডেট ও সংশোধন করুন" : "নতুন ক্লাস রুটিন তৈরি করুন"}</span>
                        </h4>
                        <button
                          onClick={handleCancelEditRoutine}
                          className="text-xs font-bold text-red-600 hover:text-red-800 flex items-center gap-1 cursor-pointer"
                          style={{ fontFamily: '"Alinur Tatsama", "Hind Siliguri", "Anek Bangla", sans-serif' }}
                        >
                          <X className="h-4 w-4" />
                          <span>ফর্ম বন্ধ করুন</span>
                        </button>
                      </div>

                      {routineSaveSuccess && (
                        <div className="bg-emerald-50 border border-emerald-150 text-emerald-800 text-xs font-bold px-4 py-3 rounded-xl">
                          ✓ ক্লাস রুটিন সফলভাবে সংরক্ষিত হয়েছে!
                        </div>
                      )}

                      <form onSubmit={handleSaveRoutine} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Class Dropdown Selection */}
                          <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                              <span>ক্লাস</span>
                              <span className="text-red-500">*</span>
                            </label>
                            <select
                              value={routineClassInput}
                              onChange={(e) => {
                                setRoutineClassInput(e.target.value);
                                if (e.target.value) setRoutineClassError("");
                              }}
                              className={`w-full bg-slate-50 border ${routineClassError ? "border-red-400 focus:ring-red-500" : "border-indigo-100 focus:ring-indigo-500"} rounded-xl px-3 py-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2`}
                              style={{ fontFamily: '"Alinur Tatsama", "Hind Siliguri", "Anek Bangla", sans-serif' }}
                            >
                              <option value="">-- ক্লাস সিলেক্ট করুন --</option>
                              <option value="শিশু শ্রেণি">শিশু শ্রেণি</option>
                              <option value="১ম শ্রেণি">১ম শ্রেণি</option>
                              <option value="২য় শ্রেণি">২য় শ্রেণি</option>
                              <option value="৩য় শ্রেণি">৩য় শ্রেণি</option>
                              <option value="৪র্থ শ্রেণি">৪র্থ শ্রেণি</option>
                              <option value="৫ম শ্রেণি">৫ম শ্রেণি</option>
                              <option value="৬ষ্ঠ শ্রেণি">৬ষ্ঠ শ্রেণি</option>
                              <option value="৭ম শ্রেণি">৭ম শ্রেণি</option>
                              <option value="৮ম শ্রেণি">৮ম শ্রেণি</option>
                              <option value="৯ম শ্রেণি">৯ম শ্রেণি</option>
                              <option value="১০ম শ্রেণি">১০ম শ্রেণি</option>
                            </select>
                            {routineClassError && (
                              <p className="text-red-500 text-[10px] font-bold mt-1">{routineClassError}</p>
                            )}
                          </div>

                          {/* Day Dropdown Selection */}
                          <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                              <span>দিন</span>
                              <span className="text-red-500">*</span>
                            </label>
                            <select
                              value={routineDayInput}
                              onChange={(e) => {
                                setRoutineDayInput(e.target.value);
                                if (e.target.value) setRoutineDayError("");
                              }}
                              className={`w-full bg-slate-50 border ${routineDayError ? "border-red-400 focus:ring-red-500" : "border-indigo-100 focus:ring-indigo-500"} rounded-xl px-3 py-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2`}
                              style={{ fontFamily: '"Alinur Tatsama", "Hind Siliguri", "Anek Bangla", sans-serif' }}
                            >
                              <option value="">-- দিন সিলেক্ট করুন --</option>
                              <option value="শনিবার">শনিবার</option>
                              <option value="রবিবার">রবিবার</option>
                              <option value="সোমবার">সোমবার</option>
                              <option value="মঙ্গলবার">মঙ্গলবার</option>
                              <option value="বুধবার">বুধবার</option>
                              <option value="বৃহস্পতিবার">বৃহস্পতিবার</option>
                            </select>
                            {routineDayError && (
                              <p className="text-red-500 text-[10px] font-bold mt-1">{routineDayError}</p>
                            )}
                          </div>
                        </div>

                        {/* Dynamic Subject Rows */}
                        <div className="space-y-4 pt-4 border-t border-indigo-50">
                          <div className="flex justify-between items-center">
                            <h5 className="text-xs font-black text-indigo-950">রুটিন বিষয়সমূহের তালিকা</h5>
                            {!editingRoutineId && (
                              <button
                                type="button"
                                onClick={handleAddSubjectRow}
                                className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold py-1.5 px-3 rounded-lg text-xs flex items-center gap-1 cursor-pointer transition-colors"
                              >
                                <span>+ সাবজেক্ট যোগ করুন</span>
                              </button>
                            )}
                          </div>

                          <div className="space-y-3">
                            {routineSubjects.map((row, index) => (
                              <div 
                                key={index} 
                                className="bg-slate-50/50 p-4 rounded-xl border border-slate-100 space-y-3 relative md:space-y-0 md:grid md:grid-cols-4 md:gap-3 md:items-end"
                              >
                                {/* Subject Name */}
                                <div className="space-y-1">
                                  <label className="text-[11px] font-bold text-slate-600 block">বিষয় (Subject) *</label>
                                  <input
                                    type="text"
                                    value={row.subject}
                                    onChange={(e) => handleUpdateSubjectRowField(index, "subject", e.target.value)}
                                    placeholder="এখানে সাবজেক্ট এর নাম লিখুন"
                                    className={`w-full bg-white border ${
                                      rowValidationErrors[index]?.subject ? "border-red-400 focus:ring-red-500" : "border-slate-200 focus:ring-indigo-500"
                                    } rounded-lg px-2.5 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2`}
                                    style={{ fontFamily: '"Alinur Tatsama", "Hind Siliguri", "Anek Bangla", sans-serif' }}
                                  />
                                </div>

                                {/* Time */}
                                <div className="space-y-1">
                                  <label className="text-[11px] font-bold text-slate-600 block">সময় ও ঘণ্টা *</label>
                                  <input
                                    type="text"
                                    value={row.time}
                                    onChange={(e) => handleUpdateSubjectRowField(index, "time", e.target.value)}
                                    placeholder="যেমন: ০৯:০০ AM"
                                    className={`w-full bg-white border ${
                                      rowValidationErrors[index]?.time ? "border-red-400 focus:ring-red-500" : "border-slate-200 focus:ring-indigo-500"
                                    } rounded-lg px-2.5 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2`}
                                    style={{ fontFamily: '"Alinur Tatsama", "Hind Siliguri", "Anek Bangla", sans-serif' }}
                                  />
                                </div>

                                {/* Teacher */}
                                <div className="space-y-1">
                                  <label className="text-[11px] font-bold text-slate-600 block">দ্বায়িত্বপ্রাপ্ত শিক্ষক *</label>
                                  <input
                                    type="text"
                                    value={row.teacherName}
                                    onChange={(e) => handleUpdateSubjectRowField(index, "teacherName", e.target.value)}
                                    placeholder="शिक्षকের নাম"
                                    className={`w-full bg-white border ${
                                      rowValidationErrors[index]?.teacherName ? "border-red-400 focus:ring-red-500" : "border-slate-200 focus:ring-indigo-500"
                                    } rounded-lg px-2.5 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2`}
                                    style={{ fontFamily: '"Alinur Tatsama", "Hind Siliguri", "Anek Bangla", sans-serif' }}
                                  />
                                </div>

                                {/* Room Number + Delete row */}
                                <div className="flex gap-2 items-center">
                                  <div className="space-y-1 flex-1">
                                    <label className="text-[11px] font-bold text-slate-600 block">কক্ষ নম্বর (ঐচ্ছিক)</label>
                                    <input
                                      type="text"
                                      value={row.room}
                                      onChange={(e) => handleUpdateSubjectRowField(index, "room", e.target.value)}
                                      placeholder="যেমন: ১০১"
                                      className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                      style={{ fontFamily: '"Alinur Tatsama", "Hind Siliguri", "Anek Bangla", sans-serif' }}
                                    />
                                  </div>

                                  {routineSubjects.length > 1 && !editingRoutineId && (
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveSubjectRow(index)}
                                      className="p-2 bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 rounded-lg mt-5 cursor-pointer transition-colors"
                                      title="বাদ দিন"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Form action buttons */}
                        <div className="flex justify-end gap-2 pt-2 border-t border-indigo-50">
                          <button
                            type="button"
                            onClick={handleCancelEditRoutine}
                            className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-2.5 px-5 rounded-xl text-xs transition-all cursor-pointer"
                            style={{ fontFamily: '"Alinur Tatsama", "Hind Siliguri", "Anek Bangla", sans-serif' }}
                          >
                            বাতিল করুন
                          </button>
                          <button
                            type="submit"
                            className="bg-indigo-700 hover:bg-indigo-850 text-white font-bold py-2.5 px-6 rounded-xl text-xs shadow-sm transition-all cursor-pointer"
                            style={{ fontFamily: '"Alinur Tatsama", "Hind Siliguri", "Anek Bangla", sans-serif' }}
                          >
                            {editingRoutineId ? "আপডেট করুন" : "রুটিন প্রকাশ করুন"}
                          </button>
                        </div>
                      </form>
                    </div>
                  )}

                  {/* Class Routines Table List */}
                  <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                    <div className="bg-slate-50 px-5 py-4 border-b border-gray-100 flex justify-between items-center">
                      <h4 
                        className="text-xs font-bold text-slate-700"
                        style={{ fontFamily: '"Alinur Tatsama", "Hind Siliguri", "Anek Bangla", sans-serif' }}
                      >
                        মোট ক্লাস রুটিন শিডিউল তালিকা ({routines.filter(r => r.type === "class").length} টি)
                      </h4>
                    </div>

                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50/50 text-slate-700 font-bold border-b border-gray-100">
                          <th className="p-4" style={{ fontFamily: '"Alinur Tatsama", "Hind Siliguri", "Anek Bangla", sans-serif' }}>শ্রেণী</th>
                          <th className="p-4" style={{ fontFamily: '"Alinur Tatsama", "Hind Siliguri", "Anek Bangla", sans-serif' }}>বিষয়</th>
                          <th className="p-4" style={{ fontFamily: '"Alinur Tatsama", "Hind Siliguri", "Anek Bangla", sans-serif' }}>সময় ও ঘণ্টা</th>
                          <th className="p-4" style={{ fontFamily: '"Alinur Tatsama", "Hind Siliguri", "Anek Bangla", sans-serif' }}>দিন</th>
                          <th className="p-4" style={{ fontFamily: '"Alinur Tatsama", "Hind Siliguri", "Anek Bangla", sans-serif' }}>শিক্ষক</th>
                          <th className="p-4" style={{ fontFamily: '"Alinur Tatsama", "Hind Siliguri", "Anek Bangla", sans-serif' }}>কক্ষ</th>
                          <th className="p-4 text-center" style={{ fontFamily: '"Alinur Tatsama", "Hind Siliguri", "Anek Bangla", sans-serif' }}>অ্যাকশন</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {routines
                          .filter((item) => item.type === "class")
                          .map((item) => (
                            <tr key={item.id} className="hover:bg-slate-50/50">
                              <td className="p-4 font-bold text-slate-800" style={{ fontFamily: '"Alinur Tatsama", "Hind Siliguri", "Anek Bangla", sans-serif' }}>{item.className}</td>
                              <td className="p-4 text-slate-800" style={{ fontFamily: '"Alinur Tatsama", "Hind Siliguri", "Anek Bangla", sans-serif' }}>{item.subject}</td>
                              <td className="p-4 font-mono font-bold text-slate-600">{item.time}</td>
                              <td className="p-4 font-bold text-slate-700" style={{ fontFamily: '"Alinur Tatsama", "Hind Siliguri", "Anek Bangla", sans-serif' }}>{item.dayOrDate}</td>
                              <td className="p-4 font-bold text-slate-700" style={{ fontFamily: '"Alinur Tatsama", "Hind Siliguri", "Anek Bangla", sans-serif' }}>{item.teacherName || "অনির্দিষ্ট"}</td>
                              <td className="p-4 font-bold text-slate-500" style={{ fontFamily: '"Alinur Tatsama", "Hind Siliguri", "Anek Bangla", sans-serif' }}>{item.room}</td>
                              <td className="p-4 text-center">
                                <div className="flex justify-center space-x-2">
                                  <button
                                    onClick={() => handleEditRoutineLocal(item)}
                                    className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded cursor-pointer"
                                    title="সম্পাদনা করুন"
                                  >
                                    <Edit3 className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={() => handleDelete(item.id, "routines")}
                                    className="p-1.5 text-red-600 hover:bg-red-50 rounded cursor-pointer"
                                    title="মুছে ফেলুন"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        {routines.filter((item) => item.type === "class").length === 0 && (
                          <tr>
                            <td colSpan={7} className="p-8 text-center text-gray-400 font-bold" style={{ fontFamily: '"Alinur Tatsama", "Hind Siliguri", "Anek Bangla", sans-serif' }}>
                              কোনো ক্লাস রুটিন তথ্য পাওয়া যায়নি।
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeRoutineSubMenu === "exam_routine" && (
                <div className="space-y-6">
                  {/* Initially Closed Form Button */}
                  {!isExamFormOpen && !editingExamId && (
                    <div className="flex justify-start">
                      <button
                        onClick={() => {
                          setIsExamFormOpen(true);
                          setExamSubjects([{ date: "", subject: "", time: "", totalMarks: "", subjectCode: "" }]);
                          setExamGuidelinesInput([""]);
                          setRowExamValidationErrors([]);
                        }}
                        className="bg-indigo-700 hover:bg-indigo-850 text-white font-bold py-2.5 px-6 rounded-xl text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer"
                        style={{ fontFamily: '"Alinur Tatsama", "Hind Siliguri", "Anek Bangla", sans-serif' }}
                      >
                        <Calendar className="h-4.5 w-4.5" />
                        <span>পরীক্ষা রুটিন যোগ করুন</span>
                      </button>
                    </div>
                  )}

                  {/* Embedded Exam Form Section */}
                  {(isExamFormOpen || editingExamId) && (
                    <div 
                      id="exam-routine-form-section" 
                      className="bg-white border border-indigo-100 rounded-2xl shadow-xs overflow-hidden p-6 space-y-4"
                    >
                      <div className="flex items-center justify-between border-b border-indigo-50 pb-3">
                        <h4 
                          className="text-base font-black text-indigo-950 flex items-center gap-2"
                          style={{ fontFamily: '"Alinur Tatsama", "Hind Siliguri", "Anek Bangla", sans-serif' }}
                        >
                          <Calendar className="h-5 w-5 text-indigo-600" />
                          <span>{editingExamId ? "পরীক্ষা রুটিন আপডেট ও সংশোধন করুন" : "নতুন পরীক্ষা রুটিন তৈরি করুন"}</span>
                        </h4>
                        <button
                          onClick={handleCancelEditExam}
                          className="text-xs font-bold text-red-600 hover:text-red-800 flex items-center gap-1 cursor-pointer"
                          style={{ fontFamily: '"Alinur Tatsama", "Hind Siliguri", "Anek Bangla", sans-serif' }}
                        >
                          <X className="h-4 w-4" />
                          <span>ফর্ম বন্ধ করুন</span>
                        </button>
                      </div>

                      {examSaveSuccess && (
                        <div className="bg-emerald-50 border border-emerald-150 text-emerald-800 text-xs font-bold px-4 py-3 rounded-xl">
                          ✓ পরীক্ষা রুটিন সফলভাবে সংরক্ষিত হয়েছে!
                        </div>
                      )}

                      <form onSubmit={handleSaveExamRoutine} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Class Dropdown Selection */}
                          <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                              <span>ক্লাস</span>
                              <span className="text-red-500">*</span>
                            </label>
                            <select
                              value={examClassInput}
                              onChange={(e) => {
                                setExamClassInput(e.target.value);
                                if (e.target.value) setExamClassError("");
                              }}
                              className={`w-full bg-slate-50 border ${examClassError ? "border-red-400 focus:ring-red-500" : "border-indigo-100 focus:ring-indigo-500"} rounded-xl px-3 py-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2`}
                              style={{ fontFamily: '"Alinur Tatsama", "Hind Siliguri", "Anek Bangla", sans-serif' }}
                            >
                              <option value="">-- ক্লাস সিলেক্ট করুন --</option>
                              <option value="শিশু শ্রেণি">শিশু শ্রেণি</option>
                              <option value="১ম শ্রেণি">১ম শ্রেণি</option>
                              <option value="২য় শ্রেণি">২য় শ্রেণি</option>
                              <option value="৩য় শ্রেণি">৩য় শ্রেণি</option>
                              <option value="৪র্থ শ্রেণি">৪র্থ শ্রেণি</option>
                              <option value="৫ম শ্রেণি">৫ম শ্রেণি</option>
                              <option value="৬ষ্ঠ শ্রেণি">৬ষ্ঠ শ্রেণি</option>
                              <option value="৭ম শ্রেণি">৭ম শ্রেণি</option>
                              <option value="৮ম শ্রেণি">৮ম শ্রেণি</option>
                              <option value="৯ম শ্রেণি">৯ম শ্রেণি</option>
                              <option value="১০ম শ্রেণি">১০ম শ্রেণি</option>
                            </select>
                            {examClassError && (
                              <p className="text-red-500 text-[10px] font-bold mt-1">{examClassError}</p>
                            )}
                          </div>

                          {/* Exam Name */}
                          <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                              <span>পরীক্ষার নাম</span>
                              <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              value={examNameInput}
                              onChange={(e) => {
                                setExamNameInput(e.target.value);
                                if (e.target.value) setExamNameError("");
                              }}
                              placeholder="যেমন: বার্ষিক পরীক্ষা ২০২৬, অর্ধবার্ষিক পরীক্ষা"
                              className={`w-full bg-slate-50 border ${examNameError ? "border-red-400 focus:ring-red-500" : "border-indigo-100 focus:ring-indigo-500"} rounded-xl px-3 py-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2`}
                              style={{ fontFamily: '"Alinur Tatsama", "Hind Siliguri", "Anek Bangla", sans-serif' }}
                            />
                            {examNameError && (
                              <p className="text-red-500 text-[10px] font-bold mt-1">{examNameError}</p>
                            )}
                          </div>
                        </div>

                        {/* Dynamic Subject Rows */}
                        <div className="space-y-4 pt-4 border-t border-indigo-50">
                          <div className="flex justify-between items-center">
                            <h5 className="text-xs font-black text-indigo-950">পরীক্ষার বিষয় ও সময়সূচী</h5>
                            <button
                              type="button"
                              onClick={handleAddExamSubjectRow}
                              className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold py-1.5 px-3 rounded-lg text-xs flex items-center gap-1 cursor-pointer transition-colors"
                            >
                              <span>+ বিষয় যোগ করুন</span>
                            </button>
                          </div>

                          <div className="space-y-3">
                            {examSubjects.map((row, index) => (
                              <div 
                                key={index} 
                                className="bg-slate-50/50 p-4 rounded-xl border border-slate-100 space-y-3 relative md:space-y-0 md:grid md:grid-cols-5 md:gap-3 md:items-end"
                              >
                                {/* Date */}
                                <div className="space-y-1">
                                  <label className="text-[11px] font-bold text-slate-600 block">তারিখ *</label>
                                  <input
                                    type="text"
                                    value={row.date}
                                    onChange={(e) => handleUpdateExamSubjectRowField(index, "date", e.target.value)}
                                    placeholder="যেমন: ১৫/০৭/২০২৬"
                                    className={`w-full bg-white border ${
                                      rowExamValidationErrors[index]?.date ? "border-red-400 focus:ring-red-500" : "border-slate-200 focus:ring-indigo-500"
                                    } rounded-lg px-2.5 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2`}
                                    style={{ fontFamily: '"Alinur Tatsama", "Hind Siliguri", "Anek Bangla", sans-serif' }}
                                  />
                                </div>

                                {/* Subject Name */}
                                <div className="space-y-1">
                                  <label className="text-[11px] font-bold text-slate-600 block">বিষয় *</label>
                                  <input
                                    type="text"
                                    value={row.subject}
                                    onChange={(e) => handleUpdateExamSubjectRowField(index, "subject", e.target.value)}
                                    placeholder="যেমন: কুরআন মাজীদ"
                                    className={`w-full bg-white border ${
                                      rowExamValidationErrors[index]?.subject ? "border-red-400 focus:ring-red-500" : "border-slate-200 focus:ring-indigo-500"
                                    } rounded-lg px-2.5 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2`}
                                    style={{ fontFamily: '"Alinur Tatsama", "Hind Siliguri", "Anek Bangla", sans-serif' }}
                                  />
                                </div>

                                {/* Time */}
                                <div className="space-y-1">
                                  <label className="text-[11px] font-bold text-slate-600 block">সময় *</label>
                                  <input
                                    type="text"
                                    value={row.time}
                                    onChange={(e) => handleUpdateExamSubjectRowField(index, "time", e.target.value)}
                                    placeholder="যেমন: ১০:০০ - ০১:০০"
                                    className={`w-full bg-white border ${
                                      rowExamValidationErrors[index]?.time ? "border-red-400 focus:ring-red-500" : "border-slate-200 focus:ring-indigo-500"
                                    } rounded-lg px-2.5 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2`}
                                    style={{ fontFamily: '"Alinur Tatsama", "Hind Siliguri", "Anek Bangla", sans-serif' }}
                                  />
                                </div>

                                {/* Total Marks */}
                                <div className="space-y-1">
                                  <label className="text-[11px] font-bold text-slate-600 block">নাম্বার *</label>
                                  <input
                                    type="text"
                                    value={row.totalMarks}
                                    onChange={(e) => handleUpdateExamSubjectRowField(index, "totalMarks", e.target.value)}
                                    placeholder="যেমন: ১০০"
                                    className={`w-full bg-white border ${
                                      rowExamValidationErrors[index]?.totalMarks ? "border-red-400 focus:ring-red-500" : "border-slate-200 focus:ring-indigo-500"
                                    } rounded-lg px-2.5 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2`}
                                    style={{ fontFamily: '"Alinur Tatsama", "Hind Siliguri", "Anek Bangla", sans-serif' }}
                                  />
                                </div>

                                {/* Subject Code */}
                                <div className="flex gap-2 items-center">
                                  <div className="space-y-1 flex-1">
                                    <label className="text-[11px] font-bold text-slate-600 block">বিষয় কোড *</label>
                                    <input
                                      type="text"
                                      value={row.subjectCode}
                                      onChange={(e) => handleUpdateExamSubjectRowField(index, "subjectCode", e.target.value)}
                                      placeholder="যেমন: ১০১"
                                      className={`w-full bg-white border ${
                                        rowExamValidationErrors[index]?.subjectCode ? "border-red-400 focus:ring-red-500" : "border-slate-200 focus:ring-indigo-500"
                                      } rounded-lg px-2.5 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2`}
                                      style={{ fontFamily: '"Alinur Tatsama", "Hind Siliguri", "Anek Bangla", sans-serif' }}
                                    />
                                  </div>

                                  {examSubjects.length > 1 && (
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveExamSubjectRow(index)}
                                      className="p-2 bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 rounded-lg mt-5 cursor-pointer transition-colors"
                                      title="বাদ দিন"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Guidelines (5 lines) */}
                        <div className="space-y-3 pt-4 border-t border-indigo-50">
                          <div className="flex justify-between items-center">
                            <h5 
                              className="text-xs font-black text-indigo-950"
                              style={{ fontFamily: '"Alinur Tatsama", "Hind Siliguri", "Anek Bangla", sans-serif' }}
                            >
                              পরীক্ষার্থীদের সাধারণ নির্দেশনা (সর্বোচ্চ ৫টি)
                            </h5>
                            {examGuidelinesInput.length < 5 && (
                              <button
                                type="button"
                                onClick={() => setExamGuidelinesInput([...examGuidelinesInput, ""])}
                                className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold py-1 px-2.5 rounded-lg text-[10px] flex items-center gap-1 cursor-pointer transition-colors"
                                style={{ fontFamily: '"Alinur Tatsama", "Hind Siliguri", "Anek Bangla", sans-serif' }}
                              >
                                <span>+ নির্দেশনা যোগ করুন</span>
                              </button>
                            )}
                          </div>
                          <div className="grid grid-cols-1 gap-2">
                            {examGuidelinesInput.map((gl, i) => (
                              <div key={i} className="flex items-center gap-2 animate-fade-in">
                                <span className="text-xs font-bold text-indigo-900 w-6 font-mono">
                                  {(() => {
                                    const bnDigits = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
                                    return (i + 1).toString().replace(/[0-9]/g, (d) => bnDigits[parseInt(d)]);
                                  })()}.
                                </span>
                                <input
                                  type="text"
                                  value={gl}
                                  onChange={(e) => handleUpdateExamGuideline(i, e.target.value)}
                                  placeholder="এখানে শিক্ষার্থীদের জন্য নির্দেশনা যোগ করুন"
                                  className="flex-1 bg-slate-50 border border-indigo-100 rounded-lg px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                  style={{ fontFamily: '"Alinur Tatsama", "Hind Siliguri", "Anek Bangla", sans-serif' }}
                                />
                                {examGuidelinesInput.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => setExamGuidelinesInput(examGuidelinesInput.filter((_, idx) => idx !== i))}
                                    className="p-2 bg-red-50 hover:bg-red-100 border border-red-150 text-red-600 rounded-lg cursor-pointer transition-colors"
                                    title="বাদ দিন"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Form action buttons */}
                        <div className="flex justify-end gap-2 pt-4 border-t border-indigo-50">
                          <button
                            type="button"
                            onClick={handleCancelEditExam}
                            className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-2.5 px-5 rounded-xl text-xs transition-all cursor-pointer"
                            style={{ fontFamily: '"Alinur Tatsama", "Hind Siliguri", "Anek Bangla", sans-serif' }}
                          >
                            বাতিল করুন
                          </button>
                          <button
                            type="submit"
                            className="bg-indigo-700 hover:bg-indigo-850 text-white font-bold py-2.5 px-6 rounded-xl text-xs shadow-sm transition-all cursor-pointer"
                            style={{ fontFamily: '"Alinur Tatsama", "Hind Siliguri", "Anek Bangla", sans-serif' }}
                          >
                            {editingExamId ? "আপডেট করুন" : "পরীক্ষা রুটিন প্রকাশ করুন"}
                          </button>
                        </div>
                      </form>
                    </div>
                  )}

                  {/* Exam Routines Table List */}
                  <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                    <div className="bg-slate-50 px-5 py-4 border-b border-gray-100 flex justify-between items-center">
                      <h4 
                        className="text-xs font-bold text-slate-700"
                        style={{ fontFamily: '"Alinur Tatsama", "Hind Siliguri", "Anek Bangla", sans-serif' }}
                      >
                        মোট পরীক্ষা রুটিন শিডিউল তালিকা ({routines.filter(r => r.type === "exam").length} টি)
                      </h4>
                    </div>

                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50/50 text-slate-700 font-bold border-b border-gray-100">
                          <th className="p-4" style={{ fontFamily: '"Alinur Tatsama", "Hind Siliguri", "Anek Bangla", sans-serif' }}>শ্রেণী</th>
                          <th className="p-4" style={{ fontFamily: '"Alinur Tatsama", "Hind Siliguri", "Anek Bangla", sans-serif' }}>পরীক্ষার নাম</th>
                          <th className="p-4 text-center" style={{ fontFamily: '"Alinur Tatsama", "Hind Siliguri", "Anek Bangla", sans-serif' }}>মোট বিষয়</th>
                          <th className="p-4 text-center" style={{ fontFamily: '"Alinur Tatsama", "Hind Siliguri", "Anek Bangla", sans-serif' }}>অ্যাকশন</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {routines
                          .filter((item) => item.type === "exam")
                          .map((item) => (
                            <tr key={item.id} className="hover:bg-slate-50/50">
                              <td className="p-4 font-bold text-slate-800" style={{ fontFamily: '"Alinur Tatsama", "Hind Siliguri", "Anek Bangla", sans-serif' }}>{item.className}</td>
                              <td className="p-4 text-indigo-900 font-black" style={{ fontFamily: '"Alinur Tatsama", "Hind Siliguri", "Anek Bangla", sans-serif' }}>{item.examName}</td>
                              <td className="p-4 text-center font-bold text-slate-600">{(item.subjects || []).length} টি বিষয়</td>
                              <td className="p-4 text-center">
                                <div className="flex justify-center space-x-2">
                                  <button
                                    onClick={() => handleEditExamLocal(item)}
                                    className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded cursor-pointer"
                                    title="সম্পাদনা করুন"
                                  >
                                    <Edit3 className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={() => handleDelete(item.id, "routines")}
                                    className="p-1.5 text-red-600 hover:bg-red-50 rounded cursor-pointer"
                                    title="মুছে ফেলুন"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        {routines.filter((item) => item.type === "exam").length === 0 && (
                          <tr>
                            <td colSpan={4} className="p-8 text-center text-gray-400 font-bold" style={{ fontFamily: '"Alinur Tatsama", "Hind Siliguri", "Anek Bangla", sans-serif' }}>
                              কোনো পরীক্ষা রুটিন তথ্য পাওয়া যায়নি।
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 7. Messages Received */}
          {activeAdminSubTab === "messages" && (
            <div className="space-y-4 font-alinur">
              {messages.length === 0 ? (
                <div className="p-12 text-center text-gray-400 bg-white border border-slate-200 rounded-xl font-alinur">
                  কোনো কন্টাক্ট বার্তা পাওয়া যায়নি।
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 gap-4">
                  {messages.map((msg) => {
                    const isComplaint = msg.formType === "অভিযোগ" || (!msg.formType && msg.subject.includes("নিম্নমানের") || msg.subject.includes("অনিয়ম") || msg.subject.includes("নির্যাতন"));
                    const dateStr = new Date(msg.date).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit"
                    });

                    return (
                      <div
                        key={msg.id}
                        onClick={() => setSelectedMessage(msg)}
                        className="bg-white border-2 border-slate-100 hover:border-emerald-300 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all duration-300 relative cursor-pointer select-none flex flex-col justify-between group"
                      >
                        {/* Delete Button */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(msg.id, "messages");
                          }}
                          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors z-10"
                          title="বার্তা মুছুন"
                        >
                          <Trash2 className="h-4.5 w-4.5" />
                        </button>

                        <div className="space-y-3">
                          {/* Type Badge */}
                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                              isComplaint
                                ? "bg-red-50 text-red-700 border border-red-100"
                                : "bg-emerald-50 text-emerald-700 border border-emerald-100"
                            }`}>
                              {msg.formType || (isComplaint ? "অভিযোগ" : "পরামর্শ")}
                            </span>
                          </div>

                          {/* Subject / Title */}
                          <h4 className="font-extrabold text-emerald-950 text-sm sm:text-base leading-snug group-hover:text-emerald-800 transition-colors">
                            {msg.subject}
                          </h4>
                        </div>

                        {/* Date (English Format) */}
                        <div className="pt-4 mt-2 border-t border-slate-50 flex items-center justify-between text-[11px] text-gray-500 font-sans">
                          <span>{dateStr}</span>
                          <span className="text-emerald-600 font-bold font-alinur group-hover:translate-x-1 transition-transform">
                            বিস্তারিত দেখুন →
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Expand Details Bottom Sheet / Overlay Modal */}
              <AnimatePresence>
                {selectedMessage && (
                  <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[999] font-alinur">
                    <motion.div
                      initial={{ y: 50, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ y: 50, opacity: 0 }}
                      className="bg-white rounded-3xl shadow-2xl max-w-lg w-full border-2 border-emerald-500 overflow-hidden relative"
                    >
                      {/* Top Accent Strip */}
                      <div className="h-2.5 bg-gradient-to-r from-emerald-600 via-amber-400 to-emerald-700"></div>

                      <div className="p-6 sm:p-8 space-y-6">
                        {/* Header */}
                        <div className="flex justify-between items-start gap-4">
                          <div className="space-y-1">
                            <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                              selectedMessage.formType === "অভিযোগ"
                                ? "bg-red-50 text-red-700 border border-red-100"
                                : "bg-emerald-50 text-emerald-700 border border-emerald-100"
                            }`}>
                              {selectedMessage.formType || "বার্তা"}
                            </span>
                            <h3 className="text-lg sm:text-xl font-black text-emerald-950 pt-2 leading-snug">
                              {selectedMessage.subject}
                            </h3>
                          </div>
                          <button
                            type="button"
                            onClick={() => setSelectedMessage(null)}
                            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-slate-100 rounded-lg transition-all"
                          >
                            ✕
                          </button>
                        </div>

                        {/* Submitter Info Grid */}
                        <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl text-xs text-slate-700 font-sans">
                          <div className="space-y-1">
                            <span className="text-[10px] text-gray-500 uppercase font-bold font-alinur block">প্রেরক</span>
                            <span className="font-extrabold text-emerald-950 text-[13px] font-alinur">{selectedMessage.name}</span>
                          </div>
                          <div className="space-y-1">
                            <span className="text-[10px] text-gray-500 uppercase font-bold font-alinur block">ইমেইল ঠিকানা</span>
                            <span className="break-all font-medium text-slate-800 text-[12px]">{selectedMessage.email}</span>
                          </div>
                          <div className="space-y-1">
                            <span className="text-[10px] text-gray-500 uppercase font-bold font-alinur block">ফোন নাম্বার</span>
                            <span className="font-extrabold text-emerald-900 text-[13px]">{selectedMessage.phone || "সংযুক্ত নেই"}</span>
                          </div>
                          <div className="space-y-1">
                            <span className="text-[10px] text-gray-500 uppercase font-bold font-alinur block">ঠিকানা</span>
                            <span className="font-medium text-slate-800 text-[12px] font-alinur">{selectedMessage.address || "সংযুক্ত নেই"}</span>
                          </div>
                        </div>

                        {/* Detailed Description */}
                        <div className="space-y-1.5">
                          <span className="text-xs font-bold text-emerald-900">বার্তার বিবরণ:</span>
                          <div className="bg-emerald-50/40 border border-emerald-100 rounded-2xl p-4 text-xs sm:text-sm text-emerald-950 leading-relaxed font-sans text-justify max-h-[160px] overflow-y-auto">
                            {selectedMessage.message}
                          </div>
                        </div>

                        {/* Bottom Actions */}
                        <div className="flex gap-3 pt-2">
                          <button
                            type="button"
                            onClick={() => setSelectedMessage(null)}
                            className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-3 px-4 rounded-xl text-xs transition-all active:scale-95 cursor-pointer text-center"
                          >
                            বন্ধ করুন
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const msgId = selectedMessage.id;
                              setSelectedMessage(null);
                              handleDelete(msgId, "messages");
                            }}
                            className="bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 font-bold py-3 px-4 rounded-xl text-xs transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
                          >
                            <Trash2 className="h-4 w-4" />
                            <span>বার্তা মুছুন</span>
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  </div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* 8. Website Settings */}
          {activeAdminSubTab === "settings" && (
            <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 shadow-sm space-y-6">
              <div className="border-b pb-4">
                <h4 className="text-base font-bold text-emerald-950 font-serif">মাদ্রাসার অফিসিয়াল লোগো আপলোড</h4>
                <p className="text-xs text-gray-500 mt-1">আপনার কম্পিউটার বা মোবাইল ডিভাইস থেকে লোগো ফাইলটি সিলেক্ট করে সরাসরি ওয়েবসাইট হেডার, ফুটার ও ব্যানার এ যুক্ত করুন।</p>
              </div>

              <div className="grid md:grid-cols-3 gap-8 items-center">
                {/* Logo Preview */}
                <div className="flex flex-col items-center justify-center p-4 bg-emerald-50/20 border border-dashed border-emerald-200 rounded-xl space-y-3">
                  <span className="text-xs text-emerald-800 font-bold">বর্তমান লোগো প্রিভিউ</span>
                  {websiteLogoUrl ? (
                    <img
                      src={websiteLogoUrl}
                      alt="Current logo"
                      className="h-28 w-28 object-contain rounded-full bg-white p-2 border-2 border-amber-400 shadow-sm"
                    />
                  ) : (
                    <div className="h-28 w-28 rounded-full bg-amber-500/10 border-2 border-dashed border-amber-400 flex items-center justify-center text-amber-500 font-bold text-3xl">
                      🕌
                    </div>
                  )}
                  {websiteLogoUrl && (
                    <button
                      onClick={async () => {
                        try {
                          await setDoc(doc(db, "settings", "website"), { logoUrl: "" }, { merge: true });
                          await setDoc(doc(db, "settings", "branding"), { logoUrl: "", isMainLogoUploaded: false, isLogoUploaded: false }, { merge: true });
                          setWebsiteLogoUrl("");
                          setLogoSaveSuccess(true);
                          setTimeout(() => setLogoSaveSuccess(false), 3000);
                        } catch (err) {
                          console.error("Error clearing logo:", err);
                        }
                      }}
                      className="text-xs text-red-600 hover:underline font-bold"
                    >
                      লোগোটি মুছুন
                    </button>
                  )}
                </div>

                {/* Logo Uploader Controls */}
                <div className="md:col-span-2 space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-700 block">লোগো ইমেজ ফাইল সিলেক্ট করুন</label>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <label className="bg-emerald-800 hover:bg-emerald-900 text-white font-bold px-4 py-2.5 rounded-lg text-xs cursor-pointer flex items-center justify-center gap-1.5 shadow-sm select-none">
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;

                            setLogoSaveSuccess(false);
                            const reader = new FileReader();
                            reader.onload = () => {
                              setCropZoom(1);
                              setCropX(0);
                              setCropY(0);
                              setCropFile(file);
                              setCropSrc(reader.result as string);
                              setCropFieldSetter(() => async (downloadUrl: string) => {
                                try {
                                  setIsUploading(true);
                                  await setDoc(doc(db, "settings", "website"), {
                                    logoUrl: downloadUrl,
                                    updatedAt: new Date().toISOString()
                                  }, { merge: true });
                                  await setDoc(doc(db, "settings", "branding"), {
                                    logoUrl: downloadUrl,
                                    isMainLogoUploaded: true,
                                    isLogoUploaded: true,
                                    updatedAt: new Date().toISOString()
                                  }, { merge: true });
                                  setWebsiteLogoUrl(downloadUrl);
                                  setShowLogoSuccessPopup(true);
                                } catch (error: any) {
                                  console.error("Error setting logo from cropper:", error);
                                } finally {
                                  setIsUploading(false);
                                }
                              });
                            };
                            reader.readAsDataURL(file);
                          }}
                          disabled={isUploading}
                        />
                        {isUploading ? "আপলোড হচ্ছে..." : "আপনার লোগো আপলোড করুন"}
                      </label>
                      
                      <div className="flex-1 min-w-0">
                        <input
                          type="text"
                          value={websiteLogoUrl}
                          onChange={async (e) => {
                            const val = e.target.value;
                            setWebsiteLogoUrl(val);
                            try {
                              await setDoc(doc(db, "settings", "website"), {
                                logoUrl: val,
                                updatedAt: new Date().toISOString()
                              }, { merge: true });
                              if (val) {
                                await setDoc(doc(db, "settings", "branding"), {
                                  logoUrl: val,
                                  isMainLogoUploaded: true,
                                  isLogoUploaded: true,
                                  updatedAt: new Date().toISOString()
                                }, { merge: true });
                                setShowLogoSuccessPopup(true);
                              }
                            } catch (err) {
                              console.error("Error updating logo URL manual:", err);
                            }
                          }}
                          placeholder="অথবা সরাসরি ছবির লিঙ্ক দিন (URL)"
                          className="w-full px-3 py-2 border rounded-md text-xs font-mono"
                        />
                      </div>
                    </div>
                    <p className="text-[10px] text-gray-500">সমর্থিত ফরম্যাট: .png, .jpg, .jpeg, .svg, .webp ইত্যাদি।</p>
                  </div>

                  {logoSaveSuccess && (
                    <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs px-3.5 py-2 rounded-lg font-bold flex items-center space-x-1">
                      <Check className="h-4 w-4" />
                      <span>লোগো সফলভাবে আপলোড ও আপডেট করা হয়েছে! হোমপেজে পরিবর্তন অটোমেটিক যুক্ত হয়েছে।</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Hero Background Update */}
          {activeAdminSubTab === "hero_background" && (
            <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 shadow-sm space-y-6">
              <div className="border-b pb-4">
                <h4 className="text-lg font-bold text-emerald-950 font-serif">হিরো সেকশন ব্যাকগ্রাউন্ড ছবি আপডেট</h4>
                <p className="text-xs text-gray-500 mt-1">মাদ্রাসার হোম পেজের সবুজ হিরো ব্যানারটির পেছনে একটি সুন্দর ও আকর্ষণীয় ব্যাকগ্রাউন্ড ছবি যুক্ত করুন।</p>
              </div>

              <div className="grid md:grid-cols-1 gap-8">
                {/* Live Preview & Settings */}
                <div className="space-y-4">
                  <div className="bg-emerald-50/20 border border-emerald-200 rounded-xl p-4 space-y-4">
                    <span className="text-xs text-emerald-850 font-bold block">বর্তমান ব্যাকগ্রাউন্ড ইমেজ ও প্রিভিউ</span>
                    
                    {/* Interactive Hero Preview inside Admin Dashboard */}
                    <div className="relative h-44 w-full bg-emerald-950 rounded-xl overflow-hidden flex items-center justify-center border-2 border-emerald-850">
                      {heroBgUrl ? (
                        <div 
                          className="absolute inset-0 bg-cover bg-center"
                          style={{ backgroundImage: `url(${heroBgUrl})` }}
                        />
                      ) : (
                        <div className="absolute inset-0 bg-[linear-gradient(to_right,#047857_1px,transparent_1px),linear-gradient(to_bottom,#047857_1px,transparent_1px)] bg-[size:2rem_2rem] opacity-20" />
                      )}
                      
                      {/* Dark Overlay */}
                      <div className="absolute inset-0 bg-emerald-950/80 mix-blend-multiply z-0"></div>
                      
                      <div className="relative text-center z-10 px-4 space-y-1">
                        <h1 className="text-lg sm:text-xl font-bold text-amber-400 font-serif">
                          সুফিয়া নূরিয়া দাখিল মাদ্রাসা
                        </h1>
                        <p className="text-[9px] text-emerald-200 font-mono tracking-widest">
                          SUFIA NOORIA DAKHIL MADRASAH
                        </p>
                      </div>
                    </div>

                    {heroBgUrl && (
                      <div className="flex justify-between items-center bg-white p-3 rounded-lg border border-slate-100 shadow-sm text-xs">
                        <div className="truncate text-gray-600 font-mono max-w-[70%]">
                          {heroBgUrl}
                        </div>
                        <button
                          onClick={handleClearHeroBg}
                          className="text-red-600 hover:text-red-700 font-bold flex items-center space-x-1 hover:bg-red-50 px-2.5 py-1 rounded transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          <span>ছবি মুছে ফেলুন</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Upload Controls */}
                  <div className="space-y-3">
                    <div className="flex flex-col sm:flex-row gap-3 items-center">
                      <label className={`w-full sm:w-auto flex items-center justify-center space-x-2 px-5 py-3 border-2 border-dashed rounded-lg cursor-pointer transition-all font-bold text-sm ${
                        isUploadingHeroBg 
                          ? "bg-gray-50 border-gray-300 text-gray-400 cursor-not-allowed" 
                          : "bg-emerald-50 border-emerald-300 text-emerald-800 hover:bg-emerald-100"
                      }`}>
                        <Plus className="h-5 w-5" />
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              await handleHeroBgUpload(file);
                            }
                          }}
                          disabled={isUploadingHeroBg}
                        />
                        <span>{isUploadingHeroBg ? "আপলোড হচ্ছে..." : "নতুন ছবি আপলোড করুন"}</span>
                      </label>
                      
                      <div className="flex-1 w-full">
                        <input
                          type="text"
                          value={heroBgUrl}
                          onChange={async (e) => {
                            const val = e.target.value;
                            setHeroBgUrl(val);
                            try {
                              await setDoc(doc(db, "settings", "website"), {
                                heroBgUrl: val,
                                updatedAt: new Date().toISOString()
                              }, { merge: true });
                            } catch (err) {
                              console.error("Error updating hero background URL manual:", err);
                            }
                          }}
                          placeholder="অথবা সরাসরি ছবির লিঙ্ক দিন (URL)"
                          className="w-full px-3.5 py-2.5 border rounded-lg text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>
                    </div>
                    
                    {heroBgError && (
                      <div className="text-red-600 text-xs font-bold flex items-center space-x-1">
                        <XCircle className="h-4 w-4" />
                        <span>{heroBgError}</span>
                      </div>
                    )}

                    {heroBgSaveSuccess && (
                      <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs px-3.5 py-2.5 rounded-lg font-bold flex items-center space-x-1.5 shadow-sm">
                        <Check className="h-4 w-4 text-emerald-600" />
                        <span>ব্যাকগ্রাউন্ড ছবি সফলভাবে আপডেট করা হয়েছে! হোমপেজে পরিবর্তন তাৎক্ষণিকভাবে দেখতে পাবেন।</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Integration Info */}
                <div className="bg-amber-50/40 border border-amber-200/50 rounded-xl p-4 space-y-2">
                  <h5 className="text-xs font-bold text-amber-900 flex items-center space-x-1">
                    <CheckCircle2 className="h-4 w-4 text-amber-600" />
                    <span>প্রয়োজনীয় নির্দেশনা ও বৈশিষ্ট্য:</span>
                  </h5>
                  <ul className="text-[11px] text-amber-800 space-y-1.5 list-disc pl-4 leading-relaxed">
                    <li><strong>স্বয়ংক্রিয় কম্প্রেশন:</strong> সিলেক্ট করা ছবিটির সাইজ ১ মেগাবাইটের বেশি হলেও সিস্টেম স্বয়ংক্রিয়ভাবে সেটিকে অপ্টিমাইজ ও কম্প্রেস করে ছোট করবে।</li>
                    <li><strong>আকার অনুপাত (Aspect Ratio):</strong> ছবিটির আদর্শ সাইজ হলো ১৯২০ x ১০৮০ পিক্সেল (১৬:৯ ল্যান্ডস্কেপ)।</li>
                    <li><strong>রিয়েল-টাইম অটো-আপডেট:</strong> এখানে ছবি সেভ বা ডিলিট করার সাথে সাথে হোম পেজ রিলোড করা ছাড়াই ফায়ারস্টোর StreamBuilder এর মাধ্যমে সরাসরি ব্যাকগ্রাউন্ড ছবি পরিবর্তন হয়ে যাবে।</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* 9. Running Notices */}
          {activeAdminSubTab === "running_notices" && (
            <div className="space-y-6">
              {/* Add New Notice Form */}
              <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 shadow-sm space-y-4">
                <h4 className="text-base font-bold text-emerald-950 font-serif">নতুন চলমান নোটিশ যোগ করুন</h4>
                <p className="text-xs text-gray-500">চলমান নোটিশবোর্ডে সর্বোচ্চ ২টি নোটিশ সংরক্ষিত থাকবে। নতুন নোটিশ যুক্ত করলে সবচেয়ে পুরাতন নোটিশটি স্বয়ংক্রিয়ভাবে মুছে যাবে।</p>
                
                <div className="space-y-2">
                  <textarea
                    rows={3}
                    value={newNoticeText}
                    onChange={(e) => setNewNoticeText(e.target.value)}
                    placeholder="যেমন: আগামী ১০ই মার্চ মাদ্রাসার বার্ষিক ক্রীড়া প্রতিযোগিতা অনুষ্ঠিত হইবে।"
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all text-emerald-950 font-sans"
                  />
                </div>
                
                <button
                  onClick={() => handleAddRunningNotice(newNoticeText)}
                  disabled={!newNoticeText.trim() || isNoticeUploading}
                  className="bg-emerald-800 hover:bg-emerald-900 text-amber-400 font-bold px-5 py-2.5 rounded-lg text-xs shadow-sm select-none transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  <Plus className="h-4 w-4" />
                  <span>নোটিশ আপলোড করুন</span>
                </button>
              </div>

              {/* Running Notices List */}
              <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 shadow-sm space-y-4">
                <h4 className="text-base font-bold text-emerald-950 font-serif">বর্তমানে চলমান নোটিশ সমূহ</h4>
                <div className="space-y-3">
                  <StreamBuilder<any>
                    stream={query(collection(db, "running_notices"), orderBy("createdAt", "desc"))}
                    builder={(notices, loading, error) => {
                      if (loading) return <p className="text-xs text-emerald-800 animate-pulse">নোটিশ তালিকা লোড হচ্ছে...</p>;
                      if (error) return <p className="text-xs text-red-500">নোটিশ লোড করতে সমস্যা হয়েছে</p>;
                      if (!notices || notices.length === 0) {
                        return (
                          <div className="text-center py-8 text-gray-400 border border-dashed rounded-lg">
                            কোনো চলমান নোটিশ পাওয়া যায়নি।
                          </div>
                        );
                      }
                      return (
                        <div className="grid gap-4">
                          {notices.map((notice, index) => (
                            <div key={notice.id} className="p-4 rounded-xl border border-gray-100 flex items-start justify-between gap-4 bg-gray-50/50 hover:bg-gray-50 transition-colors">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                                    নোটিশ {index + 1}
                                  </span>
                                  <span className="text-[10px] text-gray-400 font-mono">
                                    {notice.createdAt ? new Date(notice.createdAt).toLocaleString("bn-BD") : ""}
                                  </span>
                                </div>
                                <p className="text-sm text-gray-800 font-medium leading-relaxed font-sans">{notice.text}</p>
                              </div>
                              <button
                                onClick={async () => {
                                  if (window.confirm("আপনি কি নিশ্চিতভাবে এই নোটিশটি মুছতে চান?")) {
                                    try {
                                      await deleteDoc(doc(db, "running_notices", notice.id));
                                      alert("নোটিশটি মুছে ফেলা হয়েছে।");
                                    } catch (err) {
                                      console.error("Error deleting notice:", err);
                                    }
                                  }
                                }}
                                className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                                title="মুছে ফেলুন"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      );
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* 9b. Public Notices (Notice Public) */}
          {activeAdminSubTab === "public_notices" && (
            <div className="space-y-6">
              {/* Header with Add Notice toggle button */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between bg-emerald-50/40 border border-emerald-100 rounded-xl p-5 gap-4">
                <div>
                  <h3 className="text-base font-bold text-emerald-950 font-serif">মাদ্রাসার পাবলিক নোটিশসমূহ</h3>
                  <p className="text-xs text-gray-500">মাদ্রাসার মূল ওয়েবসাইটের নোটিশ কর্ণার পেজের নোটিশ ও জরুরি আপডেটগুলো পরিচালনা করুন।</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsPublicNoticeFormOpen(!isPublicNoticeFormOpen);
                    if (isPublicNoticeFormOpen) {
                      setPublicNoticeTitle("");
                      setPublicNoticeDescription("");
                      setPublicNoticeTitleError("");
                      setPublicNoticeDescriptionError("");
                      setEditingPublicNoticeId(null);
                    }
                  }}
                  className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 flex items-center gap-2 cursor-pointer shadow-sm select-none ${
                    isPublicNoticeFormOpen
                      ? "bg-red-50 text-red-700 hover:bg-red-100 border border-red-200"
                      : "bg-emerald-800 text-white hover:bg-emerald-950 animate-button-pulse-glow"
                  }`}
                >
                  {isPublicNoticeFormOpen ? (
                    <>
                      <X className="h-4 w-4" />
                      <span>ফর্ম বন্ধ করুন</span>
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4" />
                      <span>নোটিশ যোগ করুন</span>
                    </>
                  )}
                </button>
              </div>

              {/* Form to Add or Edit Public Notice with dynamic visibility and animation */}
              <AnimatePresence initial={false}>
                {isPublicNoticeFormOpen && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.25, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 shadow-sm space-y-4 font-alinur mt-2">
                      <h4 className="text-base font-bold text-emerald-950 font-serif">
                        {editingPublicNoticeId ? "নোটিশ তথ্য আংশিক বা সম্পূর্ণ সংশোধন করুন" : "নতুন পাবলিক নোটিশ প্রকাশ করুন"}
                      </h4>
                      <p className="text-xs text-gray-500">
                        এখান থেকে প্রকাশিত নোটিশ সরাসরি মাদ্রাসার মূল ওয়েবসাইটের "নোটিশ কর্ণার" পেজে রিয়েল-টাইমে প্রদর্শিত হবে।
                      </p>

                      <form
                        onSubmit={async (e) => {
                          e.preventDefault();
                          
                          let hasError = false;
                          if (!publicNoticeTitle.trim()) {
                            setPublicNoticeTitleError("আপনি এই ঘরটি পূরণ করেননি");
                            hasError = true;
                          } else {
                            setPublicNoticeTitleError("");
                          }

                          if (!publicNoticeDescription.trim()) {
                            setPublicNoticeDescriptionError("আপনি এই ঘরটি পূরণ করেননি");
                            hasError = true;
                          } else {
                            setPublicNoticeDescriptionError("");
                          }

                          if (hasError) return;

                          setIsPublicNoticeUploading(true);
                          try {
                            if (editingPublicNoticeId) {
                              await updateDoc(doc(db, "notices", editingPublicNoticeId), {
                                title: publicNoticeTitle,
                                description: publicNoticeDescription,
                                isEdited: true
                              });
                              alert("নোটিশটি সফলভাবে আপডেট করা হয়েছে!");
                            } else {
                              await addDoc(collection(db, "notices"), {
                                title: publicNoticeTitle,
                                description: publicNoticeDescription,
                                timestamp: serverTimestamp()
                              });
                              alert("নতুন নোটিশটি সফলভাবে প্রকাশ করা হয়েছে!");
                            }
                            setPublicNoticeTitle("");
                            setPublicNoticeDescription("");
                            setPublicNoticeTitleError("");
                            setPublicNoticeDescriptionError("");
                            setEditingPublicNoticeId(null);
                            setIsPublicNoticeFormOpen(false);
                          } catch (err) {
                            console.error("Error saving public notice:", err);
                            alert("দুঃখিত, নোটিশ সংরক্ষণ করা যায়নি।");
                          } finally {
                            setIsPublicNoticeUploading(false);
                          }
                        }}
                        className="space-y-4"
                      >
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-gray-700 block">নোটিশ টাইটেল (Title)</label>
                          <input
                            type="text"
                            value={publicNoticeTitle}
                            onChange={(e) => {
                              setPublicNoticeTitle(e.target.value);
                              if (e.target.value.trim()) {
                                setPublicNoticeTitleError("");
                              }
                            }}
                            placeholder="যেমন: দাখিল পরীক্ষা ২০২৬ এর প্রবেশপত্র বিতরণ সংক্রান্ত নোটিশ"
                            className={`w-full px-4 py-2.5 rounded-lg border text-xs focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all text-emerald-950 ${
                              publicNoticeTitleError ? "border-red-500 ring-1 ring-red-500" : "border-gray-300"
                            }`}
                          />
                          {publicNoticeTitleError && (
                            <p className="text-[11px] text-red-500 font-bold mt-1">
                              {publicNoticeTitleError}
                            </p>
                          )}
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-bold text-gray-700 block">নোটিশ বিস্তারিত বিবরণ (Body Description)</label>
                          <textarea
                            rows={5}
                            value={publicNoticeDescription}
                            onChange={(e) => {
                              setPublicNoticeDescription(e.target.value);
                              if (e.target.value.trim()) {
                                setPublicNoticeDescriptionError("");
                              }
                            }}
                            placeholder="এখানে নোটিশের বিস্তারিত বিবরণ অনুচ্ছেদ আকারে লিখুন..."
                            className={`w-full px-4 py-2.5 rounded-lg border text-xs focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all text-emerald-950 ${
                              publicNoticeDescriptionError ? "border-red-500 ring-1 ring-red-500" : "border-gray-300"
                            }`}
                          />
                          {publicNoticeDescriptionError && (
                            <p className="text-[11px] text-red-500 font-bold mt-1">
                              {publicNoticeDescriptionError}
                            </p>
                          )}
                        </div>

                        <div className="flex gap-3">
                          <button
                            type="submit"
                            disabled={isPublicNoticeUploading}
                            className="bg-emerald-800 hover:bg-emerald-900 text-white font-bold px-5 py-2.5 rounded-lg text-xs shadow-sm select-none transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
                          >
                            <Plus className="h-4 w-4" />
                            <span>{editingPublicNoticeId ? "নোটিশ আপডেট সম্পন্ন করুন" : "নোটিশ প্রকাশ করুন"}</span>
                          </button>

                          {editingPublicNoticeId && (
                            <button
                              type="button"
                              onClick={() => {
                                setPublicNoticeTitle("");
                                setPublicNoticeDescription("");
                                setPublicNoticeTitleError("");
                                setPublicNoticeDescriptionError("");
                                setEditingPublicNoticeId(null);
                                setIsPublicNoticeFormOpen(false);
                              }}
                              className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold px-5 py-2.5 rounded-lg text-xs transition-all cursor-pointer"
                            >
                              সংশোধন বাতিল করুন
                            </button>
                          )}
                        </div>
                      </form>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Published Public Notices List */}
              <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 shadow-sm space-y-4 font-alinur">
                <h4 className="text-base font-bold text-emerald-950 font-serif">ইতিপূর্বে প্রকাশিত পাবলিক নোটিশ সমূহ</h4>
                <div className="space-y-3">
                  <StreamBuilder<any>
                    stream={query(collection(db, "notices"), orderBy("timestamp", "desc"))}
                    builder={(notices, loading, error) => {
                      if (loading) return <p className="text-xs text-emerald-800 animate-pulse font-bold">নোটিশ তালিকা লোড হচ্ছে...</p>;
                      if (error) return <p className="text-xs text-red-500 font-bold">নোটিশ লোড করতে সমস্যা হয়েছে</p>;
                      if (!notices || notices.length === 0) {
                        return (
                          <div className="text-center py-8 text-gray-400 border border-dashed rounded-lg text-xs font-bold">
                            কোনো পাবলিক নোটিশ পাওয়া যায়নি।
                          </div>
                        );
                      }
                      
                      const toBanglaNum = (str: string | number): string => {
                        const digits = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
                        return str.toString().replace(/\d/g, (d) => digits[parseInt(d)]);
                      };

                      const formatBanglaDate = (timestamp: any) => {
                        if (!timestamp) return "";
                        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
                        const day = date.getDate();
                        const month = date.getMonth() + 1;
                        const year = date.getFullYear();
                        return `${toBanglaNum(day)}/${toBanglaNum(month)}/${toBanglaNum(year)}`;
                      };

                      return (
                        <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                          <table className="w-full text-left border-collapse text-xs sm:text-sm">
                            <thead>
                              <tr className="bg-emerald-50 text-emerald-950 font-bold border-b border-gray-100">
                                <th className="p-3">প্রকাশের তারিখ</th>
                                <th className="p-3">নোটিশ টাইটেল</th>
                                <th className="p-3">অবস্থা (Status)</th>
                                <th className="p-3 text-center">অ্যাকশন</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                              {notices.map((item) => (
                                <tr key={item.id} className="hover:bg-emerald-50/10">
                                  <td className="p-3 text-gray-500 font-mono">
                                    {formatBanglaDate(item.timestamp)}
                                  </td>
                                  <td className="p-3 font-bold text-gray-800 max-w-[200px] truncate">
                                    {item.title}
                                  </td>
                                  <td className="p-3">
                                    {item.isEdited ? (
                                      <span className="text-red-600 bg-red-50 border border-red-100 px-2 py-0.5 rounded-full font-bold text-[10px]">
                                        সংশোধিত
                                      </span>
                                    ) : (
                                      <span className="text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full font-bold text-[10px]">
                                        মূল সংস্করণ
                                      </span>
                                    )}
                                  </td>
                                  <td className="p-3 text-center">
                                    <div className="flex justify-center space-x-2">
                                      <button
                                        onClick={() => {
                                          setPublicNoticeTitle(item.title || "");
                                          setPublicNoticeDescription(item.description || "");
                                          setPublicNoticeTitleError("");
                                          setPublicNoticeDescriptionError("");
                                          setEditingPublicNoticeId(item.id);
                                          setIsPublicNoticeFormOpen(true);
                                          window.scrollTo({ top: 300, behavior: "smooth" });
                                        }}
                                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded cursor-pointer"
                                        title="সম্পাদনা করুন"
                                      >
                                        <Edit3 className="h-4 w-4" />
                                      </button>
                                      <button
                                        onClick={async () => {
                                          if (window.confirm("আপনি কি নিশ্চিতভাবে এই পাবলিক নোটিশটি মুছতে চান?")) {
                                            try {
                                              await deleteDoc(doc(db, "notices", item.id));
                                              alert("নোটিশটি সম্পূর্ণ মুছে ফেলা হয়েছে।");
                                            } catch (err) {
                                              console.error("Error deleting public notice:", err);
                                            }
                                          }
                                        }}
                                        className="p-1.5 text-red-600 hover:bg-red-50 rounded cursor-pointer"
                                        title="মুছে ফেলুন"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      );
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* 10. Pathdan Overview Update Form */}
          {activeAdminSubTab === "pathdan_update" && (
            <PathdanUpdateForm />
          )}

          {/* 11. Sodosso Form Settings Update Form */}
          {activeAdminSubTab === "sodosso_form_settings" && (
            <SodossoFormUpdateForm />
          )}

          {/* 12. Kormochari Update Form */}
          {activeAdminSubTab === "kormochari_panel" && (
            <KormochariUpdateForm />
          )}

          {/* 13. Contact Info Update Form */}
          {activeAdminSubTab === "contact_update" && (
            <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 shadow-sm space-y-6 font-alinur">
              <div className="border-b pb-4">
                <h4 className="text-base font-bold text-emerald-950 font-alinur text-lg sm:text-xl">মাদ্রাসার প্রাতিষ্ঠানিক যোগাযোগ ও ঠিকানা কাস্টমাইজেশন</h4>
                <p className="text-xs text-gray-500 mt-1">হোমপেজের কন্টাক্ট সেকশনের ঠিকানা, কন্টাক্ট নাম্বার ও সোস্যাল মিডিয়া লিংকগুলো এখান থেকে ডাইনামিকালি আপডেট করুন।</p>
              </div>

              <form onSubmit={handleContactUpdateSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Address field (Full width) */}
                  <div className="md:col-span-2 space-y-2">
                    <label className="text-xs font-bold text-gray-700 block">মাদ্রাসার ঠিকানা</label>
                    <textarea
                      required
                      rows={2}
                      value={contactAddressInput}
                      onChange={(e) => setContactAddressInput(e.target.value)}
                      placeholder="প্রতিষ্ঠানের পূর্ণ ঠিকানা লিখুন"
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs"
                    />
                  </div>

                  {/* Office Phone */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-700 block">অফিস কন্টাক্ট নাম্বার</label>
                    <input
                      type="text"
                      required
                      value={contactOfficePhoneInput}
                      onChange={(e) => setContactOfficePhoneInput(e.target.value)}
                      placeholder="অফিস কন্টাক্ট নাম্বার ১১ সংখ্যায় লিখুন"
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs"
                    />
                  </div>

                  {/* Principal Phone */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-700 block">প্রধান শিক্ষকের নাম্বার</label>
                    <input
                      type="text"
                      required
                      value={contactPrincipalPhoneInput}
                      onChange={(e) => setContactPrincipalPhoneInput(e.target.value)}
                      placeholder="প্রধান শিক্ষকের নাম্বার ১১ সংখ্যায় লিখুন"
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs"
                    />
                  </div>

                  {/* Official Email */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-700 block">অফিসিয়াল ইমেইল</label>
                    <input
                      type="email"
                      required
                      value={contactEmailInput}
                      onChange={(e) => setContactEmailInput(e.target.value)}
                      placeholder="অফিসিয়াল ইমেইল এড্রেস লিখুন"
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs"
                    />
                  </div>

                  {/* Facebook Link */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-700 block">ফেসবুক লিংক</label>
                    <input
                      type="url"
                      value={contactFacebookInput}
                      onChange={(e) => setContactFacebookInput(e.target.value)}
                      placeholder="সংশ্লিষ্ট সোস্যাল মিডিয়া লিংকটি লিখুন"
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs"
                    />
                  </div>

                  {/* LinkedIn Link */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-700 block">লিঙ্কডইন লিংক</label>
                    <input
                      type="url"
                      value={contactLinkedinInput}
                      onChange={(e) => setContactLinkedinInput(e.target.value)}
                      placeholder="সংশ্লিষ্ট সোস্যাল মিডিয়া লিংকটি লিখুন"
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs"
                    />
                  </div>

                  {/* Telegram Link */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-700 block">টেলিগ্রাম লিংক</label>
                    <input
                      type="url"
                      value={contactTelegramInput}
                      onChange={(e) => setContactTelegramInput(e.target.value)}
                      placeholder="সংশ্লিষ্ট সোস্যাল মিডিয়া লিংকটি লিখুন"
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs"
                    />
                  </div>

                  {/* WhatsApp Link */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-700 block">হোয়াটসঅ্যাপ লিংক</label>
                    <input
                      type="url"
                      value={contactWhatsappInput}
                      onChange={(e) => setContactWhatsappInput(e.target.value)}
                      placeholder="সংশ্লিষ্ট সোস্যাল মিডিয়া লিংকটি লিখুন"
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs"
                    />
                  </div>
                </div>

                {contactSaveSuccess && (
                  <div className="bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg p-3 text-xs font-bold flex items-center gap-1.5 animate-fade-in">
                    <Check className="h-4 w-4 text-emerald-600" />
                    <span>সফলভাবে কন্টাক্ট এবং সামাজিক যোগাযোগ লিংক আপডেট করা হয়েছে! হোমপেজে সাথে সাথেই এই পরিবর্তন দেখা যাবে।</span>
                  </div>
                )}

                <div className="flex justify-end pt-4 border-t">
                  <button
                    type="submit"
                    disabled={isUpdatingContact}
                    className="bg-emerald-800 hover:bg-emerald-950 text-amber-400 font-bold py-2.5 px-6 rounded-lg text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isUpdatingContact ? "আপডেট হচ্ছে..." : "সংরক্ষণ করুন"}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}

      {/* ------------------- ADD/EDIT DIALOG MODAL ------------------- */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full border border-gray-200 overflow-hidden my-8">
            <div className="bg-emerald-800 text-white p-5 flex justify-between items-center border-b-4 border-amber-500">
              <h3 className="font-bold text-base sm:text-lg">
                {editingId ? "তথ্য এডিট ও মডিফাই করুন" : "নতুন তথ্য তালিকাভুক্ত করুন"}
              </h3>
              <button onClick={() => setIsFormOpen(false)} className="text-emerald-100 hover:text-white">
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {/* Dynamic form inputs based on entity type */}
              {(user.role === "teacher" || activeAdminSubTab === "routines") && (
                <>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-700">রুটিন টাইপ</label>
                    <select value={field1} onChange={(e) => setField1(e.target.value)} className="w-full px-3 py-2 border rounded-md text-sm">
                      <option value="class">ক্লাস রুটিন</option>
                      <option value="exam">পরীক্ষা রুটিন</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-700">শ্রেণী</label>
                    <input type="text" required value={field2} onChange={(e) => setField2(e.target.value)} placeholder="যেমন: ১০ম শ্রেণী" className="w-full px-3 py-2 border rounded-md text-sm" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-700">বিষয়</label>
                    <input type="text" required value={field3} onChange={(e) => setField3(e.target.value)} placeholder="যেমন: কুরআন মাজীদ" className="w-full px-3 py-2 border rounded-md text-sm" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-700">সময় ও ঘণ্টা</label>
                    <input type="text" required value={field4} onChange={(e) => setField4(e.target.value)} placeholder="যেমন: ০৯:০০ AM - ০৯:৪৫ AM" className="w-full px-3 py-2 border rounded-md text-sm" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-700">দিন বা তারিখ</label>
                    <input type="text" required value={field5} onChange={(e) => setField5(e.target.value)} placeholder="যেমন: রবিবার বা ২০২৬-১০-১৫" className="w-full px-3 py-2 border rounded-md text-sm" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-700">কক্ষ নম্বর</label>
                    <input type="text" required value={field6} onChange={(e) => setField6(e.target.value)} placeholder="যেমন: ১০১" className="w-full px-3 py-2 border rounded-md text-sm" />
                  </div>
                </>
              )}

              {user.role === "admin" && activeAdminSubTab === "teachers" && (
                <>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-700">শিক্ষকের নাম</label>
                    <input type="text" required value={field1} onChange={(e) => setField1(e.target.value)} placeholder="যেমন: মাওলানা মোহাম্মদ আব্দুর রহমান" className="w-full px-3 py-2 border rounded-md text-sm" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-700">পদবী</label>
                    <input type="text" required value={field2} onChange={(e) => setField2(e.target.value)} placeholder="যেমন: সহকারী সুপার" className="w-full px-3 py-2 border rounded-md text-sm" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-700">মোবাইল ফোন নম্বর</label>
                    <input type="text" required value={field3} onChange={(e) => setField3(e.target.value)} placeholder="যেমন: ০১৭১১-১২৩৪৫৬" className="w-full px-3 py-2 border rounded-md text-sm" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-700">ইমেইল</label>
                    <input type="email" required value={field4} onChange={(e) => setField4(e.target.value)} placeholder="যেমন: mail@domain.com" className="w-full px-3 py-2 border rounded-md text-sm" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-700">প্রোফাইল ফটো ইউআরএল (Photo URL)</label>
                    <div className="flex gap-2">
                      <input type="text" value={field5} onChange={(e) => setField5(e.target.value)} placeholder="Unsplash / Image URL" className="flex-1 min-w-0 px-3 py-2 border rounded-md text-sm" />
                      <label className="bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 font-bold px-3 py-1.5 rounded-md text-xs cursor-pointer flex items-center justify-center gap-1 select-none shrink-0">
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleFileUpload(e, setField5, "teachers")}
                          disabled={isUploading}
                        />
                        {isUploading ? "আপলোড..." : "ফাইল সিলেক্ট"}
                      </label>
                    </div>
                    {uploadError && <p className="text-[11px] text-red-500 font-medium mt-1">{uploadError}</p>}
                  </div>
                </>
              )}

              {user.role === "admin" && activeAdminSubTab === "stories" && (
                <>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-700">শিক্ষার্থীর নাম</label>
                    <input type="text" required value={field1} onChange={(e) => setField1(e.target.value)} placeholder="যেমন: মোহাম্মদ মিনহাজুল ইসলাম" className="w-full px-3 py-2 border rounded-md text-sm" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-700">সাফল্য / কৃতিত্ব বিবরণ</label>
                    <textarea required rows={3} value={field2} onChange={(e) => setField2(e.target.value)} placeholder="যেমন: দাখিল পরীক্ষায় জিপিএ ৫.০০..." className="w-full px-3 py-2 border rounded-md text-sm resize-none"></textarea>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-700">অর্জনের বছর</label>
                    <input type="number" required value={field3} onChange={(e) => setField3(e.target.value)} placeholder="যেমন: ২০২৫" className="w-full px-3 py-2 border rounded-md text-sm" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-700">ছবি ইউআরএল (Student Photo URL)</label>
                    <div className="flex gap-2">
                      <input type="text" value={field4} onChange={(e) => setField4(e.target.value)} placeholder="Image URL" className="flex-1 min-w-0 px-3 py-2 border rounded-md text-sm" />
                      <label className="bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 font-bold px-3 py-1.5 rounded-md text-xs cursor-pointer flex items-center justify-center gap-1 select-none shrink-0">
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleFileUpload(e, setField4, "stories")}
                          disabled={isUploading}
                        />
                        {isUploading ? "আপলোড..." : "ফাইল সিলেক্ট"}
                      </label>
                    </div>
                    {uploadError && <p className="text-[11px] text-red-500 font-medium mt-1">{uploadError}</p>}
                  </div>
                </>
              )}

              {user.role === "admin" && activeAdminSubTab === "committee" && (
                <div className="font-alinur space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-700 font-alinur">সদস্যের নাম</label>
                    <input 
                      type="text" 
                      required 
                      value={field1} 
                      onChange={(e) => setField1(e.target.value)} 
                      placeholder="গভর্ণিং বডি সদস্যের নাম লিখুন" 
                      className="w-full px-3 py-2 border rounded-md text-sm text-emerald-950 font-alinur" 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-700 font-alinur">পদবী (Role)</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        required
                        value={field2}
                        onChange={(e) => setField2(e.target.value)}
                        placeholder="সদস্যের পদবি লিখুন"
                        className="flex-1 min-w-0 px-3 py-2 border rounded-md text-sm text-emerald-950 font-alinur"
                      />
                      <select
                        onChange={(e) => {
                          if (e.target.value) setField2(e.target.value);
                        }}
                        className="px-2 py-2 border rounded-md text-xs bg-gray-50 text-gray-700 shrink-0 font-alinur"
                      >
                        <option value="">পদবী তালিকা...</option>
                        <option value="সভাপতি">সভাপতি</option>
                        <option value="সুপার ও সদস্য সচিব">সুপার ও সদস্য সচিব</option>
                        <option value="দাতা সদস্য">দাতা সদস্য</option>
                        <option value="বিদ্যুৎসাহী সদস্য">বিদ্যুৎসাহী সদস্য</option>
                        <option value="অভিভাবক সদস্য">অভিভাবক সদস্য</option>
                        <option value="শিক্ষক প্রতিনিধি">শিক্ষক প্রতিনিধি</option>
                        <option value="সদস্য">সদস্য</option>
                      </select>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-700 font-alinur">দিকনির্দেশনামূলক বাণী বা দীর্ঘ বক্তব্য</label>
                    <textarea 
                      rows={4} 
                      required
                      value={field3} 
                      onChange={(e) => setField3(e.target.value)} 
                      placeholder="মাদ্রাসার উদ্দেশ্যে মূল্যবান বাণী ও সংক্ষিপ্ত বিবরণ লিখুন" 
                      className="w-full px-3 py-2 border rounded-md text-sm resize-none text-emerald-950 font-alinur"
                    ></textarea>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-700 font-alinur">অগ্রাধিকার বা রাঙ্ক (Rank - ক্রমানুসারে দেখানোর জন্য)</label>
                    <input 
                      type="number" 
                      required 
                      value={field4} 
                      onChange={(e) => setField4(e.target.value)} 
                      placeholder="র‍্যাংক নির্ধারণ করুন (যেমন: ১ বা ২ বা ৩ ইত্যাদি)" 
                      className="w-full px-3 py-2 border rounded-md text-sm text-emerald-950 font-alinur" 
                    />
                  </div>

                  {/* 7 Custom Bio-Data Fields */}
                  <div className="border-t border-dashed border-gray-200 pt-4 mt-4 space-y-3 font-alinur">
                    <h4 className="text-xs font-bold text-emerald-800 font-alinur">সদস্যের ব্যক্তিগত বায়ো-ডাটা (Bio-Data)</h4>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-750 font-alinur">যোগদানের তারিখ</label>
                        <input 
                          type="text" 
                          required 
                          value={commJoiningDate} 
                          onChange={(e) => setCommJoiningDate(e.target.value)} 
                          placeholder="যোগদানের তারিখ লিখুন (দিন মাস, সাল)" 
                          className="w-full px-3 py-2 border rounded-md text-sm text-emerald-950 font-alinur" 
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-750 font-alinur">জন্ম তারিখ</label>
                        <input 
                          type="text" 
                          required 
                          value={commBirthDate} 
                          onChange={(e) => setCommBirthDate(e.target.value)} 
                          placeholder="জন্ম তারিখ লিখুন (দিন মাস, সাল)" 
                          className="w-full px-3 py-2 border rounded-md text-sm text-emerald-950 font-alinur" 
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-750 font-alinur">রক্তের গ্রুপ</label>
                        <input 
                          type="text" 
                          required 
                          value={commBloodGroup} 
                          onChange={(e) => setCommBloodGroup(e.target.value)} 
                          placeholder="রক্তের গ্রুপ লিখুন" 
                          className="w-full px-3 py-2 border rounded-md text-sm text-emerald-950 font-alinur" 
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-750 font-alinur">শিক্ষাগত যোগ্যতা</label>
                        <input 
                          type="text" 
                          required 
                          value={commQualification} 
                          onChange={(e) => setCommQualification(e.target.value)} 
                          placeholder="শিক্ষাগত যোগ্যতা লিখুন" 
                          className="w-full px-3 py-2 border rounded-md text-sm text-emerald-950 font-alinur" 
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-750 font-alinur">মোবাইল ফোন নম্বর</label>
                        <input 
                          type="text" 
                          required 
                          value={commPhone} 
                          onChange={(e) => setCommPhone(e.target.value)} 
                          placeholder="ফোন নম্বর লিখুন" 
                          className="w-full px-3 py-2 border rounded-md text-sm text-emerald-950 font-alinur" 
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-750 font-alinur">ইমেইল এড্রেস</label>
                        <input 
                          type="text" 
                          required 
                          value={commEmail} 
                          onChange={(e) => setCommEmail(e.target.value)} 
                          placeholder="ইমেইল ঠিকানা লিখুন" 
                          className="w-full px-3 py-2 border rounded-md text-sm text-emerald-950 font-alinur" 
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-750 font-alinur">স্থায়ী ও বর্তমান ঠিকানা</label>
                      <textarea 
                        rows={2} 
                        required 
                        value={commAddress} 
                        onChange={(e) => setCommAddress(e.target.value)} 
                        placeholder="স্থায়ী ও বর্তমান ঠিকানা লিখুন" 
                        className="w-full px-3 py-2 border rounded-md text-sm resize-none text-emerald-950 font-alinur" 
                      ></textarea>
                    </div>

                    {/* Optional Contact Fields */}
                    <div className="border-t border-dashed border-gray-200 pt-4 mt-4 space-y-3 font-alinur">
                      <h4 className="text-xs font-bold text-emerald-800 font-alinur">যোগাযোগের লিংক ও তথ্য (ঐচ্ছিক)</h4>
                      
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-750 font-alinur">ফেইজবুক লিংক</label>
                        <input 
                          type="text" 
                          value={commFacebook} 
                          onChange={(e) => setCommFacebook(e.target.value)} 
                          placeholder="ফেইজবুক প্রোফাইল লিংক লিখুন (অপশনাল)" 
                          className="w-full px-3 py-2 border rounded-md text-sm text-emerald-950 font-alinur" 
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-gray-750 font-alinur">হোয়াটসঅ্যাপ নম্বর</label>
                          <input 
                            type="text" 
                            value={commWhatsapp} 
                            onChange={(e) => setCommWhatsapp(e.target.value)} 
                            placeholder="হোয়াটসঅ্যাপ নম্বর লিখুন (অপশনাল)" 
                            className="w-full px-3 py-2 border rounded-md text-sm text-emerald-950 font-alinur" 
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-gray-750 font-alinur">মোবাইল নম্বর</label>
                          <input 
                            type="text" 
                            value={commPhoneNum} 
                            onChange={(e) => setCommPhoneNum(e.target.value)} 
                            placeholder="মোবাইল নম্বর লিখুন (অপশনাল)" 
                            className="w-full px-3 py-2 border rounded-md text-sm text-emerald-950 font-alinur" 
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Strict Image Upload Section */}
                  <div className="border-t border-dashed border-gray-200 pt-4 mt-4 space-y-2">
                    <label className="text-xs font-bold text-gray-700 block">ছবি আপলোড</label>
                    <div className="bg-amber-50/80 border border-amber-200 p-2.5 rounded-lg text-amber-900 text-[11px] leading-relaxed mb-2 font-sans flex items-start gap-1.5">
                      <span className="text-base shrink-0">⚠️</span>
                      <div>
                        <strong>কঠিন ইমেজ ভ্যালিডেশন:</strong> আপনি যতক্ষণ না ফরমের ওপরের সবকটি টেক্সট ফিল্ড (নাম, পদবী, বাণী, র‍্যাংক এবং কাস্টম ৭টি বায়ো-ডাটা ফিল্ড) সম্পূর্ণ ও সঠিকভাবে পূরণ করছেন, ততক্ষণ পর্যন্ত ছবি আপলোড বা প্রসেস করা যাবে না।
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        value={field5} 
                        onChange={(e) => setField5(e.target.value)} 
                        placeholder="সরাসরি ছবির লিঙ্ক (URL) দিতে পারেন অথবা পাশের বাটনে ফাইল সিলেক্ট করুন" 
                        className="flex-1 min-w-0 px-3 py-2 border rounded-md text-xs font-mono" 
                      />
                      <label className="bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 font-bold px-3 py-1.5 rounded-md text-xs cursor-pointer flex items-center justify-center gap-1 select-none shrink-0 font-sans">
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleFileUpload(e, setField5, "committee")}
                          disabled={isUploading}
                        />
                        {isUploading ? "আপলোড..." : "গ্যালারি থেকে প্রোফাইল ছবি সিলেক্ট করুন"}
                      </label>
                    </div>
                    {uploadError && (
                      <p className="text-[11px] text-red-600 font-bold mt-1.5 bg-red-50 border border-red-200 p-2 rounded-md font-sans">
                        {uploadError}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {user.role === "admin" && activeAdminSubTab === "honored" && (
                <>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-700">স্মরণীয় ব্যক্তিত্ব নাম</label>
                    <input type="text" required value={field1} onChange={(e) => setField1(e.target.value)} placeholder="স্মরণীয় ব্যক্তিত্ব নাম লিখুন" className="w-full px-3 py-2 border rounded-md text-sm" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-700">জীবনকাল (যেমন: ১৯১০ - ১৯৮৫)</label>
                    <input type="text" required value={field2} onChange={(e) => setField2(e.target.value)} placeholder="জীবনকাল লিখুন (জন্মসাল -মৃত্যুসাল)" className="w-full px-3 py-2 border rounded-md text-sm" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-700">অবদান ও অনন্য ত্যাগের সংক্ষিপ্ত বিবরণ</label>
                    <textarea required rows={4} value={field3} onChange={(e) => setField3(e.target.value)} placeholder="অবদান ও অনন্য ত্যাগের সংক্ষিপ্ত বিবরণ লিখুন" className="w-full px-3 py-2 border rounded-md text-sm resize-none"></textarea>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-700">স্মৃতি ছবি ইউআরএল</label>
                    <div className="flex gap-2">
                      <input type="text" value={field4} onChange={(e) => setField4(e.target.value)} placeholder="Image URL" className="flex-1 min-w-0 px-3 py-2 border rounded-md text-sm" />
                      <label className="bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 font-bold px-3 py-1.5 rounded-md text-xs cursor-pointer flex items-center justify-center gap-1 select-none shrink-0">
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleFileUpload(e, setField4, "honored")}
                          disabled={isUploading}
                        />
                        {isUploading ? "আপলোড..." : "গ্যালারি থেকে ছবি সিলেক্ট করুন"}
                      </label>
                    </div>
                    {uploadError && <p className="text-[11px] text-red-500 font-medium mt-1">{uploadError}</p>}
                  </div>
                </>
              )}

              <button
                type="submit"
                className={`w-full bg-emerald-800 hover:bg-emerald-950 text-white font-bold py-2.5 rounded-lg text-sm transition-all ${
                  activeAdminSubTab === "committee" ? "font-alinur" : ""
                }`}
              >
                দাখিল বা সংরক্ষণ করুন
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 1:1 Image Cropper Modal for Governing Body member profile photo */}
      {cropSrc && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in font-alinur">
          <div className="bg-white border-2 border-emerald-600 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-6">
            <div className="text-center space-y-1 border-b border-emerald-100 pb-3">
              <h3 className="text-lg font-black text-emerald-950 font-alinur">ছবি ক্রপ ও সাইজ সেটআপ (১:১ রেশিও)</h3>
              <p className="text-xs text-emerald-800 font-bold">নিখুঁত চারকোনা ছবি প্রদর্শনের জন্য জুমিং ও পজিশন কন্ট্রোল করুন</p>
            </div>

            {/* Interactive Preview Viewport */}
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="w-56 h-56 overflow-hidden rounded-2xl relative border-4 border-emerald-600 bg-slate-900 shadow-inner flex items-center justify-center">
                <img
                  src={cropSrc}
                  alt="To Crop"
                  style={{
                    transform: `scale(${cropZoom}) translate(${cropX}px, ${cropY}px)`,
                    transition: 'none',
                  }}
                  className="max-w-full max-h-full object-contain pointer-events-none"
                />
                {/* Visual crop guidelines helper overlays */}
                <div className="absolute inset-0 border border-emerald-400/20 pointer-events-none grid grid-cols-3 grid-rows-3">
                  <div className="border-r border-b border-white/20"></div>
                  <div className="border-r border-b border-white/20"></div>
                  <div className="border-b border-white/20"></div>
                  <div className="border-r border-b border-white/20"></div>
                  <div className="border-r border-b border-white/20"></div>
                  <div className="border-b border-white/20"></div>
                  <div className="border-r border-white/20"></div>
                  <div className="border-r border-white/20"></div>
                  <div></div>
                </div>
              </div>
              <span className="text-[10px] bg-emerald-50 text-emerald-800 px-3 py-1 rounded-full font-bold">১:১ স্কয়ার ক্রপ প্রিভিউ</span>
            </div>

            {/* Interactive Sliders */}
            <div className="space-y-4 bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100">
              {/* Zoom Slider */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold text-emerald-950">
                  <span>জুম ইন / আউট (Zoom)</span>
                  <span className="font-mono text-xs">{cropZoom.toFixed(2)}x</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="3"
                  step="0.05"
                  value={cropZoom}
                  onChange={(e) => setCropZoom(parseFloat(e.target.value))}
                  className="w-full h-2 bg-emerald-200 rounded-lg appearance-none cursor-pointer accent-emerald-700"
                />
              </div>

              {/* X position (Horizontal translation) */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold text-emerald-950">
                  <span>ডানে / বামে সরান (Horizontal)</span>
                  <span className="font-mono text-xs">{cropX}px</span>
                </div>
                <input
                  type="range"
                  min="-100"
                  max="100"
                  step="1"
                  value={cropX}
                  onChange={(e) => setCropX(parseInt(e.target.value))}
                  className="w-full h-2 bg-emerald-200 rounded-lg appearance-none cursor-pointer accent-emerald-700"
                />
              </div>

              {/* Y position (Vertical translation) */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold text-emerald-950">
                  <span>ওপরে / নিচে সরান (Vertical)</span>
                  <span className="font-mono text-xs">{cropY}px</span>
                </div>
                <input
                  type="range"
                  min="-100"
                  max="100"
                  step="1"
                  value={cropY}
                  onChange={(e) => setCropY(parseInt(e.target.value))}
                  className="w-full h-2 bg-emerald-200 rounded-lg appearance-none cursor-pointer accent-emerald-700"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setCropSrc(null);
                  setCropFile(null);
                  setCropFieldSetter(null);
                }}
                className="flex-1 bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 font-extrabold text-xs py-2.5 rounded-full transition-colors cursor-pointer text-center"
              >
                বাতিল করুন
              </button>
              <button
                type="button"
                onClick={async () => {
                  const img = new Image();
                  img.src = cropSrc;
                  img.onload = () => {
                    const canvas = document.createElement("canvas");
                    canvas.width = 500;
                    canvas.height = 500;
                    const ctx = canvas.getContext("2d");
                    if (ctx) {
                      ctx.fillStyle = "#ffffff";
                      ctx.fillRect(0, 0, 500, 500);

                      const size = Math.min(img.width, img.height);
                      const cropSize = size / cropZoom;
                      
                      const shiftX = (cropX / 100) * (img.width - cropSize) * 0.5;
                      const shiftY = (cropY / 100) * (img.height - cropSize) * 0.5;
                      
                      const sx = Math.max(0, Math.min(img.width - cropSize, (img.width - cropSize) / 2 - shiftX));
                      const sy = Math.max(0, Math.min(img.height - cropSize, (img.height - cropSize) / 2 - shiftY));
                      
                      ctx.drawImage(img, sx, sy, cropSize, cropSize, 0, 0, 500, 500);
                    }

                    canvas.toBlob(async (blob) => {
                      if (!blob) return;
                      const croppedFile = new File([blob], cropFile?.name || "cropped_profile.jpg", { type: "image/jpeg" });
                      
                      // Close modal
                      setCropSrc(null);
                      
                      // Upload to ImgBB
                      setIsUploading(true);
                      setUploadError("");
                      try {
                        const downloadUrl = await uploadFileToImgBB(croppedFile);
                        if (cropFieldSetter) {
                          cropFieldSetter(downloadUrl);
                        }
                      } catch (error: any) {
                        console.error("Error uploading cropped file:", error);
                        setUploadError("ক্রপ করা ছবি আপলোড করতে ব্যর্থ হয়েছে। পুনরায় চেষ্টা করুন।");
                      } finally {
                        setIsUploading(false);
                      }
                    }, "image/jpeg", 0.9);
                  };
                }}
                className="flex-1 bg-emerald-800 hover:bg-emerald-950 text-white font-extrabold text-xs py-2.5 rounded-full transition-colors cursor-pointer text-center shadow-md shadow-emerald-800/10"
              >
                ক্রপ ও আপলোড সম্পন্ন করুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Immersive uploading loading overlay */}
      {isUploading && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in font-alinur">
          <div className="bg-white border-2 border-emerald-600 rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl space-y-6">
            <div className="flex justify-center">
              <div className="relative h-20 w-20 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border-4 border-emerald-100 animate-pulse"></div>
                <div className="absolute inset-0 rounded-full border-4 border-t-emerald-800 animate-spin"></div>
                <div className="h-10 w-10 bg-emerald-800 rounded-full flex items-center justify-center text-white font-bold animate-bounce text-sm">
                  🕌
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="text-base font-extrabold text-emerald-950">লোগো আপলোড হচ্ছে...</h3>
              <p className="text-[11px] text-gray-500 leading-relaxed font-bold animate-pulse">
                ফাইলটি সার্ভারে প্রসেস করা হচ্ছে। অনুগ্রহ করে কিছু সময় অপেক্ষা করুন।
              </p>
            </div>
            {/* Smooth Progress Wave / Bar Simulation */}
            <div className="h-2 w-full bg-emerald-50 rounded-full overflow-hidden relative border border-emerald-100">
              <div className="absolute top-0 bottom-0 left-0 bg-gradient-to-r from-emerald-600 via-amber-500 to-emerald-600 rounded-full animate-[pulse_1.5s_infinite] w-full"></div>
            </div>
          </div>
        </div>
      )}

      {/* Madrasah Logo Upload Success Modal Dialog */}
      {showLogoSuccessPopup && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in font-alinur">
          <div className="bg-white border-2 border-emerald-600 rounded-3xl p-6 max-w-sm w-full text-center shadow-2xl space-y-4">
            <div className="flex justify-center">
              <div className="h-16 w-16 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600">
                <Check className="h-10 w-10 stroke-[3]" />
              </div>
            </div>
            <h3 className="text-xl font-extrabold text-emerald-950 font-alinur">আপনার লগো আপডেট সফল</h3>
            <p className="text-xs text-gray-600 leading-relaxed font-bold">
              মাদ্রাসার অফিসিয়াল লোগোটি সফলভাবে আপডেট করা হয়েছে এবং সম্পূর্ণ ওয়েবসাইটে পরিবর্তন রিয়েল-টাইমে যুক্ত করা হয়েছে।
            </p>
            <button
              onClick={() => {
                setShowLogoSuccessPopup(false);
              }}
              className="w-full bg-emerald-800 hover:bg-emerald-900 text-white font-extrabold text-xs py-2.5 rounded-full transition-colors cursor-pointer text-center shadow-md shadow-emerald-800/10"
            >
              ঠিক আছে
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
