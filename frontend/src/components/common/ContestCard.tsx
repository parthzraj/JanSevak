import React from 'react';
import { Trophy, Users, Clock } from 'lucide-react';
import type { Contest } from '../../lib/api';

export const timeLeft = (iso: string): string => {
  const ms = new Date(iso).getTime() - Date.now();
  if (ms <= 0) return 'ended';
  const mins = Math.floor(ms / 60000);
  if (mins < 60) return `${Math.max(1, mins)} min left`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 48) return `${hrs} hr left`;
  return `${Math.floor(hrs / 24)} days left`;
};

const CHIP: Record<Contest['status'], string> = {
  live: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  upcoming: 'bg-amber-50 text-amber-800 border-amber-200',
  ended: 'bg-slate-100 text-slate-600 border-slate-200',
};

export const ContestCard: React.FC<{ contest: Contest; onOpen: () => void; extra?: React.ReactNode }> = ({ contest, onOpen, extra }) => {
  const me = contest.my_entry;
  return (
    <div className="bg-white rounded-3xl p-5 border border-[#cbd5e1] shadow-xs space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#0f2d59] bg-[#eff6ff] px-2 py-0.5 rounded-full inline-block mb-1">
            {contest.topic}
          </span>
          <h3 className="text-sm sm:text-base font-bold text-[#0f172a]">{contest.title}</h3>
          <p className="text-[11px] text-[#64748b]">by {contest.ngo_name}</p>
        </div>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${CHIP[contest.status]}`}>
          {contest.status === 'live' ? 'LIVE' : contest.status === 'upcoming' ? 'UPCOMING' : 'ENDED'}
        </span>
      </div>

      {contest.prize && (
        <p className="text-xs text-[#92400e] bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 flex gap-1.5">
          <Trophy className="w-3.5 h-3.5 shrink-0 mt-0.5" /> {contest.prize}
        </p>
      )}

      <div className="flex items-center gap-4 text-[11px] text-[#64748b]">
        <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {contest.participants} played</span>
        <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {contest.status === 'ended' ? 'closed' : timeLeft(contest.ends_at)}</span>
        <span>{contest.question_count} questions</span>
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-[#cbd5e1]">
        <span className="text-[11px] font-semibold text-[#0f2d59]">
          {me?.state === 'submitted'
            ? `You scored ${me.score}/${me.total}${me.rank ? ` · rank #${me.rank}` : ''}`
            : me?.state === 'in_progress'
            ? 'Attempt in progress'
            : ''}
        </span>
        <div className="flex gap-2">
          {extra}
          <button onClick={onOpen} className="px-4 py-2 rounded-xl bg-[#0f2d59] hover:bg-[#1d4e8c] text-white font-bold text-xs">
            {contest.status === 'live' && me && me.state !== 'submitted' ? (me.state === 'in_progress' ? 'Resume' : 'Play') : 'Leaderboard'}
          </button>
        </div>
      </div>
    </div>
  );
};
