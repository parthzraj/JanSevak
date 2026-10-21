import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Gamepad2,
  BarChart3,
  GraduationCap,
  Award,
  ArrowUpRight,
  X,
  Compass,
  Sunrise,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useMyBadges } from '../../lib/profileApi';
import { CityBriefingModal, useCityBriefingAi } from '../feed/DailyBriefingCard';

export const MenuPopupModal: React.FC = () => {
  const navigate = useNavigate();
  const {
    isMenuPopupOpen,
    setIsMenuPopupOpen,
    user,
    posts,
    isBriefingAvailable,
    isBriefingAcknowledged,
  } = useApp();
  const [showBriefingModal, setShowBriefingModal] = React.useState(false);
  const { top3Issues } = useCityBriefingAi(posts);

  const { badges: earnedBadges } = useMyBadges(user.points);
  const unlockedBadgesCount = earnedBadges.length;

  // Handle escape key to dismiss
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMenuPopupOpen) {
        setIsMenuPopupOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMenuPopupOpen, setIsMenuPopupOpen]);

  if (!isMenuPopupOpen) return null;

  const handleNavigate = (path: string) => {
    setIsMenuPopupOpen(false);
    navigate(path);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 transition-all duration-200"
      onClick={() => setIsMenuPopupOpen(false)}
      role="dialog"
      aria-modal="true"
      aria-label="Civic Activities Menu"
    >
      <div
        className="w-full max-w-lg bg-white rounded-t-[32px] sm:rounded-[32px] shadow-2xl border-t sm:border border-[#cbd5e1] p-4 sm:p-5 flex flex-col space-y-3.5 max-h-[90vh] overflow-y-auto animate-popup pb-safe"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Grab Handle for bottom sheet on mobile */}
        <div className="w-12 h-1.5 bg-[#cbd5e1] rounded-full mx-auto -mt-1 mb-1 sm:hidden" />

        {/* Header with Title and Close Button */}
        <div className="flex items-center justify-between pb-1 px-1">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#eff6ff] text-[#0f2d59] flex items-center justify-center">
              <Compass className="w-4 h-4 stroke-[2.4]" />
            </div>
            <div>
              <span className="text-[11px] font-black uppercase tracking-wider text-[#64748B] block">
                CIVIC ACTIVITIES & INTEL
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span
              onClick={() => handleNavigate('/menu')}
              className="text-[11px] font-bold text-[#0f2d59] hover:underline cursor-pointer hidden sm:inline-block"
            >
              Explore Hub
            </span>
            <button
              onClick={() => setIsMenuPopupOpen(false)}
              className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 active:scale-95 text-[#64748B] hover:text-[#0F172A] flex items-center justify-center transition-all cursor-pointer"
              aria-label="Close menu popup"
            >
              <X className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>
        </div>

        {/* ========================================================= */}
        {/* 1. TOP DUAL FEATURED BUTTONS (VOLUNTEER & ALERT HALF-HALF) */}
        {/* ========================================================= */}
        <div className="grid grid-cols-2 gap-3 sm:gap-3.5">
          {/* Left Button (Half): Ward Volunteering */}
          <button
            type="button"
            onClick={() => handleNavigate('/volunteer')}
            className="text-left w-full relative overflow-hidden bg-gradient-to-br from-[#0f2d59] via-[#1B6643] to-[#257C53] text-white rounded-3xl p-3.5 sm:p-4 shadow-md hover:shadow-lg active:scale-[0.98] transition-all duration-200 group cursor-pointer border border-[#1d4e8c]/40 focus:outline-none flex flex-col justify-between min-h-[145px]"
          >
            <div className="absolute -right-8 -bottom-8 w-28 h-28 bg-white/10 rounded-full blur-xl pointer-events-none group-hover:scale-125 transition-transform" />

            <div className="relative z-10 flex items-center justify-between w-full">
              <span className="inline-flex items-center gap-1 text-[9.5px] font-black uppercase tracking-wider bg-white/15 backdrop-blur-xs text-[#A7F3D0] px-2 py-0.5 rounded-full border border-white/10">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse" />
                VOLUNTEER
              </span>
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-white text-[#0f2d59] flex items-center justify-center shadow-xs group-hover:scale-105 group-hover:rotate-6 transition-all">
                <ArrowUpRight className="w-4 h-4 stroke-[2.6]" />
              </div>
            </div>

            <div className="relative z-10 space-y-1 my-1">
              <h3 className="text-sm sm:text-base font-black tracking-tight text-white leading-tight">
                NGO Volunteering &amp; Civic Drives
              </h3>
              <p className="text-[11px] text-emerald-100/90 leading-snug line-clamp-2">
                Join or start a drive, or apply for an NGO role.
              </p>
            </div>

            <div className="relative z-10 flex items-center justify-between pt-1.5 border-t border-white/15 text-[10.5px] font-bold text-emerald-200">
              <span>Drives &amp; roles</span>
              <span className="group-hover:translate-x-0.5 transition-transform">Join →</span>
            </div>
          </button>

          {/* Right Button (Half): Civic Alert */}
          <button
            type="button"
            onClick={() => handleNavigate('/alerts')}
            className="text-left w-full relative overflow-hidden bg-gradient-to-br from-[#7f1d1d] via-[#9a3412] to-[#b45309] text-white rounded-3xl p-3.5 sm:p-4 shadow-md hover:shadow-lg active:scale-[0.98] transition-all duration-200 group cursor-pointer border border-amber-500/40 focus:outline-none flex flex-col justify-between min-h-[145px]"
          >
            <div className="absolute -right-8 -bottom-8 w-28 h-28 bg-amber-400/20 rounded-full blur-xl pointer-events-none group-hover:scale-125 transition-transform" />

            <div className="relative z-10 flex items-center justify-between w-full">
              <span className="inline-flex items-center gap-1 text-[9.5px] font-black uppercase tracking-wider bg-white/20 backdrop-blur-xs text-amber-200 px-2 py-0.5 rounded-full border border-white/20">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-ping" />
                CIVIC ALERT
              </span>
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-white text-[#9a3412] flex items-center justify-center shadow-xs group-hover:scale-105 group-hover:rotate-6 transition-all">
                <ArrowUpRight className="w-4 h-4 stroke-[2.6]" />
              </div>
            </div>

            <div className="relative z-10 space-y-1 my-1">
              <h3 className="text-sm sm:text-base font-black tracking-tight text-white leading-tight">
                Predictive Alerts
              </h3>
              <p className="text-[11px] text-amber-100/90 leading-snug line-clamp-2">
                Upcoming season hazards & prevention guide.
              </p>
            </div>

            <div className="relative z-10 flex items-center justify-between pt-1.5 border-t border-white/15 text-[10.5px] font-bold text-amber-200">
              <span>Monsoon: 91% Risk</span>
              <span className="group-hover:translate-x-0.5 transition-transform">View →</span>
            </div>
          </button>
        </div>

        {isBriefingAcknowledged && (
          <div className="relative overflow-hidden bg-gradient-to-r from-[#07172c] via-[#0f2d59] to-[#1e3a8a] text-white rounded-3xl p-4 shadow-sm border border-[#1d4e8c]/50">
            <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-amber-400/15 rounded-full blur-xl pointer-events-none" />

            <div className="relative z-10 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-xs flex items-center justify-center border border-amber-400/40 text-amber-300 shrink-0">
                  <Sunrise className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 text-[9.5px] font-black uppercase tracking-wider bg-emerald-500/25 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-400/30">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      Acknowledged
                    </span>
                    <span className="text-[10px] text-blue-200 font-bold">07:00 AM</span>
                  </div>
                  <h3 className="text-sm font-extrabold text-white mt-1 leading-tight truncate">
                    Your 7 AM City Briefing
                  </h3>
                  <p className="text-[11px] text-blue-100/80 mt-0.5 leading-snug line-clamp-1">
                    {top3Issues.length > 0
                      ? `AI Priority: ${top3Issues[0].title}`
                      : 'AI-prioritized civic dispatch'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowBriefingModal(true)}
                className="shrink-0 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white text-[#0f2d59] font-extrabold text-xs hover:bg-[#eff6ff] active:scale-95 transition-all shadow-sm cursor-pointer border border-blue-200/60"
              >
                <span>View</span>
                <ArrowUpRight className="w-3.5 h-3.5 stroke-[2.5] text-[#ea580c]" />
              </button>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* 2. CORE CIVIC TILES (2x2 BENTO GRID - CLEAN & ATTRACTIVE) */}
        {/* ========================================================= */}
        <div className="grid grid-cols-2 gap-3 sm:gap-3.5">
          {/* Tile 1: Quizzes & Contests */}
          <button
            type="button"
            onClick={() => handleNavigate('/games')}
            className="text-left bg-white rounded-3xl p-4 border border-[#cbd5e1] shadow-xs hover:shadow-md hover:border-amber-400/60 active:scale-[0.98] transition-all duration-200 group cursor-pointer flex flex-col justify-between space-y-3 relative overflow-hidden focus:outline-none"
          >
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 to-orange-500" />

            <div className="space-y-2.5 w-full">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 text-white flex items-center justify-center shadow-sm shadow-amber-500/25 group-hover:scale-105 transition-transform">
                  <Gamepad2 className="w-5 h-5 stroke-[2.2]" />
                </div>
                <span className="text-[10px] font-extrabold text-amber-900 bg-amber-50 border border-amber-200/80 px-2 py-0.5 rounded-full">
                  Win prizes
                </span>
              </div>

              <div>
                <h4 className="text-sm font-extrabold text-[#0F172A] group-hover:text-amber-800 transition-colors leading-tight">
                  Quizzes & Contests
                </h4>
                <p className="text-[11px] text-[#64748B] mt-0.5 leading-snug line-clamp-2">
                  Join NGO contests, win points, climb the leaderboard.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px] font-bold text-amber-700 w-full">
              <span>Play & Win</span>
              <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </div>
          </button>

          {/* Tile 2: My Requests & Grievances */}
          <button
            type="button"
            onClick={() => handleNavigate('/report-analysis')}
            className="text-left bg-white rounded-3xl p-4 border border-[#cbd5e1] shadow-xs hover:shadow-md hover:border-blue-400/60 active:scale-[0.98] transition-all duration-200 group cursor-pointer flex flex-col justify-between space-y-3 relative overflow-hidden focus:outline-none"
          >
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-600" />

            <div className="space-y-2.5 w-full">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-sm shadow-blue-500/25 group-hover:scale-105 transition-transform">
                  <BarChart3 className="w-5 h-5 stroke-[2.2]" />
                </div>
                <span className="text-[10px] font-extrabold text-blue-900 bg-blue-50 border border-blue-200/80 px-2 py-0.5 rounded-full">
                  {user.stats.reportsCount} filed
                </span>
              </div>

              <div>
                <h4 className="text-sm font-extrabold text-[#0F172A] group-hover:text-blue-800 transition-colors leading-tight">
                  My Requests & Grievances
                </h4>
                <p className="text-[11px] text-[#64748B] mt-0.5 leading-snug line-clamp-2">
                  Track every report you filed and how it is being resolved.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px] font-bold text-blue-700 w-full">
              <span>View My Requests</span>
              <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </div>
          </button>

          {/* Tile 3: Civic Academy */}
          <button
            type="button"
            onClick={() => handleNavigate('/academy')}
            className="text-left bg-white rounded-3xl p-4 border border-[#cbd5e1] shadow-xs hover:shadow-md hover:border-teal-400/60 active:scale-[0.98] transition-all duration-200 group cursor-pointer flex flex-col justify-between space-y-3 relative overflow-hidden focus:outline-none"
          >
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-teal-500 to-emerald-600" />

            <div className="space-y-2.5 w-full">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-teal-600 to-emerald-600 text-white flex items-center justify-center shadow-sm shadow-teal-500/25 group-hover:scale-105 transition-transform">
                  <GraduationCap className="w-5 h-5 stroke-[2.2]" />
                </div>
                <span className="text-[10px] font-extrabold text-teal-900 bg-teal-50 border border-teal-200/80 px-2 py-0.5 rounded-full">
                  NGO courses
                </span>
              </div>

              <div>
                <h4 className="text-sm font-extrabold text-[#0F172A] group-hover:text-teal-800 transition-colors leading-tight">
                  Civic Academy
                </h4>
                <p className="text-[11px] text-[#64748B] mt-0.5 leading-snug line-clamp-2">
                  NGO-run courses with video lessons, real tasks and verified certificates.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px] font-bold text-teal-700 w-full">
              <span>Start Learning</span>
              <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </div>
          </button>

          {/* Tile 4: Rewards & Certs */}
          <button
            type="button"
            onClick={() => handleNavigate('/rewards')}
            className="text-left bg-white rounded-3xl p-4 border border-[#cbd5e1] shadow-xs hover:shadow-md hover:border-purple-400/60 active:scale-[0.98] transition-all duration-200 group cursor-pointer flex flex-col justify-between space-y-3 relative overflow-hidden focus:outline-none"
          >
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-violet-600" />

            <div className="space-y-2.5 w-full">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 text-white flex items-center justify-center shadow-sm shadow-purple-500/25 group-hover:scale-105 transition-transform">
                  <Award className="w-5 h-5 stroke-[2.2]" />
                </div>
                <span className="text-[10px] font-extrabold text-purple-900 bg-purple-50 border border-purple-200/80 px-2 py-0.5 rounded-full">
                  {unlockedBadgesCount} Badges
                </span>
              </div>

              <div>
                <h4 className="text-sm font-extrabold text-[#0F172A] group-hover:text-purple-800 transition-colors leading-tight">
                  Rewards & Certs
                </h4>
                <p className="text-[11px] text-[#64748B] mt-0.5 leading-snug line-clamp-2">
                  Level gauges, redeemable points, and verified credentials.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px] font-bold text-purple-700 w-full">
              <span>View Honors</span>
              <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </div>
          </button>
        </div>
      </div>

      <CityBriefingModal
        isOpen={showBriefingModal}
        onClose={() => setShowBriefingModal(false)}
        showAcknowledgeButton={false}
      />
    </div>
  );
};
