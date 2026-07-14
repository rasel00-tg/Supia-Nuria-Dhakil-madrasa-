import React, { useState, useRef } from "react";
import { db, StreamBuilder } from "../lib/firebase";
import { collection, query, doc, addDoc, updateDoc, deleteDoc, orderBy } from "firebase/firestore";
import { 
  Save, Trash2, Calendar, User, PlusCircle, CheckCircle, AlertTriangle, 
  Image as ImageIcon, Phone, FileText, Heart, MapPin, Eye, Edit3, X, EyeOff, Loader2
} from "lucide-react";

// Helper function to compress image client-side using Canvas
const compressImage = (file: File, maxWidth = 800, maxHeight = 800, quality = 0.75): Promise<File> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        // Resize proportional to maxWidth / maxHeight
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(file); // fallback to original file if canvas context is not supported
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".jpg", {
                type: "image/jpeg",
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            } else {
              resolve(file);
            }
          },
          "image/jpeg",
          quality
        );
      };
      img.onerror = () => resolve(file);
    };
    reader.onerror = () => resolve(file);
  });
};

// ImgBB API Key provided in prompt
const IMGBB_API_KEY = "96be92cf24f1281697cde3f7ad9d506e";

// Helper to upload a compressed file directly to ImgBB and return direct image URL
const uploadToImgBB = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append("image", file);
  
  const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error("ImgBB upload status failed");
  }

  const result = await response.json();
  if (result && result.success && result.data && result.data.url) {
    return result.data.url; // Direct URL Link
  }
  
  throw new Error("ImgBB API response parsing error");
};

export default function KormochariUpdateForm() {
  // Input fields state (all initialized to empty string)
  const [name, setName] = useState("");
  const [designation, setDesignation] = useState("");
  const [fatherName, setFatherName] = useState("");
  const [motherName, setMotherName] = useState("");
  const [phone, setPhone] = useState("");
  const [nid, setNid] = useState("");
  const [birthYear, setBirthYear] = useState("");
  const [bloodGroup, setBloodGroup] = useState("");
  const [education, setEducation] = useState("");
  const [presentAddress, setPresentAddress] = useState("");
  const [permanentAddress, setPermanentAddress] = useState("");
  const [joiningDate, setJoiningDate] = useState("");

  // Upload URLs state
  const [photo, setPhoto] = useState("");
  const [nidFront, setNidFront] = useState("");
  const [nidBack, setNidBack] = useState("");

  // Upload progress indicators
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isUploadingNidFront, setIsUploadingNidFront] = useState(false);
  const [isUploadingNidBack, setIsUploadingNidBack] = useState(false);

  // Core status states
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Modal / Detailed View State
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
  const [isEditMode, setIsEditMode] = useState(false);

  // Edit fields state
  const [editName, setEditName] = useState("");
  const [editDesignation, setEditDesignation] = useState("");
  const [editFatherName, setEditFatherName] = useState("");
  const [editMotherName, setEditMotherName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editNid, setEditNid] = useState("");
  const [editBirthYear, setEditBirthYear] = useState("");
  const [editBloodGroup, setEditBloodGroup] = useState("");
  const [editEducation, setEditEducation] = useState("");
  const [editPresentAddress, setEditPresentAddress] = useState("");
  const [editPermanentAddress, setEditPermanentAddress] = useState("");
  const [editJoiningDate, setEditJoiningDate] = useState("");
  const [editPhoto, setEditPhoto] = useState("");
  const [editNidFront, setEditNidFront] = useState("");
  const [editNidBack, setEditNidBack] = useState("");

  // Upload progress indicators for editing modal
  const [isEditingUploadingPhoto, setIsEditingUploadingPhoto] = useState(false);
  const [isEditingUploadingNidFront, setIsEditingUploadingNidFront] = useState(false);
  const [isEditingUploadingNidBack, setIsEditingUploadingNidBack] = useState(false);

  // File Inputs references
  const photoInputRef = useRef<HTMLInputElement>(null);
  const nidFrontInputRef = useRef<HTMLInputElement>(null);
  const nidBackInputRef = useRef<HTMLInputElement>(null);

  const editPhotoInputRef = useRef<HTMLInputElement>(null);
  const editNidFrontInputRef = useRef<HTMLInputElement>(null);
  const editNidBackInputRef = useRef<HTMLInputElement>(null);

  // Compressed Image + ImgBB Uploader wrapper
  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    setTargetUrl: React.Dispatch<React.SetStateAction<string>>,
    setLoadingState: React.Dispatch<React.SetStateAction<boolean>>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoadingState(true);
    setErrorMsg("");

    try {
      // 1. Auto-compression
      const compressed = await compressImage(file, 800, 800, 0.75);
      
      // 2. Upload to ImgBB
      const directUrl = await uploadToImgBB(compressed);
      
      // 3. Save link to state
      setTargetUrl(directUrl);
    } catch (err: any) {
      console.error("ImgBB upload failed:", err);
      setErrorMsg("ছবি আপলোড বা কম্প্রেশন করা সম্ভব হয়নি। পুনরায় চেষ্টা করুন।");
    } finally {
      setLoadingState(false);
    }
  };

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg("দয়া করে কর্মচারীর নাম লিখুন।");
      return;
    }
    if (!joiningDate) {
      setErrorMsg("দয়া করে যোগদানের তারিখ নির্বাচন করুন।");
      return;
    }

    setIsSaving(true);
    setSuccessMsg("");
    setErrorMsg("");

    try {
      await addDoc(collection(db, "employees"), {
        name: name.trim(),
        designation: designation.trim(),
        fatherName: fatherName.trim(),
        motherName: motherName.trim(),
        phone: phone.trim(),
        nid: nid.trim(),
        birthYear: birthYear.trim(),
        bloodGroup: bloodGroup.trim(),
        education: education.trim(),
        presentAddress: presentAddress.trim(),
        permanentAddress: permanentAddress.trim(),
        joiningDate: joiningDate,
        photo: photo || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=250",
        nidFront: nidFront || "",
        nidBack: nidBack || "",
        createdAt: new Date().toISOString()
      });

      // Clear all state values
      setName("");
      setDesignation("");
      setFatherName("");
      setMotherName("");
      setPhone("");
      setNid("");
      setBirthYear("");
      setBloodGroup("");
      setEducation("");
      setPresentAddress("");
      setPermanentAddress("");
      setJoiningDate("");
      setPhoto("");
      setNidFront("");
      setNidBack("");

      // Reset file inputs
      if (photoInputRef.current) photoInputRef.current.value = "";
      if (nidFrontInputRef.current) nidFrontInputRef.current.value = "";
      if (nidBackInputRef.current) nidBackInputRef.current.value = "";

      setSuccessMsg("নতুন কর্মচারী সফলভাবে যুক্ত করা হয়েছে!");
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err: any) {
      console.error("Error adding employee:", err);
      setErrorMsg("কর্মচারী যোগ করতে ব্যর্থ হয়েছে। পুনরায় চেষ্টা করুন।");
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenDetails = (employee: any) => {
    setSelectedEmployee(employee);
    setIsEditMode(false);

    // Set Edit state values
    setEditName(employee.name || "");
    setEditDesignation(employee.designation || "");
    setEditFatherName(employee.fatherName || "");
    setEditMotherName(employee.motherName || "");
    setEditPhone(employee.phone || "");
    setEditNid(employee.nid || "");
    setEditBirthYear(employee.birthYear || "");
    setEditBloodGroup(employee.bloodGroup || "");
    setEditEducation(employee.education || "");
    setEditPresentAddress(employee.presentAddress || "");
    setEditPermanentAddress(employee.permanentAddress || "");
    setEditJoiningDate(employee.joiningDate || "");
    setEditPhoto(employee.photo || "");
    setEditNidFront(employee.nidFront || "");
    setEditNidBack(employee.nidBack || "");
  };

  const handleUpdateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployee) return;

    setIsSaving(true);
    try {
      const empRef = doc(db, "employees", selectedEmployee.id);
      await updateDoc(empRef, {
        name: editName.trim(),
        designation: editDesignation.trim(),
        fatherName: editFatherName.trim(),
        motherName: editMotherName.trim(),
        phone: editPhone.trim(),
        nid: editNid.trim(),
        birthYear: editBirthYear.trim(),
        bloodGroup: editBloodGroup.trim(),
        education: editEducation.trim(),
        presentAddress: editPresentAddress.trim(),
        permanentAddress: editPermanentAddress.trim(),
        joiningDate: editJoiningDate,
        photo: editPhoto,
        nidFront: editNidFront,
        nidBack: editNidBack
      });

      // Update selected employee in view
      setSelectedEmployee({
        id: selectedEmployee.id,
        name: editName,
        designation: editDesignation,
        fatherName: editFatherName,
        motherName: editMotherName,
        phone: editPhone,
        nid: editNid,
        birthYear: editBirthYear,
        bloodGroup: editBloodGroup,
        education: editEducation,
        presentAddress: editPresentAddress,
        permanentAddress: editPermanentAddress,
        joiningDate: editJoiningDate,
        photo: editPhoto,
        nidFront: editNidFront,
        nidBack: editNidBack
      });

      setIsEditMode(false);
      alert("কর্মচারীর তথ্য সফলভাবে আপডেট করা হয়েছে।");
    } catch (err: any) {
      console.error("Error updating employee:", err);
      alert("তথ্য আপডেট করতে ব্যর্থ হয়েছে।");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteEmployee = async (id: string, empName: string) => {
    if (window.confirm(`আপনি কি নিশ্চিতভাবে "${empName}"-কে তালিকা থেকে মুছে ফেলতে চান?`)) {
      try {
        await deleteDoc(doc(db, "employees", id));
        setSelectedEmployee(null);
        alert("কর্মচারী প্রোফাইল সফলভাবে মুছে ফেলা হয়েছে।");
      } catch (err: any) {
        console.error("Error deleting employee:", err);
        alert("কর্মচারী মুছে ফেলতে ব্যর্থ হয়েছে।");
      }
    }
  };

  return (
    <div className="space-y-8 font-alinur">
      {/* Title */}
      <div className="pb-4 border-b border-gray-100 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-slate-800">কর্মচারী প্যানেল ও অটো-কম্প্রেশন ফাইল আপলোড</h3>
          <p className="text-xs text-gray-500">মাদ্রাসার কর্মচারীদের বিস্তারিত বায়োডাটা এবং সংকুচিত (Fast Load) ছবি ও এনআইডি ডকুমেন্ট সরাসরি ImgBB সার্ভারে আপলোড করুন।</p>
        </div>
      </div>

      {successMsg && (
        <div className="bg-emerald-100 border border-emerald-300 text-emerald-900 px-4 py-3 rounded-xl flex items-center gap-2 animate-fade-in text-sm font-bold">
          <CheckCircle className="h-5 w-5 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-xl flex items-center gap-2 text-sm font-bold animate-fade-in">
          <AlertTriangle className="h-5 w-5 text-red-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Grid Layout: Left - Entry Form, Right - Real-time Management List */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Form: Form to Add detailed employee */}
        <form onSubmit={handleAddEmployee} className="lg:col-span-7 bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
          <h4 className="font-bold text-base text-emerald-950 border-b pb-3 flex items-center gap-2">
            <PlusCircle className="h-5 w-5 text-emerald-850" />
            <span>নতুন কর্মচারী বায়োডাটা ভুক্তি</span>
          </h4>

          {/* Form Fields Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Name */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-gray-700">কর্মচারীর নাম (বাংলায়) <span className="text-red-500">*</span></label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                  <User className="h-4 w-4" />
                </span>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="এখানে নাম লিখুন"
                  className="block w-full pl-9 pr-3 py-2 border border-slate-250 rounded-xl text-xs font-bold focus:ring-1 focus:ring-emerald-800 focus:outline-hidden bg-white text-slate-800"
                  required
                />
              </div>
            </div>

            {/* Designation / পদবি */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-gray-700">কর্মচারীর পদ <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={designation}
                onChange={(e) => setDesignation(e.target.value)}
                placeholder="এখানে কর্মচারীর পদ লিখুন"
                className="block w-full px-3 py-2 border border-slate-250 rounded-xl text-xs font-bold focus:ring-1 focus:ring-emerald-800 focus:outline-hidden bg-white text-slate-800"
                required
              />
            </div>

            {/* Father's Name */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-gray-700">বাবার নাম</label>
              <input
                type="text"
                value={fatherName}
                onChange={(e) => setFatherName(e.target.value)}
                placeholder="এখানে বাবার নাম লিখুন"
                className="block w-full px-3 py-2 border border-slate-250 rounded-xl text-xs font-bold focus:ring-1 focus:ring-emerald-800 focus:outline-hidden bg-white text-slate-800"
              />
            </div>

            {/* Mother's Name */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-gray-700">মায়ের নাম</label>
              <input
                type="text"
                value={motherName}
                onChange={(e) => setMotherName(e.target.value)}
                placeholder="এখানে মায়ের নাম লিখুন"
                className="block w-full px-3 py-2 border border-slate-250 rounded-xl text-xs font-bold focus:ring-1 focus:ring-emerald-800 focus:outline-hidden bg-white text-slate-800"
              />
            </div>

            {/* Contact Number */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-gray-700">কন্টাক্ট নাম্বার</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                  <Phone className="h-4 w-4" />
                </span>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="এখানে কন্টাক্ট নাম্বার লিখুন"
                  className="block w-full pl-9 pr-3 py-2 border border-slate-250 rounded-xl text-xs font-bold focus:ring-1 focus:ring-emerald-800 focus:outline-hidden bg-white text-slate-800 font-mono"
                />
              </div>
            </div>

            {/* NID Number */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-gray-700">এনআইডি নাম্বার</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                  <FileText className="h-4 w-4" />
                </span>
                <input
                  type="text"
                  value={nid}
                  onChange={(e) => setNid(e.target.value)}
                  placeholder="এখানে এনআইডি নাম্বার লিখুন"
                  className="block w-full pl-9 pr-3 py-2 border border-slate-250 rounded-xl text-xs font-bold focus:ring-1 focus:ring-emerald-800 focus:outline-hidden bg-white text-slate-800 font-mono"
                />
              </div>
            </div>

            {/* Year of Birth */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-gray-700">জন্মসাল</label>
              <input
                type="number"
                value={birthYear}
                onChange={(e) => setBirthYear(e.target.value)}
                placeholder="এখানে জন্মসাল লিখুন"
                className="block w-full px-3 py-2 border border-slate-250 rounded-xl text-xs font-bold focus:ring-1 focus:ring-emerald-800 focus:outline-hidden bg-white text-slate-800 font-mono"
              />
            </div>

            {/* Blood Group */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-gray-700">রক্তের গ্রুপ</label>
              <input
                type="text"
                value={bloodGroup}
                onChange={(e) => setBloodGroup(e.target.value)}
                placeholder="এখানে রক্তের গ্রুপ লিখুন"
                className="block w-full px-3 py-2 border border-slate-250 rounded-xl text-xs font-bold focus:ring-1 focus:ring-emerald-800 focus:outline-hidden bg-white text-slate-800"
              />
            </div>
          </div>

          {/* Educational Qualification and Joining Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Qualification */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-gray-700">শিক্ষাগত যোগ্যতা</label>
              <input
                type="text"
                value={education}
                onChange={(e) => setEducation(e.target.value)}
                placeholder="এখানে শিক্ষাগত যোগ্যতা লিখুন"
                className="block w-full px-3 py-2 border border-slate-250 rounded-xl text-xs font-bold focus:ring-1 focus:ring-emerald-800 focus:outline-hidden bg-white text-slate-800"
              />
            </div>

            {/* Joining Date */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-gray-700">যোগদানের তারিখ <span className="text-red-500">*</span></label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                  <Calendar className="h-4 w-4" />
                </span>
                <input
                  type="date"
                  value={joiningDate}
                  onChange={(e) => setJoiningDate(e.target.value)}
                  className="block w-full pl-9 pr-3 py-2 border border-slate-250 rounded-xl text-xs font-bold focus:ring-1 focus:ring-emerald-800 focus:outline-hidden bg-white text-slate-800"
                  required
                />
              </div>
            </div>
          </div>

          {/* Addresses */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-gray-700">বর্তমান ঠিকানা</label>
              <textarea
                value={presentAddress}
                onChange={(e) => setPresentAddress(e.target.value)}
                placeholder="এখানে বর্তমান ঠিকানা লিখুন"
                rows={2}
                className="block w-full px-3 py-2 border border-slate-250 rounded-xl text-xs font-bold focus:ring-1 focus:ring-emerald-800 focus:outline-hidden resize-none bg-white text-slate-800"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-gray-700">স্থায়ী ঠিকানা</label>
              <textarea
                value={permanentAddress}
                onChange={(e) => setPermanentAddress(e.target.value)}
                placeholder="এখানে স্থায়ী ঠিকানা লিখুন"
                rows={2}
                className="block w-full px-3 py-2 border border-slate-250 rounded-xl text-xs font-bold focus:ring-1 focus:ring-emerald-800 focus:outline-hidden resize-none bg-white text-slate-800"
              />
            </div>
          </div>

          {/* Device gallery files upload section */}
          <div className="border-t border-slate-100 pt-5 space-y-4">
            <h5 className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
              <ImageIcon className="h-4 w-4 text-emerald-850" />
              <span>ছবি ও দলিলাদি আপলোড (স্বয়ংক্রিয় ইমেজ কম্প্রেশন ও ImgBB ক্লাউড হোস্টিং)</span>
            </h5>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              
              {/* Profile Image Uploader */}
              <div className="p-4 border border-dashed border-slate-250 rounded-2xl flex flex-col items-center justify-between space-y-3 bg-slate-50/50">
                <span className="text-[11px] font-bold text-slate-700 text-center">১. প্রোফাইল ছবি</span>
                
                {isUploadingPhoto ? (
                  <div className="h-16 w-16 flex flex-col items-center justify-center space-y-1">
                    <Loader2 className="h-6 w-6 text-emerald-800 animate-spin" />
                    <span className="text-[8px] font-bold text-emerald-800">আপলোড হচ্ছে...</span>
                  </div>
                ) : photo ? (
                  <div className="relative group">
                    <img src={photo} alt="প্রোফাইল ছবি" className="h-16 w-16 object-cover rounded-full border border-slate-200" />
                    <button 
                      type="button" 
                      onClick={() => setPhoto("")}
                      className="absolute -top-1 -right-1 bg-red-500 text-white p-0.5 rounded-full hover:bg-red-600 shadow-sm"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <div className="h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200 text-slate-300">
                    <User className="h-8 w-8" />
                  </div>
                )}

                <input
                  type="file"
                  accept="image/*"
                  ref={photoInputRef}
                  onChange={(e) => handleFileUpload(e, setPhoto, setIsUploadingPhoto)}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => photoInputRef.current?.click()}
                  disabled={isUploadingPhoto}
                  className="px-2.5 py-1.5 text-[10px] font-bold bg-white border border-slate-300 hover:bg-slate-50 rounded-lg text-slate-700 w-full shadow-xs disabled:opacity-50"
                >
                  গ্যালারি থেকে নির্বাচন
                </button>
              </div>

              {/* NID Front Uploader */}
              <div className="p-4 border border-dashed border-slate-250 rounded-2xl flex flex-col items-center justify-between space-y-3 bg-slate-50/50">
                <span className="text-[11px] font-bold text-slate-700 text-center">২. এনআইডি সামনের অংশ</span>
                
                {isUploadingNidFront ? (
                  <div className="h-12 w-20 flex flex-col items-center justify-center space-y-1">
                    <Loader2 className="h-6 w-6 text-emerald-800 animate-spin" />
                    <span className="text-[8px] font-bold text-emerald-800">আপলোড হচ্ছে...</span>
                  </div>
                ) : nidFront ? (
                  <div className="relative group">
                    <img src={nidFront} alt="এনআইডি সামনের অংশ" className="h-12 w-20 object-cover rounded-lg border border-slate-200" />
                    <button 
                      type="button" 
                      onClick={() => setNidFront("")}
                      className="absolute -top-1 -right-1 bg-red-500 text-white p-0.5 rounded-full hover:bg-red-600 shadow-sm"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <div className="h-12 w-20 rounded-lg bg-slate-100 flex items-center justify-center border border-slate-200 text-slate-300 text-[9px] font-bold">
                    NID Front
                  </div>
                )}

                <input
                  type="file"
                  accept="image/*"
                  ref={nidFrontInputRef}
                  onChange={(e) => handleFileUpload(e, setNidFront, setIsUploadingNidFront)}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => nidFrontInputRef.current?.click()}
                  disabled={isUploadingNidFront}
                  className="px-2.5 py-1.5 text-[10px] font-bold bg-white border border-slate-300 hover:bg-slate-50 rounded-lg text-slate-700 w-full shadow-xs disabled:opacity-50"
                >
                  গ্যালারি থেকে নির্বাচন
                </button>
              </div>

              {/* NID Back Uploader */}
              <div className="p-4 border border-dashed border-slate-250 rounded-2xl flex flex-col items-center justify-between space-y-3 bg-slate-50/50">
                <span className="text-[11px] font-bold text-slate-700 text-center">৩. এনআইডি পিছনের অংশ</span>
                
                {isUploadingNidBack ? (
                  <div className="h-12 w-20 flex flex-col items-center justify-center space-y-1">
                    <Loader2 className="h-6 w-6 text-emerald-800 animate-spin" />
                    <span className="text-[8px] font-bold text-emerald-800">আপলোড হচ্ছে...</span>
                  </div>
                ) : nidBack ? (
                  <div className="relative group">
                    <img src={nidBack} alt="এনআইডি পিছনের অংশ" className="h-12 w-20 object-cover rounded-lg border border-slate-200" />
                    <button 
                      type="button" 
                      onClick={() => setNidBack("")}
                      className="absolute -top-1 -right-1 bg-red-500 text-white p-0.5 rounded-full hover:bg-red-600 shadow-sm"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <div className="h-12 w-20 rounded-lg bg-slate-100 flex items-center justify-center border border-slate-200 text-slate-300 text-[9px] font-bold">
                    NID Back
                  </div>
                )}

                <input
                  type="file"
                  accept="image/*"
                  ref={nidBackInputRef}
                  onChange={(e) => handleFileUpload(e, setNidBack, setIsUploadingNidBack)}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => nidBackInputRef.current?.click()}
                  disabled={isUploadingNidBack}
                  className="px-2.5 py-1.5 text-[10px] font-bold bg-white border border-slate-300 hover:bg-slate-50 rounded-lg text-slate-700 w-full shadow-xs disabled:opacity-50"
                >
                  গ্যালারি থেকে নির্বাচন
                </button>
              </div>

            </div>
          </div>

          <button
            type="submit"
            disabled={isSaving || isUploadingPhoto || isUploadingNidFront || isUploadingNidBack}
            className="flex items-center justify-center space-x-2 w-full py-3 px-4 bg-emerald-800 text-white font-bold text-sm rounded-xl hover:bg-emerald-900 focus:outline-hidden active:scale-98 transition-all disabled:opacity-50 shadow-sm"
          >
            <Save className="h-4 w-4 text-amber-400" />
            <span>{isSaving ? "সংরক্ষণ করা হচ্ছে..." : "নতুন কর্মচারী সম্পূর্ণ সেভ করুন"}</span>
          </button>
        </form>

        {/* Right Panel: Real-time Employee Management list */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
          <h4 className="font-bold text-base text-emerald-950 border-b pb-3 flex items-center justify-between">
            <span>বিদ্যমান কর্মচারী তালিকা</span>
          </h4>

          <div className="max-h-[620px] overflow-y-auto pr-1">
            <StreamBuilder<any>
              stream={query(collection(db, "employees"), orderBy("joiningDate", "asc"))}
              builder={(employees, loading, error) => {
                if (loading) {
                  return (
                    <div className="text-center py-12 space-y-2">
                      <div className="h-8 w-8 border-2 border-emerald-800 border-t-transparent rounded-full animate-spin mx-auto"></div>
                      <p className="text-xs text-emerald-950 font-bold animate-pulse">লোড হচ্ছে...</p>
                    </div>
                  );
                }
                if (error) {
                  return <p className="text-xs text-red-500 text-center py-6">তালিকা লোড করতে সমস্যা হয়েছে</p>;
                }
                if (!employees || employees.length === 0) {
                  return (
                    <div className="text-center py-12 border border-dashed border-slate-200 rounded-2xl space-y-2 bg-slate-50/50">
                      <User className="h-10 w-10 text-slate-300 mx-auto" />
                      <p className="text-xs text-slate-500 font-bold">কোনো কর্মচারী পাওয়া যায়নি।</p>
                    </div>
                  );
                }

                return (
                  <div className="divide-y divide-slate-100">
                    {employees.map((employee) => (
                      <div key={employee.id} className="py-4 flex items-center justify-between gap-4 first:pt-0 last:pb-0 group">
                        <div className="flex items-center space-x-3 min-w-0">
                          <img 
                            src={employee.photo || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=250"} 
                            alt={employee.name} 
                            className="h-12 w-12 rounded-full object-cover border border-slate-200 shrink-0 bg-slate-50" 
                          />
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-900 group-hover:text-emerald-900 transition-colors truncate">{employee.name}</p>
                            <p className="text-[10px] text-emerald-850 font-semibold">{employee.designation || "অফিস স্টাফ"}</p>
                            <p className="text-[9px] text-gray-500 font-mono">যোগদান: {employee.joiningDate}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {/* Details Button */}
                          <button
                            type="button"
                            onClick={() => handleOpenDetails(employee)}
                            className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-100 text-emerald-850 font-bold text-[11px] rounded-lg transition-colors flex items-center gap-1"
                            title="বিস্তারিত দেখুন ও এডিট করুন"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            <span>বিস্তারিত</span>
                          </button>

                          {/* Quick Delete */}
                          <button
                            type="button"
                            onClick={() => handleDeleteEmployee(employee.id, employee.name)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="মুছে ফেলুন"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              }}
            />
          </div>
        </div>
      </div>

      {/* Interactive Modal: Details View and Inline Editing */}
      {selectedEmployee && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto animate-fade-in font-alinur">
          <div className="bg-white rounded-3xl max-w-2xl w-full border border-slate-200 overflow-hidden shadow-2xl my-8 relative flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="bg-emerald-950 text-white p-6 border-b-4 border-amber-500 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base sm:text-lg">কর্মচারী তথ্য প্যানেল</h3>
                <p className="text-[10px] text-emerald-300 font-mono">আইডি: {selectedEmployee.id}</p>
              </div>
              <button 
                onClick={() => setSelectedEmployee(null)}
                className="p-1.5 hover:bg-white/10 rounded-full transition-colors text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body Container with Scroll */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-white">
              
              {/* Toggle Display Info vs Editing Form */}
              {!isEditMode ? (
                // --- DISPLAY MODE ---
                <div className="space-y-6 text-slate-800">
                  
                  {/* Personal Header info */}
                  <div className="flex flex-col sm:flex-row items-center gap-6 pb-6 border-b border-slate-100 text-center sm:text-left">
                    <img 
                      src={selectedEmployee.photo || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=250"} 
                      alt={selectedEmployee.name} 
                      className="h-28 w-28 rounded-full object-cover border-4 border-emerald-50 shadow-md bg-slate-50" 
                    />
                    <div className="space-y-2">
                      <h4 className="text-xl font-bold text-slate-900">{selectedEmployee.name}</h4>
                      <div className="flex flex-wrap justify-center sm:justify-start gap-2">
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-800 text-[10px] font-bold">
                          {selectedEmployee.designation || "অফিস স্টাফ"}
                        </span>
                        {selectedEmployee.bloodGroup && (
                          <span className="px-2.5 py-0.5 rounded-full bg-red-50 border border-red-100 text-red-700 text-[10px] font-bold flex items-center gap-1">
                            <Heart className="h-3 w-3 fill-red-500 text-red-500" />
                            <span>রক্ত: {selectedEmployee.bloodGroup}</span>
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 font-medium flex items-center justify-center sm:justify-start gap-1.5">
                        <Calendar className="h-4 w-4 text-emerald-850" />
                        <span>যোগদান: {selectedEmployee.joiningDate}</span>
                      </p>
                    </div>
                  </div>

                  {/* Text details in a neat grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 text-xs">
                    
                    <div className="space-y-1">
                      <span className="font-bold text-slate-400">বাবার নাম:</span>
                      <p className="text-slate-800 font-bold bg-slate-50 px-3 py-2 rounded-lg">{selectedEmployee.fatherName || "—"}</p>
                    </div>

                    <div className="space-y-1">
                      <span className="font-bold text-slate-400">মায়ের নাম:</span>
                      <p className="text-slate-800 font-bold bg-slate-50 px-3 py-2 rounded-lg">{selectedEmployee.motherName || "—"}</p>
                    </div>

                    <div className="space-y-1">
                      <span className="font-bold text-slate-400">কন্টাক্ট নাম্বার:</span>
                      <p className="text-slate-800 font-bold bg-slate-50 px-3 py-2 rounded-lg font-mono">{selectedEmployee.phone || "—"}</p>
                    </div>

                    <div className="space-y-1">
                      <span className="font-bold text-slate-400">এনআইডি নাম্বার:</span>
                      <p className="text-slate-800 font-bold bg-slate-50 px-3 py-2 rounded-lg font-mono">{selectedEmployee.nid || "—"}</p>
                    </div>

                    <div className="space-y-1">
                      <span className="font-bold text-slate-400">জন্মসাল:</span>
                      <p className="text-slate-800 font-bold bg-slate-50 px-3 py-2 rounded-lg font-mono">{selectedEmployee.birthYear || "—"}</p>
                    </div>

                    <div className="space-y-1">
                      <span className="font-bold text-slate-400">শিক্ষাগত যোগ্যতা:</span>
                      <p className="text-slate-800 font-bold bg-slate-50 px-3 py-2 rounded-lg">{selectedEmployee.education || "—"}</p>
                    </div>
                  </div>

                  {/* Addresses */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div className="space-y-1">
                      <span className="font-bold text-slate-400">বর্তমান ঠিকানা:</span>
                      <p className="text-slate-800 font-bold bg-slate-50 px-3 py-2 rounded-lg leading-relaxed whitespace-pre-line">{selectedEmployee.presentAddress || "—"}</p>
                    </div>

                    <div className="space-y-1">
                      <span className="font-bold text-slate-400">স্থায়ী ঠিকানা:</span>
                      <p className="text-slate-800 font-bold bg-slate-50 px-3 py-2 rounded-lg leading-relaxed whitespace-pre-line">{selectedEmployee.permanentAddress || "—"}</p>
                    </div>
                  </div>

                  {/* NID Images View */}
                  <div className="border-t border-slate-100 pt-5 space-y-3">
                    <h5 className="font-bold text-xs text-slate-850">জাতীয় পরিচয়পত্র কপি</h5>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-slate-400">সামনের অংশ:</span>
                        {selectedEmployee.nidFront ? (
                          <div className="relative border border-slate-200 rounded-xl overflow-hidden bg-slate-50 flex items-center justify-center p-1 group">
                            <img src={selectedEmployee.nidFront} alt="NID Front" className="h-32 object-contain w-full rounded-lg" />
                          </div>
                        ) : (
                          <div className="h-32 bg-slate-50 border border-dashed border-slate-200 rounded-xl flex items-center justify-center text-slate-400 text-xs font-bold">
                            এনআইডি ফ্রন্ট আপলোড করা নেই।
                          </div>
                        )}
                      </div>

                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-slate-400">পিছনের অংশ:</span>
                        {selectedEmployee.nidBack ? (
                          <div className="relative border border-slate-200 rounded-xl overflow-hidden bg-slate-50 flex items-center justify-center p-1 group">
                            <img src={selectedEmployee.nidBack} alt="NID Back" className="h-32 object-contain w-full rounded-lg" />
                          </div>
                        ) : (
                          <div className="h-32 bg-slate-50 border border-dashed border-slate-200 rounded-xl flex items-center justify-center text-slate-400 text-xs font-bold">
                            এনআইডি ব্যাক আপলোড করা নেই।
                          </div>
                        )}
                      </div>

                    </div>
                  </div>

                  {/* Modal control footer buttons */}
                  <div className="flex items-center gap-3 border-t border-slate-100 pt-5">
                    <button
                      type="button"
                      onClick={() => setIsEditMode(true)}
                      className="flex-1 py-2.5 bg-emerald-800 text-white font-bold text-xs rounded-xl hover:bg-emerald-900 transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      <Edit3 className="h-4 w-4" />
                      <span>তথ্য পরিবর্তন (Edit) করুন</span>
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => handleDeleteEmployee(selectedEmployee.id, selectedEmployee.name)}
                      className="px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-700 font-bold text-xs rounded-xl border border-red-200 transition-colors flex items-center gap-1"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span>মুছুন</span>
                    </button>
                  </div>

                </div>
              ) : (
                // --- EDIT MODE FORM ---
                <form onSubmit={handleUpdateEmployee} className="space-y-6 text-slate-800">
                  
                  {/* Name, Birth, Blood, Phone, NID */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div className="space-y-1">
                      <label className="font-bold text-slate-700">কর্মচারীর নাম (বাংলায়)</label>
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        placeholder="এখানে নাম লিখুন"
                        className="block w-full px-3 py-2 border border-slate-250 rounded-xl text-xs font-bold bg-gray-50 focus:bg-white text-slate-850"
                        required
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-slate-700">কর্মচারীর পদ</label>
                      <input
                        type="text"
                        value={editDesignation}
                        onChange={(e) => setEditDesignation(e.target.value)}
                        placeholder="এখানে কর্মচারীর পদ লিখুন"
                        className="block w-full px-3 py-2 border border-slate-250 rounded-xl text-xs font-bold bg-gray-50 focus:bg-white text-slate-850"
                        required
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-slate-700">যোগদানের তারিখ</label>
                      <input
                        type="date"
                        value={editJoiningDate}
                        onChange={(e) => setEditJoiningDate(e.target.value)}
                        className="block w-full px-3 py-2 border border-slate-250 rounded-xl text-xs font-bold bg-gray-50 focus:bg-white text-slate-850"
                        required
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-slate-700">বাবার নাম</label>
                      <input
                        type="text"
                        value={editFatherName}
                        onChange={(e) => setEditFatherName(e.target.value)}
                        placeholder="এখানে বাবার নাম লিখুন"
                        className="block w-full px-3 py-2 border border-slate-250 rounded-xl text-xs font-bold bg-gray-50 focus:bg-white text-slate-850"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-slate-700">মায়ের নাম</label>
                      <input
                        type="text"
                        value={editMotherName}
                        onChange={(e) => setEditMotherName(e.target.value)}
                        placeholder="এখানে মায়ের নাম লিখুন"
                        className="block w-full px-3 py-2 border border-slate-250 rounded-xl text-xs font-bold bg-gray-50 focus:bg-white text-slate-850"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-slate-700">কন্টাক্ট নাম্বার</label>
                      <input
                        type="text"
                        value={editPhone}
                        onChange={(e) => setEditPhone(e.target.value)}
                        placeholder="এখানে কন্টাক্ট নাম্বার লিখুন"
                        className="block w-full px-3 py-2 border border-slate-250 rounded-xl text-xs font-bold font-mono bg-gray-50 focus:bg-white text-slate-850"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-slate-700">এনআইডি নাম্বার</label>
                      <input
                        type="text"
                        value={editNid}
                        onChange={(e) => setEditNid(e.target.value)}
                        placeholder="এখানে এনআইডি নাম্বার লিখুন"
                        className="block w-full px-3 py-2 border border-slate-250 rounded-xl text-xs font-bold font-mono bg-gray-50 focus:bg-white text-slate-850"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-slate-700">জন্মসাল</label>
                      <input
                        type="number"
                        value={editBirthYear}
                        onChange={(e) => setEditBirthYear(e.target.value)}
                        placeholder="এখানে জন্মসাল লিখুন"
                        className="block w-full px-3 py-2 border border-slate-250 rounded-xl text-xs font-bold font-mono bg-gray-50 focus:bg-white text-slate-850"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-slate-700">রক্তের গ্রুপ</label>
                      <input
                        type="text"
                        value={editBloodGroup}
                        onChange={(e) => setEditBloodGroup(e.target.value)}
                        placeholder="এখানে রক্তের গ্রুপ লিখুন"
                        className="block w-full px-3 py-2 border border-slate-250 rounded-xl text-xs font-bold bg-gray-50 focus:bg-white text-slate-850"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-slate-700">শিক্ষাগত যোগ্যতা</label>
                      <input
                        type="text"
                        value={editEducation}
                        onChange={(e) => setEditEducation(e.target.value)}
                        placeholder="এখানে শিক্ষাগত যোগ্যতা লিখুন"
                        className="block w-full px-3 py-2 border border-slate-250 rounded-xl text-xs font-bold bg-gray-50 focus:bg-white text-slate-850"
                      />
                    </div>
                  </div>

                  {/* Addresses */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div className="space-y-1">
                      <label className="font-bold text-slate-700">বর্তমান ঠিকানা</label>
                      <textarea
                        value={editPresentAddress}
                        onChange={(e) => setEditPresentAddress(e.target.value)}
                        placeholder="এখানে বর্তমান ঠিকানা লিখুন"
                        rows={2}
                        className="block w-full px-3 py-2 border border-slate-250 rounded-xl text-xs font-bold resize-none bg-gray-50 focus:bg-white text-slate-850"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-slate-700">স্থায়ী ঠিকানা</label>
                      <textarea
                        value={editPermanentAddress}
                        onChange={(e) => setEditPermanentAddress(e.target.value)}
                        placeholder="এখানে স্থায়ী ঠিকানা লিখুন"
                        rows={2}
                        className="block w-full px-3 py-2 border border-slate-250 rounded-xl text-xs font-bold resize-none bg-gray-50 focus:bg-white text-slate-850"
                      />
                    </div>
                  </div>

                  {/* Edit Files Upload */}
                  <div className="border-t border-slate-100 pt-5 space-y-4">
                    <h5 className="font-bold text-xs text-slate-800">ছবি পরিবর্তন করুন (স্বয়ংক্রিয় ইমেজ কম্প্রেশন ও ImgBB ক্লাউড হোস্টিং)</h5>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      
                      {/* Photo */}
                      <div className="p-3 border border-slate-200 rounded-xl flex flex-col items-center justify-between space-y-2 bg-slate-50/50">
                        <span className="text-[10px] font-bold text-slate-600">প্রোফাইল ছবি</span>
                        {isEditingUploadingPhoto ? (
                          <div className="h-12 w-12 flex items-center justify-center">
                            <Loader2 className="h-5 w-5 text-emerald-800 animate-spin" />
                          </div>
                        ) : editPhoto ? (
                          <img src={editPhoto} alt="Edit profile" className="h-12 w-12 rounded-full object-cover border" />
                        ) : (
                          <div className="h-12 w-12 rounded-full bg-slate-100 border flex items-center justify-center text-slate-300">
                            <User className="h-6 w-6" />
                          </div>
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          ref={editPhotoInputRef}
                          onChange={(e) => handleFileUpload(e, setEditPhoto, setIsEditingUploadingPhoto)}
                          className="hidden"
                        />
                        <button
                          type="button"
                          onClick={() => editPhotoInputRef.current?.click()}
                          disabled={isEditingUploadingPhoto}
                          className="px-2 py-1 bg-white border rounded text-[9px] font-bold text-slate-750 w-full hover:bg-slate-50"
                        >
                          ছবি পরিবর্তন
                        </button>
                      </div>

                      {/* NID Front */}
                      <div className="p-3 border border-slate-200 rounded-xl flex flex-col items-center justify-between space-y-2 bg-slate-50/50">
                        <span className="text-[10px] font-bold text-slate-600">এনআইডি সামনের অংশ</span>
                        {isEditingUploadingNidFront ? (
                          <div className="h-8 w-14 flex items-center justify-center">
                            <Loader2 className="h-5 w-5 text-emerald-800 animate-spin" />
                          </div>
                        ) : editNidFront ? (
                          <img src={editNidFront} alt="Edit NID Front" className="h-8 w-14 object-cover rounded border" />
                        ) : (
                          <div className="h-8 w-14 bg-slate-100 border flex items-center justify-center text-slate-350 text-[8px] font-bold">
                            NID Front
                          </div>
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          ref={editNidFrontInputRef}
                          onChange={(e) => handleFileUpload(e, setEditNidFront, setIsEditingUploadingNidFront)}
                          className="hidden"
                        />
                        <button
                          type="button"
                          onClick={() => editNidFrontInputRef.current?.click()}
                          disabled={isEditingUploadingNidFront}
                          className="px-2 py-1 bg-white border rounded text-[9px] font-bold text-slate-750 w-full hover:bg-slate-50"
                        >
                          ফ্রন্ট পরিবর্তন
                        </button>
                      </div>

                      {/* NID Back */}
                      <div className="p-3 border border-slate-200 rounded-xl flex flex-col items-center justify-between space-y-2 bg-slate-50/50">
                        <span className="text-[10px] font-bold text-slate-600">এনআইডি পিছনের অংশ</span>
                        {isEditingUploadingNidBack ? (
                          <div className="h-8 w-14 flex items-center justify-center">
                            <Loader2 className="h-5 w-5 text-emerald-800 animate-spin" />
                          </div>
                        ) : editNidBack ? (
                          <img src={editNidBack} alt="Edit NID Back" className="h-8 w-14 object-cover rounded border" />
                        ) : (
                          <div className="h-8 w-14 bg-slate-100 border flex items-center justify-center text-slate-350 text-[8px] font-bold">
                            NID Back
                          </div>
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          ref={editNidBackInputRef}
                          onChange={(e) => handleFileUpload(e, setEditNidBack, setIsEditingUploadingNidBack)}
                          className="hidden"
                        />
                        <button
                          type="button"
                          onClick={() => editNidBackInputRef.current?.click()}
                          disabled={isEditingUploadingNidBack}
                          className="px-2 py-1 bg-white border rounded text-[9px] font-bold text-slate-750 w-full hover:bg-slate-50"
                        >
                          ব্যাক পরিবর্তন
                        </button>
                      </div>

                    </div>
                  </div>

                  {/* Edit Actions */}
                  <div className="flex items-center gap-3 border-t border-slate-100 pt-5">
                    <button
                      type="submit"
                      disabled={isSaving || isEditingUploadingPhoto || isEditingUploadingNidFront || isEditingUploadingNidBack}
                      className="flex-1 py-2.5 bg-emerald-800 text-white font-bold text-xs rounded-xl hover:bg-emerald-900 transition-colors flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50"
                    >
                      <Save className="h-4 w-4 text-amber-400" />
                      <span>{isSaving ? "সংরক্ষণ হচ্ছে..." : "পরিবর্তনসমূহ সেভ করুন"}</span>
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => setIsEditMode(false)}
                      className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 transition-colors flex items-center gap-1"
                    >
                      <span>বাতিল করুন</span>
                    </button>
                  </div>

                </form>
              )}

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
