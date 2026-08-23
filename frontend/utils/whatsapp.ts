/**
 * Zero-Cost WhatsApp Integration via wa.me links
 * Admin clicks button → WhatsApp Web opens → pre-filled message → Admin presses Send
 * No paid API (Twilio/Wati/MSG91) required.
 * 
 * SECURITY: All user inputs are sanitized to prevent XSS via WhatsApp links.
 */

export type WhatsAppTemplate = 'STUDENT_ADMISSION' | 'TEACHER_INVITE' | 'CREDENTIAL_RESET' | 'SCHOOL_WELCOME' | 'PARENT_WELCOME';

interface TemplateData {
    schoolName: string;
    name: string;
    uniqueId: string;
    credential: string;
    loginUrl?: string;
    role?: string;
    parentName?: string;
    magicLink?: string;
}

export class WhatsAppDisabledError extends Error {
    constructor() {
        super('WhatsApp integration is disabled. Set VITE_ENABLE_WHATSAPP=true to enable.');
        this.name = 'WhatsAppDisabledError';
    }
}

/**
 * Centralized feature-flag check.
 * All callers MUST gate their wa.me link generation on this function.
 * Default: `false` (opt-in). Production deployments must explicitly enable it.
 */
export function isWhatsAppEnabled(): boolean {
    try {
        const flag = import.meta.env.VITE_ENABLE_WHATSAPP;
        return flag === true || flag === 'true';
    } catch {
        return false;
    }
}

const DEFAULT_LOGIN_URL = typeof window !== 'undefined' ? window.location.origin : 'https://smartschool-os.vercel.app';

// WhatsApp message limit
const MAX_MESSAGE_LENGTH = 4096;

/**
 * Sanitize string input - remove potential XSS characters
 */
function sanitizeInput(text: string | undefined | null): string {
    if (!text) return '';
    // Remove HTML/JS special characters
    return text
        .replace(/[<>\"'&]/g, '')
        // Strip Unicode bidi/format controls used to obfuscate text direction.
        // Keep this regex in sync with functions/src/invites.ts sanitizeInput.
        .replace(/[\u202A-\u202E\u2066-\u2069\u200E\u200F\u2028\u2029]/g, '')
        .replace(/\n+/g, '\n')
        .trim()
        .slice(0, 500); // Reasonable length limit
}

/**
 * Sanitize URL - ensure it starts with http(s)
 */
function sanitizeUrl(url: string | undefined | null): string {
    if (!url) return DEFAULT_LOGIN_URL;
    if (url.startsWith('http://') || url.startsWith('https://')) {
        return url.slice(0, 2000); // Reasonable URL length
    }
    return DEFAULT_LOGIN_URL;
}

function encode(text: string): string {
    // Truncate to WhatsApp's limit before encoding
    return encodeURIComponent(text.slice(0, MAX_MESSAGE_LENGTH));
}

/**
 * Sanitize phone number for WhatsApp URL
 * - Remove all non-digit characters
 * - Ensure valid Indian format
 */
function sanitizePhone(phone: string): string {
    const digits = phone.replace(/\D/g, '');
    // Ensure Indian format with +91
    if (digits.length === 10) return `91${digits}`;
    if (digits.startsWith('91') && digits.length === 12) return digits;
    if (digits.startsWith('0') && digits.length === 11) return `91${digits.slice(1)}`;
    return digits;
}

function buildTemplate(type: WhatsAppTemplate, data: TemplateData): string {
    // FIXED: Sanitize all user inputs to prevent XSS
    const sanitizedSchoolName = sanitizeInput(data.schoolName);
    const sanitizedName = sanitizeInput(data.name);
    const sanitizedUniqueId = sanitizeInput(data.uniqueId);
    const sanitizedCredential = sanitizeInput(data.credential);
    const sanitizedLoginUrl = sanitizeUrl(data.loginUrl);
    const sanitizedRole = sanitizeInput(data.role);
    const sanitizedParentName = sanitizeInput(data.parentName);
    const sanitizedMagicLink = sanitizeUrl(data.magicLink);

    switch (type) {
        case 'STUDENT_ADMISSION': {
            return `🏫 *${sanitizedSchoolName}*\n\nDear ${sanitizedParentName || 'Parent'},\n\nYour child *${sanitizedName}* has been successfully enrolled!\n\n🆔 *Student ID:* ${sanitizedUniqueId}\n🔐 *PIN:* ${sanitizedCredential}\n🔗 *Login:* ${sanitizedLoginUrl}\n\n📱 Download our app or visit the link above to check attendance, results, fees & more.\n\n💡 *Benefits:*\n• Real-time attendance alerts\n• Fee payment online\n• Homework & exam updates\n• Direct chat with teachers\n\nPlease save this message. Contact admin if you need help.`;
        }

        case 'TEACHER_INVITE': {
            return `🏫 *${sanitizedSchoolName}*\n\nDear *${sanitizedName}*,\n\nYour teacher account is ready!\n\n🆔 *Teacher ID:* ${sanitizedUniqueId}\n🔐 *Password:* ${sanitizedCredential}\n🔗 *Login:* ${sanitizedLoginUrl}\n\n💡 *What you can do:*\n• Mark attendance digitally\n• Upload exam results\n• Share homework & notices\n• Chat with parents\n• Manage your class timetable\n\n⚠️ *Please change your password after first login for security.*\n\nWelcome to the team! 🎉`;
        }

        case 'CREDENTIAL_RESET': {
            const label = sanitizedRole === 'STUDENT' ? 'PIN' : 'Password';
            return `🏫 *${sanitizedSchoolName}*\n\nHello *${sanitizedName}*,\n\nYour login credentials have been reset by the admin.\n\n🆔 *ID:* ${sanitizedUniqueId}\n🔐 *New ${label}:* ${sanitizedCredential}\n🔗 *Login:* ${sanitizedLoginUrl}\n\nPlease use the new ${label} to log in.\n\n🚨 *Didn't request this?* Contact admin immediately to secure your account.`;
        }

        case 'SCHOOL_WELCOME': {
            const inviteBlock = sanitizedMagicLink
                ? `🔐 *Secure one-time sign-in link:*\n${sanitizedMagicLink}\n_(valid for 24 hours)_\n\nYou'll set your password after clicking the link above.`
                : `🔐 *Admin ID:* ${sanitizedUniqueId}\n🔗 *Portal:* ${sanitizedLoginUrl}\n\nSign in with your email and the password you chose during registration.`;
            return `🎉 *Welcome to SmartSchool OS!*\n\nDear *${sanitizedName}*,\n\nYour school *${sanitizedSchoolName}* has been successfully registered.\n\n${inviteBlock}\n\n💡 *What you can do:*\n• Manage students, teachers & fees\n• Send announcements via WhatsApp\n• Track attendance & results with AI insights\n• Auto-generate report cards\n• Accept online fee payments\n\n🚀 *Next Steps:*\n1. Tap the secure link above to set your password\n2. Add classes & subjects\n3. Invite teachers\n4. Enroll students\n\nNeed help? Reply here or call support.`;
        }

        case 'PARENT_WELCOME': {
            return `🏫 *${sanitizedSchoolName}*\n\nDear *${sanitizedName}*,\n\nYou are now linked to your child's school account!\n\n🆔 *Child ID:* ${sanitizedUniqueId}\n🔗 *Parent Portal:* ${sanitizedLoginUrl}\n\n💡 *What you can do:*\n• Check daily attendance\n• Pay fees securely online\n• View exam results & report cards\n• Chat directly with teachers\n• Get instant announcements\n\n📱 *Login using your child's ID + your registered phone number.*\n\nWelcome to digital parenting! 🎓`;
        }

        default:
            return '';
    }
}

/**
 * Generate a wa.me link that opens WhatsApp Web with pre-filled message
 * SECURITY: All inputs are sanitized to prevent XSS attacks
 *
 * Throws WhatsAppDisabledError if VITE_ENABLE_WHATSAPP !== 'true'.
 * Callers should catch this and fall back to an in-app magic link display.
 */
export function generateWaMeLink(phone: string, templateType: WhatsAppTemplate, data: TemplateData): string {
    if (!isWhatsAppEnabled()) {
        throw new WhatsAppDisabledError();
    }
    const cleanPhone = sanitizePhone(phone);
    if (!cleanPhone || cleanPhone.length < 10) {
        throw new Error('Invalid phone number');
    }
    const message = buildTemplate(templateType, data);
    return `https://wa.me/${cleanPhone}?text=${encode(message)}`;
}

/**
 * Generate a wa.me link for multiple phone numbers (comma separated in message)
 * Use when admin wants to send to multiple parents at once (copy-paste broadcast)
 *
 * Throws WhatsAppDisabledError if VITE_ENABLE_WHATSAPP !== 'true'.
 */
export function generateWaMeBroadcast(templateType: WhatsAppTemplate, data: TemplateData): string {
    if (!isWhatsAppEnabled()) {
        throw new WhatsAppDisabledError();
    }
    const message = buildTemplate(templateType, data);
    return `https://wa.me/?text=${encode(message)}`;
}

/**
 * Copy message to clipboard for fallback when WhatsApp isn't available
 */
export async function copyMessageToClipboard(templateType: WhatsAppTemplate, data: TemplateData): Promise<void> {
    const message = buildTemplate(templateType, data);
    await navigator.clipboard.writeText(message);
}

/**
 * Auto-generate a 4-digit PIN (1000-9999) using crypto.getRandomValues.
 * Re-exports the secure implementation from utils/crypto for backward compatibility.
 */
export { generatePin, generatePassword as generateTempPassword } from './crypto';
