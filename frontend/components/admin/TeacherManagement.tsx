import React, { useState } from 'react';
import { User, UserRole } from '@/types';
import { useSchoolData } from '@/hooks/useFirestore';
import { Search, Plus, Mail, Phone, Edit, Users, X, Save, GraduationCap, Loader2, SendHorizonal, CheckCircle2, Clock, Eye, RefreshCw, Trash2, Power, PowerOff } from 'lucide-react';
import Avatar from '../shared/Avatar';
import { getDeterministicAvatar } from '@/constants';
import { toast } from 'react-hot-toast';
import { db } from '@/services/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { generateTempPassword, generateWaMeLink } from '@/utils/whatsapp';
import { hashCredential, generateSalt } from '@/utils/crypto';
import { generateId } from '@/lib/utils';

interface Props {
  user: User;
  onViewProfile?: (userId: string, role?: UserRole) => void;
}

const TeacherManagement: React.FC<Props> = ({ user, onViewProfile }) => {
  const { users, loading } = useSchoolData(user.schoolId);
  const teachers = users.filter(u => u.role === UserRole.TEACHER);

  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<User | null>(null);

  const [resentIds, setResentIds] = useState<string[]>([]);
  const [saveLoading, setSaveLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    classId: '',
    subjects: '',
    gender: 'MALE',
    qualification: '',
    experience: '',
    address: ''
  });

  const handleEdit = (teacher: User) => {
    setEditingTeacher(teacher);
    setFormData({
      name: teacher.name,
      email: teacher.email,
      phone: teacher.phone || '',
      classId: teacher.classId || '',
      subjects: teacher.subjects?.join(', ') || '',
      gender: teacher.gender || 'MALE',
      qualification: teacher.qualification || '',
      experience: teacher.experience || '',
      address: teacher.address || ''
    });
    setShowModal(true);
  };

  const handleAdd = () => {
    setEditingTeacher(null);
    setFormData({
      name: '',
      email: '',
      phone: '',
      classId: '',
      subjects: '',
      gender: 'MALE',
      qualification: '',
      experience: '',
      address: ''
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    const cleanName = formData.name.trim();
    const cleanEmail = formData.email.trim().toLowerCase();
    const cleanPhone = formData.phone.trim();
    const schoolId = user.schoolId;

    if (!schoolId) return toast.error("School context missing. Please re-login.");
    if (!cleanName || !cleanEmail) return toast.error("Name and Email are required.");

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) return toast.error("Invalid email format");

    if (cleanPhone && /^\d{10}$/.test(cleanPhone) === false) return toast.error("Phone number must be 10 digits");

    if (!editingTeacher && teachers.some(t => t.email.toLowerCase() === cleanEmail)) {
      return toast.error("A teacher with this email already exists");
    }

    setSaveLoading(true);
    try {
      const teacherId = editingTeacher?.id || `tch_${generateId().slice(0, 12)}`;
      const uniqueId = editingTeacher?.uniqueId || `TCH-${Date.now().toString(36).toUpperCase()}-${generateId().slice(0, 6).toUpperCase()}`;
      const tempPassword = !editingTeacher ? generateTempPassword() : undefined;
      const passwordHash = tempPassword ? await hashCredential(tempPassword, generateSalt()) : undefined;

      const teacherData: Record<string, unknown> = {
        id: teacherId,
        name: cleanName,
        email: cleanEmail,
        phone: cleanPhone,
        role: UserRole.TEACHER,
        schoolId: schoolId,
        classId: formData.classId,
        subjects: formData.subjects.split(',').map(s => s.trim()).filter(Boolean),
        gender: formData.gender,
        qualification: formData.qualification,
        experience: formData.experience,
        address: formData.address,
        uniqueId,
        status: editingTeacher?.status || 'INVITED',
        avatar: editingTeacher?.avatar || getDeterministicAvatar(cleanName, UserRole.TEACHER),
        ...(passwordHash ? { passwordHash, isFirstLogin: true } : {})
      };

      if (editingTeacher) {
        await setDoc(doc(db, 'schools', schoolId, 'users', teacherId), teacherData, { merge: true });
        toast.success("Profile updated successfully!");
      } else {
        await setDoc(doc(db, 'schools', schoolId, 'users', teacherId), teacherData);

        if (tempPassword && cleanPhone) {
          try {
            const waLink = generateWaMeLink(cleanPhone, 'TEACHER_INVITE', {
              schoolName: user.schoolName || 'SmartSchool',
              name: cleanName,
              uniqueId,
              credential: tempPassword
            });
            window.open(waLink, '_blank');
          } catch {
            // WhatsApp optional
          }
        }

        toast.success(`Teacher invited! Credentials sent via WhatsApp.`);
      }

      setShowModal(false);
    } catch (err: unknown) {
      console.error("Teacher Save Failure:", err);
      toast.error("Critical: Database sync failed");
    } finally {
      setSaveLoading(false);
    }
  };

  const handleResetPassword = async (teacher: User) => {
    if (!teacher.phone || !teacher.uniqueId) {
      toast.error('Teacher must have phone and unique ID to reset password');
      return;
    }
    const newPass = generateTempPassword();
    try {
      const salt = generateSalt();
      const passwordHash = await hashCredential(newPass, salt);
      await setDoc(doc(db, 'schools', user.schoolId, 'users', teacher.id), {
        passwordHash,
        salt,
        isFirstLogin: true,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      const waLink = generateWaMeLink(teacher.phone, 'CREDENTIAL_RESET', {
        schoolName: user.schoolName || 'SmartSchool',
        name: teacher.name,
        uniqueId: teacher.uniqueId,
        credential: newPass,
        role: 'TEACHER'
      });
      window.open(waLink, '_blank');
      toast.success(`Password reset for ${teacher.name}. New credentials sent via WhatsApp.`);
    } catch (err) {
      console.error('Reset password failed:', err);
      toast.error('Failed to reset password');
    }
  };

  const handleResendInvite = async (teacher: User) => {
    if (!teacher.phone) {
      toast.error('Cannot resend invite: teacher has no phone number');
      return;
    }
    const teacherId = teacher.id;
    setResentIds(prev => [...prev, teacherId]);
    try {
      const newPass = generateTempPassword();
      const salt = generateSalt();
      const passwordHash = await hashCredential(newPass, salt);
      await setDoc(doc(db, 'schools', user.schoolId, 'users', teacherId), {
        passwordHash,
        salt,
        isFirstLogin: true,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      const waLink = generateWaMeLink(teacher.phone, 'TEACHER_INVITE', {
        schoolName: user.schoolName || 'SmartSchool',
        name: teacher.name,
        uniqueId: teacher.uniqueId || '',
        credential: newPass,
        loginUrl: window.location.origin
      });
      window.open(waLink, '_blank');
      toast.success('Invite re-sent via WhatsApp');
    } catch (err) {
      console.error('Resend invite failed:', err);
      toast.error('Failed to resend invite');
    } finally {
      setTimeout(() => setResentIds(prev => prev.filter(id => id !== teacherId)), 5000);
    }
  };

  const handleToggleStatus = async (teacher: User) => {
    if (!teacher.id) return;
    const newStatus = teacher.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE';
    try {
      await setDoc(doc(db, 'schools', user.schoolId, 'users', teacher.id), { status: newStatus }, { merge: true });
      toast.success(`Teacher ${newStatus === 'ACTIVE' ? 'activated' : 'deactivated'} successfully`);
    } catch {
      toast.error('Failed to update status');
    }
  };

  const handleDelete = async (teacher: User) => {
    if (!confirm(`Are you sure you want to delete teacher "${teacher.name}"? This action cannot be undone.`)) return;
    try {
      const { deleteDoc } = await import('firebase/firestore');
      await deleteDoc(doc(db, 'schools', user.schoolId, 'users', teacher.id));
      toast.success('Teacher deleted successfully');
    } catch {
      toast.error('Failed to delete teacher');
    }
  };

  const filteredTeachers = teachers.filter(t =>
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.subjects?.some(s => s.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) return <div className="p-10 flex justify-center"><Loader2 className="animate-spin text-indigo-600" /></div>;

  return (
    <div className="space-y-6 pb-20 md:pb-0 animate-fade-in-up">

      {/* Header */}
      <div className="bg-gradient-to-br from-indigo-900 to-indigo-700 text-white p-6 md:p-10 rounded-[2.5rem] md:rounded-[3rem] shadow-2xl relative overflow-hidden border border-white/10 flex flex-col md:flex-row justify-between gap-6">
         <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 blur-[100px] rounded-full transform translate-x-1/3 -translate-y-1/3" aria-hidden="true" />
         
         <div className="relative z-10 flex-1">
          <div className="flex items-center gap-2 px-3 py-1 bg-white/10 text-indigo-100 rounded-full w-fit mb-3 backdrop-blur-md">
            <GraduationCap size={12} />
            <span className="text-[10px] font-black uppercase tracking-widest">Faculty Management</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight mb-2">Teacher Directory</h1>
          <p className="text-indigo-200 font-medium text-sm max-w-xl">Manage staff and monitor invite statuses across the institution.</p>
        </div>

        <div className="relative z-10 flex flex-col md:flex-row gap-3 w-full md:w-auto items-start md:items-end">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50" size={16} />
            <input
              type="text"
              placeholder="Search teachers..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-4 bg-white/10 border border-white/10 rounded-2xl outline-none focus:ring-2 focus:ring-white/30 text-white placeholder-white/50 text-sm font-medium backdrop-blur-md transition-all"
            />
          </div>
          <button
            onClick={handleAdd}
            className="px-8 py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-emerald-500/30 flex items-center justify-center gap-2 transition-all active:scale-95 w-full md:w-auto"
          >
            <Plus size={16} /> Add Teacher
          </button>
        </div>
      </div>

      {/* Teacher Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTeachers.map(teacher => (
          <div key={teacher.id} className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-indigo-500/50 transition-all group">

            {/* Card Header: Avatar + Invite Status + Edit */}
            <div className="flex items-start justify-between mb-6">
              <Avatar src={teacher.avatar} name={teacher.name} role={UserRole.TEACHER} size="xl" className="border-2 border-white dark:border-slate-800 shadow-sm" />
              <div className="flex flex-col items-end gap-2">
                {teacher.isLinked ? (
                  <span className="flex items-center gap-1 px-2.5 py-1 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-full text-[10px] font-bold border border-green-100 dark:border-green-900/30">
                    <CheckCircle2 size={10} /> App Linked
                  </span>
                ) : (
                  <span className="flex items-center gap-1 px-2.5 py-1 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 rounded-full text-[10px] font-bold border border-amber-100 dark:border-amber-900/30">
                    <Clock size={10} /> Invite Pending
                  </span>
                )}
                <div className="flex gap-1">
                  <button
                    onClick={() => handleToggleStatus(teacher)}
                    className="p-1.5 bg-gray-100 dark:bg-slate-800 hover:bg-orange-100 dark:hover:bg-orange-900/30 hover:text-orange-600 rounded-lg transition-colors"
                    title={teacher.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                    aria-label={`${teacher.status === 'ACTIVE' ? 'Deactivate' : 'Activate'} ${teacher.name}`}
                  >
                    {teacher.status === 'ACTIVE' ? <PowerOff size={14} /> : <Power size={14} />}
                  </button>
                  <button
                    onClick={() => handleDelete(teacher)}
                    className="p-1.5 bg-gray-100 dark:bg-slate-800 hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-600 rounded-lg transition-colors"
                    title="Delete Teacher"
                    aria-label={`Delete ${teacher.name}`}
                  >
                    <Trash2 size={14} />
                  </button>
                  <button
                    onClick={() => handleEdit(teacher)}
                    className="p-1.5 bg-gray-100 dark:bg-slate-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 hover:text-indigo-600 rounded-lg transition-colors"
                    title="Quick Edit"
                    aria-label={`Edit ${teacher.name}`}
                  >
                    <Edit size={14} />
                  </button>
                  <button
                    onClick={() => onViewProfile?.(teacher.id, UserRole.TEACHER)}
                    className="p-1.5 bg-gray-100 dark:bg-slate-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 hover:text-indigo-600 rounded-lg transition-colors"
                    title="Full Dossier"
                    aria-label={`View ${teacher.name} profile`}
                  >
                    <Eye size={14} />
                  </button>
                </div>
              </div>
            </div>

            <h3 className="text-lg font-bold text-gray-900 dark:text-white">{teacher.name}</h3>
            <div className="space-y-2 mt-3">
              <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                <Mail size={14} /> {teacher.email}
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                <Phone size={14} /> {teacher.phone}
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-slate-800 space-y-3">
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase mb-1">Class Teacher Of</p>
                {teacher.classId ? (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 rounded-md text-xs font-bold">
                    <Users size={12} /> Class {teacher.classId}
                  </span>
                ) : (
                  <span className="text-xs text-gray-400 italic">Not assigned</span>
                )}
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase mb-1">Subjects</p>
                <div className="flex flex-wrap gap-2">
                  {teacher.subjects && teacher.subjects.length > 0
                    ? teacher.subjects.map(sub => (
                      <span key={sub} className="px-2 py-1 bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300 rounded-md text-xs font-medium border border-gray-200 dark:border-slate-700">
                        {sub}
                      </span>
                    ))
                    : <span className="text-xs text-gray-400 italic">No subjects assigned</span>
                  }
                </div>
              </div>

              <div className="flex gap-2 mt-4">
                {!teacher.isLinked && (
                  <button
                    onClick={() => handleResendInvite(teacher)}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${resentIds.includes(teacher.id)
                      ? 'bg-green-50 dark:bg-green-900/10 text-green-600 dark:text-green-400 border border-green-200 dark:border-green-900/30'
                      : 'bg-amber-50 dark:bg-amber-900/10 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900/30 hover:bg-amber-100 dark:hover:bg-amber-900/20'
                      }`}
                  >
                    {resentIds.includes(teacher.id)
                      ? <><CheckCircle2 size={14} /> Invite Sent!</>
                      : <><SendHorizonal size={14} /> Resend Invite</>
                    }
                  </button>
                )}
                <button
                  onClick={() => handleResetPassword(teacher)}
                  title="Reset Password & Send WhatsApp"
                  className="flex-1 py-2.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 rounded-xl text-xs font-bold border border-emerald-100 dark:border-emerald-900/30 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-all flex items-center justify-center gap-2"
                >
                  <RefreshCw size={14} /> Reset Password
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Edit/Add Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in-up">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center bg-indigo-600 text-white">
              <h3 className="text-lg font-bold">{editingTeacher ? 'Edit Teacher' : 'Add New Teacher'}</h3>
              <button onClick={() => setShowModal(false)} className="hover:bg-indigo-500 p-1 rounded transition-colors"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Full Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Gender</label>
                  <select
                    value={formData.gender}
                    onChange={e => setFormData({ ...formData, gender: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                  >
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Phone</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Qualification</label>
                  <input
                    type="text"
                    value={formData.qualification}
                    onChange={e => setFormData({ ...formData, qualification: e.target.value })}
                    placeholder="e.g. M.Sc, B.Ed"
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Assigned Class</label>
                  <input
                    type="text"
                    value={formData.classId}
                    onChange={e => setFormData({ ...formData, classId: e.target.value })}
                    placeholder="e.g. 10-A"
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Subjects</label>
                <input
                  type="text"
                  value={formData.subjects}
                  onChange={e => setFormData({ ...formData, subjects: e.target.value })}
                  placeholder="Maths, Physics..."
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                />
              </div>
            </div>
            <div className="p-6 bg-gray-50 dark:bg-slate-800/50 flex justify-end gap-3 border-t border-gray-100 dark:border-slate-800">
              <button onClick={() => setShowModal(false)} className="px-6 py-3 text-gray-600 dark:text-gray-300 font-black text-[10px] uppercase tracking-widest hover:bg-gray-100 dark:hover:bg-slate-700 rounded-xl transition-all">Cancel</button>
              <button
                onClick={handleSave}
                className="px-8 py-3 bg-indigo-600 text-white font-black text-[10px] uppercase tracking-widest rounded-xl shadow-sm shadow-indigo-600/20 hover:bg-indigo-700 flex items-center gap-2 transition-all active:scale-95"
              >
                <Save size={16} />
                Save Faculty Record
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherManagement;

