import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "./firebase";

/**
 * Checks for duplicate phone numbers across multiple collections.
 * returns null if unique, or the duplicate info if found.
 */
export const checkDuplicatePhoneNumberGlobal = async (phoneNumber: string, currentDocId?: string) => {
  if (!phoneNumber || phoneNumber.length < 11) return null;
  
  const collections = ["teachers", "students", "admins", "admissions"];
  for (const coll of collections) {
    const q = query(collection(db, coll), where("phone", "==", phoneNumber));
    const snap = await getDocs(q);
    if (!snap.empty) {
      const doc = snap.docs[0];
      if (currentDocId && doc.id === currentDocId) continue;
      
      const data = doc.data();
      return { 
        name: data.name || data.studentNameBn || data.student_name || data.applicantName || "অজ্ঞাত", 
        id: doc.id,
        collection: coll 
      };
    }
  }
  return null;
};

/**
 * Checks for unique login identifiers (ID/Phone/Email) across all user collections.
 * returns null if unique, or the duplicate info if found.
 */
export const checkUniqueLoginIdGlobal = async (loginId: string, currentDocId?: string) => {
  if (!loginId) return null;
  const normalizedId = loginId.trim().toLowerCase();
  
  const collections = ["teachers", "students", "admins"];
  for (const coll of collections) {
    // Check loginId
    const q1 = query(collection(db, coll), where("loginId", "==", normalizedId));
    const snap1 = await getDocs(q1);
    if (!snap1.empty) {
      const doc = snap1.docs[0];
      if (currentDocId && doc.id === currentDocId) continue;
      const data = doc.data();
      return { name: data.name || data.studentNameBn || "অজ্ঞাত", collection: coll };
    }
    
    // Check phone
    const q2 = query(collection(db, coll), where("phone", "==", normalizedId));
    const snap2 = await getDocs(q2);
    if (!snap2.empty) {
      const doc = snap2.docs[0];
      if (currentDocId && doc.id === currentDocId) continue;
      const data = doc.data();
      return { name: data.name || data.studentNameBn || "অজ্ঞাত", collection: coll };
    }

    // Check email
    const q3 = query(collection(db, coll), where("email", "==", normalizedId));
    const snap3 = await getDocs(q3);
    if (!snap3.empty) {
      const doc = snap3.docs[0];
      if (currentDocId && doc.id === currentDocId) continue;
      const data = doc.data();
      return { name: data.name || data.studentNameBn || "অজ্ঞাত", collection: coll };
    }
  }
  return null;
};

/**
 * Checks for duplicate emails.
 */
export const checkDuplicateEmailGlobal = async (email: string, currentDocId?: string) => {
  if (!email || !email.includes("@")) return null;
  const normalizedEmail = email.trim().toLowerCase();
  
  const collections = ["teachers", "students", "admins", "admissions"];
  for (const coll of collections) {
    const q = query(collection(db, coll), where("email", "==", normalizedEmail));
    const snap = await getDocs(q);
    if (!snap.empty) {
      const doc = snap.docs[0];
      if (currentDocId && doc.id === currentDocId) continue;
      
      const data = doc.data();
      return { 
        name: data.name || data.studentNameBn || data.student_name || data.applicantName || "অজ্ঞাত", 
        id: doc.id,
        collection: coll 
      };
    }
  }
  return null;
};
