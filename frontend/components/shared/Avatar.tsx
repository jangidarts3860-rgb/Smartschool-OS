import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { isFemaleName, getDeterministicAvatar, STUDENT_AARAV_PHOTO, ADMIN_VIKRAM_PHOTO } from '@/constants';

interface AvatarProps {
  src?: string | null;
  name: string;
  role?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl';
  className?: string;
  alt?: string;
}

const GRADIENT_PALETTES = [
  { bg: '#4F46E5', accent: '#818CF8' },  // Indigo
  { bg: '#7C3AED', accent: '#A78BFA' },  // Violet
  { bg: '#2563EB', accent: '#60A5FA' },  // Blue
  { bg: '#0891B2', accent: '#22D3EE' },  // Cyan
  { bg: '#059669', accent: '#34D399' },  // Emerald
  { bg: '#D97706', accent: '#FBBF24' },  // Amber
  { bg: '#DC2626', accent: '#F87171' },  // Red
  { bg: '#DB2777', accent: '#F472B6' },  // Pink
  { bg: '#7C3AED', accent: '#C084FC' },  // Purple
  { bg: '#0D9488', accent: '#2DD4BF' },  // Teal
];

// Deterministic hash from name string
const hashName = (name: string): number => {
  let h = 0;
  for (let i = 0; i < name.length; i++) {
    h = name.charCodeAt(i) + ((h << 5) - h);
  }
  return Math.abs(h);
};

// Generate a beautiful inline SVG avatar as a data URI
const generateAvatarSvg = (name: string, isFemale: boolean, hash: number): string => {
  const palette = GRADIENT_PALETTES[hash % GRADIENT_PALETTES.length]!;

  // Skin tones
  const skinTones = ['#FFDBB4', '#EDB98A', '#D08B5B', '#C68642', '#8D5524'];
  const skinTone = skinTones[hash % skinTones.length]!;
  const skinShadow = skinTones[(hash + 1) % skinTones.length]!;

  // Hair colors
  const hairColors = ['#2C1B18', '#4A3728', '#1C1C1C', '#3B2F2F', '#654321'];
  const hairColor = hairColors[hash % hairColors.length]!;

  // Build the SVG with a stylized person silhouette
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
    <defs>
      <linearGradient id="bg${hash}" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${palette.bg}"/>
        <stop offset="100%" stop-color="${palette.accent}"/>
      </linearGradient>
      <clipPath id="circle${hash}">
        <circle cx="50" cy="50" r="50"/>
      </clipPath>
    </defs>
    <g clip-path="url(#circle${hash})">
      <!-- Background gradient -->
      <rect width="100" height="100" fill="url(#bg${hash})"/>
      <!-- Body/shoulders -->
      <ellipse cx="50" cy="95" rx="35" ry="22" fill="${skinShadow}" opacity="0.7"/>
      <ellipse cx="50" cy="98" rx="38" ry="24" fill="${palette.bg}" opacity="0.5"/>
      <!-- Neck -->
      <rect x="42" y="62" width="16" height="14" rx="4" fill="${skinTone}"/>
      <!-- Head -->
      <ellipse cx="50" cy="42" rx="22" ry="25" fill="${skinTone}"/>
      <!-- Hair -->
      ${isFemale ? `
        <!-- Female hair: longer, flowing -->
        <ellipse cx="50" cy="35" rx="24" ry="22" fill="${hairColor}"/>
        <ellipse cx="50" cy="28" rx="22" ry="16" fill="${hairColor}"/>
        <!-- Side hair strands -->
        <ellipse cx="28" cy="48" rx="6" ry="18" fill="${hairColor}" opacity="0.9"/>
        <ellipse cx="72" cy="48" rx="6" ry="18" fill="${hairColor}" opacity="0.9"/>
      ` : `
        <!-- Male hair: shorter -->
        <ellipse cx="50" cy="30" rx="23" ry="17" fill="${hairColor}"/>
        <rect x="28" y="22" width="44" height="12" rx="6" fill="${hairColor}"/>
      `}
      <!-- Eyes -->
      <ellipse cx="40" cy="43" rx="3" ry="2.5" fill="#1a1a2e"/>
      <ellipse cx="60" cy="43" rx="3" ry="2.5" fill="#1a1a2e"/>
      <circle cx="41" cy="42.5" r="0.8" fill="white" opacity="0.8"/>
      <circle cx="61" cy="42.5" r="0.8" fill="white" opacity="0.8"/>
      <!-- Eyebrows -->
      <path d="M35 38 Q40 35 45 38" stroke="${hairColor}" stroke-width="1.5" fill="none" stroke-linecap="round"/>
      <path d="M55 38 Q60 35 65 38" stroke="${hairColor}" stroke-width="1.5" fill="none" stroke-linecap="round"/>
      <!-- Nose -->
      <path d="M48 47 Q50 50 52 47" stroke="${skinShadow}" stroke-width="1" fill="none" opacity="0.6"/>
      <!-- Smile -->
      <path d="M42 54 Q50 60 58 54" stroke="#c0392b" stroke-width="1.5" fill="none" stroke-linecap="round" opacity="0.7"/>
      <!-- Shirt/clothing -->
      <ellipse cx="50" cy="92" rx="32" ry="18" fill="${palette.bg}" opacity="0.85"/>
      <ellipse cx="50" cy="90" rx="28" ry="14" fill="${palette.accent}" opacity="0.4"/>
      <!-- Collar detail -->
      <path d="M42 76 L50 82 L58 76" stroke="white" stroke-width="1" fill="none" opacity="0.5"/>
    </g>
  </svg>`;

  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
};

const Avatar: React.FC<AvatarProps> = ({ src, name, role, size = 'md', className = '', alt }) => {
  const cleanName = (name || 'User').trim();
  const avatarKey = `smartschool-avatar:${role || 'user'}:${cleanName.toLowerCase()}`;
  const [savedSrc, setSavedSrc] = useState<string | null>(null);
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    setImageFailed(false);
  }, [src, name, role]);

  useEffect(() => {
    const readAvatar = () => setSavedSrc(localStorage.getItem(avatarKey));
    readAvatar();
    window.addEventListener('storage', readAvatar);
    window.addEventListener('smartschool-avatar-updated', readAvatar);
    return () => {
      window.removeEventListener('storage', readAvatar);
      window.removeEventListener('smartschool-avatar-updated', readAvatar);
    };
  }, [avatarKey]);

  const isFemale = isFemaleName(cleanName);
  const hash = hashName(cleanName);

  const sizeClasses: Record<string, string> = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base font-bold',
    xl: 'w-16 h-16 text-xl font-bold',
    '2xl': 'w-20 h-20 text-2xl font-black',
    '3xl': 'w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 text-3xl font-black',
    '4xl': 'w-32 h-32 md:w-40 md:h-40 text-4xl font-black',
  };

  // Determine avatar source hierarchy:
  const deterministicSrc = getDeterministicAvatar(cleanName, role);
  const normalizedRole = String(role || '').toUpperCase();
  const lowerName = cleanName.toLowerCase();
  const isAdmin = normalizedRole === 'ADMIN' || normalizedRole === 'SUPER_ADMIN' || lowerName.includes('vikram') || lowerName.includes('malhotra') || lowerName === 'admin';
  const isAarav = lowerName.includes('aarav') || lowerName === 'student';

  const primarySrc = isAdmin
    ? ADMIN_VIKRAM_PHOTO
    : isAarav 
    ? STUDENT_AARAV_PHOTO 
    : (savedSrc || (src && !src.includes('photo-1506794778202-cad84cf45f1d') && !src.includes('photo-1539571696357-5a69c17a67c6') && !src.includes('photo-1560250097-0b93528c311a') ? src : deterministicSrc));
  
  const finalSrc = (isAdmin || isAarav) 
    ? (isAdmin ? ADMIN_VIKRAM_PHOTO : STUDENT_AARAV_PHOTO) 
    : (imageFailed ? generateAvatarSvg(cleanName, isFemale, hash) : primarySrc);

  return (
    <div className={cn('relative rounded-full overflow-hidden shrink-0 select-none shadow-md bg-slate-800 flex items-center justify-center', sizeClasses[size], className)}>
      <img
        src={finalSrc}
        alt={alt || cleanName}
        className={cn(
          "w-full h-full object-cover",
          isAarav ? "object-[center_15%]" : isAdmin ? "object-[center_20%]" : "object-center"
        )}
        onError={() => {
          if (!isAarav && !isAdmin) setImageFailed(true);
        }}
      />
    </div>
  );
};

export default Avatar;
