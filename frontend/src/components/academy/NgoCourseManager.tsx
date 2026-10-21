import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Archive, CheckCircle2, ClipboardCheck, Eye, Loader2, Pencil, Plus, Rocket, Trash2, XCircle } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Avatar } from '../common/Avatar';
import { avatarFrom } from '../../lib/mappers';
import { assetUrl } from '../../lib/api';
import {
  archiveCourse,
  deleteCourse,
  fetchCourse,
  fetchCourses,
  fetchReviewQueue,
  publishCourse,
  reviewSubmission,
  type Course,
  type CourseDetail,
  type ReviewItem,
} from '../../lib/academyApi';
import { errorText, field, formatWhen } from '../volunteer/shared';
import { CourseBuilder } from './CourseBuilder';

const STATUS_TONE = { Draft: 'bg-amber-100 text-amber-900', Published: 'bg-emerald-100 text-emerald-800', Archived: 'bg-slate-200 text-slate-700' } as const;

const ReviewCard: React.FC<{ item: ReviewItem; onDone: () => void }> = ({ item, onDone }) => {
  const { addToast } = useApp();
  const [feedback, setFeedback] = useState('');
  const [busy, setBusy] = useState<'approve' | 'reject' | null>(null);
  const [error, setError] = useState('');

  const decide = async (decision: 'approve' | 'reject') => {
    setError('');
    if (decision === 'reject' && feedback.trim().length < 5) {
      setError('Tell the learner what to fix (at least 5 characters).');
      return;
    }
    setBusy(decision);
    try {
      const r = await reviewSubmission(item.id, decision, feedback.trim() || undefined);
      addToast(
        decision === 'approve' ? (r.course_completed ? 'Approved. The learner finished the course!' : 'Task approved') : 'Sent back with feedback',
        decision === 'approve' && r.course_completed ? 'Their certificate and points were issued.' : 'The learner has been notified.',
        'success'
      );
      onDone();
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="rounded-2xl border border-[#cbd5e1] bg-white p-3.5 space-y-2.5">
      <div className="flex items-center gap-2">
        <Avatar src={avatarFrom(item.learner.avatar_url)} name={item.learner.name} size={26} />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-extrabold text-[#0f172a] truncate">{item.learner.name}</p>
          <p className="text-[11px] text-[#64748b] truncate">
            {item.course_title} · {item.lesson_title}
          </p>
        </div>
        <span className="text-[10px] text-[#64748b] shrink-0">{item.submitted_at ? formatWhen(item.submitted_at) : ''}{item.attempts > 1 ? ` · attempt ${item.attempts}` : ''}</span>
      </div>
      <details className="text-[11px] text-[#475569]">
        <summary className="cursor-pointer font-bold">The task ({item.task_mode})</summary>
        <p className="mt-1 whitespace-pre-line">{item.instructions}</p>
      </details>
      <div className="rounded-xl bg-[#f8fafc] border border-[#e2e8f0] p-2.5 space-y-2">
        <span className="text-[11px] font-extrabold text-[#0f172a]">Proof ({item.proof_type})</span>
        {item.proof_url && item.proof_type === 'photo' && (
          <a href={assetUrl(item.proof_url)} target="_blank" rel="noreferrer">
            <img src={assetUrl(item.proof_url)} alt={`Proof from ${item.learner.name}`} className="w-full max-h-64 object-cover rounded-xl border border-[#cbd5e1]" />
          </a>
        )}
        {item.proof_url && item.proof_type === 'link' && (
          <a href={item.proof_url} target="_blank" rel="noreferrer" className="text-xs text-blue-700 underline break-all block">
            {item.proof_url}
          </a>
        )}
        {item.proof_text && <p className="text-xs text-[#334155] whitespace-pre-line">{item.proof_text}</p>}
      </div>
      <input className={field} placeholder="Feedback (required when sending back)" value={feedback} onChange={(e) => setFeedback(e.target.value)} maxLength={500} aria-label="Feedback for the learner" />
      {error && <p className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl p-2">{error}</p>}
      <div className="grid grid-cols-2 gap-2">
        <button onClick={() => decide('reject')} disabled={busy !== null} className="py-2.5 rounded-xl border border-rose-300 text-rose-700 text-xs font-bold flex items-center justify-center gap-1.5 disabled:opacity-60 cursor-pointer">
          {busy === 'reject' ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />} Send back
        </button>
        <button onClick={() => decide('approve')} disabled={busy !== null} className="py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold flex items-center justify-center gap-1.5 disabled:opacity-60 cursor-pointer">
          {busy === 'approve' ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />} Approve
        </button>
      </div>
    </div>
  );
};

/** NGO Studio > Courses: author courses, publish / archive them and review task proofs. */
export const NgoCourseManager: React.FC = () => {
  const { addToast } = useApp();
  const navigate = useNavigate();
  const [courses, setCourses] = useState<Course[] | null>(null);
  const [queue, setQueue] = useState<ReviewItem[] | null>(null);
  const [building, setBuilding] = useState<{ initial?: CourseDetail } | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  const load = useCallback(() => {
    fetchCourses({ mine: true }).then((r) => setCourses(r.items)).catch(() => setCourses([]));
    fetchReviewQueue('submitted').then(setQueue).catch(() => setQueue([]));
  }, []);
  useEffect(() => load(), [load]);

  const act = async (c: Course, fn: () => Promise<unknown>, ok: string) => {
    setBusyId(c.id);
    try {
      await fn();
      addToast(ok, c.title, 'success');
      load();
    } catch (e) {
      addToast('Could not do that', errorText(e), 'info');
    } finally {
      setBusyId(null);
    }
  };

  const edit = async (c: Course) => {
    setBusyId(c.id);
    try {
      setBuilding({ initial: await fetchCourse(c.id) });
    } catch (e) {
      addToast('Could not open the course', errorText(e), 'info');
    } finally {
      setBusyId(null);
    }
  };

  if (building) {
    return (
      <CourseBuilder
        initial={building.initial}
        onCancel={() => setBuilding(null)}
        onDone={(msg) => {
          setBuilding(null);
          addToast('Saved', msg, 'success');
          load();
        }}
      />
    );
  }

  return (
    <div className="space-y-5">
      <section className="space-y-3">
        <h2 className="text-sm font-extrabold text-[#0f172a] px-1 flex items-center gap-1.5">
          <ClipboardCheck className="w-4 h-4 text-[#0f2d59]" /> Tasks waiting for your review {queue && queue.length > 0 && <span className="text-[11px] bg-rose-600 text-white rounded-full px-2 py-0.5">{queue.length}</span>}
        </h2>
        {queue === null && <Loader2 className="w-5 h-5 animate-spin text-[#64748b] mx-auto" />}
        {queue?.length === 0 && <p className="text-xs text-[#64748b] px-1">Nothing to review right now. When a learner submits proof for a task, it shows up here.</p>}
        {queue?.map((item) => (
          <ReviewCard key={item.id} item={item} onDone={load} />
        ))}
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-sm font-extrabold text-[#0f172a]">Your courses</h2>
          <button onClick={() => setBuilding({})} className="px-3 py-2 rounded-xl bg-[#0f2d59] hover:bg-[#1d4e8c] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer">
            <Plus className="w-3.5 h-3.5" /> New course
          </button>
        </div>
        {courses === null && <Loader2 className="w-5 h-5 animate-spin text-[#64748b] mx-auto" />}
        {courses?.length === 0 && <p className="text-xs text-[#64748b] px-1">No courses yet. Create one with video lectures, readings and tasks. Citizens earn a certificate when they finish.</p>}
        {courses?.map((c) => (
          <div key={c.id} className="bg-white rounded-2xl border border-[#cbd5e1] p-3.5 space-y-2.5">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="text-sm font-extrabold text-[#0f172a] leading-snug">{c.title}</h3>
                <p className="text-[11px] text-[#64748b]">
                  {c.lessons_count} lessons · {c.enrolled_count} enrolled · {c.completed_count} certified
                  {c.pending_reviews ? ` · ${c.pending_reviews} to review` : ''}
                </p>
              </div>
              <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full shrink-0 ${STATUS_TONE[c.status]}`}>{c.status}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => navigate(`/academy/${c.id}`)} className="px-3 py-1.5 rounded-lg border border-[#cbd5e1] text-[11px] font-bold text-[#0f172a] flex items-center gap-1 cursor-pointer">
                <Eye className="w-3.5 h-3.5" /> View
              </button>
              <button onClick={() => edit(c)} disabled={busyId === c.id} className="px-3 py-1.5 rounded-lg border border-[#cbd5e1] text-[11px] font-bold text-[#0f172a] flex items-center gap-1 disabled:opacity-60 cursor-pointer">
                <Pencil className="w-3.5 h-3.5" /> Edit
              </button>
              {c.status !== 'Published' && (
                <button onClick={() => act(c, () => publishCourse(c.id), 'Published')} disabled={busyId === c.id} className="px-3 py-1.5 rounded-lg bg-emerald-700 text-white text-[11px] font-bold flex items-center gap-1 disabled:opacity-60 cursor-pointer">
                  <Rocket className="w-3.5 h-3.5" /> {c.status === 'Archived' ? 'Re-publish' : 'Publish'}
                </button>
              )}
              {c.status === 'Published' && (
                <button onClick={() => act(c, () => archiveCourse(c.id), 'Archived')} disabled={busyId === c.id} className="px-3 py-1.5 rounded-lg border border-amber-300 text-amber-800 text-[11px] font-bold flex items-center gap-1 disabled:opacity-60 cursor-pointer">
                  <Archive className="w-3.5 h-3.5" /> Archive
                </button>
              )}
              {c.enrolled_count === 0 && (
                <button
                  onClick={() => window.confirm(`Delete "${c.title}"? This cannot be undone.`) && act(c, () => deleteCourse(c.id), 'Deleted')}
                  disabled={busyId === c.id}
                  className="px-3 py-1.5 rounded-lg border border-rose-300 text-rose-700 text-[11px] font-bold flex items-center gap-1 disabled:opacity-60 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </button>
              )}
            </div>
          </div>
        ))}
      </section>
    </div>
  );
};
