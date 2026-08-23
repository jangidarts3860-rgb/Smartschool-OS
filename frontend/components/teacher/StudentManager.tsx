
import React, { useState, useEffect } from 'react';
import { 
  UserPlus, 
  Share2, 
  Copy, 
  Check, 
  MoreVertical, 
  Shield, 
  X, 
  Save, 
  Trash2, 
  Edit, 
  Baby, 
  Mail, 
  Phone,
  Search,
  Users,
  BadgeCheck,
  ChevronRight,
  ExternalLink
} from 'lucide-react';
import { User, UserRole } from '@/types';
import { MOCK_USERS, getDeterministicAvatar } from '@/constants';
import { db } from '@/services/firebase';
import {
  collection,
  onSnapshot,
  query,
  where,
  setDoc,
  doc,
  updateDoc,
  serverTimestamp,
  getDocs,
  FieldValue
} from 'firebase/firestore';
import { toast } from 'react-hot-toast';
import { deleteStudentCascade } from '@/services/studentDeleteService';
import { generateId } from '@/lib/utils';
import Avatar from '@/components/shared/Avatar';

const IS_MOCK_MODE = import.meta.env.VITE_USE_MOCK === 'true' || import.meta.env.VITE_DEMO_MODE === 'true';

interface Props {
  user: User;
}

const StudentManager: React.FC<Props> = ({ user }) => {
  const [students, setStudents] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal States
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<User | null>(null);
  const [inviteLinkCopied, setInviteLinkCopied] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState<User | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    rollNo: '',
    parentName: '',
    parentEmail: '',
    parentPhone: ''
  });
  const [isEditing, setIsEditing] = useState(false);

  // Dropdown State
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Form Fields
  const [studentForm, setStudentForm] = useState({
    name: '',
    rollNo: '',
    parentName: '',
    parentEmail: '',
    parentPhone: '',
    gender: 'MALE'
  });

  useEffect(() => {
    if (IS_MOCK_MODE) {
      setStudents(MOCK_USERS.filter(u => u.role === UserRole.STUDENT));
      setLoading(false);
      return;
    }
    if (!user?.schoolId) {
      setStudents(MOCK_USERS.filter(u => u.role === UserRole.STUDENT));
      setLoading(false);
      return;
    }

    // Fetch students assigned to this teacher's class
    const usersRef = collection(db, 'schools', user.schoolId, 'users');
    let q = query(usersRef, where('role', '==', UserRole.STUDENT));
    
    // If teacher has a classId, filter by it
    if (user.role === UserRole.TEACHER && user.classId) {
      q = query(usersRef, where('role', '==', UserRole.STUDENT), where('classId', '==', user.classId));
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const studentData = snapshot.docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data()
      })) as User[];
      setStudents(studentData.length > 0 ? studentData : MOCK_USERS.filter(u => u.role === UserRole.STUDENT));
      setLoading(false);
    }, (error) => {
      setStudents(MOCK_USERS.filter(u => u.role === UserRole.STUDENT));
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user?.schoolId, user?.classId, user?.role]);

  const handleInviteClick = (student: User) => {
    setSelectedStudent(student);
    setShowInviteModal(true);
    setInviteLinkCopied(false);
    setActiveDropdown(null);
  };

  const generateInviteMessage = (student: User) => {
    const baseUrl = window.location.origin;
    const inviteLink = `${baseUrl}/join/parent?schoolId=${user.schoolId}&studentId=${student.id}`;
    
    return `*SmartSchool Invitation*\n\nNamaste! Your teacher ${user.name} has invited you to join the digital classroom.\n\n*Student:* ${student.name}\n*User ID:* ${student.uniqueId}\n*Password:* Your DOB (YYYY-MM-DD)\n*School:* ${user.schoolName || 'SmartSchool'}\n*Class:* ${student.classId}\n\n*Join Link:* ${inviteLink}\n\n_Note: Use the above link to link your account or login directly with the credentials provided._`;
  };

  const handleWhatsAppInvite = () => {
    if (!selectedStudent) return;
    const message = generateInviteMessage(selectedStudent);
    const whatsappUrl = `https://wa.me/${selectedStudent.parentPhone?.replace(/\D/g, '') || ''}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
    toast.success("Opening WhatsApp...");
  };

  const copyInviteLink = () => {
    if (!selectedStudent) return;
    const message = generateInviteMessage(selectedStudent);
    navigator.clipboard.writeText(message);
    setInviteLinkCopied(true);
    toast.success("Full invite message copied!");
  };

  const saveNewStudent = async () => {
      if (!studentForm.name || !studentForm.rollNo || !studentForm.parentName) {
        return toast.error("Please fill required fields");
      }

      if (!user.classId) {
        return toast.error("You are not assigned to a class. Contact admin.");
      }

      setIsSaving(true);
      try {
          const schoolId = user.schoolId;

          if (IS_MOCK_MODE) {
              const uniqueId = `STU${Date.now().toString().slice(-6)}${generateId().slice(0, 2).toUpperCase()}`;
              const newStudent = {
                  id: uniqueId,
                  name: studentForm.name,
                  role: UserRole.STUDENT,
                  classId: user.classId,
                  rollNo: studentForm.rollNo,
                  parentName: studentForm.parentName,
                  parentPhone: studentForm.parentPhone,
                  email: studentForm.parentEmail || `${studentForm.rollNo}@mock.students.smartschool.app`,
                  gender: studentForm.gender,
                  status: 'ACTIVE',
                  uniqueId,
                  schoolId,
                  isLinked: false,
                  avatar: getDeterministicAvatar(studentForm.name, UserRole.STUDENT)
              } as User;
              setStudents(prev => [newStudent, ...prev]);
              setShowAddModal(false);
              setStudentForm({ name: '', rollNo: '', parentName: '', parentEmail: '', parentPhone: '', gender: 'MALE' });
              setIsSaving(false);
              toast.success(`${studentForm.name} added to your roster!`);
              return;
          }

          const usersRef = collection(db, 'schools', schoolId, 'users');

          // P0 fix: Single consolidated getDocs for both rollNo + name dedup
          // (avoids race condition between two sequential queries)
          const existingInClass = await getDocs(
            query(
              usersRef,
              where('role', '==', UserRole.STUDENT),
              where('classId', '==', user.classId)
            )
          );
          const rollNoStr = studentForm.rollNo.toString();
          const rollNoDup = existingInClass.docs.find((d: any) => (d.data().rollNo?.toString()) === rollNoStr);
          if (rollNoDup) {
            setIsSaving(false);
            return toast.error(`Roll number ${rollNoStr} is already taken in this class.`);
          }
          const nameDup = existingInClass.docs.find((d: any) => d.data().name === studentForm.name);
          if (nameDup) {
            const proceed = window.confirm(
              `A student named "${studentForm.name}" already exists in this class. Add another?`
            );
            if (!proceed) {
              setIsSaving(false);
              return;
            }
          }

          // P1 fix: pre-compute uniqueId, use setDoc for natural ID-based deduplication
          const uniqueId = `STU${Date.now().toString().slice(-6)}${generateId().slice(0, 2).toUpperCase()}`;
          const newStudentData = {
              name: studentForm.name,
              role: UserRole.STUDENT,
              classId: user.classId,
              rollNo: studentForm.rollNo,
              parentName: studentForm.parentName,
              parentPhone: studentForm.parentPhone,
              email: studentForm.parentEmail || `${rollNoStr}@${schoolId}.students.smartschool.app`,
              gender: studentForm.gender,
              status: 'ACTIVE',
              uniqueId,
              schoolId: schoolId,
              createdAt: serverTimestamp() as FieldValue,
              isLinked: false,
              avatar: getDeterministicAvatar(studentForm.name, UserRole.STUDENT)
          };

          // Use uniqueId as the doc ID for stability and natural dedup at Firestore layer
          await setDoc(doc(usersRef, uniqueId), newStudentData);

          setShowAddModal(false);
          setStudentForm({ name: '', rollNo: '', parentName: '', parentEmail: '', parentPhone: '', gender: 'MALE' });
          toast.success(`${studentForm.name} added to your roster!`);
      } catch (err: any) {
          toast.error("Failed to save student: " + err.message);
      } finally {
          setIsSaving(false);
      }
  };

  const openEditModal = (student: User) => {
    setEditingStudent(student);
    setEditForm({
      name: student.name || '',
      rollNo: (student.rollNo ?? '').toString(),
      parentName: (student as any).parentName || '',
      parentEmail: (student as any).parentEmail || student.email || '',
      parentPhone: (student as any).parentPhone || '',
    });
    setShowEditModal(true);
    setActiveDropdown(null);
  };

  const saveEdit = async () => {
    if (!editingStudent) return;
    if (!editForm.name.trim() || !editForm.rollNo.trim()) {
      return toast.error('Name and roll number are required');
    }

    setIsEditing(true);
    if (IS_MOCK_MODE) {
      setStudents(prev => prev.map(s => s.id === editingStudent.id ? { ...s, name: editForm.name.trim(), rollNo: editForm.rollNo.trim(), parentName: editForm.parentName.trim(), parentEmail: editForm.parentEmail.trim(), parentPhone: editForm.parentPhone.trim() } : s));
      toast.success('Student updated');
      setShowEditModal(false);
      setEditingStudent(null);
      setIsEditing(false);
      return;
    }
    try {
      const studentRef = doc(db, 'schools', user.schoolId, 'users', editingStudent.id);
      await updateDoc(studentRef, {
        name: editForm.name.trim(),
        rollNo: editForm.rollNo.trim(),
        parentName: editForm.parentName.trim(),
        parentEmail: editForm.parentEmail.trim(),
        parentPhone: editForm.parentPhone.trim(),
        updatedAt: serverTimestamp() as FieldValue,
      });
      toast.success('Student updated');
      setShowEditModal(false);
      setEditingStudent(null);
    } catch (err: any) {
      toast.error('Update failed: ' + err.message);
    } finally {
      setIsEditing(false);
    }
  };

  const deleteStudent = async (id: string) => {
      const student = students.find(s => s.id === id);
      if (IS_MOCK_MODE) {
        setStudents(prev => prev.filter(s => s.id !== id));
        setConfirmDeleteId(null);
        toast.success(`${student?.name} removed from roster`);
        return;
      }
      try {
        const result = await deleteStudentCascade(user.schoolId, id, { id: user.id, schoolId: user.schoolId, role: user.role }, student?.name);
        if (result.success) {
          toast.success(`${student?.name} and ${result.deletedCounts.attendance + result.deletedCounts.fees + result.deletedCounts.results} records removed`);
        } else {
          toast.error(result.error || "Delete failed");
        }
      } catch (e) {
        toast.error("Delete failed");
      }
      setConfirmDeleteId(null);
      setActiveDropdown(null);
  };

  const filteredStudents = students.filter(s => 
    (s.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
    (s.rollNo || '').toString().includes(searchTerm) ||
    (s.uniqueId || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-32 md:pb-6 animate-fade-in-up" onClick={() => setActiveDropdown(null)}>
      
      {/* Premium Header */}
      <div className="bg-gradient-to-br from-indigo-900 to-indigo-700 text-white p-6 md:p-10 rounded-[2.5rem] md:rounded-[3rem] shadow-2xl relative overflow-hidden border border-white/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
         <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 blur-[100px] rounded-full transform translate-x-1/3 -translate-y-1/3" aria-hidden="true" />
         
         <div className="relative z-10">
            <h2 className="text-3xl md:text-4xl font-black tracking-tight">Class Roster</h2>
            <div className="flex items-center gap-3 mt-3">
               <span className="px-3 py-1 bg-white/10 text-white rounded-full text-[10px] font-black uppercase tracking-widest backdrop-blur-md">
                  Class {user.classId || 'Not Assigned'}
               </span>
               <span className="text-[10px] font-black text-indigo-200 uppercase tracking-widest">
                  {students.length} Total Students
               </span>
            </div>
         </div>
         <div className="relative z-10 flex flex-col md:flex-row gap-4 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
               <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50" />
               <input 
                  type="text"
                  placeholder="Find student..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 bg-white/10 border border-white/10 rounded-2xl text-sm font-bold text-white placeholder:text-white/50 focus:bg-white/20 outline-none transition-all backdrop-blur-md"
               />
            </div>
            <button 
              onClick={(e) => { e.stopPropagation(); setShowAddModal(true); }}
              className="bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-emerald-500/30 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
               <UserPlus size={16} /> Add Student
            </button>
         </div>
      </div>

      {/* Roster Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
         {loading ? (
            [1,2,3,4].map(i => (
               <div key={i} className="h-64 bg-white dark:bg-slate-900 rounded-[2.5rem] animate-pulse border border-slate-100 dark:border-white/5" />
            ))
         ) : filteredStudents.length === 0 ? (
            <div className="col-span-full py-20 text-center bg-white dark:bg-slate-900 rounded-[3rem] border-2 border-dashed border-slate-100 dark:border-slate-800">
               <Users size={48} className="mx-auto text-slate-200 mb-4" />
               <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No students found in this class</p>
            </div>
         ) : (
            filteredStudents.map(student => (
               <div key={student.id} className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-[2.5rem] p-5 sm:p-8 border border-slate-100 dark:border-white/5 shadow-sm relative group hover:shadow-2xl hover:border-indigo-500/30 transition-all overflow-hidden">
                  
                  {/* Card Background Decoration */}
                  <div className="absolute top-[-20px] right-[-20px] text-8xl font-black text-slate-50 dark:text-white/5 pointer-events-none select-none -rotate-12 group-hover:rotate-0 transition-transform">
                     {student.rollNo}
                  </div>

                  <div className="relative z-10">
                     <div className="flex justify-between items-start mb-6">
                        <Avatar 
                          src={student.avatar} 
                          name={student.name} 
                          size="xl"
                          className="rounded-2xl border border-indigo-100 dark:border-indigo-800/30 shadow-lg"
                        />
                        <div className="relative">
                            <button 
                              onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveDropdown(activeDropdown === student.id ? null : student.id);
                              }}
                              className="text-slate-300 hover:text-indigo-600 p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                            >
                                <MoreVertical size={20} />
                            </button>
                            {activeDropdown === student.id && (
                                <div className="absolute right-0 top-12 w-48 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-100 dark:border-white/5 z-20 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                                    <button
                                      onClick={() => openEditModal(student)}
                                      className="w-full text-left px-5 py-4 text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 flex items-center gap-3"
                                    >
                                        <Edit size={14} /> Edit Profile
                                    </button>
                                    <button
                                      onClick={() => {
                                        setActiveDropdown(null);
                                        setConfirmDeleteId(student.id);
                                      }}
                                      className="w-full text-left px-5 py-4 text-[10px] font-black uppercase tracking-widest text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/10 flex items-center gap-3"
                                    >
                                        <Trash2 size={14} /> Remove Student
                                    </button>
                                </div>
                            )}
                        </div>
                     </div>

                     <div className="space-y-1 mb-6">
                        <h3 className="font-black text-slate-900 dark:text-white text-xl tracking-tight truncate">{student.name}</h3>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{student.uniqueId}</p>
                     </div>

                     <div className="pt-6 border-t border-slate-50 dark:border-white/5 flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                           <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Parent Link</span>
                           {student.isLinked ? (
                              <span className="px-3 py-1 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500 rounded-lg text-[8px] font-black uppercase tracking-widest flex items-center gap-1">
                                 <BadgeCheck size={10} /> Active
                              </span>
                           ) : (
                              <span className="px-3 py-1 bg-amber-50 dark:bg-amber-900/20 text-amber-500 rounded-lg text-[8px] font-black uppercase tracking-widest">
                                 Pending
                              </span>
                           )}
                        </div>
                        
                        {!student.isLinked && (
                           <button 
                              onClick={(e) => { e.stopPropagation(); handleInviteClick(student); }}
                              className="w-full py-3 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all flex items-center justify-center gap-2 mt-2"
                           >
                              <Share2 size={12} /> Share Invite
                           </button>
                        )}
                        
                        {student.isLinked && (
                           <button className="w-full py-3 bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 rounded-xl text-[9px] font-black uppercase tracking-widest hover:text-indigo-500 transition-all flex items-center justify-center gap-2 mt-2">
                              <ExternalLink size={12} /> Contact Parent
                           </button>
                        )}
                     </div>
                  </div>
               </div>
            ))
         )}
      </div>

      {/* Add Student Modal */}
      {showAddModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
              <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-[2rem] sm:rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 max-h-[90vh] overflow-y-auto">
                  <div className="p-5 sm:p-8 bg-indigo-600 text-white flex justify-between items-center shrink-0">
                      <div>
                        <h3 className="text-2xl font-black tracking-tight">Onboard Student</h3>
                        <p className="text-indigo-100 text-xs font-bold uppercase tracking-widest mt-1">Class {user.classId}</p>
                      </div>
                      <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-white/10 rounded-xl transition-all"><X size={24} /></button>
                  </div>
                  
                  <div className="p-6 sm:p-10 grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 overflow-y-auto">
                      <div className="space-y-6">
                          <div className="flex items-center gap-3 mb-2">
                              <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 font-black text-xs">1</div>
                              <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Student Profile</h4>
                          </div>
                          
                          <div className="space-y-4">
                             <div>
                                 <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 mb-2">Full Name</label>
                                 <input 
                                     type="text"
                                     value={studentForm.name}
                                     onChange={(e) => setStudentForm({...studentForm, name: e.target.value})}
                                     placeholder="Enter student name"
                                     className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl font-bold text-sm outline-none focus:ring-4 focus:ring-indigo-500/10 dark:text-white"
                                 />
                             </div>
                             <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 mb-2">Roll No</label>
                                    <input 
                                        type="number"
                                        value={studentForm.rollNo}
                                        onChange={(e) => setStudentForm({...studentForm, rollNo: e.target.value})}
                                        className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl font-bold text-sm outline-none focus:ring-4 focus:ring-indigo-500/10 dark:text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 mb-2">Gender</label>
                                    <select 
                                        value={studentForm.gender}
                                        onChange={(e) => setStudentForm({...studentForm, gender: e.target.value})}
                                        className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl font-bold text-sm outline-none focus:ring-4 focus:ring-indigo-500/10 dark:text-white appearance-none"
                                    >
                                        <option value="MALE">Male</option>
                                        <option value="FEMALE">Female</option>
                                    </select>
                                </div>
                             </div>
                          </div>
                      </div>

                      <div className="space-y-6">
                          <div className="flex items-center gap-3 mb-2">
                              <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 font-black text-xs">2</div>
                              <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Parent Info</h4>
                          </div>
                          
                          <div className="space-y-4">
                             <div>
                                 <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 mb-2">Guardian Name</label>
                                 <div className="relative">
                                    <Baby size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input 
                                        type="text"
                                        value={studentForm.parentName}
                                        onChange={(e) => setStudentForm({...studentForm, parentName: e.target.value})}
                                        placeholder="Father/Mother name"
                                        className="w-full pl-14 pr-6 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl font-bold text-sm outline-none focus:ring-4 focus:ring-indigo-500/10 dark:text-white"
                                    />
                                 </div>
                             </div>
                             <div>
                                 <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 mb-2">Email Address</label>
                                 <div className="relative">
                                    <Mail size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input 
                                        type="email"
                                        value={studentForm.parentEmail}
                                        onChange={(e) => setStudentForm({...studentForm, parentEmail: e.target.value})}
                                        placeholder="parent@example.com"
                                        className="w-full pl-14 pr-6 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl font-bold text-sm outline-none focus:ring-4 focus:ring-indigo-500/10 dark:text-white"
                                    />
                                 </div>
                             </div>
                             <div>
                                 <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 mb-2">Phone Number</label>
                                 <div className="relative">
                                    <Phone size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input 
                                        type="tel"
                                        value={studentForm.parentPhone}
                                        onChange={(e) => setStudentForm({...studentForm, parentPhone: e.target.value})}
                                        placeholder="+91..."
                                        className="w-full pl-14 pr-6 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl font-bold text-sm outline-none focus:ring-4 focus:ring-indigo-500/10 dark:text-white"
                                    />
                                 </div>
                             </div>
                          </div>
                      </div>
                  </div>

                  <div className="p-6 sm:p-8 bg-slate-50 dark:bg-slate-800/50 flex justify-end gap-4 border-t border-slate-100 dark:border-white/5">
                      <button onClick={() => setShowAddModal(false)} className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-slate-700 transition-all">Cancel</button>
                      <button 
                        onClick={saveNewStudent} 
                        disabled={isSaving}
                        className="px-10 py-4 bg-indigo-600 text-white font-black text-[10px] uppercase tracking-widest rounded-2xl shadow-sm shadow-indigo-500/20 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3"
                      >
                          {isSaving ? <Check className="animate-spin" size={16} /> : <Save size={16} />}
                          Create Identity
                      </button>
                  </div>
              </div>
          </div>
      )}

      {showEditModal && editingStudent && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in" onClick={() => setShowEditModal(false)}>
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-lg shadow-2xl border border-slate-100 dark:border-white/5 overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="p-6 sm:p-8 border-b border-slate-100 dark:border-white/5 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Edit Student</h2>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{editingStudent.uniqueId}</p>
              </div>
              <button onClick={() => setShowEditModal(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 sm:p-8 space-y-4 max-h-[60vh] overflow-y-auto">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Full Name *</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Roll Number *</label>
                <input
                  type="text"
                  value={editForm.rollNo}
                  onChange={e => setEditForm(f => ({ ...f, rollNo: e.target.value }))}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Parent Name</label>
                <input
                  type="text"
                  value={editForm.parentName}
                  onChange={e => setEditForm(f => ({ ...f, parentName: e.target.value }))}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Parent Email</label>
                <input
                  type="email"
                  value={editForm.parentEmail}
                  onChange={e => setEditForm(f => ({ ...f, parentEmail: e.target.value }))}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Parent Phone</label>
                <input
                  type="tel"
                  value={editForm.parentPhone}
                  onChange={e => setEditForm(f => ({ ...f, parentPhone: e.target.value }))}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
            <div className="p-4 sm:p-6 bg-slate-50 dark:bg-slate-800/50 flex justify-end gap-3 border-t border-slate-100 dark:border-white/5">
              <button onClick={() => setShowEditModal(false)} className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-slate-700 transition-all">Cancel</button>
              <button
                onClick={saveEdit}
                disabled={isEditing}
                className="px-8 py-3 bg-indigo-600 text-white font-black text-[10px] uppercase tracking-widest rounded-2xl hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
              >
                {isEditing ? <Check className="animate-spin" size={14} /> : <Save size={14} />}
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Confirm Delete Modal */}
      {confirmDeleteId && (() => {
        const student = students.find(s => s.id === confirmDeleteId);
        if (!student) return null;
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md" onClick={() => setConfirmDeleteId(null)}>
            <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[2.5rem] shadow-2xl border border-slate-100 dark:border-white/5 overflow-hidden" onClick={e => e.stopPropagation()}>
              <div className="p-6 sm:p-8 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-rose-50 dark:bg-rose-900/20 text-rose-500 flex items-center justify-center">
                  <Trash2 size={28} />
                </div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Remove {student.name}?</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                  This will permanently delete all their records (attendance, fees, results). This cannot be undone.
                </p>
              </div>
              <div className="p-6 bg-slate-50 dark:bg-slate-800/50 flex justify-end gap-3 border-t border-slate-100 dark:border-white/5">
                <button onClick={() => setConfirmDeleteId(null)} className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-slate-700 transition-all">
                  Cancel
                </button>
                <button
                  onClick={() => deleteStudent(confirmDeleteId)}
                  className="px-8 py-3 bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all flex items-center gap-2"
                >
                  <Trash2 size={14} /> Delete Permanently
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Invite Modal */}
      {showInviteModal && selectedStudent && (
         <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-300" onClick={(e) => e.stopPropagation()}>
            <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[3rem] shadow-2xl p-10 text-center relative animate-in zoom-in-95 duration-300">
               <button onClick={() => setShowInviteModal(false)} className="absolute top-8 right-8 text-slate-400 hover:text-slate-600 transition-all"><X size={24} /></button>
               
               <div className="w-24 h-24 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 shadow-inner">
                  <Share2 size={40} />
               </div>
               <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">Parent Linkage</h3>
               <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-8 leading-relaxed">
                  Share this secure link with <strong>{selectedStudent.name}'s</strong> family to activate their portal access.
               </p>

               <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl flex items-center gap-4 mb-8 border border-slate-100 dark:border-white/5">
                  <p className="text-xs text-slate-400 font-mono truncate flex-1 text-left">
                     smartschool.app/join/p/{selectedStudent.id}...
                  </p>
                  <button onClick={copyInviteLink} className="p-3 bg-white dark:bg-slate-900 text-indigo-600 rounded-xl shadow-sm hover:scale-110 transition-all">
                     {inviteLinkCopied ? <Check size={18} /> : <Copy size={18} />}
                  </button>
               </div>

               <button 
                  onClick={handleWhatsAppInvite}
                  className="w-full py-5 bg-[#25D366] text-white font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-[#128C7E] shadow-sm shadow-green-500/20 transition-all flex items-center justify-center gap-3"
               >
                  Share on WhatsApp
               </button>
            </div>
         </div>
      )}

    </div>
  );
};

export default StudentManager;
