import React, { useCallback, useEffect, useState } from 'react';
import { Calendar, Link2, Loader2, MapPin, Plus, Users } from 'lucide-react';
import { fetchCampaigns, type Campaign } from '../../lib/api';
import { CampaignForm } from './CampaignForm';
import { CampaignSheet } from './CampaignSheet';
import { OrganiserChip, StatusBadge, formatWhen } from './shared';

const STATUSES = ['All', 'Upcoming', 'Ongoing', 'Awaiting wrap-up', 'Completed', 'Cancelled'] as const;
const WHO = [
  { key: '', label: 'Everyone' },
  { key: 'ngo', label: 'NGOs' },
  { key: 'citizen', label: 'Citizens' },
];

interface Props {
  /** NGO page: only the drives I organise */
  onlyMine?: boolean;
  initialOpenId?: number | null;
}

export const CampaignBoard: React.FC<Props> = ({ onlyMine = false, initialOpenId = null }) => {
  const [status, setStatus] = useState<(typeof STATUSES)[number]>('All');
  const [who, setWho] = useState('');
  const [mine, setMine] = useState(onlyMine);
  const [items, setItems] = useState<Campaign[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [creating, setCreating] = useState(false);
  const [openId, setOpenId] = useState<number | null>(initialOpenId);

  const load = useCallback(() => {
    setFailed(false);
    return fetchCampaigns({
      status: status === 'All' ? undefined : status,
      organiser_type: who || undefined,
      mine,
      page_size: 50,
    })
      .then((r) => setItems(r.items))
      .catch(() => {
        setItems([]);
        setFailed(true);
      });
  }, [status, who, mine]);

  useEffect(() => {
    setItems(null);
    load();
  }, [load]);

  const opened = items?.find((c) => c.id === openId) ?? null;

  const chip = (active: boolean) =>
    `shrink-0 text-[11px] font-bold px-3 py-1.5 rounded-full border cursor-pointer ${
      active ? 'bg-[#0f2d59] text-white border-[#0f2d59]' : 'bg-white text-[#334155] border-[#cbd5e1]'
    }`;

  return (
    <div className="space-y-3">
      <button
        onClick={() => setCreating(true)}
        className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-700 to-teal-800 text-white text-xs font-extrabold flex items-center justify-center gap-2 shadow-md cursor-pointer"
      >
        <Plus className="w-4 h-4" /> Start a civic drive
      </button>

      <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-0.5" role="tablist" aria-label="Filter by status">
        {STATUSES.map((s) => (
          <button key={s} role="tab" aria-selected={status === s} onClick={() => setStatus(s)} className={chip(status === s)}>
            {s}
          </button>
        ))}
      </div>
      <div className="flex gap-1.5 items-center overflow-x-auto no-scrollbar">
        {WHO.map((w) => (
          <button key={w.key} onClick={() => setWho(w.key)} className={chip(who === w.key)}>
            {w.label}
          </button>
        ))}
        {!onlyMine && (
          <button onClick={() => setMine((m) => !m)} aria-pressed={mine} className={`${chip(mine)} ml-auto`}>
            My drives
          </button>
        )}
      </div>

      {items === null && <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-[#64748b]" /></div>}
      {failed && <p className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl p-3">Could not load drives. Is the Core API running?</p>}
      {items?.length === 0 && !failed && (
        <p className="text-xs text-[#64748b] text-center py-8">
          No drives here yet. {mine ? 'Drives you organise or join will show up here.' : 'Be the first to start one.'}
        </p>
      )}

      {items?.map((c) => (
        <article
          key={c.id}
          onClick={() => setOpenId(c.id)}
          className="bg-white rounded-3xl border border-[#cbd5e1] p-4 space-y-2.5 cursor-pointer hover:border-[#0f2d59]/40 transition-colors"
        >
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-sm font-extrabold text-[#0f172a] leading-snug">{c.title}</h3>
            <StatusBadge status={c.status} />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#f1f5f9] text-[#334155]">{c.kind}</span>
            <OrganiserChip person={c.organiser} type={c.organiser_type} />
            {c.my_status && (
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-600 text-white">
                {c.my_status === 'Joined' ? 'You joined' : c.my_status === 'Attended' ? 'You attended' : 'No-show'}
              </span>
            )}
            {c.is_organiser && <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-[#0f2d59] text-white">You organise</span>}
          </div>
          <div className="space-y-1 text-[11px] text-[#475569]">
            <div className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" />{formatWhen(c.starts_at)}</div>
            {c.address && <div className="flex items-center gap-1.5 truncate"><MapPin className="w-3.5 h-3.5 shrink-0" />{c.address}</div>}
            {c.issue && <div className="flex items-center gap-1.5 truncate"><Link2 className="w-3.5 h-3.5 shrink-0" />For: {c.issue.title}</div>}
          </div>
          <div className="flex items-center gap-2.5">
            <Users className="w-3.5 h-3.5 text-[#64748b]" />
            <div className="flex-1 h-2 rounded-full bg-[#e2e8f0] overflow-hidden">
              <div className="h-full bg-emerald-600" style={{ width: `${Math.min(100, (c.volunteers_joined / c.volunteers_needed) * 100)}%` }} />
            </div>
            <span className="text-[11px] font-bold text-[#334155] tabular-nums">{c.volunteers_joined}/{c.volunteers_needed}</span>
            <span className="text-[10px] font-extrabold text-amber-700">+{c.points_per_volunteer} pts</span>
          </div>
        </article>
      ))}

      {creating && (
        <CampaignForm
          onClose={() => setCreating(false)}
          onCreated={(c) => {
            setCreating(false);
            setStatus('All');
            setWho('');
            setOpenId(c.id);
            load(); // the filters may be unchanged, in which case the effect below will not re-run
          }}
        />
      )}
      {opened && <CampaignSheet campaign={opened} onClose={() => setOpenId(null)} onChanged={load} />}
    </div>
  );
};
