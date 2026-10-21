import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
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
import { RedeemModal } from '../components/common/RedeemModal';
import { formatRupees, redeemableSummary, MIN_WITHDRAWAL_POINTS } from '../lib/rewardsValue';
import { CivicBadgeIcon } from '../components/common/CivicBadges';
import {
  CivicLevelSpeedometer,
  RupeeLeafCoin,
} from '../components/common/CivicLevelSpeedometer';
import {
  MyCertificatesHeaderBanner,
  PopOutCertificateViewer,
  CertificateScrollCard,
  PrajaCertificateData,
} from '../components/common/PrajaCertificateCard';
import { PRINT_CSS, toPrajaCertificate, verifyLink } from '../components/academy/CertificateModal';
import { fetchMyCertificates } from '../lib/academyApi';
import { useMyBadges, useWallet } from '../lib/profileApi';

export const BadgesCertificatesScreen: React.FC = () => {
  const navigate = useNavigate();
  const { user, addToast } = useApp();
  const { badges, loading: badgesLoading } = useMyBadges(user.points);
  const wallet = useWallet(user.points);

  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<'rewards' | 'certificates'>(
    searchParams.get('tab') === 'certificates' ? 'certificates' : 'rewards'
  );
  const [showAllBadges, setShowAllBadges] = useState(false);
  const [showRedeem, setShowRedeem] = useState(false);
  const redeem = redeemableSummary(user.points);
  const [selectedBadge, setSelectedBadge] = useState<string | null>(null);
  const [selectedCertificate, setSelectedCertificate] = useState<PrajaCertificateData | null>(null);
  // Only certificates really earned by finishing a Civic Academy course
  const [certs, setCerts] = useState<PrajaCertificateData[] | null>(null);
  useEffect(() => {
    fetchMyCertificates()
      .then((list) => setCerts(list.map(toPrajaCertificate)))
      .catch(() => setCerts([]));
  }, []);
  const certList = certs ?? [];

  const handleShareCertificate = (cert: PrajaCertificateData) => {
    navigator.clipboard?.writeText?.(verifyLink(cert.id));
    addToast(
      'Verify link copied',
      `Anyone with the link can check that "${cert.category}" is genuine.`,
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

        <div className="w-6 h-6" aria-hidden />
      </div>

      {/* ============================================================ */}
      {/* 2. CAPSULE SWITCHER (rewards | certificates)                 */}
      {/* ============================================================ */}
      <div className="flex justify-center -mt-1 pb-1">
        <div className="bg-[#e2e8f0] dark:bg-slate-800 p-1 rounded-full inline-flex items-center gap-1">
          {([
            { id: 'rewards', label: 'Rewards', Icon: Award },
            { id: 'certificates', label: 'Certificates', Icon: FileText },
          ] as const).map(({ id, label, Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`px-4 py-1.5 rounded-full flex items-center gap-1.5 text-xs font-bold transition-all cursor-pointer ${activeTab === id
                  ? 'bg-[#0f2d59] text-white shadow-xs'
                  : 'text-[#475569] dark:text-slate-300 hover:text-[#0f2d59] dark:hover:text-white'
                }`}
            >
              <Icon className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ============================================================ */}
      {/* TAB A: REWARDS VIEW                                          */}
      {/* ============================================================ */}
      {activeTab === 'rewards' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          {/* 3. HERO LEVEL PROGRESSION GAUGE (Bronze, Silver, Gold, Platinum, Legend) */}
          <div className="bg-white dark:bg-[#111c2e] rounded-3xl p-5 sm:p-6 pb-12 border border-[#cbd5e1] dark:border-slate-800 shadow-xs">
            <CivicLevelSpeedometer
              userPoints={user.points}
              userLevel={user.level}
              theme="blue"
            />
          </div>

          {/* 4. REDEEMABLE POINTS BANNER (Exact Match from Mockup) */}
          <div className="bg-gradient-to-r from-[#0a1e38] via-[#0f2d59] to-[#1d4e8c] text-white rounded-3xl p-4 sm:p-5 shadow-md relative overflow-hidden flex items-center justify-between gap-3 border border-[#1d4e8c]/40">
            {/* Subtle background foliage watermark */}
            <div className="absolute -left-4 -bottom-6 w-24 h-24 bg-white/5 rounded-full blur-xl pointer-events-none" />
            <div className="absolute right-12 top-0 w-32 h-32 bg-white/5 rounded-full blur-2xl pointer-events-none" />

            {/* Left: Golden Rupee Coin with leaves */}
            <div className="shrink-0 drop-shadow-md">
              <RupeeLeafCoin size={64} />
            </div>

            {/* Center: Redeemable Points Info */}
            <div className="flex-1 min-w-0 pl-1">
              <span className="text-[10px] sm:text-[11px] font-bold tracking-widest text-blue-200 uppercase block">
                Redeemable Points
              </span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-2xl sm:text-3xl font-black text-white tabular-nums tracking-tight">
                  {redeem.points}
                </span>
                <span className="text-xl sm:text-2xl font-bold text-blue-200/90 tabular-nums">
                  / {MIN_WITHDRAWAL_POINTS}
                </span>
              </div>
              <span className="text-[11px] font-semibold text-blue-200 block mt-0.5">
                Worth {formatRupees(redeem.rupees)} {'\u00B7'} {redeem.meetsMinimum ? 'withdrawal unlocked' : `min ${formatRupees(100)}`}
              </span>
            </div>

            {/* Right: Circular Arrow Action Button */}
            <button
              onClick={() => setShowRedeem(true)}
              className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-white text-[#0f2d59] flex items-center justify-center shrink-0 shadow-md hover:scale-105 active:scale-95 transition-all cursor-pointer"
              aria-label="Redeemable Points Info"
            >
              <ArrowRight className="w-5 h-5 stroke-[2.5]" />
            </button>
          </div>

          {/* 5. TODAY'S POINTS + RECENT ACTIVITY (live from the rewards ledger) */}
          {wallet && (
            <div className="bg-white dark:bg-[#111c2e] rounded-3xl p-4 border border-[#cbd5e1] dark:border-slate-800 shadow-xs space-y-3" data-testid="wallet-card">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-black text-[#0f172a] dark:text-white">Today</h2>
                <span className="text-[11px] font-bold text-[#64748b] dark:text-slate-400">
                  {wallet.points_today} / {wallet.daily_cap} daily points
                </span>
              </div>
              <div className="h-2 rounded-full bg-[#e2e8f0] dark:bg-slate-700 overflow-hidden">
                <div
                  className="h-full rounded-full bg-[#0f2d59] dark:bg-blue-500"
                  style={{ width: `${Math.min(100, Math.round((wallet.points_today / Math.max(1, wallet.daily_cap)) * 100))}%` }}
                />
              </div>
              <p className="text-[11px] text-[#64748b] dark:text-slate-400">
                {wallet.remaining_today > 0
                  ? `You can still earn ${wallet.remaining_today} points today.`
                  : 'Daily limit reached. It resets tomorrow.'}
                {wallet.next_tier ? ` ${wallet.points_to_next_tier} points to ${wallet.next_tier}.` : ' You are at the top level.'}
              </p>
              {wallet.recent_transactions.length > 0 ? (
                <ul className="divide-y divide-[#e2e8f0] dark:divide-slate-800">
                  {wallet.recent_transactions.slice(0, 4).map((t) => (
                    <li key={t.id} className="flex items-center justify-between gap-3 py-2">
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-[#0f172a] dark:text-white truncate">{t.description || t.action_type.replace(/_/g, ' ')}</p>
                        <p className="text-[10px] text-[#64748b] dark:text-slate-400">
                          {new Date(t.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        </p>
                      </div>
                      <span className={`text-xs font-black tabular-nums ${t.points < 0 ? 'text-rose-600' : 'text-[#0f2d59] dark:text-blue-300'}`}>
                        {t.points > 0 ? '+' : ''}
                        {t.points}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-[#64748b] dark:text-slate-400">No points yet. File a report or join a drive to get started.</p>
              )}
            </div>
          )}

          {/* 6. MY BADGES: only badges really earned. "View all" shows every one of them. */}
          <div className="space-y-2.5 pt-1" data-testid="my-badges">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-sm sm:text-base font-black text-[#0f172a] dark:text-white tracking-tight">My Badges</h2>
              {badges.length > 3 && (
                <button
                  onClick={() => setShowAllBadges((v) => !v)}
                  className="text-xs font-bold text-[#0f2d59] dark:text-blue-400 hover:underline cursor-pointer flex items-center gap-0.5"
                >
                  <span>{showAllBadges ? 'Show less' : 'View all'}</span>
                  {!showAllBadges && <ArrowRight className="w-3.5 h-3.5" />}
                </button>
              )}
            </div>

            {!badgesLoading && badges.length === 0 && (
              <div className="bg-white dark:bg-[#111c2e] rounded-3xl border border-dashed border-[#cbd5e1] dark:border-slate-700 p-6 text-center space-y-1">
                <Award className="w-8 h-8 text-[#94a3b8] mx-auto" />
                <p className="text-sm font-extrabold text-[#0f172a] dark:text-white">No badges yet</p>
                <p className="text-xs text-[#64748b] dark:text-slate-400">Badges appear here as you report issues, join drives and earn points.</p>
              </div>
            )}

            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              {badges.slice(0, showAllBadges ? badges.length : 3).map((badge) => (
                <button
                  key={badge.id}
                  onClick={() => setSelectedBadge(badge.id)}
                  className="rounded-3xl p-3 sm:p-3.5 text-center flex flex-col items-center border bg-white dark:bg-[#111c2e] border-[#cbd5e1] dark:border-slate-800 shadow-2xs hover:shadow-xs transition-all cursor-pointer group"
                >
                  <div className="group-hover:scale-105 transition-transform">
                    <CivicBadgeIcon badgeId={badge.id} size={56} />
                  </div>
                  <h3 className="text-xs font-extrabold text-[#0f172a] dark:text-white mt-2 leading-tight">{badge.name}</h3>
                  <span className="text-[10px] text-[#64748b] dark:text-slate-400 mt-0.5 leading-tight line-clamp-2">
                    {new Date(badge.earned_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB B: CERTIFICATES POP-OUT & SCROLLING VIEW (Exact Match)   */}
      {/* ============================================================ */}
      {activeTab === 'certificates' && (
        <div className="space-y-5 animate-in fade-in duration-200">
          <MyCertificatesHeaderBanner />

          {certs === null && (
            <div className="py-10 flex justify-center">
              <div className="w-5 h-5 rounded-full border-2 border-[#0f2d59] border-t-transparent animate-spin" />
            </div>
          )}

          {certs !== null && certList.length === 0 && (
            <div className="bg-white dark:bg-[#111c2e] rounded-3xl border border-dashed border-[#cbd5e1] dark:border-slate-700 p-8 text-center space-y-2">
              <Award className="w-9 h-9 text-[#94a3b8] mx-auto" />
              <p className="text-sm font-extrabold text-[#0f172a] dark:text-white">No certificates yet</p>
              <p className="text-xs text-[#64748b] dark:text-slate-400">
                A certificate is issued only when you finish every lesson of a Civic Academy course and the NGO has approved your tasks.
              </p>
              <button
                onClick={() => navigate('/academy')}
                className="mt-1 px-4 py-2 rounded-xl bg-[#0f2d59] text-white text-xs font-bold cursor-pointer"
              >
                Browse courses
              </button>
            </div>
          )}

          {certList.length > 0 && (
            <>
              <div className="py-2">
                <PopOutCertificateViewer
                  certificates={certList}
                  userName={user.name}
                  onCertificateChange={(cert) => setSelectedCertificate(cert)}
                />
              </div>

              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between px-1">
                  <span className="text-xs font-black uppercase tracking-wider text-[#0f2d59]">
                    All Verified Certificates
                  </span>
                  <span className="text-[11px] font-bold text-[#4A7C59]">
                    {certList.length} Earned
                  </span>
                </div>

                {certList.map((cert) => (
                  <CertificateScrollCard
                    key={cert.id}
                    certificate={cert}
                    onView={(c) => setSelectedCertificate(c)}
                    onDownload={(c) => handleDownloadCertificate(c)}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {showRedeem && (
        <RedeemModal
          points={user.points}
          onClose={() => setShowRedeem(false)}
          onRequest={() => {
            setShowRedeem(false);
            addToast('Withdrawal request submitted (demo)', `${formatRupees(redeem.rupees)} simulated. No real money is moved.`, 'success');
          }}
        />
      )}

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
            <style>{PRINT_CSS}</style>
            <div className="pt-2 print-certificate">
              <PopOutCertificateViewer
                certificates={certList}
                userName={user.name}
                initialIndex={Math.max(
                  0,
                  certList.findIndex((c) => c.id === selectedCertificate.id)
                )}
                onCertificateChange={(cert) => setSelectedCertificate(cert)}
              />
            </div>

            {/* Actions: Share & Download PDF */}
            <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => handleShareCertificate(selectedCertificate)}
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
                    <span>Earned on</span>
                    <strong className="text-emerald-700 dark:text-emerald-400">
                      {new Date(badge.earned_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
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
