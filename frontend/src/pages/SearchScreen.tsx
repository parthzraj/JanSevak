import React, { useState, useMemo } from 'react';
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
  Video,
  PlaySquare,
  Play,
  Layers,
  Film,
  CheckCircle2,
  AlertCircle,
  Share2,
  Volume2,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { CivicCategory, CivicPost, ReelStory } from '../types';

interface CivicVideo {
  id: string;
  title: string;
  duration: string;
  thumbnail: string;
  reporter: {
    name: string;
    avatar: string;
  };
  views: string;
  likes: number;
  commentsCount: number;
  locality: string;
  category: CivicCategory;
  postId?: string;
  description: string;
}

const CIVIC_VIDEOS: CivicVideo[] = [
  {
    id: 'vid-1',
    title: 'BWSSB Pipeline Pressure Valve Burst on 80ft Road Footage',
    duration: '0:42',
    thumbnail: 'https://images.unsplash.com/photo-1541888946425-d0fbb186156f?auto=format&fit=crop&w=800&q=80',
    reporter: {
      name: 'Kavita Sundaram',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=256&q=80',
    },
    views: '1.8k views',
    likes: 124,
    commentsCount: 9,
    locality: 'HAL 2nd Stage · Ward 113',
    category: 'Water',
    postId: 'post-2',
    description: 'Caught on video: Water flowing onto pedestrian pavement. Excavation team requested.',
  },
  {
    id: 'vid-2',
    title: 'Overnight Asphalt Paver in Action on 100ft Road',
    duration: '0:58',
    thumbnail: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?auto=format&fit=crop&w=800&q=80',
    reporter: {
      name: 'Harish Babu',
      avatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=256&q=80',
    },
    views: '3.1k views',
    likes: 167,
    commentsCount: 12,
    locality: 'Double Road · Ward 113',
    category: 'Roads',
    postId: 'post-9',
    description: 'Time-lapse video of rapid night-crew resurfacing after heavy community upvotes.',
  },
  {
    id: 'vid-3',
    title: 'Illegal Commercial Dumping Caught at Night Behind Bus Stand',
    duration: '1:15',
    thumbnail: 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?auto=format&fit=crop&w=800&q=80',
    reporter: {
      name: 'Sunil Chhetri',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=256&q=80',
    },
    views: '2.4k views',
    likes: 95,
    commentsCount: 8,
    locality: 'Cambridge Layout · Ward 111',
    category: 'Sanitation',
    postId: 'post-8',
    description: 'Evidence footage of repeated nighttime commercial disposal into storm drains.',
  },
  {
    id: 'vid-4',
    title: 'Live Transformer Sparking Danger Near School Route',
    duration: '0:34',
    thumbnail: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
    reporter: {
      name: 'Nalini Chandran',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=256&q=80',
    },
    views: '940 views',
    likes: 188,
    commentsCount: 16,
    locality: 'Domlur Layout · Ward 114',
    category: 'Public Safety',
    postId: 'post-5',
    description: 'Urgent video showing live unlatched high voltage box right beside the school sidewalk.',
  },
];

interface ExploreGridItem {
  id: string;
  type: 'photo' | 'multi_photo' | 'reel' | 'video';
  thumbnail: string;
  title: string;
  upvotes: number;
  commentsCount: number;
  category: CivicCategory;
  isSpan2?: boolean;
  duration?: string;
  postRef?: CivicPost;
  reelRef?: ReelStory;
  videoRef?: CivicVideo;
}

export const SearchScreen: React.FC = () => {
  const navigate = useNavigate();
  const { posts, reels, setSelectedPostForDetail, addToast } = useApp();

  const [query, setQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'All' | 'Reels' | 'Photos' | 'Videos' | 'Issues' | 'Resolved'>('All');
  const [selectedVideo, setSelectedVideo] = useState<CivicVideo | null>(null);

  const [recentSearches, setRecentSearches] = useState<string[]>([
    '100ft road potholes',
    'Water leakage HAL',
    'Defense Colony park',
    'Streetlight repair',
  ]);

  const trendingTopics = [
    { tag: '#CleanIndiranagar', count: '142 reports', category: 'Sanitation' },
    { tag: '#Ward112Potholes', count: '89 upvotes', category: 'Roads' },
    { tag: '#CauveryWaterAlert', count: '64 updates', category: 'Water' },
    { tag: '#PedestrianSafety12thMain', count: '310 votes', category: 'Community' },
    { tag: '#SolarLightsDefenseColony', count: 'Resolved', category: 'Streetlights' },
  ];

  // Build the complete Instagram Explore Grid items
  const exploreGridItems = useMemo(() => {
    const items: ExploreGridItem[] = [];

    // Add Posts / Photos
    posts.forEach((post) => {
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
        thumbnail: reel.mediaUrl,
        title: reel.title,
        upvotes: reel.likes,
        commentsCount: reel.commentsCount,
        category: reel.category,
        reelRef: reel,
      });
    });

    // Interleave Videos
    CIVIC_VIDEOS.forEach((vid) => {
      items.push({
        id: `vid-${vid.id}`,
        type: 'video',
        thumbnail: vid.thumbnail,
        title: vid.title,
        upvotes: vid.likes,
        commentsCount: vid.commentsCount,
        category: vid.category,
        duration: vid.duration,
        videoRef: vid,
      });
    });

    // Assign Instagram Explore Mosaic pattern:
    // In every group of 5 items, give 1 reel or video a row-span-2 tall card
    return items.map((item, index) => {
      const isReelOrVideo = item.type === 'reel' || item.type === 'video';
      // Mark specific items as tall 2-row tiles (index % 6 === 0 or index % 6 === 4)
      const isSpan2 = isReelOrVideo && (index % 5 === 0 || index % 5 === 2);
      return {
        ...item,
        isSpan2,
      };
    });
  }, [posts, reels]);

  // Filter items based on activeFilter and query
  const filteredGridItems = useMemo(() => {
    let result = exploreGridItems;

    // Filter by category / media type
    if (activeFilter === 'Reels') {
      result = result.filter((i) => i.type === 'reel');
    } else if (activeFilter === 'Photos') {
      result = result.filter((i) => i.type === 'photo' || i.type === 'multi_photo');
    } else if (activeFilter === 'Videos') {
      result = result.filter((i) => i.type === 'video');
    } else if (activeFilter === 'Issues') {
      result = result.filter((i) => i.postRef && i.postRef.status !== 'Resolved');
    } else if (activeFilter === 'Resolved') {
      result = result.filter((i) => i.postRef && i.postRef.status === 'Resolved');
    }

    // Filter by search query
    if (query.trim()) {
      const q = query.toLowerCase().trim();
      result = result.filter((item) => {
        const text = `${item.title} ${item.category} ${item.postRef?.description || ''} ${item.reelRef?.caption || ''} ${item.videoRef?.description || ''}`.toLowerCase();
        return text.includes(q);
      });
    }

    return result;
  }, [exploreGridItems, activeFilter, query]);

  const handleTileClick = (item: ExploreGridItem) => {
    if (item.type === 'reel') {
      navigate('/positive-impact');
    } else if (item.type === 'video' && item.videoRef) {
      setSelectedVideo(item.videoRef);
    } else if (item.postRef) {
      setSelectedPostForDetail(item.postRef);
    }
  };

  const handleSelectRecent = (term: string) => {
    setQuery(term);
  };

  const handleSelectTrending = (tag: string) => {
    const clean = tag.replace('#', '').toLowerCase();
    setQuery(clean);
  };

  const handleClearQuery = () => {
    setQuery('');
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
            placeholder="Search photos, videos, reels, localities..."
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

      {/* 2. Horizontal Filter Chips (All, Reels, Photos, Videos, Issues, Resolved) */}
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

          {/* Videos */}
          <button
            onClick={() => setActiveFilter('Videos')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap shrink-0 transition-all border ${activeFilter === 'Videos'
                ? 'bg-[#0f2d59] text-white border-[#0f2d59] shadow-xs'
                : 'bg-white text-[#64748b] border-[#cbd5e1] hover:border-[#0f2d59]/30 hover:text-[#0f172a]'
              }`}
          >
            <Video className="w-3.5 h-3.5 text-blue-600" />
            <span>Videos</span>
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

      {/* Query Active Result Count */}
      {query && (
        <div className="px-3 sm:px-4 flex items-center justify-between text-xs text-[#64748b]">
          <span>
            Found <strong>{filteredGridItems.length}</strong> results for &ldquo;{query}&rdquo;
          </span>
          <button
            onClick={handleClearQuery}
            className="text-[#0f2d59] font-semibold hover:underline"
          >
            Clear
          </button>
        </div>
      )}

      {/* 3. INSTAGRAM EXPLORE MOSAIC GRID */}
      <div className="w-full">
        {filteredGridItems.length === 0 ? (
          <div className="mx-3 sm:mx-4 p-8 text-center bg-white rounded-3xl border border-[#cbd5e1] space-y-2 mt-2">
            <Search className="w-8 h-8 text-[#98A59E] mx-auto" />
            <p className="text-xs font-bold text-[#0f172a]">No media found</p>
            <p className="text-[11px] text-[#64748b]">
              Try searching for &quot;water&quot;, &quot;road&quot;, &quot;sanitation&quot;, or clear filters.
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

                  {item.type === 'video' && (
                    <div className="bg-black/65 backdrop-blur-xs text-white px-1.5 py-0.5 rounded-md flex items-center gap-1 text-[9px] font-bold">
                      <Video className="w-3 h-3 text-white" />
                      {item.duration && <span>{item.duration}</span>}
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
                onClick={() => setRecentSearches([])}
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

        {/* Trending Community Topics */}
        <div className="bg-white rounded-2xl p-3.5 border border-[#cbd5e1] shadow-xs">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-xs font-bold text-[#0f172a] flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-[#0f2d59]" />
              Trending Around Ward 112
            </span>
            <span className="text-[10px] text-[#0f2d59] font-bold">Live Pulse</span>
          </div>

          <div className="space-y-1.5">
            {trendingTopics.map((topic, idx) => (
              <button
                key={topic.tag}
                onClick={() => handleSelectTrending(topic.tag)}
                className="w-full text-left p-2 rounded-xl hover:bg-[#f8fafc] border border-transparent hover:border-[#cbd5e1] transition-all flex items-center justify-between group"
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-xs font-bold text-[#64748b] tabular-nums">
                    {idx + 1}
                  </span>
                  <div>
                    <p className="text-xs font-bold text-[#0f172a] group-hover:text-[#0f2d59] transition-colors">
                      {topic.tag}
                    </p>
                    <span className="text-[10px] text-[#64748b]">
                      {topic.category} · {topic.count}
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-[#64748b] group-hover:text-[#0f2d59] group-hover:translate-x-0.5 transition-all" />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Interactive Video Player Modal */}
      {selectedVideo && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setSelectedVideo(null)}
        >
          <div
            className="w-full max-w-md bg-[#0f172a] rounded-3xl overflow-hidden shadow-2xl border border-white/15 text-white flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Video Player Display */}
            <div className="relative aspect-video bg-black flex items-center justify-center overflow-hidden">
              <img
                src={selectedVideo.thumbnail}
                alt={selectedVideo.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                <div className="w-14 h-14 rounded-full bg-[#0f2d59] text-white flex items-center justify-center shadow-lg animate-pulse">
                  <Play className="w-6 h-6 fill-current ml-1" />
                </div>
              </div>

              {/* Top controls */}
              <button
                onClick={() => setSelectedVideo(null)}
                className="absolute top-3 right-3 p-1.5 rounded-full bg-black/60 text-white hover:bg-black/90 transition-colors"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>

              <span className="absolute bottom-3 left-3 bg-black/60 px-2 py-0.5 rounded text-[10px] font-bold text-white flex items-center gap-1">
                <Volume2 className="w-3 h-3 text-emerald-400" /> Live Audio
              </span>
              <span className="absolute bottom-3 right-3 bg-black/60 px-2 py-0.5 rounded text-[10px] font-bold text-white">
                {selectedVideo.duration}
              </span>
            </div>

            {/* Video Details */}
            <div className="p-4 space-y-3">
              <button
                type="button"
                onClick={() => {
                  setSelectedVideo(null);
                  navigate('/profile');
                }}
                className="flex items-center gap-2 text-left cursor-pointer hover:opacity-85 transition-opacity"
                title={`View profile for ${selectedVideo.reporter.name}`}
              >
                <img
                  src={selectedVideo.reporter.avatar}
                  alt={selectedVideo.reporter.name}
                  className="w-8 h-8 rounded-full object-cover border border-white/20"
                />
                <div>
                  <span className="text-xs font-bold block hover:underline">{selectedVideo.reporter.name}</span>
                  <span className="text-[10px] text-gray-400">{selectedVideo.locality}</span>
                </div>
              </button>

              <h3 className="text-sm font-bold leading-snug">{selectedVideo.title}</h3>
              <p className="text-xs text-gray-300 leading-relaxed">{selectedVideo.description}</p>

              <div className="flex items-center justify-between pt-2 border-t border-white/10 text-xs text-gray-300">
                <span className="text-emerald-400 font-bold">{selectedVideo.views}</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      addToast('Video Upvoted!', 'Thank you for endorsing community evidence.', 'success');
                    }}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white font-semibold transition-colors"
                  >
                    <ThumbsUp className="w-3.5 h-3.5" />
                    <span>{selectedVideo.likes}</span>
                  </button>
                  <button
                    onClick={() => {
                      navigator.clipboard?.writeText?.(window.location.href);
                      addToast('Video link copied!', undefined, 'info');
                    }}
                    className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                    title="Share video"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
