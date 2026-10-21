import React, { useCallback, useEffect, useState } from 'react';
import { Calendar, CheckCircle2, Clock, Link2, Loader2, MapPin, Users } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Avatar } from '../common/Avatar';
import { avatarFrom } from '../../lib/mappers';
import {
  cancelCampaign,
  completeCampaign,
  fetchCampaign,
  joinCampaign,
  leaveCampaign,
  type Campaign,
  type CampaignDetail,
} from '../../lib/api';
import { OrganiserChip, Sheet, StatusBadge, errorText, formatWhen } from './shared';

interface Props {
  campaign: Campaign;
  onClose: () => void;
  onChanged: () => void;
}

export const CampaignSheet: React.FC<Props> = ({ campaign, onClose, onChanged }) => {
  const { addToast, refreshData } = useApp();
  const [c, setC] = useState<CampaignDetail | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [wrapping, setWrapping] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [attended, setAttended] = useState<Set<number>>(new Set());

  const load = useCallback(() => fetchCampaign(campaign.id).then(setC).catch((e) => setError(errorText(e))), [campaign.id]);
  useEffect(() => {
    load();
  }, [load]);

  const view = c ?? { ...campaign, members: [] };
  const open = view.status === 'Upcoming' || view.status === 'Ongoing';
  const canWrap = view.is_organiser && (view.status === 'Ongoing' || view.status === 'Awaiting wrap-up');
  const full = view.volunteers_joined >= view.volunteers_needed;

  const run = async (fn: () => Promise<unknown>, after?: () => void) => {
    setBusy(true);
    setError('');
    try {
      await fn();
      await load();
      onChanged();
      after?.();
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
  };

  const join = () =>
    run(() => joinCampaign(view.id), () => addToast('You joined the drive', 'The organiser will confirm your attendance afterwards.', 'success'));
  const leave = () => run(() => leaveCampaign(view.id), () => addToast('You left the drive', undefined, 'info'));
  const cancel = () =>
    run(() => cancelCampaign(view.id), () => {
      setConfirmCancel(false);
      addToast('Drive cancelled', 'Volunteers have been told.', 'info');
    });

  const confirmAttendance = () =>
    run(
      async () => {
        const res = await completeCampaign(view.id, [...attended]);
        setC(res.campaign);
        await refreshData();
        setWrapping(false);
        addToast(
          res.host_points_awarded > 0 ? `Drive completed! +${res.host_points_awarded} points` : 'Drive completed',
          `${res.attended} volunteer${res.attended === 1 ? '' : 's'} confirmed, ${res.volunteers_paid} paid.${res.notes.length ? ' ' + res.notes[0] : ''}`,
          'reward'
        );
      }
    );

  const toggle = (id: number) =>
    setAttended((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <Sheet title={view.title} subtitle={`${view.kind} · organised by ${view.organiser_type === 'NGO' ? 'an NGO' : 'a citizen'}`} onClose={onClose}>
      <div className="flex items-center gap-2 flex-wrap">
        <StatusBadge status={view.status} />
        <OrganiserChip person={view.organiser} type={view.organiser_type} />
      </div>

      <p className="text-xs text-[#334155] leading-relaxed whitespace-pre-line">{view.description}</p>

      <div className="space-y-1.5 text-[11px] text-[#334155]">
        <div className="flex items-center gap-2"><Calendar className="w-3.5 h-3.5 text-[#0f2d59]" />{formatWhen(view.starts_at)}</div>
        <div className="flex items-center gap-2"><Clock className="w-3.5 h-3.5 text-[#0f2d59]" />until {formatWhen(view.ends_at)}</div>
        {view.address && <div className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5 text-[#0f2d59]" />{view.address}</div>}
        {view.issue && (
          <div className="flex items-center gap-2"><Link2 className="w-3.5 h-3.5 text-[#0f2d59]" />For report: <b className="truncate">{view.issue.title}</b> ({view.issue.status})</div>
        )}
        <div className="flex items-center gap-2"><Users className="w-3.5 h-3.5 text-[#0f2d59]" />{view.volunteers_joined} of {view.volunteers_needed} volunteers{view.status === 'Completed' ? ` · ${view.volunteers_attended} attended` : ''}</div>
      </div>

      <div className="text-[11px] rounded-xl bg-amber-50 border border-amber-200 text-amber-900 p-2.5">
        Confirmed volunteers earn <b>{view.points_per_volunteer} points</b> and volunteer hours. The organiser earns 20 + 10 per confirmed volunteer (max 80).
        {view.status === 'Completed' && view.is_organiser && <> You earned <b>{view.host_points} points</b> for this drive.</>}
      </div>

      {view.members.length > 0 && (
        <div className="space-y-1.5">
          <h4 className="text-xs font-extrabold text-[#0f172a]">Volunteers</h4>
          {view.members.map((m) => (
            <div key={m.user_id} className="flex items-center gap-2.5 text-xs">
              {wrapping && (
                <input type="checkbox" className="w-4 h-4" checked={attended.has(m.user_id)} onChange={() => toggle(m.user_id)} aria-label={`${m.name} attended`} />
              )}
              <Avatar src={avatarFrom(m.avatar_url)} name={m.name} size={26} />
              <span className="flex-1 font-semibold truncate">{m.name}</span>
              {view.status === 'Completed' && (
                <span className={`text-[10px] font-bold ${m.status === 'Attended' ? 'text-emerald-700' : 'text-slate-500'}`}>
                  {m.status === 'Attended' ? `Attended${m.points_awarded ? ` · +${m.points_awarded}` : ''}` : 'No-show'}
                </span>
              )}
            </div>
          ))}
          {wrapping && (
            <button type="button" className="text-[11px] font-bold text-[#0f2d59] cursor-pointer" onClick={() => setAttended(new Set(view.members.map((m) => m.user_id)))}>
              Select everyone who came
            </button>
          )}
        </div>
      )}

      {error && <p className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl p-2.5">{error}</p>}

      {/* volunteer actions */}
      {!view.is_organiser && open && (
        view.my_status === 'Joined' ? (
          <button disabled={busy} onClick={leave} className="w-full py-3 rounded-xl border border-rose-200 text-rose-700 text-xs font-bold cursor-pointer">Leave this drive</button>
        ) : (
          <button disabled={busy || full} onClick={join} className="w-full py-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white text-xs font-bold cursor-pointer">
            {full ? 'Drive is full' : 'Join as volunteer'}
          </button>
        )
      )}
      {!view.is_organiser && view.my_status === 'Attended' && (
        <p className="text-xs font-bold text-emerald-700 flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4" /> Your attendance was confirmed.</p>
      )}

      {/* organiser actions */}
      {view.is_organiser && (open || view.status === 'Awaiting wrap-up') && !wrapping && (
        <div className="space-y-2">
          {canWrap ? (
            <button disabled={busy} onClick={() => setWrapping(true)} className="w-full py-3 rounded-xl bg-[#0f2d59] text-white text-xs font-bold cursor-pointer">
              Wrap up &amp; confirm attendance
            </button>
          ) : (
            <p className="text-[11px] text-[#64748b]">You can wrap this drive up once it has started.</p>
          )}
          {confirmCancel ? (
            <div className="flex gap-2">
              <button disabled={busy} onClick={cancel} className="flex-1 py-2.5 rounded-xl bg-rose-600 text-white text-xs font-bold cursor-pointer">Yes, cancel drive</button>
              <button onClick={() => setConfirmCancel(false)} className="flex-1 py-2.5 rounded-xl bg-[#f1f5f9] text-xs font-bold cursor-pointer">Keep it</button>
            </div>
          ) : (
            <button onClick={() => setConfirmCancel(true)} className="w-full py-2.5 rounded-xl border border-rose-200 text-rose-700 text-xs font-bold cursor-pointer">Cancel drive</button>
          )}
        </div>
      )}
      {view.is_organiser && wrapping && (
        <div className="space-y-2">
          <p className="text-[11px] text-[#64748b]">Tick only the people who really took part. Everyone else is marked as a no-show. This cannot be changed afterwards.</p>
          <div className="flex gap-2">
            <button disabled={busy || attended.size === 0} onClick={confirmAttendance} className="flex-1 py-3 rounded-xl bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold flex items-center justify-center gap-2 cursor-pointer">
              {busy && <Loader2 className="w-4 h-4 animate-spin" />} Confirm {attended.size} &amp; pay points
            </button>
            <button onClick={() => setWrapping(false)} className="px-4 rounded-xl bg-[#f1f5f9] text-xs font-bold cursor-pointer">Back</button>
          </div>
        </div>
      )}
    </Sheet>
  );
};
