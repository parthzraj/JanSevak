import React, { useState } from 'react';
import { ShieldAlert } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { DailyBriefingCard } from '../components/feed/DailyBriefingCard';
import { FeedPostCard } from '../components/feed/FeedPostCard';
import { prioritizeFeed } from '../lib/api';

export const HomeScreen: React.FC = () => {
  const { user, posts, isBriefingAvailable, isBriefingAcknowledged } = useApp();

  const [criticalSort, setCriticalSort] = useState(false);
  const [sortedPosts, setSortedPosts] = useState<typeof posts | null>(null);
  const [isSorting, setIsSorting] = useState(false);

  const displayPosts = criticalSort && sortedPosts ? sortedPosts : posts;

  const handleCriticalSort = async () => {
    if (criticalSort) {
      setCriticalSort(false);
      setSortedPosts(null);
      return;
    }
    setIsSorting(true);
    try {
      // Build complaint objects from posts
      const complaints = posts.slice(0, 20).map((p) => ({
        id: String(p.id),
        title: p.title,
        description: p.description?.substring(0, 100) || '',
        category: p.category,
      }));

      const data = await prioritizeFeed(complaints);

      // Reorder posts based on ranked_ids
      const idOrder = new Map(data.ranked_ids.map((id: string, idx: number) => [id, idx]));
      const sorted = [...posts].sort((a, b) => {
        const orderA = idOrder.get(String(a.id)) ?? 999;
        const orderB = idOrder.get(String(b.id)) ?? 999;
        return (orderA as number) - (orderB as number);
      });
      setSortedPosts(sorted);
      setCriticalSort(true);
    } catch (err) {
      console.error('Critical sort failed:', err);
    } finally {
      setIsSorting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col px-3.5 sm:px-4 pt-3 space-y-4">
      {/* Official Government Greeting Header */}
      <section className="bg-white rounded-2xl p-3.5 border border-[#cbd5e1] shadow-xs relative overflow-hidden">
        {/* Subtle official tricolor left border stripe */}
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-[#ea580c] via-white to-[#0b6623]" />

        <div className="flex items-center justify-between pl-1">
          <div>
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="text-[9.5px] font-extrabold tracking-wider uppercase text-[#0f2d59] bg-[#eff6ff] px-2 py-0.5 rounded-sm border border-blue-200/80">
                BBMP • Official Citizen Portal
              </span>
            </div>
            <h1 className="text-sm sm:text-base font-extrabold text-[#0f172a] tracking-tight">
              Namaskara, {user.name.split(' ')[0]} 👋
            </h1>
            <p className="text-[11px] text-[#475569] mt-0.5">
              Public Grievance Redressal & Community Action
            </p>
          </div>

          <div className="flex flex-col items-end shrink-0">
            <span className="text-[10.5px] font-extrabold text-[#0f2d59] bg-[#dbeafe] px-2.5 py-1 rounded-lg border border-[#0f2d59]/20 shadow-2xs">
              {user.wardNumber}
            </span>
            <span className="text-[9px] text-[#64748b] font-semibold mt-0.5 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
              Ward Active
            </span>
          </div>
        </div>
      </section>

      {/* 7:00 AM City Briefing Clickable Banner (Vanishes on Acknowledge) */}
      {isBriefingAvailable && !isBriefingAcknowledged && <DailyBriefingCard />}

      {/* AI Critical Sort Toggle */}
      {posts.length > 1 && (
        <div className="flex items-center justify-end">
          <button
            type="button"
            onClick={handleCriticalSort}
            disabled={isSorting}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
              criticalSort
                ? 'bg-red-50 text-red-700 border border-red-200 shadow-xs'
                : 'bg-white text-[#475569] border border-[#cbd5e1] hover:bg-slate-50'
            } disabled:opacity-50`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            {isSorting ? 'Sorting...' : criticalSort ? 'Critical First ✓' : 'Critical First (AI)'}
          </button>
        </div>
      )}

      {/* Main Civic Feed Post Cards */}
      <div id="civic-feed-section" className="space-y-4">
        {displayPosts.map((post) => (
          <FeedPostCard key={post.id} post={post} />
        ))}
      </div>
    </div>
  );
};
