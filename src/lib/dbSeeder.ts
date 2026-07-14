import { collection, getDocs, doc, setDoc, writeBatch } from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "./firebase";

export async function seedDatabaseIfEmpty() {
  // Ensure Sodosso Form Settings are seeded
  try {
    const sodossoFormCol = collection(db, "sodosso_form_settings");
    const sodossoSnap = await getDocs(sodossoFormCol);
    if (sodossoSnap.empty) {
      await setDoc(doc(db, "sodosso_form_settings", "main"), {
        noticeText: "সদস্য ফরম গ্রহণ ও নিবন্ধন সংক্রান্ত গুরুত্বপূর্ণ নির্দেশনা: সম্মানিত শুভাকাঙ্ক্ষী ও সুধী মহল, সুফিয়া নূরীয়া দাখিল মাদ্রাসার সদস্য ফরম গ্রহণ ও নিবন্ধন কার্যক্রম শুরু হয়েছে। আগ্রহী ব্যক্তিবর্গকে মাদ্রাসার কার্যালয় থেকে অথবা অনলাইন থেকে ফরম সংগ্রহ করে আগামী ৩০ই আগস্ট ২০২৬ ইংরেজি তারিখের মধ্যে প্রয়োজনীয় কাগজপত্রাদিসহ আবেদনপত্র জমা দেওয়ার জন্য বিশেষভাবে অনুরোধ করা হলো। বিস্তারিত তথ্যের জন্য নিম্নোক্ত কর্মকর্তাদের সাথে যোগাযোগ করুন।",
        contacts: [
          { name: "মাওলানা মোহাম্মদ আবু বকর", designation: "সুপার (অধ্যক্ষ)", phone: "০১৭১১-১২৩৪৫৬" },
          { name: "হাফেজ মাওলানা আব্দুর রহমান", designation: "সহকারী সুপার", phone: "০১৭২২-২৩৪৫৬৭" }
        ]
      });
      console.log("Sodosso Form Settings successfully seeded!");
    }
  } catch (error) {
    console.error("Error seeding Sodosso Form Settings:", error);
  }

  // Ensure Contact Settings are seeded
  try {
    const contactDocRef = doc(db, "settings", "contact");
    const contactSnap = await getDocs(collection(db, "settings"));
    const contactExists = contactSnap.docs.some(d => d.id === "contact");
    if (!contactExists) {
      await setDoc(contactDocRef, {
        address: "নতুন পল্লান পাড়া, ৪নং ওয়ার্ড, টেকনাফ, কক্সবাজার",
        officePhone: "01811111111",
        principalPhone: "01822222222",
        email: "sufianooria@gmail.com",
        facebook: "",
        linkedin: "",
        telegram: "",
        whatsapp: "",
        updatedAt: new Date().toISOString()
      });
      console.log("Contact settings seeded!");
    }
  } catch (err) {
    console.error("Error seeding contact settings:", err);
  }

  // Ensure Students are seeded
  try {
    const studentsCol = collection(db, "students");
    const studentsSnap = await getDocs(studentsCol);
    if (studentsSnap.empty) {
      const defaultStudents = [
        // Shishu
        { name: "মোহাম্মদ আলভী", className: "শিশু শ্রেণী", roll: "০১", createdAt: new Date().toISOString() },
        { name: "মালিহা তাসনিম", className: "শিশু শ্রেণী", roll: "০২", createdAt: new Date().toISOString() },
        // 1st
        { name: "ইমরান খান", className: "১ম শ্রেণী", roll: "০১", createdAt: new Date().toISOString() },
        { name: "ফাতিমা আক্তার", className: "১ম শ্রেণী", roll: "০২", createdAt: new Date().toISOString() },
        // 2nd
        { name: "আব্দুল বারী", className: "২য় শ্রেণী", roll: "০১", createdAt: new Date().toISOString() },
        { name: "নূরিয়া সুলতানা", className: "২য় শ্রেণী", roll: "০২", createdAt: new Date().toISOString() },
        // 3rd
        { name: "মাহমুদুল হাসান", className: "৩য় শ্রেণী", roll: "০১", createdAt: new Date().toISOString() },
        { name: "হাফসা বিনতে মুয়াজ", className: "৩য় শ্রেণী", roll: "০২", createdAt: new Date().toISOString() },
        // 4th
        { name: "আহসান হাবীব", className: "৪র্থ শ্রেণী", roll: "০১", createdAt: new Date().toISOString() },
        { name: "জয়নব খাতুন", className: "৪র্থ শ্রেণী", roll: "০২", createdAt: new Date().toISOString() },
        // 5th
        { name: "তাসনিম জাহান", className: "৫ম শ্রেণী", roll: "০১", createdAt: new Date().toISOString() },
        { name: "মোঃ জুনাইদ", className: "৫ম শ্রেণী", roll: "০২", createdAt: new Date().toISOString() },
        // 6th
        { name: "মোহাম্মদ আবরার", className: "৬ষ্ঠ শ্রেণী", roll: "১০১", createdAt: new Date().toISOString() },
        { name: "আহমেদ ফয়সাল", className: "৬ষ্ঠ শ্রেণী", roll: "১০২", createdAt: new Date().toISOString() },
        { name: "উম্মে সালমা", className: "৬ষ্ঠ শ্রেণী", roll: "১০৩", createdAt: new Date().toISOString() },
        { name: "মোসাম্মৎ ফাতেমা", className: "৬ষ্ঠ শ্রেণী", roll: "১০৪", createdAt: new Date().toISOString() },
        { name: "আব্দুল্লাহ আল মাসুম", className: "৬ষ্ঠ শ্রেণী", roll: "১০৫", createdAt: new Date().toISOString() },
        // 7th
        { name: "নূর মোহাম্মদ", className: "৭ম শ্রেণী", roll: "২০১", createdAt: new Date().toISOString() },
        { name: "তানজিলা আক্তার", className: "৭ম শ্রেণী", roll: "২০২", createdAt: new Date().toISOString() },
        { name: "আরিফ বিল্লাহ", className: "৭ম শ্রেণী", roll: "২০৩", createdAt: new Date().toISOString() },
        { name: "জুবায়ের হোসেন", className: "৭ম শ্রেণী", roll: "২০৪", createdAt: new Date().toISOString() },
        // 8th
        { name: "মোহাম্মদ রাফি", className: "৮ম শ্রেণী", roll: "৩০১", createdAt: new Date().toISOString() },
        { name: "সাদিয়া সুলতানা", className: "৮ম শ্রেণী", roll: "৩০২", createdAt: new Date().toISOString() },
        { name: "কামরুল হাসান", className: "৮ম শ্রেণী", roll: "৩০৩", createdAt: new Date().toISOString() },
        { name: "মাইশা আক্তার", className: "৮ম শ্রেণী", roll: "৩০৪", createdAt: new Date().toISOString() },
        { name: "সাকিব আল হাসান", className: "৮ম শ্রেণী", roll: "৩০৫", createdAt: new Date().toISOString() },
        { name: "রাইহান চৌধুরী", className: "৮ম শ্রেণী", roll: "৩০৬", createdAt: new Date().toISOString() },
        // 9th
        { name: "মোঃ আসিফ ইকবাল", className: "৯ম শ্রেণী", roll: "৪০১", createdAt: new Date().toISOString() },
        { name: "নুসরাত জাহান", className: "৯ম শ্রেণী", roll: "৪০২", createdAt: new Date().toISOString() },
        { name: "মেহেদী হাসান", className: "৯ম শ্রেণী", roll: "৪০৩", createdAt: new Date().toISOString() },
        { name: "রোকসানা আক্তার", className: "৯ম শ্রেণী", roll: "৪০৪", createdAt: new Date().toISOString() },
        { name: "তৌহিদুল ইসলাম", className: "৯ম শ্রেণী", roll: "৪০৫", createdAt: new Date().toISOString() },
        // 10th
        { name: "মোহাম্মদ আলী", className: "১০ম শ্রেণী", roll: "৫০১", createdAt: new Date().toISOString() },
        { name: "আব্দুল্লাহ আল নোমান", className: "১০ম শ্রেণী", roll: "৫০২", createdAt: new Date().toISOString() },
        { name: "আয়েশা সিদ্দিকা", className: "১০ম শ্রেণী", roll: "৫০৩", createdAt: new Date().toISOString() },
        { name: "হাসান মাহমুদ", className: "১০ম শ্রেণী", roll: "৫০৪", createdAt: new Date().toISOString() },
        { name: "খাদিজা আক্তার", className: "১০ম শ্রেণী", roll: "৫০৫", createdAt: new Date().toISOString() },
        { name: "মোঃ ইমাম হোসেন", className: "১০ম শ্রেণী", roll: "৫০৬", createdAt: new Date().toISOString() },
        { name: "ফারিহা ইসলাম", className: "১০ম শ্রেণী", roll: "৫০৭", createdAt: new Date().toISOString() },
        { name: "মুস্তাকিম বিল্লাহ", className: "১০ম শ্রেণী", roll: "৫০৮", createdAt: new Date().toISOString() },
        // Hifz
        { name: "মোহাম্মদ ইয়াসিন", className: "হিফজ বিভাগ", roll: "০১", createdAt: new Date().toISOString() },
        { name: "আব্দুর রহমান", className: "হিফজ বিভাগ", roll: "০২", createdAt: new Date().toISOString() },
        { name: "মোঃ সালমান", className: "হিফজ বিভাগ", roll: "০৩", createdAt: new Date().toISOString() },
        { name: "আহমেদ উল্লাহ", className: "হিফজ বিভাগ", roll: "০৪", createdAt: new Date().toISOString() }
      ];
      for (let i = 0; i < defaultStudents.length; i++) {
        await setDoc(doc(db, "students", `std_${i + 1}`), defaultStudents[i]);
      }
      console.log("Students successfully seeded!");
    }
  } catch (error) {
    console.error("Error seeding Students:", error);
  }

  let snapshot;
  try {
    // Check if teachers collection is empty
    const teachersCol = collection(db, "teachers");
    snapshot = await getDocs(teachersCol);
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, "teachers");
    return;
  }
  
  if (!snapshot.empty) {
    console.log("Database already seeded!");
    return;
  }

  try {
    console.log("Seeding database with default data...");
    const batch = writeBatch(db);

    // 1. Teachers Data
    const teachers = [
      {
        id: "t1",
        uid: "teacher1_uid",
        name: "মাওলানা মোহাম্মদ আবু বকর",
        designation: "সুপার (অধ্যক্ষ)",
        photoUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80",
        phone: "০১৭১১-১২৩৪৫৬",
        email: "super@sufianooria.edu.bd"
      },
      {
        id: "t2",
        uid: "teacher2_uid",
        name: "হাফেজ মাওলানা আব্দুর রহমান",
        designation: "সহকারী সুপার",
        photoUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=300&q=80",
        phone: "০১৭২২-২৩৪৫৬৭",
        email: "teacher@madrasah.com" // matched with login teacher credentials for easy testing
      },
      {
        id: "t3",
        uid: "teacher3_uid",
        name: "মোহাম্মদ রফিকুল ইসলাম",
        designation: "সিনিয়র সহকারী শিক্ষক (গণিত)",
        photoUrl: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=300&q=80",
        phone: "০১৭৩৩-৩৪৫৬৭৮",
        email: "rafiq@sufianooria.edu.bd"
      },
      {
        id: "t4",
        uid: "teacher4_uid",
        name: "ফাতেমা খাতুন",
        designation: "সহকারী শিক্ষিকা (ইংরেজি)",
        photoUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80",
        phone: "০১৭৪৪-৪৫৬৭৮৯",
        email: "fatema@sufianooria.edu.bd"
      },
      {
        id: "t5",
        uid: "teacher5_uid",
        name: "হাফেজ ক্বারী জুবায়ের আহমেদ",
        designation: "ক্বারী শিক্ষক (তাজবীদ)",
        photoUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80",
        phone: "০১৭৫৫-৫৬৭৮৯০",
        email: "zubayer@sufianooria.edu.bd"
      }
    ];

    for (const teacher of teachers) {
      const docRef = doc(collection(db, "teachers"), teacher.id);
      batch.set(docRef, teacher);
    }

    // 2. Success Stories Data
    const successStories = [
      {
        id: "s1",
        student_name: "মোহাম্মদ মিনহাজুল ইসলাম",
        achievement: "দাখিল ২০২৫ পরীক্ষায় জিপিএ ৫.০০ এবং বোর্ড বৃত্তি লাভ করেছেন।",
        imageUrl: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=300&q=80",
        year: 2025
      },
      {
        id: "s2",
        student_name: "সায়েদা জান্নাতুল ফেরদৌস",
        achievement: "দাখিল ২০২৫ পরীক্ষায় জিপিএ ৫.০০ অর্জন এবং উপজেলায় প্রথম স্থান অর্জন করেছেন।",
        imageUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80",
        year: 2025
      },
      {
        id: "s3",
        student_name: "তারিকুল ইসলাম",
        achievement: "দাখিল ২০২৪ পরীক্ষায় জিপিএ ৫.০০ পেয়েছেন এবং বর্তমানে বিজ্ঞান বিভাগে অধ্যয়নরত।",
        imageUrl: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=300&q=80",
        year: 2024
      },
      {
        id: "s4",
        student_name: "মোহাম্মদ সালমান",
        achievement: "জাতীয় হিফজুল কোরআন প্রতিযোগিতায় সমগ্র বাংলাদেশে ১ম স্থান অর্জন করে মাদ্রাসার গৌরব বৃদ্ধি করেছেন।",
        imageUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=300&q=80",
        year: 2024
      },
      {
        id: "s5",
        student_name: "উম্মে হাবিবা",
        achievement: "দাখিল ২০২৪ পরীক্ষায় জিপিএ ৫.০০ লাভ করেছেন এবং ইসলামিক কুইজ প্রতিযোগিতায় জেলায় প্রথম হয়েছেন।",
        imageUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=300&q=80",
        year: 2024
      },
      {
        id: "s6",
        student_name: "মোঃ আবু রায়হান",
        achievement: "দাখিল পরীক্ষায় অসাধারণ সাফল্যের পর মিসরের বিখ্যাত আল-আজহার বিশ্ববিদ্যালয় থেকে উচ্চশিক্ষার স্কলারশিপ পেয়েছেন।",
        imageUrl: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=300&q=80",
        year: 2025
      }
    ];

    for (const story of successStories) {
      const docRef = doc(collection(db, "success_stories"), story.id);
      batch.set(docRef, story);
    }

    // 3. Committee Members and Speeches
    const committee = [
      {
        id: "c1",
        name: "আলহাজ্ব ইঞ্জিনিয়ার শামসুল আলম",
        role: "সভাপতি (গভর্নিং বডি)",
        speech: "সুফিয়া নূরীয়া দাখিল মাদ্রাসা এই অঞ্চলের দ্বীনি ও আধুনিক শিক্ষার এক অনন্য বাতিঘর। আমরা শিক্ষার গুণগত মান উন্নয়ন এবং শিক্ষার্থীদের নৈতিক চরিত্র গঠনের উপর সর্বোচ্চ গুরুত্ব দিচ্ছি। আমাদের লক্ষ্য এমন এক প্রজন্ম তৈরি করা, যারা আধুনিক জ্ঞান-বিজ্ঞানে সমৃদ্ধ হওয়ার পাশাপাশি খাঁটি দেশপ্রেমিক ও দ্বীনদার নাগরিক হিসেবে গড়ে উঠবে। মাদ্রাসার উন্নয়ন কর্মকাণ্ডে আপনাদের সবার আন্তরিক সহযোগিতা আমাদের একান্ত কাম্য।",
        imageUrl: "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=300&q=80",
        rank: 1
      },
      {
        id: "c2",
        name: "মাওলানা মোহাম্মদ আবু বকর",
        role: "সুপার (সদস্য সচিব)",
        speech: "আসসালামু আলাইকুম ওয়া রাহমাতুল্লাহ। সুফিয়া নূরীয়া দাখিল মাদ্রাসার পক্ষ থেকে শিক্ষার্থী, অভিভাবক এবং শুভাকাঙ্ক্ষীদের জানাই আন্তরিক শুভেচ্ছা। আমরা সাধারণ শিক্ষার পাশাপাশি কোরআন, হাদিস এবং ইসলামি সংস্কৃতির আলো ছড়াচ্ছি। আমাদের প্রতিটি শিক্ষক ডেডিকেটেড এবং ছাত্রদের উজ্জ্বল ভবিষ্যৎ গড়তে অবিরাম পরিশ্রম করছেন। আমাদের অনলাইন ইকোসিস্টেম চালুর মাধ্যমে ডিজিটাল মাদ্রাসা বিনির্মাণে আমরা আরেক ধাপ এগিয়ে গেলাম।",
        imageUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80",
        rank: 2
      },
      {
        id: "c3",
        name: "ডা. আতিকুর রহমান",
        role: "দাতা সদস্য",
        speech: "",
        imageUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=300&q=80",
        rank: 3
      },
      {
        id: "c4",
        name: "আলহাজ্ব মোহাম্মদ নূরুল ইসলাম",
        role: "অভিভাবক সদস্য",
        speech: "",
        imageUrl: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=300&q=80",
        rank: 4
      }
    ];

    for (const member of committee) {
      const docRef = doc(collection(db, "committee"), member.id);
      batch.set(docRef, member);
    }

    // 4. Honored Persons Data
    const honoredPersons = [
      {
        id: "hp1",
        name: "হযরত মাওলানা সুফি নায়েব আলী সাহেব (র.)",
        birth_death: "১৯১০ - ১৯৮৫",
        contribution: "মাদ্রাসার প্রতিষ্ঠাতা ও স্বপ্নদ্রষ্টা। ১৯৪০ সালে এক ছনের ছোট ঘর দিয়ে এই দ্বীনি প্রতিষ্ঠানের গোড়াপত্তন করেন এবং নিজের প্রায় ৩ একর জমি মাদ্রাসার নামে উৎসর্গ করেন। আমৃত্যু মাদ্রাসার সার্বিক উন্নয়নে নিজের জীবন বিলিয়ে দিয়েছেন।",
        imageUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80"
      },
      {
        id: "hp2",
        name: "আলহাজ্ব নইমুদ্দিন আহমেদ",
        birth_death: "১৯২৫ - ২০০২",
        contribution: "মাদ্রাসার অন্যতম প্রধান ভূমিদাতা ও প্রথম পরিচালনা পর্ষদের সেক্রেটারি। মাদ্রাসার একাডেমিক ভবন নির্মাণে তৎকালীন সময়ে বিশাল আর্থিক অনুদান দিয়ে চিরস্মরণীয় হয়ে আছেন।",
        imageUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80"
      },
      {
        id: "hp3",
        name: "মাওলানা ক্বারী আমিনুল ইসলাম",
        birth_death: "১৯৩৫ - ২০১২",
        contribution: "মাদ্রাসার প্রথম প্রধান শিক্ষক (সুপার)। দীর্ঘ ৩৫ বছর অত্যন্ত নিষ্ঠা ও সুনামের সাথে মাদ্রাসার দায়িত্ব পালন করেছেন। তাঁর হাত ধরেই হাজার হাজার হাফেজ এবং আলেম তৈরি হয়েছে যারা দেশ-বিদেশে সুনামের সাথে কাজ করছেন।",
        imageUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=300&q=80"
      }
    ];

    for (const person of honoredPersons) {
      const docRef = doc(collection(db, "honored_persons"), person.id);
      batch.set(docRef, person);
    }

    // 5. Results Data (Searchable)
    const results = [
      {
        id: "res1",
        roll: "১০০১",
        reg: "২০২৬০১",
        studentName: "মোহাম্মদ আলী",
        className: "দাখিল ১০ম শ্রেণী",
        year: "২০২৬",
        gpa: "৫.০০",
        grade: "A+",
        subjects: [
          { name: "কুরআন মাজীদ ও তাজবীদ", marks: 95, grade: "A+" },
          { name: "হাদীস শরীফ", marks: 88, grade: "A+" },
          { name: "আরবী প্রথম পত্র", marks: 92, grade: "A+" },
          { name: "আরবী দ্বিতীয় পত্র", marks: 85, grade: "A+" },
          { name: "বাংলা", marks: 80, grade: "A+" },
          { name: "ইংরেজি", marks: 82, grade: "A+" },
          { name: "গণিত", marks: 98, grade: "A+" }
        ]
      },
      {
        id: "res2",
        roll: "১০০২",
        reg: "২০২৬০২",
        studentName: "আব্দুল্লাহ আল নোমান",
        className: "দাখিল ১০ম শ্রেণী",
        year: "২০২৬",
        gpa: "৪.৮৫",
        grade: "A",
        subjects: [
          { name: "কুরআন মাজীদ ও তাজবীদ", marks: 90, grade: "A+" },
          { name: "হাদীস শরীফ", marks: 82, grade: "A+" },
          { name: "আরবী প্রথম পত্র", marks: 78, grade: "A" },
          { name: "আরবী দ্বিতীয় পত্র", marks: 74, grade: "A-" },
          { name: "বাংলা", marks: 85, grade: "A+" },
          { name: "ইংরেজি", marks: 80, grade: "A+" },
          { name: "গণিত", marks: 92, grade: "A+" }
        ]
      },
      {
        id: "res3",
        roll: "১০০৩",
        reg: "২০২৬০৩",
        studentName: "আয়েশা সিদ্দিকা",
        className: "দাখিল ১০ম শ্রেণী",
        year: "২০২৬",
        gpa: "৫.০০",
        grade: "A+",
        subjects: [
          { name: "কুরআন মাজীদ ও তাজবীদ", marks: 97, grade: "A+" },
          { name: "হাদীস শরীফ", marks: 91, grade: "A+" },
          { name: "আরবী প্রথম পত্র", marks: 90, grade: "A+" },
          { name: "আরবী দ্বিতীয় পত্র", marks: 88, grade: "A+" },
          { name: "বাংলা", marks: 84, grade: "A+" },
          { name: "ইংরেজি", marks: 86, grade: "A+" },
          { name: "গণিত", marks: 95, grade: "A+" }
        ]
      }
    ];

    for (const res of results) {
      const docRef = doc(collection(db, "results"), res.id);
      batch.set(docRef, res);
    }

    // 6. Routines Data
    const routines = [
      {
        id: "r1",
        type: "class",
        className: "১০ম শ্রেণী",
        subject: "কুরআন মাজীদ",
        time: "০৯:০০ AM - ০৯:৪৫ AM",
        dayOrDate: "রবিবার",
        room: "১০১",
        teacherName: "মাওলানা মোহাম্মদ আবু বকর"
      },
      {
        id: "r2",
        type: "class",
        className: "১০ম শ্রেণী",
        subject: "হাদীস শরীফ",
        time: "০৯:৪৫ AM - ১০:৩০ AM",
        dayOrDate: "রবিবার",
        room: "১০১",
        teacherName: "হাফেজ মাওলানা আব্দুর রহমান"
      },
      {
        id: "r3",
        type: "class",
        className: "৯ম শ্রেণী",
        subject: "গণিত",
        time: "১০:৪৫ AM - ১১:৩০ AM",
        dayOrDate: "সোমবার",
        room: "১০২",
        teacherName: "মোহাম্মদ রফিকুল ইসলাম"
      },
      {
        id: "r4",
        type: "exam",
        className: "দাখিল নির্বাচনী পরীক্ষা ২০২৬",
        subject: "কুরআন মাজীদ ও তাজবীদ",
        time: "১০:০০ AM - ০১:০০ PM",
        dayOrDate: "২০২৬-১০-১৫",
        room: "পরীক্ষা হল - ১",
        teacherName: "সকল হল পরিদর্শক"
      },
      {
        id: "r5",
        type: "exam",
        className: "দাখিল নির্বাচনী পরীক্ষা ২০২৬",
        subject: "হাদীস শরীফ",
        time: "১০:০০ AM - ০১:০০ PM",
        dayOrDate: "২০২৬-১০-১৭",
        room: "পরীক্ষা হল - ১",
        teacherName: "সকল হল পরিদর্শক"
      }
    ];

    for (const rot of routines) {
      const docRef = doc(collection(db, "routines"), rot.id);
      batch.set(docRef, rot);
    }

    // 7. Seed sample Admission
    const admissions = [
      {
        id: "adm_1",
        student_name: "মোহাম্মদ হাসান আল-মাহমুদ",
        father_name: "মোঃ রফিকুল আলম",
        mother_name: "নাসরিন বেগম",
        class_name: "৬ষ্ঠ শ্রেণী",
        phone: "০১৭১১-২২৩৩৪৪",
        email: "hasan@gmail.com",
        payment_status: "Paid",
        date: "2026-07-05",
        status: "Approved"
      },
      {
        id: "adm_2",
        student_name: "তানিয়া আক্তার",
        father_name: "মোঃ মফিজুল ইসলাম",
        mother_name: "শাহানাজ বেগম",
        class_name: "৮ম শ্রেণী",
        phone: "০১৭১১-৫৫৬৬৭৭",
        email: "tania@gmail.com",
        payment_status: "Unpaid",
        date: "2026-07-06",
        status: "Pending"
      }
    ];

    for (const adm of admissions) {
      const docRef = doc(collection(db, "admissions"), adm.id);
      batch.set(docRef, adm);
    }

    try {
      await batch.commit();
      console.log("Database successfully seeded!");
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, "batch_seed");
    }
  } catch (error) {
    console.error("Error seeding database:", error);
  }
}
