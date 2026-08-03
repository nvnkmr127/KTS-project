// Comprehensive Mock Data and Queries for the School Management App

export interface KPIOverview {
  totalStudents: number;
  totalTeachers: number;
  attendanceRate: number;
  feeCollection: number;
  pendingFees: number;
  activeStaff: number;
  revenue: number;
}

export interface StudentProfile {
  id: string;
  name: string;
  rollNumber: string;
  className: string;
  avatar: string;
  bloodGroup: string;
  guardianName: string;
  guardianPhone: string;
  address: string;
}

export interface FeeItem {
  id: string;
  title: string;
  dueDate: string;
  amount: number;
  status: 'paid' | 'pending' | 'overdue';
  category: string;
}

export interface ExamRecord {
  id: string;
  subject: string;
  marksObtained: number;
  maxMarks: number;
  grade: string;
  examName: string;
  date: string;
  classAverage: number;
  rank: number;
}

export interface TimetableSlot {
  id: string;
  time: string;
  subject: string;
  teacher: string;
  room: string;
  day: string;
}

export interface BusRoute {
  id: string;
  routeName: string;
  busNumber: string;
  driverName: string;
  driverPhone: string;
  eta: string;
  currentLocation: { latitude: number; longitude: number };
  stops: { name: string; time: string; latitude: number; longitude: number }[];
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: 'teacher' | 'parent' | 'admin';
  text: string;
  timestamp: string;
  attachments?: { type: 'pdf' | 'image'; name: string; url: string }[];
}

export interface LeaveRequest {
  id: string;
  name: string;
  role: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  leaveType: 'Sick Leave' | 'Casual Leave' | 'Maternity Leave' | 'Earned Leave';
}

export interface StudyMaterial {
  id: string;
  title: string;
  subject: string;
  type: 'pdf' | 'video' | 'doc';
  size: string;
  uploadDate: string;
  url: string;
}

export interface HomeworkTask {
  id: string;
  title: string;
  subject: string;
  dueDate: string;
  description: string;
  teacherName: string;
  status: 'pending' | 'submitted' | 'graded';
  grade?: string;
  feedback?: string;
  attachment?: string;
}

export const mockKPIs: KPIOverview = {
  totalStudents: 1420,
  totalTeachers: 85,
  attendanceRate: 94.6,
  feeCollection: 320000,
  pendingFees: 45000,
  activeStaff: 124,
  revenue: 425000,
};

export const mockStudents: StudentProfile[] = [
  {
    id: "stud_001",
    name: "Ethan Warren",
    rollNumber: "240901",
    className: "Grade 9-A",
    avatar: "https://images.unsplash.com/photo-1503919545889-aef636e10ad4?q=80&w=120",
    bloodGroup: "O+",
    guardianName: "Elizabeth Warren",
    guardianPhone: "+1 (555) 019-2834",
    address: "128 Oakridge Ave, Menlo Park, CA",
  },
  {
    id: "stud_002",
    name: "Lily Warren",
    rollNumber: "241203",
    className: "Grade 6-B",
    avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=120",
    bloodGroup: "AB+",
    guardianName: "Elizabeth Warren",
    guardianPhone: "+1 (555) 019-2834",
    address: "128 Oakridge Ave, Menlo Park, CA",
  }
];

export const mockFees: Record<string, FeeItem[]> = {
  stud_001: [
    { id: "fee_1", title: "Term 2 Tuition Fee", dueDate: "2026-06-30", amount: 1500, status: "pending", category: "Tuition" },
    { id: "fee_2", title: "Monthly Bus Transport - June", dueDate: "2026-06-15", amount: 120, status: "overdue", category: "Transport" },
    { id: "fee_3", title: "Annual Sports & Lab Fee", dueDate: "2026-05-10", amount: 350, status: "paid", category: "Extra-curricular" },
  ],
  stud_002: [
    { id: "fee_4", title: "Term 2 Tuition Fee", dueDate: "2026-06-30", amount: 1200, status: "pending", category: "Tuition" },
    { id: "fee_5", title: "Monthly Bus Transport - June", dueDate: "2026-06-15", amount: 120, status: "paid", category: "Transport" },
  ],
};

export const mockExams: Record<string, ExamRecord[]> = {
  stud_001: [
    { id: "ex_1", subject: "Advanced Mathematics", marksObtained: 92, maxMarks: 100, grade: "A", examName: "Midterm Exam", date: "2026-05-12", classAverage: 78, rank: 3 },
    { id: "ex_2", subject: "English Literature", marksObtained: 88, maxMarks: 100, grade: "B+", examName: "Midterm Exam", date: "2026-05-14", classAverage: 81, rank: 7 },
    { id: "ex_3", subject: "Physics", marksObtained: 95, maxMarks: 100, grade: "A+", examName: "Midterm Exam", date: "2026-05-15", classAverage: 74, rank: 1 },
    { id: "ex_4", subject: "History", marksObtained: 76, maxMarks: 100, grade: "C+", examName: "Midterm Exam", date: "2026-05-18", classAverage: 79, rank: 22 },
  ],
  stud_002: [
    { id: "ex_5", subject: "General Science", marksObtained: 89, maxMarks: 100, grade: "A-", examName: "Midterm Exam", date: "2026-05-12", classAverage: 80, rank: 5 },
    { id: "ex_6", subject: "Social Studies", marksObtained: 91, maxMarks: 100, grade: "A", examName: "Midterm Exam", date: "2026-05-14", classAverage: 83, rank: 4 },
  ],
};

export const mockTimetable: Record<string, TimetableSlot[]> = {
  stud_001: [
    { id: "tt_1", time: "08:30 AM - 09:30 AM", subject: "Mathematics", teacher: "Jenkins S.", room: "Room 402", day: "Monday" },
    { id: "tt_2", time: "09:30 AM - 10:30 AM", subject: "Physics", teacher: "Alvarez M.", room: "Science Lab 1", day: "Monday" },
    { id: "tt_3", time: "11:00 AM - 12:00 PM", subject: "English Lit", teacher: "Smith K.", room: "Room 402", day: "Monday" },
    { id: "tt_4", time: "12:00 PM - 01:00 PM", subject: "History", teacher: "Davis R.", room: "Room 301", day: "Monday" },
    { id: "tt_5", time: "02:00 PM - 03:00 PM", subject: "Computer Science", teacher: "Chen J.", room: "IT Hub", day: "Monday" },
  ],
  stud_002: [
    { id: "tt_6", time: "08:30 AM - 09:30 AM", subject: "General Science", teacher: "Alvarez M.", room: "Science Lab 2", day: "Monday" },
    { id: "tt_7", time: "09:30 AM - 10:30 AM", subject: "Social Studies", teacher: "Davis R.", room: "Room 105", day: "Monday" },
  ],
};

export const mockBusRoute: BusRoute = {
  id: "route_104",
  routeName: "North Menlo Park Route 4",
  busNumber: "CA-342-BUS",
  driverName: "Robert Miller",
  driverPhone: "+1 (555) 342-8812",
  eta: "8 Mins",
  currentLocation: { latitude: 37.4529, longitude: -122.1818 },
  stops: [
    { name: "School Terminal", time: "08:00 AM", latitude: 37.4485, longitude: -122.1700 },
    { name: "Willow Road Center", time: "08:12 AM", latitude: 37.4560, longitude: -122.1780 },
    { name: "Oakridge Ave Pick-Up", time: "08:24 AM", latitude: 37.4529, longitude: -122.1818 },
    { name: "Marsh Road Hub", time: "08:35 AM", latitude: 37.4610, longitude: -122.1910 },
  ],
};

export const mockChats: Record<string, ChatMessage[]> = {
  "teacher_parent": [
    { id: "msg_1", senderId: "usr_jenkins", senderName: "Sarah Jenkins", senderRole: "teacher", text: "Hello Elizabeth, Ethan did exceptionally well on his math presentation today!", timestamp: "2026-06-13T10:15:00Z" },
    { id: "msg_2", senderId: "parent_elizabeth", senderName: "Elizabeth Warren", senderRole: "parent", text: "Thank you Sarah! He spent the whole weekend preparing for it.", timestamp: "2026-06-13T10:20:00Z" },
    { id: "msg_3", senderId: "usr_jenkins", senderName: "Sarah Jenkins", senderRole: "teacher", text: "Wonderful. Also, please review the uploaded study guide for term finals.", timestamp: "2026-06-13T14:40:00Z" },
  ],
  "admin_parent": [
    { id: "msg_a1", senderId: "admin_marcus", senderName: "Marcus Vance", senderRole: "admin", text: "Dear Parent, this is a reminder regarding the outstanding Bus Transport fee for Ethan.", timestamp: "2026-06-12T09:00:00Z" },
    { id: "msg_a2", senderId: "parent_elizabeth", senderName: "Elizabeth Warren", senderRole: "parent", text: "Understood, Marcus. I will settle this payment online this evening.", timestamp: "2026-06-12T11:15:00Z" },
  ],
};

export const mockLeaves: LeaveRequest[] = [
  { id: "lv_1", name: "Sarah Jenkins", role: "Teacher", startDate: "2026-06-18", endDate: "2026-06-20", reason: "Attending mathematical symposium in Seattle", status: "pending", leaveType: "Casual Leave" },
  { id: "lv_2", name: "David Miller", role: "Admin Staff", startDate: "2026-06-10", endDate: "2026-06-11", reason: "Minor outpatient recovery procedure", status: "approved", leaveType: "Sick Leave" },
];

export const mockStudyMaterials: StudyMaterial[] = [
  { id: "mat_1", title: "Algebraic Formulations & Constants", subject: "Mathematics", type: "pdf", size: "3.4 MB", uploadDate: "2026-06-08", url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf" },
  { id: "mat_2", title: "Newtonian Mechanics Revision Guide", subject: "Physics", type: "pdf", size: "2.1 MB", uploadDate: "2026-06-10", url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf" },
  { id: "mat_3", title: "The Roman Empire and European Structure", subject: "History", type: "doc", size: "1.2 MB", uploadDate: "2026-06-05", url: "#" },
];

export const mockHomework: Record<string, HomeworkTask[]> = {
  stud_001: [
    { id: "hw_1", title: "Quadratic Equations Practice Set 3", subject: "Mathematics", dueDate: "2026-06-16", description: "Solve questions 1 through 15 on page 112. Show complete formulas and variables.", teacherName: "Sarah Jenkins", status: "pending" },
    { id: "hw_2", title: "Lab Report: Kinetic Energy Dissipation", subject: "Physics", dueDate: "2026-06-12", description: "Document results of the pendular kinetic friction experiment with charts.", teacherName: "Alvarez M.", status: "submitted" },
    { id: "hw_3", title: "Shakespearean Macbeth Character Essay", subject: "English Lit", dueDate: "2026-06-08", description: "Write a 500-word analysis of Macbeth's moral corruption in Act 3.", teacherName: "Smith K.", status: "graded", grade: "A", feedback: "Outstanding thesis. Excellent contextual references." },
  ],
  stud_002: [
    { id: "hw_4", title: "Cellular Structure Diagram & Labelling", subject: "General Science", dueDate: "2026-06-15", description: "Draw, label and color the structural organelles of plant and animal cells.", teacherName: "Alvarez M.", status: "pending" },
  ],
};

export const mockNotifications = [
  { id: "not_1", title: "Emergency System Broadcast", message: "Severe weather alert: School operates online sessions tomorrow.", time: "10 Mins Ago", category: "emergency", priority: "high" },
  { id: "not_2", title: "Upcoming Fee Due Date", message: "Term 2 tuition fees are due for payment before June 30.", time: "2 Hours Ago", category: "finance", priority: "medium" },
  { id: "not_3", title: "New Study Material Uploaded", message: "Mrs. Jenkins uploaded 'Algebraic Formulations' to Grade 9 math.", time: "1 Day Ago", category: "academic", priority: "low" },
];
