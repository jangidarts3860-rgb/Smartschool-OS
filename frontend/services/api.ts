import { auth } from './firebase';

const API_BASE = import.meta.env.VITE_API_BASE || '/api';

async function callApi<T = unknown>(endpoint: string, data: Record<string, unknown>): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  // Send Firebase ID token for authentication
  try {
    const currentUser = auth.currentUser;
    if (currentUser) {
      const token = await currentUser.getIdToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      } else {
        console.warn('[api] getIdToken returned null — sending unauthenticated request');
      }
    }
  } catch (err) {
    console.warn('[api] getIdToken failed — sending unauthenticated request', err);
  }

  const response = await fetch(`${API_BASE}/${endpoint}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: response.statusText }));
    const error: any = new Error(err.error || `API error: ${response.status}`);
    error.status = response.status;
    error.degraded = err.degraded;
    error.isMock = err.isMock;
    throw error;
  }
  return response.json();
}

export const api = {
  verifyCredential: (credential: string, storedHash: string) =>
    callApi<{ valid: boolean }>('verify-credential', { credential, storedHash }),

  hashCredential: (credential: string) =>
    callApi<{ hash: string; salt: string }>('hash-credential', { credential }),

  createGhostSession: (callerUid: string, targetSchoolId: string, targetUserId: string) =>
    callApi<{ ghostToken: string; expiresIn: number }>('ghost-create', { callerUid, targetSchoolId, targetUserId }),

  validateGhostSession: (ghostToken: string, schoolId: string) =>
    callApi<{ valid: boolean; reason?: string; user?: Record<string, unknown>; superAdmin?: string }>('ghost-validate', { ghostToken, schoolId }),

  cerebroAsk: (query: string, schoolId: string, context?: Record<string, unknown>) =>
    callApi<{ text: string; isMock?: boolean; degraded?: boolean; finishReason?: string; model?: string }>('cerebro-ask', { query, schoolId, context }),
};
