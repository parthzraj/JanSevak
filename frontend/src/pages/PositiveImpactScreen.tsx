import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Bookmark, CheckCircle2, Clock, Heart, MapPin, MessageCircle, Share2, Sparkles, BarChart3, Users } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { getReel, getReels, recordReelShare, setReelLike, setReelSave } from '../lib/reelsApi';
import { reelFallbackImage, toReel } from '../lib/mappers';
import { useProfileLink } from '../lib/useProfileLink';
import { Avatar } from '../components/common/Avatar';
import type { ReelStory } from '../types';
import { BeforeAfterSlider } from '../components/impact/BeforeAfterSlider';
import { ReelShareSheet, type ShareChannel } from '../components/impact/ReelShareSheet';
import { ReelCommentsSheet } from '../components/impact/ReelCommentsSheet';
import { ImpactStatsSheet } from '../components/impact/ImpactStatsSheet';
import { ReelImpactAuditSheet } from '../components/impact/ReelImpactAuditSheet';

type Tab = 'all' | 'high_impact' | 'saved';
const SWIPE_PX = 60;

export const PositiveImpactScreen: React.FC = () => {
  const { addToast } = useApp();
  const openProfile = useProfileLink();
  const [params] = useSearchParams();
  const sharedId = params.get('story');

  const [tab, setTab] = useState<Tab>('all');
  const [reels, setReels] = useState<ReelStory[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [index, setIndex] = useState(0);
  const [dragY, setDragY] = useState(0);
  const [animating, setAnimating] = useState(false);
  const [heartId, setHeartId] = useState<string | null>(null);
  const [panel, setPanel] = useState<null | 'comments' | 'share' | 'stats' | 'impact_audit'>(null);
  const [brokenImages, setBrokenImages] = useState<Set<string>>(new Set());

  const boxRef = useRef<HTMLDivElement>(null);
  const start = useRef<{ x: number; y: number; t: number } | null>(null);
  const axis = useRef<'v' | 'h' | null>(null);
  const wheelLock = useRef(0);
  const busy = useRef<Set<string>>(new Set());

  const load = useCallback(async () => {
    setStatus('loading');
    try {
      let list = (await getReels(1, tab === 'saved', 30)).items.map(toReel);
      if (tab === 'high_impact') {
        list = list.filter((r) => (r.impactScore ?? 80) >= 75 || r.impactTier === 'Transformational');
      }
      // A shared link opens that story first, even if it is not on the first page.
      if (tab === 'all' && sharedId && !list.some((r) => r.id === sharedId)) {
        try {
          list.unshift(toReel(await getReel(sharedId)));
        } catch {
          /* story removed: just show the feed */
        }
      } else if (tab === 'all' && sharedId) {
        list.sort((a, b) => (a.id === sharedId ? -1 : b.id === sharedId ? 1 : 0));
      }
      setReels(list);
      setIndex(0);
      setStatus('ready');
    } catch {
      setStatus('error');
    }
  }, [tab, sharedId]);

  useEffect(() => {
    load();
  }, [load]);

  const current = reels[index];
  const patch = (id: string, change: Partial<ReelStory>) =>
    setReels((prev) => prev.map((r) => (r.id === id ? { ...r, ...change } : r)));

  const go = useCallback(
    (to: number) => {
      if (to < 0 || to >= reels.length || to === index) return;
      setAnimating(true);
      setDragY(0);
      setIndex(to);
      window.setTimeout(() => setAnimating(false), 320);
    },
    [index, reels.length]
  );

  // ---- swipe (touch / mouse / pen): the page follows the finger, then snaps to the next or previous reel
  const onPointerDown = (e: React.PointerEvent) => {
    if (panel) return;
    start.current = { x: e.clientX, y: e.clientY, t: Date.now() };
    axis.current = null;
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const s = start.current;
    if (!s) return;
    const dx = e.clientX - s.x;
    const dy = e.clientY - s.y;
    if (!axis.current && Math.max(Math.abs(dx), Math.abs(dy)) > 8) {
      axis.current = Math.abs(dy) > Math.abs(dx) ? 'v' : 'h';
      // Once it is a vertical swipe, keep receiving the gesture even if the finger / cursor ends up over
      // another element (for example the chat button). Capturing only now keeps plain taps working.
      if (axis.current === 'v') {
        try {
          boxRef.current?.setPointerCapture(e.pointerId);
        } catch {
          /* pointer already gone */
        }
      }
    }
    if (axis.current !== 'v') return;
    // resist at the ends instead of dragging into empty space
    const atEdge = (dy > 0 && index === 0) || (dy < 0 && index === reels.length - 1);
    setDragY(atEdge ? dy / 4 : dy);
  };
  const onPointerUp = (e: React.PointerEvent) => {
    const s = start.current;
    start.current = null;
    if (!s || axis.current !== 'v') {
      setDragY(0);
      return;
    }
    const dy = e.clientY - s.y;
    const fast = Date.now() - s.t < 250 && Math.abs(dy) > 25;
    setAnimating(true);
    if ((Math.abs(dy) > SWIPE_PX || fast) && dy < 0) go(index + 1);
    else if ((Math.abs(dy) > SWIPE_PX || fast) && dy > 0) go(index - 1);
    else setDragY(0);
    window.setTimeout(() => setAnimating(false), 320);
  };

  // mouse wheel / trackpad and arrow keys for desktop
  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (panel || Math.abs(e.deltaY) < 12) return;
      e.preventDefault();
      const now = Date.now();
      if (now - wheelLock.current < 450) return;
      wheelLock.current = now;
      go(index + (e.deltaY > 0 ? 1 : -1));
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [go, index, panel]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (panel || (e.target instanceof HTMLElement && ['INPUT', 'TEXTAREA'].includes(e.target.tagName))) return;
      if (e.key === 'ArrowDown') go(index + 1);
      if (e.key === 'ArrowUp') go(index - 1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [go, index, panel]);

  // ---- live actions (optimistic, rolled back if the server says no)
  const toggleLike = async (reel: ReelStory) => {
    const key = `like-${reel.id}`;
    if (busy.current.has(key)) return;
    busy.current.add(key);
    const next = !reel.hasLiked;
    patch(reel.id, { hasLiked: next, likes: Math.max(0, reel.likes + (next ? 1 : -1)) });
    try {
      const res = await setReelLike(reel.id, next);
      patch(reel.id, { hasLiked: res.has_liked, likes: res.likes });
    } catch {
      patch(reel.id, { hasLiked: reel.hasLiked, likes: reel.likes });
      addToast('Could not update your like', 'Check your connection and try again.', 'info');
    } finally {
      busy.current.delete(key);
    }
  };

  const toggleSave = async (reel: ReelStory) => {
    const key = `save-${reel.id}`;
    if (busy.current.has(key)) return;
    busy.current.add(key);
    const next = !reel.isSaved;
    patch(reel.id, { isSaved: next });
    try {
      const res = await setReelSave(reel.id, next);
      patch(reel.id, { isSaved: res.is_saved });
      addToast(next ? 'Story saved' : 'Removed from saved', next ? 'Find it under the Saved tab.' : undefined, 'info');
    } catch {
      patch(reel.id, { isSaved: reel.isSaved });
      addToast('Could not save this story', 'Check your connection and try again.', 'info');
    } finally {
      busy.current.delete(key);
    }
  };

  const doubleTapLike = (reel: ReelStory) => {
    if (!reel.hasLiked) toggleLike(reel);
    setHeartId(reel.id);
    window.setTimeout(() => setHeartId(null), 800);
  };

  const onShared = async (channel: ShareChannel) => {
    if (!current) return;
    if (channel === 'copy') addToast('Link copied', 'Paste it anywhere to share this story.', 'success');
    setPanel(null);
    try {
      const res = await recordReelShare(current.id, channel);
      patch(current.id, { shares: res.shares });
    } catch {
      /* the share itself worked; only the counter missed */
    }
  };

  const mediaFor = (r: ReelStory) => r.afterImage || r.beforeImage || reelFallbackImage(r.category);
  const imgFailed = (url: string) => setBrokenImages((prev) => new Set(prev).add(url));
  const safe = (url: string, r: ReelStory) => (brokenImages.has(url) ? reelFallbackImage(r.category) : url);

  const shareUrl = current ? `${window.location.origin}/positive-impact?story=${current.id}` : '';
  const shareText = current
    ? `Fixed in ${current.daysToResolve} day${current.daysToResolve === 1 ? '' : 's'}: "${current.title}" (${current.locality}) on JanSevak.`
    : '';

  const Tabs = (
    <div className="absolute top-0 inset-x-0 z-20 flex items-center justify-between p-3 pointer-events-none">
      <div className="flex items-center gap-1 bg-black/60 backdrop-blur-md rounded-full p-1 border border-white/20 pointer-events-auto shadow-lg">
        {([
          { id: 'all', label: 'Impact Reels' },
          { id: 'high_impact', label: '✨ High Impact' },
          { id: 'saved', label: 'Saved' },
        ] as { id: Tab; label: string }[]).map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-3 py-1 rounded-full text-[11px] font-extrabold cursor-pointer transition-colors ${
              tab === t.id ? 'bg-white text-[#0f2d59] shadow-xs' : 'text-white/85 hover:text-white'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <button
        onClick={() => setPanel('stats')}
        aria-label="See impact numbers"
        className="pointer-events-auto flex items-center gap-1.5 text-[11px] font-bold bg-[#0f2d59]/85 text-white px-3 py-1.5 rounded-full backdrop-blur-md border border-white/20 cursor-pointer"
      >
        <BarChart3 className="w-3.5 h-3.5 text-[#fbbf24]" />
        Impact
      </button>
    </div>
  );

  const Empty = (title: string, body: string, action?: React.ReactNode) => (
    <div className="h-full flex flex-col items-center justify-center text-center px-8 gap-3">
      <Sparkles className="w-10 h-10 text-[#ea580c]" />
      <h2 className="text-base font-extrabold">{title}</h2>
      <p className="text-xs text-white/70 max-w-xs">{body}</p>
      {action}
    </div>
  );

  return (
    <div
      ref={boxRef}
      className="relative w-full h-[calc(100vh-4rem)] max-w-lg mx-auto bg-black text-white overflow-hidden select-none"
      style={{ touchAction: 'pan-x' }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      {Tabs}

      {status === 'loading' && Empty('Loading stories…', 'Fetching resolved issues from your community.')}
      {status === 'error' &&
        Empty(
          'Could not load stories',
          'The server did not respond.',
          <button onClick={load} className="px-4 py-2 rounded-full bg-white text-[#0f2d59] text-xs font-bold cursor-pointer">
            Try again
          </button>
        )}
      {status === 'ready' && reels.length === 0 &&
        (tab === 'saved'
          ? Empty('Nothing saved yet', 'Tap the bookmark on any story to keep it here.')
          : Empty('No stories yet', 'When officials resolve a reported issue, its before and after story shows up here.'))}

      {status === 'ready' && reels.length > 0 && (
        <div
          className="absolute inset-0"
          style={{
            transform: `translateY(calc(${-index * 100}% + ${dragY}px))`,
            transition: animating ? 'transform 300ms cubic-bezier(0.22, 0.8, 0.3, 1)' : 'none',
          }}
        >
          {reels.map((reel, i) => {
            if (Math.abs(i - index) > 1) return null; // only the neighbours are mounted
            const both = reel.beforeImage && reel.afterImage;
            return (
              <div
                key={reel.id}
                className="absolute inset-x-0 h-full overflow-hidden"
                style={{ top: `${i * 100}%` }}
                onDoubleClick={() => doubleTapLike(reel)}
              >
                <div className="absolute inset-0">
                  {both ? (
                    <BeforeAfterSlider
                      before={safe(reel.beforeImage!, reel)}
                      after={safe(reel.afterImage!, reel)}
                      alt={reel.title}
                      onFail={() => {
                        imgFailed(reel.beforeImage!);
                        imgFailed(reel.afterImage!);
                      }}
                    />
                  ) : (
                    <img
                      src={safe(mediaFor(reel), reel)}
                      alt={reel.title}
                      className="w-full h-full object-cover"
                      draggable={false}
                      onError={() => imgFailed(mediaFor(reel))}
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-transparent to-black/90 pointer-events-none" />
                </div>

                {heartId === reel.id && (
                  <div className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none animate-in zoom-in-50 fade-in duration-200">
                    <Heart className="w-24 h-24 fill-rose-500 text-rose-500 drop-shadow-2xl" />
                  </div>
                )}

                <div className="absolute top-16 left-3 z-10 flex items-center gap-1.5 flex-wrap pointer-events-auto">
                  {!both && (
                    <span className="text-[10px] font-bold bg-black/55 text-white/90 px-2.5 py-1 rounded-full backdrop-blur-xs border border-white/10">
                      {reel.afterImage ? 'After photo' : reel.beforeImage ? 'Reported photo' : 'Illustration'}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => setPanel('impact_audit')}
                    className="flex items-center gap-1 text-[10px] font-extrabold bg-emerald-600/90 hover:bg-emerald-600 text-white px-2.5 py-1 rounded-full backdrop-blur-md border border-white/20 shadow-md cursor-pointer transition-transform active:scale-95"
                  >
                    <Sparkles className="w-3 h-3 text-amber-200" />
                    <span>AI {reel.impactTier || 'Verified'} ({reel.impactScore || 85} pts)</span>
                  </button>
                </div>

                <div className="absolute inset-x-0 bottom-0 z-10 p-4 pb-5 flex items-end justify-between gap-3 pointer-events-none">
                  <div className="flex-1 min-w-0 space-y-2 pointer-events-auto">
                    <button
                      type="button"
                      onClick={() => openProfile(reel.creator.id, reel.creator.name)}
                      className="flex items-center gap-2.5 text-left cursor-pointer"
                    >
                      <Avatar src={reel.creator.avatar} name={reel.creator.name} size={36} />
                      <div className="min-w-0">
                        <span className="block text-xs font-bold truncate">{reel.creator.name}</span>
                        <span className="text-[10px] text-white/80 flex items-center gap-1 truncate">
                          <MapPin className="w-3 h-3 text-[#ea580c] shrink-0" />
                          {reel.locality}
                        </span>
                      </div>
                    </button>
                    <div>
                      <h2 className="text-sm sm:text-base font-extrabold leading-snug drop-shadow">{reel.title}</h2>
                      <p className="text-xs text-white/90 mt-1 line-clamp-2 drop-shadow-sm">
                        {reel.resolutionNote || reel.caption}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="flex items-center gap-1.5 bg-[#0f2d59]/90 text-[11px] font-bold px-2.5 py-1 rounded-xl border border-white/20">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        Resolved in {reel.daysToResolve} day{reel.daysToResolve === 1 ? '' : 's'}
                      </span>
                      <button
                        type="button"
                        onClick={() => setPanel('impact_audit')}
                        className="flex items-center gap-1 text-[10px] font-bold bg-emerald-500/25 hover:bg-emerald-500/40 text-emerald-300 px-2.5 py-1 rounded-xl border border-emerald-400/30 cursor-pointer transition-colors"
                      >
                        <Sparkles className="w-3 h-3 text-amber-300" />
                        AI Audit • {reel.impactTier || 'Verified'}
                      </button>
                      <span className="flex items-center gap-1 text-[10px] bg-black/50 px-2 py-1 rounded-xl border border-white/10">
                        <Users className="w-3 h-3" />
                        {reel.supporters} citizen{reel.supporters === 1 ? '' : 's'} backed it
                      </span>
                      <span className="flex items-center gap-1 text-[10px] bg-black/50 px-2 py-1 rounded-xl border border-white/10">
                        <Clock className="w-3 h-3" />
                        {new Date(reel.resolvedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col items-center gap-3.5 shrink-0 pointer-events-auto mb-[88px]">
                    <ActionButton label="Like" active={reel.hasLiked} activeClass="bg-rose-600" count={reel.likes} onClick={() => toggleLike(reel)}>
                      <Heart className={`w-5 h-5 ${reel.hasLiked ? 'fill-current' : ''}`} />
                    </ActionButton>
                    <ActionButton label="Comments" count={reel.commentsCount} onClick={() => setPanel('comments')}>
                      <MessageCircle className="w-5 h-5" />
                    </ActionButton>
                    <ActionButton label="Share" count={reel.shares} onClick={() => setPanel('share')}>
                      <Share2 className="w-5 h-5" />
                    </ActionButton>
                    <ActionButton label="Save" active={reel.isSaved} activeClass="bg-[#0f2d59]" onClick={() => toggleSave(reel)}>
                      <Bookmark className={`w-5 h-5 ${reel.isSaved ? 'fill-current' : ''}`} />
                    </ActionButton>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {status === 'ready' && reels.length > 1 && (
        <div className="absolute right-1.5 top-1/2 -translate-y-1/2 z-20 flex flex-col gap-1 pointer-events-none">
          {reels.slice(0, 12).map((r, i) => (
            <span key={r.id} className={`w-1 rounded-full transition-all ${i === index ? 'h-5 bg-white' : 'h-1.5 bg-white/40'}`} />
          ))}
        </div>
      )}

      {panel === 'comments' && current && (
        <ReelCommentsSheet
          issueId={current.id}
          title={current.title}
          onCount={(n) => patch(current.id, { commentsCount: n })}
          onClose={() => setPanel(null)}
          onOpenProfile={(id, name) => {
            setPanel(null);
            openProfile(id, name);
          }}
        />
      )}
      {panel === 'share' && current && (
        <ReelShareSheet title={current.title} url={shareUrl} text={shareText} onShared={onShared} onClose={() => setPanel(null)} />
      )}
      {panel === 'stats' && <ImpactStatsSheet onClose={() => setPanel(null)} />}
      {panel === 'impact_audit' && current && (
        <ReelImpactAuditSheet reel={current} onClose={() => setPanel(null)} />
      )}
    </div>
  );
};

const ActionButton: React.FC<{
  label: string;
  count?: number;
  active?: boolean;
  activeClass?: string;
  onClick: () => void;
  children: React.ReactNode;
}> = ({ label, count, active, activeClass = '', onClick, children }) => (
  <button onClick={onClick} aria-label={label} className="flex flex-col items-center gap-1 cursor-pointer">
    <span
      className={`w-11 h-11 rounded-full flex items-center justify-center transition-all active:scale-90 text-white ${
        active ? `${activeClass} shadow-lg` : 'bg-black/50 backdrop-blur-md border border-white/20'
      }`}
    >
      {children}
    </span>
    {count !== undefined && <span className="text-[11px] font-bold tabular-nums drop-shadow">{count}</span>}
  </button>
);
