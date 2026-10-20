import React from 'react';

// ==========================================
// 1. LEVEL & ACHIEVEMENT MILESTONE MEDALS
// ==========================================

export const BronzeMedalIcon: React.FC<{ size?: number; className?: string }> = ({
  size = 72,
  className = '',
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    {/* Laurel Wreath */}
    <g fill="#A75D35">
      <path d="M22 68 C16 60 14 50 16 40 C17 38 19 39 18 41 C16 49 18 57 23 64 Z" />
      <path d="M20 46 C16 44 13 41 11 37 C13 36 17 39 19 42 Z" />
      <path d="M18 54 C13 53 9 51 7 47 C9 46 14 48 17 50 Z" />
      <path d="M21 62 C16 62 11 61 9 58 C11 56 16 57 20 59 Z" />
      <path d="M26 70 C21 71 16 72 13 70 C14 67 19 67 24 67 Z" />
      <path d="M34 76 C29 78 24 81 20 81 C20 78 24 76 30 74 Z" />
      {/* Right Laurel */}
      <path d="M78 68 C84 60 86 50 84 40 C83 38 81 39 82 41 C84 49 82 57 77 64 Z" />
      <path d="M80 46 C84 44 87 41 89 37 C87 36 83 39 81 42 Z" />
      <path d="M82 54 C87 53 91 51 93 47 C91 46 86 48 83 50 Z" />
      <path d="M79 62 C84 62 89 61 91 58 C89 56 84 57 80 59 Z" />
      <path d="M74 70 C79 71 84 72 87 70 C86 67 81 67 76 67 Z" />
      <path d="M66 76 C71 78 76 81 80 81 C80 78 76 76 70 74 Z" />
    </g>

    {/* Outer Bronze Rim */}
    <circle cx="50" cy="46" r="34" fill="url(#bronzeOuter)" stroke="#8C4421" strokeWidth="2" />
    {/* Inner Bronze Recess */}
    <circle cx="50" cy="46" r="28" fill="url(#bronzeInner)" stroke="#6E3113" strokeWidth="1.5" />
    {/* Sprout Icon in Center */}
    <g fill="#421B0B">
      {/* Left Leaf */}
      <path d="M48 46 C40 44 38 34 44 30 C50 32 49 41 48 46 Z" />
      {/* Right Leaf */}
      <path d="M49 47 C51 38 59 34 62 38 C62 45 54 47 49 47 Z" />
      {/* Stem */}
      <path d="M49 45 Q48 56 46 62" stroke="#421B0B" strokeWidth="3" strokeLinecap="round" />
    </g>

    <defs>
      <linearGradient id="bronzeOuter" x1="25" y1="20" x2="75" y2="72" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#DF9670" />
        <stop offset="50%" stopColor="#B5673E" />
        <stop offset="100%" stopColor="#8C4421" />
      </linearGradient>
      <linearGradient id="bronzeInner" x1="30" y1="26" x2="70" y2="66" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#C97B53" />
        <stop offset="100%" stopColor="#7E3717" />
      </linearGradient>
    </defs>
  </svg>
);

export const SilverMedalIcon: React.FC<{ size?: number; className?: string }> = ({
  size = 72,
  className = '',
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    {/* Laurel Wreath */}
    <g fill="#718096">
      <path d="M22 68 C16 60 14 50 16 40 C17 38 19 39 18 41 C16 49 18 57 23 64 Z" />
      <path d="M20 46 C16 44 13 41 11 37 C13 36 17 39 19 42 Z" />
      <path d="M18 54 C13 53 9 51 7 47 C9 46 14 48 17 50 Z" />
      <path d="M21 62 C16 62 11 61 9 58 C11 56 16 57 20 59 Z" />
      <path d="M26 70 C21 71 16 72 13 70 C14 67 19 67 24 67 Z" />
      <path d="M34 76 C29 78 24 81 20 81 C20 78 24 76 30 74 Z" />
      <path d="M78 68 C84 60 86 50 84 40 C83 38 81 39 82 41 C84 49 82 57 77 64 Z" />
      <path d="M80 46 C84 44 87 41 89 37 C87 36 83 39 81 42 Z" />
      <path d="M82 54 C87 53 91 51 93 47 C91 46 86 48 83 50 Z" />
      <path d="M79 62 C84 62 89 61 91 58 C89 56 84 57 80 59 Z" />
      <path d="M74 70 C79 71 84 72 87 70 C86 67 81 67 76 67 Z" />
      <path d="M66 76 C71 78 76 81 80 81 C80 78 76 76 70 74 Z" />
    </g>

    {/* Outer Silver Rim */}
    <circle cx="50" cy="46" r="34" fill="url(#silverOuter)" stroke="#4A5568" strokeWidth="2" />
    {/* Inner Silver Recess */}
    <circle cx="50" cy="46" r="28" fill="url(#silverInner)" stroke="#2D3748" strokeWidth="1.5" />
    {/* Sprout Icon in Center */}
    <g fill="#1A202C">
      <path d="M48 46 C40 44 38 34 44 30 C50 32 49 41 48 46 Z" />
      <path d="M49 47 C51 38 59 34 62 38 C62 45 54 47 49 47 Z" />
      <path d="M49 45 Q48 56 46 62" stroke="#1A202C" strokeWidth="3" strokeLinecap="round" />
    </g>

    <defs>
      <linearGradient id="silverOuter" x1="25" y1="20" x2="75" y2="72" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#EDF2F7" />
        <stop offset="50%" stopColor="#CBD5E0" />
        <stop offset="100%" stopColor="#718096" />
      </linearGradient>
      <linearGradient id="silverInner" x1="30" y1="26" x2="70" y2="66" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#CBD5E0" />
        <stop offset="100%" stopColor="#4A5568" />
      </linearGradient>
    </defs>
  </svg>
);

export const GoldMedalIcon: React.FC<{ size?: number; className?: string }> = ({
  size = 72,
  className = '',
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    {/* Laurel Wreath */}
    <g fill="#D69E2E">
      <path d="M22 68 C16 60 14 50 16 40 C17 38 19 39 18 41 C16 49 18 57 23 64 Z" />
      <path d="M20 46 C16 44 13 41 11 37 C13 36 17 39 19 42 Z" />
      <path d="M18 54 C13 53 9 51 7 47 C9 46 14 48 17 50 Z" />
      <path d="M21 62 C16 62 11 61 9 58 C11 56 16 57 20 59 Z" />
      <path d="M26 70 C21 71 16 72 13 70 C14 67 19 67 24 67 Z" />
      <path d="M34 76 C29 78 24 81 20 81 C20 78 24 76 30 74 Z" />
      <path d="M78 68 C84 60 86 50 84 40 C83 38 81 39 82 41 C84 49 82 57 77 64 Z" />
      <path d="M80 46 C84 44 87 41 89 37 C87 36 83 39 81 42 Z" />
      <path d="M82 54 C87 53 91 51 93 47 C91 46 86 48 83 50 Z" />
      <path d="M79 62 C84 62 89 61 91 58 C89 56 84 57 80 59 Z" />
      <path d="M74 70 C79 71 84 72 87 70 C86 67 81 67 76 67 Z" />
      <path d="M66 76 C71 78 76 81 80 81 C80 78 76 76 70 74 Z" />
    </g>

    {/* Outer Gold Rim */}
    <circle cx="50" cy="46" r="34" fill="url(#goldOuter)" stroke="#B7791F" strokeWidth="2" />
    {/* Inner Gold Recess */}
    <circle cx="50" cy="46" r="28" fill="url(#goldInner)" stroke="#975A16" strokeWidth="1.5" />
    {/* Sprout Icon in Center */}
    <g fill="#5F370E">
      <path d="M48 46 C40 44 38 34 44 30 C50 32 49 41 48 46 Z" />
      <path d="M49 47 C51 38 59 34 62 38 C62 45 54 47 49 47 Z" />
      <path d="M49 45 Q48 56 46 62" stroke="#5F370E" strokeWidth="3" strokeLinecap="round" />
    </g>

    <defs>
      <linearGradient id="goldOuter" x1="25" y1="20" x2="75" y2="72" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#FEFCBF" />
        <stop offset="35%" stopColor="#F6E05E" />
        <stop offset="70%" stopColor="#D69E2E" />
        <stop offset="100%" stopColor="#B7791F" />
      </linearGradient>
      <linearGradient id="goldInner" x1="30" y1="26" x2="70" y2="66" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#ECC94B" />
        <stop offset="100%" stopColor="#975A16" />
      </linearGradient>
    </defs>
  </svg>
);

export const PlatinumMedalIcon: React.FC<{ size?: number; className?: string }> = ({
  size = 72,
  className = '',
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    {/* Laurel Wreath */}
    <g fill="#2B6CB0">
      <path d="M22 68 C16 60 14 50 16 40 C17 38 19 39 18 41 C16 49 18 57 23 64 Z" />
      <path d="M20 46 C16 44 13 41 11 37 C13 36 17 39 19 42 Z" />
      <path d="M18 54 C13 53 9 51 7 47 C9 46 14 48 17 50 Z" />
      <path d="M21 62 C16 62 11 61 9 58 C11 56 16 57 20 59 Z" />
      <path d="M26 70 C21 71 16 72 13 70 C14 67 19 67 24 67 Z" />
      <path d="M34 76 C29 78 24 81 20 81 C20 78 24 76 30 74 Z" />
      <path d="M78 68 C84 60 86 50 84 40 C83 38 81 39 82 41 C84 49 82 57 77 64 Z" />
      <path d="M80 46 C84 44 87 41 89 37 C87 36 83 39 81 42 Z" />
      <path d="M82 54 C87 53 91 51 93 47 C91 46 86 48 83 50 Z" />
      <path d="M79 62 C84 62 89 61 91 58 C89 56 84 57 80 59 Z" />
      <path d="M74 70 C79 71 84 72 87 70 C86 67 81 67 76 67 Z" />
      <path d="M66 76 C71 78 76 81 80 81 C80 78 76 76 70 74 Z" />
    </g>

    {/* Outer Platinum Rim */}
    <circle cx="50" cy="46" r="34" fill="url(#platOuter)" stroke="#2C5282" strokeWidth="2" />
    {/* Inner Platinum Recess */}
    <circle cx="50" cy="46" r="28" fill="url(#platInner)" stroke="#1A365D" strokeWidth="1.5" />

    {/* 5-pointed Star in Center */}
    <polygon
      points="50,30 54,40 65,40 56,47 60,58 50,51 40,58 44,47 35,40 46,40"
      fill="#EBF8FF"
      stroke="#BEE3F8"
      strokeWidth="1"
    />

    <defs>
      <linearGradient id="platOuter" x1="25" y1="20" x2="75" y2="72" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#EBF8FF" />
        <stop offset="40%" stopColor="#90CDF4" />
        <stop offset="70%" stopColor="#4299E1" />
        <stop offset="100%" stopColor="#2B6CB0" />
      </linearGradient>
      <linearGradient id="platInner" x1="30" y1="26" x2="70" y2="66" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#63B3ED" />
        <stop offset="100%" stopColor="#2B6CB0" />
      </linearGradient>
    </defs>
  </svg>
);

export const LegendMedalIcon: React.FC<{ size?: number; className?: string }> = ({
  size = 72,
  className = '',
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    {/* Crown / Coronet on Top */}
    <path
      d="M36 24 L42 32 L50 20 L58 32 L64 24 L62 36 L38 36 Z"
      fill="#322659"
      stroke="#553C9A"
      strokeWidth="1.5"
    />
    <circle cx="36" cy="23" r="2" fill="#E9D8FD" />
    <circle cx="50" cy="19" r="2.5" fill="#FAF5FF" />
    <circle cx="64" cy="23" r="2" fill="#E9D8FD" />

    {/* Purple Winged Laurel / Ribbon */}
    <g fill="#44337A">
      <path d="M22 64 C16 56 16 48 18 42 C20 50 22 56 26 62 Z" />
      <path d="M18 52 C14 50 10 46 8 42 C11 41 15 45 17 48 Z" />
      <path d="M22 70 C16 70 12 68 10 65 C13 63 17 65 21 67 Z" />
      <path d="M28 78 C22 79 16 80 12 78 C15 75 20 76 26 75 Z" />
      <path d="M38 84 C30 85 24 87 20 86 C21 82 27 82 34 81 Z" />
      {/* Right side */}
      <path d="M78 64 C84 56 84 48 82 42 C80 50 78 56 74 62 Z" />
      <path d="M82 52 C86 50 90 46 92 42 C89 41 85 45 83 48 Z" />
      <path d="M78 70 C84 70 88 68 90 65 C87 63 83 65 79 67 Z" />
      <path d="M72 78 C78 79 84 80 88 78 C85 75 80 76 74 75 Z" />
      <path d="M62 84 C70 85 76 87 80 86 C79 82 73 82 66 81 Z" />
    </g>

    {/* Royal Shield Crest Outer */}
    <path
      d="M50 32 C68 32 75 36 75 48 C75 66 60 78 50 84 C40 78 25 66 25 48 C25 36 32 32 50 32 Z"
      fill="url(#legendOuter)"
      stroke="#2D1D4F"
      strokeWidth="2.5"
    />
    {/* Royal Shield Crest Inner */}
    <path
      d="M50 38 C64 38 69 41 69 50 C69 64 58 73 50 78 C42 73 31 64 31 50 C31 41 36 38 50 38 Z"
      fill="url(#legendInner)"
      stroke="#322659"
      strokeWidth="1.5"
    />

    {/* White 5-pointed Star in Center */}
    <polygon
      points="50,44 53,52 62,52 55,58 58,66 50,61 42,66 45,58 38,52 47,52"
      fill="#FFFFFF"
      stroke="#E9D8FD"
      strokeWidth="1"
    />

    <defs>
      <linearGradient id="legendOuter" x1="30" y1="32" x2="70" y2="84" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#9F7AEA" />
        <stop offset="50%" stopColor="#6B46C1" />
        <stop offset="100%" stopColor="#322659" />
      </linearGradient>
      <linearGradient id="legendInner" x1="35" y1="38" x2="65" y2="78" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#553C9A" />
        <stop offset="100%" stopColor="#2D1D4F" />
      </linearGradient>
    </defs>
  </svg>
);

// ==========================================
// 2. EXAMPLE BADGES (7 BADGES FROM IMAGE)
// ==========================================

// 1. Swachh Warrior (100 lifetime points)
export const SwachhWarriorBadgeIcon: React.FC<{ size?: number; className?: string }> = ({
  size = 72,
  className = '',
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    {/* Circular Green Badge Background */}
    <circle cx="50" cy="50" r="44" fill="#68D391" />
    <circle cx="50" cy="50" r="40" fill="url(#swachhGrad)" stroke="#22543D" strokeWidth="2.5" />

    {/* Sparkles */}
    <polygon points="35,26 36,30 40,31 36,32 35,36 34,32 30,31 34,30" fill="#E6FFFA" />
    <polygon points="45,20 46,23 49,24 46,25 45,28 44,25 41,24 44,23" fill="#E6FFFA" />

    {/* Broom Sweeping */}
    <g transform="rotate(-30 50 48)">
      {/* Handle */}
      <rect x="47" y="18" width="6" height="26" rx="3" fill="#744210" stroke="#1A202C" strokeWidth="1.5" />
      {/* Broom Head / Brush */}
      <path
        d="M40 44 L60 44 L66 62 C66 64 64 65 62 65 L38 65 C36 65 34 64 34 62 Z"
        fill="#22543D"
        stroke="#1A202C"
        strokeWidth="2"
      />
      {/* Bristle Lines */}
      <line x1="44" y1="48" x2="42" y2="62" stroke="#2F855A" strokeWidth="2" />
      <line x1="50" y1="48" x2="50" y2="62" stroke="#2F855A" strokeWidth="2" />
      <line x1="56" y1="48" x2="58" y2="62" stroke="#2F855A" strokeWidth="2" />
    </g>

    {/* Green Leaf Accent */}
    <path
      d="M62 48 C68 45 74 48 76 56 C68 59 62 55 62 48 Z"
      fill="#276749"
      stroke="#1A202C"
      strokeWidth="1.5"
    />

    {/* Ribbon with "100" at Bottom */}
    <g>
      <rect x="32" y="72" width="36" height="18" rx="5" fill="#22543D" stroke="#1A202C" strokeWidth="2" />
      <text
        x="50"
        y="85.5"
        textAnchor="middle"
        fill="#FFFFFF"
        fontSize="12"
        fontWeight="900"
        fontFamily="sans-serif"
        letterSpacing="0.5"
      >
        100
      </text>
    </g>

    <defs>
      <linearGradient id="swachhGrad" x1="20" y1="20" x2="80" y2="80" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#9AE6B4" />
        <stop offset="60%" stopColor="#48BB78" />
        <stop offset="100%" stopColor="#2F855A" />
      </linearGradient>
    </defs>
  </svg>
);

// 2. Community Cleaner (Two verified cleanups organized)
export const CommunityCleanerBadgeIcon: React.FC<{ size?: number; className?: string }> = ({
  size = 72,
  className = '',
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    {/* Circle Background */}
    <circle cx="50" cy="50" r="44" fill="#BEE3F8" />
    <circle cx="50" cy="50" r="40" fill="url(#cleanerGrad)" stroke="#1A365D" strokeWidth="2.5" />

    {/* Person 1 Left */}
    <circle cx="33" cy="38" r="6" fill="#1A365D" />
    <path d="M26 62 C26 50 31 46 39 46 L39 62 Z" fill="#1A365D" />

    {/* Person 2 Right */}
    <circle cx="67" cy="38" r="6" fill="#1A365D" />
    <path d="M74 62 C74 50 69 46 61 46 L61 62 Z" fill="#1A365D" />

    {/* Arms holding the green bag together */}
    <path d="M37 50 L48 56 M63 50 L52 56" stroke="#1A365D" strokeWidth="4" strokeLinecap="round" />

    {/* Green Recycling Bag in Center */}
    <path
      d="M42 54 C46 51 54 51 58 54 L62 72 C62 76 59 78 55 78 L45 78 C41 78 38 76 38 72 Z"
      fill="#22543D"
      stroke="#1A202C"
      strokeWidth="2"
    />
    <path d="M47 52 C47 48 53 48 53 52" stroke="#1A202C" strokeWidth="2" fill="none" />

    {/* Recycling Logo on Bag (White) */}
    <g stroke="#FFFFFF" strokeWidth="1.5" fill="none">
      <path d="M47 62 L53 62 L50 67 Z" />
      <path d="M49 61 L51 58" />
    </g>

    <defs>
      <linearGradient id="cleanerGrad" x1="20" y1="20" x2="80" y2="80" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#EBF8FF" />
        <stop offset="50%" stopColor="#63B3ED" />
        <stop offset="100%" stopColor="#2B6CB0" />
      </linearGradient>
    </defs>
  </svg>
);

// 3. Volunteer Regular (Five verified cleanups attended)
export const VolunteerRegularBadgeIcon: React.FC<{ size?: number; className?: string }> = ({
  size = 72,
  className = '',
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    {/* Amber Orange Circle */}
    <circle cx="50" cy="50" r="44" fill="#FEEBC8" />
    <circle cx="50" cy="50" r="40" fill="url(#volRegularGrad)" stroke="#7B341E" strokeWidth="2.5" />

    {/* Clipboard */}
    <rect x="36" y="22" width="28" height="38" rx="3" fill="#FFFFFF" stroke="#1A202C" strokeWidth="2" />
    {/* Clip at top */}
    <rect x="43" y="19" width="14" height="6" rx="2" fill="#718096" stroke="#1A202C" strokeWidth="1.5" />

    {/* Checklist lines on clipboard with green checkmarks */}
    <g stroke="#2F855A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M40 31 L42 33 L46 29" />
      <path d="M40 39 L42 41 L46 37" />
      <path d="M40 47 L42 49 L46 45" />
    </g>
    <g stroke="#CBD5E0" strokeWidth="2" strokeLinecap="round">
      <line x1="49" y1="31" x2="59" y2="31" />
      <line x1="49" y1="39" x2="59" y2="39" />
      <line x1="49" y1="47" x2="59" y2="47" />
    </g>

    {/* 3 Volunteers Silhouettes at Bottom */}
    {/* Center Volunteer */}
    <circle cx="50" cy="62" r="5" fill="#1A202C" />
    <path d="M42 78 C42 70 45 68 50 68 C55 68 58 70 58 78 Z" fill="#1A202C" />
    {/* Left Volunteer */}
    <circle cx="34" cy="65" r="4" fill="#2D3748" />
    <path d="M28 78 C28 72 30 70 34 70 C38 70 40 72 40 78 Z" fill="#2D3748" />
    {/* Right Volunteer */}
    <circle cx="66" cy="65" r="4" fill="#2D3748" />
    <path d="M60 78 C60 72 62 70 66 70 C70 70 72 72 72 78 Z" fill="#2D3748" />

    <defs>
      <linearGradient id="volRegularGrad" x1="20" y1="20" x2="80" y2="80" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#FEEBC8" />
        <stop offset="50%" stopColor="#F6AD55" />
        <stop offset="100%" stopColor="#DD6B20" />
      </linearGradient>
    </defs>
  </svg>
);

// 4. Clear Reporter (Ten verified reports with quality photos)
export const ClearReporterBadgeIcon: React.FC<{ size?: number; className?: string }> = ({
  size = 72,
  className = '',
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    {/* Deep Blue / Cyan Circle */}
    <circle cx="50" cy="50" r="44" fill="#BEE3F8" />
    <circle cx="50" cy="50" r="40" fill="url(#reporterGrad)" stroke="#1A365D" strokeWidth="2.5" />

    {/* Sparkle */}
    <polygon points="76,28 78,32 82,33 78,34 76,38 74,34 70,33 74,32" fill="#EBF8FF" />

    {/* Camera Body */}
    <g>
      <rect x="25" y="34" width="40" height="28" rx="5" fill="#1A365D" stroke="#0D1B2A" strokeWidth="2" />
      <rect x="33" y="30" width="14" height="5" rx="1.5" fill="#2B6CB0" stroke="#0D1B2A" strokeWidth="1.5" />
      {/* Flash */}
      <circle cx="31" cy="40" r="2.5" fill="#ECC94B" />
      {/* Lens */}
      <circle cx="47" cy="48" r="9" fill="#0D1B2A" stroke="#CBD5E0" strokeWidth="1.5" />
      <circle cx="47" cy="48" r="5" fill="#3182CE" />
    </g>

    {/* Photo Card Overlapping on Right */}
    <g transform="rotate(12 66 60)">
      <rect x="48" y="46" width="28" height="28" rx="3" fill="#FFFFFF" stroke="#0D1B2A" strokeWidth="2" />
      {/* Mountain & Sun Photo */}
      <rect x="51" y="49" width="22" height="18" fill="#48BB78" />
      <circle cx="56" cy="54" r="2.5" fill="#ECC94B" />
      <polygon points="51,67 58,58 64,67" fill="#22543D" />
      <polygon points="60,67 66,61 73,67" fill="#276749" />
    </g>

    <defs>
      <linearGradient id="reporterGrad" x1="20" y1="20" x2="80" y2="80" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#EBF8FF" />
        <stop offset="50%" stopColor="#4299E1" />
        <stop offset="100%" stopColor="#2B6CB0" />
      </linearGradient>
    </defs>
  </svg>
);

// 5. Ward Mobilizer (20 verified volunteers brought across events)
export const WardMobilizerBadgeIcon: React.FC<{ size?: number; className?: string }> = ({
  size = 72,
  className = '',
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    {/* Lavender Purple Circle */}
    <circle cx="50" cy="50" r="44" fill="#E9D8FD" />
    <circle cx="50" cy="50" r="40" fill="url(#mobilizerGrad)" stroke="#322659" strokeWidth="2.5" />

    {/* Megaphone / Bullhorn */}
    <g transform="rotate(-15 45 42)">
      {/* Cone */}
      <polygon points="36,42 58,32 58,54 36,46" fill="#FFFFFF" stroke="#1A202C" strokeWidth="2" />
      {/* Bell / Rim */}
      <ellipse cx="58" cy="43" rx="3" ry="11" fill="#DD6B20" stroke="#1A202C" strokeWidth="2" />
      {/* Body back */}
      <rect x="30" y="41" width="7" height="6" rx="2" fill="#3182CE" stroke="#1A202C" strokeWidth="1.5" />
      {/* Handle */}
      <path d="M38 45 L38 56 L34 56 L34 45" fill="#DD6B20" stroke="#1A202C" strokeWidth="1.5" />
    </g>

    {/* Soundwaves */}
    <path d="M68 34 Q74 41 68 48" stroke="#1A202C" strokeWidth="2" strokeLinecap="round" fill="none" />
    <path d="M74 30 Q82 41 74 52" stroke="#1A202C" strokeWidth="2" strokeLinecap="round" fill="none" />

    {/* Volunteers Group at Bottom */}
    <circle cx="50" cy="66" r="4.5" fill="#1A202C" />
    <path d="M43 80 C43 73 46 71 50 71 C54 71 57 73 57 80 Z" fill="#1A202C" />

    <circle cx="36" cy="68" r="3.5" fill="#2D3748" />
    <path d="M31 80 C31 75 33 73 36 73 C39 73 41 75 41 80 Z" fill="#2D3748" />

    <circle cx="64" cy="68" r="3.5" fill="#2D3748" />
    <path d="M59 80 C59 75 61 73 64 73 C67 73 69 75 69 80 Z" fill="#2D3748" />

    <defs>
      <linearGradient id="mobilizerGrad" x1="20" y1="20" x2="80" y2="80" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#FAF5FF" />
        <stop offset="50%" stopColor="#B794F4" />
        <stop offset="100%" stopColor="#6B46C1" />
      </linearGradient>
    </defs>
  </svg>
);

// 6. Eyes on the Street (Ten verified monitoring reports)
export const EyesOnStreetBadgeIcon: React.FC<{ size?: number; className?: string }> = ({
  size = 72,
  className = '',
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    {/* Teal Green Circle */}
    <circle cx="50" cy="50" r="44" fill="#C6F6D5" />
    <circle cx="50" cy="50" r="40" fill="url(#eyesGrad)" stroke="#1C4532" strokeWidth="2.5" />

    {/* Background Cityscape */}
    <g fill="#276749" fillOpacity="0.8">
      <rect x="34" y="32" width="8" height="24" />
      <rect x="44" y="24" width="12" height="32" />
      <rect x="58" y="28" width="9" height="28" />
      <polygon points="50,18 44,24 56,24" />
    </g>

    {/* Binoculars in Foreground */}
    <g>
      {/* Center Bridge */}
      <rect x="46" y="58" width="8" height="5" rx="1.5" fill="#1A202C" stroke="#0D1B2A" strokeWidth="1.5" />
      {/* Left Eyepiece & Barrel */}
      <rect x="32" y="50" width="13" height="22" rx="4" fill="#22543D" stroke="#0D1B2A" strokeWidth="2" />
      <circle cx="38.5" cy="69" r="6.5" fill="#63B3ED" stroke="#0D1B2A" strokeWidth="2" />
      <circle cx="38.5" cy="69" r="3.5" fill="#1A365D" />
      <circle cx="37" cy="67" r="1.5" fill="#FFFFFF" />

      {/* Right Eyepiece & Barrel */}
      <rect x="55" y="50" width="13" height="22" rx="4" fill="#22543D" stroke="#0D1B2A" strokeWidth="2" />
      <circle cx="61.5" cy="69" r="6.5" fill="#63B3ED" stroke="#0D1B2A" strokeWidth="2" />
      <circle cx="61.5" cy="69" r="3.5" fill="#1A365D" />
      <circle cx="60" cy="67" r="1.5" fill="#FFFFFF" />
    </g>

    {/* Green leaf accent */}
    <path d="M22 66 C22 58 28 54 32 58 C28 64 24 66 22 66 Z" fill="#48BB78" stroke="#1C4532" strokeWidth="1" />
    <path d="M78 66 C78 58 72 54 68 58 C72 64 76 66 78 66 Z" fill="#48BB78" stroke="#1C4532" strokeWidth="1" />

    <defs>
      <linearGradient id="eyesGrad" x1="20" y1="20" x2="80" y2="80" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#E6FFFA" />
        <stop offset="50%" stopColor="#4FD1C5" />
        <stop offset="100%" stopColor="#234E52" />
      </linearGradient>
    </defs>
  </svg>
);

// 7. Community Watchdog (One issue monitored through its 30-day period)
export const CommunityWatchdogBadgeIcon: React.FC<{ size?: number; className?: string }> = ({
  size = 72,
  className = '',
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    {/* Dark Navy & Gold Outer Circle */}
    <circle cx="50" cy="50" r="44" fill="#ECC94B" />
    <circle cx="50" cy="50" r="40" fill="url(#watchdogGrad)" stroke="#744210" strokeWidth="2.5" />

    {/* Watchdog Heraldic Shield */}
    <path
      d="M50 26 C64 26 69 29 69 40 C69 54 58 64 50 70 C42 64 31 54 31 40 C31 29 36 26 50 26 Z"
      fill="#4299E1"
      stroke="#1A365D"
      strokeWidth="2.5"
    />
    <path
      d="M50 30 C61 30 65 32 65 41 C65 52 56 60 50 65 C44 60 35 52 35 41 C35 32 39 30 50 30 Z"
      fill="#63B3ED"
    />

    {/* Watchful Eye in Shield Center */}
    <ellipse cx="50" cy="46" rx="10" ry="6" fill="#FFFFFF" stroke="#0D1B2A" strokeWidth="1.5" />
    <circle cx="50" cy="46" r="4.5" fill="#1A365D" />
    <circle cx="51" cy="45" r="1.5" fill="#FFFFFF" />

    {/* 30-Day Calendar Icon Badge at Bottom Right */}
    <g transform="translate(60, 60)">
      <rect x="0" y="0" width="18" height="18" rx="3" fill="#FFFFFF" stroke="#1A202C" strokeWidth="2" />
      <rect x="0" y="0" width="18" height="5" fill="#E53E3E" />
      <circle cx="4" cy="2" r="1" fill="#FFFFFF" />
      <circle cx="14" cy="2" r="1" fill="#FFFFFF" />
      {/* Calendar grid dots */}
      <circle cx="5" cy="9" r="1" fill="#718096" />
      <circle cx="9" cy="9" r="1" fill="#718096" />
      <circle cx="13" cy="9" r="1" fill="#718096" />
      <circle cx="5" cy="13" r="1" fill="#718096" />
      <circle cx="9" cy="13" r="1" fill="#718096" />
      <circle cx="13" cy="13" r="1" fill="#3182CE" />
    </g>

    <defs>
      <linearGradient id="watchdogGrad" x1="20" y1="20" x2="80" y2="80" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#2A4365" />
        <stop offset="60%" stopColor="#1A365D" />
        <stop offset="100%" stopColor="#0D1B2A" />
      </linearGradient>
    </defs>
  </svg>
);

// ==========================================
// 3. UNIFIED HELPER COMPONENTS
// ==========================================

export const CivicLevelIcon: React.FC<{
  levelId: 'bronze' | 'silver' | 'gold' | 'platinum' | 'legend';
  size?: number;
  className?: string;
}> = ({ levelId, size = 72, className = '' }) => {
  switch (levelId) {
    case 'bronze':
      return <BronzeMedalIcon size={size} className={className} />;
    case 'silver':
      return <SilverMedalIcon size={size} className={className} />;
    case 'gold':
      return <GoldMedalIcon size={size} className={className} />;
    case 'platinum':
      return <PlatinumMedalIcon size={size} className={className} />;
    case 'legend':
      return <LegendMedalIcon size={size} className={className} />;
    default:
      return <GoldMedalIcon size={size} className={className} />;
  }
};

export const CivicBadgeIcon: React.FC<{
  badgeId: string;
  size?: number;
  className?: string;
}> = ({ badgeId, size = 72, className = '' }) => {
  switch (badgeId) {
    case 'badge-swachh-warrior':
    case 'swachh-warrior':
      return <SwachhWarriorBadgeIcon size={size} className={className} />;
    case 'badge-community-cleaner':
    case 'community-cleaner':
      return <CommunityCleanerBadgeIcon size={size} className={className} />;
    case 'badge-volunteer-regular':
    case 'volunteer-regular':
      return <VolunteerRegularBadgeIcon size={size} className={className} />;
    case 'badge-clear-reporter':
    case 'clear-reporter':
      return <ClearReporterBadgeIcon size={size} className={className} />;
    case 'badge-ward-mobilizer':
    case 'ward-mobilizer':
      return <WardMobilizerBadgeIcon size={size} className={className} />;
    case 'badge-eyes-on-the-street':
    case 'eyes-on-street':
      return <EyesOnStreetBadgeIcon size={size} className={className} />;
    case 'badge-community-watchdog':
    case 'community-watchdog':
      return <CommunityWatchdogBadgeIcon size={size} className={className} />;
    default:
      return <SwachhWarriorBadgeIcon size={size} className={className} />;
  }
};
