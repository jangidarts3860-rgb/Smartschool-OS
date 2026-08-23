import React, { useState, useEffect } from 'react';
import { X, Download, Printer, Shield, Fingerprint, Zap, Loader2, ChevronRight, CheckCircle2 } from 'lucide-react';
import { User } from '@/types';
import Avatar from '@/components/shared/Avatar';
import { idCardService } from '@/services/idCardService';
import { toast } from 'react-hot-toast';

import { db } from '@/services/firebase';
import { doc, onSnapshot } from 'firebase/firestore';

interface Props {
  students: User[];
  onClose: () => void;
  schoolId: string;
}

const StudentIDCard: React.FC<Props> = ({ students, onClose, schoolId }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [qrCodes, setQrCodes] = useState<Record<string, string>>({});
  const [currentPreviewIdx, setCurrentPreviewIdx] = useState(0);
  const [schoolData, setSchoolData] = useState({
    schoolName: import.meta.env.VITE_SCHOOL_NAME ?? "Your School",
    schoolAddress: "Loading...",
    schoolPhone: "...",
    academicYear: "2024-25",
    logoUrl: ""
  });

  const isMock = import.meta.env.VITE_USE_MOCK === 'true' || import.meta.env.VITE_DEMO_MODE === 'true';

  useEffect(() => {
    if (isMock) return;
    // P0 fix: read from canonical `config/profile`, with legacy `profile/general` fallback
    let usingLegacy = false;
    const applyData = (data: any) => setSchoolData({
      schoolName: data.name || "SmartSchool",
      schoolAddress: data.address || "",
      schoolPhone: data.phone || "",
      academicYear: data.academicYear || "2024-25",
      logoUrl: data.logoUrl || ""
    });
    const unsubCanonical = onSnapshot(doc(db, 'schools', schoolId, 'config', 'profile'), (snap) => {
      if (snap.exists()) {
        usingLegacy = false;
        applyData(snap.data());
      } else {
        usingLegacy = true;
      }
    });
    const unsubLegacy = onSnapshot(doc(db, 'schools', schoolId, 'profile', 'general'), (snap) => {
      if (usingLegacy && snap.exists()) applyData(snap.data());
    });
    return () => { unsubCanonical(); unsubLegacy(); };
  }, [schoolId, isMock]);

  useEffect(() => {
    const generateAllQRs = async () => {
      const codes: Record<string, string> = {};
      for (const student of students) {
        codes[student.id] = await idCardService.generateQRCode(student.id);
      }
      setQrCodes(codes);
    };
    generateAllQRs();
  }, [students]);

  const handleDownloadSingle = async (student: User) => {
    setIsGenerating(true);
    try {
      await idCardService.generateIDCard(student, schoolData);
      toast.success(`ID Card for ${student.name} downloaded!`);
    } catch (err) {
      toast.error("Failed to generate ID Card");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadBulk = async () => {
    if (!students || students.length === 0) {
      toast.error("Please select students first");
      return;
    }
    setIsGenerating(true);
    try {
      await idCardService.generateBulkIDCards(students, schoolData);
      toast.success(`Generated ${students.length} ID Cards successfully!`);
    } catch (err) {
      toast.error("Bulk generation failed");
    } finally {
      setIsGenerating(false);
    }
  };

  const currentStudent = students[currentPreviewIdx];

  if (!currentStudent) {
    return (
      <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xl animate-in fade-in duration-300">
        <div className="bg-white dark:bg-slate-950 p-12 rounded-[3.5rem] shadow-2xl flex flex-col items-center text-center max-w-md border border-white/10">
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-900 rounded-2xl flex items-center justify-center text-slate-400 mb-6">
               <Fingerprint size={32} />
            </div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight mb-2">No Profiles Selected</h3>
            <p className="text-xs font-medium text-slate-500 mb-8">Please select at least one student from the roster to generate digital ID cards.</p>
            <button onClick={onClose} className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-sm hover:scale-105 transition-all">
               Return to Roster
            </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xl animate-in fade-in duration-300">
      <div className="bg-white dark:bg-slate-950 w-full max-w-4xl rounded-[3.5rem] shadow-2xl overflow-hidden border border-white/10 flex flex-col lg:flex-row h-[90vh] lg:h-auto animate-in zoom-in-95 duration-300">
        
        {/* LEFT: PREVIEW AREA */}
        <div className="flex-1 bg-slate-50 dark:bg-slate-900/50 p-8 lg:p-16 flex flex-col items-center justify-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
            <div className="absolute top-10 left-10 w-32 h-32 bg-indigo-500 blur-[80px] rounded-full" />
            <div className="absolute bottom-10 right-10 w-32 h-32 bg-purple-500 blur-[80px] rounded-full" />
          </div>

          <div className="relative z-10 space-y-8 flex flex-col items-center">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Institutional Preview</h3>
            
            {/* THE CARD (CR80 RATIO) */}
            <div className="w-[300px] h-[480px] bg-white dark:bg-slate-950 rounded-[2rem] shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col group relative">
              
              {/* Header */}
              <div className="h-24 bg-indigo-600 p-6 flex flex-col items-center justify-center text-center">
                {schoolData.logoUrl ? (
                  <img src={schoolData.logoUrl} className="w-8 h-8 object-contain mb-2 brightness-0 invert" alt="Logo" />
                ) : (
                  <div className="w-8 h-8 bg-white/20 rounded-lg mb-2 flex items-center justify-center">
                    <Shield className="text-white" size={16} />
                  </div>
                )}
                <h4 className="text-[10px] font-black text-white uppercase tracking-wider leading-tight">
                  {schoolData.schoolName}
                </h4>
                <p className="text-[8px] font-bold text-indigo-200 mt-1 uppercase tracking-widest">{schoolData.academicYear}</p>
              </div>

              {/* Body */}
              <div className="flex-1 p-6 flex flex-col items-center text-center space-y-4">
                {/* Photo */}
                <div className="relative">
                  <div className="w-28 h-28 rounded-full border-4 border-indigo-50 dark:border-slate-900 shadow-sm overflow-hidden bg-indigo-100 flex items-center justify-center">
                    <Avatar
                      src={currentStudent.avatar}
                      name={currentStudent.name}
                      size="4xl"
                      className="w-full h-full"
                    />
                  </div>
                  <div className="absolute -bottom-1 -right-1 p-2 bg-indigo-600 text-white rounded-xl shadow-lg border-2 border-white dark:border-slate-950">
                    <Fingerprint size={12} />
                  </div>
                </div>

                <div className="space-y-1">
                  <h5 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">{currentStudent.name}</h5>
                  <p className="text-[9px] font-mono font-black text-slate-400 uppercase tracking-widest">ID: {currentStudent.uniqueId || currentStudent.id.substring(0, 8)}</p>
                </div>

                {/* Info Grid */}
                <div className="grid grid-cols-2 gap-4 w-full pt-4 text-left">
                   <div className="space-y-0.5">
                     <p className="text-[7px] font-black text-slate-400 uppercase">Class</p>
                     <p className="text-[10px] font-black text-slate-800 dark:text-slate-200">{currentStudent.classId || 'N/A'}</p>
                   </div>
                   <div className="space-y-0.5">
                     <p className="text-[7px] font-black text-slate-400 uppercase">Parent Contact</p>
                     <p className="text-[10px] font-black text-slate-800 dark:text-slate-200">{currentStudent.phone || (currentStudent as any).parentPhone || 'N/A'}</p>
                   </div>
                  <div className="space-y-0.5">
                    <p className="text-[7px] font-black text-slate-400 uppercase">NFC Status</p>
                    <div className="flex items-center gap-1 text-emerald-500">
                      <Zap size={8} fill="currentColor" />
                      <span className="text-[8px] font-black uppercase">Active</span>
                    </div>
                  </div>
                </div>

                {/* QR Code */}
                <div className="mt-auto pt-6 w-full flex justify-between items-end">
                   <div className="text-left">
                      <p className="text-[6px] font-black text-slate-300 uppercase leading-tight">Digital Student Identity<br/>Verified by SmartSchool AI</p>
                   </div>
                   <div className="w-12 h-12 bg-white rounded-lg p-1 border border-slate-100">
                      {qrCodes[currentStudent.id] ? (
                        <img src={qrCodes[currentStudent.id]} className="w-full h-full" alt="QR" />
                      ) : (
                        <div className="w-full h-full bg-slate-50 animate-pulse" />
                      )}
                   </div>
                </div>
              </div>

              {/* Footer */}
              <div className="h-6 bg-slate-50 dark:bg-slate-900 flex items-center justify-center border-t border-slate-100 dark:border-slate-800">
                <p className="text-[6px] font-bold text-slate-400 uppercase tracking-widest">{schoolData.schoolAddress}</p>
              </div>
            </div>

            {/* Pagination for Bulk */}
            {students.length > 1 && (
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setCurrentPreviewIdx(prev => Math.max(0, prev - 1))}
                  className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full text-slate-400"
                >
                  <X className="rotate-180" size={16} />
                </button>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  {currentPreviewIdx + 1} / {students.length}
                </span>
                <button 
                  onClick={() => setCurrentPreviewIdx(prev => Math.min(students.length - 1, prev + 1))}
                  className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full text-slate-400"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: ACTIONS AREA */}
        <div className="w-full lg:w-[350px] p-8 lg:p-12 flex flex-col justify-center space-y-10 border-t lg:border-t-0 lg:border-l border-slate-100 dark:border-white/5">
          <div className="flex justify-between items-center lg:items-start">
            <div className="space-y-1">
              <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-none">Identity Export</h2>
              <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Production Ready Engine</p>
            </div>
            <button onClick={onClose} className="p-3 bg-slate-50 dark:bg-slate-900 rounded-2xl text-slate-400 hover:text-rose-500 transition-all">
              <X size={20} />
            </button>
          </div>

          <div className="space-y-4">
            <div className="p-6 bg-indigo-50 dark:bg-indigo-900/20 rounded-[2rem] border border-indigo-100 dark:border-indigo-800 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white dark:bg-slate-900 rounded-xl flex items-center justify-center text-indigo-600 shadow-sm">
                  <Shield size={20} />
                </div>
                <p className="text-xs font-black text-indigo-900 dark:text-indigo-200 uppercase tracking-tight">Security Features</p>
              </div>
              <ul className="space-y-2">
                <li className="flex items-center gap-2 text-[10px] font-bold text-indigo-700/70 dark:text-indigo-300/70">
                  <CheckCircle2 size={12} /> Dynamic QR Verification
                </li>
                <li className="flex items-center gap-2 text-[10px] font-bold text-indigo-700/70 dark:text-indigo-300/70">
                  <CheckCircle2 size={12} /> NFC Protocol Enabled
                </li>
                <li className="flex items-center gap-2 text-[10px] font-bold text-indigo-700/70 dark:text-indigo-300/70">
                  <CheckCircle2 size={12} /> CR80 Standard Layout
                </li>
              </ul>
            </div>
          </div>

          <div className="space-y-3">
            <button 
              onClick={() => handleDownloadSingle(currentStudent)}
              disabled={isGenerating}
              className="w-full py-5 bg-slate-900 dark:bg-white dark:text-slate-900 text-white rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {isGenerating ? <Loader2 className="animate-spin" size={18} /> : <Download size={18} />}
              Export Current Card
            </button>

            {students.length > 1 && (
              <button 
                onClick={handleDownloadBulk}
                disabled={isGenerating}
                className="w-full py-5 bg-indigo-600 text-white rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-2xl shadow-indigo-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
              >
                {isGenerating ? <Loader2 className="animate-spin" size={18} /> : <Printer size={18} />}
                Print Batch ({students.length})
              </button>
            )}
          </div>

          <div className="pt-6 border-t border-slate-100 dark:border-white/5">
            <p className="text-[9px] text-slate-400 font-bold uppercase leading-relaxed text-center">
              All identity documents are generated locally in your browser for zero-cost infrastructure and maximum privacy.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentIDCard;
