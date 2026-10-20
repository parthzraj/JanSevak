import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  Share2,
  Download,
  X,
  Award,
  FileText,
  ArrowRight,
  Sprout,
  CheckCircle,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  CivicBadgeIcon,
  SwachhWarriorBadgeIcon,
  CommunityCleanerBadgeIcon,
  VolunteerRegularBadgeIcon,
} from '../components/common/CivicBadges';
import {
  CivicLevelSpeedometer,
  RupeeLeafCoin,
} from '../components/common/CivicLevelSpeedometer';
import {
  MyCertificatesHeaderBanner,
  PopOutCertificateViewer,
  CertificateScrollCard,
  PrajaCertificateCard,
  PRAJA_CERTIFICATES,
  PrajaCertificateData,
} from '../components/common/PrajaCertificateCard';

export const BadgesCertificatesScreen: React.FC = () => {
  const navigate = useNavigate();
  const { badges, user, addToast } = useApp();

  const [activeTab, setActiveTab] = useState<'rewards' | 'certificates'>('rewards');
  const [selectedBadge, setSelectedBadge] = useState<string | null>(null);
  const [selectedCertificate, setSelectedCertificate] = useState<PrajaCertificateData | null>(null);

  const handleShareCertificate = (title: string) => {
    navigator.clipboard?.writeText?.(window.location.href);
    addToast(
      'Certificate Link Copied!',
      `Ready to share "${title}" on WhatsApp, LinkedIn, or Twitter.`,
      'success'
    );
  };

  const handleDownloadCertificate = (cert?: PrajaCertificateData) => {
    const title = cert?.category || 'Civic Contribution';
    addToast(
      'Preparing PDF Download...',
      `Generating verified certificate for "${title}".`,
      'reward'
    );
    setTimeout(() => {
      window.print();
    }, 600);
  };

  return (
    <div className="flex-1 flex flex-col px-3.5 sm:px-4 pt-3 pb-12 space-y-4 max-w-2xl mx-auto w-full">
      {/* ============================================================ */}
      {/* 1. TOP HEADER (Exact Match: < Rewards & Certificate 🍃)       */}
      {/* ============================================================ */}
      <div className="flex items-center justify-between relative pt-1">
        <button
          onClick={() => navigate('/menu')}
          className="p-1 -ml-1 text-[#0f2d59] hover:text-[#07172c] transition-colors cursor-pointer"
          aria-label="Back"
        >
          <ChevronLeft className="w-6 h-6 stroke-[2.5]" />
        </button>

        <h1 className="text-base sm:text-lg font-black text-[#0f2d59] tracking-tight">
          Rewards & Certificate
        </h1>

        {/* Decorative Leaf Icon */}
        <div className="w-6 h-6 flex items-center justify-end text-[#2E8B56]">
          <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
            <path d="M17 8C8 10 5.9 16.17 3.82 21.34L5.71 22l1-2.3A4.49 4.49 0 0 0 8 20C19 20 22 3 22 3c-1 2-8 2.25-13 3.25S2 11.5 2 13.5s1.75 3.75 1.75 3.75C7 8 17 8 17 8z" />
          </svg>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 2. CAPSULE SWITCHER (rewards | certificates)                 */}
      {/* ============================================================ */}
      <div className="flex justify-center -mt-1 pb-1">
        <div className="bg-[#123A25] p-1 rounded-full inline-flex items-center gap-1 shadow-sm">
          {/* Rewards Tab */}
          <button
            onClick={() => setActiveTab('rewards')}
            className={`px-4 py-1.5 rounded-full flex items-center gap-1.5 text-xs font-bold transition-all cursor-pointer ${activeTab === 'rewards'
                ? 'bg-[#247A50] text-white shadow-xs'
                : 'text-emerald-200/70 hover:text-white'
              }`}
          >
            <Award className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>rewards</span>
          </button>

          {/* Certificates Tab */}
          <button
            onClick={() => setActiveTab('certificates')}
            className={`px-3.5 py-1.5 rounded-full flex items-center gap-1.5 text-xs font-bold transition-all cursor-pointer ${activeTab === 'certificates'
                ? 'bg-[#247A50] text-white shadow-xs'
                : 'text-emerald-200/70 hover:text-white'
              }`}
            title="View Certificates"
          >
            <FileText className="w-3.5 h-3.5 stroke-[2]" />
            {activeTab === 'certificates' && <span>certificates</span>}
          </button>
        </div>
      </div>

      {/* ============================================================ */}
      {/* TAB A: REWARDS VIEW                                          */}
      {/* ============================================================ */}
      {activeTab === 'rewards' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          {/* 3. HERO LEVEL PROGRESSION GAUGE (Bronze, Silver, Gold, Platinum, Legend) */}
          <div className="bg-white dark:bg-[#111c2e] rounded-3xl p-5 sm:p-6 border border-[#cbd5e1] dark:border-slate-800 shadow-xs">
            <CivicLevelSpeedometer
              userPoints={user.points}
              userLevel={user.level}
              theme="green"
            />
          </div>

          {/* 4. REDEEMABLE POINTS BANNER (Exact Match from Mockup) */}
          <div className="bg-gradient-to-r from-[#175E3B] via-[#1E6B45] to-[#257C51] text-white rounded-3xl p-4 sm:p-5 shadow-md relative overflow-hidden flex items-center justify-between gap-3 border border-[#1d4e8c]/40">
            {/* Subtle background foliage watermark */}
            <div className="absolute -left-4 -bottom-6 w-24 h-24 bg-white/5 rounded-full blur-xl pointer-events-none" />
            <div className="absolute right-12 top-0 w-32 h-32 bg-white/5 rounded-full blur-2xl pointer-events-none" />

            {/* Left: Golden Rupee Coin with leaves */}
            <div className="shrink-0 drop-shadow-md">
              <RupeeLeafCoin size={64} />
            </div>

            {/* Center: Redeemable Points Info */}
            <div className="flex-1 min-w-0 pl-1">
              <span className="text-[10px] sm:text-[11px] font-bold tracking-widest text-[#A7F3D0] uppercase block">
                Redeemable Points
              </span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-2xl sm:text-3xl font-black text-white tabular-nums tracking-tight">
                  27
                </span>
                <span className="text-xl sm:text-2xl font-bold text-[#A7F3D0]/90 tabular-nums">
                  / 100
                </span>
              </div>
            </div>

            {/* Right: Circular Arrow Action Button */}
            <button
              onClick={() => {
                addToast(
                  'Redeemable Points',
                  'You currently have 27 points available for municipal privileges.',
                  'info'
                );
              }}
              className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-white text-[#175E3B] flex items-center justify-center shrink-0 shadow-md hover:scale-105 active:scale-95 transition-all cursor-pointer"
              aria-label="Redeemable Points Info"
            >
              <ArrowRight className="w-5 h-5 stroke-[2.5]" />
            </button>
          </div>

          {/* 5. MY BADGES (Exact Match: 3 Badges in a Row) */}
          <div className="space-y-2.5 pt-1">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-sm sm:text-base font-black text-[#0f172a] dark:text-white tracking-tight">
                My Badges
              </h2>
              <button
                onClick={() => setActiveTab('certificates')}
                className="text-xs font-bold text-[#0f2d59] dark:text-blue-400 hover:underline cursor-pointer flex items-center gap-0.5"
              >
                <span>View all</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* 3 Badges Horizontal Grid */}
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              {/* Badge 1: Swachh Warrior */}
              <div
                onClick={() => setSelectedBadge('badge-swachh-warrior')}
                className="bg-[#EAF6EE] dark:bg-[#062c19]/70 rounded-3xl p-3 sm:p-3.5 text-center flex flex-col items-center border border-emerald-100/80 dark:border-emerald-800/60 shadow-2xs hover:shadow-xs transition-all cursor-pointer group"
              >
                <div className="group-hover:scale-105 transition-transform">
                  <SwachhWarriorBadgeIcon size={56} />
                </div>
                <h3 className="text-xs font-extrabold text-[#0f172a] dark:text-emerald-100 mt-2 leading-tight">
                  Swachh Warrior
                </h3>
                <span className="text-[10px] text-[#64748b] dark:text-emerald-300/80 mt-0.5 leading-tight line-clamp-2">
                  100 lifetime points
                </span>
              </div>

              {/* Badge 2: Community Cleaner */}
              <div
                onClick={() => setSelectedBadge('badge-community-cleaner')}
                className="bg-[#EBF7F9] dark:bg-[#0c2a38]/70 rounded-3xl p-3 sm:p-3.5 text-center flex flex-col items-center border border-cyan-100/80 dark:border-cyan-800/60 shadow-2xs hover:shadow-xs transition-all cursor-pointer group"
              >
                <div className="group-hover:scale-105 transition-transform">
                  <CommunityCleanerBadgeIcon size={56} />
                </div>
                <h3 className="text-xs font-extrabold text-[#0f172a] dark:text-cyan-100 mt-2 leading-tight">
                  Community Cleaner
                </h3>
                <span className="text-[10px] text-[#64748b] dark:text-cyan-300/80 mt-0.5 leading-tight line-clamp-2">
                  Two verified cleanups organised
                </span>
              </div>

              {/* Badge 3: Volunteer Regular */}
              <div
                onClick={() => setSelectedBadge('badge-volunteer-regular')}
                className="bg-[#FEF8EB] dark:bg-[#33240a]/70 rounded-3xl p-3 sm:p-3.5 text-center flex flex-col items-center border border-amber-100/80 dark:border-amber-800/60 shadow-2xs hover:shadow-xs transition-all cursor-pointer group"
              >
                <div className="group-hover:scale-105 transition-transform">
                  <VolunteerRegularBadgeIcon size={56} />
                </div>
                <h3 className="text-xs font-extrabold text-[#0f172a] dark:text-amber-100 mt-2 leading-tight">
                  Volunteer Regular
                </h3>
                <span className="text-[10px] text-[#64748b] dark:text-amber-300/80 mt-0.5 leading-tight line-clamp-2">
                  Five verified cleanups attended
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB B: CERTIFICATES POP-OUT & SCROLLING VIEW (Exact Match)   */}
      {/* ============================================================ */}
      {activeTab === 'certificates' && (
        <div className="space-y-5 animate-in fade-in duration-200">
          {/* 1. Header Banner */}
          <MyCertificatesHeaderBanner />

          {/* 2. Pop-Out Certificate Viewer (Exact Match from Screenshot: Floating Arrows & Pill Dots) */}
          <div className="py-2">
            <PopOutCertificateViewer
              certificates={PRAJA_CERTIFICATES}
              userName={user.name || 'Ayush Sharma'}
              onCertificateChange={(cert) => setSelectedCertificate(cert)}
            />
          </div>

          {/* 3. Scrolling List of Certificate Cards (Dark Teal Feed with Download) */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-black uppercase tracking-wider text-[#0f2d59]">
                All Verified Certificates
              </span>
              <span className="text-[11px] font-bold text-[#4A7C59]">
                {PRAJA_CERTIFICATES.length} Available
              </span>
            </div>

            {PRAJA_CERTIFICATES.map((cert) => (
              <CertificateScrollCard
                key={cert.id}
                certificate={cert}
                onView={(c) => setSelectedCertificate(c)}
                onDownload={(c) => handleDownloadCertificate(c)}
              />
            ))}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* FULL CERTIFICATE DETAIL MODAL (Pop out of the screen)         */}
      {/* ============================================================ */}
      {selectedCertificate && (
        <div
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3.5 sm:p-4 animate-in fade-in duration-200"
          onClick={() => setSelectedCertificate(null)}
        >
          <div
            className="w-full max-w-xl bg-white dark:bg-[#111c2e] rounded-3xl p-4 sm:p-6 shadow-2xl space-y-4 relative animate-in zoom-in-95 duration-200 border border-emerald-900/10 dark:border-slate-800"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setSelectedCertificate(null)}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 cursor-pointer z-30 transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5 stroke-[2.5]" />
            </button>

            {/* Pop-Out Certificate Carousel */}
            <div className="pt-2">
              <PopOutCertificateViewer
                certificates={PRAJA_CERTIFICATES}
                userName={user.name || 'Ayush Sharma'}
                initialIndex={Math.max(
                  0,
                  PRAJA_CERTIFICATES.findIndex((c) => c.id === selectedCertificate.id)
                )}
                onCertificateChange={(cert) => setSelectedCertificate(cert)}
              />
            </div>

            {/* Actions: Share & Download PDF */}
            <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => handleShareCertificate(selectedCertificate.category)}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#0f2d59] hover:bg-[#07172c] dark:bg-blue-600 dark:hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-[0.99]"
              >
                <Share2 className="w-4 h-4" />
                <span>Share Credential</span>
              </button>
              <button
                onClick={() => handleDownloadCertificate(selectedCertificate)}
                className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-white dark:bg-slate-800 border border-[#CBD5E1] dark:border-slate-700 text-[#0f172a] dark:text-white text-xs font-bold hover:bg-[#F8FAFC] dark:hover:bg-slate-700 transition-all shadow-xs cursor-pointer active:scale-[0.99]"
              >
                <Download className="w-4 h-4" />
                <span>Download PDF</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* BADGE DETAIL MODAL                                           */}
      {/* ============================================================ */}
      {selectedBadge && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setSelectedBadge(null)}
        >
          {(() => {
            const badge = badges.find((b) => b.id === selectedBadge);
            if (!badge) return null;
            return (
              <div
                className="w-full max-w-sm bg-white dark:bg-[#111c2e] rounded-3xl p-6 shadow-2xl text-center space-y-4 relative animate-in zoom-in-95 border border-transparent dark:border-slate-800"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={() => setSelectedBadge(null)}
                  className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>

                <div className="flex justify-center pt-2">
                  <CivicBadgeIcon badgeId={badge.id} size={84} />
                </div>

                <div>
                  <h3 className="text-base font-extrabold text-[#0f172a] dark:text-white">
                    {badge.name}
                  </h3>
                  <p className="text-xs text-[#64748b] dark:text-slate-400 mt-1">{badge.description}</p>
                </div>

                <div className="bg-[#f8fafc] dark:bg-slate-800/90 p-3 rounded-2xl border border-[#cbd5e1] dark:border-slate-700 text-left text-xs space-y-1">
                  <div className="flex items-center justify-between text-[#64748b] dark:text-slate-400">
                    <span>Criteria</span>
                    <strong className="text-[#0f172a] dark:text-white">{badge.requirement}</strong>
                  </div>
                  <div className="flex items-center justify-between text-[#64748b] dark:text-slate-400">
                    <span>Status</span>
                    <strong
                      className={
                        badge.isUnlocked ? 'text-emerald-700 dark:text-emerald-400' : 'text-amber-700 dark:text-amber-400'
                      }
                    >
                      {badge.isUnlocked ? '✓ Unlocked' : 'In Progress'}
                    </strong>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedBadge(null)}
                  className="w-full py-2.5 rounded-xl bg-[#0f2d59] hover:bg-[#07172c] dark:bg-blue-600 dark:hover:bg-blue-700 text-white text-xs font-bold transition-all cursor-pointer"
                >
                  Close
                </button>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
};
