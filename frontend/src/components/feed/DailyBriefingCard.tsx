import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Sunrise,
  MapPin,
  ArrowUpRight,
  ChevronUp,
  ChevronDown,
  CheckCircle2,
  Droplets,
  Truck,
  Leaf,
  Lightbulb,
  Shield,
  Users,
  Sparkles,
  X,
  Flame,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { prioritizeFeed } from '../../lib/api';
import { CivicPost } from '../../types';

export const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'Water':
      return <Droplets className="w-3.5 h-3.5 text-blue-400" />;
    case 'Roads':
      return <Truck className="w-3.5 h-3.5 text-amber-400" />;
    case 'Sanitation':
      return <Leaf className="w-3.5 h-3.5 text-emerald-400" />;
    case 'Streetlights':
      return <Lightbulb className="w-3.5 h-3.5 text-yellow-400" />;
    case 'Public Safety':
      return <Shield className="w-3.5 h-3.5 text-red-400" />;
    case 'Community':
      return <Users className="w-3.5 h-3.5 text-indigo-400" />;
    default:
      return <Sparkles className="w-3.5 h-3.5 text-amber-400" />;
  }
};

const FALLBACK_CATEGORY_IMAGES: Record<string, string> = {
  Roads: 'https://images.unsplash.com/photo-1541888946425-d0fbb186156f?auto=format&fit=crop&w=800&q=80',
  Water: 'https://images.unsplash.com/photo-1578991624414-276ef23a534f?auto=format&fit=crop&w=800&q=80',
  Sanitation: 'https://images.unsplash.com/photo-1618477461853-cf6ed80faba5?auto=format&fit=crop&w=800&q=80',
  Streetlights: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=800&q=80',
  'Public Safety': 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
  Parks: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80',
  Community: 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?auto=format&fit=crop&w=800&q=80',
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

interface FlashCardDeckProps {
  issues: CivicPost[];
  isLoading: boolean;
  onSelectIssue: (issue: CivicPost) => void;
  onAcknowledge?: () => void;
  showAcknowledgeButton?: boolean;
}

/**
 * 3D Stacked Flash Card Component matching the user reference.
 * 3 cards layered in 3D perspective with rounded corners, photo background, and scroll/swipe animation.
 */
export const FlashCardDeck: React.FC<FlashCardDeckProps> = ({
  issues,
  isLoading,
  onSelectIssue,
  onAcknowledge,
  showAcknowledgeButton = true,
}) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [animDirection, setAnimDirection] = useState<'up' | 'down'>('up');
  const touchStartY = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const total = issues.length > 0 ? issues.length : 3;

  const nextCard = useCallback(() => {
    if (isAnimating || total <= 1) return;
    setAnimDirection('up');
    setIsAnimating(true);
    setTimeout(() => {
      setActiveIndex((prev) => (prev + 1) % total);
      setIsAnimating(false);
    }, 420);
  }, [isAnimating, total]);

  const prevCard = useCallback(() => {
    if (isAnimating || total <= 1) return;
    setAnimDirection('down');
    setIsAnimating(true);
    setTimeout(() => {
      setActiveIndex((prev) => (prev - 1 + total) % total);
      setIsAnimating(false);
    }, 420);
  }, [isAnimating, total]);

  const handleWheel = (e: React.WheelEvent) => {
    // Only capture vertical scroll gestures on the deck
    if (Math.abs(e.deltaY) > 18) {
      if (e.deltaY > 0) {
        nextCard();
      } else {
        prevCard();
      }
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartY.current === null) return;
    const deltaY = touchStartY.current - e.changedTouches[0].clientY;
    if (deltaY > 35) {
      nextCard(); // swiped upward
    } else if (deltaY < -35) {
      prevCard(); // swiped downward
    }
    touchStartY.current = null;
  };

  if (isLoading && issues.length === 0) {
    return (
      <div className="w-full h-[360px] rounded-[28px] bg-slate-900 border border-slate-800 flex flex-col items-center justify-center space-y-3 p-6 text-white shadow-xl">
        <span className="w-8 h-8 border-3 border-amber-400 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-bold text-slate-300">
          AI is prioritizing today's top 3 civic redressals...
        </span>
      </div>
    );
  }

  const rankBadges = [
    { label: '#1 Highest Urgency', color: 'bg-red-500/90 text-white border-red-400/40' },
    { label: '#2 Critical Safety', color: 'bg-orange-500/90 text-white border-orange-400/40' },
    { label: '#3 Municipal Priority', color: 'bg-amber-500/90 text-white border-amber-400/40' },
  ];

  return (
    <div className="space-y-3 select-none">
      {/* Deck Controls & Progress Indicator */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-1.5">
          {issues.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                if (!isAnimating && idx !== activeIndex) {
                  setAnimDirection(idx > activeIndex ? 'up' : 'down');
                  setIsAnimating(true);
                  setTimeout(() => {
                    setActiveIndex(idx);
                    setIsAnimating(false);
                  }, 420);
                }
              }}
              className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                activeIndex === idx
                  ? 'w-7 bg-amber-400 shadow-xs'
                  : 'w-2 bg-slate-300 dark:bg-slate-700 hover:bg-slate-400'
              }`}
              title={`View Issue ${idx + 1}`}
            />
          ))}
          <span className="text-[10.5px] font-bold text-slate-500 dark:text-slate-400 ml-1">
            {activeIndex + 1} of {total}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium hidden sm:inline">
            Scroll or swipe up
          </span>
          <button
            type="button"
            onClick={prevCard}
            aria-label="Previous card"
            className="w-7 h-7 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-slate-50 active:scale-95 transition-all cursor-pointer"
          >
            <ChevronUp size={15} />
          </button>
          <button
            type="button"
            onClick={nextCard}
            aria-label="Next card"
            className="w-7 h-7 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-slate-50 active:scale-95 transition-all cursor-pointer"
          >
            <ChevronDown size={15} />
          </button>
        </div>
      </div>

      {/* 3D Stacked Container */}
      <div
        ref={containerRef}
        onWheel={handleWheel}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className="relative w-full h-[375px] sm:h-[405px]"
        style={{ perspective: '1200px' }}
      >
        {issues.map((issue, idx) => {
          const relativeIndex = (idx - activeIndex + total) % total;

          // Compute 3D layer transforms
          let transform = '';
          let zIndex = 10;
          let opacity = 0;
          let pointerEvents = 'none';

          if (relativeIndex === 0) {
            // Front Card
            zIndex = 30;
            pointerEvents = 'auto';
            if (isAnimating && animDirection === 'up') {
              // Sliding up and out into the back
              transform = 'translate3d(0, -118%, 40px) rotate(-6deg) scale(0.92)';
              opacity = 0;
            } else if (isAnimating && animDirection === 'down') {
              // Dropping down from above
              transform = 'translate3d(0, 0, 0) scale(1) rotate(0deg)';
              opacity = 1;
            } else {
              transform = 'translate3d(0, 0, 0) scale(1) rotate(0deg)';
              opacity = 1;
            }
          } else if (relativeIndex === 1) {
            // Second Card peeking behind to the right
            zIndex = 20;
            pointerEvents = 'auto';
            if (isAnimating && animDirection === 'up') {
              // Pop up into front
              transform = 'translate3d(0, 0, 0) scale(1) rotate(0deg)';
              opacity = 1;
            } else {
              transform = 'translate3d(14px, 6px, -40px) scale(0.94) rotate(3deg)';
              opacity = 0.92;
            }
          } else if (relativeIndex === 2) {
            // Third Card peeking further behind
            zIndex = 10;
            pointerEvents = 'auto';
            if (isAnimating && animDirection === 'up') {
              // Move to middle slot
              transform = 'translate3d(14px, 6px, -40px) scale(0.94) rotate(3deg)';
              opacity = 0.92;
            } else {
              transform = 'translate3d(26px, 12px, -80px) scale(0.88) rotate(5.5deg)';
              opacity = 0.78;
            }
          }

          const rank = rankBadges[idx] || rankBadges[2];
          const photoUrl =
            issue.imageUrl ||
            FALLBACK_CATEGORY_IMAGES[issue.category] ||
            FALLBACK_CATEGORY_IMAGES['Roads'];

          return (
            <div
              key={issue.id}
              onClick={() => {
                if (relativeIndex === 0) {
                  onSelectIssue(issue);
                } else {
                  // Clicking a background card brings it forward
                  nextCard();
                }
              }}
              style={{
                transform,
                zIndex,
                opacity,
                pointerEvents: pointerEvents as any,
                transition: isAnimating
                  ? 'all 420ms cubic-bezier(0.34, 1.45, 0.64, 1)'
                  : 'all 280ms ease-out',
                willChange: 'transform, opacity',
              }}
              className="absolute inset-0 w-full h-full rounded-[28px] overflow-hidden shadow-2xl border border-white/20 dark:border-slate-800/80 cursor-pointer bg-slate-900 group"
            >
              {/* Full Photographic Backdrop */}
              <img
                src={photoUrl}
                alt={issue.title}
                loading="lazy"
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                onError={(e) => {
                  const fallback =
                    FALLBACK_CATEGORY_IMAGES[issue.category] ||
                    FALLBACK_CATEGORY_IMAGES['Roads'];
                  if ((e.target as HTMLImageElement).src !== fallback) {
                    (e.target as HTMLImageElement).src = fallback;
                  }
                }}
              />

              {/* Seamless Dark Shadow & Contrast Gradients */}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/65 via-55% to-slate-950/20" />
              <div className="absolute inset-0 bg-radial-at-t from-transparent via-transparent to-slate-950/40" />

              {/* Floating Top Floating Action Pills (Reference Match) */}
              <div className="relative z-10 p-3.5 sm:p-4 flex items-center justify-between">
                {/* Left: Urgency Rank Pill */}
                <div
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10.5px] font-black uppercase tracking-wider shadow-md backdrop-blur-md border ${rank.color}`}
                >
                  <Sparkles className="w-3 h-3 text-amber-300" />
                  <span>{rank.label}</span>
                </div>

                {/* Right: Category + Frosted Glass Action Button */}
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/45 backdrop-blur-md border border-white/20 text-white font-bold text-[10.5px] shadow-sm">
                    {getCategoryIcon(issue.category)}
                    <span>{issue.category}</span>
                  </span>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectIssue(issue);
                    }}
                    title="Inspect official inspection docket"
                    className="w-8 h-8 rounded-full bg-white/25 hover:bg-white/40 active:scale-95 text-white flex items-center justify-center backdrop-blur-md border border-white/30 shadow-sm transition-all cursor-pointer"
                  >
                    <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
                  </button>
                </div>
              </div>

              {/* Bottom Card Content Panel */}
              <div className="absolute bottom-0 inset-x-0 z-10 p-4 sm:p-5 flex flex-col justify-end space-y-2">
                {/* Location & Impact Petitions Row */}
                <div className="flex items-center justify-between gap-2 text-white/90">
                  <div className="inline-flex items-center gap-1 text-[11px] font-semibold tracking-wide text-white/85">
                    <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span className="truncate">
                      {issue.reporter?.wardOrArea || 'BBMP Ward 112'}
                    </span>
                  </div>

                  <span className="inline-flex items-center gap-1 text-[10.5px] font-bold text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded-full border border-amber-400/30 shrink-0">
                    <Flame className="w-3 h-3 text-amber-400" />
                    <span>{issue.upvotes || 0} Petitions</span>
                  </span>
                </div>

                {/* Headline: Prominent, legible typography */}
                <h3 className="text-base sm:text-lg font-black text-white leading-tight drop-shadow-md line-clamp-2">
                  {issue.title}
                </h3>

                {/* Issue Description Snippet */}
                {issue.description && (
                  <p className="text-[11.5px] text-white/80 line-clamp-1 leading-snug drop-shadow-xs font-normal">
                    {issue.description}
                  </p>
                )}

                {/* Bottom Action Pill */}
                <div className="pt-1 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectIssue(issue);
                    }}
                    className="flex-1 py-2 px-3.5 rounded-xl bg-white text-[#0f2d59] font-black text-xs hover:bg-[#eff6ff] active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
                  >
                    <span>Inspect Official Docket</span>
                    <ArrowUpRight className="w-3.5 h-3.5 text-[#ea580c] stroke-[2.5]" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Acknowledge Action */}
      {showAcknowledgeButton && onAcknowledge && (
        <div className="flex items-center justify-between pt-1 px-1">
          <span className="text-[10.5px] text-slate-500 dark:text-slate-400">
            Next Dispatch: Tomorrow at 7:00 AM
          </span>
          <button
            type="button"
            onClick={onAcknowledge}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#0f2d59] hover:bg-[#07172c] active:scale-95 text-white font-extrabold text-xs transition-all shadow-xs cursor-pointer border border-[#0f2d59]"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Acknowledge</span>
          </button>
        </div>
      )}
    </div>
  );
};

export interface CityBriefingModalProps {
  isOpen: boolean;
  onClose: () => void;
  showAcknowledgeButton?: boolean;
}

/**
 * Reusable 7:00 AM City Briefing Modal with 3D Flash Card Deck.
 */
export const CityBriefingModal: React.FC<CityBriefingModalProps> = ({
  isOpen,
  onClose,
  showAcknowledgeButton = true,
}) => {
  const { posts, setSelectedPostForDetail, acknowledgeBriefing, isBriefingAcknowledged } = useApp();
  const { top3Issues, isLoadingAi } = useCityBriefingAi(posts);

  if (!isOpen) return null;

  const handleAcknowledge = () => {
    acknowledgeBriefing();
    onClose();
  };

  const handleSelectIssue = (issue: CivicPost) => {
    onClose();
    setSelectedPostForDetail(issue);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 transition-all animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col pb-safe border border-slate-200 dark:border-slate-800"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[#0f2d59] text-white p-4 flex items-center justify-between shrink-0 border-b border-blue-900/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-white/15 flex items-center justify-center border border-amber-400/40 text-amber-300">
              <Sunrise className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm leading-tight">Your 7 AM City Briefing</h3>
              <p className="text-[11px] text-blue-200">BBMP Ward 112 • Priority Redressal Flash Cards</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Modal Body with 3D Flash Card Deck */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 rounded-2xl p-3 flex items-center justify-between">
            <div>
              <p className="text-xs font-black text-amber-950 dark:text-amber-200">
                Top 3 Critical Ward Redressals
              </p>
              <p className="text-[11px] text-amber-800 dark:text-amber-300/90">
                Ranked by AI from active citizen grievance reports
              </p>
            </div>
            <span className="text-[10px] font-black uppercase tracking-wider bg-amber-400 text-slate-950 px-2 py-0.5 rounded-full">
              3D Deck
            </span>
          </div>

          <FlashCardDeck
            issues={top3Issues}
            isLoading={isLoadingAi}
            onSelectIssue={handleSelectIssue}
            onAcknowledge={showAcknowledgeButton ? handleAcknowledge : undefined}
            showAcknowledgeButton={showAcknowledgeButton && !isBriefingAcknowledged}
          />
        </div>
      </div>
    </div>
  );
};

/**
 * HomeScreen Daily Briefing Widget.
 * Features the 3D stacked flash card deck with rounded corners, rich photos, and scroll animations.
 */
export const DailyBriefingCard: React.FC = () => {
  const { posts, setSelectedPostForDetail, acknowledgeBriefing } = useApp();
  const { top3Issues, isLoadingAi } = useCityBriefingAi(posts);

  return (
    <section className="bg-white dark:bg-slate-900/90 rounded-3xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
      {/* Top Banner Header */}
      <div className="flex items-center justify-between mb-3.5">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800/80 flex items-center justify-center text-amber-600 dark:text-amber-400 shadow-xs shrink-0">
            <Sunrise className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-700 dark:text-amber-300 bg-amber-100/80 dark:bg-amber-950/70 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-900/60">
                7:00 AM Dispatch
              </span>
              <span className="text-[10px] text-slate-400 font-semibold">• BBMP Active</span>
            </div>
            <h2 className="text-sm sm:text-base font-black text-slate-900 dark:text-white mt-0.5">
              Priority Redressal of the Day
            </h2>
          </div>
        </div>

        {/* Quick Acknowledge Button */}
        <button
          type="button"
          onClick={acknowledgeBriefing}
          title="Acknowledge briefing and move to Menu"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#0f2d59] hover:bg-[#1d4e8c] active:scale-95 text-white font-extrabold text-xs transition-all shadow-xs cursor-pointer border border-[#0f2d59]"
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          <span>Acknowledge</span>
        </button>
      </div>

      {/* 3D Interactive Flash Card Deck */}
      <FlashCardDeck
        issues={top3Issues}
        isLoading={isLoadingAi}
        onSelectIssue={(issue) => setSelectedPostForDetail(issue)}
        onAcknowledge={acknowledgeBriefing}
        showAcknowledgeButton={true}
      />
    </section>
  );
};
