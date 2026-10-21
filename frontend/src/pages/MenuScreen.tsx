import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Gamepad2,
  BarChart3,
  GraduationCap,
  Award,
  ArrowUpRight,
  AlertTriangle,
  CloudRain,
  Users,
  Sunrise,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { CityBriefingModal, useCityBriefingAi } from '../components/feed/DailyBriefingCard';

export const MenuScreen: React.FC = () => {
  const navigate = useNavigate();
  const { badges, user, posts, isBriefingAvailable, isBriefingAcknowledged } = useApp();
  const [showBriefingModal, setShowBriefingModal] = useState(false);
  const { top3Issues } = useCityBriefingAi(posts);

  const unlockedBadgesCount = badges ? badges.filter((b) => b.isUnlocked).length : 4;

  return (
    <div className="flex-1 flex flex-col px-3.5 sm:px-4 pt-3 pb-12 space-y-4 max-w-2xl mx-auto w-full select-none">
      {/* ========================================================= */}
      {/* 1. TOP DUAL FEATURED BUTTONS (VOLUNTEER & ALERT HALF-HALF) */}
      {/* ========================================================= */}
      <div className="grid grid-cols-2 gap-3 sm:gap-3.5">
        {/* Left Button (Half): Ward Volunteering */}
        <button
          type="button"
          onClick={() => navigate('/volunteer')}
          className="text-left w-full relative overflow-hidden bg-gradient-to-br from-[#0f2d59] via-[#1B6643] to-[#257C53] text-white rounded-3xl p-3.5 sm:p-4 shadow-sm hover:shadow-lg active:scale-[0.98] transition-all duration-300 group cursor-pointer border border-[#1d4e8c]/40 focus:outline-none flex flex-col justify-between min-h-[145px]"
        >
          {/* Subtle Decorative Ambient Glows */}
          <div className="absolute -right-8 -bottom-8 w-28 h-28 bg-white/10 rounded-full blur-xl pointer-events-none group-hover:scale-125 transition-transform" />

          {/* Top Row: Tag & Mini Action Button */}
          <div className="relative z-10 flex items-center justify-between w-full">
            <span className="inline-flex items-center gap-1 text-[9.5px] font-black uppercase tracking-wider bg-white/15 backdrop-blur-xs text-[#A7F3D0] px-2 py-0.5 rounded-full border border-white/10">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse" />
              VOLUNTEER
            </span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-white text-[#0f2d59] flex items-center justify-center shadow-xs group-hover:scale-105 group-hover:rotate-6 transition-all">
              <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
            </div>
          </div>

          {/* Text Content */}
          <div className="relative z-10 space-y-1 my-1">
            <h2 className="text-sm sm:text-base font-black tracking-tight text-white leading-tight">
              NGO Volunteering &amp; Civic Drives
            </h2>
            <p className="text-[11px] text-emerald-100/90 leading-snug line-clamp-2">
              Join or start a drive, or apply for an NGO role.
            </p>
          </div>

          {/* Bottom Footer Line */}
          <div className="relative z-10 flex items-center justify-between pt-1.5 border-t border-white/15 text-[10.5px] font-bold text-emerald-200">
            <span>Drives &amp; roles</span>
            <span className="group-hover:translate-x-0.5 transition-transform">Join →</span>
          </div>
        </button>

        {/* Right Button (Half): Alert & Predictive Analysis */}
        <button
          type="button"
          onClick={() => navigate('/alerts')}
          className="text-left w-full relative overflow-hidden bg-gradient-to-br from-[#7f1d1d] via-[#9a3412] to-[#b45309] text-white rounded-3xl p-3.5 sm:p-4 shadow-sm hover:shadow-lg active:scale-[0.98] transition-all duration-300 group cursor-pointer border border-amber-500/40 focus:outline-none flex flex-col justify-between min-h-[145px]"
        >
          {/* Subtle Decorative Ambient Glows */}
          <div className="absolute -right-8 -bottom-8 w-28 h-28 bg-amber-400/20 rounded-full blur-xl pointer-events-none group-hover:scale-125 transition-transform" />

          {/* Top Row: Tag & Mini Action Button */}
          <div className="relative z-10 flex items-center justify-between w-full">
            <span className="inline-flex items-center gap-1 text-[9.5px] font-black uppercase tracking-wider bg-white/20 backdrop-blur-xs text-amber-200 px-2 py-0.5 rounded-full border border-white/20">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-ping" />
              CIVIC ALERT
            </span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-white text-[#9a3412] flex items-center justify-center shadow-xs group-hover:scale-105 group-hover:rotate-6 transition-all">
              <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
            </div>
          </div>

          {/* Text Content */}
          <div className="relative z-10 space-y-1 my-1">
            <h2 className="text-sm sm:text-base font-black tracking-tight text-white leading-tight">
              Predictive Alerts
            </h2>
            <p className="text-[11px] text-amber-100/90 leading-snug line-clamp-2">
              Upcoming season hazards & prevention guide.
            </p>
          </div>

          {/* Bottom Footer Line */}
          <div className="relative z-10 flex items-center justify-between pt-1.5 border-t border-white/15 text-[10.5px] font-bold text-amber-200">
            <span>Monsoon: 91% Risk</span>
            <span className="group-hover:translate-x-0.5 transition-transform">View →</span>
          </div>
        </button>
      </div>

      {/* ========================================================= */}
      {/* 1.5. 7:00 AM CITY BRIEFING (VISIBLE ONLY AFTER ACKNOWLEDGED) */}
      {/* ========================================================= */}
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
                    Acknowledged • Daily Dispatch
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
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-black uppercase tracking-wider text-[#64748B]">
            Civic Activities & Intel
          </span>
          <span className="text-[11px] font-semibold text-[#0f2d59]">
            Explore Hub
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-3.5">
          {/* Tile 1: Civic Games & Quizzes */}
          <button
            type="button"
            onClick={() => navigate('/games')}
            className="text-left bg-white rounded-3xl p-4 border border-[#cbd5e1] shadow-xs hover:shadow-md hover:border-amber-400/50 active:scale-[0.98] transition-all duration-300 group cursor-pointer flex flex-col justify-between space-y-3 relative overflow-hidden focus:outline-none"
          >
            {/* Accent colored top hairline */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 to-orange-500" />

            <div className="space-y-2.5 w-full">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 text-white flex items-center justify-center shadow-sm shadow-amber-500/25 group-hover:scale-105 transition-transform">
                  <Gamepad2 className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-extrabold text-amber-900 bg-amber-50 border border-amber-200/80 px-2 py-0.5 rounded-full">
                  Win prizes
                </span>
              </div>

              <div>
                <h3 className="text-sm font-extrabold text-[#0F172A] group-hover:text-amber-800 transition-colors leading-tight">
                  Quizzes & Contests
                </h3>
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

          {/* Tile 2: Report & Analysis */}
          <button
            type="button"
            onClick={() => navigate('/report-analysis')}
            className="text-left bg-white rounded-3xl p-4 border border-[#cbd5e1] shadow-xs hover:shadow-md hover:border-blue-400/50 active:scale-[0.98] transition-all duration-300 group cursor-pointer flex flex-col justify-between space-y-3 relative overflow-hidden focus:outline-none"
          >
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-600" />

            <div className="space-y-2.5 w-full">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-sm shadow-blue-500/25 group-hover:scale-105 transition-transform">
                  <BarChart3 className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-extrabold text-blue-900 bg-blue-50 border border-blue-200/80 px-2 py-0.5 rounded-full">
                  {user.stats.reportsCount} filed
                </span>
              </div>

              <div>
                <h3 className="text-sm font-extrabold text-[#0F172A] group-hover:text-blue-800 transition-colors leading-tight">
                  My Requests & Grievances
                </h3>
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

          {/* Tile 3: Learn & Certify */}
          <button
            type="button"
            onClick={() => navigate('/academy')}
            className="text-left bg-white rounded-3xl p-4 border border-[#cbd5e1] shadow-xs hover:shadow-md hover:border-teal-400/50 active:scale-[0.98] transition-all duration-300 group cursor-pointer flex flex-col justify-between space-y-3 relative overflow-hidden focus:outline-none"
          >
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-teal-500 to-emerald-600" />

            <div className="space-y-2.5 w-full">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-teal-600 to-emerald-600 text-white flex items-center justify-center shadow-sm shadow-teal-500/25 group-hover:scale-105 transition-transform">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-extrabold text-teal-900 bg-teal-50 border border-teal-200/80 px-2 py-0.5 rounded-full">
                  NGO courses
                </span>
              </div>

              <div>
                <h3 className="text-sm font-extrabold text-[#0F172A] group-hover:text-teal-800 transition-colors leading-tight">
                  Civic Academy
                </h3>
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

          {/* Tile 4: Rewards & Certificates */}
          <button
            type="button"
            onClick={() => navigate('/rewards')}
            className="text-left bg-white rounded-3xl p-4 border border-[#cbd5e1] shadow-xs hover:shadow-md hover:border-purple-400/50 active:scale-[0.98] transition-all duration-300 group cursor-pointer flex flex-col justify-between space-y-3 relative overflow-hidden focus:outline-none"
          >
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-violet-600" />

            <div className="space-y-2.5 w-full">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 text-white flex items-center justify-center shadow-sm shadow-purple-500/25 group-hover:scale-105 transition-transform">
                  <Award className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-extrabold text-purple-900 bg-purple-50 border border-purple-200/80 px-2 py-0.5 rounded-full">
                  {unlockedBadgesCount} Badges
                </span>
              </div>

              <div>
                <h3 className="text-sm font-extrabold text-[#0F172A] group-hover:text-purple-800 transition-colors leading-tight">
                  Rewards & Certs
                </h3>
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

      {/* 7:00 AM City Briefing Modal */}
      <CityBriefingModal
        isOpen={showBriefingModal}
        onClose={() => setShowBriefingModal(false)}
        showAcknowledgeButton={false}
      />
    </div>
  );
};
