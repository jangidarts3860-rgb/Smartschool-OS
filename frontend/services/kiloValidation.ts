/**
 * Kilo QA Validation Functions
 * Centralized validation for all edge cases
 */

import { UserRole } from '@/types';
import { generateId } from '@/lib/utils';

// ==========================================
// FEE LEDGER VALIDATIONS
// ==========================================

export interface FeeValidationResult {
  valid: boolean;
  errors: string[];
}

export const validateFeePayment = (
  currentStatus: string,
  currentAmountPaid: number,
  totalAmount: number,
  paymentAmount: number,
  lateFine: number,
  discount: number
): FeeValidationResult => {
  const errors: string[] = [];

  // Already paid check
  if (currentStatus === 'PAID') {
    errors.push('Fee already fully paid');
  }

  // Calculate net amount
  const netAmount = paymentAmount + lateFine - discount;

  // Negative amount check
  if (netAmount < 0) {
    errors.push('Payment amount cannot be negative after discounts');
  }

  // Exceeds remaining balance check (allow 100 for rounding)
  const remainingBalance = totalAmount - currentAmountPaid;
  if (netAmount > remainingBalance + 100) {
    errors.push('Payment exceeds remaining balance');
  }

  // Zero or negative payment
  if (paymentAmount <= 0) {
    errors.push('Payment amount must be positive');
  }

  return {
    valid: errors.length === 0,
    errors
  };
};

export const generateIdempotencyKey = (feeId: string): string => {
  return `fee_${feeId}_${Date.now()}_${generateId().slice(0, 4)}`;
};

// ==========================================
// ATTENDANCE VALIDATIONS
// ==========================================

export interface AttendanceValidationResult {
  valid: boolean;
  error?: string;
}

export const validateBiometricScan = (
  existingRecord: { status?: string; lastMarkedAt?: number } | null,
  newStatus: string
): AttendanceValidationResult => {
  if (!existingRecord) {
    return { valid: true };
  }

  // Check for duplicate scan (within 5 minutes)
  if (existingRecord.lastMarkedAt) {
    const timeSinceLastMark = Date.now() - existingRecord.lastMarkedAt;
    if (timeSinceLastMark < 5 * 60 * 1000) {
      return {
        valid: false,
        error: 'DUPLICATE_SCAN: Please wait 5 minutes before scanning again'
      };
    }
  }

  // Prevent marking present if already present
  if (existingRecord.status === 'PRESENT' && newStatus === 'PRESENT') {
    return {
      valid: false,
      error: 'ALREADY_MARKED_PRESENT: Student is already marked present today'
    };
  }

  return { valid: true };
};

// ==========================================
// PAYROLL CALCULATIONS
// ==========================================

export interface PayrollCalculationResult {
  netPay: number;
  isValid: boolean;
  errors: string[];
}

export const calculateNetSalary = (
  baseSalary: number,
  bonuses: Record<string, number>,
  deductions: Record<string, number>
): PayrollCalculationResult => {
  const errors: string[] = [];

  // Handle undefined/null values
  const safeBase = typeof baseSalary === 'number' && !isNaN(baseSalary) ? baseSalary : 0;
  const safeBonuses = Object.values(bonuses || {}).reduce(
    (a, b) => a + (typeof b === 'number' && !isNaN(b) ? b : 0),
    0
  );
  const safeDeductions = Object.values(deductions || {}).reduce(
    (a, b) => a + (typeof b === 'number' && !isNaN(b) ? b : 0),
    0
  );

  // Total available for deductions
  const totalAvailable = safeBase + safeBonuses;

  // Ensure deductions don't exceed available amount
  let actualDeductions = safeDeductions;
  if (safeDeductions > totalAvailable) {
    actualDeductions = totalAvailable;
    errors.push('Deductions capped at salary amount');
  }

  // Ensure non-negative result
  const netPay = Math.max(0, totalAvailable - actualDeductions);

  // Check for invalid inputs
  if (safeBase < 0) {
    errors.push('Base salary cannot be negative');
  }
  if (safeBonuses < 0) {
    errors.push('Bonuses cannot be negative');
  }
  if (safeDeductions < 0) {
    errors.push('Deductions cannot be negative');
  }

  return {
    netPay,
    isValid: errors.length === 0 && netPay >= 0,
    errors
  };
};

// ==========================================
// DATA VALIDATION
// ==========================================

export const isValidEmail = (email: string | null | undefined): boolean => {
  if (!email) return false;
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
};

export const isValidPhone = (phone: string | null | undefined): boolean => {
  if (!phone) return true; // Phone is optional
  const phoneRegex = /^\+?[\d\s-]{10,}$/;
  return phoneRegex.test(phone);
};

export const isValidName = (name: string | null | undefined): boolean => {
  if (!name || typeof name !== 'string') return false;
  return name.length >= 2 && name.length <= 100;
};

export const isValidRole = (role: string | null | undefined): boolean => {
  if (!role) return false;
  const validRoles = ['ADMIN', 'TEACHER', 'STUDENT', 'PARENT', 'SUPER_ADMIN'];
  return validRoles.includes(role);
};

export const isValidStatus = (
  status: string | null | undefined,
  validList: string[]
): boolean => {
  if (!status) return false;
  return validList.includes(status);
};

export const isValidAmount = (amount: unknown): boolean => {
  return typeof amount === 'number' && amount >= 0 && !isNaN(amount);
};

export const isValidDate = (date: string | null | undefined): boolean => {
  if (!date) return true; // Optional
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  return dateRegex.test(date);
};

export const isNonEmptyString = (value: unknown): boolean => {
  return typeof value === 'string' && value.length > 0;
};

// ==========================================
// RBAC VALIDATIONS
// ==========================================

export const isAdmin = (role: string): boolean => {
  return role === 'ADMIN' || role === 'SUPER_ADMIN';
};

export const canAccessRoute = (
  userRole: string,
  requiredRoles: string[]
): boolean => {
  return requiredRoles.includes(userRole);
};

export const canAccessStudentData = (
  userRole: string,
  userId: string,
  targetStudentId: string,
  childrenIds?: string[]
): boolean => {
  // Admin can access all
  if (isAdmin(userRole)) return true;

  // Students can only access their own data
  if (userRole === 'STUDENT') return userId === targetStudentId;

  // Parents can access their children's data
  if (userRole === 'PARENT') {
    return childrenIds?.includes(targetStudentId) ?? false;
  }

  return false;
};

// ==========================================
// BATCH ATTENDANCE VALIDATION
// ==========================================

export interface BatchAttendanceValidation {
  valid: boolean;
  errors: Array<{ studentId: string; error: string }>;
}

export const validateBatchAttendance = (
  records: Array<{ studentId: string; status: string }>
): BatchAttendanceValidation => {
  const errors: Array<{ studentId: string; error: string }> = [];
  const validStatuses = ['PRESENT', 'ABSENT', 'LATE'];

  for (const record of records) {
    if (!record.studentId) {
      errors.push({ studentId: 'UNKNOWN', error: 'Student ID is required' });
    }
    if (!validStatuses.includes(record.status)) {
      errors.push({
        studentId: record.studentId,
        error: `Invalid status: ${record.status}. Must be PRESENT, ABSENT, or LATE`
      });
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
};

export default {
  validateFeePayment,
  generateIdempotencyKey,
  validateBiometricScan,
  calculateNetSalary,
  isValidEmail,
  isValidPhone,
  isValidName,
  isValidRole,
  isValidStatus,
  isValidAmount,
  isValidDate,
  isNonEmptyString,
  isAdmin,
  canAccessRoute,
  canAccessStudentData,
  validateBatchAttendance
};
