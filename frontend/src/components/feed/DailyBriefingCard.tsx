import React, { useState } from 'react';
import {
  Star,
  ArrowRight,
  Sunrise,
  Calendar,
  X,
  Droplets,
  Truck,
  Leaf,
  CheckCircle2,
  Sparkles,
  Trophy,
  ChevronRight,
  AlertCircle,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const DailyBriefingCard: React.FC = () => {
  const { briefing, posts, setSelectedPostForDetail } = useApp();
  // Default to 1 (Your 7 AM City Briefing) to match the user's screenshot exactly
  const [activeDot, setActiveDot] = useState(1);
  const [showFullModal, setShowFullModal] = useState(false);

  // 4 slide options for interactive dots, with Slide 1 matching the user's uploaded 7 AM City Briefing screenshot
  const slides = [
    {
      badge: 'Featured',
      badgeIcon: 'star',
      titleLine1: 'Real Change',
      titleLine2: 'Starts with You',
      subtitle: 'Report issues  •  Support causes  •  Build a better tomorrow',
      buttonText: 'Explore Issues',
      actionType: 'explore',
    },
    {
      badge: '7:00 AM City Briefing',
      badgeIcon: 'sunrise',
      titleLine1: 'Your 7 AM',
      titleLine2: 'City Briefing',
      subtitle: 'Morning Ward Dispatch • Sunday, October 18, 2026 • BBMP Active',
      buttonText: 'View Briefing',
      actionType: 'briefing',
    },
    {
      badge: 'Priority Civic Alert',
      badgeIcon: 'alert',
      titleLine1: 'Road Cavity Fix',
      titleLine2: '100ft Road Sector',
      subtitle: 'Cold mix leveling in progress  •  Caution cones placed',
      buttonText: 'Track Repair',
      actionType: 'priority',
    },
    {
      badge: 'Positive Impact',
      badgeIcon: 'trophy',
      titleLine1: 'Pocket Park Revamp',
      titleLine2: 'Complete & Open',
      subtitle: 'Dumping strip transformed into sensory community garden',
      buttonText: 'See Impact Story',
      actionType: 'positive',
    },
  ];

  const current = slides[activeDot];

  const handleAction = (type: string) => {
    if (type === 'explore') {
      const feed = document.getElementById('civic-feed-section');
      if (feed) {
        feed.scrollIntoView({ behavior: 'smooth' });
      } else {
        window.scrollBy({ top: 320, behavior: 'smooth' });
      }
    } else if (type === 'briefing') {
      setShowFullModal(true);
    } else if (type === 'priority') {
      const p = posts.find((item) => item.id === briefing.priorityIssue.id) || posts[0];
      setSelectedPostForDetail(p);
    } else if (type === 'positive') {
      const p = posts.find((item) => item.isPositiveStory) || posts[2] || posts[0];
      setSelectedPostForDetail(p);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Water':
        return <Droplets className="w-3.5 h-3.5 text-blue-600" />;
      case 'Roads':
        return <Truck className="w-3.5 h-3.5 text-amber-600" />;
      case 'Sanitation':
        return <Leaf className="w-3.5 h-3.5 text-emerald-600" />;
      default:
        return <Sparkles className="w-3.5 h-3.5 text-[#0f2d59]" />;
    }
  };

  return (
    <>
      <div className="relative w-full rounded-2xl overflow-hidden shadow-md border border-[#1d4e8c]/40 bg-[#0a1e38] min-h-[115px] sm:min-h-[120px] flex flex-col justify-between p-3.5 sm:p-4 select-none transition-all">
        {/* Layer 1: High Fidelity Architectural SVG of Twilight City Skyline, Spires & Golden Street Lights */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <svg
            className="w-full h-full object-cover object-right"
            viewBox="0 0 800 480"
            preserveAspectRatio="xMaxYMid slice"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Twilight Horizon Sky Gradient */}
            <rect width="800" height="480" fill="url(#twilightGradient)" />
            <defs>
              <linearGradient id="twilightGradient" x1="400" y1="0" x2="400" y2="480" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#07172c" />
                <stop offset="35%" stopColor="#0f2d59" />
                <stop offset="65%" stopColor="#1e3a8a" />
                <stop offset="85%" stopColor="#1d4e8c" />
                <stop offset="100%" stopColor="#07172c" />
              </linearGradient>

              <linearGradient id="towerGradient1" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#1e3a8a" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#07172c" stopOpacity="0.95" />
              </linearGradient>

              <linearGradient id="goldenGlow" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.85" />
                <stop offset="50%" stopColor="#fbbf24" stopOpacity="0.95" />
                <stop offset="100%" stopColor="#ea580c" stopOpacity="0.7" />
              </linearGradient>
            </defs>

            {/* Distant Spire Towers */}
            <g opacity="0.6">
              <polygon points="560,70 550,150 570,150" fill="#3b82f6" />
              <rect x="548" y="150" width="24" height="200" fill="url(#towerGradient1)" />
              <polygon points="630,45 618,135 642,135" fill="#3b82f6" />
              <line x1="630" y1="20" x2="630" y2="45" stroke="#93c5fd" strokeWidth="2.5" />
              <rect x="616" y="135" width="28" height="220" fill="url(#towerGradient1)" />
              <polygon points="700,60 688,140 712,140" fill="#3b82f6" />
              <rect x="686" y="140" width="28" height="210" fill="url(#towerGradient1)" />
              <polygon points="765,75 754,155 776,155" fill="#3b82f6" />
              <rect x="752" y="155" width="26" height="195" fill="url(#towerGradient1)" />
            </g>

            {/* Glowing Golden Highways & City Traffic Lights */}
            <g opacity="0.75">
              <path
                d="M420 480 C 470 380, 520 320, 600 290 C 680 260, 740 280, 800 270"
                stroke="url(#goldenGlow)"
                strokeWidth="8"
                strokeLinecap="round"
              />
              <path
                d="M480 480 C 530 400, 570 350, 660 330 C 720 310, 770 320, 800 315"
                stroke="#F59E0B"
                strokeWidth="4"
                strokeDasharray="12 6"
              />
            </g>
          </svg>
        </div>

        {/* Layer 2: Night Cityscape Photo */}
        <img
          src="https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=1200&q=80"
          alt="City Aerial Lights"
          className="absolute inset-0 w-full h-full object-cover object-right pointer-events-none opacity-80 mix-blend-screen"
          loading="lazy"
          onError={(e) => {
            (e.target as HTMLElement).style.display = 'none';
          }}
        />

        {/* Layer 3: Deep Ashok Navy Seamless Gradient on Left */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#07172c] via-[#0a2342]/95 via-55% to-transparent pointer-events-none" />

        {/* Content Top: Pill Badge & Pagination Dots */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white text-[#0f2d59] font-extrabold text-[11px] shadow-xs border border-blue-100">
            {current.badgeIcon === 'star' && (
              <Star className="w-3 h-3 fill-[#ea580c] text-[#ea580c]" />
            )}
            {current.badgeIcon === 'sunrise' && (
              <Sunrise className="w-3.5 h-3.5 text-[#d97706]" />
            )}
            {current.badgeIcon === 'alert' && (
              <AlertCircle className="w-3 h-3 text-[#dc2626]" />
            )}
            {current.badgeIcon === 'trophy' && (
              <Trophy className="w-3 h-3 text-[#d97706]" />
            )}
            <span>{current.badge}</span>
          </div>

          {/* Pagination Dots */}
          <div className="flex items-center gap-1" title="Highlights">
            {slides.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setActiveDot(idx)}
                aria-label={`Slide ${idx + 1}`}
                className={`w-1.5 h-1.5 rounded-full transition-all duration-300 cursor-pointer ${activeDot === idx
                    ? 'bg-amber-400 scale-125 shadow-xs'
                    : 'bg-white/40 hover:bg-white/70'
                  }`}
              />
            ))}
          </div>
        </div>

        {/* Content Bottom: Headline on Left, Action Button on Right */}
        <div className="relative z-10 flex items-end justify-between gap-3 mt-1.5">
          <div className="min-w-0 flex-1">
            <h2 className="text-base sm:text-lg font-extrabold text-white tracking-tight leading-snug drop-shadow-sm truncate">
              {current.titleLine1} {current.titleLine2}
            </h2>
            <p className="text-[10.5px] text-white/85 font-normal leading-tight mt-0.5 line-clamp-1 drop-shadow-xs">
              {current.subtitle}
            </p>
          </div>

          {/* Action Button: Official Civic Pill */}
          <button
            type="button"
            onClick={() => handleAction(current.actionType)}
            className="shrink-0 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white text-[#0f2d59] font-extrabold text-xs hover:bg-[#eff6ff] active:scale-95 transition-all shadow-sm cursor-pointer border border-blue-200/60"
          >
            <span>{current.buttonText}</span>
            <ArrowRight className="w-3 h-3 stroke-[2.5] text-[#ea580c]" />
          </button>
        </div>
      </div>

      {/* Full 7 AM Briefing Modal */}
      {showFullModal && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 transition-all animate-in fade-in"
          onClick={() => setShowFullModal(false)}
        >
          <div
            className="w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col pb-safe"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-[#0f2d59] text-white p-4 flex items-center justify-between shrink-0 border-b border-blue-900/50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center border border-amber-400/40">
                  <Sunrise className="w-4 h-4 text-amber-300" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm leading-tight">Your 7 AM City Briefing</h3>
                  <p className="text-[11px] text-blue-200">BBMP Ward 112 • Official Civic Intelligence</p>
                </div>
              </div>
              <button
                onClick={() => setShowFullModal(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs text-[#0f172a]">
              {/* Headline & Summary */}
              <div className="bg-[#eff6ff] border border-blue-200 rounded-2xl p-3.5 space-y-1.5">
                <div className="flex items-center gap-1.5 text-[#0f2d59] font-extrabold text-xs">
                  <Calendar className="w-3.5 h-3.5 text-[#ea580c]" />
                  <span>Sunday, October 18, 2026 • 07:00 AM Municipal Dispatch</span>
                </div>
                <h4 className="font-extrabold text-sm text-[#0f172a] leading-snug">
                  {briefing.headline}
                </h4>
                <p className="text-xs text-[#334155] leading-relaxed">
                  {briefing.aiSummary}
                </p>
              </div>

              {/* Priority Fix Section */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h5 className="font-extrabold text-xs uppercase tracking-wider text-[#64748b]">
                    Priority Redressal of the Day
                  </h5>
                  <span className="text-[10px] bg-red-100 text-red-800 font-extrabold px-2 py-0.5 rounded-full border border-red-200">
                    High Urgency
                  </span>
                </div>
                <div className="bg-white border border-[#cbd5e1] rounded-2xl p-3 shadow-xs space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-extrabold text-xs text-[#0f172a]">
                        {briefing.priorityIssue.title}
                      </p>
                      <p className="text-[11px] text-[#64748b]">
                        {briefing.priorityIssue.area} • {briefing.priorityIssue.reportsCount} citizen petitions
                      </p>
                    </div>
                  </div>
                  <p className="text-[11px] text-[#334155]">
                    BBMP Road Infrastructure Cell has assigned rapid cold-mix patching. Excavation leveled; final asphalt seal scheduled before evening commute.
                  </p>
                  <button
                    onClick={() => {
                      setShowFullModal(false);
                      const p = posts.find((item) => item.id === briefing.priorityIssue.id) || posts[0];
                      setSelectedPostForDetail(p);
                    }}
                    className="w-full py-2 bg-[#0f2d59] text-white font-extrabold rounded-xl text-xs flex items-center justify-center gap-1.5 hover:bg-[#07172c] transition-colors cursor-pointer border border-[#0f2d59]"
                  >
                    <span>View Official Inspection Docket</span>
                    <ChevronRight size={14} className="text-amber-400" />
                  </button>
                </div>
              </div>

              {/* Top Ward Updates */}
              <div className="space-y-2">
                <h5 className="font-extrabold text-xs uppercase tracking-wider text-[#64748b]">
                  Key Ward Operations
                </h5>
                <div className="space-y-2">
                  {briefing.topUpdates.map((update) => (
                    <div
                      key={update.id}
                      className="bg-white border border-[#cbd5e1] rounded-2xl p-2.5 flex items-start gap-2.5 shadow-xs"
                    >
                      <div className="w-7 h-7 rounded-xl bg-slate-100 flex items-center justify-center shrink-0 mt-0.5">
                        {getCategoryIcon(update.category)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <p className="font-bold text-xs text-[#0f172a] truncate">{update.title}</p>
                          <span className="text-[10px] text-[#0f2d59] font-bold shrink-0 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                            {update.category}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#64748b] mt-0.5">{update.impact}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Positive Story */}
              <div className="bg-[#ecfdf5] border border-emerald-300 rounded-2xl p-3 flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#0b6623] shrink-0 mt-0.5" />
                <div>
                  <p className="font-extrabold text-xs text-[#0b6623]">
                    Yesterday's Impact: {briefing.positiveStory.title}
                  </p>
                  <p className="text-[11px] text-[#15803d] mt-0.5">
                    {briefing.positiveStory.outcome} ({briefing.positiveStory.area})
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-3 bg-white border-t border-[#cbd5e1] flex items-center justify-between shrink-0">
              <span className="text-[11px] text-[#64748b]">Next Dispatch: Tomorrow at 7:00 AM</span>
              <button
                onClick={() => setShowFullModal(false)}
                className="px-4 py-1.5 bg-[#0f2d59] text-white rounded-xl text-xs font-bold hover:bg-[#07172c] transition-colors cursor-pointer"
              >
                Acknowledge
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
