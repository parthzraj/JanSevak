import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, Trophy, Loader2, Check, X, Sparkles, Medal } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Avatar } from '../components/common/Avatar';
import { avatarFrom } from '../lib/mappers';
import { timeLeft } from '../components/common/ContestCard';
import {
  ApiError,
  fetchContestLeaderboard,
  fetchContestReview,
  fetchMe,
  startContest,
  submitContest,
  type ContestLeaderboard,
  type ContestReviewItem,
  type ContestStart,
  type ContestSubmitResult,
} from '../lib/api';

const mmss = (s: number) => `${Math.floor(s / 60)}:${String(Math.max(0, s % 60)).padStart(2, '0')}`;
const errText = (e: unknown) => (e instanceof ApiError ? e.message : 'Cannot reach the server. Is the Core API running?');

export const ContestScreen: React.FC = () => {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const { user, syncPoints, addToast } = useApp();

  const [board, setBoard] = useState<ContestLeaderboard | null>(null);
  const [error, setError] = useState('');
  const [play, setPlay] = useState<ContestStart | null>(null);
  const [answers, setAnswers] = useState<number[]>([]);
  const [qIndex, setQIndex] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<ContestSubmitResult | null>(null);
  const [review, setReview] = useState<ContestReviewItem[] | null>(null);
  const submitting = useRef(false);

  const load = useCallback(async () => {
    try {
      setBoard(await fetchContestLeaderboard(id));
      setError('');
      // points can land when a contest closes; keep the header number honest
      fetchMe().then((me) => syncPoints(me.points, me.tier)).catch(() => undefined);
    } catch (e) {
      setError(errText(e));
    }
  }, [id, syncPoints]);

  useEffect(() => {
    load();
    const t = setInterval(() => { if (!play) load(); }, 15000);
    return () => clearInterval(t);
  }, [load, play]);

  const submit = useCallback(async (finalAnswers: number[]) => {
    if (submitting.current) return;
    submitting.current = true;
    setBusy(true);
    try {
      const res = await submitContest(id, finalAnswers);
      setResult(res);
      setPlay(null);
      await load();
    } catch (e) {
      addToast('Could not submit', errText(e), 'info');
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  }, [id, load, addToast]);

  // countdown; auto-submit whatever is answered when time runs out
  useEffect(() => {
    if (!play) return;
    const deadline = new Date(play.deadline).getTime();
    const tick = () => {
      const left = Math.max(0, Math.round((deadline - Date.now()) / 1000));
      setSecondsLeft(left);
      if (left === 0) submit(play.questions.map((_, i) => answers[i] ?? -1));
    };
    tick();
    const t = setInterval(tick, 500);
    return () => clearInterval(t);
  }, [play, answers, submit]);

  const begin = async () => {
    setBusy(true);
    try {
      const s = await startContest(id);
      setPlay(s);
      setAnswers(new Array(s.questions.length).fill(-1));
      setQIndex(0);
      setResult(null);
    } catch (e) {
      addToast('Cannot start', errText(e), 'info');
      load();
    } finally {
      setBusy(false);
    }
  };

  const loadReview = async () => {
    try { setReview(await fetchContestReview(id)); } catch (e) { addToast('Review unavailable', errText(e), 'info'); }
  };

  const c = board?.contest;
  const me = c?.my_entry;
  const isCitizen = user.role === 'citizen';
  const q = play?.questions[qIndex];

  return (
    <div className="flex-1 flex flex-col px-3.5 sm:px-4 pt-3 pb-32 space-y-4">
      <button onClick={() => (play ? undefined : navigate(-1))} className="flex items-center gap-1 text-xs font-bold text-[#0f2d59] w-fit">
        <ChevronLeft className="w-4 h-4" /> <span>{play ? 'Contest in progress' : 'Back'}</span>
      </button>

      {error && <p className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl p-3">{error}</p>}
      {!c && !error && <div className="flex justify-center py-10"><Loader2 className="w-5 h-5 animate-spin text-[#64748b]" /></div>}

      {c && play && q && (
        <div className="bg-white rounded-3xl p-5 border border-[#cbd5e1] space-y-4">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-[#0f2d59] uppercase tracking-wider text-[10px]">Question {qIndex + 1} of {play.questions.length}</span>
            <span className={`font-mono font-bold ${secondsLeft <= 20 ? 'text-rose-600' : 'text-[#0f172a]'}`}>{mmss(secondsLeft)}</span>
          </div>
          <h3 className="text-sm font-bold text-[#0f172a] leading-snug">{q.question}</h3>
          <div className="space-y-2">
            {q.options.map((o, i) => (
              <button
                key={i}
                onClick={() => setAnswers((a) => { const n = [...a]; n[qIndex] = i; return n; })}
                className={`w-full text-left p-3.5 rounded-2xl border text-xs flex items-center justify-between gap-3 ${
                  answers[qIndex] === i ? 'bg-[#eff6ff] border-[#0f2d59] text-[#0f2d59] font-bold' : 'bg-[#f8fafc] border-[#cbd5e1] text-[#0f172a]'
                }`}
              >
                <span className="flex-1">{o}</span>
                {answers[qIndex] === i && <Check className="w-4 h-4" />}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            {qIndex > 0 && <button onClick={() => setQIndex((i) => i - 1)} className="px-4 py-3 rounded-xl border border-[#cbd5e1] text-xs font-bold">Back</button>}
            <button
              disabled={busy}
              onClick={() => (qIndex === play.questions.length - 1 ? submit(answers) : setQIndex((i) => i + 1))}
              className="flex-1 py-3 bg-[#0f2d59] text-white text-xs font-bold rounded-xl hover:bg-[#1d4e8c] flex items-center justify-center gap-2"
            >
              {busy && <Loader2 className="w-4 h-4 animate-spin" />}
              {qIndex === play.questions.length - 1 ? 'Submit final answers' : 'Next'}
            </button>
          </div>
          <p className="text-[10px] text-[#64748b]">You only get one attempt. Unanswered questions score 0.</p>
        </div>
      )}

      {c && !play && (
        <>
          <div className="bg-white rounded-3xl p-5 border border-[#cbd5e1] space-y-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#0f2d59] bg-[#eff6ff] px-2 py-0.5 rounded-full">{c.topic}</span>
            <h1 className="text-base font-extrabold text-[#0f172a]">{c.title}</h1>
            <p className="text-[11px] text-[#64748b]">by {c.ngo_name} · {c.status === 'ended' ? 'closed' : timeLeft(c.ends_at)} · {c.participants} played</p>
            {c.description && <p className="text-xs text-[#334155] leading-relaxed">{c.description}</p>}
            <p className="text-xs text-[#0f2d59] bg-[#eff6ff] rounded-xl p-3 leading-relaxed">
              Top three win <b>{board!.prizes['1']} / {board!.prizes['2']} / {board!.prizes['3']}</b> points. Everyone who finishes with a right answer gets{' '}
              <b>+{board!.participation_points}</b>. Highest score wins; the faster finish breaks ties. Prizes are paid when the contest closes.
            </p>
            {c.prize && <p className="text-xs text-[#92400e] bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">NGO prize: {c.prize}</p>}

            {isCitizen && c.status === 'live' && me?.state !== 'submitted' && (
              <button disabled={busy} onClick={begin} className="w-full py-3 rounded-xl bg-[#0f2d59] hover:bg-[#1d4e8c] text-white text-xs font-bold flex items-center justify-center gap-2">
                {busy && <Loader2 className="w-4 h-4 animate-spin" />}
                {me?.state === 'in_progress' ? 'Resume attempt' : `Start (${Math.round(c.time_limit_seconds / 60)} min, one attempt)`}
              </button>
            )}
            {isCitizen && c.status === 'upcoming' && <p className="text-xs text-amber-800">Opens {new Date(c.starts_at).toLocaleString('en-IN')}.</p>}
            {(result || me?.state === 'submitted') && (
              <p className="text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-xl p-3">
                {result?.timed_out ? 'Time was up, so this attempt scored 0.' : `You scored ${result?.score ?? me?.score}/${result?.total ?? me?.total}.`}{' '}
                {c.finalized ? (me && me.bonus_points > 0 ? `You earned ${me.bonus_points} points.` : '') : 'Winners are announced when the contest closes.'}
              </p>
            )}
            {isCitizen && c.status === 'ended' && me?.state === 'submitted' && !review && (
              <button onClick={loadReview} className="w-full py-2.5 rounded-xl border border-[#cbd5e1] text-xs font-bold">See correct answers</button>
            )}
          </div>

          <div className="bg-white rounded-3xl p-5 border border-[#cbd5e1] space-y-2">
            <h2 className="text-sm font-extrabold text-[#0f172a] flex items-center gap-1.5"><Trophy className="w-4 h-4 text-[#d97706]" /> Leaderboard</h2>
            {board!.rows.length === 0 && <p className="text-xs text-[#64748b]">Nobody has finished yet. Be the first!</p>}
            {board!.rows.map((r) => (
              <div key={r.user_id} className={`flex items-center gap-3 rounded-2xl px-3 py-2 ${r.is_me ? 'bg-[#eff6ff] border border-[#0f2d59]/30' : 'border border-transparent'}`}>
                <span className="w-6 text-center text-xs font-extrabold text-[#0f2d59]">
                  {r.rank <= 3 ? <Medal className={`w-5 h-5 mx-auto ${r.rank === 1 ? 'text-yellow-500' : r.rank === 2 ? 'text-slate-400' : 'text-amber-700'}`} /> : r.rank}
                </span>
                <Avatar src={avatarFrom(r.avatar_url)} name={r.name} size={28} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-[#0f172a] truncate">{r.name}{r.is_me ? ' (you)' : ''}</p>
                  <p className="text-[10px] text-[#64748b]">{r.duration_seconds.toFixed(0)}s</p>
                </div>
                <span className="text-xs font-extrabold text-[#0f172a] tabular-nums">{r.score}/{r.total}</span>
                {r.bonus_points > 0 && <span className="text-[10px] font-bold text-emerald-700">+{r.bonus_points}</span>}
              </div>
            ))}
          </div>

          {review && (
            <div className="space-y-2.5">
              {review.map((r, i) => (
                <div key={i} className="bg-white rounded-2xl p-4 border border-[#cbd5e1] space-y-1.5">
                  <div className="flex gap-2">
                    {r.correct ? <Check className="w-4 h-4 text-emerald-600 shrink-0" /> : <X className="w-4 h-4 text-rose-600 shrink-0" />}
                    <p className="text-xs font-bold text-[#0f172a]">{r.question}</p>
                  </div>
                  {!r.correct && <p className="text-[11px] text-rose-700">Your answer: {r.your_answer === null ? 'not answered' : r.options[r.your_answer]}</p>}
                  <p className="text-[11px] text-emerald-800 font-semibold">Correct: {r.options[r.correct_index]}</p>
                  {r.explanation && <p className="text-[11px] text-[#475569] flex gap-1"><Sparkles className="w-3 h-3 text-[#0f2d59] shrink-0 mt-0.5" />{r.explanation}</p>}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};
