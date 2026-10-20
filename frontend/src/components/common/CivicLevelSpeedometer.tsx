import React, { useState } from 'react';
import { Check } from 'lucide-react';
import { LEVEL_MILESTONES } from '../../mockData/initialData';
import {
  BronzeMedalIcon,
  SilverMedalIcon,
  GoldMedalIcon,
  PlatinumMedalIcon,
  LegendMedalIcon,
} from './CivicBadges';

interface CivicLevelSpeedometerProps {
  userPoints?: number;
  userLevel?: string;
  theme?: 'green' | 'blue';
}

export const CivicLevelSpeedometer: React.FC<CivicLevelSpeedometerProps> = ({
  userPoints = 107,
  userLevel = 'Silver',
  theme = 'green',
}) => {
  // Determine active level index
  const userLevelId = userLevel.toLowerCase().split(' ')[0];
  const defaultIdx = Math.max(
    0,
    LEVEL_MILESTONES.findIndex((m) => m.id === userLevelId)
  );

  // Allow clicking milestones to preview any tier while defaulting to Gold (as in user screenshot)
  const [selectedIdx, setSelectedIdx] = useState<number>(2);

  const currentMilestone = LEVEL_MILESTONES[selectedIdx] || LEVEL_MILESTONES[2];
  const prevMilestone =
    selectedIdx > 0 ? LEVEL_MILESTONES[selectedIdx - 1] : LEVEL_MILESTONES[0];
  const nextMilestone =
    selectedIdx < LEVEL_MILESTONES.length - 1
      ? LEVEL_MILESTONES[selectedIdx + 1]
      : LEVEL_MILESTONES[LEVEL_MILESTONES.length - 1];

  // Specific milestone points matching the designs
  const tierConfig: Record<number, { current: number; target: number; prev: number; next: number; fraction: number }> = {
    0: { current: 45, target: 100, prev: 0, next: 100, fraction: 0.45 },
    1: { current: 107, target: 207, prev: 100, next: 200, fraction: 0.52 },
    2: { current: 340, target: 750, prev: 100, next: 750, fraction: 0.38 },
    3: { current: 890, target: 2000, prev: 300, next: 2000, fraction: 0.42 },
    4: { current: 2350, target: 3000, prev: 750, next: 3000, fraction: 0.75 },
  };

  const cfg = tierConfig[selectedIdx] || tierConfig[2];
  const prevPoints = cfg.prev;
  const nextPoints = cfg.next;
  const currentPoints = cfg.current;
  const targetPoints = cfg.target;
  const progressFraction = cfg.fraction;

  // SVG Geometry
  // Center: (210, 180), Radius: 140
  // Left: x=70 (16.67%), y=180
  // Apex: x=210 (50%), y=40
  // Right: x=350 (83.33%), y=180
  const arcRadius = 140;
  const arcLength = Math.PI * arcRadius; // ~439.82
  const strokeDashoffset = arcLength * (1 - progressFraction);

  // Position of glowing head bulb at leading tip
  const angleRad = Math.PI * (1 - progressFraction);
  const tipX = 210 + arcRadius * Math.cos(angleRad);
  const tipY = 180 - arcRadius * Math.sin(angleRad);

  const renderMedal = (levelId: string, size: number) => {
    switch (levelId) {
      case 'bronze':
        return <BronzeMedalIcon size={size} />;
      case 'silver':
        return <SilverMedalIcon size={size} />;
      case 'gold':
        return <GoldMedalIcon size={size} />;
      case 'platinum':
        return <PlatinumMedalIcon size={size} />;
      case 'legend':
        return <LegendMedalIcon size={size} />;
      default:
        return <SilverMedalIcon size={size} />;
    }
  };

  const isGreen = theme === 'green';

  return (
    <div className="w-full flex flex-col items-center">
      {/* Interactive Tier Switcher Tabs (Exact Match to User Screenshot) */}
      <div className="bg-[#EEF3F6] dark:bg-slate-800/90 p-1 rounded-full inline-flex items-center gap-1 mb-4 shadow-2xs max-w-full overflow-x-auto">
        {LEVEL_MILESTONES.map((m, idx) => {
          const isSelected = selectedIdx === idx;

          return (
            <button
              key={m.id}
              onClick={() => setSelectedIdx(idx)}
              className={`px-3 sm:px-3.5 py-1 rounded-full text-xs transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                isSelected
                  ? 'bg-white dark:bg-slate-700 text-[#103E27] dark:text-emerald-300 font-extrabold shadow-xs ring-1 ring-black/5'
                  : 'text-[#62778A] dark:text-slate-400 hover:text-[#1E293B] dark:hover:text-slate-200 font-semibold'
              }`}
            >
              <span>{m.name}</span>
              {isSelected && (
                <span className="w-2 h-2 rounded-full bg-[#00875A] inline-block shrink-0" />
              )}
            </button>
          );
        })}
      </div>

      {/* Main Gauge Canvas (Exact Reference Image Recreation) */}
      <div className="relative w-full max-w-[420px] aspect-[420/350] mx-auto select-none">
        {/* Background SVG Arch and Active Arc */}
        <svg
          className="w-full h-full absolute inset-0 pointer-events-none"
          viewBox="0 0 420 350"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Green 3D Gradient (Matching Reference Image) */}
            <linearGradient id="speedometer3DGreen" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#047857" />
              <stop offset="35%" stopColor="#059669" />
              <stop offset="75%" stopColor="#10B981" />
              <stop offset="100%" stopColor="#34D399" />
            </linearGradient>

            {/* Blue 3D Gradient */}
            <linearGradient id="speedometer3DBlue" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#1E40AF" />
              <stop offset="30%" stopColor="#2563EB" />
              <stop offset="70%" stopColor="#3B82F6" />
              <stop offset="100%" stopColor="#60A5FA" />
            </linearGradient>

            {/* Ambient Drop Glow */}
            <filter id="arcGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow
                dx="0"
                dy="3"
                stdDeviation="5"
                floodColor={isGreen ? '#059669' : '#2563EB'}
                floodOpacity="0.4"
              />
            </filter>

            {/* Glowing Bulb Glow */}
            <filter id="bulbGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feDropShadow
                dx="0"
                dy="0"
                stdDeviation="4"
                floodColor={isGreen ? '#34D399' : '#60A5FA'}
                floodOpacity="0.8"
              />
            </filter>
          </defs>

          {/* 1. Inactive Track (Soft Frosted Grey-Mint with Rounded Caps) */}
          <path
            d="M 70 180 A 140 140 0 0 1 350 180"
            stroke={isGreen ? '#E8F5EE' : '#EBF2FA'}
            strokeWidth="20"
            strokeLinecap="round"
            className="dark:stroke-slate-800"
          />

          {/* 2. Active Progress Arc (Glossy Green or Blue with Rounded Caps) */}
          <path
            d="M 70 180 A 140 140 0 0 1 350 180"
            stroke={isGreen ? 'url(#speedometer3DGreen)' : 'url(#speedometer3DBlue)'}
            strokeWidth="20"
            strokeLinecap="round"
            strokeDasharray={arcLength}
            strokeDashoffset={strokeDashoffset}
            filter="url(#arcGlow)"
            className="transition-all duration-700 ease-out"
          />

          {/* 3. Glossy Specular Highlight on Active Arc */}
          <path
            d="M 70 180 A 140 140 0 0 1 350 180"
            stroke="rgba(255, 255, 255, 0.45)"
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={arcLength}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-700 ease-out"
          />

          {/* 4. Glowing 3D Bead Bulb at Leading Tip */}
          <circle
            cx={tipX}
            cy={tipY}
            r="12"
            fill={isGreen ? '#34D399' : '#60A5FA'}
            opacity="0.4"
            filter="url(#bulbGlow)"
          />
          <circle cx={tipX} cy={tipY} r="9" fill={isGreen ? '#059669' : '#3B82F6'} />
          <circle cx={tipX - 2} cy={tipY - 2} r="3" fill="#FFFFFF" opacity="0.9" />

          {/* 5. Left Vertical Dotted Connector Line */}
          <line
            x1="70"
            y1="195"
            x2="70"
            y2="225"
            stroke={isGreen ? '#A7D7BC' : '#CBD5E1'}
            strokeWidth="1.5"
            strokeDasharray="3,3"
            className="dark:stroke-slate-700"
          />

          {/* 6. Right Vertical Dotted Connector Line */}
          <line
            x1="350"
            y1="195"
            x2="350"
            y2="225"
            stroke={isGreen ? '#A7D7BC' : '#CBD5E1'}
            strokeWidth="1.5"
            strokeDasharray="3,3"
            className="dark:stroke-slate-700"
          />
        </svg>

        {/* ============================================================== */}
        {/* HTML OVERLAYS (Locked to Exact Percentages matching SVG coords) */}
        {/* ============================================================== */}

        {/* 1. Left Medal: Previous Level (Centered at 16.67% = x=70) */}
        <div
          style={{ left: '16.67%' }}
          className="absolute -translate-x-1/2 top-[228px] flex flex-col items-center text-center z-10"
        >
          {/* Medal with Checkmark */}
          <div className="relative group hover:scale-105 transition-transform drop-shadow-sm">
            {renderMedal(prevMilestone.id, 72)}
            {/* Circular Checkmark Badge */}
            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-[#A75D35] text-white rounded-full flex items-center justify-center border-2 border-white dark:border-slate-800 shadow-xs">
              <Check className="w-3.5 h-3.5 stroke-[3]" />
            </div>
          </div>

          {/* Threshold Pill e.g. 100 */}
          <div className="mt-2.5 bg-[#F1F5F9] dark:bg-slate-800 border border-[#cbd5e1] dark:border-slate-700 px-4 py-1 rounded-full text-center shadow-2xs">
            <span className="text-xs sm:text-sm font-extrabold text-[#475569] dark:text-slate-300 tabular-nums tracking-tight">
              {prevPoints}
            </span>
          </div>
        </div>

        {/* 2. Middle Medal: Current Level (Centered at 50% = x=210) */}
        <div
          style={{ left: '50%' }}
          className="absolute -translate-x-1/2 top-[68px] flex flex-col items-center text-center z-20"
        >
          {/* Big Silver Medal Framed by the Arc */}
          <div className="relative hover:scale-105 transition-transform drop-shadow-md">
            {renderMedal(currentMilestone.id, 132)}
          </div>

          {/* Score Pill e.g. 107/207 */}
          <div className="mt-2 bg-white/95 dark:bg-slate-800/95 backdrop-blur-xs border border-[#BFDBFE] dark:border-blue-900/60 px-5 py-1.5 rounded-full shadow-md shadow-blue-500/10 inline-flex items-center gap-1.5">
            <span className="text-lg sm:text-xl font-black text-[#1E293B] dark:text-white tabular-nums tracking-tight">
              {currentPoints}
            </span>
            <span className="text-base sm:text-lg font-bold text-[#64748B] dark:text-slate-400">
              /{targetPoints}
            </span>
          </div>

          <span className="text-xs font-black text-[#0f2d59] dark:text-blue-300 uppercase tracking-wider mt-1.5">
            {currentMilestone.name} Citizen
          </span>
        </div>

        {/* 3. Right Medal: Next Level (Centered at 83.33% = x=350) */}
        <div
          style={{ left: '83.33%' }}
          className="absolute -translate-x-1/2 top-[228px] flex flex-col items-center text-center z-10"
        >
          {/* Upcoming Medal */}
          <div className="relative group hover:scale-105 transition-transform opacity-95 drop-shadow-sm">
            {renderMedal(nextMilestone.id, 72)}
          </div>

          {/* Target Threshold Pill e.g. 200 */}
          <div className="mt-2.5 bg-[#F1F5F9] dark:bg-slate-800 border border-[#cbd5e1] dark:border-slate-700 px-4 py-1 rounded-full text-center shadow-2xs">
            <span className="text-xs sm:text-sm font-extrabold text-[#475569] dark:text-slate-300 tabular-nums tracking-tight">
              {nextPoints}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// Golden Rupee Coin with Radiant Foliage SVG
// ==========================================
export const RupeeLeafCoin: React.FC<{ size?: number; className?: string }> = ({
  size = 64,
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
    {/* Lush Green Leaf Sprigs Radiating Around Coin */}
    <g>
      {/* Left leaves */}
      <path d="M22 38 C14 34 8 26 12 18 C18 18 25 24 25 32 Z" fill="#48BB78" />
      <path d="M15 50 C6 48 2 40 4 32 C12 32 18 38 18 46 Z" fill="#38A169" />
      <path d="M16 64 C8 66 4 74 8 82 C14 80 20 73 19 65 Z" fill="#48BB78" />
      <path d="M26 76 C20 82 18 90 22 96 C27 92 31 83 29 76 Z" fill="#2F855A" />

      {/* Right leaves */}
      <path d="M78 38 C86 34 92 26 88 18 C82 18 75 24 75 32 Z" fill="#48BB78" />
      <path d="M85 50 C94 48 98 40 96 32 C88 32 82 38 82 46 Z" fill="#38A169" />
      <path d="M84 64 C92 66 96 74 92 82 C86 80 80 73 81 65 Z" fill="#48BB78" />
      <path d="M74 76 C80 82 82 90 78 96 C73 92 69 83 71 76 Z" fill="#2F855A" />
    </g>

    {/* Outer 3D Gold Rim */}
    <circle cx="50" cy="50" r="34" fill="url(#rupeeGoldOuter)" stroke="#B7791F" strokeWidth="2.5" />
    {/* Inner Gold Recess */}
    <circle cx="50" cy="50" r="28" fill="url(#rupeeGoldInner)" stroke="#975A16" strokeWidth="1.5" />

    {/* Indian Rupee Symbol ₹ */}
    <text
      x="50"
      y="60"
      textAnchor="middle"
      fontFamily="system-ui, -apple-system, sans-serif"
      fontWeight="900"
      fontSize="30"
      fill="#5F370E"
    >
      ₹
    </text>

    <defs>
      <linearGradient id="rupeeGoldOuter" x1="20" y1="20" x2="80" y2="80" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#FEFCBF" />
        <stop offset="35%" stopColor="#F6E05E" />
        <stop offset="70%" stopColor="#D69E2E" />
        <stop offset="100%" stopColor="#B7791F" />
      </linearGradient>
      <linearGradient id="rupeeGoldInner" x1="25" y1="25" x2="75" y2="75" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#F6E05E" />
        <stop offset="100%" stopColor="#B7791F" />
      </linearGradient>
    </defs>
  </svg>
);
