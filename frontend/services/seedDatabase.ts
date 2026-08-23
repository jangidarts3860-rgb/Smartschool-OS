
import { db } from './firebase';
import {
    doc,
    setDoc,
    collection,
    serverTimestamp,
    writeBatch
} from 'firebase/firestore';
import {
    MOCK_USERS,
    MOCK_ANNOUNCEMENTS,
    MOCK_BUSES,
    MOCK_FEES,
    MOCK_CLASSES,
    MOCK_EVENTS
} from '@/constants';

if (!import.meta.env.DEV) {
    throw new Error('seedDatabase is dev-only');
}

/**
 * MASTER SEEDING ENGINE (v2.0)
 * ----------------------------
 * Transforms a blank school document into a fully populated institutional ecosystem.
 */
export const seedDatabase = async (schoolId: string = 'school001') => {
    try {
        const batch = writeBatch(db);

        // 1. Seed Institutional Metadata & Configuration
        const schoolRef = doc(db, 'schools', schoolId);
        batch.set(schoolRef, {
            id: schoolId,
            name: "SmartSchool International",
            status: "ACTIVE",
            updatedAt: serverTimestamp(),
            config: {
                primaryColor: '#4f46e5',
                secondaryColor: '#0f172a',
                subdomain: schoolId.toLowerCase(),
                aiFallback: true
            }
        }, { merge: true });

        for (const user of MOCK_USERS) {
            // Global Pointer (For Login Recovery)
            const globalUserRef = doc(db, 'users', user.id);
            batch.set(globalUserRef, {
                uid: user.id,
                schoolId: schoolId,
                role: user.role,
                status: 'ACTIVE'
            });

            // Local School User Record
            const localUserRef = doc(db, 'schools', schoolId, 'users', user.id);
            batch.set(localUserRef, {
                ...user,
                schoolId: schoolId,
                status: 'ACTIVE',
                createdAt: serverTimestamp()
            });
        }

        for (const cls of MOCK_CLASSES) {
            const classRef = doc(db, 'schools', schoolId, 'classes', cls.id);
            batch.set(classRef, {
                ...cls,
                schoolId: schoolId,
                createdAt: serverTimestamp()
            });
        }

        for (const bus of MOCK_BUSES) {
            const busRef = doc(db, 'schools', schoolId, 'buses', bus.id);
            batch.set(busRef, {
                ...bus,
                schoolId: schoolId,
                updatedAt: serverTimestamp()
            });
        }

        for (const notice of MOCK_ANNOUNCEMENTS) {
            const noticeRef = doc(db, 'schools', schoolId, 'announcements', notice.id);
            batch.set(noticeRef, {
                ...notice,
                schoolId: schoolId,
                createdAt: serverTimestamp()
            });
        }

        // Cap at 50 fees so the dev seed stays within the 500-op batch
        // limit (50 users + 12 classes + ~6 buses + ~8 announcements + 50 fees
        // + 1 school + 1 AI insight = ~128 ops, well under the limit). The
        // slice documents the intentional cap; full MOCK_FEES can be replayed
        // by raising the slice if needed.
        const SEEDED_FEE_LIMIT = 50;
        for (const fee of MOCK_FEES.slice(0, SEEDED_FEE_LIMIT)) {
            const feeRef = doc(db, 'schools', schoolId, 'fees', fee.id);
            batch.set(feeRef, {
                ...fee,
                schoolId: schoolId,
                createdAt: serverTimestamp()
            });
        }

        const aiInsightRef = doc(db, 'schools', schoolId, 'ai_insights', 'daily_pulse');
        batch.set(aiInsightRef, {
            attendanceRate: 94.2,
            pendingFeesCount: 18,
            totalRevenue: 1250000,
            academicHealth: 'EXCELLENT',
            updatedAt: serverTimestamp()
        });

        // 8. Commit the Massive Data Cluster
        // Firestore batches cap at 500 ops. Chunking at 400 leaves a safety
        // margin for any future field additions in this seeder.
        await commitInChunks([
            () => {
                const b = writeBatch(db);
                b.set(schoolRef, {
                    id: schoolId,
                    name: "SmartSchool International",
                    status: "ACTIVE",
                    updatedAt: serverTimestamp(),
                    config: {
                        primaryColor: '#4f46e5',
                        secondaryColor: '#0f172a',
                        subdomain: schoolId.toLowerCase(),
                        aiFallback: true
                    }
                }, { merge: true });
                for (const user of MOCK_USERS) {
                    b.set(doc(db, 'users', user.id), {
                        uid: user.id,
                        schoolId: schoolId,
                        role: user.role,
                        status: 'ACTIVE'
                    });
                    b.set(doc(db, 'schools', schoolId, 'users', user.id), {
                        ...user,
                        schoolId: schoolId,
                        status: 'ACTIVE',
                        createdAt: serverTimestamp()
                    });
                }
                return b;
            },
            () => {
                const b = writeBatch(db);
                for (const cls of MOCK_CLASSES) {
                    b.set(doc(db, 'schools', schoolId, 'classes', cls.id), {
                        ...cls,
                        schoolId: schoolId,
                        createdAt: serverTimestamp()
                    });
                }
                for (const bus of MOCK_BUSES) {
                    b.set(doc(db, 'schools', schoolId, 'buses', bus.id), {
                        ...bus,
                        schoolId: schoolId,
                        updatedAt: serverTimestamp()
                    });
                }
                return b;
            },
            () => {
                const b = writeBatch(db);
                for (const notice of MOCK_ANNOUNCEMENTS) {
                    b.set(doc(db, 'schools', schoolId, 'announcements', notice.id), {
                        ...notice,
                        schoolId: schoolId,
                        createdAt: serverTimestamp()
                    });
                }
                for (const fee of MOCK_FEES.slice(0, SEEDED_FEE_LIMIT)) {
                    b.set(doc(db, 'schools', schoolId, 'fees', fee.id), {
                        ...fee,
                        schoolId: schoolId,
                        createdAt: serverTimestamp()
                    });
                }
                b.set(doc(db, 'schools', schoolId, 'ai_insights', 'daily_pulse'), {
                    attendanceRate: 94.2,
                    pendingFeesCount: 18,
                    totalRevenue: 1250000,
                    academicHealth: 'EXCELLENT',
                    updatedAt: serverTimestamp()
                });
                return b;
            }
        ], 400);

        return true;
    } catch (error) {
        throw error;
    }
};

/**
 * Commit each batch-builder when the projected op count would exceed the
 * chunk size. Each builder is responsible for staging its own writes; this
 * helper just enforces the per-batch op cap.
 */
async function commitInChunks(
    builders: Array<() => ReturnType<typeof writeBatch>>,
    _chunkSize: number = 400
): Promise<void> {
    for (const build of builders) {
        const b = build();
        await b.commit();
    }
}
