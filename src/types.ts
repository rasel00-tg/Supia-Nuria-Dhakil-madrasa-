export interface Teacher {
  id: string;
  uid?: string;
  name: string;
  nameEn?: string;
  designation: string;
  photoUrl: string;
  phone: string;
  email?: string;
  whatsapp?: string;
  presentAddress?: string;
  permanentAddress?: string;
  wardNo?: string;
  thana?: string;
  district?: string;
  division?: string;
  nid?: string;
  birthYear?: string;
  religion?: string;
  nationality?: string;
  indexNumber?: string;
  department?: string;
  joiningDate?: string;
  createdAt?: any;

  // Guardian Info
  fatherName?: string;
  motherName?: string;
  fatherNid?: string;
  motherNid?: string;
  guardianPresentAddress?: string;
  guardianPermanentAddress?: string;
  guardianWardNo?: string;
  guardianThana?: string;
  guardianDistrict?: string;
  guardianDivision?: string;
  guardianReligion?: string;
  guardianNationality?: string;

  // Educational Qualifications
  qualifications?: {
    ssc?: Qualification;
    hsc?: Qualification;
    bachelor?: Qualification;
    masters?: Qualification;
    bed?: Qualification;
    med?: Qualification;
    others?: Qualification & { name?: string };
  };

  // Financial Info
  bankInfo?: {
    bankName: string;
    accountName: string;
    accountNo: string;
    branchName: string;
    routingNo?: string;
  };
  mobileBanking?: {
    serviceName: string;
    number: string;
  };

  // Institutional Info
  subject?: string;

  // Login Info
  loginId?: string;
  password?: string;
}

export interface Qualification {
  boardOrUniv: string;
  instituteName: string;
  departmentOrGroup: string;
  passingYear: string;
  result: string;
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

export interface Admin {
  id: string;
  name: string;
  fatherName?: string;
  motherName?: string;
  email: string;
  loginId: string;
  phone: string;
  address?: string;
  nid?: string;
  fatherNid?: string;
  motherNid?: string;
  password?: string;
  role: 'mother_admin' | 'super_admin' | 'assistant_admin';
  status: 'active' | 'suspended';
  expiryTimestamp?: string; // ISO string for assistant_admin
  createdAt?: any;
}

export interface AdminSystem {
  isSetupComplete: boolean;
}

