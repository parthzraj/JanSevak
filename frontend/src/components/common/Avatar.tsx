import React, { useState } from 'react';

/** Built-in avatar illustrations a user can pick in Edit Profile. Stored on the server as "preset:<key>". */
export const AVATAR_PRESETS: { key: string; label: string }[] = [
  { key: 'man-1', label: 'Man 1' },
  { key: 'man-2', label: 'Man 2' },
  { key: 'man-3', label: 'Man 3' },
  { key: 'woman-1', label: 'Woman 1' },
  { key: 'woman-2', label: 'Woman 2' },
  { key: 'woman-3', label: 'Woman 3' },
  { key: 'neutral-1', label: 'Neutral 1' },
  { key: 'neutral-2', label: 'Neutral 2' },
];

const SKIN = ['#f1c9a5', '#e0a982', '#c68863', '#a86b48'];
const BG: Record<string, string> = {
  'man-1': '#bfdbfe',
  'man-2': '#bbf7d0',
  'man-3': '#fde68a',
  'woman-1': '#fbcfe8',
  'woman-2': '#ddd6fe',
  'woman-3': '#fed7aa',
  'neutral-1': '#a7f3d0',
  'neutral-2': '#fecaca',
};
const HAIR: Record<string, string> = {
  'man-1': '#1f2937',
  'man-2': '#3b2a1a',
  'man-3': '#6b7280',
  'woman-1': '#2b1b12',
  'woman-2': '#111827',
  'woman-3': '#7c3f1d',
  'neutral-1': '#374151',
  'neutral-2': '#92400e',
};
const SHIRT: Record<string, string> = {
  'man-1': '#0f2d59',
  'man-2': '#166534',
  'man-3': '#9a3412',
  'woman-1': '#be185d',
  'woman-2': '#5b21b6',
  'woman-3': '#0f766e',
  'neutral-1': '#1d4e8c',
  'neutral-2': '#7f1d1d',
};

function PresetArt({ presetKey }: { presetKey: string }) {
  const kind = presetKey.split('-')[0];
  const skin = SKIN[(presetKey.charCodeAt(presetKey.length - 1) + presetKey.length) % SKIN.length];
  const hair = HAIR[presetKey] ?? '#222';
  return (
    <svg viewBox="0 0 64 64" width="100%" height="100%" role="img" aria-hidden="true">
      <rect width="64" height="64" fill={BG[presetKey] ?? '#e2e8f0'} />
      {/* back hair for longer styles */}
      {kind === 'woman' && <path d="M17 34c0-14 7-21 15-21s15 7 15 21v14H17z" fill={hair} />}
      {presetKey === 'neutral-2' && <path d="M18 32c0-12 6-19 14-19s14 7 14 19v8H18z" fill={hair} />}
      {/* shoulders */}
      <path d="M8 64c0-13 10-19 24-19s24 6 24 19z" fill={SHIRT[presetKey] ?? '#334155'} />
      {/* neck + head */}
      <rect x="28" y="38" width="8" height="9" rx="3" fill={skin} />
      <ellipse cx="32" cy="29" rx="11" ry="12.5" fill={skin} />
      {/* hair on top */}
      {kind === 'man' && presetKey !== 'man-3' && <path d="M20.5 27c0-9 5-14 11.5-14s11.5 5 11.5 14c-3-4-7-5.5-11.5-5.5S23.5 23 20.5 27z" fill={hair} />}
      {presetKey === 'man-3' && <path d="M21 25c1-7 5-11 11-11s10 4 11 11c-4-2-7-3-11-3s-7 1-11 3z" fill={hair} />}
      {kind === 'woman' && <path d="M20.5 29c0-10 5-15 11.5-15s11.5 5 11.5 15c-2-6-6-9-11.5-9s-9.5 3-11.5 9z" fill={hair} />}
      {kind === 'neutral' && <path d="M20.5 27c0-9 5-14 11.5-14s11.5 5 11.5 14c-4-5-8-6-11.5-6s-7.5 1-11.5 6z" fill={hair} />}
      {presetKey === 'man-2' && <path d="M24 35c2 5 5 6 8 6s6-1 8-6c-2 2-5 3-8 3s-6-1-8-3z" fill={hair} opacity="0.9" />}
      {/* face */}
      <circle cx="27.5" cy="30" r="1.2" fill="#1f2937" />
      <circle cx="36.5" cy="30" r="1.2" fill="#1f2937" />
      <path d="M28.5 35.5c1.8 1.6 5.2 1.6 7 0" stroke="#7c2d12" strokeWidth="1.2" fill="none" strokeLinecap="round" />
    </svg>
  );
}

const PALETTE = ['#0f2d59', '#1d4e8c', '#166534', '#9a3412', '#6d28d9', '#be185d', '#0f766e', '#a16207'];

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase();
}

function colourFor(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return PALETTE[h % PALETTE.length];
}

interface AvatarProps {
  /** "preset:<key>", an image URL, or empty (-> coloured initials, different for every person) */
  src?: string | null;
  name: string;
  /** pixel size; the avatar is a circle unless `rounded` is overridden */
  size?: number;
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({ src, name, size = 32, className = '' }) => {
  const [failed, setFailed] = useState(false);
  const style: React.CSSProperties = { width: size, height: size, minWidth: size };
  const base = `rounded-full overflow-hidden shrink-0 inline-flex items-center justify-center select-none ${className}`;

  if (src && src.startsWith('preset:')) {
    return (
      <span className={base} style={style} title={name}>
        <PresetArt presetKey={src.slice('preset:'.length)} />
      </span>
    );
  }
  if (src && !failed) {
    return (
      <img
        src={src}
        alt={name}
        className={`${base} object-cover`}
        style={style}
        onError={() => setFailed(true)}
      />
    );
  }
  return (
    <span
      className={`${base} text-white font-bold`}
      style={{ ...style, background: colourFor(name), fontSize: Math.max(10, Math.round(size * 0.38)) }}
      title={name}
      aria-label={name}
    >
      {initialsOf(name)}
    </span>
  );
};
