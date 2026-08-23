import { auth, db } from './firebase';
import { User, UserRole } from '../types';
import {
  doc, getDoc, setDoc, updateDoc, deleteDoc, serverTimestamp,
  collection, query, where, getDocs, Timestamp, runTransaction
} from 'firebase/firestore';
import {
  signInWithEmailAndPassword, sendPasswordResetEmail, createUserWithEmailAndPassword
} from 'firebase/auth';
import { hashPassword as secureHash, verifyPassword as secureVerify } from '../utils/crypto';

const MAGIC_LINK_EXPIRY_MS = 24 * 60 * 60 * 1000;
const RESET_LINK_EXPIRY_MS = 15 * 60 * 1000;

// Hashes a credential into the canonical "pbkdf2$600000$salt$hash" format.
// Use this for ANY new credential write — it generates a per-credential random salt
// and returns a self-contained string that verifyPassword() can decode.
// DO NOT call hashCredential(credential) from utils/crypto directly (requires explicit salt).
async function hashCredential(credential: string): Promise<string> {
  return secureHash(credential);
}

async function verifyCredential(credential: string, storedHash: string, uniqueId?: string, schoolId?: string): Promise<boolean> {
  if (!storedHash) return false;
  return secureVerify(credential, storedHash, uniqueId, schoolId);
}

export type TokenType = 'MAGIC_LINK' | 'RESET_PASSWORD' | 'GHOST_BRIDGE';

interface AuthToken {
  token: string;
  type: TokenType;
  targetUserId: string;
  targetSchoolId: string;
  targetRole: UserRole;
  createdBy: string;
  createdAt: Timestamp;
  expiresAt: Timestamp;
  usedAt?: Timestamp | null;
  used: boolean;
}

function generateToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (b) => b.toString(16).padStart(2, '0')).join('');
}

export function maskContact(value: string): string {
  if (!value) return '';
  if (value.includes('@')) {
    const [local, domain] = value.split('@');
    return `${local![0]}${'*'.repeat(Math.max(local!.length - 2, 0))}${local![local!.length - 1]}@${domain}`;
  }
  if (value.length >= 10) {
    return `${value.slice(0, 2)}${'*'.repeat(value.length - 4)}${value.slice(-2)}`;
  }
  return value;
}

export const authService = {
  async createMagicLink(userId: string, schoolId: string, role: UserRole, createdBy: string): Promise<string> {
    const token = generateToken();
    const now = Date.now();
    const tokenDoc: AuthToken = {
      token,
      type: 'MAGIC_LINK',
      targetUserId: userId,
      targetSchoolId: schoolId,
      targetRole: role,
      createdBy,
      createdAt: Timestamp.fromMillis(now),
      expiresAt: Timestamp.fromMillis(now + MAGIC_LINK_EXPIRY_MS),
      used: false
    };
    await setDoc(doc(db, 'schools', schoolId, 'authTokens', token), tokenDoc);
    return `${window.location.origin}/auth/magic?token=${token}&schoolId=${schoolId}`;
  },

  async useMagicLink(token: string, schoolId: string): Promise<{ user: User } | { expired: boolean; used: boolean }> {
    if (import.meta.env.VITE_USE_MOCK === 'true' || import.meta.env.VITE_DEMO_MODE === 'true') {
      if (token.startsWith('mock_token_')) {
        await new Promise(r => setTimeout(r, 800));
        return { 
          user: {
            id: 'mock-admin-id',
            uniqueId: `ADM-${new Date().getFullYear()}-DEMO-1234`,
            name: 'Demo Admin',
            email: 'admin@school.com',
            role: UserRole.ADMIN,
            schoolId,
            isFirstLogin: true,
            status: 'ACTIVE',
            phone: '+91 98765 43210'
          }
        };
      }
    }

    try {
      const tokenRef = doc(db, 'schools', schoolId, 'authTokens', token);
      const tokenSnap = await getDoc(tokenRef);
      if (!tokenSnap.exists()) {
        return { expired: true, used: false };
      }
      const data = tokenSnap.data() as AuthToken;
      if (data.used && data.usedAt) {
        return { expired: false, used: true };
      }
      const now = Date.now();
      const expiresAt = data.expiresAt.toMillis();
      if (now > expiresAt) {
        return { expired: true, used: false };
      }
      await updateDoc(tokenRef, { used: true, usedAt: Timestamp.fromMillis(now) });
      const userRef = doc(db, 'schools', schoolId, 'users', data.targetUserId);
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) {
        return { expired: true, used: false };
      }
      const userData = { id: userSnap.id, ...userSnap.data() } as User;
      return { user: userData };
    } catch {
      return { expired: true, used: false };
    }
  },

  async createResetLink(userId: string, schoolId: string, role: UserRole, createdBy: string): Promise<string> {
    const token = generateToken();
    const now = Date.now();
    const tokenDoc: AuthToken = {
      token,
      type: 'RESET_PASSWORD',
      targetUserId: userId,
      targetSchoolId: schoolId,
      targetRole: role,
      createdBy,
      createdAt: Timestamp.fromMillis(now),
      expiresAt: Timestamp.fromMillis(now + RESET_LINK_EXPIRY_MS),
      used: false
    };
    await setDoc(doc(db, 'schools', schoolId, 'authTokens', token), tokenDoc);
    return `${window.location.origin}/auth/reset?token=${token}&schoolId=${schoolId}`;
  },

  async verifyAndUseResetToken(token: string, schoolId: string, newCredential: string): Promise<boolean> {
    try {
      const tokenRef = doc(db, 'schools', schoolId, 'authTokens', token);
      const tokenSnap = await getDoc(tokenRef);
      if (!tokenSnap.exists()) return false;
      const data = tokenSnap.data() as AuthToken;
      if (data.used || data.type !== 'RESET_PASSWORD') return false;
      const now = Date.now();
      if (now > data.expiresAt.toMillis()) return false;
      await updateDoc(tokenRef, { used: true, usedAt: Timestamp.fromMillis(now) });
      const userRef = doc(db, 'schools', data.targetSchoolId, 'users', data.targetUserId);
      // FIX (Bug #3): use the canonical passwordHash/passwordSalt fields.
      // Previously this wrote to `pin` (for students) or `password` (for others)
      // with a hash generated without a salt, which threw a TypeError at runtime
      // and broke BOTH the password-reset flow and the ForcePasswordChange flow.
      // Now we use the self-contained `pbkdf2$600000$salt$hash` string and
      // store it under the canonical `passwordHash` + `passwordSalt` fields,
      // matching what UserManagement.tsx / TeacherManagement.tsx already write.
      // Students/parents use a 4-digit PIN as the "password" — the field name
      // is the same; only the UI validation differs.
      const hashedCredential = await hashCredential(newCredential);
      const [algorithm, iterations, salt] = hashedCredential.split('$');
      void algorithm; void iterations;
      await updateDoc(userRef, {
        passwordHash: hashedCredential,
        passwordSalt: salt,
        isFirstLogin: false,
        forcePasswordChange: false
      });
      return true;
    } catch {
      return false;
    }
  },

  async forcePasswordChange(userId: string, schoolId: string): Promise<void> {
    const userRef = doc(db, 'schools', schoolId, 'users', userId);
    await updateDoc(userRef, { isFirstLogin: true, forcePasswordChange: true });
  },

  async setFirstLoginComplete(userId: string, schoolId: string, newCredential: string): Promise<void> {
    const userRef = doc(db, 'schools', schoolId, 'users', userId);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) return;
    // FIX (Bug #3): use the canonical passwordHash/passwordSalt fields and the
    // self-contained `pbkdf2$600000$salt$hash` string. Previously this called
    // hashCredential(newCredential) with no salt, which threw at runtime and
    // left first-time users stuck on the password-change screen.
    const hashedCredential = await hashCredential(newCredential);
    const [algorithm, iterations, salt] = hashedCredential.split('$');
    void algorithm; void iterations;
    await updateDoc(userRef, {
      passwordHash: hashedCredential,
      passwordSalt: salt,
      isFirstLogin: false,
      forcePasswordChange: false
    });
  },

  async invalidateUserSessions(userId: string, schoolId: string): Promise<void> {
    const userRef = doc(db, 'schools', schoolId, 'users', userId);
    await updateDoc(userRef, {
      sessionInvalidatedAt: serverTimestamp(),
      status: 'DISABLED',
      disabledReason: 'Admin suspended or password reset'
    });
  },

  async checkSessionValid(user: User): Promise<boolean> {
    if (import.meta.env.VITE_USE_MOCK === 'true' || import.meta.env.VITE_DEMO_MODE === 'true') {
      return true;
    }
    if (!user?.id || !user?.schoolId) return false;
    try {
      const userRef = doc(db, 'schools', user.schoolId, 'users', user.id);
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) return false;
      const data = userSnap.data();
      if (data.status === 'DISABLED' || data.status === 'PENDING') return false;
      if (data.sessionInvalidatedAt) {
        const invalidatedAt = data.sessionInvalidatedAt.toMillis?.() || 0;
        const sessionStart = localStorage.getItem(`session_start_${user.id}`);
        if (sessionStart && parseInt(sessionStart) < invalidatedAt) {
          return false;
        }
      }
      return true;
    } catch {
      return false;
    }
  },

  async adminForgotPassword(email: string): Promise<boolean> {
    try {
      await sendPasswordResetEmail(auth, email);
      return true;
    } catch {
      return false;
    }
  },

  async getRegisteredContact(uniqueId: string, role: UserRole): Promise<{ email?: string; phone?: string } | null> {
    try {
      const userData = await getDoc(doc(db, 'schools', '_registry', 'ids', uniqueId));
      if (!userData.exists()) return null;
      const { schoolId } = userData.data() as { schoolId: string };
      const usersRef = collection(db, 'schools', schoolId, 'users');
      const q = query(usersRef, where('uniqueId', '==', uniqueId));
      const snap = await getDocs(q);
      if (snap.empty) return null;
      const data = snap.docs[0].data();
      return { email: data.email, phone: data.phone };
    } catch {
      return null;
    }
  },

  async resetStudentPin(parentId: string, schoolId: string, studentId: string, newPin: string): Promise<boolean> {
    try {
      if (!/^\d{4,8}$/.test(newPin)) {
        throw new Error('PIN must be 4-8 digits');
      }
      const parentRef = doc(db, 'schools', schoolId, 'users', parentId);
      const studentRef = doc(db, 'schools', schoolId, 'users', studentId);
      const hashedPin = await hashCredential(newPin);
      return await runTransaction(db, async (transaction) => {
        const [parentDoc, studentDoc] = await Promise.all([
          transaction.get(parentRef),
          transaction.get(studentRef)
        ]);
        if (!parentDoc.exists) throw new Error('Parent not found');
        if (!studentDoc.exists) throw new Error('Student not found');
        const parentData = parentDoc.data() as { role?: string; phone?: string };
        if (parentData.role !== 'PARENT') throw new Error('Caller is not a parent');
        const studentData = studentDoc.data() as { parentPhone?: string; role?: string };
        if (studentData.role !== 'STUDENT') throw new Error('Target is not a student');
        if (!parentData.phone || studentData.parentPhone !== parentData.phone) {
          throw new Error('Parent is not linked to this student');
        }
        transaction.update(studentRef, { pin: hashedPin, isFirstLogin: true });
        return true;
      });
    } catch {
      return false;
    }
  },

  async resendWelcomeLink(userId: string, schoolId: string, phone: string): Promise<string | null> {
    try {
      const userRef = doc(db, 'schools', schoolId, 'users', userId);
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) return null;
      const userData = userSnap.data();
      const link = await authService.createMagicLink(userId, schoolId, userData.role as UserRole, 'admin');
      return link;
    } catch {
      return null;
    }
  },

  getStoredSession(): User | null {
    try {
      const raw = localStorage.getItem('ss_user');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  storeSession(user: User): void {
    localStorage.setItem('ss_user', JSON.stringify(user));
    localStorage.setItem(`session_start_${user.id}`, Date.now().toString());
  },

  clearSession(): void {
    const user = authService.getStoredSession();
    if (user?.id) {
      localStorage.removeItem(`session_start_${user.id}`);
    }
    localStorage.removeItem('ss_user');
  }
};
