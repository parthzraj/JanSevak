import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  Sparkles,
  Award,
  CheckCircle2,
  MapPin,
  Clock,
  X,
  Send,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export const PositiveImpactScreen: React.FC = () => {
  const navigate = useNavigate();
  const {
    reels,
    toggleReelLike,
    toggleReelSave,
    addReelComment,
    addToast,
    user,
  } = useApp();

  const containerRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [showImpactDrawer, setShowImpactDrawer] = useState(false);
  const [showCommentsDrawer, setShowCommentsDrawer] = useState(false);
  const [reelCommentInput, setReelCommentInput] = useState('');
  const [heartAnimId, setHeartAnimId] = useState<string | null>(null);
  const [showSwipeHint, setShowSwipeHint] = useState(true);

  // Touch tracking for mobile swipe gesture
  const touchStartY = useRef<number | null>(null);
  const touchStartTime = useRef<number>(0);
  const isScrollingRef = useRef<boolean>(false);

  const currentReel = reels[activeIndex] || reels[0];

  // Sync active index with snap-scroll position
  const handleScroll = useCallback(() => {
    if (!containerRef.current) return;
    const { scrollTop, clientHeight } = containerRef.current;
    if (clientHeight > 0) {
      const newIndex = Math.round(scrollTop / clientHeight);
      if (newIndex !== activeIndex && newIndex >= 0 && newIndex < reels.length) {
        setActiveIndex(newIndex);
        setShowSwipeHint(false);
      }
    }
  }, [activeIndex, reels.length]);

  const scrollToReel = useCallback((index: number) => {
    if (!containerRef.current) return;
    const clientHeight = containerRef.current.clientHeight;
    containerRef.current.scrollTo({
      top: index * clientHeight,
      behavior: 'smooth',
    });
    setActiveIndex(index);
    setShowSwipeHint(false);
  }, []);

  const handleNext = () => {
    if (activeIndex < reels.length - 1) {
      scrollToReel(activeIndex + 1);
    } else {
      scrollToReel(0); // loop to first
    }
  };

  const handlePrev = () => {
    if (activeIndex > 0) {
      scrollToReel(activeIndex - 1);
    } else {
      scrollToReel(reels.length - 1);
    }
  };

  // Keyboard Navigation (Arrow Up / Down)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        handleNext();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        handlePrev();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeIndex, reels.length]);

  // Touch Gesture Handling
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
    touchStartTime.current = Date.now();
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartY.current === null) return;
    const touchEndY = e.changedTouches[0].clientY;
    const diffY = touchStartY.current - touchEndY;
    const duration = Date.now() - touchStartTime.current;

    // Fast flick or clear swipe (> 45px or velocity)
    if (Math.abs(diffY) > 45 || (Math.abs(diffY) > 25 && duration < 250)) {
      if (diffY > 0 && activeIndex < reels.length - 1) {
        scrollToReel(activeIndex + 1);
      } else if (diffY < 0 && activeIndex > 0) {
        scrollToReel(activeIndex - 1);
      }
    }
    touchStartY.current = null;
  };

  // Double-tap to Like
  const handleDoubleTap = (reelId: string) => {
    toggleReelLike(reelId);
    setHeartAnimId(reelId);
    setTimeout(() => {
      setHeartAnimId(null);
    }, 850);
  };

  const handleShareReel = (reelTitle: string) => {
    navigator.clipboard?.writeText?.(window.location.href);
    addToast('Reel Link Copied!', `Shared "${reelTitle}" impact with neighbors.`, 'success');
  };

  const handlePostReelComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reelCommentInput.trim()) return;
    addReelComment(currentReel.id, reelCommentInput.trim());
    setReelCommentInput('');
  };

  return (
    <div className="relative w-full h-[calc(100vh-4rem)] max-w-lg mx-auto bg-black text-white overflow-hidden select-none">
      {/* Scroll-Snap Container (YouTube Shorts & Instagram Reels Style) */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className="w-full h-full overflow-y-scroll snap-y snap-mandatory scroll-smooth no-scrollbar"
        style={{ scrollSnapType: 'y mandatory' }}
      >
        {reels.map((reel, index) => {
          const isCurrent = index === activeIndex;
          const isLiked = reel.hasLiked;
          const isSaved = reel.isSaved;

          return (
            <div
              key={reel.id}
              className="relative w-full h-[calc(100vh-4rem)] snap-start snap-always shrink-0 flex flex-col justify-between overflow-hidden"
              onDoubleClick={() => handleDoubleTap(reel.id)}
            >
              {/* Background Media with Gradient Overlay */}
              <div className="absolute inset-0 z-0">
                <img
                  src={reel.mediaUrl}
                  alt={reel.title}
                  className="w-full h-full object-cover"
                  loading={index <= 2 ? 'eager' : 'lazy'}
                  onError={(e) => {
                    const el = e.target as HTMLImageElement;
                    el.src =
                      'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?auto=format&fit=crop&w=1080&q=80';
                  }}
                />

                {/* Vertical Gradient Scrim for perfect text readability */}
                <div className="absolute inset-0 bg-gradient-to-b from-black/75 via-transparent to-black/90 pointer-events-none" />
              </div>

              {/* Heart Pop Animation on Double-Tap */}
              {heartAnimId === reel.id && (
                <div className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none animate-in zoom-in-50 fade-in duration-200">
                  <div className="p-4 bg-rose-600/80 rounded-full shadow-2xl backdrop-blur-xs scale-125 animate-pulse">
                    <Heart className="w-16 h-16 fill-white text-white drop-shadow-lg" />
                  </div>
                </div>
              )}

              {/* Top Navigation Bar: Progress & Before/After */}
              <div className="relative z-10 flex items-center justify-between p-4 pt-3">
                <div className="flex items-center gap-2 bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20 shadow-md">
                  <Sparkles className="w-4 h-4 text-[#ea580c]" />
                  <span className="text-xs font-black text-white tracking-wide">
                    Impact Reels
                  </span>
                  <span className="text-[10px] text-blue-200 font-mono font-bold">
                    {index + 1}/{reels.length}
                  </span>
                </div>

                {reel.beforeAfter && (
                  <button
                    onClick={() => {
                      setActiveIndex(index);
                      setShowImpactDrawer(true);
                    }}
                    className="flex items-center gap-1.5 text-[11px] font-bold bg-[#0f2d59]/85 hover:bg-[#0f2d59] active:scale-95 text-white px-3 py-1.5 rounded-full backdrop-blur-md border border-white/20 transition-all shadow-md cursor-pointer"
                  >
                    <Award className="w-3.5 h-3.5 text-[#fbbf24]" />
                    <span>Before & After</span>
                  </button>
                )}
              </div>

              {/* Bottom Main Content & Social Actions */}
              <div className="relative z-10 p-4 pb-6 flex items-end justify-between gap-3">
                {/* Left Side: Creator, Title, Caption & Impact Badge */}
                <div className="flex-1 min-w-0 pr-2 space-y-2">
                  {/* Creator Info - Clickable to open profile */}
                  <button
                    type="button"
                    onClick={() => navigate('/profile')}
                    className="flex items-center gap-2.5 text-left group cursor-pointer hover:opacity-90 active:scale-95 transition-all"
                    title={`View profile of ${reel.creator.name}`}
                  >
                    <img
                      src={reel.creator.avatar}
                      alt={reel.creator.name}
                      className="w-9 h-9 rounded-full object-cover border-2 border-white shadow-md shrink-0 group-hover:border-amber-300 transition-colors"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-white truncate leading-tight group-hover:underline">
                          {reel.creator.name}
                        </span>
                        <span className="text-[9px] bg-white/20 px-1.5 py-0.5 rounded text-white font-semibold">
                          {reel.creator.role}
                        </span>
                      </div>
                      <span className="text-[10px] text-white/80 flex items-center gap-1 mt-0.5 truncate">
                        <MapPin className="w-3 h-3 text-[#ea580c] shrink-0" />
                        {reel.locality}
                      </span>
                    </div>
                  </button>

                  {/* Reel Title & Caption */}
                  <div>
                    <h2 className="text-sm sm:text-base font-extrabold text-white leading-snug drop-shadow-md">
                      {reel.title}
                    </h2>
                    <p className="text-xs text-white/90 leading-relaxed mt-1 line-clamp-3 drop-shadow-sm font-normal">
                      {reel.caption}
                    </p>
                  </div>

                  {/* Verified Impact Pill */}
                  <div className="flex items-center gap-2 flex-wrap pt-0.5">
                    <div className="flex items-center gap-1.5 bg-[#0f2d59]/90 text-white text-[11px] font-bold px-2.5 py-1 rounded-xl backdrop-blur-md border border-white/20">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>{reel.impactStat}</span>
                    </div>

                    {reel.daysToResolve && (
                      <span className="text-[10px] text-white/90 bg-black/50 px-2 py-1 rounded-xl backdrop-blur-xs font-medium border border-white/10">
                        {reel.daysToResolve}
                      </span>
                    )}
                  </div>
                </div>

                {/* Right Side: Engagement Action Buttons */}
                <div className="flex flex-col items-center gap-3.5 shrink-0">
                  {/* Like Button */}
                  <button
                    onClick={() => toggleReelLike(reel.id)}
                    className="flex flex-col items-center gap-1 group cursor-pointer"
                    aria-label="Like reel"
                  >
                    <div
                      className={`w-11 h-11 rounded-full flex items-center justify-center transition-all active:scale-90 ${
                        isLiked
                          ? 'bg-rose-600 text-white scale-110 shadow-lg shadow-rose-600/40'
                          : 'bg-black/50 text-white backdrop-blur-md border border-white/20 hover:bg-black/70'
                      }`}
                    >
                      <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
                    </div>
                    <span className="text-[11px] font-bold text-white drop-shadow-md tabular-nums">
                      {reel.likes}
                    </span>
                  </button>

                  {/* Comment Button */}
                  <button
                    onClick={() => {
                      setActiveIndex(index);
                      setShowCommentsDrawer(true);
                    }}
                    className="flex flex-col items-center gap-1 group cursor-pointer"
                    aria-label="View comments"
                  >
                    <div className="w-11 h-11 rounded-full bg-black/50 text-white backdrop-blur-md border border-white/20 flex items-center justify-center hover:bg-black/70 active:scale-95 transition-all">
                      <MessageCircle className="w-5 h-5" />
                    </div>
                    <span className="text-[11px] font-bold text-white drop-shadow-md tabular-nums">
                      {reel.commentsCount}
                    </span>
                  </button>

                  {/* Share Button */}
                  <button
                    onClick={() => handleShareReel(reel.title)}
                    className="flex flex-col items-center gap-1 group cursor-pointer"
                    aria-label="Share reel"
                  >
                    <div className="w-11 h-11 rounded-full bg-black/50 text-white backdrop-blur-md border border-white/20 flex items-center justify-center hover:bg-black/70 active:scale-95 transition-all">
                      <Share2 className="w-5 h-5" />
                    </div>
                    <span className="text-[11px] font-bold text-white drop-shadow-md tabular-nums">
                      {reel.shares}
                    </span>
                  </button>

                  {/* Bookmark Button */}
                  <button
                    onClick={() => toggleReelSave(reel.id)}
                    className="flex flex-col items-center gap-1 group cursor-pointer"
                    aria-label="Bookmark reel"
                  >
                    <div
                      className={`w-11 h-11 rounded-full flex items-center justify-center transition-all active:scale-95 ${
                        isSaved
                          ? 'bg-[#0f2d59] text-white border border-[#1d4e8c]'
                          : 'bg-black/50 text-white backdrop-blur-md border border-white/20 hover:bg-black/70'
                      }`}
                    >
                      <Bookmark className={`w-5 h-5 ${isSaved ? 'fill-current' : ''}`} />
                    </div>
                  </button>

                  {/* Before/After Detail Trigger */}
                  <button
                    onClick={() => {
                      setActiveIndex(index);
                      setShowImpactDrawer(true);
                    }}
                    className="w-11 h-11 rounded-full bg-[#ea580c] hover:bg-orange-600 active:scale-95 text-white flex items-center justify-center font-bold shadow-lg shadow-orange-950/40 transition-all cursor-pointer"
                    title="See Impact Breakdown"
                  >
                    <Award className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Swipe Up Tip Indicator (Fades after first scroll) */}
      {showSwipeHint && (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-20 pointer-events-none animate-bounce">
          <div className="bg-black/70 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/20 text-white text-[11px] font-bold flex items-center gap-1.5 shadow-xl">
            <span>Swipe up for next reel</span>
            <span>👆</span>
          </div>
        </div>
      )}

      {/* BEFORE & AFTER IMPACT BREAKDOWN DRAWER */}
      {showImpactDrawer && (
        <div
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-end justify-center p-0 animate-in fade-in"
          onClick={() => setShowImpactDrawer(false)}
        >
          <div
            className="w-full max-w-lg bg-white rounded-t-3xl p-5 text-[#0f172a] space-y-4 max-h-[82vh] overflow-y-auto animate-in slide-in-from-bottom pb-safe"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-1.5 bg-[#cbd5e1] rounded-full mx-auto" />
            <div className="flex items-center justify-between pb-2 border-b border-[#cbd5e1]">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-[#0f2d59]" />
                <h3 className="text-base font-extrabold text-[#0f172a]">
                  Civic Transformation Story
                </h3>
              </div>
              <button
                onClick={() => setShowImpactDrawer(false)}
                className="p-1.5 rounded-full text-[#64748b] hover:text-[#0f172a] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <h4 className="text-sm font-bold text-[#0f2d59]">
                {currentReel.title}
              </h4>
              <p className="text-xs text-[#64748b] leading-relaxed">
                {currentReel.caption}
              </p>

              {currentReel.beforeAfter && (
                <div className="grid grid-cols-2 gap-2.5 pt-1">
                  <div className="p-3 bg-red-50 border border-red-200 rounded-2xl">
                    <span className="text-[10px] font-bold text-red-700 uppercase tracking-wider block">
                      Before Transformation
                    </span>
                    <p className="text-xs font-semibold text-red-900 mt-1">
                      {currentReel.beforeAfter.beforeLabel}
                    </p>
                  </div>
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl">
                    <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">
                      After Civic Action
                    </span>
                    <p className="text-xs font-semibold text-emerald-900 mt-1">
                      {currentReel.beforeAfter.afterLabel}
                    </p>
                  </div>
                </div>
              )}

              <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-2xl text-xs text-[#0f2d59] flex items-center justify-between">
                <span className="font-bold">Verified Community Impact</span>
                <span className="font-extrabold text-[#0f2d59]">{currentReel.impactStat}</span>
              </div>
            </div>

            <button
              onClick={() => {
                toggleReelLike(currentReel.id);
                setShowImpactDrawer(false);
              }}
              className="w-full py-3 bg-[#0f2d59] hover:bg-[#1d4e8c] text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
            >
              Celebrate This Win (+5 Pts)
            </button>
          </div>
        </div>
      )}

      {/* REEL COMMENTS DRAWER */}
      {showCommentsDrawer && (
        <div
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-end justify-center p-0 animate-in fade-in"
          onClick={() => setShowCommentsDrawer(false)}
        >
          <div
            className="w-full max-w-lg bg-white rounded-t-3xl p-5 text-[#0f172a] flex flex-col max-h-[75vh] animate-in slide-in-from-bottom pb-safe"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-1.5 bg-[#cbd5e1] rounded-full mx-auto mb-2" />
            <div className="flex items-center justify-between pb-2 border-b border-[#cbd5e1]">
              <h3 className="text-sm font-bold text-[#0f172a]">
                Story Reactions ({currentReel.commentsCount})
              </h3>
              <button
                onClick={() => setShowCommentsDrawer(false)}
                className="p-1 rounded-full text-[#64748b] hover:text-[#0f172a] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-3 space-y-2.5">
              {currentReel.comments.map((c) => (
                <div key={c.id} className="p-2.5 bg-[#f8fafc] rounded-xl text-xs">
                  <div className="flex items-center justify-between mb-0.5">
                    <button
                      type="button"
                      onClick={() => {
                        setShowCommentsDrawer(false);
                        navigate('/profile');
                      }}
                      className="font-bold text-[#0f172a] hover:underline cursor-pointer text-left"
                      title={`View profile for ${c.author}`}
                    >
                      {c.author}
                    </button>
                    <span className="text-[10px] text-[#64748b]">{c.time}</span>
                  </div>
                  <p className="text-slate-800">{c.text}</p>
                </div>
              ))}
            </div>

            <form onSubmit={handlePostReelComment} className="flex gap-2 pt-2 border-t border-[#cbd5e1]">
              <input
                type="text"
                value={reelCommentInput}
                onChange={(e) => setReelCommentInput(e.target.value)}
                placeholder="Share your appreciation..."
                className="flex-1 text-xs bg-[#f8fafc] border border-[#cbd5e1] rounded-xl px-3 py-2 text-[#0f172a] focus:outline-none focus:border-[#0f2d59]"
              />
              <button
                type="submit"
                disabled={!reelCommentInput.trim()}
                className="p-2.5 bg-[#0f2d59] text-white rounded-xl disabled:opacity-40 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
