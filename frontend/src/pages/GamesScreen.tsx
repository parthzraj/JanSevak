import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Gamepad2,
  Trophy,
  CheckCircle2,
  ChevronLeft,
  RotateCcw,
  Sparkles,
  ArrowRight,
  Check,
  X,
  Loader2,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ContestCard } from '../components/common/ContestCard';
import {
  fetchContests,
  type Contest,
  fetchQuizzes,
  fetchQuiz,
  submitQuiz,
  ApiError,
  QuizSummary,
  QuizDetail,
  QuizResult,
} from '../lib/api';

export const GamesScreen: React.FC = () => {
  const navigate = useNavigate();
  const { user, syncPoints, addToast } = useApp();

  const [quizzes, setQuizzes] = useState<QuizSummary[] | null>(null);
  const [loadError, setLoadError] = useState('');
  const [activeQuiz, setActiveQuiz] = useState<QuizDetail | null>(null);
  const [answers, setAnswers] = useState<number[]>([]);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [result, setResult] = useState<QuizResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState<'contests' | 'practice'>('contests');
  const [contests, setContests] = useState<Contest[] | null>(null);

  const errText = (e: unknown) => (e instanceof ApiError ? e.message : 'Cannot reach the server. Is the Core API running?');

  const loadList = useCallback(async () => {
    try {
      setQuizzes(await fetchQuizzes());
      setLoadError('');
    } catch (e) {
      setLoadError(errText(e));
    }
  }, []);

  useEffect(() => {
    loadList();
    fetchContests().then(setContests).catch(() => setContests([]));
  }, [loadList]);

  const startQuiz = async (id: string) => {
    setBusy(true);
    try {
      const detail = await fetchQuiz(id);
      setActiveQuiz(detail);
      setAnswers([]);
      setQuestionIndex(0);
      setResult(null);
    } catch (e) {
      addToast('Could not open quiz', errText(e), 'info');
    } finally {
      setBusy(false);
    }
  };

  const leaveQuiz = () => {
    setActiveQuiz(null);
    setResult(null);
    loadList();
  };

  const pick = (idx: number) => {
    setAnswers((prev) => {
      const next = [...prev];
      next[questionIndex] = idx;
      return next;
    });
  };

  const finish = async () => {
    if (!activeQuiz) return;
    setBusy(true);
    try {
      const res = await submitQuiz(activeQuiz.id, answers);
      setResult(res);
      syncPoints(res.user_points, res.user_tier);
      if (res.points_awarded > 0) {
        addToast(`Quiz passed! +${res.points_awarded} Points`, `Score: ${res.score}/${res.total}`, 'reward');
      }
    } catch (e) {
      addToast('Could not submit quiz', errText(e), 'info');
    } finally {
      setBusy(false);
    }
  };

  const total = activeQuiz?.questions.length ?? 0;
  const q = activeQuiz?.questions[questionIndex];
  const chosen = answers[questionIndex];
  const isLast = questionIndex === total - 1;

  return (
    <div className="flex-1 flex flex-col px-3.5 sm:px-4 pt-3 pb-32 space-y-4">
      <div className="flex items-center justify-between">
        <button
          onClick={() => (activeQuiz ? leaveQuiz() : navigate('/menu'))}
          className="flex items-center gap-1 text-xs font-bold text-[#0f2d59] hover:underline"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>{activeQuiz ? 'Exit Quiz' : 'Back to Menu'}</span>
        </button>
        <div className="flex items-center gap-1.5 text-xs font-bold text-[#0f2d59] bg-[#eff6ff] px-2.5 py-1 rounded-full">
          <Trophy className="w-3.5 h-3.5 text-[#d97706]" />
          <span>{user.points} pts</span>
        </div>
      </div>

      {!activeQuiz && (
        <div className="bg-white rounded-3xl p-4 sm:p-5 border border-[#cbd5e1] shadow-xs">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center">
              <Gamepad2 className="w-4 h-4 text-amber-700" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-extrabold text-[#0f172a]">Quizzes & Contests</h1>
              <p className="text-xs text-[#64748b]">
                Compete in NGO contests: the top three win bonus points. Or practise on your own.
              </p>
            </div>
          </div>
        </div>
      )}

      {!activeQuiz && (
        <div className="grid grid-cols-2 gap-1 bg-[#eef3f6] p-1 rounded-full">
          {(['contests', 'practice'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`py-1.5 rounded-full text-xs font-bold ${tab === t ? 'bg-white text-[#0f2d59] shadow-xs' : 'text-[#62778a]'}`}
            >
              {t === 'contests' ? 'NGO Contests' : 'Practice'}
            </button>
          ))}
        </div>
      )}

      {!activeQuiz && tab === 'contests' && (
        <div className="space-y-3">
          {contests === null && <div className="flex justify-center py-8 text-[#64748b]"><Loader2 className="w-5 h-5 animate-spin" /></div>}
          {contests?.length === 0 && <p className="text-xs text-[#64748b] text-center py-6">No contests yet. NGOs will publish them here.</p>}
          {contests?.map((c) => (
            <ContestCard key={c.id} contest={c} onOpen={() => navigate(`/contest/${c.id}`)} />
          ))}
        </div>
      )}

      {activeQuiz && !result && q && (
        <div className="bg-white rounded-3xl p-5 border border-[#cbd5e1] shadow-sm space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#0f2d59] uppercase tracking-wider text-[10px]">
                {activeQuiz.category} · Question {questionIndex + 1} of {total}
              </span>
            </div>
            <div className="h-1.5 bg-[#f8fafc] rounded-full overflow-hidden border border-[#cbd5e1]">
              <div className="h-full bg-[#0f2d59] transition-all" style={{ width: `${((questionIndex + 1) / total) * 100}%` }} />
            </div>
          </div>

          <h3 className="text-sm sm:text-base font-bold text-[#0f172a] leading-snug py-2">{q.question}</h3>

          <div className="space-y-2">
            {q.options.map((option, idx) => (
              <button
                key={idx}
                onClick={() => pick(idx)}
                className={`w-full text-left p-3.5 rounded-2xl border transition-all text-xs flex items-center justify-between gap-3 ${
                  chosen === idx
                    ? 'bg-[#eff6ff] border-[#0f2d59] text-[#0f2d59] font-bold'
                    : 'bg-[#f8fafc] border-[#cbd5e1] text-[#0f172a] hover:border-[#0f2d59]/40'
                }`}
              >
                <span className="flex-1">{option}</span>
                {chosen === idx && <Check className="w-4 h-4 shrink-0" />}
              </button>
            ))}
          </div>

          <div className="flex gap-2">
            {questionIndex > 0 && (
              <button
                onClick={() => setQuestionIndex((i) => i - 1)}
                className="px-4 py-3 rounded-xl border border-[#cbd5e1] text-xs font-bold text-[#0f172a]"
              >
                Back
              </button>
            )}
            <button
              disabled={chosen === undefined || busy}
              onClick={() => (isLast ? finish() : setQuestionIndex((i) => i + 1))}
              className="flex-1 py-3 bg-[#0f2d59] disabled:bg-slate-300 text-white text-xs font-bold rounded-xl hover:bg-[#1d4e8c] transition-colors flex items-center justify-center gap-2"
            >
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              <span>{isLast ? 'Submit answers' : 'Next question'}</span>
              {!busy && <ArrowRight className="w-4 h-4" />}
            </button>
          </div>
        </div>
      )}

      {activeQuiz && result && (
        <div className="space-y-3">
          <div className="bg-white rounded-3xl p-5 border border-[#cbd5e1] shadow-sm text-center space-y-3">
            <div className="w-14 h-14 rounded-3xl bg-[#eff6ff] flex items-center justify-center mx-auto">
              <Trophy className={`w-8 h-8 ${result.passed ? 'text-[#d97706]' : 'text-slate-400'}`} />
            </div>
            <h3 className="text-lg font-extrabold text-[#0f172a]">
              {result.passed ? 'Quiz passed!' : 'Not quite yet'}
            </h3>
            <p className="text-xs text-[#64748b]">
              You got {result.score} of {result.total} right (pass mark {result.pass_mark}).
            </p>
            <div className="p-3 bg-gradient-to-r from-[#0f2d59] to-[#1d4e8c] text-white rounded-2xl inline-block px-6">
              <span className="text-[11px] text-[#eff6ff] block font-semibold">Points earned</span>
              <span className="text-xl font-extrabold text-[#fbbf24]">+{result.points_awarded}</span>
            </div>
            <p className="text-xs text-[#64748b]">{result.note}</p>
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => startQuiz(activeQuiz.id)}
                className="flex-1 py-2.5 rounded-xl border border-[#cbd5e1] text-xs font-bold text-[#0f172a] flex items-center justify-center gap-1 hover:bg-[#f8fafc]"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{result.passed ? 'Practice again' : 'Try again'}</span>
              </button>
              <button onClick={leaveQuiz} className="flex-1 py-2.5 rounded-xl bg-[#0f2d59] text-white text-xs font-bold hover:bg-[#1d4e8c]">
                Other quizzes
              </button>
            </div>
          </div>

          <div className="space-y-2.5">
            {result.review.map((r, i) => (
              <div key={i} className="bg-white rounded-2xl p-4 border border-[#cbd5e1] space-y-2">
                <div className="flex items-start gap-2">
                  {r.correct ? (
                    <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <X className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  )}
                  <p className="text-xs font-bold text-[#0f172a] leading-snug">{r.question}</p>
                </div>
                {!r.correct && (
                  <p className="text-[11px] text-rose-700">Your answer: {r.options[r.your_answer]}</p>
                )}
                <p className="text-[11px] text-emerald-800 font-semibold">Correct: {r.options[r.correct_index]}</p>
                <p className="text-[11px] text-[#475569] leading-relaxed flex gap-1">
                  <Sparkles className="w-3 h-3 text-[#0f2d59] shrink-0 mt-0.5" />
                  {r.explanation}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {!activeQuiz && tab === 'practice' && (
        <div className="space-y-3">
          {loadError && (
            <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-2xl p-3 flex items-center justify-between gap-2">
              <span>{loadError}</span>
              <button onClick={loadList} className="font-bold underline">Retry</button>
            </div>
          )}
          {!quizzes && !loadError && (
            <div className="flex justify-center py-8 text-[#64748b]"><Loader2 className="w-5 h-5 animate-spin" /></div>
          )}
          {quizzes?.map((quiz) => (
            <div key={quiz.id} className="bg-white rounded-3xl p-5 border border-[#cbd5e1] shadow-xs space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#0f2d59] bg-[#eff6ff] px-2 py-0.5 rounded-full inline-block mb-1">
                    {quiz.category}
                  </span>
                  <h3 className="text-sm sm:text-base font-bold text-[#0f172a]">{quiz.title}</h3>
                </div>
                <span className="text-xs font-bold text-[#0f2d59] bg-amber-50 px-2.5 py-1 rounded-xl border border-amber-200 shrink-0 flex items-center gap-1">
                  <Trophy className="w-3.5 h-3.5 text-[#d97706]" />
                  {quiz.passed ? `+${quiz.points_awarded}` : `up to ${quiz.points_reward}`} pts
                </span>
              </div>
              <p className="text-xs text-[#64748b] leading-relaxed">{quiz.description}</p>
              <div className="flex items-center justify-between pt-2 border-t border-[#cbd5e1] text-xs">
                <span className="text-[11px] text-[#64748b]">
                  {quiz.questions_count} questions · ~{quiz.estimated_minutes} mins
                </span>
                <div className="flex items-center gap-2">
                  {quiz.passed && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#0f2d59] bg-[#eff6ff] px-2.5 py-1 rounded-xl">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Best {quiz.best_score}/{quiz.questions_count}
                    </span>
                  )}
                  <button
                    disabled={busy}
                    onClick={() => startQuiz(quiz.id)}
                    className="px-4 py-2 rounded-xl bg-[#0f2d59] hover:bg-[#1d4e8c] text-white font-bold text-xs shadow-xs transition-colors"
                  >
                    {quiz.passed ? 'Practice' : quiz.attempts > 0 ? 'Try again' : 'Start Challenge'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
