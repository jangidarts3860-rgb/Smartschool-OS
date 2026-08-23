import { auth } from './firebase';
import { api } from './api';

interface GhostSessionResult {
  ghostToken?: string;
  expiresIn?: number;
  valid?: boolean;
  reason?: string;
  user?: Record<string, unknown>;
  superAdmin?: string;
}

export const createGhostSession = async (
  targetSchoolId: string,
  targetUserId: string
): Promise<GhostSessionResult> => {
  try {
    const user = auth.currentUser;
    if (!user) return { valid: false, reason: 'Not authenticated' };
    return await api.createGhostSession(user.uid, targetSchoolId, targetUserId);
  } catch (err: any) {
    console.warn('[ghostMode] verify failed', {
      context: 'createGhostSession',
      targetSchoolId,
      targetUserId,
      error: err?.message,
    });
    return { valid: false, reason: 'Ghost session creation failed' };
  }
};

export const validateGhostToken = async (
  ghostToken: string,
  schoolId: string
): Promise<GhostSessionResult> => {
  try {
    return await api.validateGhostSession(ghostToken, schoolId);
  } catch (err: any) {
    console.warn('[ghostMode] verify failed', {
      token: (ghostToken || '').slice(0, 8) + '...',
      error: err?.message,
    });
    return { valid: false, reason: 'Ghost session validation failed' };
  }
};
