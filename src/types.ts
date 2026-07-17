export interface Teacher {
  id: string;
  name: string;
  designation: string;
  photoUrl: string;
  phone: string;
  email?: string;
}

export interface SuccessStory {
  id: string;
  student_name: string;
  achievement: string;
  imageUrl: string;
  year: number;
}

export interface CommitteeMember {
  id: string;
  name: string;
  role: string; // e.g. President, Supervisor (Super), Member
  speech?: string; // President and Super will have speeches
  imageUrl: string;
  rank: number; // for ordering
  joiningDate?: string;
  birthDate?: string;
  bloodGroup?: string;
  qualification?: string;
  phone?: string;
  email?: string;
  address?: string;
  facebookUrl?: string;
  whatsAppNum?: string;
  phoneNum?: string;
}

export interface HonoredPerson {
  id: string;
  name: string;
  birth_death: string; // e.g. "১৯৫০ - ২০২০"
  contribution: string;
  imageUrl: string;
}

export interface AdmissionForm {
  id: string;
  student_name: string;
  father_name: string;
  mother_name: string;
  class_name: string;
  phone: string;
  email: string;
  payment_status: "Paid" | "Unpaid";
  date: string;
  status: "Pending" | "Approved" | "Rejected";
}

export interface Routine {
  id: string;
  type: "class" | "exam";
  className: string;
  subject: string;
  time: string;
  dayOrDate: string; // "Sunday", "2026-07-15", etc.
  room: string;
  teacherName: string;
  isEdited?: boolean;
  editedAt?: string;
  totalMarks?: string;
  subjectCode?: string;
  examName?: string;
  guidelines?: string[];
  subjects?: {
    date: string;
    subject: string;
    time: string;
    totalMarks: string;
    subjectCode: string;
  }[];
}

export interface Result {
  id: string;
  studentId: string;
  studentName: string;
  department: string;
  branch: string;
  examType: string;
  year: string;
  gpa: string;
  grade: string;
  subjects: {
    name: string;
    marks: number;
    grade: string;
  }[];
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  formType?: "অভিযোগ" | "পরামর্শ";
  subject: string;
  message: string;
  date: string;
}

export interface Notice {
  id: string;
  title: string;
  description: string;
  timestamp: any; // Firestore Timestamp
  isEdited?: boolean;
}

export interface Hafiz {
  id: string;
  name: string;
  fatherName: string;
  address: string;
  photoUrl: string;
  createdAt?: any;
}

