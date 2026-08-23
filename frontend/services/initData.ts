import { db } from '@/services/firebase';
import { doc, setDoc, collection, serverTimestamp } from 'firebase/firestore';
import { User, UserRole } from '@/types';

/**
 * DATABASE INITIALIZER (Hierarchical SaaS Structure)
 * -----------------------------------------------
 * Following ChatGPT's suggested structure for Extreme Scalability.
 *
 * SECURITY: Real names, phone numbers and emails below are demo seed data
 * for a fictitious school. They MUST NEVER be written in production. This
 * function now refuses to run in production builds.
 */
export const initializeDatabase = async (userId: string, schoolId: string = 'school001') => {
    if (!import.meta.env.DEV) {
        throw new Error(
            'initializeDatabase() is dev-only seed. In production, schools are created ' +
            'via the signup flow (components/Login.tsx) and students via TeacherManagement ' +
            '/ UserManagement. Remove this call before deploying.'
        );
    }
    try {
        // 1. Create School Document with Metadata
        const schoolRef = doc(db, 'schools', schoolId);
        await setDoc(schoolRef, {
            schoolName: "Navjyoti Convent Sr Sec School",
            address: "Sikar, Rajasthan, India",
            contactEmail: "admin@smartschool.com",
            phone: "+91-9876543210",
            plan: "Standard",
            createdAt: serverTimestamp(),
            settings: {
                biometricEnabled: true,
                aiAutomation: true,
                timezone: "Asia/Kolkata"
            }
        });

        // 2. Create Admin in School's User Sub-collection
        const schoolUserRef = doc(db, 'schools', schoolId, 'users', userId);
        const adminData = {
            id: userId,
            name: "Super Admin",
            email: "admin@smartschool.com",
            role: "admin",
            phone: "+91-9876543210",
            schoolId: schoolId,
            status: "ACTIVE",
            createdAt: serverTimestamp()
        };
        await setDoc(schoolUserRef, adminData);

        // 3. IMPORTANT: Create a Root Pointer for Auth Lookup
        // We need this so App.tsx can find the schoolId from just the UID
        await setDoc(doc(db, 'users', userId), {
            uid: userId,
            schoolId: schoolId,
            role: 'admin'
        });

        // 4. Create Initial Sample Student (stu001) as per structure
        const studentRef = doc(db, 'schools', schoolId, 'students', 'stu001');
        await setDoc(studentRef, {
            name: "Rohan Gupta",
            rollNo: 1,
            class: "7A",
            section: "A",
            parentId: "par001",
            biometricId: "bio-7A-001",
            joinedAt: serverTimestamp(),
status: "active"
        });

        if (import.meta.env.DEV) {
          console.log("Hierarchical Database Initialized successfully.");
        }
        return true;
    } catch (error) {
        if (import.meta.env.DEV) {
          console.error("Initialization error:", error);
        }
        throw error;
    }
};
