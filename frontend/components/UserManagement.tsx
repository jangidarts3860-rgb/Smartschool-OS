import React, { useState, useMemo, useEffect, useRef } from 'react';
import { User, UserRole } from '@/types';
import { getDeterministicAvatar } from '@/constants';
import { useSchoolData } from '@/hooks/useFirestore';
import { userService } from '@/services/firestore';
import StudentIDCard from '@/components/admin/StudentIDCard';
import Avatar from '@/components/shared/Avatar';
import {
  Search,
  Plus,
  Edit,
  Trash2,
  X,
  Save,
  AlertTriangle,
  Users,
  Power,
  Lock,
  Fingerprint,
  Send,
  UploadCloud,
  CheckCircle2,
  FileCheck,
  BadgeCheck,
  Download,
  Loader2,
  MoreVertical,
  Activity,
  ChevronRight
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { generateTempPassword } from '@/utils/whatsapp';
import { generateSalt, hashCredential } from '@/utils/crypto';
import Papa from 'papaparse';
import { generateId } from '@/lib/utils';

interface Props {
    currentUser: User;
    onViewProfile?: (userId: string, role?: UserRole) => void;
}

const UserManagement: React.FC<Props> = ({ currentUser, onViewProfile }) => {
    const { users, loading } = useSchoolData(currentUser.schoolId);
    const [activeFilter, setActiveFilter] = useState<'ALL' | UserRole | 'KYC_PENDING' | 'NO_BIOMETRIC'>('ALL');
    const [searchTerm, setSearchTerm] = useState('');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [userToDelete, setUserToDelete] = useState<User | null>(null);
    const [idCardStudents, setIdCardStudents] = useState<User[] | null>(null);
    const [bulkFile, setBulkFile] = useState<File | null>(null);
    const [bulkResults, setBulkResults] = useState<{ created: number; skipped: number; errors: string[] } | null>(null);
    const bulkInputRef = useRef<HTMLInputElement>(null);

    const [newUser, setNewUser] = useState({
        name: '',
        email: '',
        role: UserRole.STUDENT,
        uniqueId: ''
    });

    const PAGE_SIZE = 20;
    const [currentPage, setCurrentPage] = useState(1);

    const filteredUsers = useMemo(() => {
        return users.filter(u => {
            const nameMatch = (u.name || '').toLowerCase().includes(searchTerm.toLowerCase());
            const emailMatch = (u.email || '').toLowerCase().includes(searchTerm.toLowerCase());
            const idMatch = (u.uniqueId || '').toLowerCase().includes(searchTerm.toLowerCase());
            const matchesSearch = nameMatch || emailMatch || idMatch;

            const matchesFilter =
                activeFilter === 'ALL' ? true :
                activeFilter === 'KYC_PENDING' ? u.kycStatus === 'PENDING' :
                activeFilter === 'NO_BIOMETRIC' ? !u.biometricRegistered :
                u.role === activeFilter;

            return matchesSearch && matchesFilter;
        });
    }, [searchTerm, activeFilter, users]);

    const totalPages = Math.max(1, Math.ceil(filteredUsers.length / PAGE_SIZE));
    const safePage = Math.min(currentPage, totalPages);
    const paginatedUsers = useMemo(() => {
      const start = (safePage - 1) * PAGE_SIZE;
      return filteredUsers.slice(start, start + PAGE_SIZE);
    }, [filteredUsers, safePage]);

    useEffect(() => { setCurrentPage(1); }, [searchTerm, activeFilter]);

    const hasConflict = (uniqueId: string) => {
        return users.filter(u => u.uniqueId === uniqueId).length > 1;
    };

    // Stats derived from real data
    const stats = useMemo(() => ({
        active: users.length,
        pendingKyc: users.filter(u => u.kycStatus === 'PENDING').length
    }), [users]);

    const handleAddIndividual = async () => {
        if (!newUser.name || !newUser.email || !newUser.uniqueId) {
            return toast.error('Please fill in name, email, and unique ID');
        }
        if (users.some(u => u.uniqueId === newUser.uniqueId)) {
            return toast.error(`Unique ID ${newUser.uniqueId} already exists`);
        }
        if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(newUser.email)) {
            return toast.error('Invalid email format');
        }
        setIsSaving(true);
        try {
            const tempPassword = newUser.role === UserRole.STUDENT || newUser.role === UserRole.PARENT
                        ? (() => { const a = new Uint32Array(1); crypto.getRandomValues(a); return String(1000 + (a[0]! % 9000)); })()
                : generateTempPassword();
            const salt = generateSalt();
            const passwordHash = await hashCredential(tempPassword, salt);

                    const userId = `u_${Date.now()}_${generateId().slice(0, 6)}`;
            const payload: User = {
                id: userId,
                name: newUser.name.trim(),
                email: newUser.email.trim().toLowerCase(),
                role: newUser.role,
                uniqueId: newUser.uniqueId.trim(),
                schoolId: currentUser.schoolId,
                status: 'PENDING',
                kycStatus: 'PENDING',
                biometricRegistered: false,
                isFirstLogin: true,
                createdAt: new Date().toISOString() as any,
                avatar: getDeterministicAvatar(newUser.name, newUser.role),
                passwordHash,
                passwordSalt: salt
            };

            await userService.createUser(payload);
            toast.success(`User created. ${newUser.role === UserRole.STUDENT || newUser.role === UserRole.PARENT ? 'PIN' : 'Temp password'}: ${tempPassword}`, { duration: 8000 });
            setIsAddModalOpen(false);
            setNewUser({ name: '', email: '', role: UserRole.STUDENT, uniqueId: '' });
        } catch (err: any) {
            console.error('Create user failed:', err);
            toast.error(err?.message || 'Failed to create user');
        } finally {
            setIsSaving(false);
        }
    };

    const handleBulkFile = (file: File) => {
        setBulkFile(file);
        setBulkResults(null);
    };

    const handleBulkImport = async () => {
        if (!bulkFile) {
            return toast.error('Please select a CSV file first');
        }
        setIsSaving(true);
        try {
            const text = await bulkFile.text();
            const parsed = Papa.parse<Record<string, string>>(text, { header: true, skipEmptyLines: true });
            const rows = parsed.data || [];

            let created = 0;
            let skipped = 0;
            const errors: string[] = [];

            for (const row of rows) {
                const name = (row.name || row.Name || '').trim();
                const email = (row.email || row.Email || '').trim().toLowerCase();
                const uniqueId = (row.uniqueId || row.unique_id || row.ID || '').trim();
                const roleRaw = (row.role || row.Role || 'STUDENT').trim().toUpperCase();
                const role = (Object.values(UserRole) as string[]).includes(roleRaw) ? roleRaw as UserRole : UserRole.STUDENT;

                if (!name || !email || !uniqueId) {
                    errors.push(`Skipped row missing required fields: ${name || email || 'unknown'}`);
                    skipped++;
                    continue;
                }
                if (users.some(u => u.uniqueId === uniqueId) || rows.filter(r => (r.uniqueId || r.unique_id || r.ID || '').trim() === uniqueId).length > 1) {
                    errors.push(`Duplicate uniqueId: ${uniqueId}`);
                    skipped++;
                    continue;
                }

                try {
                    const salt = generateSalt();
                    const tempPwd = role === UserRole.STUDENT || role === UserRole.PARENT
                ? (() => { const a = new Uint32Array(1); crypto.getRandomValues(a); return String(1000 + (a[0]! % 9000)); })()
                        : generateTempPassword();
                    const passwordHash = await hashCredential(tempPwd, salt);

            const userId = `u_${Date.now()}_${generateId().slice(0, 6)}`;
                    await userService.createUser({
                        id: userId,
                        name,
                        email,
                        role,
                        uniqueId,
                        schoolId: currentUser.schoolId,
                        status: 'PENDING',
                        kycStatus: 'PENDING',
                        biometricRegistered: false,
                        isFirstLogin: true,
                        createdAt: new Date().toISOString() as any,
                        avatar: getDeterministicAvatar(name, role),
                        passwordHash,
                        passwordSalt: salt
                    });
                    created++;
                } catch (err: any) {
                    errors.push(`Failed: ${email} — ${err?.message || 'unknown error'}`);
                    skipped++;
                }
            }

            setBulkResults({ created, skipped, errors });
            toast.success(`Imported ${created} users${skipped ? `, ${skipped} skipped` : ''}`);
        } catch (err: any) {
            console.error('Bulk import failed:', err);
            toast.error(err?.message || 'Bulk import failed');
        } finally {
            setIsSaving(false);
        }
    };

    const downloadCsvTemplate = () => {
        const csv = 'name,email,uniqueId,role\nJohn Doe,john@example.com,STU-001,STUDENT\nJane Smith,jane@example.com,TCH-001,TEACHER\n';
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'user-import-template.csv';
        a.click();
        URL.revokeObjectURL(url);
    };

    const exportUsersCsv = () => {
        if (users.length === 0) return toast.error('No users to export');
        const rows = users.map(u => ({
            name: u.name || '',
            email: u.email || '',
            uniqueId: u.uniqueId || '',
            role: u.role || '',
            status: u.kycStatus || '',
            biometricRegistered: u.biometricRegistered ? 'yes' : 'no'
        }));
        const csv = Papa.unparse(rows);
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `users-export-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success('User directory exported');
    };

    return (
        <div className="w-full space-y-6 pb-24 page-enter">
            
            {/* 1. ADVANCED COMMAND CENTER (Header) */}
            <div className="bg-white dark:bg-slate-950 p-8 rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                <div>
                   <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Identity Center</h1>
                   <div className="flex items-center gap-4 mt-2">
                      <div className="flex items-center gap-2">
                         <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                         <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stats.active} Active Users</span>
                      </div>
                      <div className="flex items-center gap-2">
                         <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                         <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stats.pendingKyc} Pending KYC</span>
                      </div>
                   </div>
                </div>

                <div className="flex flex-wrap gap-3 w-full lg:w-auto lg:gap-4 lg:flex-nowrap">
                    <button
                        className="flex-1 lg:flex-none px-6 py-4 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all flex items-center justify-center gap-2"
                        onClick={() => {
                            const students = filteredUsers.filter(u => u.role === UserRole.STUDENT);
                            if (students.length === 0) return toast.error("No students selected");
                            setIdCardStudents(students);
                        }}
                    >
                        <BadgeCheck size={16} /> Batch ID Cards
                    </button>
                    <button
                        className="flex-1 lg:flex-none px-6 py-4 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all flex items-center justify-center gap-2"
                        onClick={exportUsersCsv}
                    >
                        <Download size={16} /> Export CSV
                    </button>
                    <button
                        onClick={() => setIsBulkModalOpen(true)}
                        className="flex-1 lg:flex-none px-6 py-4 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all flex items-center justify-center gap-2"
                    >
                        <UploadCloud size={16} /> Bulk Import
                    </button>
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="flex-1 lg:flex-none px-6 py-4 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-sm shadow-indigo-500/20 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
                    >
                        <Plus size={16} /> Add Individual
                    </button>
                </div>
            </div>

            {/* 2. ADVANCED FILTERS & SEARCH */}
            <div className="flex flex-col md:flex-row gap-4 items-center">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 translate-y-[2px] text-slate-400" size={18} />
                    <input 
                        type="text" 
                        placeholder="Search by name, email, or unique ID..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-14 pr-6 py-4 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 font-bold text-sm transition-all"
                    />
                </div>
                <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 md:pb-0 w-full md:w-auto">
                    {['ALL', UserRole.TEACHER, UserRole.STUDENT, 'KYC_PENDING', 'NO_BIOMETRIC'].map(filter => (
                        <button 
                            key={filter}
                            onClick={() => setActiveFilter(filter as any)}
                            className={`px-6 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all whitespace-nowrap ${activeFilter === filter ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg' : 'bg-white dark:bg-slate-900 text-slate-500 border-slate-200 dark:border-slate-800'}`}
                        >
                            {filter.replace('_', ' ')}
                        </button>
                    ))}
                </div>
            </div>

            {/* 3. USER GRID (Advanced Cards) */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                {loading ? (
                    [1,2,3,4,5,6].map(i => (
                        <div key={i} className="bg-white dark:bg-slate-950 rounded-[3rem] p-10 border-2 border-slate-50 dark:border-slate-900 animate-pulse">
                            <div className="flex items-center gap-6 mb-8">
                                <div className="w-20 h-20 bg-slate-100 dark:bg-slate-900 rounded-[2rem]"></div>
                                <div className="flex-1 space-y-2">
                                    <div className="h-5 bg-slate-100 dark:bg-slate-900 rounded w-3/4"></div>
                                    <div className="h-3 bg-slate-100 dark:bg-slate-900 rounded w-1/2"></div>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4 mb-8">
                                <div className="h-14 bg-slate-100 dark:bg-slate-900 rounded-2xl"></div>
                                <div className="h-14 bg-slate-100 dark:bg-slate-900 rounded-2xl"></div>
                            </div>
                            <div className="h-10 bg-slate-100 dark:bg-slate-900 rounded-full"></div>
                        </div>
                    ))
                ) : filteredUsers.length === 0 ? (
                    <div className="col-span-full py-20 text-center bg-white dark:bg-slate-900 rounded-[3rem] border-2 border-dashed border-slate-100 dark:border-slate-800">
                        <Users size={64} className="mx-auto text-slate-200 mb-4" />
                        <h4 className="text-xl font-black text-slate-400">No Users Found</h4>
                        <p className="text-slate-400 text-sm">Try adjusting your filters or search term</p>
                    </div>
                ) : (
                    paginatedUsers.map(user => (
                        <div key={user.id} className="bg-white dark:bg-slate-950 rounded-[3rem] p-10 border-2 border-slate-50 dark:border-slate-900 shadow-sm hover:shadow-2xl hover:border-indigo-500/30 transition-all group relative overflow-hidden">
                            
                            {/* Background Identity Decoration */}
                            <div className="absolute top-[-20px] right-[-20px] text-[100px] font-black text-slate-100 dark:text-slate-900/40 pointer-events-none select-none -rotate-12 group-hover:rotate-0 transition-transform">
                               {user.role?.charAt(0)}
                            </div>

                            <div className="relative z-10 space-y-8">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-6">
                                        <div className="relative">
                                           <Avatar src={user.avatar} name={user.name} role={user.role} size="2xl" className="rounded-[2rem] border-4 border-white dark:border-slate-900 shadow-lg" />
                                           <div className={`absolute -bottom-1 -right-1 p-2 rounded-xl shadow-md border-2 border-white dark:border-slate-950 ${user.biometricRegistered ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}>
                                              <Fingerprint size={12} />
                                           </div>
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                               <h3 className="text-xl font-black text-slate-900 dark:text-white leading-none">{user.name}</h3>
                                               {user.kycStatus === 'VERIFIED' && <BadgeCheck size={18} className="text-indigo-500" />}
                                            </div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{user.uniqueId}</p>
                                            {hasConflict(user.uniqueId) && (
                                                <span className="text-[8px] font-black text-rose-500 uppercase flex items-center gap-1 mt-1">
                                                    <AlertTriangle size={10} /> ID Conflict Detected
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="relative">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                const menu = document.getElementById(`menu-${user.id}`);
                                                if (menu) menu.classList.toggle('hidden');
                                            }}
                                            className="p-2 text-slate-300 hover:text-indigo-600 transition-colors rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
                                            aria-label="User actions menu"
                                        >
                                            <MoreVertical size={20} />
                                        </button>
                                        <div id={`menu-${user.id}`} className="hidden absolute right-0 top-full mt-2 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 py-2 z-20">
                                            <button
                                                onClick={() => { onViewProfile?.(user.id, user.role); }}
                                                className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700"
                                            >
                                                View Profile
                                            </button>
                                            <button
                                                onClick={() => {
                                                    toast(`ID Card for ${user.name} - Coming soon`);
                                                    const menu = document.getElementById(`menu-${user.id}`);
                                                    if (menu) menu.classList.add('hidden');
                                                }}
                                                className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700"
                                            >
                                                Generate ID Card
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                   <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Role</p>
                                      <p className="text-xs font-black text-indigo-600 uppercase">{user.role}</p>
                                   </div>
                                   <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Last Active</p>
                                      <div className="flex items-center gap-2">
                                         <Activity size={12} className="text-emerald-500" />
                                         <p className="text-xs font-black text-slate-700 dark:text-slate-300">{user.lastActive || 'Never'}</p>
                                      </div>
                                   </div>
                                </div>

                                <div className="pt-6 border-t border-slate-50 dark:border-slate-900 flex justify-between items-center">
                                    <div className="flex items-center gap-2">
                                        <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${user.kycStatus === 'VERIFIED' ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' : 'bg-red-50 text-red-600 border border-red-100'}`}>
                                           KYC {user.kycStatus || 'PENDING'}
                                        </span>
                                    </div>
                                    <button 
                                      onClick={() => onViewProfile?.(user.id, user.role)}
                                      className="text-indigo-600 text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:translate-x-1 transition-all group-hover:scale-105 active:scale-95"
                                    >
                                       Full Profile <ChevronRight size={14} />
                                    </button>
                                    {user.role === UserRole.STUDENT && (
                                        <button 
                                            onClick={() => setIdCardStudents([user])}
                                            className="px-4 py-2 bg-slate-900 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-black transition-all flex items-center gap-2"
                                        >
                                            <Fingerprint size={12} /> ID Card
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-3 pb-8">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={safePage === 1}
                  className="px-6 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-[10px] font-black uppercase tracking-widest disabled:opacity-30 hover:border-indigo-500 transition-all"
                >
                  Previous
                </button>
                <span className="text-[11px] font-black text-slate-500 px-4">
                  Page {safePage} of {totalPages} ({filteredUsers.length} users)
                </span>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={safePage === totalPages}
                  className="px-6 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-[10px] font-black uppercase tracking-widest disabled:opacity-30 hover:border-indigo-500 transition-all"
                >
                  Next
                </button>
              </div>
            )}
            </div>

            {/* --- BULK IMPORT MODAL --- */}
            {isBulkModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-white dark:bg-slate-950 w-full max-w-xl rounded-[3rem] shadow-2xl overflow-hidden border border-white/10 animate-in zoom-in-95 duration-300">
                        <div className="p-10 bg-slate-900 text-white flex justify-between items-center">
                            <div>
                               <h3 className="text-2xl font-black tracking-tight">Bulk Import Users</h3>
                               <p className="text-slate-400 text-xs font-medium mt-1">Upload CSV file to add multiple users at once.</p>
                            </div>
                            <button onClick={() => { setIsBulkModalOpen(false); setBulkFile(null); setBulkResults(null); }} className="p-3 bg-white/10 rounded-2xl hover:bg-white/20 transition-all"><X size={20}/></button>
                        </div>
                        <div className="p-10">
                            <input
                                ref={bulkInputRef}
                                type="file"
                                accept=".csv,text/csv"
                                onChange={(e) => e.target.files?.[0] && handleBulkFile(e.target.files[0])}
                                className="hidden"
                            />
                            <button
                                type="button"
                                onClick={() => bulkInputRef.current?.click()}
                                className="w-full border-4 border-dashed border-slate-100 dark:border-slate-800 rounded-[2.5rem] p-16 flex flex-col items-center justify-center text-center group hover:border-indigo-500 transition-all cursor-pointer"
                            >
                                <div className="w-20 h-20 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 rounded-[2rem] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                   <UploadCloud size={32} />
                                </div>
                                <h4 className="text-lg font-black text-slate-900 dark:text-white mb-2 tracking-tight">
                                    {bulkFile ? bulkFile.name : 'Drop File Here'}
                                </h4>
                                <p className="text-slate-400 text-sm font-medium italic">
                                    {bulkFile ? `${(bulkFile.size / 1024).toFixed(1)} KB` : 'or click to browse your computer'}
                                </p>
                            </button>

                            <div className="mt-8 flex items-center gap-4 p-5 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl border border-indigo-100 dark:border-indigo-800">
                               <div className="p-3 bg-white dark:bg-slate-900 rounded-xl text-indigo-600"><FileCheck size={20} /></div>
                               <div className="flex-1">
                                   <p className="text-[11px] font-bold text-indigo-900 dark:text-indigo-200">Required headers: name, email, uniqueId, role (STUDENT/TEACHER/ADMIN)</p>
                                   <button onClick={downloadCsvTemplate} className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 underline mt-1 uppercase tracking-widest">Download Template</button>
                               </div>
                            </div>

                            {bulkResults && (
                                <div className="mt-4 p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl border border-emerald-200 dark:border-emerald-800 text-[11px] font-bold text-emerald-700 dark:text-emerald-300 space-y-1">
                                    <p>✓ Created: {bulkResults.created}</p>
                                    {bulkResults.skipped > 0 && <p>⊘ Skipped: {bulkResults.skipped}</p>}
                                    {bulkResults.errors.length > 0 && (
                                        <details className="mt-2">
                                            <summary className="cursor-pointer text-rose-600 dark:text-rose-400">View {bulkResults.errors.length} errors</summary>
                                            <ul className="mt-2 space-y-1 text-rose-600 dark:text-rose-400 max-h-40 overflow-y-auto">
                                                {bulkResults.errors.map((e, i) => <li key={i}>• {e}</li>)}
                                            </ul>
                                        </details>
                                    )}
                                </div>
                            )}

                             <button
                                onClick={handleBulkImport}
                                disabled={isSaving || !bulkFile}
                                className="w-full py-5 bg-indigo-600 text-white rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-2xl shadow-indigo-500/20 mt-8 hover:bg-indigo-700 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                             >
                                {isSaving ? <Loader2 className="animate-spin" size={18} /> : <FileCheck size={18} />}
                                Start Import
                             </button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- ADD INDIVIDUAL MODAL --- */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-white dark:bg-slate-950 w-full max-w-lg rounded-[3rem] shadow-2xl overflow-hidden border border-white/10 animate-in zoom-in-95 duration-300">
                        <div className="p-10 bg-indigo-600 text-white flex justify-between items-center">
                            <div>
                               <h3 className="text-2xl font-black tracking-tight">Identity Creation</h3>
                               <p className="text-indigo-100 text-xs font-medium mt-1">Onboard a single user to the system.</p>
                            </div>
                            <button onClick={() => setIsAddModalOpen(false)} className="p-3 bg-white/10 rounded-2xl hover:bg-white/20 transition-all"><X size={20}/></button>
                        </div>
                        <div className="p-10 space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Full Name</label>
                                <input 
                                    type="text" 
                                    value={newUser.name}
                                    onChange={e => setNewUser({...newUser, name: e.target.value})}
                                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl px-6 py-4 text-sm font-black outline-none focus:border-indigo-600" 
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Role</label>
                                    <select 
                                        value={newUser.role}
                                        onChange={e => setNewUser({...newUser, role: e.target.value as UserRole})}
                                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl px-6 py-4 text-sm font-black outline-none focus:border-indigo-600 appearance-none"
                                    >
                                        <option value={UserRole.STUDENT}>STUDENT</option>
                                        <option value={UserRole.TEACHER}>TEACHER</option>
                                        <option value={UserRole.ADMIN}>ADMIN</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Unique ID</label>
                                    <input 
                                        type="text" 
                                        value={newUser.uniqueId}
                                        onChange={e => setNewUser({...newUser, uniqueId: e.target.value})}
                                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl px-6 py-4 text-sm font-black outline-none focus:border-indigo-600" 
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Email Address</label>
                                <input 
                                    type="email" 
                                    value={newUser.email}
                                    onChange={e => setNewUser({...newUser, email: e.target.value})}
                                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl px-6 py-4 text-sm font-black outline-none focus:border-indigo-600" 
                                />
                            </div>

                            <button
                                onClick={handleAddIndividual}
                                disabled={isSaving || !newUser.name || !newUser.email || !newUser.uniqueId}
                                className="w-full py-5 bg-slate-900 text-white rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-2xl mt-4 hover:bg-black transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                            >
                                {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                                Finalize Identity
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- ID CARD PREVIEW MODAL --- */}
            {idCardStudents && (
                <StudentIDCard 
                    students={idCardStudents} 
                    onClose={() => setIdCardStudents(null)} 
                    schoolId={currentUser.schoolId}
                />
            )}

        </div>
    );
};

export default UserManagement;
