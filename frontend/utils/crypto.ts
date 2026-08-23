/**
 * PRODUCTION SECURITY: PBKDF2-HMAC-SHA256 credential hashing.
 * 600,000 iterations (OWASP 2023 baseline for SHA-256) with per-credential random salts.
 *
 * Storage format: "pbkdf2$<iterations>$<saltBase64>$<hashHex>"
 * Legacy format (iterations=100k, deterministic salt) is still verifiable for migration
 * but new hashes always use the new format.
 */

const ITERATIONS = 600_000;
const HASH_LENGTH = 32; // 256 bits
const LEGACY_ITERATIONS = 100_000;

const SALT_BYTES = 16;
const PIN_DIGITS = 6;
const PWD_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';

export function generateSalt(): string {
    const array = new Uint8Array(SALT_BYTES);
    crypto.getRandomValues(array);
    let bin = '';
    for (let i = 0; i < array.length; i++) bin += String.fromCharCode(array[i]!);
    return btoa(bin);
}

export async function hashCredential(password: string, salt: string, iterations: number = ITERATIONS): Promise<string> {
    const encoder = new TextEncoder();
    const passwordKey = await crypto.subtle.importKey(
        'raw',
        encoder.encode(password),
        { name: 'PBKDF2' },
        false,
        ['deriveBits']
    );
    const hashBuffer = await crypto.subtle.deriveBits(
        {
            name: 'PBKDF2',
            salt: encoder.encode(salt),
            iterations,
            hash: 'SHA-256',
        },
        passwordKey,
        HASH_LENGTH * 8
    );
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Hash with the new per-credential random salt + 600k iters.
 * Returns the full encoded string to be stored as-is.
 */
export async function hashPassword(password: string): Promise<string> {
    const salt = generateSalt();
    const hash = await hashCredential(password, salt, ITERATIONS);
    return `pbkdf2$${ITERATIONS}$${salt}$${hash}`;
}

/**
 * Verify a password against an encoded hash. Supports the new format and
 * the legacy deterministic-salt 100k format for graceful migration.
 */
export async function verifyPassword(password: string, encoded: string, uniqueId?: string, schoolId?: string): Promise<boolean> {
    const parts = encoded.split('$');
    if (parts.length === 4 && parts[0] === 'pbkdf2') {
        const iterations = parseInt(parts[1]!, 10);
        const salt = parts[2]!;
        const expectedHash = parts[3]!;
        const actual = await hashCredential(password, salt, iterations);
        return constantTimeEqual(actual, expectedHash);
    }
    if (uniqueId && schoolId) {
        const legacySalt = getCredentialSalt(uniqueId, schoolId);
        const actual = await hashCredential(password, legacySalt, LEGACY_ITERATIONS);
        return actual === encoded;
    }
    return false;
}

function constantTimeEqual(a: string, b: string): boolean {
    if (a.length !== b.length) return false;
    let mismatch = 0;
    for (let i = 0; i < a.length; i++) {
        mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }
    return mismatch === 0;
}

/**
 * Legacy deterministic salt retained ONLY for verifying old hashes during migration.
 * Never call this for new credentials.
 */
export function getCredentialSalt(uniqueId: string, schoolId: string): string {
    return `${uniqueId}:${schoolId}`;
}

/**
 * Generate a cryptographically secure 6-digit numeric PIN.
 */
export function generatePin(): string {
    const max = 900_000;
    const array = new Uint32Array(1);
    let value: number;
    do {
        crypto.getRandomValues(array);
        value = array[0]! % (max + 1);
    } while (value >= 1_000_000);
    return String(100000 + value);
}

/**
 * Generate a cryptographically secure random password of the given length.
 * Default 12 chars, uses an unambiguous alphabet (no 0/O, 1/l/I) so it's
 * easy to read aloud / type in a phone call.
 */
export function generatePassword(length: number = 12): string {
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    let out = '';
    for (let i = 0; i < length; i++) {
        out += PWD_ALPHABET[array[i]! % PWD_ALPHABET.length];
    }
    return out;
}

/**
 * Generate a URL-safe random ID of the given byte length.
 * 16 bytes = 22 base64url chars, collision-resistant for 1e9 IDs.
 */
export function generateId(byteLength: number = 16): string {
    const array = new Uint8Array(byteLength);
    crypto.getRandomValues(array);
    return btoa(String.fromCharCode(...array))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
}
