import React, { useCallback, useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Avatar } from '../common/Avatar';
import { avatarFrom } from '../../lib/mappers';
import {
  ROLE_TYPES,
  closeVacancy,
  createVacancy,
  decideApplication,
  fetchApplications,
  fetchVacancies,
  type Vacancy,
  type VacancyApplication,
} from '../../lib/api';
import { errorText, field, formatDay, localInput } from './shared';

const APP_STYLE: Record<string, string> = {
  Applied: 'bg-blue-50 text-blue-800',
  Accepted: 'bg-emerald-50 text-emerald-800',
  Rejected: 'bg-rose-50 text-rose-700',
  Completed: 'bg-slate-100 text-slate-700',
};

/** NGO Studio: post vacancies and review the people who applied. */
export const NgoVacancyManager: React.FC = () => {
  const { addToast } = useApp();
  const [mine, setMine] = useState<Vacancy[] | null>(null);
  const [title, setTitle] = useState('');
  const [roleType, setRoleType] = useState<string>('Volunteer');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [commitment, setCommitment] = useState('');
  const [skills, setSkills] = useState('');
  const [slots, setSlots] = useState(3);
  const [deadline, setDeadline] = useState(localInput(new Date(Date.now() + 30 * 86400000)));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const [openId, setOpenId] = useState<number | null>(null);
  const [apps, setApps] = useState<VacancyApplication[] | null>(null);

  const load = useCallback(() => fetchVacancies({ mine: true, include_closed: true }).then((r) => setMine(r.items)).catch(() => setMine([])), []);
  useEffect(() => {
    load();
  }, [load]);

  const loadApps = useCallback((id: number) => fetchApplications(id).then(setApps).catch(() => setApps([])), []);
  useEffect(() => {
    if (openId === null) return setApps(null);
    setApps(null);
    loadApps(openId);
  }, [openId, loadApps]);

  const publish = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await createVacancy({
        title: title.trim(),
        role_type: roleType,
        description: description.trim(),
        location: location.trim() || undefined,
        commitment: commitment.trim() || undefined,
        skills: skills.trim() || undefined,
        slots,
        deadline: deadline ? new Date(deadline).toISOString() : null,
      });
      addToast('Vacancy posted', 'Citizens can apply right away.', 'success');
      setTitle(''); setDescription(''); setLocation(''); setCommitment(''); setSkills('');
      await load();
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  };

  const decide = async (v: Vacancy, a: VacancyApplication, status: 'Accepted' | 'Rejected' | 'Completed') => {
    try {
      const res = await decideApplication(v.id, a.id, status);
      if (status === 'Completed') {
        addToast('Marked completed', res.points_awarded ? `${a.applicant.name} earned ${res.points_awarded} points.` : 'The volunteer reached the weekly point limit, so no points this time.', 'reward');
      }
      await Promise.all([loadApps(v.id), load()]);
    } catch (err) {
      addToast('Could not update', errorText(err), 'info');
    }
  };

  const close = async (v: Vacancy) => {
    try {
      await closeVacancy(v.id);
      await load();
    } catch (err) {
      addToast('Could not close', errorText(err), 'info');
    }
  };

  return (
    <div className="space-y-4">
      <form onSubmit={publish} className="bg-white rounded-3xl p-5 border border-[#cbd5e1] space-y-3">
        <h2 className="text-sm font-extrabold text-[#0f172a]">Post a vacancy</h2>
        <input required minLength={4} className={field} placeholder="Role title, e.g. Weekend clean-up volunteers" value={title} onChange={(e) => setTitle(e.target.value)} />
        <div className="grid grid-cols-2 gap-2">
          <select className={field} value={roleType} onChange={(e) => setRoleType(e.target.value)} aria-label="Role type">
            {ROLE_TYPES.map((r) => <option key={r}>{r}</option>)}
          </select>
          <input type="number" min={1} max={200} className={field} value={slots} onChange={(e) => setSlots(Number(e.target.value))} aria-label="Open positions" title="Open positions" />
        </div>
        <textarea required minLength={10} rows={3} className={field} placeholder="What will volunteers do?" value={description} onChange={(e) => setDescription(e.target.value)} />
        <input className={field} placeholder="Location" value={location} onChange={(e) => setLocation(e.target.value)} />
        <input className={field} placeholder="Time commitment, e.g. 4 hrs / week for 2 months" value={commitment} onChange={(e) => setCommitment(e.target.value)} />
        <input className={field} placeholder="Skills wanted (optional)" value={skills} onChange={(e) => setSkills(e.target.value)} />
        <label className="text-[11px] font-bold text-[#0f172a] block">Apply by
          <input type="datetime-local" className={`${field} mt-1`} value={deadline} onChange={(e) => setDeadline(e.target.value)} />
        </label>
        {error && <p className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl p-2.5">{error}</p>}
        <button disabled={busy} className="w-full py-3 rounded-xl bg-[#0f2d59] disabled:opacity-60 text-white text-xs font-bold flex items-center justify-center gap-2 cursor-pointer">
          {busy && <Loader2 className="w-4 h-4 animate-spin" />} Post vacancy
        </button>
      </form>

      <h2 className="text-sm font-extrabold text-[#0f172a] px-1">Your vacancies</h2>
      {mine === null && <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-[#64748b]" /></div>}
      {mine?.length === 0 && <p className="text-xs text-[#64748b] px-1">Nothing posted yet.</p>}
      {mine?.map((v) => (
        <div key={v.id} className="bg-white rounded-3xl border border-[#cbd5e1] p-4 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="text-sm font-extrabold text-[#0f172a] leading-snug">{v.title}</h3>
              <p className="text-[11px] text-[#64748b]">
                {v.role_type} · {v.accepted_count}/{v.slots} filled · {v.applicants_count} applicant{v.applicants_count === 1 ? '' : 's'}
                {v.deadline ? ` · by ${formatDay(v.deadline)}` : ''}
              </p>
            </div>
            <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${v.is_open ? 'bg-emerald-50 text-emerald-800' : 'bg-slate-100 text-slate-600'}`}>{v.is_open ? 'Open' : 'Closed'}</span>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setOpenId(openId === v.id ? null : v.id)} className="text-[11px] font-bold text-[#0f2d59] cursor-pointer">
              {openId === v.id ? 'Hide applicants' : 'View applicants'}
            </button>
            {v.is_open && <button onClick={() => close(v)} className="text-[11px] font-bold text-rose-700 cursor-pointer">Close vacancy</button>}
          </div>

          {openId === v.id && (
            <div className="space-y-2 pt-1">
              {apps === null && <Loader2 className="w-4 h-4 animate-spin text-[#64748b]" />}
              {apps?.length === 0 && <p className="text-[11px] text-[#64748b]">No applicants yet.</p>}
              {apps?.map((a) => (
                <div key={a.id} className="rounded-2xl bg-[#f8fafc] border border-[#e2e8f0] p-3 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <Avatar src={avatarFrom(a.applicant.avatar_url)} name={a.applicant.name} size={28} />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold truncate">{a.applicant.name}</div>
                      <div className="text-[10px] text-[#64748b] truncate">{a.applicant.ward ?? 'Ward not set'}</div>
                    </div>
                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${APP_STYLE[a.status] ?? ''}`}>{a.status}</span>
                  </div>
                  {a.note && <p className="text-[11px] text-[#334155] italic">“{a.note}”</p>}
                  <div className="flex gap-2">
                    {a.status === 'Applied' && (
                      <>
                        <button onClick={() => decide(v, a, 'Accepted')} className="px-3 py-1.5 rounded-lg bg-emerald-700 text-white text-[11px] font-bold cursor-pointer">Accept</button>
                        <button onClick={() => decide(v, a, 'Rejected')} className="px-3 py-1.5 rounded-lg bg-white border border-rose-200 text-rose-700 text-[11px] font-bold cursor-pointer">Reject</button>
                      </>
                    )}
                    {a.status === 'Accepted' && (
                      <button onClick={() => decide(v, a, 'Completed')} className="px-3 py-1.5 rounded-lg bg-[#0f2d59] text-white text-[11px] font-bold cursor-pointer">Mark completed (+40 pts for them)</button>
                    )}
                    {a.status === 'Completed' && <span className="text-[11px] font-bold text-emerald-700">Completed{a.points_awarded ? ` · +${a.points_awarded} pts` : ''}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
