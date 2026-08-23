import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  BookOpen,
  Calendar,
  Upload,
  X,
  Save,
  FileText,
  Loader2,
  Plus,
  Paperclip,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  Eye,
  EyeOff,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { User, Homework, ClassData, SubjectData, HomeworkAttachment, AttachmentType } from '@/types';
import { createHomework, updateHomework, uploadAttachment, deleteAttachment } from '@/services/homework';
import { db } from '@/services/firebase';
import { collection, onSnapshot, Unsubscribe } from 'firebase/firestore';

const IS_MOCK_MODE = import.meta.env.VITE_USE_MOCK === 'true' || import.meta.env.VITE_DEMO_MODE === 'true';

interface Props {
  user: User;
  onBack: () => void;
  editHomework?: Homework | null;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
const ALLOWED_EXTENSIONS = ['pdf', 'jpg', 'jpeg', 'png', 'webp', 'doc', 'docx'];

const mimeFromExtension = (filename: string): string | null => {
  const ext = filename.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'pdf': return 'application/pdf';
    case 'jpg':
    case 'jpeg': return 'image/jpeg';
    case 'png': return 'image/png';
    case 'webp': return 'image/webp';
    case 'doc': return 'application/msword';
    case 'docx': return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    default: return null;
  }
};

const CreateHomework: React.FC<Props> = ({ user, onBack, editHomework }) => {
  const isEdit = !!editHomework;

  const [title, setTitle] = useState(editHomework?.title || '');
  const [subject, setSubject] = useState(editHomework?.subject || '');
  const [classId, setClassId] = useState(editHomework?.classId || '');
  const [description, setDescription] = useState(editHomework?.description || '');
  const [dueDate, setDueDate] = useState(editHomework?.dueDate || '');
  const [maxGrade, setMaxGrade] = useState(editHomework?.maxGrade?.toString() || '100');
  const [allowLate, setAllowLate] = useState(editHomework?.allowLateSubmission ?? true);
  const [attachments, setAttachments] = useState<HomeworkAttachment[]>(editHomework?.attachments || []);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [subjects, setSubjects] = useState<SubjectData[]>([]);
  const [uploadingFiles, setUploadingFiles] = useState<Set<string>>(new Set());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPreview, setShowPreview] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const unsubClassesRef = useRef<Unsubscribe | null>(null);
  const unsubSubjectsRef = useRef<Unsubscribe | null>(null);

  const tomorrow = useCallback(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  }, []);

  const DEFAULT_CLASSES: ClassData[] = [
    { id: '10A', name: 'Class 10-A', section: 'A' },
    { id: '9A', name: 'Class 9-A', section: 'A' },
    { id: '8A', name: 'Class 8-A', section: 'A' },
    { id: '7A', name: 'Class 7-A', section: 'A' }
  ];

  const DEFAULT_SUBJECTS: SubjectData[] = [
    { id: 'sub-1', name: 'Mathematics', code: 'MATH101' },
    { id: 'sub-2', name: 'Science', code: 'SCI101' },
    { id: 'sub-3', name: 'English', code: 'ENG101' },
    { id: 'sub-4', name: 'Social Studies', code: 'SST101' },
    { id: 'sub-5', name: 'Computer Science', code: 'CS101' }
  ];

  useEffect(() => {
    if (IS_MOCK_MODE) {
      setClasses(DEFAULT_CLASSES);
      setSubjects(DEFAULT_SUBJECTS);
      if (!classId) setClassId(user?.classId || '10A');
      if (!subject) setSubject(user?.subjects?.[0] || 'Mathematics');
      return;
    }
    if (!user?.schoolId) {
      setClasses(DEFAULT_CLASSES);
      setSubjects(DEFAULT_SUBJECTS);
      if (!classId) setClassId(user?.classId || '10A');
      if (!subject) setSubject(user?.subjects?.[0] || 'Mathematics');
      return;
    }

    const classesRef = collection(db, 'schools', user.schoolId, 'classes');
    const unsubC = onSnapshot(classesRef, (snap) => {
      const cls = snap.docs.map((d: any) => ({ id: d.id, ...d.data() } as ClassData));
      const finalCls = cls.length > 0 ? cls : DEFAULT_CLASSES;
      setClasses(finalCls);
      if (!classId && finalCls.length > 0) setClassId(user?.classId || finalCls[0]?.id || '10A');
    }, () => {
      setClasses(DEFAULT_CLASSES);
      if (!classId) setClassId(user?.classId || '10A');
    });
    unsubClassesRef.current = unsubC;

    const subjectsRef = collection(db, 'schools', user.schoolId, 'subjects');
    const unsubS = onSnapshot(subjectsRef, (snap) => {
      const subs = snap.docs.map((d: any) => ({ id: d.id, ...d.data() } as SubjectData));
      const finalSubs = subs.length > 0 ? subs : DEFAULT_SUBJECTS;
      setSubjects(finalSubs);
      if (!subject && finalSubs.length > 0) setSubject(user?.subjects?.[0] || finalSubs[0]?.name || 'Mathematics');
    }, () => {
      setSubjects(DEFAULT_SUBJECTS);
      if (!subject) setSubject(user?.subjects?.[0] || 'Mathematics');
    });
    unsubSubjectsRef.current = unsubS;

    return () => {
      unsubC();
      unsubS();
    };
  }, [user?.schoolId, user?.classId, user?.subjects]);

  const validate = (): boolean => {
    const errs: Record<string, string> = {};

    if (!title.trim()) errs.title = 'Title is required';
    if (!classId) errs.classId = 'At least one class is required';
    if (!dueDate) errs.dueDate = 'Due date is required';
    else if (new Date(dueDate) <= new Date(new Date().toISOString().split('T')[0]!)) {
      errs.dueDate = 'Due date must be in the future';
    }

    const grade = parseInt(maxGrade, 10);
    if (isNaN(grade) || grade <= 0) errs.maxGrade = 'Max grade must be a positive number';

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles: File[] = [];

    for (const file of files) {
      if (file.size > MAX_FILE_SIZE) {
        toast.error(`${file.name} exceeds 10MB limit`);
        continue;
      }
      // Some browsers/extensions don't populate file.type; fall back to extension sniffing
      const detectedType = file.type || mimeFromExtension(file.name);
      if (!detectedType || !ALLOWED_TYPES.includes(detectedType)) {
        const ext = file.name.split('.').pop()?.toLowerCase() || '';
        if (!ALLOWED_EXTENSIONS.includes(ext)) {
          toast.error(`${file.name} is not a supported file type`);
          continue;
        }
      }
      validFiles.push(file);
    }

    setPendingFiles((prev) => [...prev, ...validFiles]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removePendingFile = (index: number) => {
    setPendingFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const removeExistingAttachment = async (index: number) => {
    const att = attachments[index];
    if (att?.url) {
      try {
        await deleteAttachment(att.url);
      } catch (err) {
        console.warn('Failed to delete from storage (will be reaped by lifecycle):', err);
      }
    }
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadPendingFiles = async (homeworkId: string): Promise<HomeworkAttachment[]> => {
    const uploaded: HomeworkAttachment[] = [];

    for (const file of pendingFiles) {
      setUploadingFiles((prev) => new Set(prev).add(file.name));
      try {
        const result = await uploadAttachment(user.schoolId, homeworkId, file);
        const detectedType = file.type || mimeFromExtension(file.name) || '';
        const type: AttachmentType = detectedType.includes('pdf')
          ? 'PDF'
          : detectedType.includes('image')
          ? 'IMAGE'
          : 'DOC';

        uploaded.push({
          name: result.name,
          url: result.url,
          type,
          size: result.size,
          uploadedAt: new Date().toISOString(),
        });
      } catch {
        toast.error(`Failed to upload ${file.name}`);
      } finally {
        setUploadingFiles((prev) => {
          const next = new Set(prev);
          next.delete(file.name);
          return next;
        });
      }
    }

    return uploaded;
  };

  const handleSave = async (status: 'DRAFT' | 'ACTIVE') => {
    if (status === 'ACTIVE' && !validate()) {
      toast.error('Please fix the errors before publishing');
      return;
    }

    if (status === 'DRAFT' && !title.trim()) {
      toast.error('Title is required even for drafts');
      return;
    }

    const targetState = status === 'ACTIVE' ? setPublishing : setSaving;
    targetState(true);

    try {
      const classObj = classes.find((c) => c.id === classId);
      const currentYear = new Date().getFullYear();
      const sessionYear = `${currentYear}-${String(currentYear + 1).slice(-2)}`;

      const data: any = {
        title: title.trim(),
        subject,
        description: description.trim(),
        assignedDate: editHomework?.assignedDate || new Date().toISOString().split('T')[0],
        dueDate,
        classId,
        className: classObj?.name || '',
        schoolId: user.schoolId,
        academicYear: editHomework?.academicYear || sessionYear,
        status,
        teacherId: user.id,
        teacherName: user.name,
        attachments: attachments,
        maxGrade: parseInt(maxGrade, 10) || 100,
        allowLateSubmission: allowLate,
      };

      let realHomeworkId: string;
      if (isEdit && editHomework) {
        realHomeworkId = editHomework.id;
        await updateHomework(user.schoolId, realHomeworkId, data);
        toast.success(status === 'ACTIVE' ? 'Homework updated and published' : 'Draft saved');
      } else {
        realHomeworkId = await createHomework(user.schoolId, data);
        toast.success(status === 'ACTIVE' ? 'Homework published successfully' : 'Draft saved');
      }

      if (pendingFiles.length > 0) {
        try {
          const uploaded = await uploadPendingFiles(realHomeworkId);
          if (uploaded.length > 0) {
            const finalAttachments = [...attachments, ...uploaded];
            await updateHomework(user.schoolId, realHomeworkId, { attachments: finalAttachments });
          }
        } catch (uploadErr) {
          console.error('Attachment upload failed (homework was saved):', uploadErr);
          toast('Homework saved but some attachments failed to upload', { icon: '⚠️' });
        }
      }

      onBack();
    } catch (err) {
      console.error('Save failed:', err);
      toast.error('Failed to save homework');
    } finally {
      targetState(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getAttachmentIcon = (type: AttachmentType) => {
    switch (type) {
      case 'PDF':
        return <FileText size={16} className="text-red-400" />;
      case 'IMAGE':
        return <Upload size={16} className="text-emerald-400" />;
      default:
        return <Paperclip size={16} className="text-indigo-400" />;
    }
  };

  const SkeletonField = () => (
    <div className="h-11 bg-zinc-800 rounded-xl animate-pulse" />
  );

  return (
    <div className="space-y-4 pb-28 md:pb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="w-11 h-11 flex items-center justify-center rounded-xl bg-zinc-800 text-zinc-400 hover:bg-zinc-700 transition-opacity"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-xl font-bold text-zinc-100">
              {isEdit ? 'Edit Homework' : 'Create Homework'}
            </h1>
            <p className="text-xs text-zinc-500">
              {isEdit ? 'Update assignment details' : 'New assignment for your class'}
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowPreview(!showPreview)}
          className="w-11 h-11 flex items-center justify-center rounded-xl bg-zinc-800 text-zinc-400 hover:bg-zinc-700 transition-opacity"
        >
          {showPreview ? <EyeOff size={20} /> : <Eye size={20} />}
        </button>
      </div>

      {showPreview ? (
        <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800 space-y-4">
          <div className="flex items-center gap-2">
            <BookOpen size={20} className="text-indigo-400" />
            <h2 className="text-lg font-bold text-zinc-100">{title || 'Untitled Homework'}</h2>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {subject && (
              <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-400 text-xs font-medium rounded-lg border border-indigo-500/20">
                {subject}
              </span>
            )}
            {classId && (
              <span className="px-2 py-0.5 bg-zinc-500/10 text-zinc-400 text-xs font-medium rounded-lg border border-zinc-500/20">
                {classes.find((c) => c.id === classId)?.name || classId}
              </span>
            )}
          </div>
          {description && (
            <p className="text-sm text-zinc-400 whitespace-pre-wrap">{description}</p>
          )}
          {dueDate && (
            <p className="text-xs text-zinc-500 flex items-center gap-1">
              <Calendar size={14} />
              Due: {new Date(dueDate).toLocaleDateString()}
            </p>
          )}
          {attachments.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs text-zinc-500 flex items-center gap-1">
                <Paperclip size={14} />
                {attachments.length} attachment{attachments.length !== 1 ? 's' : ''}
              </p>
              {attachments.map((a, i) => (
                <div key={i} className="flex items-center gap-2 text-xs text-zinc-400">
                  {getAttachmentIcon(a.type)}
                  <span>{a.name}</span>
                  {a.size && <span className="text-zinc-600">({formatFileSize(a.size)})</span>}
                </div>
              ))}
            </div>
          )}
          <div className="flex items-center gap-4 text-xs text-zinc-500 pt-2 border-t border-zinc-800">
            <span>Max Grade: {maxGrade || 100}</span>
            <span>Late Submissions: {allowLate ? 'Allowed' : 'Not Allowed'}</span>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {classes.length === 0 && (
            <div className="bg-zinc-900 rounded-xl p-4 border border-zinc-800 flex items-center gap-3">
              <Loader2 size={18} className="text-zinc-500 animate-spin" />
              <p className="text-sm text-zinc-500">Loading classes...</p>
            </div>
          )}

          <div>
            <label className="text-xs text-zinc-500 mb-1.5 block">
              Title <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (errors.title) setErrors((prev) => ({ ...prev, title: '' }));
              }}
              placeholder="e.g. Chapter 5 Exercise 5.2"
              className={`w-full h-11 px-4 bg-zinc-900 border rounded-xl text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none transition-opacity ${
                errors.title ? 'border-red-500/50' : 'border-zinc-800 focus:border-indigo-500'
              }`}
            />
            {errors.title && (
              <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                <AlertTriangle size={12} />
                {errors.title}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-zinc-500 mb-1.5 block">Subject</label>
              {subjects.length === 0 ? (
                <SkeletonField />
              ) : (
                <div className="relative">
                  <select
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full h-11 px-4 pr-10 bg-zinc-900 border border-zinc-800 rounded-xl text-sm text-zinc-100 appearance-none focus:border-indigo-500 focus:outline-none transition-opacity"
                  >
                    <option value="">Select subject</option>
                    {subjects.map((s) => (
                      <option key={s.id} value={s.name}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div>
              <label className="text-xs text-zinc-500 mb-1.5 block">
                Class <span className="text-red-400">*</span>
              </label>
              {classes.length === 0 ? (
                <SkeletonField />
              ) : (
                <div className="relative">
                  <select
                    value={classId}
                    onChange={(e) => {
                      setClassId(e.target.value);
                      if (errors.classId) setErrors((prev) => ({ ...prev, classId: '' }));
                    }}
                    className={`w-full h-11 px-4 pr-10 bg-zinc-900 border rounded-xl text-sm text-zinc-100 appearance-none focus:outline-none transition-opacity ${
                      errors.classId ? 'border-red-500/50' : 'border-zinc-800 focus:border-indigo-500'
                    }`}
                  >
                    <option value="">Select class</option>
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              {errors.classId && (
                <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                  <AlertTriangle size={12} />
                  {errors.classId}
                </p>
              )}
            </div>
          </div>

          <div>
            <label className="text-xs text-zinc-500 mb-1.5 block">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              placeholder="Write instructions for students..."
              className="w-full h-24 px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-sm text-zinc-100 placeholder-zinc-600 focus:border-indigo-500 focus:outline-none resize-none transition-opacity"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-zinc-500 mb-1.5 block">
                Due Date <span className="text-red-400">*</span>
              </label>
              <input
                type="date"
                value={dueDate}
                min={tomorrow()}
                onChange={(e) => {
                  setDueDate(e.target.value);
                  if (errors.dueDate) setErrors((prev) => ({ ...prev, dueDate: '' }));
                }}
                className={`w-full h-11 px-4 bg-zinc-900 border rounded-xl text-sm text-zinc-100 focus:outline-none transition-opacity ${
                  errors.dueDate ? 'border-red-500/50' : 'border-zinc-800 focus:border-indigo-500'
                }`}
              />
              {errors.dueDate && (
                <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                  <AlertTriangle size={12} />
                  {errors.dueDate}
                </p>
              )}
            </div>

            <div>
              <label className="text-xs text-zinc-500 mb-1.5 block">Max Grade</label>
              <input
                type="number"
                value={maxGrade}
                min={1}
                onChange={(e) => {
                  setMaxGrade(e.target.value);
                  if (errors.maxGrade) setErrors((prev) => ({ ...prev, maxGrade: '' }));
                }}
                className={`w-full h-11 px-4 bg-zinc-900 border rounded-xl text-sm text-zinc-100 focus:outline-none transition-opacity ${
                  errors.maxGrade ? 'border-red-500/50' : 'border-zinc-800 focus:border-indigo-500'
                }`}
              />
              {errors.maxGrade && (
                <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                  <AlertTriangle size={12} />
                  {errors.maxGrade}
                </p>
              )}
            </div>
          </div>

          <div>
            <label className="text-xs text-zinc-500 mb-1.5 block">Attachments</label>
            <div
              onClick={() => fileInputRef.current?.click()}
              className="w-full p-6 border-2 border-dashed border-zinc-800 rounded-xl flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-zinc-700 transition-opacity bg-zinc-900/50"
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx"
                multiple
                className="hidden"
              />
              <div className="w-10 h-10 bg-zinc-800 rounded-xl flex items-center justify-center">
                <Upload size={20} className="text-zinc-500" />
              </div>
              <p className="text-xs text-zinc-500 font-medium">Tap to upload files</p>
              <p className="text-xs text-zinc-600">PDF, Image, DOC - Max 10MB each</p>
            </div>
          </div>

          {attachments.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-zinc-500 flex items-center gap-1">
                <Paperclip size={14} />
                Existing attachments
              </p>
              {attachments.map((a, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 bg-zinc-900 rounded-xl p-3 border border-zinc-800"
                >
                  {getAttachmentIcon(a.type)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-zinc-200 truncate">{a.name}</p>
                    {a.size && (
                      <p className="text-xs text-zinc-600">{formatFileSize(a.size)}</p>
                    )}
                  </div>
                  <button
                    onClick={() => { void removeExistingAttachment(i); }}
                    className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-zinc-800 text-zinc-500 hover:text-red-400 transition-opacity"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {pendingFiles.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-zinc-500 flex items-center gap-1">
                <Plus size={14} />
                New files to upload
              </p>
              {pendingFiles.map((f, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 bg-zinc-900 rounded-xl p-3 border border-zinc-800"
                >
                  {uploadingFiles.has(f.name) ? (
                    <Loader2 size={16} className="text-indigo-400 animate-spin" />
                  ) : (
                    <FileText size={16} className="text-zinc-500" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-zinc-200 truncate">{f.name}</p>
                    <p className="text-xs text-zinc-600">{formatFileSize(f.size)}</p>
                  </div>
                  {!uploadingFiles.has(f.name) && (
                    <button
                      onClick={() => removePendingFile(i)}
                      className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-zinc-800 text-zinc-500 hover:text-red-400 transition-opacity"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between bg-zinc-900 rounded-xl p-4 border border-zinc-800">
            <div>
              <p className="text-sm text-zinc-200 font-medium">Allow late submissions</p>
              <p className="text-xs text-zinc-500">Students can submit after the due date</p>
            </div>
            <button
              onClick={() => setAllowLate(!allowLate)}
              className={`w-12 h-7 rounded-full transition-opacity relative ${
                allowLate ? 'bg-indigo-600' : 'bg-zinc-700'
              }`}
            >
              <div
                className={`w-5 h-5 bg-white rounded-full absolute top-1 transition-opacity ${
                  allowLate ? 'left-6' : 'left-1'
                }`}
              />
            </button>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={() => handleSave('DRAFT')}
              disabled={saving || publishing}
              className="flex-1 h-14 bg-zinc-800 hover:bg-zinc-700 disabled:bg-zinc-900 disabled:text-zinc-600 text-zinc-200 font-semibold rounded-xl flex items-center justify-center gap-2 transition-opacity text-sm"
            >
              {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
              Save Draft
            </button>
            <button
              onClick={() => handleSave('ACTIVE')}
              disabled={saving || publishing}
              className="flex-1 h-14 bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-900 disabled:text-zinc-600 text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-opacity text-sm"
            >
              {publishing ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <CheckCircle2 size={18} />
              )}
              Publish
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateHomework;
