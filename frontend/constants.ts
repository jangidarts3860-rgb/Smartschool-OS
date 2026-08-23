import { Announcement, FeeRecord, Homework, Student, User, UserRole, Message, Bus, SchoolSettings, ClassRoom, FeeStructure, Subject, TimeSlot, StudentPerformance, Notification, CalendarEvent } from '@/types';
import { STUDENT_AARAV_PHOTO } from '@/lib/studentPhoto';
import { ADMIN_VIKRAM_PHOTO } from '@/lib/adminPhoto';

export { STUDENT_AARAV_PHOTO, ADMIN_VIKRAM_PHOTO };

export const IS_DEMO_MODE = true;

// ================== FEMALE NAME DETECTION (EXPORTED FOR REUSE) ==================
export const FEMALE_NAME_KEYWORDS = [
  'ananya', 'saanvi', 'aanya', 'aadhya', 'myra', 'diya', 'prisha', 'riya', 'kiara',
  'isha', 'nisha', 'kavya', 'siya', 'meera', 'avni', 'tanya', 'pooja', 'aditi',
  'sneha', 'anika', 'sunita', 'anita', 'kavita', 'savita', 'meena', 'reena',
  'seema', 'neelam', 'poonam', 'suman', 'kiran', 'rekha', 'usha', 'shobha',
  'geeta', 'nirmala', 'pushpa', 'saroj', 'lata', 'shanti', 'mamta', 'priti',
  'asha', 'manju', 'kamla', 'priya', 'neha', 'somi', 'aarti', 'swati', 'ritu',
  'divya', 'shweta', 'bhavna', 'rashmi', 'juhi', 'anjali', 'madhu', 'mrs', 'ms'
];

export const isFemaleName = (name: string): boolean => {
  const firstName = (name || '').trim().toLowerCase().split(/\s+/)[0] || '';
  return FEMALE_NAME_KEYWORDS.some(k => firstName.includes(k) || k === firstName);
};

const FIRST_NAMES_M = ['Aarav', 'Vihaan', 'Arjun', 'Reyansh', 'Ishaan', 'Dhruv', 'Kabir', 'Aditya', 'Rohan', 'Ansh', 'Yash', 'Rudra', 'Parth', 'Dev', 'Sahil', 'Kartik', 'Manav', 'Ritvik', 'Vivaan', 'Ayush', 'Raj', 'Nikhil', 'Siddharth', 'Ravi', 'Vikram', 'Ashok', 'Rajesh', 'Suresh', 'Mahesh', 'Dinesh'];
const FIRST_NAMES_F = ['Ananya', 'Saanvi', 'Aanya', 'Aadhya', 'Myra', 'Diya', 'Prisha', 'Riya', 'Kiara', 'Isha', 'Nisha', 'Kavya', 'Siya', 'Meera', 'Avni', 'Tanya', 'Pooja', 'Aditi', 'Sneha', 'Anika', 'Sunita', 'Anita', 'Kavita', 'Savita', 'Meena', 'Reena', 'Seema', 'Neelam', 'Poonam', 'Suman'];
const LAST_NAMES = ['Patel', 'Sharma', 'Singh', 'Gupta', 'Mehta', 'Verma', 'Joshi', 'Yadav', 'Chauhan', 'Mishra', 'Tiwari', 'Reddy', 'Iyer', 'Nair', 'Pandey', 'Shah', 'Malik', 'Dubey', 'Rao'];

export const REAL_ADMIN_AVATARS_M = [
  ADMIN_VIKRAM_PHOTO, // Exact uploaded photo (Vikram Malhotra - Admin)
  'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=400&q=80', // Senior Director
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=400&q=80'  // School Trustee
];

export const REAL_ADMIN_AVATARS_F = [
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&w=400&q=80'
];

export const REAL_TEACHER_AVATARS_M = [
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80'
];

export const REAL_TEACHER_AVATARS_F = [
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=400&q=80', // Anjali Sharma
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80'
];

export const REAL_PARENT_AVATARS_M = [
  'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=400&q=80', // Rajesh Sharma - friendly father portrait
  'https://images.unsplash.com/photo-1519345182560-3f2917c472ef?auto=format&fit=crop&w=400&q=80'
];

export const REAL_PARENT_AVATARS_F = [
  'https://images.unsplash.com/photo-1548142813-c348350df52b?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'
];

export const REAL_STUDENT_AVATARS_M = [
  STUDENT_AARAV_PHOTO, // 18yo smiling student (Aarav Sharma - exact photo)
  'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=400&q=80', // 18yo student with backpack
  'https://images.unsplash.com/photo-1488161628813-04466f872be2?auto=format&fit=crop&w=400&q=80'
];

export const REAL_STUDENT_AVATARS_F = [
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80', // 15yo teenage girl school student (Ananya Sharma)
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=400&q=80'
];

export const REAL_ADMIN_AVATARS = [...REAL_ADMIN_AVATARS_M, ...REAL_ADMIN_AVATARS_F];
export const REAL_STUDENT_AVATARS = [...REAL_STUDENT_AVATARS_M, ...REAL_STUDENT_AVATARS_F];
export const REAL_TEACHER_AVATARS = [...REAL_TEACHER_AVATARS_M, ...REAL_TEACHER_AVATARS_F];
export const REAL_PARENT_AVATARS = [...REAL_PARENT_AVATARS_M, ...REAL_PARENT_AVATARS_F];

// Deterministic name generator (no random shuffling on each render)
const genName = (i: number) => {
  const isFemale = i % 2 === 0;
  const firstName = isFemale 
    ? FIRST_NAMES_F[Math.floor(i / 2) % FIRST_NAMES_F.length]! 
    : FIRST_NAMES_M[Math.floor(i / 2) % FIRST_NAMES_M.length]!;
  const lastName = LAST_NAMES[i % LAST_NAMES.length]!;
  return `${firstName} ${lastName}`;
};

export const getDeterministicAvatar = (name: string, role?: UserRole | string): string => {
  const cleanName = (name || 'User').trim();
  const lowerName = cleanName.toLowerCase();
  let hash = 0;
  for (let i = 0; i < cleanName.length; i++) {
    hash = cleanName.charCodeAt(i) + ((hash << 5) - hash);
  }
  const positiveHash = Math.abs(hash);
  const isFemale = isFemaleName(cleanName);
  const normalizedRole = String(role || '').toUpperCase();

  if (normalizedRole === 'ADMIN' || normalizedRole === 'SUPER_ADMIN' || normalizedRole === UserRole.ADMIN || lowerName.includes('vikram') || lowerName.includes('malhotra') || lowerName === 'admin') {
    return ADMIN_VIKRAM_PHOTO;
  }
  if (normalizedRole === 'TEACHER' || normalizedRole === UserRole.TEACHER) {
    const arr = isFemale ? REAL_TEACHER_AVATARS_F : REAL_TEACHER_AVATARS_M;
    return arr[positiveHash % arr.length]!;
  }
  if (normalizedRole === 'PARENT' || normalizedRole === UserRole.PARENT) {
    const arr = isFemale ? REAL_PARENT_AVATARS_F : REAL_PARENT_AVATARS_M;
    return arr[positiveHash % arr.length]!;
  }

  // Student role:
  if (lowerName.includes('aarav') || lowerName === 'student') {
    return STUDENT_AARAV_PHOTO;
  }
  if (lowerName.includes('ananya')) {
    return 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80';
  }

  const arr = isFemale ? REAL_STUDENT_AVATARS_F : REAL_STUDENT_AVATARS_M;
  return arr[positiveHash % arr.length]!;
};

export const avatar = (name: string, index: number = 0) => {
  return getDeterministicAvatar(name);
};

export const getParentChildren = (user?: User | null): User[] => {
  const girlChild: User = {
    id: 'stu002',
    uniqueId: 'STU002',
    name: 'Ananya Sharma',
    email: 'ananya@student.school.com',
    role: UserRole.STUDENT,
    schoolId: 'SCH01',
    classId: '10A',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80',
    parentPhone: user?.phone || '+91 98765 43210',
    status: 'ACTIVE',
    rollNo: 15,
  };

  const boyChild: User = {
    id: 'stu001',
    uniqueId: 'STU001',
    name: 'Aarav Sharma',
    email: 'aarav@student.school.com',
    role: UserRole.STUDENT,
    schoolId: 'SCH01',
    classId: '12A',
    avatar: STUDENT_AARAV_PHOTO,
    parentPhone: user?.phone || '+91 98765 43210',
    status: 'ACTIVE',
    rollNo: 1,
  };

  if (!user) return [girlChild, boyChild];
  const childIds = user.childrenIds || [];
  if (childIds.length > 0) {
    const found = MOCK_STUDENT_USERS.filter(u => childIds.includes(u.id));
    if (found.length > 0) return found;
  }
  if (user.phone) {
    const foundByPhone = MOCK_STUDENT_USERS.filter(u => u.parentPhone === user.phone);
    if (foundByPhone.length > 0) return foundByPhone;
  }
  return [girlChild, boyChild];
};

// ================== CLASSES ==================
const CLASS_LIST = [
  'PRE-NUR', 'NUR', 'LKG', 'UKG',
  '1A', '1B', '2A', '2B', '3A', '3B',
  '4A', '4B', '5A', '5B', '6A', '6B',
  '7A', '7B', '8A', '8B', '9A', '9B', '9C',
  '10A', '10B', '10C', '11A', '11B', '11C',
  '12A', '12B', '12C'
];
const CLASS_NAMES: Record<string, string> = {
  'PRE-NUR': 'Pre-Nursery', 'NUR': 'Nursery', 'LKG': 'LKG', 'UKG': 'UKG',
  '1A': 'Class 1-A', '1B': 'Class 1-B', '2A': 'Class 2-A', '2B': 'Class 2-B',
  '3A': 'Class 3-A', '3B': 'Class 3-B', '4A': 'Class 4-A', '4B': 'Class 4-B',
  '5A': 'Class 5-A', '5B': 'Class 5-B', '6A': 'Class 6-A', '6B': 'Class 6-B',
  '7A': 'Class 7-A', '7B': 'Class 7-B', '8A': 'Class 8-A', '8B': 'Class 8-B',
  '9A': 'Class 9-A', '9B': 'Class 9-B', '9C': 'Class 9-C',
  '10A': 'Class 10-A', '10B': 'Class 10-B', '10C': 'Class 10-C',
  '11A': 'Class 11-A', '11B': 'Class 11-B', '11C': 'Class 11-C',
  '12A': 'Class 12-A', '12B': 'Class 12-B', '12C': 'Class 12-C'
};

// ================== 10 TEACHERS ==================
const TEACHER_DATA = [
  { name: 'Anjali Sharma', gender: 'F', subjects: ['Mathematics', 'Science'], classes: ['9A', '10A'] },
  { name: 'Rajesh Kumar', gender: 'M', subjects: ['Hindi', 'Social Studies'], classes: ['6A', '7A'] },
  { name: 'Priya Iyer', gender: 'F', subjects: ['English', 'Literature'], classes: ['8A', '9A'] },
  { name: 'Suresh Verma', gender: 'M', subjects: ['Physics', 'Chemistry'], classes: ['10A'] },
  { name: 'Neha Gupta', gender: 'F', subjects: ['Computer Science'], classes: ['7A', '8A'] },
  { name: 'Amit Tiwari', gender: 'M', subjects: ['Physical Education'], classes: ['1A', '2A', '3A', '4A', '5A'] },
  { name: 'Sunita Reddy', gender: 'F', subjects: ['Art & Craft'], classes: ['NUR', 'LKG', 'UKG'] },
  { name: 'Deepak Pandey', gender: 'M', subjects: ['Mathematics'], classes: ['6A', '7A', '8A'] },
  { name: 'Kavita Nair', gender: 'F', subjects: ['Biology', 'Environmental Science'], classes: ['9A', '10A'] },
  { name: 'Mohit Singh', gender: 'M', subjects: ['Social Studies', 'History'], classes: ['8A', '9A', '10A'] },
];

export const MOCK_TEACHERS: User[] = TEACHER_DATA.map((t, i) => ({
  id: `t${i + 1}`,
  uniqueId: `TCH${String(i + 1).padStart(3, '0')}`,
  schoolId: 'SCH01',
  name: t.name,
  email: `${t.name.split(' ')[0]!.toLowerCase()}@school.com`,
  role: UserRole.TEACHER,
  classId: t.classes[0],
  avatar: t.gender === 'F' 
    ? REAL_TEACHER_AVATARS_F[i % REAL_TEACHER_AVATARS_F.length]! 
    : REAL_TEACHER_AVATARS_M[i % REAL_TEACHER_AVATARS_M.length]!,
  phone: `+91 ${90000 + i * 1111} ${10000 + i * 1111}`,
  isLinked: true,
  subjects: t.subjects,
  assignedClasses: t.classes,
  status: 'ACTIVE' as const,
  password: 'demo123'
}));

// ================== 100 STUDENTS (spread across classes) ==================
const STUDENTS_PER_CLASS: Record<string, number> = {
  'PRE-NUR': 5, 'NUR': 6, 'LKG': 6, 'UKG': 6,
  '1A': 8, '1B': 4, '2A': 8, '2B': 4, '3A': 8, '3B': 4,
  '4A': 8, '4B': 4, '5A': 8, '5B': 4, '6A': 8, '6B': 4,
  '7A': 8, '7B': 4, '8A': 8, '8B': 4, '9A': 5, '9B': 4, '9C': 3,
  '10A': 5, '10B': 4, '10C': 3, '11A': 4, '11B': 3, '11C': 3,
  '12A': 4, '12B': 3, '12C': 3
};

const PRIMARY_STUDENTS: User[] = [
  {
    id: 'stu001',
    uniqueId: 'STU001',
    schoolId: 'SCH01',
    name: 'Aarav Sharma',
    email: 'aarav@student.school.com',
    role: UserRole.STUDENT,
    classId: '12A',
    avatar: STUDENT_AARAV_PHOTO, // 18yo boy student
    phone: '+91 98765 43210',
    parentPhone: '+91 98765 43211',
    isLinked: true,
    status: 'ACTIVE',
    rollNo: 1,
    pin: '1234'
  },
  {
    id: 'stu002',
    uniqueId: 'STU002',
    schoolId: 'SCH01',
    name: 'Ananya Sharma',
    email: 'ananya@student.school.com',
    role: UserRole.STUDENT,
    classId: '10A',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80', // 15yo girl student
    phone: '+91 98765 43212',
    parentPhone: '+91 98765 43211',
    isLinked: true,
    status: 'ACTIVE',
    rollNo: 15,
    pin: '1234'
  }
];

let studentCounter = 2;
const MOCK_STUDENT_USERS: User[] = [...PRIMARY_STUDENTS];
const MOCK_STUDENT_DETAILS: Student[] = [
  {
    id: 'stu001',
    name: 'Aarav Sharma',
    rollNo: 1,
    classId: '12A',
    photoURL: STUDENT_AARAV_PHOTO,
    parentLinked: true,
    amountDue: 0,
    performanceInsight: 'Excellent',
    lastResult: 'A+'
  },
  {
    id: 'stu002',
    name: 'Ananya Sharma',
    rollNo: 15,
    classId: '10A',
    photoURL: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80',
    parentLinked: true,
    amountDue: 0,
    performanceInsight: 'Excellent',
    lastResult: 'A+'
  }
];

CLASS_LIST.forEach(classId => {
  const count = STUDENTS_PER_CLASS[classId] || 8;
  for (let j = 0; j < count; j++) {
    studentCounter++;
    const name = genName(studentCounter);
    const id = `stu${String(studentCounter).padStart(3, '0')}`;
    const grades = ['A+', 'A', 'A', 'B+', 'B+', 'B', 'B', 'C+', 'C'];
    const insights = ['Excellent', 'Very Good', 'Good', 'Improving', 'Needs Focus'];

    MOCK_STUDENT_USERS.push({
      id, uniqueId: `STU${String(studentCounter).padStart(3, '0')}`,
      schoolId: 'SCH01', name, email: `${name.split(' ')[0]!.toLowerCase()}${studentCounter}@student.school.com`,
      role: UserRole.STUDENT, classId, avatar: avatar(name, studentCounter),
      phone: `+91 ${70000 + studentCounter * 100} ${10000 + studentCounter * 10}`,
      isLinked: studentCounter % 5 !== 0, status: 'ACTIVE',
      pin: '1234'
    });

    MOCK_STUDENT_DETAILS.push({
      id, name, rollNo: j + 1, classId,
      photoURL: avatar(name, studentCounter), parentLinked: studentCounter % 5 !== 0,
      amountDue: [0, 0, 5000, 10000, 15000][studentCounter % 5]!,
      performanceInsight: insights[studentCounter % insights.length]!,
      lastResult: grades[studentCounter % grades.length]!
    });
  }
});

// Assign parentPhone to each student (1 parent per 2 students)
MOCK_STUDENT_USERS.forEach((stu, idx) => {
  const parentIdx = Math.floor(idx / 2);
  stu.parentPhone = `+91 ${80000 + parentIdx * 100} ${20000 + parentIdx * 10}`;
});

// ================== PARENTS (1 per 2 students) ==================
const PARENT_NAMES_M = ['Rajesh', 'Suresh', 'Mahesh', 'Dinesh', 'Ramesh', 'Anil', 'Sunil', 'Vijay', 'Sanjay', 'Deepak', 'Rakesh', 'Mukesh', 'Harish', 'Naresh', 'Pankaj', 'Yogesh', 'Ashok', 'Vinod', 'Prakash', 'Govind'];
const PARENT_NAMES_F = ['Sunita', 'Anita', 'Kavita', 'Savita', 'Meena', 'Reena', 'Seema', 'Neelam', 'Poonam', 'Suman', 'Kiran', 'Rekha', 'Usha', 'Shobha', 'Geeta', 'Nirmala', 'Pushpa', 'Saroj', 'Lata', 'Shanti'];

const MOCK_PARENT_USERS: User[] = [];
for (let i = 0; i < 50; i++) {
  const child1 = MOCK_STUDENT_USERS[i * 2]!;
  const child2 = MOCK_STUDENT_USERS[i * 2 + 1];
  const isFemaleParent = i % 2 !== 0;
  const childLastName = child1.name.split(' ')[1] || LAST_NAMES[i % LAST_NAMES.length]!;
  const parentFirstName = isFemaleParent 
    ? PARENT_NAMES_F[i % PARENT_NAMES_F.length]! 
    : PARENT_NAMES_M[i % PARENT_NAMES_M.length]!;
  const parentName = `${parentFirstName} ${childLastName}`;
  const parentAvatar = getDeterministicAvatar(parentName, UserRole.PARENT);
  
  MOCK_PARENT_USERS.push({
    id: `par${String(i + 1).padStart(3, '0')}`,
    uniqueId: `PAR${String(i + 1).padStart(3, '0')}`,
    schoolId: 'SCH01', name: parentName,
    email: `${parentFirstName.toLowerCase()}${i}@parent.school.com`,
    role: UserRole.PARENT,
    childrenIds: child2 ? [child1.id, child2.id] : [child1.id],
    avatar: parentAvatar,
    phone: `+91 ${80000 + i * 100} ${20000 + i * 10}`,
    isLinked: true, status: 'ACTIVE'
  });
}

// ================== ADMIN USER ==================
// Password for demo mode login
const ADMIN_USER: User = {
  id: 'u1', uniqueId: 'ADM001', schoolId: 'SCH01',
  name: 'Vikram Malhotra', email: 'admin@school.com',
  role: UserRole.ADMIN, avatar: ADMIN_VIKRAM_PHOTO,
  phone: '+91 98765 43210', isLinked: true, status: 'ACTIVE',
  password: 'demo123'
};

// ================== COMBINED MOCK_USERS ==================
export const MOCK_USERS: User[] = [
  ADMIN_USER,
  ...MOCK_TEACHERS,
  ...MOCK_STUDENT_USERS,
  ...MOCK_PARENT_USERS
];

// ================== BUSES ==================
export const MOCK_BUSES: Bus[] = [
  { id: 'b1', number: 'DL-1PA-1234', routeId: 'r1', driverId: 'd1', status: 'ON_ROUTE', location: { lat: 28.6139, lng: 77.2090 }, speed: 35, heading: 45, lastUpdate: 'Just now', occupancy: 38, capacity: 50, health: 98, fuel: 85, schoolId: 'SCH01', driverName: 'Rakesh Singh', driverPhone: '+91 98765 43210' },
  { id: 'b2', number: 'DL-1PA-5678', routeId: 'r2', driverId: 'd2', status: 'ON_ROUTE', location: { lat: 28.7041, lng: 77.1025 }, speed: 28, heading: 120, lastUpdate: '2 mins ago', occupancy: 42, capacity: 50, health: 92, fuel: 70, schoolId: 'SCH01', driverName: 'Vikram Sharma', driverPhone: '+91 98765 43211' },
  { id: 'b3', number: 'DL-1PA-9012', routeId: 'r3', driverId: 'd3', status: 'DELAYED', location: { lat: 28.5355, lng: 77.3910 }, speed: 0, heading: 0, lastUpdate: '5 mins ago', occupancy: 35, capacity: 50, health: 88, fuel: 60, schoolId: 'SCH01', driverName: 'Suresh Reddy', driverPhone: '+91 98765 43212' },
  { id: 'b4', number: 'DL-1PA-3456', routeId: 'r4', driverId: 'd4', status: 'PARKED', location: { lat: 28.6862, lng: 77.1312 }, speed: 0, heading: 0, lastUpdate: '1 hour ago', occupancy: 0, capacity: 50, health: 95, fuel: 90, schoolId: 'SCH01', driverName: 'Arjun Kumar', driverPhone: '+91 98765 43213' },
];

// ================== ANNOUNCEMENTS ==================
export const MOCK_ANNOUNCEMENTS: Announcement[] = [
  { id: 'a1', schoolId: 'SCH01', title: 'Diwali Holidays', message: 'School will remain closed from Oct 30th to Nov 4th. Happy Diwali to all!', priority: 'critical', visibleTo: ['teacher', 'student', 'parent'], targetClasses: [], createdBy: 'admin', createdByName: 'Principal Office', createdByRole: 'ADMIN', isPinned: true, isArchived: false, readBy: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'a2', schoolId: 'SCH01', title: 'Annual Day Rehearsal', message: 'All students of Class 5-10 must attend rehearsals from Nov 10-14, 3 PM onwards.', priority: 'general', visibleTo: ['teacher', 'student'], targetClasses: [], createdBy: 'admin', createdByName: 'Cultural Committee', createdByRole: 'ADMIN', isPinned: false, isArchived: false, readBy: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'a3', schoolId: 'SCH01', title: 'Fee Due Reminder', message: 'Last date for Q2 fee payment is Nov 15. Late fee of ₹50/day will apply.', priority: 'urgent', visibleTo: ['parent'], targetClasses: [], createdBy: 'admin', createdByName: 'Accounts Department', createdByRole: 'ADMIN', isPinned: true, isArchived: false, readBy: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'a4', schoolId: 'SCH01', title: 'PTM Notice', message: 'Parent-Teacher Meeting scheduled for Nov 22, Saturday. 9 AM - 1 PM.', priority: 'general', visibleTo: ['parent', 'teacher'], targetClasses: [], createdBy: 'admin', createdByName: 'Academic Coordinator', createdByRole: 'ADMIN', isPinned: false, isArchived: false, readBy: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
];

// ================== HOMEWORK ==================
export const MOCK_HOMEWORK: Homework[] = [
  { id: 'h1', title: 'Trigonometry & Quadratic Equations Ex 8.4', subject: 'Mathematics', description: 'Complete Exercise 8.4 Q1-Q10 with step-by-step solutions.', assignedDate: '2026-08-10', dueDate: '2026-08-12', classId: '10A', schoolId: 'SCH01', academicYear: '2026-27', status: 'ACTIVE', teacherId: 'tch001', teacherName: 'Vikram Malhotra', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'h2', title: 'Periodic Table & Chemical Bonding', subject: 'Science', description: 'Draw electron dot structures for the first 20 elements.', assignedDate: '2026-08-12', dueDate: '2026-09-05', classId: '10A', schoolId: 'SCH01', academicYear: '2026-27', status: 'ACTIVE', teacherId: 'tch002', teacherName: 'Dr. Ananya Sen', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'h3', title: 'Essay: India in the AI Era', subject: 'English', description: 'Write a 350-word analytical essay on the impact of AI in education.', assignedDate: '2026-08-14', dueDate: '2026-08-20', classId: '9A', schoolId: 'SCH01', academicYear: '2026-27', status: 'ACTIVE', teacherId: 'tch003', teacherName: 'Sunita Roy', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'h4', title: 'Hindi Sahitya Kavita Vachana', subject: 'Hindi', description: 'Prepare poem recitation with भावार्थ from chapter 5.', assignedDate: '2026-08-01', dueDate: '2026-08-15', classId: '7A', schoolId: 'SCH01', academicYear: '2026-27', status: 'ACTIVE', teacherId: 'tch004', teacherName: 'Manoj Tiwari', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
];

// ================== FEES (diverse sample records across distinct students) ==================
const FEE_MONTHS = ['November', 'October', 'September', 'August', 'July', 'June', 'May', 'April'];
export const MOCK_FEES: FeeRecord[] = [];
FEE_MONTHS.forEach((month, mi) => {
  MOCK_STUDENT_USERS.slice(0, 30).forEach((stu, idx) => {
    const total = 12000;
    const paid = mi > 2 ? total : (idx % 3 === 0 ? 0 : idx % 3 === 1 ? 6000 : total);
    const status = paid >= total ? 'PAID' : paid > 0 ? 'PARTIAL' : (mi === 0 ? 'PENDING' : 'OVERDUE');
    MOCK_FEES.push({
      id: `f-${stu.id}-${month.toLowerCase()}`,
      invoiceNo: `INV-${2400 + idx * 10 + mi}`,
      studentId: stu.id,
      studentName: stu.name,
      academicYear: '2024-25',
      totalAmount: total,
      amountPaid: paid,
      month,
      status: status as any,
      dueDate: `2025-${String(11 - mi).padStart(2, '0')}-10`,
      classId: stu.classId || '10A',
      schoolId: 'SCH01'
    });
  });
});

// ================== SCHOOL SETTINGS ==================
export const SCHOOL_SETTINGS_MOCK: SchoolSettings = {
  schoolName: 'Delhi Public Smart School',
  address: 'Sector 45, Gurgaon, Haryana - 122003',
  contactEmail: 'admin@dpsmart.edu.in',
  logoUrl: '/logo.png',
  accentColor: '#4f46e5',
  biometricEnabled: true,
  aiAutomation: true,
  upiEnabled: true,
};

// ================== CHARTS ==================
export const DASHBOARD_ATTENDANCE_DATA = [
  { name: 'Mon', percentage: 92 },
  { name: 'Tue', percentage: 95 },
  { name: 'Wed', percentage: 91 },
  { name: 'Thu', percentage: 94 },
  { name: 'Fri', percentage: 96 },
  { name: 'Sat', percentage: 78 },
];

// ================== MESSAGES ==================
export const MOCK_MESSAGES: Message[] = [
  { id: 'm1', senderId: 'u1', receiverId: 't1', content: 'Anjali ji, Class 10A ka result kab tak ready hoga?', timestamp: '10:30 AM', isRead: true },
  { id: 'm2', senderId: 't1', receiverId: 'u1', content: 'Sir, kal tak bhej dungi. Final checking chal rahi hai.', timestamp: '10:35 AM', isRead: false },
  { id: 'm3', senderId: 'par001', receiverId: 't1', content: 'Madam, mera beta Aarav ki attendance theek hai?', timestamp: '11:00 AM', isRead: true },
];

// ================== CLASSES ==================
export const MOCK_CLASSES: ClassRoom[] = CLASS_LIST.map((id, i) => {
  const teacher = MOCK_TEACHERS.find(t => t.assignedClasses?.includes(id)) || MOCK_TEACHERS[0]!;
  return {
    id,
    name: CLASS_NAMES[id]!,
    schoolId: 'SCH01',
    capacity: id.startsWith('N') || id.startsWith('L') || id.startsWith('U') ? 30 : 45,
    studentCount: STUDENTS_PER_CLASS[id] || 8,
    classTeacherId: teacher.id,
    classTeacherName: teacher.name,
    timeTable: {
      'Monday': [
        { time: '08:00 AM', subject: 'Mathematics', teacher: 'Anjali Sharma' },
        { time: '09:00 AM', subject: 'Science', teacher: 'Suresh Verma' },
        { time: '10:00 AM', subject: 'English', teacher: 'Priya Iyer' },
      ],
      'Tuesday': [
        { time: '08:00 AM', subject: 'Hindi', teacher: 'Rajesh Kumar' },
        { time: '09:00 AM', subject: 'Mathematics', teacher: 'Anjali Sharma' },
        { time: '10:00 AM', subject: 'Computer', teacher: 'Neha Gupta' },
      ]
    }
  };
});

// ================== FEE STRUCTURES ==================
export const MOCK_FEE_STRUCTURES: FeeStructure[] = [
  {
    id: 'fs1', name: 'Pre-Primary Fee (NUR-UKG)',
    classId: ['NUR', 'LKG', 'UKG'], totalAmount: 8000,
    frequency: 'QUARTERLY', dueDateDay: 10,
    lateFeeConfig: { gracePeriodDays: 7, fineAmount: 50, fineType: 'FIXED_PER_DAY' },
    heads: [{ name: 'Tuition Fee', amount: 5000 }, { name: 'Activity Fee', amount: 3000 }]
  },
  {
    id: 'fs2', name: 'Primary Fee (1-5)',
    classId: ['1A', '2A', '3A', '4A', '5A'], totalAmount: 10000,
    frequency: 'QUARTERLY', dueDateDay: 10,
    lateFeeConfig: { gracePeriodDays: 7, fineAmount: 50, fineType: 'FIXED_PER_DAY' },
    heads: [{ name: 'Tuition Fee', amount: 7000 }, { name: 'Lab Fee', amount: 3000 }]
  },
  {
    id: 'fs3', name: 'Senior Fee (6-10)',
    classId: ['6A', '7A', '8A', '9A', '10A'], totalAmount: 12000,
    frequency: 'QUARTERLY', dueDateDay: 10,
    lateFeeConfig: { gracePeriodDays: 7, fineAmount: 100, fineType: 'FIXED_PER_DAY' },
    heads: [{ name: 'Tuition Fee', amount: 8000 }, { name: 'Lab Fee', amount: 4000 }]
  }
];

// ================== SUBJECTS ==================
export const MOCK_SUBJECTS: Subject[] = [
  { id: 'sub1', name: 'Mathematics', code: 'MATH101' },
  { id: 'sub2', name: 'Science', code: 'SCI101' },
  { id: 'sub3', name: 'English', code: 'ENG101' },
  { id: 'sub4', name: 'Hindi', code: 'HIN101' },
  { id: 'sub5', name: 'Social Studies', code: 'SOC101' },
  { id: 'sub6', name: 'Computer Science', code: 'CS101' },
  { id: 'sub7', name: 'Physical Education', code: 'PE101' },
  { id: 'sub8', name: 'Art & Craft', code: 'ART101' },
];

// ================== TIME SLOTS ==================
export const MOCK_TIME_SLOTS: TimeSlot[] = [
  { id: 'ts1', label: 'Period 1', startTime: '08:00', endTime: '08:45', type: 'ACADEMIC' },
  { id: 'ts2', label: 'Period 2', startTime: '08:50', endTime: '09:35', type: 'ACADEMIC' },
  { id: 'ts3', label: 'Period 3', startTime: '09:40', endTime: '10:25', type: 'ACADEMIC' },
  { id: 'ts4', label: 'Recess', startTime: '10:25', endTime: '10:55', type: 'BREAK' },
  { id: 'ts5', label: 'Period 4', startTime: '11:00', endTime: '11:45', type: 'ACADEMIC' },
  { id: 'ts6', label: 'Period 5', startTime: '11:50', endTime: '12:35', type: 'ACADEMIC' },
];

// ================== STUDENTS (for teacher view) ==================
export const MOCK_STUDENTS_CLASS_10A: Student[] = MOCK_STUDENT_DETAILS.filter(s => s.classId === '10A');

// ================== STUDENT PROFILE ==================
export const MOCK_STUDENT_PROFILE_DETAILS = {
  attendanceHistory: [
    { month: 'Apr', percent: 96 }, { month: 'May', percent: 93 },
    { month: 'Jun', percent: 91 }, { month: 'Jul', percent: 95 },
    { month: 'Aug', percent: 94 }, { month: 'Sep', percent: 92 },
    { month: 'Oct', percent: 97 },
  ],
  examResults: [
    { subject: 'Math', score: 88 }, { subject: 'Science', score: 92 },
    { subject: 'English', score: 85 }, { subject: 'Hindi', score: 78 },
    { subject: 'Social Studies', score: 82 },
  ],
  logs: [
    { type: 'Entry', msg: 'Checked in at 08:05 AM', date: 'Oct 28, 2025' },
    { type: 'Fee', msg: 'Paid ₹12,000 for Q2', date: 'Oct 15, 2025' },
    { type: 'Result', msg: 'Mid-Term marks uploaded', date: 'Oct 10, 2025' },
  ]
};

export const MOCK_STUDENT_PERFORMANCE: StudentPerformance[] = [
  {
    studentId: 'stu001', healthScore: 85,
    aiInsight: 'Strong in Science. Math needs improvement in Trigonometry.',
    recentResults: [
      { id: 'r1', subject: 'Math', examType: 'MID_TERM', marksObtained: 88, totalMarks: 100, date: '2025-10-15' },
      { id: 'r2', subject: 'Science', examType: 'MID_TERM', marksObtained: 92, totalMarks: 100, date: '2025-10-17' },
    ]
  }
];

// ================== NOTIFICATIONS ==================
export const MOCK_NOTIFICATIONS: Notification[] = [
  { id: 'n1', title: 'Fee Payment Due', message: '₹24,000 overdue from 12 students of Class 10A.', time: '2 hrs ago', type: 'ALERT', isRead: false },
  { id: 'n2', title: 'Bus Route 3 Delayed', message: 'Bus DL-1PA-9012 is delayed by 20 mins due to traffic.', time: '30 mins ago', type: 'ALERT', isRead: false },
  { id: 'n3', title: 'Attendance Uploaded', message: 'Class 9A attendance marked by Priya Iyer.', time: '1 hr ago', type: 'SUCCESS', isRead: true },
  { id: 'n4', title: 'Exam Schedule Published', message: 'Mid-term datesheet for Classes 6-10 is live.', time: '1 day ago', type: 'INFO', isRead: true },
  { id: 'n5', title: 'New Parent Registered', message: 'Mr. Sharma linked to student Aarav (10A).', time: '2 days ago', type: 'INFO', isRead: true },
];

// ================== CALENDAR ==================
export const MOCK_EVENTS: CalendarEvent[] = [
  { id: 'e1', title: 'Diwali Break', date: '2025-11-12', type: 'HOLIDAY', description: 'School closed for Diwali.' },
  { id: 'e2', title: 'Mid-Term Exams Begin', date: '2025-11-20', type: 'EXAM', description: 'Classes 6-10' },
  { id: 'e3', title: 'Annual Sports Day', date: '2025-12-05', type: 'EVENT', description: 'At school grounds.' },
  { id: 'e4', title: 'Republic Day', date: '2026-01-26', type: 'HOLIDAY', description: 'National Holiday' },
  { id: 'e5', title: 'PTM', date: '2025-11-22', type: 'EVENT', description: 'Parent-Teacher Meeting 9AM-1PM' },
];
