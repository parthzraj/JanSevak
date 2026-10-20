import React, { useState } from 'react';
import { Trophy, Calendar, Download, ChevronLeft, ChevronRight } from 'lucide-react';

export interface PrajaCertificateData {
  id: string;
  title: string;
  category: string;
  awardTo: string;
  issueDate: string;
  pointsBadge: string;
  slogan: string;
  theme: 'green' | 'blue' | 'emerald' | 'forest';
  description: string;
  shortSummary: string;
}

export const PRAJA_CERTIFICATES: PrajaCertificateData[] = [
  {
    id: 'cert-1',
    title: 'CIVIC CONTRIBUTION',
    category: 'Civic Contribution',
    awardTo: 'Ayush Sharma',
    issueDate: '14 Oct 2026',
    pointsBadge: '+150 pts',
    slogan: 'CLEAN · GREEN · SUSTAINABLE',
    theme: 'green',
    description:
      'for actively reporting 10+ civic issues on PrajaPulse and helping build a cleaner, safer and better community.',
    shortSummary:
      'For actively reporting civic issues and helping improve your locality.',
  },
  {
    id: 'cert-2',
    title: 'ENVIRONMENTAL IMPACT',
    category: 'Environmental Impact',
    awardTo: 'Ayush Sharma',
    issueDate: '14 Oct 2026',
    pointsBadge: '+180 pts',
    slogan: 'GREENER · HEALTHIER · BRIGHTER',
    theme: 'blue',
    description:
      'for verifiable reductions in local waste pollution and championing neighborhood composting in Ward 112.',
    shortSummary:
      'For spearheading sustainable waste segregation and community compost setups.',
  },
  {
    id: 'cert-3',
    title: 'SWACHH WARD CHAMPION',
    category: 'Swachh Ward Champion',
    awardTo: 'Ayush Sharma',
    issueDate: '02 Oct 2026',
    pointsBadge: '+200 pts',
    slogan: 'CLEAN · PURE · SUSTAINABLE',
    theme: 'emerald',
    description:
      'for organizing and participating in 5+ community cleanliness drives across Ward 112 Indiranagar.',
    shortSummary:
      'For leadership in neighborhood waste cleanups and plastic-free drives.',
  },
  {
    id: 'cert-4',
    title: 'GREEN CANOPY GUARDIAN',
    category: 'Green Canopy Guardian',
    awardTo: 'Ayush Sharma',
    issueDate: '18 Sep 2026',
    pointsBadge: '+100 pts',
    slogan: 'NATIVE · LIVING · ENDURING',
    theme: 'forest',
    description:
      'for adopting and nurturing 3 indigenous urban trees and contributing to the green cover of Bengaluru.',
    shortSummary:
      'For tagging, watering, and protecting native saplings in Indiranagar.',
  },
];

// =========================================================================
// 1. TOP HEADER BANNER: "My Certificates - Join, celebrate and download..."
// =========================================================================
export const MyCertificatesHeaderBanner: React.FC = () => {
  return (
    <div className="bg-gradient-to-r from-[#E6F8EE] via-[#E0F6EA] to-[#D7F3E3] rounded-3xl p-4 sm:p-5 flex items-center justify-between border border-[#C5ECD4] shadow-xs relative overflow-hidden">
      {/* Left: Trophy + Titles */}
      <div className="flex items-start gap-3 min-w-0 pr-2 z-10">
        <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-[#D0F0DE] text-[#0F5132] flex items-center justify-center shrink-0 border border-[#B6E7CB] mt-0.5 shadow-2xs">
          <Trophy className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.2]" />
        </div>
        <div>
          <h2 className="text-base sm:text-lg font-black text-[#0F5132] tracking-tight">
            My Certificates
          </h2>
          <p className="text-xs sm:text-sm text-[#45725B] mt-0.5 leading-snug">
            Join, celebrate and download civic contributions.
          </p>
        </div>
      </div>

      {/* Right: Certificate vector art with leaves & sparkles */}
      <div className="shrink-0 relative w-24 h-20 sm:w-28 sm:h-22 flex items-center justify-center">
        <svg
          className="w-full h-full drop-shadow-sm select-none"
          viewBox="0 0 120 90"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M20 20 Q20 24 16 24 Q20 24 20 28 Q20 24 24 24 Q20 24 20 20 Z"
            fill="#48BB78"
          />
          <path
            d="M106 18 Q106 22 102 22 Q106 22 106 26 Q106 22 110 22 Q106 22 106 18 Z"
            fill="#48BB78"
          />
          <rect
            x="24"
            y="16"
            width="72"
            height="52"
            rx="5"
            fill="#FFFFFF"
            stroke="#2F855A"
            strokeWidth="3"
          />
          <rect
            x="28"
            y="20"
            width="64"
            height="44"
            rx="3"
            fill="#FAFDF9"
            stroke="#68D391"
            strokeWidth="1"
          />
          <line x1="38" y1="28" x2="82" y2="28" stroke="#CBD5E0" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="44" y1="35" x2="76" y2="35" stroke="#cbd5e1" strokeWidth="2" strokeLinecap="round" />
          <line x1="40" y1="41" x2="80" y2="41" stroke="#cbd5e1" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M14 62 C10 44 26 38 36 48 C34 64 22 68 14 62 Z" fill="#38A169" opacity="0.9" />
          <path d="M22 72 C12 60 22 48 34 54 C36 68 28 76 22 72 Z" fill="#2F855A" />
          <path d="M106 62 C110 44 94 38 84 48 C86 64 98 68 106 62 Z" fill="#38A169" opacity="0.9" />
          <path d="M98 72 C108 60 98 48 86 54 C84 68 92 76 98 72 Z" fill="#2F855A" />
          <path d="M54 58 L51 72 L57 68 L60 72 L58 58 Z" fill="#22543D" />
          <path d="M66 58 L69 72 L63 68 L60 72 L62 58 Z" fill="#1C5E39" />
          <circle cx="60" cy="54" r="11" fill="#276749" stroke="#68D391" strokeWidth="1.5" />
          <polygon
            points="60,47 62,52 67,52 63,55 65,60 60,57 55,60 57,55 53,52 58,52"
            fill="#FFFFFF"
          />
        </svg>
      </div>
    </div>
  );
};

// =========================================================================
// 2. OFFICIAL POP-OUT CERTIFICATE CARD (Exact match to User Screenshot)
// =========================================================================
interface PrajaCertificateCardProps {
  certificate: PrajaCertificateData;
  userName?: string;
  className?: string;
}

export const PrajaCertificateCard: React.FC<PrajaCertificateCardProps> = ({
  certificate,
  userName = 'Ayush Sharma',
  className = '',
}) => {
  const recipientName = userName || certificate.awardTo;

  return (
    <div
      className={`relative w-full aspect-[1.48/1] bg-[#FAFDF9] rounded-2xl sm:rounded-3xl border-2 sm:border-[2.5px] border-[#0f2d59] p-3.5 sm:p-5 shadow-xl shadow-emerald-950/15 flex flex-col justify-between overflow-hidden select-none ${className}`}
    >
      {/* Decorative Fine Inner Border */}
      <div className="absolute inset-1.5 sm:inset-2.5 rounded-xl sm:rounded-2xl border border-[#2D6A4F]/25 pointer-events-none" />

      {/* Decorative Corner Brackets (Exact Match from Screenshot) */}
      <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-[#0f2d59]/70 rounded-tl pointer-events-none" />
      <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-[#0f2d59]/70 rounded-tr pointer-events-none" />
      <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-[#0f2d59]/70 rounded-bl pointer-events-none" />
      <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-[#0f2d59]/70 rounded-br pointer-events-none" />

      {/* TOP ROW: Header Branding */}
      <div className="relative z-10 flex items-center justify-between px-1">
        {/* Left: PrajaPulse Emblem & Logo */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#0f2d59] text-white flex items-center justify-center shrink-0 shadow-2xs">
            <svg className="w-4 h-4 sm:w-4.5 sm:h-4.5 fill-current" viewBox="0 0 24 24">
              <path d="M17 8C8 10 5.9 16.17 3.82 21.34L5.71 22l1-2.3A4.49 4.49 0 0 0 8 20C19 20 22 3 22 3c-1 2-8 2.25-13 3.25S2 11.5 2 13.5s1.75 3.75 1.75 3.75C7 8 17 8 17 8z" />
            </svg>
          </div>
          <div>
            <span className="text-xs sm:text-sm font-black tracking-tight text-[#0f2d59] block leading-none">
              PrajaPulse
            </span>
            <span className="text-[8px] sm:text-[9px] text-[#4A7C59] font-medium leading-none block mt-0.5">
              Fix Your City Together
            </span>
          </div>
        </div>

        {/* Right: Tagline */}
        <div className="text-[8px] sm:text-[10px] font-bold text-[#0f2d59] tracking-widest uppercase">
          {certificate.slogan}
        </div>
      </div>

      {/* CENTER ROW: Vector City Graphic + Certificate Text */}
      <div className="relative z-10 grid grid-cols-12 gap-2 sm:gap-3 items-center my-auto py-1">
        {/* Left: Sun with Rays, Buildings, and Green Foliage Mounds */}
        <div className="col-span-4 sm:col-span-4 flex items-center justify-center">
          <svg
            className="w-full max-w-[130px] sm:max-w-[155px] aspect-square drop-shadow-xs"
            viewBox="0 0 160 160"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Radiant Sun behind Buildings */}
            <g>
              <line x1="80" y1="26" x2="80" y2="16" stroke="#F6AD55" strokeWidth="2.5" strokeLinecap="round" />
              <line x1="102" y1="32" x2="110" y2="24" stroke="#F6AD55" strokeWidth="2.5" strokeLinecap="round" />
              <line x1="58" y1="32" x2="50" y2="24" stroke="#F6AD55" strokeWidth="2.5" strokeLinecap="round" />
              <line x1="114" y1="50" x2="124" y2="50" stroke="#F6AD55" strokeWidth="2.5" strokeLinecap="round" />
              <line x1="46" y1="50" x2="36" y2="50" stroke="#F6AD55" strokeWidth="2.5" strokeLinecap="round" />
              <circle cx="80" cy="50" r="16" fill="#F6AD55" />
              <circle cx="80" cy="50" r="12" fill="#FBD38D" />
            </g>

            {/* City Buildings with Window Dots */}
            {/* Building 1 (Left) */}
            <rect x="36" y="74" width="18" height="42" rx="2" fill="#48BB78" />
            <circle cx="42" cy="82" r="1.5" fill="#FAFDF9" />
            <circle cx="48" cy="82" r="1.5" fill="#FAFDF9" />
            <circle cx="42" cy="90" r="1.5" fill="#FAFDF9" />
            <circle cx="48" cy="90" r="1.5" fill="#FAFDF9" />
            <circle cx="42" cy="98" r="1.5" fill="#FAFDF9" />
            <circle cx="48" cy="98" r="1.5" fill="#FAFDF9" />

            {/* Building 2 (Mid-Left Tallest) */}
            <rect x="52" y="56" width="22" height="60" rx="2" fill="#2F855A" />
            <circle cx="59" cy="66" r="1.5" fill="#FAFDF9" />
            <circle cx="67" cy="66" r="1.5" fill="#FAFDF9" />
            <circle cx="59" cy="76" r="1.5" fill="#FAFDF9" />
            <circle cx="67" cy="76" r="1.5" fill="#FAFDF9" />
            <circle cx="59" cy="86" r="1.5" fill="#FAFDF9" />
            <circle cx="67" cy="86" r="1.5" fill="#FAFDF9" />
            <circle cx="59" cy="96" r="1.5" fill="#FAFDF9" />
            <circle cx="67" cy="96" r="1.5" fill="#FAFDF9" />

            {/* Building 3 (Mid-Right) */}
            <rect x="72" y="64" width="22" height="52" rx="2" fill="#22543D" />
            <circle cx="79" cy="74" r="1.5" fill="#cbd5e1" />
            <circle cx="87" cy="74" r="1.5" fill="#cbd5e1" />
            <circle cx="79" cy="84" r="1.5" fill="#cbd5e1" />
            <circle cx="87" cy="84" r="1.5" fill="#cbd5e1" />
            <circle cx="79" cy="94" r="1.5" fill="#cbd5e1" />
            <circle cx="87" cy="94" r="1.5" fill="#cbd5e1" />

            {/* Building 4 (Right) */}
            <rect x="92" y="72" width="18" height="44" rx="2" fill="#276749" />
            <circle cx="98" cy="80" r="1.5" fill="#FAFDF9" />
            <circle cx="104" cy="80" r="1.5" fill="#FAFDF9" />
            <circle cx="98" cy="88" r="1.5" fill="#FAFDF9" />
            <circle cx="104" cy="88" r="1.5" fill="#FAFDF9" />
            <circle cx="98" cy="96" r="1.5" fill="#FAFDF9" />
            <circle cx="104" cy="96" r="1.5" fill="#FAFDF9" />

            {/* Lush Shrub/Foliage Mounds Cupping the Base */}
            <ellipse cx="44" cy="116" rx="20" ry="12" fill="#38A169" />
            <ellipse cx="106" cy="116" rx="20" ry="12" fill="#38A169" />
            <ellipse cx="75" cy="120" rx="24" ry="14" fill="#22543D" />
            <ellipse cx="62" cy="114" rx="18" ry="11" fill="#2F855A" />
            <ellipse cx="88" cy="114" rx="18" ry="11" fill="#276749" />
          </svg>
        </div>

        {/* Right Content: Title, Name in Cursive, Description */}
        <div className="col-span-8 sm:col-span-8 text-center px-1 sm:px-2 space-y-0.5 sm:space-y-1">
          <span className="text-[8px] sm:text-[9px] font-bold uppercase tracking-widest text-[#4A7C59] block">
            Certificate Of
          </span>

          <h2 className="text-xs sm:text-base font-black tracking-tight text-[#113C25] leading-tight uppercase">
            {certificate.title}
          </h2>

          <p className="text-[8px] sm:text-[9px] text-[#556B5C] italic pt-0.5">
            This certificate is proudly awarded to
          </p>

          {/* Name in Calligraphy Script (Ayush Sharma) */}
          <div className="py-0.5">
            <span
              style={{ fontFamily: "'Dancing Script', cursive" }}
              className="text-xl sm:text-2xl md:text-3xl font-bold text-[#14532D] tracking-wide inline-block leading-none drop-shadow-2xs"
            >
              {recipientName}
            </span>
          </div>

          <p className="text-[7.5px] sm:text-[9px] text-[#334E3E] max-w-xs mx-auto leading-tight font-medium">
            {certificate.description}
          </p>

          <span className="text-[7px] sm:text-[8px] text-[#4A7C59] font-semibold italic block pt-0.5">
            Your voice. Your action. A real impact.
          </span>
        </div>
      </div>

      {/* BOTTOM ROW: Issue Date, Center Rosette Ribbon, Team Signature */}
      <div className="relative z-10 flex items-end justify-between px-1 pt-1 border-t border-[#2D6A4F]/15">
        {/* Left: Issue Date */}
        <div className="text-left">
          <span className="text-[7px] sm:text-[8px] font-bold uppercase text-[#556B5C] tracking-wider block">
            Issue Date
          </span>
          <span className="text-[8px] sm:text-[10px] font-black text-[#113C25] block mt-0.5">
            {certificate.issueDate}
          </span>
        </div>

        {/* Center: Official Rosette Ribbon Medal */}
        <div className="relative -mb-1 sm:-mb-2">
          <svg
            className="w-10 h-10 sm:w-12 sm:h-12 drop-shadow-sm"
            viewBox="0 0 60 60"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M24 38 L20 54 L27 50 L32 54 L29 38 Z" fill="#1C5E39" />
            <path d="M36 38 L40 54 L33 50 L28 54 L31 38 Z" fill="#14472A" />
            <circle cx="30" cy="28" r="18" fill="#1C5E39" stroke="#2F855A" strokeWidth="1.5" />
            <circle cx="30" cy="28" r="14" fill="#FAFDF9" />
            <g fill="#1C5E39">
              <path d="M29 28 C26 26 25 21 28 19 C31 20 30 25 29 28 Z" />
              <path d="M30 29 C31 24 35 21 37 23 C37 27 33 29 30 29 Z" />
              <path d="M30 27 Q29 33 28 36" stroke="#1C5E39" strokeWidth="1.5" strokeLinecap="round" />
            </g>
          </svg>
        </div>

        {/* Right: PrajaPulse Team */}
        <div className="text-right">
          <span className="text-[8px] sm:text-[10px] font-black text-[#113C25] block leading-none">
            PrajaPulse Team
          </span>
          <span className="text-[7px] sm:text-[8px] text-[#4A7C59] font-medium leading-none block mt-0.5">
            Fix Your City Together
          </span>
        </div>
      </div>
    </div>
  );
};

// =========================================================================
// 3. POP-OUT CERTIFICATE VIEWER (Floating Overlapping Arrows & Pill Dots)
// =========================================================================
interface PopOutCertificateViewerProps {
  certificates?: PrajaCertificateData[];
  userName?: string;
  initialIndex?: number;
  onCertificateChange?: (cert: PrajaCertificateData) => void;
  className?: string;
}

export const PopOutCertificateViewer: React.FC<PopOutCertificateViewerProps> = ({
  certificates = PRAJA_CERTIFICATES,
  userName = 'Ayush Sharma',
  initialIndex = 0,
  onCertificateChange,
  className = '',
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const currentCert = certificates[currentIndex] || certificates[0];

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextIdx = (currentIndex + 1) % certificates.length;
    setCurrentIndex(nextIdx);
    onCertificateChange?.(certificates[nextIdx]);
  };

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    const prevIdx = currentIndex === 0 ? certificates.length - 1 : currentIndex - 1;
    setCurrentIndex(prevIdx);
    onCertificateChange?.(certificates[prevIdx]);
  };

  const selectIndex = (idx: number) => {
    setCurrentIndex(idx);
    onCertificateChange?.(certificates[idx]);
  };

  return (
    <div className={`w-full flex flex-col items-center select-none ${className}`}>
      {/* Outer Card Wrapper with Pop-Out Floating Arrows Overlapping Borders */}
      <div className="relative w-full max-w-xl px-2 sm:px-3">
        {/* Left Pop-out Arrow Button (Half Inside, Half Outside the Card Border) */}
        <button
          onClick={handlePrev}
          aria-label="Previous Certificate"
          className="absolute -left-2 sm:-left-3.5 top-1/2 -translate-y-1/2 z-30 w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-white border border-slate-200 shadow-md text-[#0f2d59] flex items-center justify-center hover:scale-110 active:scale-95 transition-all cursor-pointer group"
        >
          <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.6] group-hover:-translate-x-0.5 transition-transform" />
        </button>

        {/* Center Certificate Card (Pops out with rich shadow) */}
        <div className="w-full transform transition-all duration-300">
          <PrajaCertificateCard
            certificate={currentCert}
            userName={userName}
            className="shadow-2xl shadow-emerald-950/20 hover:scale-[1.01]"
          />
        </div>

        {/* Right Pop-out Arrow Button (Half Inside, Half Outside the Card Border) */}
        <button
          onClick={handleNext}
          aria-label="Next Certificate"
          className="absolute -right-2 sm:-right-3.5 top-1/2 -translate-y-1/2 z-30 w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-white border border-slate-200 shadow-md text-[#0f2d59] flex items-center justify-center hover:scale-110 active:scale-95 transition-all cursor-pointer group"
        >
          <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.6] group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>

      {/* Pill Pagination Dots Below Certificate (Exact Match to User Screenshot) */}
      <div className="flex items-center justify-center gap-2 pt-3.5 sm:pt-4">
        {certificates.map((_, idx) => (
          <button
            key={idx}
            onClick={() => selectIndex(idx)}
            className={`transition-all duration-300 rounded-full cursor-pointer ${
              currentIndex === idx
                ? 'w-7 h-2 bg-[#1C5E39]'
                : 'w-2 h-2 bg-[#D1D5DB] hover:bg-[#9CA3AF]'
            }`}
            aria-label={`Jump to certificate ${idx + 1}`}
          />
        ))}
      </div>
    </div>
  );
};

// =========================================================================
// 4. SCROLLING CERTIFICATE CARD (Dark Teal Card for Feed)
// =========================================================================
interface CertificateScrollCardProps {
  certificate: PrajaCertificateData;
  onView: (cert: PrajaCertificateData) => void;
  onDownload: (cert: PrajaCertificateData) => void;
}

export const CertificateScrollCard: React.FC<CertificateScrollCardProps> = ({
  certificate,
  onView,
  onDownload,
}) => {
  const isBlue = certificate.theme === 'blue';

  return (
    <div
      onClick={() => onView(certificate)}
      className="bg-[#0B3D37] rounded-3xl overflow-hidden border border-[#16584F] shadow-md hover:shadow-xl hover:border-[#1E7468] transition-all cursor-pointer group flex flex-col"
    >
      {/* Top Visual Graphic */}
      <div
        className={`relative w-full aspect-[2.7/1] sm:aspect-[2.9/1] overflow-hidden flex flex-col justify-between p-3 sm:p-4 select-none ${
          isBlue
            ? 'bg-gradient-to-b from-[#EBF6FF] via-[#E1F1FD] to-[#D5ECFC]'
            : 'bg-gradient-to-b from-[#F2FBF5] via-[#EBF7EF] to-[#DFF3E6]'
        }`}
      >
        <div
          className={`absolute inset-2 sm:inset-2.5 rounded-xl border pointer-events-none ${
            isBlue ? 'border-[#60A5FA]/35' : 'border-[#48BB78]/35'
          }`}
        />

        {/* Top Branding Row */}
        <div className="relative z-10 flex items-center justify-between px-1">
          <div className="flex items-center gap-1.5">
            <div
              className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-white ${
                isBlue ? 'bg-[#1E40AF]' : 'bg-[#0f2d59]'
              }`}
            >
              <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24">
                <path d="M17 8C8 10 5.9 16.17 3.82 21.34L5.71 22l1-2.3A4.49 4.49 0 0 0 8 20C19 20 22 3 22 3c-1 2-8 2.25-13 3.25S2 11.5 2 13.5s1.75 3.75 1.75 3.75C7 8 17 8 17 8z" />
              </svg>
            </div>
            <div>
              <span
                className={`text-[10px] sm:text-xs font-black tracking-tight leading-none block ${
                  isBlue ? 'text-[#1E3A8A]' : 'text-[#0f2d59]'
                }`}
              >
                PrajaPulse
              </span>
              <span
                className={`text-[7px] sm:text-[8px] font-medium leading-none block mt-0.5 ${
                  isBlue ? 'text-[#3B82F6]' : 'text-[#38A169]'
                }`}
              >
                For Your City Together
              </span>
            </div>
          </div>

          <span
            className={`text-[8px] sm:text-[9px] font-bold tracking-wider uppercase ${
              isBlue ? 'text-[#3B82F6]' : 'text-[#38A169]'
            }`}
          >
            {certificate.slogan}
          </span>
        </div>

        {/* Center Title */}
        <div className="relative z-10 my-auto text-center px-6 sm:px-8 py-0.5">
          <span
            className={`text-[8px] sm:text-[9px] font-bold tracking-widest uppercase block ${
              isBlue ? 'text-[#2563EB]' : 'text-[#2E8B56]'
            }`}
          >
            Certificate Of
          </span>
          <h3
            className={`text-sm sm:text-lg md:text-xl font-black tracking-tight uppercase leading-tight mt-0.5 ${
              isBlue ? 'text-[#1E3A8A]' : 'text-[#0E492D]'
            }`}
          >
            {certificate.title}
          </h3>
        </div>

        {/* Foliage artwork */}
        <div className="absolute left-0 bottom-0 pointer-events-none">
          {!isBlue ? (
            <svg
              className="w-24 h-20 sm:w-32 sm:h-24 drop-shadow-2xs"
              viewBox="0 0 120 90"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle cx="36" cy="36" r="10" fill="#F6AD55" />
              <circle cx="36" cy="36" r="7" fill="#FBD38D" />
              <rect x="18" y="44" width="10" height="30" rx="1" fill="#68D391" />
              <rect x="26" y="32" width="13" height="42" rx="1" fill="#38A169" />
              <rect x="37" y="24" width="14" height="50" rx="1.5" fill="#22543D" />
              <rect x="49" y="36" width="11" height="38" rx="1" fill="#276749" />
              <path d="M-2 76 C-2 56 16 50 32 60 C32 80 12 90 -2 76 Z" fill="#2F855A" />
              <path d="M12 86 C8 66 32 58 48 68 C46 90 28 98 12 86 Z" fill="#38A169" />
            </svg>
          ) : (
            <svg
              className="w-24 h-20 sm:w-32 sm:h-24 drop-shadow-2xs"
              viewBox="0 0 120 90"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <ellipse cx="28" cy="40" rx="22" ry="12" fill="#BAE6FD" opacity="0.6" />
              <ellipse cx="44" cy="36" rx="18" ry="10" fill="#E0F2FE" opacity="0.8" />
              <path d="M-4 78 C-4 54 18 46 36 58 C34 82 14 92 -4 78 Z" fill="#0284C7" opacity="0.9" />
              <path d="M14 88 C8 66 36 56 52 68 C50 92 32 100 14 88 Z" fill="#38BDF8" />
            </svg>
          )}
        </div>

        <div className="absolute right-0 bottom-0 pointer-events-none">
          <svg
            className="w-20 h-20 sm:w-28 sm:h-24 drop-shadow-2xs"
            viewBox="0 0 100 90"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M102 76 C102 54 80 46 64 58 C64 80 84 90 102 76 Z" fill={isBlue ? '#0284C7' : '#2F855A'} />
            <path d="M86 86 C92 64 64 56 48 68 C50 90 70 98 86 86 Z" fill={isBlue ? '#38BDF8' : '#38A169'} />
          </svg>
        </div>
      </div>

      {/* Bottom Footer */}
      <div className="p-4 sm:p-5 flex items-center justify-between gap-3 text-white">
        <div className="min-w-0 pr-2">
          <h4 className="text-base sm:text-lg font-bold text-white tracking-tight truncate">
            {certificate.category}
          </h4>
          <div className="flex items-center gap-1.5 text-xs sm:text-sm text-[#A3CCC5] mt-1">
            <Calendar className="w-4 h-4 stroke-[2.2] shrink-0" />
            <span>{certificate.issueDate}</span>
          </div>
        </div>

        {/* Circular Download Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDownload(certificate);
          }}
          className="w-12 h-12 rounded-full border-2 border-white/85 text-white flex items-center justify-center shrink-0 hover:bg-white hover:text-[#0B3D37] active:scale-95 transition-all shadow-sm cursor-pointer group-hover:scale-105"
          aria-label={`Download ${certificate.category} Certificate`}
        >
          <Download className="w-5 h-5 stroke-[2.4]" />
        </button>
      </div>
    </div>
  );
};
