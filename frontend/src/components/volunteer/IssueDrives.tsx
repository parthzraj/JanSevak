import React, { useEffect, useState } from 'react';
import { HandHeart, Plus } from 'lucide-react';
import { fetchCampaigns, type Campaign } from '../../lib/api';
import { CampaignForm } from './CampaignForm';
import { StatusBadge, formatWhen } from './shared';

interface Props {
  issueId: number;
  title: string;
  category: string;
  address?: string;
  onOpenDrive: (campaignId: number) => void;
}

/** On a report: the civic drives already organised for it, and a button to start one. */
export const IssueDrives: React.FC<Props> = ({ issueId, title, category, address, onOpenDrive }) => {
  const [drives, setDrives] = useState<Campaign[]>([]);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    let live = true;
    fetchCampaigns({ issue_id: issueId, page_size: 5 })
      .then((r) => live && setDrives(r.items))
      .catch(() => live && setDrives([]));
    return () => {
      live = false;
    };
  }, [issueId]);

  return (
    <section className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-3.5 space-y-2.5">
      <div className="flex items-center gap-2">
        <HandHeart className="w-4 h-4 text-emerald-700" />
        <h3 className="text-xs font-extrabold text-[#0f172a] flex-1">Civic drives for this issue ({drives.length})</h3>
        <button
          type="button"
          onClick={() => setCreating(true)}
          className="flex items-center gap-1 text-[11px] font-bold bg-emerald-700 text-white px-3 py-1.5 rounded-full cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" /> Start a drive
        </button>
      </div>
      {drives.length === 0 ? (
        <p className="text-[11px] text-[#475569]">Nobody has organised a drive for this yet. Rally your neighbours and earn points for it.</p>
      ) : (
        drives.map((d) => (
          <button
            type="button"
            key={d.id}
            onClick={() => onOpenDrive(d.id)}
            className="w-full text-left bg-white rounded-xl border border-[#e2e8f0] p-2.5 flex items-center gap-2 cursor-pointer"
          >
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold text-[#0f172a] truncate">{d.title}</div>
              <div className="text-[10px] text-[#64748b]">{formatWhen(d.starts_at)} · {d.volunteers_joined}/{d.volunteers_needed} volunteers</div>
            </div>
            <StatusBadge status={d.status} />
          </button>
        ))
      )}
      {creating && (
        <CampaignForm
          preset={{ id: issueId, title, category, address }}
          onClose={() => setCreating(false)}
          onCreated={(c) => {
            setCreating(false);
            onOpenDrive(c.id);
          }}
        />
      )}
    </section>
  );
};
