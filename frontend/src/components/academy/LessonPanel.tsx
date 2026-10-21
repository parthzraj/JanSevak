import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowRight, CheckCircle2, Clock, ImagePlus, Loader2, MessageSquareWarning, ShieldCheck } from 'lucide-react';
import { assetUrl, uploadImageDataUrl } from '../../lib/api';
import {
  completeLesson,
  formatDuration,
  openLesson,
  sendHeartbeat,
  submitTask,
  type CourseDetail,
  type Lesson,
  type Progress,
} from '../../lib/academyApi';
import { errorText, field } from '../volunteer/shared';
import { SecureVideo } from './SecureVideo';

interface Props {
  course: CourseDetail;
  lesson: Lesson;
  /** Called with every server response so the page's progress bar stays in sync. */
  onProgress: (p: Progress) => void;
  /** Called after a lesson is finished so the page can move on. */
  onFinished: (p: Progress) => void;
}

const Banner: React.FC<{ tone: 'ok' | 'wait' | 'bad'; children: React.ReactNode }> = ({ tone, children }) => (
  <div
    className={`rounded-2xl border p-3 text-xs flex items-start gap-2 ${
      tone === 'ok' ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : tone === 'wait' ? 'bg-amber-50 border-amber-200 text-amber-900' : 'bg-rose-50 border-rose-200 text-rose-900'
    }`}
  >
    {children}
  </div>
);

const Proof: React.FC<{ lesson: Lesson }> = ({ lesson }) => (
  <div className="rounded-2xl border border-[#cbd5e1] bg-white p-3 space-y-2">
    <span className="text-[11px] font-extrabold text-[#0f172a]">Your proof</span>
    {lesson.proof_url && lesson.proof_type === 'photo' && (
      <a href={assetUrl(lesson.proof_url)} target="_blank" rel="noreferrer">
        <img src={assetUrl(lesson.proof_url)} alt="Submitted proof" className="w-full max-h-64 object-cover rounded-xl border border-[#cbd5e1]" />
      </a>
    )}
    {lesson.proof_url && lesson.proof_type === 'link' && (
      <a href={lesson.proof_url} target="_blank" rel="noreferrer" className="text-xs text-blue-700 underline break-all">
        {lesson.proof_url}
      </a>
    )}
    {lesson.proof_text && <p className="text-xs text-[#334155] whitespace-pre-line">{lesson.proof_text}</p>}
  </div>
);

export const LessonPanel: React.FC<Props> = ({ course, lesson: initial, onProgress, onFinished }) => {
  const [lesson, setLesson] = useState<Lesson>(initial);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const resumeAt = useRef(initial.resume_seconds);
  const [openedAt, setOpenedAt] = useState(0);
  const [now, setNow] = useState(Date.now());

  // opening a lesson starts the server-side clocks and returns its content
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    openLesson(course.id, initial.id)
      .then((p) => {
        if (cancelled) return;
        resumeAt.current = p.lesson.resume_seconds;
        setLesson(p.lesson);
        setOpenedAt(Date.now());
        setLoading(false);
        onProgress(p);
      })
      .catch((e) => {
        if (cancelled) return;
        setError(errorText(e));
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [course.id, initial.id]);

  useEffect(() => {
    if (lesson.kind !== 'reading' || lesson.state === 'done') return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [lesson.kind, lesson.state]);

  const beat = useCallback(
    (position: number) => {
      sendHeartbeat(course.id, lesson.id, position)
        .then((p) => {
          setLesson(p.lesson);
          onProgress(p);
        })
        .catch(() => undefined);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [course.id, lesson.id]
  );

  const finish = async () => {
    setBusy(true);
    setError('');
    try {
      const p = await completeLesson(course.id, lesson.id);
      setLesson(p.lesson);
      onFinished(p);
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-5 h-5 animate-spin text-[#64748b]" />
      </div>
    );
  }
  if (error && !lesson.state) return <Banner tone="bad">{error}</Banner>;

  const done = lesson.state === 'done';

  return (
    <div className="space-y-3">
      {/* ------------------------------------------------------------ video */}
      {lesson.kind === 'video' && lesson.video_kind && lesson.video_ref && (
        <>
          {done ? (
            <Banner tone="ok">
              <CheckCircle2 className="w-4 h-4 shrink-0" /> You finished this video. You can watch it again any time; it no longer counts toward progress.
            </Banner>
          ) : (
            <Banner tone="wait">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>
                You must really watch at least 90% ({formatDuration(lesson.required_seconds)} of {formatDuration(lesson.duration_seconds || 0)}). Skipping ahead is blocked and the video pauses if you leave this tab.
              </span>
            </Banner>
          )}
          <SecureVideo
            key={lesson.id}
            kind={lesson.video_kind}
            videoRef={lesson.video_ref}
            durationSeconds={lesson.duration_seconds || 0}
            resumeSeconds={resumeAt.current}
            onBeat={done ? () => undefined : beat}
            onEnded={() => undefined}
          />
          {!done && (
            <>
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] font-semibold text-[#0f172a]">
                  <span>Watched</span>
                  <span className="tabular-nums">
                    {Math.min(100, Math.round((lesson.watched_seconds * 100) / Math.max(1, lesson.duration_seconds || 1)))}% · need 90%
                  </span>
                </div>
                <div className="h-2 rounded-full bg-[#e2e8f0] overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 transition-all"
                    style={{ width: `${Math.min(100, (lesson.watched_seconds * 100) / Math.max(1, lesson.duration_seconds || 1))}%` }}
                  />
                </div>
              </div>
              <button
                onClick={finish}
                disabled={busy || lesson.watched_seconds < lesson.required_seconds}
                className="w-full py-3 rounded-xl bg-[#0f2d59] hover:bg-[#1d4e8c] disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold flex items-center justify-center gap-1.5"
              >
                {busy && <Loader2 className="w-4 h-4 animate-spin" />}
                {lesson.watched_seconds < lesson.required_seconds ? 'Keep watching to continue' : 'Mark lesson complete'}
                {lesson.watched_seconds >= lesson.required_seconds && <ArrowRight className="w-4 h-4" />}
              </button>
            </>
          )}
        </>
      )}

      {/* ---------------------------------------------------------- reading */}
      {lesson.kind === 'reading' && (
        <>
          <div className="rounded-2xl border border-[#cbd5e1] bg-white p-4 space-y-3 text-[13px] leading-relaxed text-[#1e293b]">
            {(lesson.body || '').split(/\n{2,}/).map((para, i) => (
              <p key={i} className="whitespace-pre-line">
                {para}
              </p>
            ))}
          </div>
          {!done && (
            <ReadingGate
              required={lesson.required_seconds}
              elapsed={Math.floor((now - openedAt) / 1000)}
              busy={busy}
              onDone={finish}
            />
          )}
          {done && (
            <Banner tone="ok">
              <CheckCircle2 className="w-4 h-4 shrink-0" /> Lesson completed.
            </Banner>
          )}
        </>
      )}

      {/* ------------------------------------------------------------- task */}
      {lesson.kind === 'task' && (
        <TaskPanel
          course={course}
          lesson={lesson}
          onUpdate={(p) => {
            setLesson(p.lesson);
            onProgress(p);
          }}
        />
      )}

      {error && <p className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl p-2.5">{error}</p>}
    </div>
  );
};

const ReadingGate: React.FC<{ required: number; elapsed: number; busy: boolean; onDone: () => void }> = ({ required, elapsed, busy, onDone }) => {
  const remaining = Math.max(0, required - elapsed);
  return (
    <button
      onClick={onDone}
      disabled={busy || remaining > 0}
      className="w-full py-3 rounded-xl bg-[#0f2d59] hover:bg-[#1d4e8c] disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold flex items-center justify-center gap-1.5"
    >
      {busy && <Loader2 className="w-4 h-4 animate-spin" />}
      {remaining > 0 ? (
        <>
          <Clock className="w-4 h-4" /> Read the lesson ({remaining}s)
        </>
      ) : (
        <>
          Mark lesson complete <ArrowRight className="w-4 h-4" />
        </>
      )}
    </button>
  );
};

const PROOF_HELP = {
  photo: 'Upload one clear photo as proof.',
  link: 'Paste a link (https://...) as proof, for example a shared document or a post.',
  text: 'Describe what you did in your own words (at least 20 characters).',
} as const;

const TaskPanel: React.FC<{ course: CourseDetail; lesson: Lesson; onUpdate: (p: Progress) => void }> = ({ course, lesson, onUpdate }) => {
  const [photo, setPhoto] = useState<string | null>(null);
  const [link, setLink] = useState('');
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const type = lesson.proof_type || 'text';
  const canSubmit = lesson.state === 'available' || lesson.state === 'in_progress' || lesson.state === 'rejected';

  const pick = (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/') || file.size > 8 * 1024 * 1024) {
      setError('Choose an image under 8 MB.');
      return;
    }
    setError('');
    const reader = new FileReader();
    reader.onload = () => setPhoto(String(reader.result));
    reader.readAsDataURL(file);
  };

  const submit = async () => {
    setError('');
    setBusy(true);
    try {
      const proof: { proof_text?: string; proof_url?: string } = {};
      if (type === 'photo') {
        if (!photo) throw new Error('Choose a photo first.');
        proof.proof_url = await uploadImageDataUrl(photo);
        if (text.trim()) proof.proof_text = text.trim();
      } else if (type === 'link') {
        proof.proof_url = link.trim();
        if (text.trim()) proof.proof_text = text.trim();
      } else {
        proof.proof_text = text.trim();
      }
      onUpdate(await submitTask(course.id, lesson.id, proof));
      setPhoto(null);
    } catch (e) {
      setError(e instanceof Error && !('status' in e) ? e.message : errorText(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="rounded-2xl border border-[#cbd5e1] bg-white p-4 space-y-2">
        <div className="flex flex-wrap gap-1.5">
          <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${lesson.task_mode === 'physical' ? 'bg-orange-50 text-orange-800' : 'bg-blue-50 text-blue-800'}`}>
            {lesson.task_mode === 'physical' ? 'Physical task: do it in person' : 'Online task: do it on your phone or computer'}
          </span>
          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">Proof: {type}</span>
          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800">Checked by {course.ngo.name}</span>
        </div>
        <p className="text-[13px] leading-relaxed text-[#1e293b] whitespace-pre-line">{lesson.instructions}</p>
      </div>

      {lesson.state === 'done' && (
        <>
          <Banner tone="ok">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>
              Approved by {course.ngo.name}.{lesson.feedback ? ` “${lesson.feedback}”` : ''}
            </span>
          </Banner>
          <Proof lesson={lesson} />
        </>
      )}

      {lesson.state === 'submitted' && (
        <>
          <Banner tone="wait">
            <Clock className="w-4 h-4 shrink-0" />
            <span>Your proof is with {course.ngo.name} for review. You will get a notification when it is checked. The next lesson opens once it is approved.</span>
          </Banner>
          <Proof lesson={lesson} />
        </>
      )}

      {lesson.state === 'rejected' && (
        <Banner tone="bad">
          <MessageSquareWarning className="w-4 h-4 shrink-0" />
          <span>
            <strong>Sent back by {course.ngo.name}:</strong> {lesson.feedback || 'Please try again.'}
          </span>
        </Banner>
      )}

      {canSubmit && (
        <div className="rounded-2xl border border-[#cbd5e1] bg-white p-4 space-y-3">
          <span className="text-xs font-extrabold text-[#0f172a]">{lesson.state === 'rejected' ? 'Submit again' : 'Submit your proof'}</span>
          <p className="text-[11px] text-[#64748b]">{PROOF_HELP[type]}</p>

          {type === 'photo' && (
            <>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => pick(e.target.files?.[0])} />
              {photo ? (
                <div className="relative">
                  <img src={photo} alt="Proof preview" className="w-full max-h-64 object-cover rounded-xl border border-[#cbd5e1]" />
                  <button type="button" onClick={() => setPhoto(null)} className="absolute top-2 right-2 text-[11px] font-bold bg-white/90 rounded-lg px-2 py-1">
                    Remove
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="w-full py-6 rounded-xl border border-dashed border-[#0f2d59]/40 text-xs font-bold text-[#0f2d59] flex flex-col items-center gap-1.5 cursor-pointer"
                >
                  <ImagePlus className="w-5 h-5" /> Choose a photo
                </button>
              )}
            </>
          )}
          {type === 'link' && <input className={field} placeholder="https://..." value={link} onChange={(e) => setLink(e.target.value)} aria-label="Proof link" />}
          {type === 'text' ? (
            <textarea className={field} rows={4} placeholder="What you did, step by step" value={text} onChange={(e) => setText(e.target.value)} aria-label="Proof description" maxLength={2000} />
          ) : (
            <textarea className={field} rows={2} placeholder="Add a note for the reviewer (optional)" value={text} onChange={(e) => setText(e.target.value)} aria-label="Note for the reviewer" maxLength={2000} />
          )}

          {error && <p className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl p-2.5">{error}</p>}
          <button
            onClick={submit}
            disabled={busy}
            className="w-full py-3 rounded-xl bg-[#0f2d59] hover:bg-[#1d4e8c] disabled:opacity-60 text-white text-xs font-bold flex items-center justify-center gap-2"
          >
            {busy && <Loader2 className="w-4 h-4 animate-spin" />} Send for review
          </button>
        </div>
      )}
    </div>
  );
};
