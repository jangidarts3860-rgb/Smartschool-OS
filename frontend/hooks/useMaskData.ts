
/**
 * NOTE: useMaskData is a UX hint (hides digits visually) NOT a security
 * boundary. Sensitive data is still in the DOM. Use with proper RBAC.
 */
import { useMemo } from 'react';
import { User, UserRole } from '@/types';

export const useMaskData = (currentUser: User | null) => {
  const isAdmin = useMemo(() => 
    currentUser?.role === UserRole.ADMIN || currentUser?.role === UserRole.SUPER_ADMIN, 
    [currentUser?.role]
  );

  const maskPhone = (phone: string | undefined) => {
    if (!phone) return 'N/A';
    if (isAdmin) return phone;
    return phone.length > 4 
      ? `XXXXX-X${phone.slice(-3)}` 
      : 'XXXXXX';
  };

  const maskEmail = (email: string | undefined) => {
    if (!email) return 'N/A';
    if (isAdmin) return email;
    const [name, domain] = email.split('@');
    return `${name![0]}***@${domain}`;
  };

  const maskAadhaar = (aadhaar: string | undefined) => {
    if (!aadhaar) return 'N/A';
    if (isAdmin) return aadhaar;
    return `XXXX-XXXX-${aadhaar.slice(-4)}`;
  };

  const maskBiometricId = (biometricId: string | undefined) => {
    if (!biometricId) return null;
    if (isAdmin) return biometricId;
    return `****-****-${biometricId.slice(-4)}`;
  };

  const maskUniqueId = (uniqueId: string | undefined) => {
    if (!uniqueId) return 'N/A';
    if (isAdmin) return uniqueId;
    return `***${uniqueId.slice(-4)}`;
  };

  return { maskPhone, maskEmail, maskAadhaar, maskBiometricId, maskUniqueId, isAdmin };
};
