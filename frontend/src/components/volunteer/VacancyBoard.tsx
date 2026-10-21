import React, { useCallback, useEffect, useState } from 'react';
import { Briefcase, Clock, Loader2, MapPin, Users } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { applyToVacancy, fetchVacancies, withdrawApplication, type Vacancy } from '../../lib/api';
import { Sheet, errorText, field, formatDay } from './shared';

const APP_STYLE: Record<string, string> = {
  Applied: 'bg-blue-50 text-blue-800 border-blue-200',
  Accepted: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  Rejected: 'bg-rose-50 text-rose-700 border-rose-200',
  Completed: 'bg-slate-100 text-slate-700 border-slate-300',
  Withdrawn: 'bg-slate-50 text-slate-500 border-slate-200',
};

/** Citizens: browse NGO vacancies, apply with a note, follow the status of their applications. */
export const VacancyBoard: React.FC = () => {
  const { user, addToast } = useApp();
  const [items, setItems] = useState<Vacancy[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [applying, setApplying] = useState<Vacancy | null>(null);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(
    () =>
      fetchVacancies()
        .then((r) => {
          setItems(r.items);
          setFailed(false);
        })
        .catch(() => {
          setItems([]);
          setFailed(true);
        }),
    []
  );
  useEffect(() => {
    load();
  }, [load]);

  const isNgo = user.role === 'ngo';

  const submit = async () => {
    if (!applying) return;
    setBusy(true);
    setError('');
    try {
      await applyToVacancy(applying.id, note.trim() || undefined);
      addToast('Application sent', `${applying.ngo.name} will review it. You will be notified.`, 'success');
      setApplying(null);
      setNote('');
      await load();
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
  };

  const withdraw = async (v: Vacancy) => {
    try {
      await withdrawApplication(v.id);
      addToast('Application withdrawn', undefined, 'info');
      await load();
    } catch (e) {
      addToast('Could not withdraw', errorText(e), 'info');
    }
  };

  return (
    <div className="space-y-3">
      <p className="text-[11px] text-[#64748b] px-1">
        Roles posted by NGOs. Finish a role the NGO confirms and you earn <b>40 points</b>.
      </p>
      {items === null && <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-[#64748b]" /></div>}
      {failed && <p className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl p-3">Could not load vacancies. Is the Core API running?</p>}
      {items?.length === 0 && !failed && <p className="text-xs text-[#64748b] text-center py-8">No open vacancies right now. NGOs post new roles here.</p>}

      {items?.map((v) => {
        const mine = v.my_application;
        const active = mine && mine !== 'Withdrawn';
        return (
          <article key={v.id} className="bg-white rounded-3xl border border-[#cbd5e1] p-4 space-y-2.5">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="text-sm font-extrabold text-[#0f172a] leading-snug">{v.title}</h3>
                <p className="text-[11px] text-[#64748b]">{v.ngo.name} · NGO</p>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 shrink-0">{v.role_type}</span>
            </div>
            <p className="text-xs text-[#334155] leading-relaxed">{v.description}</p>
            <div className="grid grid-cols-2 gap-1.5 text-[11px] text-[#475569]">
              {v.location && <div className="flex items-center gap-1.5 min-w-0"><MapPin className="w-3.5 h-3.5 shrink-0" /><span className="truncate">{v.location}</span></div>}
              {v.commitment && <div className="flex items-center gap-1.5 min-w-0"><Clock className="w-3.5 h-3.5 shrink-0" /><span className="truncate">{v.commitment}</span></div>}
              {v.skills && <div className="flex items-center gap-1.5 min-w-0"><Briefcase className="w-3.5 h-3.5 shrink-0" /><span className="truncate">{v.skills}</span></div>}
              <div className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5" />{v.accepted_count}/{v.slots} filled</div>
            </div>
            {v.deadline && <p className="text-[10px] text-[#64748b]">Apply by {formatDay(v.deadline)}</p>}

            <div className="flex items-center gap-2 pt-1">
              {active && (
                <span className={`text-[11px] font-extrabold px-3 py-1.5 rounded-xl border ${APP_STYLE[mine!]}`}>
                  {mine === 'Completed' ? 'Completed · +40 pts' : mine}
                </span>
              )}
              {mine === 'Applied' && (
                <button onClick={() => withdraw(v)} className="text-[11px] font-bold text-rose-700 cursor-pointer">Withdraw</button>
              )}
              {!active && !isNgo && (
                <button
                  onClick={() => { setApplying(v); setNote(''); setError(''); }}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-700 to-teal-800 text-white text-xs font-bold cursor-pointer"
                >
                  {mine === 'Withdrawn' ? 'Apply again' : 'Apply'}
                </button>
              )}
              {isNgo && <span className="text-[11px] text-[#64748b]">Manage applicants in NGO Studio</span>}
            </div>
          </article>
        );
      })}

      {applying && (
        <Sheet title={`Apply: ${applying.title}`} subtitle={applying.ngo.name} onClose={() => setApplying(null)}>
          <textarea rows={4} maxLength={1000} className={field} placeholder="Why are you a good fit? When are you free? (optional)" value={note} onChange={(e) => setNote(e.target.value)} />
          {error && <p className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl p-2.5">{error}</p>}
          <button disabled={busy} onClick={submit} className="w-full py-3 rounded-xl bg-[#0f2d59] disabled:opacity-60 text-white text-xs font-bold flex items-center justify-center gap-2 cursor-pointer">
            {busy && <Loader2 className="w-4 h-4 animate-spin" />} Send application
          </button>
        </Sheet>
      )}
    </div>
  );
};
