import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  X,
  TrendingUp,
  Clock,
  Sparkles,
  ChevronRight,
  ThumbsUp,
  MessageCircle,
  Image as ImageIcon,
  PlaySquare,
  Layers,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { CivicCategory, CivicPost, ReelStory } from '../types';
import { fetchIssues } from '../lib/api';
import { getReels } from '../lib/reelsApi';
import { reelFallbackImage, toCivicPost, toReel } from '../lib/mappers';

const RECENT_KEY = 'jansevak_recent_searches';
const loadRecent = (): string[] => {
  try {
    const v = JSON.parse(localStorage.getItem(RECENT_KEY) || '[]');
    return Array.isArray(v) ? v.filter((x) => typeof x === 'string').slice(0, 6) : [];
  } catch {
    return [];
  }
};
const saveRecent = (list: string[]) => {
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify(list));
  } catch {
    /* storage unavailable: the list only lives for this visit */
  }
};

interface ExploreGridItem {
  id: string;
  type: 'photo' | 'multi_photo' | 'reel';
  thumbnail: string;
  title: string;
  upvotes: number;
  commentsCount: number;
  category: CivicCategory;
  isSpan2?: boolean;
  postRef?: CivicPost;
  reelRef?: ReelStory;
}

type Filter = 'All' | 'Reels' | 'Photos' | 'Issues' | 'Resolved';

export const SearchScreen: React.FC = () => {
  const navigate = useNavigate();
  const { setSelectedPostForDetail } = useApp();

  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');
  const [category, setCategory] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<Filter>('All');
  const [recentSearches, setRecentSearches] = useState<string[]>(loadRecent);

  // Live data: every tile comes from the server
  const [reels, setReels] = useState<ReelStory[]>([]);
  const [issues, setIssues] = useState<CivicPost[]>([]);
  const [trendBase, setTrendBase] = useState<CivicPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const requestId = useRef(0);

  useEffect(() => {
    getReels(1, false, 30)
      .then((r) => setReels(r.items.map(toReel)))
      .catch(() => setReels([]));
    fetchIssues({ page_size: 100, sort: 'recent' })
      .then((r) => setTrendBase(r.items.map(toCivicPost)))
      .catch(() => setTrendBase([]));
  }, []);

  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(query.trim()), 300);
    return () => window.clearTimeout(t);
  }, [query]);

  const wantsResolved = activeFilter === 'Resolved';
  useEffect(() => {
    const id = ++requestId.current;
    setLoading(true);
    setLoadError('');
    fetchIssues({
      page_size: 60,
      sort: 'recent',
      q: debounced || undefined,
      category: category || undefined,
      status: wantsResolved ? 'Resolved' : undefined,
    })
      .then((r) => {
        if (id === requestId.current) setIssues(r.items.map(toCivicPost));
      })
      .catch((e: Error) => {
        if (id === requestId.current) {
          setIssues([]);
          setLoadError(e.message || 'Could not load results.');
        }
      })
      .finally(() => {
        if (id === requestId.current) setLoading(false);
      });
  }, [debounced, category, wantsResolved]);

  // Trending = the categories people are reporting and supporting most, from real reports
  const trendingTopics = useMemo(() => {
    const by = new Map<string, { reports: number; supporters: number }>();
    trendBase.forEach((p) => {
      const cur = by.get(p.category) || { reports: 0, supporters: 0 };
      cur.reports += 1;
      cur.supporters += p.upvotes;
      by.set(p.category, cur);
    });
    return [...by.entries()]
      .map(([cat, v]) => ({ category: cat, ...v, score: v.reports + v.supporters }))
      .sort((x, y) => y.score - x.score)
      .slice(0, 5);
  }, [trendBase]);

  const remember = useCallback((term: string) => {
    const t = term.trim();
    if (t.length < 2) return;
    setRecentSearches((prev) => {
      const next = [t, ...prev.filter((x) => x.toLowerCase() !== t.toLowerCase())].slice(0, 6);
      saveRecent(next);
      return next;
    });
  }, []);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  // Build the complete Instagram Explore Grid items
  const exploreGridItems = useMemo(() => {
    const items: ExploreGridItem[] = [];

    // Add Posts / Photos
    issues.forEach((post) => {
      const isMulti = Boolean(post.images && post.images.length > 1);
      items.push({
        id: `post-${post.id}`,
        type: isMulti ? 'multi_photo' : 'photo',
        thumbnail: post.imageUrl || (post.images && post.images[0]) || '',
        title: post.title,
        upvotes: post.upvotes,
        commentsCount: post.commentsCount,
        category: post.category,
        postRef: post,
      });

      // If post has additional secondary photos, also include them as explore tiles
      if (post.images && post.images.length > 1) {
        post.images.slice(1).forEach((extraImg, idx) => {
          items.push({
            id: `post-${post.id}-sub-${idx}`,
            type: 'photo',
            thumbnail: extraImg,
            title: `${post.title} (Photo ${idx + 2})`,
            upvotes: post.upvotes,
            commentsCount: post.commentsCount,
            category: post.category,
            postRef: post,
          });
        });
      }
    });

    // Interleave Reels
    reels.forEach((reel) => {
      items.push({
        id: `reel-${reel.id}`,
        type: 'reel',
        thumbnail: reel.afterImage || reel.beforeImage || reelFallbackImage(reel.category),
        title: reel.title,
        upvotes: reel.likes,
        commentsCount: reel.commentsCount,
        category: reel.category,
        reelRef: reel,
      });
    });

    // Assign Instagram Explore Mosaic pattern:
    // In every group of 5 items, give 1 reel or video a row-span-2 tall card
    return items.map((item, index) => {
      const isReelOrVideo = item.type === 'reel';
      // Mark specific items as tall 2-row tiles (index % 6 === 0 or index % 6 === 4)
      const isSpan2 = isReelOrVideo && (index % 5 === 0 || index % 5 === 2);
      return {
        ...item,
        isSpan2,
      };
    });
  }, [issues, reels]);

  // Posts are already filtered by the server (text, category, resolved). Reels are filtered here.
  const filteredGridItems = useMemo(() => {
    let result = exploreGridItems;
    const q = debounced.toLowerCase();

    result = result.filter((i) => {
      if (i.type !== 'reel') return true;
      if (category && i.category !== category) return false;
      if (wantsResolved) return true; // every reel is a resolved issue
      if (!q) return true;
      const r = i.reelRef;
      return `${i.title} ${i.category} ${r?.caption || ''} ${r?.locality || ''}`.toLowerCase().includes(q);
    });

    if (activeFilter === 'Reels') result = result.filter((i) => i.type === 'reel');
    else if (activeFilter === 'Photos') result = result.filter((i) => i.type === 'photo' || i.type === 'multi_photo');
    else if (activeFilter === 'Issues') result = result.filter((i) => i.postRef && i.postRef.status !== 'Resolved');
    else if (activeFilter === 'Resolved') result = result.filter((i) => i.type === 'reel' || i.postRef?.status === 'Resolved');
    return result;
  }, [exploreGridItems, activeFilter, debounced, category, wantsResolved]);

  const handleTileClick = (item: ExploreGridItem) => {
    if (query.trim()) remember(query);
    if (item.type === 'reel') {
      navigate(item.reelRef ? `/positive-impact?story=${item.reelRef.id}` : '/positive-impact');
    } else if (item.postRef) {
      setSelectedPostForDetail(item.postRef);
    }
  };

  const handleSelectRecent = (term: string) => {
    setQuery(term);
    setDebounced(term);
    scrollToTop();
  };

  const handleSelectTrending = (cat: string) => {
    setCategory(cat);
    setActiveFilter('All');
    scrollToTop();
  };

  const handleClearQuery = () => {
    setQuery('');
    setDebounced('');
  };

  const clearAll = () => {
    handleClearQuery();
    setCategory(null);
    setActiveFilter('All');
  };

  return (
    <div className="flex-1 flex flex-col pt-2.5 pb-10 space-y-2.5">
      {/* 1. Instagram-Style Search Input Bar */}
      <div className="px-3 sm:px-4">
        <div className="relative flex items-center">
          <Search className="absolute left-3.5 w-4 h-4 text-[#64748b]" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && remember(query)}
            onBlur={() => remember(query)}
            enterKeyHint="search"
            placeholder="Search reports, places, reels..."
            className="w-full text-xs sm:text-[13px] bg-white border border-[#cbd5e1] rounded-2xl pl-10 pr-10 py-2.5 text-[#0f172a] focus:outline-none focus:border-[#0f2d59] focus:ring-1 focus:ring-[#0f2d59] shadow-xs transition-all placeholder:text-[#98A59E]"
          />
          {query && (
            <button
              onClick={handleClearQuery}
              className="absolute right-3 p-1 rounded-full text-[#64748b] hover:text-[#0f172a] hover:bg-[#f8fafc]"
              aria-label="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* 2. Horizontal Filter Chips (All, Reels, Photos, Issues, Resolved) */}
      <div className="px-3 sm:px-4">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar select-none">
          {/* All */}
          <button
            onClick={() => setActiveFilter('All')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap shrink-0 transition-all border ${activeFilter === 'All'
                ? 'bg-[#0f2d59] text-white border-[#0f2d59] shadow-xs'
                : 'bg-white text-[#64748b] border-[#cbd5e1] hover:border-[#0f2d59]/30 hover:text-[#0f172a]'
              }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>All</span>
          </button>

          {/* Reels */}
          <button
            onClick={() => setActiveFilter('Reels')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap shrink-0 transition-all border ${activeFilter === 'Reels'
                ? 'bg-[#0f2d59] text-white border-[#0f2d59] shadow-xs'
                : 'bg-white text-[#64748b] border-[#cbd5e1] hover:border-[#0f2d59]/30 hover:text-[#0f172a]'
              }`}
          >
            <PlaySquare className="w-3.5 h-3.5 text-rose-500" />
            <span>Reels</span>
          </button>

          {/* Photos */}
          <button
            onClick={() => setActiveFilter('Photos')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap shrink-0 transition-all border ${activeFilter === 'Photos'
                ? 'bg-[#0f2d59] text-white border-[#0f2d59] shadow-xs'
                : 'bg-white text-[#64748b] border-[#cbd5e1] hover:border-[#0f2d59]/30 hover:text-[#0f172a]'
              }`}
          >
            <ImageIcon className="w-3.5 h-3.5 text-[#1d4e8c]" />
            <span>Photos</span>
          </button>

          {/* Issues */}
          <button
            onClick={() => setActiveFilter('Issues')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap shrink-0 transition-all border ${activeFilter === 'Issues'
                ? 'bg-[#0f2d59] text-white border-[#0f2d59] shadow-xs'
                : 'bg-white text-[#64748b] border-[#cbd5e1] hover:border-[#0f2d59]/30 hover:text-[#0f172a]'
              }`}
          >
            <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
            <span>Issues</span>
          </button>

          {/* Resolved */}
          <button
            onClick={() => setActiveFilter('Resolved')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap shrink-0 transition-all border ${activeFilter === 'Resolved'
                ? 'bg-[#0f2d59] text-white border-[#0f2d59] shadow-xs'
                : 'bg-white text-[#64748b] border-[#cbd5e1] hover:border-[#0f2d59]/30 hover:text-[#0f172a]'
              }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-[#1d4e8c]" />
            <span>Resolved</span>
          </button>
        </div>
      </div>

      {/* Active search / category and live result count */}
      {(debounced || category) && (
        <div className="px-3 sm:px-4 flex items-center justify-between gap-2 text-xs text-[#64748b]" data-testid="result-line">
          <span className="flex items-center gap-1.5 min-w-0 flex-wrap">
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
            <span>
              {loading ? 'Searching' : <>Found <strong>{filteredGridItems.length}</strong> result{filteredGridItems.length === 1 ? '' : 's'}</>}
              {debounced ? <> for &ldquo;{debounced}&rdquo;</> : null}
            </span>
            {category && (
              <button
                onClick={() => setCategory(null)}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#0f2d59] text-white text-[10px] font-bold cursor-pointer"
                aria-label={`Remove ${category} filter`}
              >
                {category} <X className="w-3 h-3" />
              </button>
            )}
          </span>
          <button onClick={clearAll} className="text-[#0f2d59] font-semibold hover:underline shrink-0 cursor-pointer">
            Clear
          </button>
        </div>
      )}

      {/* 3. INSTAGRAM EXPLORE MOSAIC GRID */}
      <div className="w-full">
        {filteredGridItems.length === 0 ? (
          <div className="mx-3 sm:mx-4 p-8 text-center bg-white rounded-3xl border border-[#cbd5e1] space-y-2 mt-2">
            <Search className="w-8 h-8 text-[#98A59E] mx-auto" />
            <p className="text-xs font-bold text-[#0f172a]">
              {loading ? 'Searching…' : loadError ? 'Could not load results' : debounced || category ? 'No reports match' : 'Nothing here yet'}
            </p>
            <p className="text-[11px] text-[#64748b]">
              {loadError
                ? loadError
                : debounced || category
                  ? 'Try a different word, or clear the search.'
                  : 'Reports and impact stories from your community will show up here.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-3 grid-flow-dense gap-1 sm:gap-1.5 auto-rows-[122px] sm:auto-rows-[150px]">
            {filteredGridItems.map((item) => (
              <div
                key={item.id}
                onClick={() => handleTileClick(item)}
                className={`group relative overflow-hidden bg-[#cbd5e1] cursor-pointer select-none transition-all ${item.isSpan2 && activeFilter === 'All'
                    ? 'row-span-2 col-span-1'
                    : 'row-span-1 col-span-1'
                  }`}
              >
                {/* Media Image / Video Thumbnail */}
                <img
                  src={item.thumbnail}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  onError={(e) => {
                    // Fallback to placeholder color
                    (e.target as HTMLElement).style.backgroundColor = '#0f2d59';
                  }}
                />

                {/* Top-Right Badge (Instagram Style) */}
                <div className="absolute top-1.5 right-1.5 z-10 pointer-events-none drop-shadow-md">
                  {item.type === 'reel' && (
                    <div className="bg-black/55 backdrop-blur-xs text-white p-1 rounded-md flex items-center justify-center">
                      <PlaySquare className="w-3.5 h-3.5" />
                    </div>
                  )}

                  {item.type === 'multi_photo' && (
                    <div className="bg-black/55 backdrop-blur-xs text-white p-1 rounded-md flex items-center justify-center">
                      <Layers className="w-3.5 h-3.5" />
                    </div>
                  )}
                </div>

                {/* Bottom Category Tag (Subtle) */}
                <div className="absolute bottom-1 left-1.5 z-10 pointer-events-none drop-shadow-sm">
                  <span className="text-[9px] font-bold text-white/90 bg-black/45 backdrop-blur-xs px-1.5 py-0.5 rounded uppercase tracking-wider">
                    {item.category}
                  </span>
                </div>

                {/* Hover / Tap Overlay (Classic Instagram Stats) */}
                <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-4 text-white z-20">
                  <div className="flex items-center gap-1 font-bold text-xs sm:text-sm drop-shadow-sm">
                    <ThumbsUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-current" />
                    <span>{item.upvotes}</span>
                  </div>

                  <div className="flex items-center gap-1 font-bold text-xs sm:text-sm drop-shadow-sm">
                    <MessageCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-current" />
                    <span>{item.commentsCount}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 4. Trending & Recent Searches Below Grid */}
      <div className="px-3 sm:px-4 space-y-3.5 pt-3">
        {/* Recent Searches */}
        {recentSearches.length > 0 && (
          <div className="bg-white rounded-2xl p-3.5 border border-[#cbd5e1] shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-[#0f172a] flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#64748b]" />
                Recent Searches
              </span>
              <button
                onClick={() => {
                  setRecentSearches([]);
                  saveRecent([]);
                }}
                className="text-[10px] text-[#64748b] hover:text-[#0f172a]"
              >
                Clear
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {recentSearches.map((term) => (
                <button
                  key={term}
                  onClick={() => handleSelectRecent(term)}
                  className="px-2.5 py-1 rounded-full bg-[#f8fafc] text-[11px] font-medium text-[#0f172a] hover:bg-[#eff6ff] hover:text-[#0f2d59] border border-[#cbd5e1] transition-colors"
                >
                  {term}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Trending: categories people are reporting and supporting most right now (live) */}
        {trendingTopics.length > 0 && (
          <div className="bg-white rounded-2xl p-3.5 border border-[#cbd5e1] shadow-xs" data-testid="trending">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-xs font-bold text-[#0f172a] flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-[#0f2d59]" />
                Trending on JanSevak
              </span>
              <span className="text-[10px] text-[#0f2d59] font-bold">Live from reports</span>
            </div>

            <div className="space-y-1.5">
              {trendingTopics.map((topic, idx) => (
                <button
                  key={topic.category}
                  onClick={() => handleSelectTrending(topic.category)}
                  className="w-full text-left p-2 rounded-xl hover:bg-[#f8fafc] border border-transparent hover:border-[#cbd5e1] transition-all flex items-center justify-between group cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-xs font-bold text-[#64748b] tabular-nums">{idx + 1}</span>
                    <div>
                      <p className="text-xs font-bold text-[#0f172a] group-hover:text-[#0f2d59] transition-colors">#{topic.category.replace(/\s+/g, '')}</p>
                      <span className="text-[10px] text-[#64748b]">
                        {topic.reports} report{topic.reports === 1 ? '' : 's'} · {topic.supporters} supporter{topic.supporters === 1 ? '' : 's'}
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-[#64748b] group-hover:text-[#0f2d59] group-hover:translate-x-0.5 transition-all" />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
