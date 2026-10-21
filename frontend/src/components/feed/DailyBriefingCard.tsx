import React, { useState, useEffect } from 'react';
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
  Lightbulb,
  Shield,
  Users,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { prioritizeFeed } from '../../lib/api';
import { CivicPost } from '../../types';

export const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'Water':
      return <Droplets className="w-3.5 h-3.5 text-blue-600" />;
    case 'Roads':
      return <Truck className="w-3.5 h-3.5 text-amber-600" />;
    case 'Sanitation':
      return <Leaf className="w-3.5 h-3.5 text-emerald-600" />;
    case 'Streetlights':
      return <Lightbulb className="w-3.5 h-3.5 text-yellow-600" />;
    case 'Public Safety':
      return <Shield className="w-3.5 h-3.5 text-red-600" />;
    case 'Community':
      return <Users className="w-3.5 h-3.5 text-indigo-600" />;
    default:
      return <Sparkles className="w-3.5 h-3.5 text-[#0f2d59]" />;
  }
};

/**
 * Hook to rank active civic posts by urgency using the backend AI service (/api/feed/prioritize).
 * Returns the top 3 highest priority redressal issues of the day.
 */
export function useCityBriefingAi(posts: CivicPost[]) {
  const [top3Issues, setTop3Issues] = useState<CivicPost[]>([]);
  const [isLoadingAi, setIsLoadingAi] = useState<boolean>(true);

  useEffect(() => {
    let cancelled = false;

    const rankFeedWithAi = async () => {
      if (!posts || posts.length === 0) {
        setIsLoadingAi(false);
        return;
      }

      setIsLoadingAi(true);

      const getFallbackSorted = () => {
        const priorityScore: Record<string, number> = {
          Urgent: 4,
          Critical: 4,
          High: 3,
          Medium: 2,
          Low: 1,
        };
        return [...posts].sort((a, b) => {
          const pA = priorityScore[a.priority || 'Medium'] || 2;
          const pB = priorityScore[b.priority || 'Medium'] || 2;
          if (pA !== pB) return pB - pA;
          return (b.upvotes || 0) - (a.upvotes || 0);
        });
      };

      try {
        const complaints = posts.slice(0, 20).map((p) => ({
          id: String(p.id),
          title: p.title,
          description: p.description?.substring(0, 100) || '',
          category: p.category,
        }));

        const result = await prioritizeFeed(complaints);
        if (!cancelled && result?.ranked_ids && result.ranked_ids.length > 0) {
          const idOrder = new Map(result.ranked_ids.map((id, idx) => [id, idx]));
          const sorted = [...posts].sort((a, b) => {
            const orderA = idOrder.get(String(a.id)) ?? 999;
            const orderB = idOrder.get(String(b.id)) ?? 999;
            return (orderA as number) - (orderB as number);
          });
          setTop3Issues(sorted.slice(0, 3));
        } else if (!cancelled) {
          setTop3Issues(getFallbackSorted().slice(0, 3));
        }
      } catch (err) {
        if (!cancelled) {
          setTop3Issues(getFallbackSorted().slice(0, 3));
        }
      } finally {
        if (!cancelled) {
          setIsLoadingAi(false);
        }
      }
    };

    rankFeedWithAi();

    return () => {
      cancelled = true;
    };
  }, [posts]);

  return { top3Issues, isLoadingAi };
}

export interface CityBriefingModalProps {
  isOpen: boolean;
  onClose: () => void;
  showAcknowledgeButton?: boolean;
}

/**
 * Reusable Full 7:00 AM City Briefing Modal.
 * Displays AI-prioritized Top 3 problems of the feed under "Priority Redressal of the Day".
 */
export const CityBriefingModal: React.FC<CityBriefingModalProps> = ({
  isOpen,
  onClose,
  showAcknowledgeButton = true,
}) => {
  const { briefing, posts, setSelectedPostForDetail, acknowledgeBriefing, isBriefingAcknowledged } = useApp();
  const { top3Issues, isLoadingAi } = useCityBriefingAi(posts);

  if (!isOpen) return null;

  const handleAcknowledge = () => {
    acknowledgeBriefing();
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 transition-all animate-in fade-in"
      onClick={onClose}
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
            onClick={onClose}
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
              <span>07:00 AM Municipal Intelligence Dispatch</span>
            </div>
            <h4 className="font-extrabold text-sm text-[#0f172a] leading-snug">
              {top3Issues[0]
                ? `Priority Redressal Focus: ${top3Issues[0].title}`
                : briefing.headline}
            </h4>
            <p className="text-xs text-[#334155] leading-relaxed">
              {top3Issues.length > 0
                ? `AI has analyzed active civic reports and flagged ${top3Issues.length} critical issues requiring urgent redressal today. Field engineers and response units have been prioritized for immediate site remediation.`
                : briefing.aiSummary}
            </p>
          </div>

          {/* Priority Redressal of the Day - AI Ranked Top 3 Problems */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <h5 className="font-extrabold text-xs uppercase tracking-wider text-[#64748b]">
                  Priority Redressal of the Day
                </h5>
                <span className="inline-flex items-center gap-1 text-[9.5px] bg-purple-100 text-purple-900 font-extrabold px-2 py-0.5 rounded-full border border-purple-200">
                  <Sparkles className="w-2.5 h-2.5 text-purple-600" />
                  AI Ranked
                </span>
              </div>
              <span className="text-[10px] bg-red-100 text-red-800 font-extrabold px-2 py-0.5 rounded-full border border-red-200">
                Top 3 Critical Issues
              </span>
            </div>

            {isLoadingAi && top3Issues.length === 0 ? (
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-center space-y-2">
                <span className="w-5 h-5 border-2 border-[#0f2d59] border-t-transparent rounded-full animate-spin inline-block" />
                <p className="text-xs font-semibold text-[#64748b]">AI analyzing civic feed for top safety priorities...</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {top3Issues.map((issue, idx) => {
                  const rankStyles = [
                    {
                      tag: '#1 Highest Urgency',
                      badgeBg: 'bg-red-600 text-white',
                      border: 'border-red-200',
                      bg: 'bg-red-50/50',
                    },
                    {
                      tag: '#2 Critical Safety',
                      badgeBg: 'bg-orange-600 text-white',
                      border: 'border-orange-200',
                      bg: 'bg-orange-50/50',
                    },
                    {
                      tag: '#3 Municipal Priority',
                      badgeBg: 'bg-amber-600 text-white',
                      border: 'border-amber-200',
                      bg: 'bg-amber-50/50',
                    },
                  ];
                  const rank = rankStyles[idx] || rankStyles[2];

                  return (
                    <div
                      key={issue.id}
                      className={`border ${rank.border} ${rank.bg} rounded-2xl p-3 shadow-xs space-y-2 transition-all hover:shadow-sm`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2">
                          <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${rank.badgeBg} shrink-0 mt-0.5`}>
                            {rank.tag}
                          </span>
                          <div>
                            <p className="font-extrabold text-xs text-[#0f172a] leading-tight">
                              {issue.title}
                            </p>
                            <p className="text-[11px] text-[#64748b] mt-0.5">
                              {issue.reporter?.wardOrArea || 'Ward 112'} • {issue.upvotes || 0} citizen petitions & reports
                            </p>
                          </div>
                        </div>
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 bg-white rounded-md border border-slate-200 shrink-0 text-[#0f2d59]">
                          {getCategoryIcon(issue.category)}
                          <span>{issue.category}</span>
                        </span>
                      </div>

                      {issue.description && (
                        <p className="text-[11px] text-[#334155] line-clamp-2 leading-relaxed bg-white/80 p-2 rounded-xl border border-slate-100">
                          {issue.description}
                        </p>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          setSelectedPostForDetail(issue);
                        }}
                        className="w-full py-2 bg-[#0f2d59] text-white font-extrabold rounded-xl text-xs flex items-center justify-center gap-1.5 hover:bg-[#07172c] active:scale-[0.99] transition-all cursor-pointer border border-[#0f2d59] shadow-2xs"
                      >
                        <span>Inspect Official Docket</span>
                        <ChevronRight size={14} className="text-amber-400" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Key Ward Operations */}
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
          {showAcknowledgeButton && (
            <button
              onClick={handleAcknowledge}
              className="px-4 py-1.5 bg-[#0f2d59] text-white rounded-xl text-xs font-bold hover:bg-[#07172c] transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs active:scale-95"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>{isBriefingAcknowledged ? 'Dismiss' : 'Acknowledge'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export const DailyBriefingCard: React.FC = () => {
  const { briefing, posts, setSelectedPostForDetail, acknowledgeBriefing } = useApp();
  const { top3Issues } = useCityBriefingAi(posts);

  // Default to 1 (Your 7 AM City Briefing)
  const [activeDot, setActiveDot] = useState(1);
  const [showFullModal, setShowFullModal] = useState(false);

  // 4 slide options for interactive dots, with Slide 1 & 2 matching AI-powered city priorities
  const slides = [
    {
      badge: 'Featured',
      badgeIcon: 'star',
      titleLine1: 'Real Change',
      titleLine2: 'Starts with You',
      subtitle: 'Report issues • Support causes • Build a better tomorrow',
      buttonText: 'Explore Issues',
      actionType: 'explore',
    },
    {
      badge: '7:00 AM City Briefing',
      badgeIcon: 'sunrise',
      titleLine1: 'Your 7 AM',
      titleLine2: 'City Briefing',
      subtitle: top3Issues[0]
        ? `Top Priority: ${top3Issues[0].title} • BBMP Active`
        : 'Morning Ward Dispatch • Official Civic Intelligence',
      buttonText: 'View Briefing',
      actionType: 'briefing',
    },
    {
      badge: 'Priority Redressal (AI)',
      badgeIcon: 'alert',
      titleLine1: top3Issues[0] ? top3Issues[0].title.slice(0, 24) : 'Road Cavity Fix',
      titleLine2: top3Issues[0] && top3Issues[0].title.length > 24 ? top3Issues[0].title.slice(24, 48) + '...' : '',
      subtitle: top3Issues[0]
        ? `${top3Issues[0].reporter?.wardOrArea || 'Ward 112'} • AI Ranked #1 Priority (${top3Issues[0].upvotes || 0} petitions)`
        : 'Cold mix leveling in progress • Caution cones placed',
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
      const p = top3Issues[0] || posts.find((item) => item.id === briefing.priorityIssue.id) || posts[0];
      setSelectedPostForDetail(p);
    } else if (type === 'positive') {
      const p = posts.find((item) => item.isPositiveStory) || posts[2] || posts[0];
      setSelectedPostForDetail(p);
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
                className={`w-1.5 h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                  activeDot === idx
                    ? 'bg-amber-400 scale-125 shadow-xs'
                    : 'bg-white/40 hover:bg-white/70'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Content Bottom: Headline on Left, Action Buttons on Right */}
        <div className="relative z-10 flex items-end justify-between gap-3 mt-1.5">
          <div className="min-w-0 flex-1">
            <h2 className="text-base sm:text-lg font-extrabold text-white tracking-tight leading-snug drop-shadow-sm truncate">
              {current.titleLine1} {current.titleLine2}
            </h2>
            <p className="text-[10.5px] text-white/85 font-normal leading-tight mt-0.5 line-clamp-1 drop-shadow-xs">
              {current.subtitle}
            </p>
          </div>

          {/* Action Buttons: Acknowledge & Official Civic Pill */}
          <div className="shrink-0 flex items-center gap-2">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                acknowledgeBriefing();
              }}
              title="Acknowledge briefing and move to Menu"
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white font-extrabold text-xs backdrop-blur-xs border border-white/30 transition-all cursor-pointer active:scale-95 shadow-2xs"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
              <span>Acknowledge</span>
            </button>

            <button
              type="button"
              onClick={() => handleAction(current.actionType)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white text-[#0f2d59] font-extrabold text-xs hover:bg-[#eff6ff] active:scale-95 transition-all shadow-sm cursor-pointer border border-blue-200/60"
            >
              <span>{current.buttonText}</span>
              <ArrowRight className="w-3 h-3 stroke-[2.5] text-[#ea580c]" />
            </button>
          </div>
        </div>
      </div>

      {/* Full 7 AM Briefing Modal */}
      <CityBriefingModal
        isOpen={showFullModal}
        onClose={() => setShowFullModal(false)}
        showAcknowledgeButton={true}
      />
    </>
  );
};
