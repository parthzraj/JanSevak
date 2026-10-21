import React, { useState } from 'react';
import { ArrowDown, ArrowUp, ClipboardCheck, FileText, Loader2, PlayCircle, Plus, Trash2, Wand2 } from 'lucide-react';
import {
  CATEGORIES,
  LEVELS,
  createCourse,
  publishCourse,
  updateCourse,
  type CourseDetail,
  type LessonDraft,
  type LessonKind,
  type ProofType,
  type TaskMode,
} from '../../lib/academyApi';
import { errorText, field } from '../volunteer/shared';
import { detectVideoSeconds } from './youtube';

interface LessonForm {
  key: number;
  kind: LessonKind;
  title: string;
  summary: string;
  video_url: string;
  minutes: string;
  seconds: string;
  body: string;
  task_mode: TaskMode;
  proof_type: ProofType;
  instructions: string;
  detecting?: boolean;
  detectMsg?: string;
}

let nextKey = 1;
const blank = (kind: LessonKind): LessonForm => ({
  key: nextKey++,
  kind,
  title: '',
  summary: '',
  video_url: '',
  minutes: '',
  seconds: '',
  body: '',
  task_mode: 'physical',
  proof_type: 'photo',
  instructions: '',
});

const fromLesson = (l: CourseDetail['lessons'][number]): LessonForm => {
  const total = l.duration_seconds || 0;
  return {
    ...blank(l.kind),
    title: l.title,
    summary: l.summary,
    video_url: l.video_kind === 'youtube' ? `https://www.youtube.com/watch?v=${l.video_ref}` : l.video_ref || '',
    minutes: l.kind === 'video' ? String(Math.floor(total / 60)) : '',
    seconds: l.kind === 'video' ? String(total % 60) : '',
    body: l.body || '',
    task_mode: l.task_mode || 'physical',
    proof_type: l.proof_type || 'photo',
    instructions: l.instructions || '',
  };
};

const toDraft = (f: LessonForm): LessonDraft => {
  const base = { kind: f.kind, title: f.title.trim(), summary: f.summary.trim() };
  if (f.kind === 'video') return { ...base, video_url: f.video_url.trim(), duration_seconds: (Number(f.minutes) || 0) * 60 + (Number(f.seconds) || 0) || null };
  if (f.kind === 'reading') return { ...base, body: f.body.trim() };
  return { ...base, task_mode: f.task_mode, proof_type: f.proof_type, instructions: f.instructions.trim() };
};

const KIND_LABEL = { video: 'Video lecture', reading: 'Reading', task: 'Task' } as const;
const KIND_ICON = { video: PlayCircle, reading: FileText, task: ClipboardCheck } as const;

interface Props {
  initial?: CourseDetail;
  onDone: (message: string) => void;
  onCancel: () => void;
}

export const CourseBuilder: React.FC<Props> = ({ initial, onDone, onCancel }) => {
  const [title, setTitle] = useState(initial?.title ?? '');
  const [summary, setSummary] = useState(initial?.summary ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [level, setLevel] = useState<string>(initial?.level ?? 'Beginner');
  const [category, setCategory] = useState<string>(initial?.category ?? 'Civic basics');
  const [lessons, setLessons] = useState<LessonForm[]>(initial ? initial.lessons.map(fromLesson) : []);
  const [busy, setBusy] = useState<'draft' | 'publish' | null>(null);
  const [error, setError] = useState('');
  const locked = !!initial && initial.enrolled_count > 0; // lessons are frozen once people enrolled

  const set = (key: number, patch: Partial<LessonForm>) => setLessons((ls) => ls.map((l) => (l.key === key ? { ...l, ...patch } : l)));
  const move = (i: number, d: -1 | 1) =>
    setLessons((ls) => {
      const j = i + d;
      if (j < 0 || j >= ls.length) return ls;
      const copy = [...ls];
      [copy[i], copy[j]] = [copy[j], copy[i]];
      return copy;
    });

  const detect = async (l: LessonForm) => {
    if (!l.video_url.trim()) return;
    set(l.key, { detecting: true, detectMsg: '' });
    try {
      const secs = await detectVideoSeconds(l.video_url.trim());
      set(l.key, { detecting: false, minutes: String(Math.floor(secs / 60)), seconds: String(secs % 60), detectMsg: `Length found: ${Math.floor(secs / 60)} min ${secs % 60} s` });
    } catch {
      set(l.key, { detecting: false, detectMsg: 'Could not read the length automatically. Please type it in.' });
    }
  };

  const save = async (publish: boolean) => {
    setError('');
    setBusy(publish ? 'publish' : 'draft');
    try {
      const meta = { title: title.trim(), summary: summary.trim(), description: description.trim(), level, category };
      let course: CourseDetail;
      if (initial) {
        course = await updateCourse(initial.id, locked ? meta : { ...meta, lessons: lessons.map(toDraft) });
        if (publish && course.status !== 'Published') course = await publishCourse(course.id);
      } else {
        course = await createCourse({ ...meta, lessons: lessons.map(toDraft), publish });
      }
      onDone(course.status === 'Published' ? 'Course published. Citizens can enroll now.' : 'Draft saved. Publish it when it is ready.');
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(null);
    }
  };

  const words = (s: string) => s.trim().split(/\s+/).filter(Boolean).length;

  return (
    <div className="bg-white rounded-3xl p-5 border border-[#cbd5e1] space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-extrabold text-[#0f172a]">{initial ? 'Edit course' : 'New course'}</h2>
        <button onClick={onCancel} className="text-xs font-bold text-[#64748b] cursor-pointer">
          Cancel
        </button>
      </div>

      <input className={field} placeholder="Course title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={150} aria-label="Course title" />
      <input className={field} placeholder="One-line summary shown on the course card" value={summary} onChange={(e) => setSummary(e.target.value)} maxLength={300} aria-label="Summary" />
      <textarea className={field} rows={3} placeholder="What will people learn and be able to do? (shown on the course page)" value={description} onChange={(e) => setDescription(e.target.value)} maxLength={5000} aria-label="Description" />
      <div className="grid grid-cols-2 gap-2">
        <select className={field} value={level} onChange={(e) => setLevel(e.target.value)} aria-label="Level">
          {LEVELS.map((l) => (
            <option key={l}>{l}</option>
          ))}
        </select>
        <select className={field} value={category} onChange={(e) => setCategory(e.target.value)} aria-label="Topic">
          {CATEGORIES.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </div>

      {locked && (
        <p className="text-[11px] text-amber-900 bg-amber-50 border border-amber-200 rounded-xl p-2.5">
          {initial!.enrolled_count} {initial!.enrolled_count > 1 ? 'people have' : 'person has'} already enrolled, so the lessons are frozen to keep their progress fair. You can still change the title and descriptions. To change lessons, archive this course and publish a new version.
        </p>
      )}

      <div className="space-y-3">
        <h3 className="text-xs font-extrabold text-[#0f172a]">Lessons ({lessons.length}). Learners do them in this order.</h3>
        {lessons.map((l, i) => {
          const Icon = KIND_ICON[l.kind];
          return (
            <div key={l.key} className="rounded-2xl border border-[#cbd5e1] p-3 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-extrabold text-[#0f2d59] flex items-center gap-1.5">
                  <Icon className="w-4 h-4" /> Lesson {i + 1} · {KIND_LABEL[l.kind]}
                </span>
                {!locked && (
                  <span className="flex items-center gap-1">
                    <button type="button" onClick={() => move(i, -1)} disabled={i === 0} aria-label={`Move lesson ${i + 1} up`} className="p-1 text-[#475569] disabled:opacity-30 cursor-pointer">
                      <ArrowUp className="w-4 h-4" />
                    </button>
                    <button type="button" onClick={() => move(i, 1)} disabled={i === lessons.length - 1} aria-label={`Move lesson ${i + 1} down`} className="p-1 text-[#475569] disabled:opacity-30 cursor-pointer">
                      <ArrowDown className="w-4 h-4" />
                    </button>
                    <button type="button" onClick={() => setLessons((ls) => ls.filter((x) => x.key !== l.key))} aria-label={`Remove lesson ${i + 1}`} className="p-1 text-rose-600 cursor-pointer">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </span>
                )}
              </div>
              <fieldset disabled={locked} className="space-y-2 min-w-0">
                <input className={field} placeholder="Lesson title" value={l.title} onChange={(e) => set(l.key, { title: e.target.value })} maxLength={150} aria-label={`Lesson ${i + 1} title`} />
                <input className={field} placeholder="What will the learner learn or do here? (visible before enrolling)" value={l.summary} onChange={(e) => set(l.key, { summary: e.target.value })} maxLength={500} aria-label={`Lesson ${i + 1} summary`} />

                {l.kind === 'video' && (
                  <>
                    <div className="flex gap-2">
                      <input className={field} placeholder="YouTube link, or a direct .mp4 / .webm link" value={l.video_url} onChange={(e) => set(l.key, { video_url: e.target.value, detectMsg: '' })} onBlur={() => !l.minutes && !l.seconds && detect(l)} aria-label={`Lesson ${i + 1} video link`} />
                      <button type="button" onClick={() => detect(l)} disabled={l.detecting || !l.video_url.trim()} className="shrink-0 px-3 rounded-xl border border-[#0f2d59]/40 text-[11px] font-bold text-[#0f2d59] flex items-center gap-1 disabled:opacity-50 cursor-pointer">
                        {l.detecting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wand2 className="w-3.5 h-3.5" />} Detect length
                      </button>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-[#475569]">
                      <span>Length</span>
                      <input type="number" min={0} className={`${field} w-20`} placeholder="min" value={l.minutes} onChange={(e) => set(l.key, { minutes: e.target.value })} aria-label={`Lesson ${i + 1} minutes`} />
                      <span>min</span>
                      <input type="number" min={0} max={59} className={`${field} w-20`} placeholder="sec" value={l.seconds} onChange={(e) => set(l.key, { seconds: e.target.value })} aria-label={`Lesson ${i + 1} seconds`} />
                      <span>sec</span>
                    </div>
                    {l.detectMsg && <p className="text-[11px] text-[#0f2d59]">{l.detectMsg}</p>}
                    <p className="text-[10px] text-[#64748b]">The length must be right: learners have to really watch 90% of it before they can continue.</p>
                  </>
                )}

                {l.kind === 'reading' && (
                  <>
                    <textarea className={field} rows={6} placeholder="Write the lesson text. Leave a blank line between paragraphs." value={l.body} onChange={(e) => set(l.key, { body: e.target.value })} maxLength={20000} aria-label={`Lesson ${i + 1} text`} />
                    <p className="text-[10px] text-[#64748b]">
                      {words(l.body)} words · learners must stay on the page for about {Math.max(10, Math.min(300, Math.round(words(l.body) * 0.144)))} s
                    </p>
                  </>
                )}

                {l.kind === 'task' && (
                  <>
                    <div className="grid grid-cols-2 gap-2">
                      <select className={field} value={l.task_mode} onChange={(e) => set(l.key, { task_mode: e.target.value as TaskMode })} aria-label={`Lesson ${i + 1} task mode`}>
                        <option value="physical">Physical task (done in person)</option>
                        <option value="online">Online task</option>
                      </select>
                      <select className={field} value={l.proof_type} onChange={(e) => set(l.key, { proof_type: e.target.value as ProofType })} aria-label={`Lesson ${i + 1} proof type`}>
                        <option value="photo">Proof: a photo</option>
                        <option value="link">Proof: a link</option>
                        <option value="text">Proof: written answer</option>
                      </select>
                    </div>
                    <textarea className={field} rows={4} placeholder="Say exactly what the learner must do and what the proof must show. You will approve or reject each submission." value={l.instructions} onChange={(e) => set(l.key, { instructions: e.target.value })} maxLength={2000} aria-label={`Lesson ${i + 1} instructions`} />
                  </>
                )}
              </fieldset>
            </div>
          );
        })}

        {!locked && (
          <div className="grid grid-cols-3 gap-2">
            {(['video', 'reading', 'task'] as const).map((k) => {
              const Icon = KIND_ICON[k];
              return (
                <button key={k} type="button" onClick={() => setLessons((ls) => [...ls, blank(k)])} className="py-2.5 rounded-xl border border-dashed border-[#0f2d59]/40 text-[11px] font-bold text-[#0f2d59] flex items-center justify-center gap-1 cursor-pointer">
                  <Plus className="w-3.5 h-3.5" /> <Icon className="w-3.5 h-3.5" /> {k === 'video' ? 'Video' : k === 'reading' ? 'Reading' : 'Task'}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <p className="text-[10px] text-[#64748b]">
        To publish: at least 2 lessons and about 5 minutes of material. JanSevak pays the points (60 per course, outside the daily cap) and issues the certificate when a learner has finished every lesson and you have approved every task.
      </p>
      {error && <p className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl p-2.5">{error}</p>}
      <div className="flex gap-2">
        <button onClick={() => save(false)} disabled={busy !== null} className="flex-1 py-3 rounded-xl border border-[#0f2d59] text-[#0f2d59] text-xs font-bold disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer">
          {busy === 'draft' && <Loader2 className="w-4 h-4 animate-spin" />} {initial ? 'Save changes' : 'Save draft'}
        </button>
        {(!initial || initial.status !== 'Published') && (
          <button onClick={() => save(true)} disabled={busy !== null} className="flex-1 py-3 rounded-xl bg-[#0f2d59] hover:bg-[#1d4e8c] text-white text-xs font-bold disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer">
            {busy === 'publish' && <Loader2 className="w-4 h-4 animate-spin" />} Publish course
          </button>
        )}
      </div>
    </div>
  );
};
