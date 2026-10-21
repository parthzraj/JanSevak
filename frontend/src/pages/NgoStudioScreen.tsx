import React, { useCallback, useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Plus, Trash2, Loader2, Megaphone } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ContestCard } from '../components/common/ContestCard';
import { CampaignBoard } from '../components/volunteer/CampaignBoard';
import { NgoVacancyManager } from '../components/volunteer/NgoVacancyManager';
import { NgoCourseManager } from '../components/academy/NgoCourseManager';
import { ApiError, createContest, fetchContests, type Contest, type ContestDraft } from '../lib/api';

interface QDraft { question: string; options: string[]; answer_index: number; explanation: string }
const blankQ = (): QDraft => ({ question: '', options: ['', '', '', ''], answer_index: 0, explanation: '' });

// <input type="datetime-local"> value, in the browser's local time
const localInput = (d: Date) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);

const field = 'w-full text-xs bg-[#f8fafc] border border-[#cbd5e1] rounded-xl px-3 py-2.5 focus:outline-none focus:border-[#0f2d59] focus:bg-white text-[#0f172a]';

export const NgoStudioScreen: React.FC = () => {
  const { user, addToast, logout } = useApp();
  const navigate = useNavigate();

  const [tab, setTab] = useState<'contests' | 'vacancies' | 'drives' | 'courses'>('contests');
  const [mine, setMine] = useState<Contest[] | null>(null);
  const [title, setTitle] = useState('');
  const [topic, setTopic] = useState('Sanitation');
  const [description, setDescription] = useState('');
  const [prize, setPrize] = useState('');
  const [minutes, setMinutes] = useState(5);
  const [endsAt, setEndsAt] = useState(localInput(new Date(Date.now() + 7 * 86400000)));
  const [questions, setQuestions] = useState<QDraft[]>([blankQ(), blankQ(), blankQ()]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(() => fetchContests(true).then(setMine).catch(() => setMine([])), []);
  useEffect(() => { load(); }, [load]);

  if (user.role !== 'ngo' && user.role !== 'admin') return <Navigate to="/home" replace />;

  const setQ = (i: number, patch: Partial<QDraft>) => setQuestions((qs) => qs.map((q, j) => (j === i ? { ...q, ...patch } : q)));
  const setOpt = (i: number, k: number, v: string) => setQ(i, { options: questions[i].options.map((o, j) => (j === k ? v : o)) });

  const publish = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const cleaned = questions.map((q) => {
      const options = q.options.map((o) => o.trim());
      const kept = options.map((o, i) => ({ o, i })).filter((x) => x.o);
      return { question: q.question.trim(), options: kept.map((x) => x.o), answer_index: kept.findIndex((x) => x.i === q.answer_index), explanation: q.explanation.trim() };
    });
    const bad = cleaned.findIndex((q) => q.question.length < 5 || q.options.length < 2 || q.answer_index < 0);
    if (bad >= 0) {
      setError(`Question ${bad + 1}: add the question text, at least two options, and mark a correct option that is filled in.`);
      return;
    }
    const draft: ContestDraft = {
      title, topic, description, prize, time_limit_seconds: Math.round(minutes * 60),
      ends_at: new Date(endsAt).toISOString(), questions: cleaned,
    };
    setBusy(true);
    try {
      await createContest(draft);
      addToast('Contest published', 'Citizens can play it right away.', 'success');
      setTitle(''); setDescription(''); setPrize(''); setQuestions([blankQ(), blankQ(), blankQ()]);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Cannot reach the server. Is the Core API running?');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col px-3.5 sm:px-4 pt-3 pb-32 space-y-4 max-w-2xl mx-auto w-full">
      <div className="bg-white rounded-3xl p-4 border border-[#cbd5e1] flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-emerald-50 flex items-center justify-center"><Megaphone className="w-5 h-5 text-emerald-700" /></div>
        <div className="flex-1 min-w-0">
          <h1 className="text-base font-extrabold text-[#0f172a]">NGO Studio</h1>
          <p className="text-[11px] text-[#64748b] truncate">{user.name} · contests, courses, vacancies and civic drives</p>
        </div>
        <button onClick={() => { logout(); navigate('/login'); }} className="text-[11px] font-bold text-rose-700 border border-rose-200 rounded-xl px-3 py-1.5">Sign out</button>
      </div>

      <div className="grid grid-cols-4 gap-1 p-1 rounded-2xl bg-[#e2e8f0]" role="tablist">
        {([['contests', 'Contests'], ['courses', 'Courses'], ['vacancies', 'Vacancies'], ['drives', 'Drives']] as const).map(([key, label]) => (
          <button key={key} role="tab" aria-selected={tab === key} onClick={() => setTab(key)}
            className={`py-2 rounded-xl text-xs font-extrabold cursor-pointer transition-colors ${tab === key ? 'bg-white text-[#0f2d59] shadow-sm' : 'text-[#475569]'}`}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'courses' && <NgoCourseManager />}
      {tab === 'vacancies' && <NgoVacancyManager />}
      {tab === 'drives' && <CampaignBoard onlyMine />}

      {tab === 'contests' && (<>
      <form onSubmit={publish} className="bg-white rounded-3xl p-5 border border-[#cbd5e1] space-y-3">
        <h2 className="text-sm font-extrabold text-[#0f172a]">Publish a contest</h2>
        <input required minLength={3} className={field} placeholder="Contest title" value={title} onChange={(e) => setTitle(e.target.value)} />
        <div className="grid grid-cols-2 gap-2">
          <input required className={field} placeholder="Topic (e.g. Water)" value={topic} onChange={(e) => setTopic(e.target.value)} />
          <input type="number" min={1} max={60} className={field} value={minutes} onChange={(e) => setMinutes(Number(e.target.value))} aria-label="Time limit in minutes" title="Time limit (minutes)" />
        </div>
        <textarea className={field} rows={2} placeholder="What is this contest about?" value={description} onChange={(e) => setDescription(e.target.value)} />
        <input className={field} placeholder="Your own prize for the top three (optional), e.g. cloth bag + seed kit" value={prize} onChange={(e) => setPrize(e.target.value)} />
        <label className="text-[11px] font-bold text-[#0f172a] block">Closes on
          <input required type="datetime-local" className={`${field} mt-1`} value={endsAt} onChange={(e) => setEndsAt(e.target.value)} />
        </label>
        <p className="text-[10px] text-[#64748b]">JanSevak pays the points: 100 / 60 / 40 to the top three, +10 to everyone who finishes. Highest score wins; the faster finish breaks ties.</p>

        <div className="space-y-3">
          {questions.map((q, i) => (
            <div key={i} className="rounded-2xl border border-[#cbd5e1] p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-[#0f2d59]">Question {i + 1}</span>
                {questions.length > 3 && (
                  <button type="button" onClick={() => setQuestions((qs) => qs.filter((_, j) => j !== i))} className="text-rose-600" aria-label={`Remove question ${i + 1}`}><Trash2 className="w-4 h-4" /></button>
                )}
              </div>
              <input className={field} placeholder="Question" value={q.question} onChange={(e) => setQ(i, { question: e.target.value })} />
              {q.options.map((o, k) => (
                <label key={k} className="flex items-center gap-2">
                  <input type="radio" name={`correct-${i}`} checked={q.answer_index === k} onChange={() => setQ(i, { answer_index: k })} aria-label={`Option ${k + 1} is correct`} />
                  <input className={field} placeholder={`Option ${k + 1}${k < 2 ? '' : ' (optional)'}`} value={o} onChange={(e) => setOpt(i, k, e.target.value)} />
                </label>
              ))}
              <input className={field} placeholder="Why is it right? (shown after the contest ends)" value={q.explanation} onChange={(e) => setQ(i, { explanation: e.target.value })} />
            </div>
          ))}
          {questions.length < 20 && (
            <button type="button" onClick={() => setQuestions((qs) => [...qs, blankQ()])} className="w-full py-2.5 rounded-xl border border-dashed border-[#0f2d59]/40 text-xs font-bold text-[#0f2d59] flex items-center justify-center gap-1.5">
              <Plus className="w-3.5 h-3.5" /> Add question
            </button>
          )}
        </div>

        {error && <p className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl p-2.5">{error}</p>}
        <button disabled={busy} className="w-full py-3 rounded-xl bg-[#0f2d59] hover:bg-[#1d4e8c] disabled:opacity-60 text-white text-xs font-bold flex items-center justify-center gap-2">
          {busy && <Loader2 className="w-4 h-4 animate-spin" />} Publish contest
        </button>
      </form>

      <div className="space-y-3">
        <h2 className="text-sm font-extrabold text-[#0f172a] px-1">Your contests</h2>
        {mine === null && <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-[#64748b]" /></div>}
        {mine?.length === 0 && <p className="text-xs text-[#64748b] px-1">Nothing published yet.</p>}
        {mine?.map((c) => <ContestCard key={c.id} contest={c} onOpen={() => navigate(`/contest/${c.id}`)} />)}
      </div>
      </>)}
    </div>
  );
};
