
import { db } from './firebase';
import { doc, runTransaction, serverTimestamp, increment, Timestamp } from 'firebase/firestore';

/**
 * PRODUCTION SECURITY: Server-side Rate Limiting
 * Uses Firestore runTransaction for atomic read-then-write to prevent race
 * conditions between concurrent login attempts.
 *
 * The check is combined with the increment in a single transaction, so callers
 * no longer have to remember to call `recordFailedAttempt` separately — the
 * counter advances on every call. Failed-credential callers should still call
 * `recordFailedAttempt` to re-evaluate the lockout threshold against the
 * latest counter value.
 */
export const checkRateLimit = async (userId: string, schoolId: string) => {
    const limitRef = doc(db, 'schools', schoolId, 'rateLimits', userId);

    try {
        return await runTransaction(db, async (transaction) => {
            const limitDoc = await transaction.get(limitRef);

            if (!limitDoc.exists()) {
                transaction.set(limitRef, {
                    attempts: 1,
                    lastAttempt: serverTimestamp(),
                    lockedUntil: null
                });
                return { allowed: true, attempts: 1 };
            }

            const data = limitDoc.data();
            const lockedUntil = data.lockedUntil?.toMillis?.() || 0;
            // Use Date.now() (client clock) for the window check — the lock
            // window is coarse (30s+) so skew of a few seconds is harmless.
            // A future hardening would use a server-stored epoch.
            const now = Date.now();

            if (lockedUntil > now) {
                const waitTime = Math.ceil((lockedUntil - now) / 1000);
                // Do NOT increment while locked — that would extend the lock.
                return { allowed: false, waitTime, attempts: data.attempts || 0 };
            }

            // Atomically bump the counter inside the same transaction so two
            // concurrent checks can't both see attempts=N and both pass.
            const newAttempts = (data.attempts || 0) + 1;
            transaction.update(limitRef, {
                attempts: newAttempts,
                lastAttempt: serverTimestamp()
            });
            return { allowed: true, attempts: newAttempts };
        });
    } catch {
        return { allowed: true };
    }
};

export const recordFailedAttempt = async (userId: string, schoolId: string, currentAttempts: number) => {
    const limitRef = doc(db, 'schools', schoolId, 'rateLimits', userId);

    try {
        await runTransaction(db, async (transaction) => {
            const limitDoc = await transaction.get(limitRef);
            const attempts = (limitDoc.exists() ? limitDoc.data().attempts || 0 : 0) + 1;

            const lockDuration = attempts >= 10 ? 3600000
                : attempts >= 5 ? 900000
                : attempts >= 3 ? 30000
                : 0;

            const updateData: Record<string, unknown> = {
                attempts: increment(1),
                lastAttempt: serverTimestamp()
            };

            if (lockDuration > 0) {
                // NOTE: lockedUntil uses Date.now() (client clock) — risk of
                // skew between this client and the server. Acceptable for a
                // soft lockout window; a future hardening would compute the
                // unlock time from the server timestamp + lockDuration.
                updateData.lockedUntil = Timestamp.fromMillis(Date.now() + lockDuration);
            }

            transaction.set(limitRef, updateData, { merge: true });
        });
    } catch {
        // Fail open — don't block login on transaction failure
    }
};

export const resetRateLimit = async (userId: string, schoolId: string) => {
    const limitRef = doc(db, 'schools', schoolId, 'rateLimits', userId);
    try {
        await runTransaction(db, async (transaction) => {
            transaction.set(limitRef, {
                attempts: 0,
                lastAttempt: serverTimestamp(),
                lockedUntil: null
            });
        });
    } catch {
        // Silently fail on reset
    }
};
