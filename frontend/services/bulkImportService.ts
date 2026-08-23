/**
 * Bulk Import Service - CSV Upload with PapaParse + Firestore writeBatchChunked
 * Kilo Phase 2: Feature Development
 * Includes CSV injection prevention and XSS sanitization
 */

import Papa from 'papaparse';
import { db } from './firebase';
import { collection, doc, serverTimestamp } from 'firebase/firestore';
import { writeBatchChunked, BatchOperation } from './firestore';
import { incrementHeavyOperation } from './usageService';
import type { User } from '@/types';
import { UserRole } from '@/types';
import { generateId } from '@/lib/utils';
import { getDeterministicAvatar } from '@/constants';

/**
 * CSV Injection Prevention
 * Prevents formula injection attacks via CSV cells starting with =, +, -, @, tab, or CRLF
 * Wraps dangerous values with single quote (') to neutralize formulas in Excel
 */
const sanitizeCSVValue = (value: string | undefined | null): string => {
  if (!value || typeof value !== 'string') return '';
  const trimmed = value.trim();
  if (/^[=+\-@\t\r\n]/.test(trimmed)) {
    return `'${trimmed}`;
  }
  return trimmed;
};

/**
 * HTML/XSS Sanitization
 * Strips HTML tags and dangerous characters to prevent XSS
 */
const sanitizeHTMLValue = (value: string | undefined | null): string => {
  if (!value || typeof value !== 'string') return '';
  return value
    .replace(/<[^>]*>/g, '')
    .replace(/[<>'"&]/g, '')
    .trim();
};

/**
 * Combined sanitization for student data fields
 * Prevents both CSV injection and XSS attacks
 */
const sanitizeStudentField = (value: string | undefined | null): string => {
  const csvSafe = sanitizeCSVValue(value);
  return sanitizeHTMLValue(csvSafe);
};

interface ImportResult {
  success: number;
  failed: number;
  errors: string[];
}

interface StudentCSVRow {
  name: string;
  rollNo: string;
  classId: string;
  fatherName?: string;
  motherName?: string;
  phone?: string;
  email?: string;
  dob?: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  address?: string;
  bloodGroup?: string;
}

interface TeacherCSVRow {
  name: string;
  email: string;
  phone?: string;
  subjects?: string;
  qualification?: string;
  experience?: string;
  classId?: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
}

const generateUniqueId = (prefix: string): string => {
  return `${prefix}${Date.now().toString(36).toUpperCase()}${generateId().slice(0, 3).toUpperCase()}`;
};

const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePhone = (phone: string): boolean => {
  const phoneRegex = /^\+?[\d\s-]{10,}$/;
  return phoneRegex.test(phone);
};

export const bulkImportStudents = async (
  csvFile: File,
  schoolId: string,
  onProgress?: (progress: number) => void
): Promise<ImportResult> => {
  return new Promise((resolve) => {
    const result: ImportResult = { success: 0, failed: 0, errors: [] };
    const operations: BatchOperation[] = [];

    const reader = new FileReader();

    reader.onload = async (e) => {
      const csvContent = e.target?.result as string;

      Papa.parse<StudentCSVRow>(csvContent, {
        header: true,
        skipEmptyLines: true,
        complete: async (parseResult) => {
          const total = parseResult.data.length;

          for (let i = 0; i < total; i++) {
            const row = parseResult.data[i]!;

            try {
              if (!row.name || !row.rollNo || !row.classId) {
                result.failed++;
                result.errors.push(`Row ${i + 2}: Missing required fields (name, rollNo, classId)`);
                continue;
              }

              const email = row.email || `${row.name.toLowerCase().replace(/\s/g, '')}${row.rollNo}@school.com`;

              if (row.email && !validateEmail(row.email)) {
                result.failed++;
                result.errors.push(`Row ${i + 2}: Invalid email format`);
                continue;
              }

              if (row.phone && !validatePhone(row.phone)) {
                result.failed++;
                result.errors.push(`Row ${i + 2}: Invalid phone format`);
                continue;
              }

              const uniqueId = generateUniqueId('STU');
              const studentId = `student_${uniqueId}`;

              const studentData = {
                name: sanitizeStudentField(row.name),
                email: email.toLowerCase().trim(),
                role: UserRole.STUDENT,
                rollNo: row.rollNo.toString().trim(),
                classId: sanitizeStudentField(row.classId),
                schoolId: schoolId,
                uniqueId: uniqueId,
                status: 'ACTIVE' as const,
                gender: row.gender || 'MALE',
                isLinked: false,
                createdAt: serverTimestamp(),
                fatherName: sanitizeStudentField(row.fatherName),
                motherName: sanitizeStudentField(row.motherName),
                phone: sanitizeCSVValue(row.phone),
                dob: sanitizeStudentField(row.dob),
                address: sanitizeStudentField(row.address),
                bloodGroup: sanitizeStudentField(row.bloodGroup),
                avatar: getDeterministicAvatar(sanitizeStudentField(row.name), UserRole.STUDENT)
              };

              operations.push({
                ref: doc(db, 'schools', schoolId, 'users', studentId),
                data: studentData,
                type: 'set'
              });

              operations.push({
                ref: doc(db, 'users', studentId),
                data: {
                  uid: studentId,
                  schoolId: schoolId,
                  role: 'STUDENT',
                  uniqueId: uniqueId
                },
                type: 'set'
              });

              result.success++;
            } catch (err) {
              result.failed++;
              result.errors.push(`Row ${i + 2}: ${err instanceof Error ? err.message : 'Parse error'}`);
            }

            if (onProgress) {
              onProgress(Math.round(((i + 1) / total) * 100));
            }
          }

          if (operations.length > 0) {
            try {
              await writeBatchChunked(operations);

              // Track usage (background, non-blocking)
              incrementHeavyOperation(schoolId, 'import', result.success).catch(err => {
                console.warn('Student import usage tracking failed:', err);
              });
            } catch (err) {
              result.errors.push(`Batch write failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
            }
          }

          resolve(result);
        },
        error: (error) => {
          result.errors.push(`CSV parse error: ${error.message}`);
          resolve(result);
        }
      });
    };

    reader.onerror = () => {
      result.errors.push('Failed to read CSV file');
      resolve(result);
    };

    reader.readAsText(csvFile);
  });
};

export const bulkImportTeachers = async (
  csvFile: File,
  schoolId: string,
  onProgress?: (progress: number) => void
): Promise<ImportResult> => {
  return new Promise((resolve) => {
    const result: ImportResult = { success: 0, failed: 0, errors: [] };
    const operations: BatchOperation[] = [];

    const reader = new FileReader();

    reader.onload = async (e) => {
      const csvContent = e.target?.result as string;

      Papa.parse<TeacherCSVRow>(csvContent, {
        header: true,
        skipEmptyLines: true,
        complete: async (parseResult) => {
          const total = parseResult.data.length;

        for (let i = 0; i < total; i++) {
          const row = parseResult.data[i]!;

          try {
            if (!row.name || !row.email) {
              result.failed++;
              result.errors.push(`Row ${i + 2}: Missing required fields (name, email)`);
              continue;
            }

            if (!validateEmail(row.email)) {
              result.failed++;
              result.errors.push(`Row ${i + 2}: Invalid email format`);
              continue;
            }

            if (row.phone && !validatePhone(row.phone)) {
              result.failed++;
              result.errors.push(`Row ${i + 2}: Invalid phone format`);
              continue;
            }

            const uniqueId = generateUniqueId('TCH');
            const teacherId = `teacher_${uniqueId}`;

            const teacherData = {
              name: sanitizeStudentField(row.name),
              email: row.email.toLowerCase().trim(),
              role: 'TEACHER' as UserRole,
              phone: sanitizeCSVValue(row.phone),
              schoolId: schoolId,
              uniqueId: uniqueId,
              status: 'ACTIVE' as const,
              gender: row.gender || 'MALE',
              subjects: row.subjects?.split(',').map(s => sanitizeStudentField(s.trim())) || [],
              qualification: sanitizeStudentField(row.qualification),
              experience: sanitizeStudentField(row.experience),
              classId: sanitizeStudentField(row.classId),
              isFirstLogin: true,
              createdAt: serverTimestamp(),
              avatar: getDeterministicAvatar(sanitizeStudentField(row.name), UserRole.TEACHER)
            };

            operations.push({
              ref: doc(db, 'schools', schoolId, 'users', teacherId),
              data: teacherData,
              type: 'set'
            });

            operations.push({
              ref: doc(db, 'users', teacherId),
              data: {
                uid: teacherId,
                schoolId: schoolId,
                role: 'TEACHER',
                uniqueId: uniqueId
              },
              type: 'set'
            });

            result.success++;
          } catch (err) {
            result.failed++;
            result.errors.push(`Row ${i + 2}: ${err instanceof Error ? err.message : 'Parse error'}`);
          }

          if (onProgress) {
            onProgress(Math.round(((i + 1) / total) * 100));
          }
        }

        if (operations.length > 0) {
          try {
            await writeBatchChunked(operations);

            // Track usage (background, non-blocking)
            incrementHeavyOperation(schoolId, 'import', result.success).catch(err => {
              console.warn('Teacher import usage tracking failed:', err);
            });
          } catch (err) {
            result.errors.push(`Batch write failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
          }
        }

          resolve(result);
        },
        error: (error) => {
          result.errors.push(`CSV parse error: ${error.message}`);
          resolve(result);
        }
      });
    };

    reader.onerror = () => {
      result.errors.push('Failed to read CSV file');
      resolve(result);
    };

    reader.readAsText(csvFile);
  });
};

export const downloadStudentTemplate = (): void => {
  const template = [
    ['name', 'rollNo', 'classId', 'fatherName', 'motherName', 'phone', 'email', 'dob', 'gender', 'address', 'bloodGroup'],
    ['Rajesh Kumar', '101', '10A', 'Ramesh Kumar', 'Smt. Sunita', '+919876543210', 'rajesh@email.com', '2010-05-15', 'MALE', '123 Main St, Delhi', 'B+'],
    ['Priya Singh', '102', '10A', 'Ajay Singh', 'Smt. Meena', '+919876543211', 'priya@email.com', '2010-08-22', 'FEMALE', '456 Oak Rd, Mumbai', 'O+']
  ];

  const csv = template.map(row => row.join(',')).join('\n');
  downloadCSV(csv, 'student_import_template.csv');
};

export const downloadTeacherTemplate = (): void => {
  const template = [
    ['name', 'email', 'phone', 'subjects', 'qualification', 'experience', 'classId', 'gender'],
    ['Ravi Sharma', 'ravi.sharma@school.com', '+919876543210', 'Mathematics,Physics', 'M.Sc.', '5 years', '10A', 'MALE'],
    ['Anita Desai', 'anita.desai@school.com', '+919876543211', 'Chemistry,Biology', 'Ph.D.', '8 years', '9A', 'FEMALE']
  ];

  const csv = template.map(row => row.join(',')).join('\n');
  downloadCSV(csv, 'teacher_import_template.csv');
};

const downloadCSV = (content: string, filename: string): void => {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
};

export default {
  bulkImportStudents,
  bulkImportTeachers,
  downloadStudentTemplate,
  downloadTeacherTemplate
};
