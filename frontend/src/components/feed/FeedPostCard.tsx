import React, { useState, useRef } from 'react';
import {
  ThumbsUp,
  MessageCircle,
  Share2,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Camera,
} from 'lucide-react';
import { CivicPost } from '../../types';
import { useApp } from '../../context/AppContext';
import { Avatar } from '../common/Avatar';
import { useProfileLink } from '../../lib/useProfileLink';
import { MapViewModal } from './MapViewModal';

interface FeedPostCardProps {
  post: CivicPost;
}

export const FeedPostCard: React.FC<FeedPostCardProps> = ({ post }) => {
  const {
    toggleUpvote,
    setSelectedPostForDetail,
    setSelectedPostForComments,
    setSelectedPostForShare,
    addToast,
  } = useApp();

  const openProfile = useProfileLink();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showMap, setShowMap] = useState(false);

  const postImages = post.images && post.images.length > 0 ? post.images : [post.imageUrl];
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  const handlePrevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev === 0 ? postImages.length - 1 : prev - 1));
  };

  const handleNextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev === postImages.length - 1 ? 0 : prev + 1));
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (touchStartX.current === null || touchEndX.current === null) return;
    const diff = touchStartX.current - touchEndX.current;
    if (Math.abs(diff) > 40) {
      if (diff > 0) {
        // Swiped left -> next
        setCurrentImageIndex((prev) => (prev === postImages.length - 1 ? 0 : prev + 1));
      } else {
        // Swiped right -> prev
        setCurrentImageIndex((prev) => (prev === 0 ? postImages.length - 1 : prev - 1));
      }
    }
    touchStartX.current = null;
    touchEndX.current = null;
  };

  const getCategoryStyles = (category: string) => {
    switch (category) {
      case 'Roads':
        return 'bg-amber-100/90 text-amber-950 border-amber-300';
      case 'Water':
        return 'bg-blue-100/90 text-blue-950 border-blue-300';
      case 'Sanitation':
        return 'bg-emerald-100/90 text-emerald-950 border-emerald-300';
      case 'Streetlights':
        return 'bg-yellow-100/90 text-yellow-950 border-yellow-300';
      case 'Public Safety':
        return 'bg-rose-100/90 text-rose-950 border-rose-300';
      case 'Parks':
        return 'bg-teal-100/90 text-teal-950 border-teal-300';
      default:
        return 'bg-green-100/90 text-green-950 border-green-300';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Resolved':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-50 text-[#0b6623] border border-emerald-300 shadow-2xs">
            <CheckCircle2 className="w-3 h-3 text-[#0b6623]" /> Redressed
          </span>
        );
      case 'In Progress':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-50 text-[#b45309] border border-amber-300 shadow-2xs">
            <Clock className="w-3 h-3 animate-spin text-[#d97706]" /> In Action
          </span>
        );
      case 'Under Review':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-blue-50 text-[#1d4ed8] border border-blue-300 shadow-2xs">
            <Clock className="w-3 h-3 text-[#1d4ed8]" /> Under Review
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
            Registered
          </span>
        );
    }
  };

  return (
    <article className="bg-white rounded-2xl border border-[#cbd5e1] shadow-[0_2px_10px_rgba(15,23,42,0.04)] overflow-hidden transition-all hover:shadow-[0_4px_16px_rgba(15,23,42,0.08)]">
      {/* Media Carousel Box with Chevrons, Dots, and Photo Counter */}
      <div
        className="relative aspect-[16/10] sm:aspect-video w-full bg-slate-900 overflow-hidden cursor-pointer select-none group"
        onClick={() => setSelectedPostForDetail(post)}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Horizontal Slide Carousel Track */}
        <div
          className="flex h-full w-full transition-transform duration-300 ease-out"
          style={{ transform: `translateX(-${currentImageIndex * 100}%)` }}
        >
          {postImages.map((img, idx) => (
            <div key={idx} className="relative w-full h-full shrink-0 bg-slate-900">
              <img
                src={img}
                alt={`${post.title} - photo ${idx + 1}`}
                className="w-full h-full object-cover"
                loading={idx === 0 ? 'eager' : 'lazy'}
                onError={(e) => {
                  const el = e.target as HTMLElement;
                  el.style.display = 'none';
                  if (el.parentElement) {
                    el.parentElement.style.background = post.imageFallbackGradient;
                  }
                }}
              />
            </div>
          ))}
        </div>

        {/* Gradient Scrims for Top & Bottom Legibility */}
        <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-black/80 via-black/40 to-transparent pointer-events-none" />
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/70 to-transparent pointer-events-none" />

        {/* TOP OVERLAY: User Name on Left, Photo Counter & Location Symbol on Right */}
        <div className="absolute top-3 inset-x-3.5 flex items-center justify-between z-10 pointer-events-none">
          {/* User Name & Avatar ON the Image - Clickable to open profile */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              openProfile(post.reporter.id, post.reporter.name);
            }}
            className="flex items-center gap-2 drop-shadow-md pointer-events-auto cursor-pointer hover:opacity-90 active:scale-95 transition-all group"
            title={`View profile for ${post.reporter.name}`}
          >
            <Avatar src={post.reporter.avatar} name={post.reporter.name} size={32} className="border-2 border-white shadow-sm group-hover:border-amber-300 transition-colors" />
            <div className="flex items-center gap-1">
              <span className="text-xs sm:text-sm font-bold text-white tracking-tight drop-shadow-sm group-hover:underline">
                {post.reporter.name}
              </span>
              {post.reporter.isVerified && (
                <span title="Verified Citizen" className="inline-flex items-center">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#eff6ff] drop-shadow-xs" />
                </span>
              )}
            </div>
          </button>

          {/* RIGHT SIDE: Photo Counter & Location symbol */}
          <div className="flex items-center gap-1.5 pointer-events-auto">
            {postImages.length > 1 && (
              <div
                className="px-2 py-0.5 rounded-full bg-black/50 backdrop-blur-md border border-white/20 text-white text-[10px] font-bold tracking-wider flex items-center gap-1 shadow-sm"
                title={`${currentImageIndex + 1} of ${postImages.length} photos`}
              >
                <Camera className="w-3 h-3 text-white/90" />
                <span>
                  {currentImageIndex + 1}/{postImages.length}
                </span>
              </div>
            )}

            {/* Symbol of Location - icon only, no text */}
            <button
              type="button"
              className="w-8 h-8 rounded-full bg-black/40 backdrop-blur-md border border-white/30 flex items-center justify-center text-white shadow-sm hover:bg-black/60 transition-colors"
              title="View location on map"
              onClick={(e) => {
                e.stopPropagation();
                setShowMap(true);
              }}
            >
              <MapPin className="w-4 h-4 text-white drop-shadow-xs" />
            </button>
          </div>
        </div>

        {/* CHEVRON SLIDE BUTTONS: Left (<) and Right (>) */}
        {postImages.length > 1 && (
          <>
            <button
              type="button"
              onClick={handlePrevImage}
              aria-label="Previous photo"
              className="absolute left-2.5 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-black/55 hover:bg-black/80 active:scale-90 text-white flex items-center justify-center backdrop-blur-md border border-white/25 transition-all shadow-md"
            >
              <ChevronLeft className="w-4 h-4 stroke-[2.6] -translate-x-0.5" />
            </button>
            <button
              type="button"
              onClick={handleNextImage}
              aria-label="Next photo"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-black/55 hover:bg-black/80 active:scale-90 text-white flex items-center justify-center backdrop-blur-md border border-white/25 transition-all shadow-md"
            >
              <ChevronRight className="w-4 h-4 stroke-[2.6] translate-x-0.5" />
            </button>
          </>
        )}

        {/* BOTTOM OVERLAY: Category Badge (Time removed!) and Slide Pagination Dots */}
        <div className="absolute bottom-3 inset-x-3.5 flex items-center justify-between z-10">
          {/* Category Badge only - time removed as requested */}
          <span
            className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border shadow-xs backdrop-blur-md ${getCategoryStyles(
              post.category
            )}`}
          >
            {post.category}
          </span>

          {/* SLIDE PAGINATION DOTS */}
          {postImages.length > 1 && (
            <div
              className="flex items-center gap-1 px-2 py-1 rounded-full bg-black/40 backdrop-blur-md border border-white/10"
              onClick={(e) => e.stopPropagation()}
            >
              {postImages.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentImageIndex(idx);
                  }}
                  className={`transition-all duration-300 rounded-full ${idx === currentImageIndex
                      ? 'w-4 h-1.5 bg-white shadow-xs'
                      : 'w-1.5 h-1.5 bg-white/45 hover:bg-white/80'
                    }`}
                  aria-label={`Go to slide ${idx + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 1. Engagement Row: Upvote, Comment, and Share (Just below the image) */}
      <div className="flex items-center gap-2 px-4 pt-3 pb-1.5">
        {/* Upvote / Endorse Citizen Petition */}
        <button
          onClick={() => toggleUpvote(post.id)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all border cursor-pointer ${post.hasUpvoted
              ? 'bg-[#0f2d59] text-white border-[#0f2d59] shadow-xs'
              : 'bg-white text-[#0f172a] border-[#cbd5e1] hover:bg-[#eff6ff] hover:text-[#0f2d59] hover:border-blue-300'
            }`}
          title="Endorse / Support Grievance"
        >
          <ThumbsUp
            className={`w-3.5 h-3.5 ${post.hasUpvoted ? 'fill-current text-[#fbbf24]' : 'text-[#64748b]'}`}
          />
          <span className="tabular-nums">{post.upvotes}</span>
        </button>

        {/* Comment */}
        <button
          onClick={() => setSelectedPostForComments(post)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white text-[#334155] border border-[#cbd5e1] hover:bg-slate-50 transition-colors cursor-pointer"
          title="Citizen Feedback & Responses"
        >
          <MessageCircle className="w-3.5 h-3.5 text-[#64748b]" />
          <span className="tabular-nums">{post.commentsCount}</span>
        </button>

        {/* Share */}
        <button
          onClick={() => setSelectedPostForShare(post)}
          className="p-2 rounded-xl bg-white text-[#64748b] border border-[#cbd5e1] hover:text-[#0f172a] hover:bg-slate-50 transition-colors cursor-pointer"
          title="Share Grievance"
        >
          <Share2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* 2. Written Headline & Status (Below upvote, comment, and share) */}
      <div className="px-4 pt-1.5 pb-3.5">
        <div className="flex items-start justify-between gap-2">
          <h3
            onClick={() => setSelectedPostForDetail(post)}
            className="text-sm sm:text-base font-extrabold text-[#0f172a] hover:text-[#0f2d59] transition-colors leading-snug cursor-pointer flex-1"
          >
            {post.title}
          </h3>
          <div className="shrink-0">{getStatusBadge(post.status)}</div>
        </div>

        {/* Comment Preview Snippet from other citizens */}
        {post.comments && post.comments.length > 0 && (
          <div
            onClick={() => setSelectedPostForComments(post)}
            className="mt-2.5 p-2 px-2.5 rounded-xl bg-slate-50 border border-slate-200/80 hover:bg-[#eff6ff]/60 hover:border-blue-200 transition-colors flex items-center justify-between gap-2 text-[11px] cursor-pointer"
          >
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="font-bold text-[#0f2d59] truncate shrink-0">
                💬 {post.comments[post.comments.length - 1].author}:
              </span>
              <span className="text-slate-600 truncate">
                "{post.comments[post.comments.length - 1].text}"
              </span>
            </div>
            <span className="text-[10px] font-bold text-[#0f2d59] shrink-0">
              {post.comments.length} comment{post.comments.length > 1 ? 's' : ''} &rarr;
            </span>
          </div>
        )}
      </div>

      {showMap && (
        <MapViewModal
          title={post.title}
          address={post.reporter.wardOrArea}
          latitude={post.latitude}
          longitude={post.longitude}
          onClose={() => setShowMap(false)}
        />
      )}
    </article>
  );
};

