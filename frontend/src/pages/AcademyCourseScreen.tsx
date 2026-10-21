import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Award,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  Circle,
  Clock,
  FileText,
  ListChecks,
  Loader2,
  Lock,
  PlayCircle,
  ShieldCheck,
  ClipboardCheck,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Avatar } from '../components/common/Avatar';
import { avatarFrom } from '../lib/mappers';
import { LessonPanel } from '../components/academy/LessonPanel';
import { CertificateModal } from '../components/academy/CertificateModal';
import {
  enrollInCourse,
  fetchCourse,
  formatDuration,
  verifyCertificate,
  type Certificate,
  type CourseDetail,
  type Lesson,
  type Progress,
} from '../lib/academyApi';
import { errorText } from '../components/volunteer/shared';
import { Chip, courseMeta } from './AcademyScreen';

const KIND_ICON = { video: PlayCircle, reading: FileText, task: ClipboardCheck } as const;

const lessonMeta = (l: Lesson) => {
  if (l.kind === 'video') return `Video · ${formatDuration(l.duration_seconds || 0)} · watch at least 90%`;
  if (l.kind === 'reading') return `Reading · stay on the page at least ${formatDuration(l.required_seconds)}`;
  return `${l.task_mode === 'physical' ? 'Physical task' : 'Online task'} · ${l.proof_type} proof · checked by the NGO`;
};

const StateIcon: React.FC<{ lesson: Lesson; enrolled: boolean }> = ({ lesson, enrolled }) => {
  if (!enrolled) return <Circle className="w-5 h-5 text-[#cbd5e1]" />;
  switch (lesson.state) {
    case 'done':
      return <CheckCircle2 className="w-5 h-5 text-emerald-600" />;
    case 'locked':
      return <Lock className="w-4 h-4 text-[#94a3b8]" />;
    case 'submitted':
      return <Clock className="w-5 h-5 text-amber-600" />;
    case 'rejected':
      return <Circle className="w-5 h-5 text-rose-500" />;
    default:
      return <Circle className="w-5 h-5 text-[#0f2d59]" />;
  }
};

const STATE_LABEL: Record<string, { text: string; tone: string }> = {
  done: { text: 'Done', tone: 'bg-emerald-50 text-emerald-800' },
  submitted: { text: 'In review', tone: 'bg-amber-50 text-amber-800' },
  rejected: { text: 'Needs changes', tone: 'bg-rose-50 text-rose-700' },
  in_progress: { text: 'In progress', tone: 'bg-blue-50 text-blue-800' },
  locked: { text: 'Locked', tone: 'bg-slate-100 text-slate-500' },
};

export const AcademyCourseScreen: React.FC = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { addToast, refreshData } = useApp();
  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [error, setError] = useState('');
  const [openId, setOpenId] = useState<number | null>(null);
  const [enrolling, setEnrolling] = useState(false);
  const [cert, setCert] = useState<Certificate | null>(null);

  const load = useCallback(
    async (focusNext = false) => {
      try {
        const c = await fetchCourse(courseId!);
        setCourse(c);
        setError('');
        if (focusNext) setOpenId(c.my && !c.my.completed ? c.my.next_lesson_id : null);
        return c;
      } catch (e) {
        setError(errorText(e));
        return null;
      }
    },
    [courseId]
  );

  useEffect(() => {
    load(true);
  }, [load]);

  if (error && !course) {
    return (
      <div className="px-4 pt-6 space-y-3">
        <button onClick={() => navigate('/academy')} className="flex items-center gap-1 text-xs font-bold text-[#0f2d59] cursor-pointer">
          <ChevronLeft className="w-4 h-4" /> Civic Academy
        </button>
        <p className="text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-xl p-3">{error}</p>
      </div>
    );
  }
  if (!course) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-[#64748b]" />
      </div>
    );
  }

  const enrolled = !!course.my;
  const done = course.my?.completed;
  const doneCount = course.lessons.filter((l) => l.state === 'done').length;

  const enroll = async () => {
    setEnrolling(true);
    try {
      const c = await enrollInCourse(course.id);
      setCourse(c);
      setOpenId(c.my?.next_lesson_id ?? null);
      addToast('You are enrolled', 'Start with lesson 1. Each lesson unlocks when the previous one is done.', 'success');
    } catch (e) {
      addToast('Could not enroll', errorText(e), 'info');
    } finally {
      setEnrolling(false);
    }
  };

  const onProgress = (p: Progress) =>
    setCourse((prev) =>
      prev ? { ...prev, my: p.enrollment, lessons: prev.lessons.map((l) => (l.id === p.lesson.id ? { ...l, ...p.lesson } : l)) } : prev
    );

  const onFinished = async (p: Progress) => {
    onProgress(p);
    p.notes.forEach((n) => addToast('Course update', n, 'info'));
    const fresh = await load();
    if (p.certificate) {
      addToast(
        p.enrollment.points_awarded ? `Course completed! +${p.enrollment.points_awarded} points` : 'Course completed!',
        'Your certificate is ready.',
        'reward'
      );
      setCert(p.certificate);
      setOpenId(null);
      refreshData().catch(() => undefined);
    } else {
      addToast('Lesson complete', 'The next lesson is unlocked.', 'success');
      setOpenId(fresh?.my?.next_lesson_id ?? null);
    }
  };

  const showCertificate = async () => {
    if (!course.my?.certificate_code) return;
    try {
      setCert(await verifyCertificate(course.my.certificate_code));
    } catch (e) {
      addToast('Could not load the certificate', errorText(e), 'info');
    }
  };

  const toggle = (l: Lesson) => {
    if (enrolled && l.state === 'locked') {
      addToast('Locked', 'Finish the previous lesson first.', 'info');
      return;
    }
    setOpenId((cur) => (cur === l.id ? null : l.id));
  };

  return (
    <div className="flex-1 flex flex-col px-3.5 sm:px-4 pt-3 pb-40 space-y-4">
      <button onClick={() => navigate('/academy')} className="flex items-center gap-1 text-xs font-bold text-[#0f2d59] hover:underline self-start cursor-pointer">
        <ChevronLeft className="w-4 h-4" /> Civic Academy
      </button>

      {/* ------------------------------------------------------------ header */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-[#cbd5e1] shadow-xs space-y-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <Chip tone="bg-[#eff6ff] text-[#0f2d59]">{course.level}</Chip>
          <Chip tone="bg-emerald-50 text-emerald-800">{course.category}</Chip>
          {course.status !== 'Published' && <Chip tone="bg-amber-100 text-amber-900">{course.status}</Chip>}
        </div>
        <h1 className="text-lg font-extrabold text-[#0f172a] leading-snug">{course.title}</h1>
        <div className="flex items-center gap-2">
          <Avatar src={avatarFrom(course.ngo.avatar_url)} name={course.ngo.name} size={22} />
          <span className="text-xs font-semibold text-[#334155]">{course.ngo.name}</span>
          <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">NGO</span>
        </div>
        <p className="text-[13px] text-[#334155] leading-relaxed whitespace-pre-line">{course.description}</p>
        <div className="grid grid-cols-3 gap-2 text-center">
          {[
            [String(course.lessons_count), 'lessons'],
            [`~${course.estimated_minutes} min`, 'in total'],
            [`+${course.points}`, 'points'],
          ].map(([a, b]) => (
            <div key={b} className="rounded-2xl bg-[#f8fafc] border border-[#e2e8f0] py-2">
              <div className="text-sm font-extrabold text-[#0f2d59]">{a}</div>
              <div className="text-[10px] text-[#64748b]">{b}</div>
            </div>
          ))}
        </div>
        <p className="text-[11px] text-[#64748b]">{courseMeta(course)} · {course.enrolled_count} enrolled · {course.completed_count} certified</p>
      </div>

      {/* ----------------------------------------------- progress / enroll card */}
      {course.is_owner ? (
        <div className="rounded-3xl border border-blue-200 bg-blue-50 p-4 text-xs text-blue-900 space-y-1.5">
          <p className="font-extrabold">You are viewing this as the course author.</p>
          <p>
            {course.enrolled_count} enrolled, {course.completed_count} certified
            {course.pending_reviews ? `, ${course.pending_reviews} task${course.pending_reviews > 1 ? 's' : ''} waiting for your review` : ''}. Learners only see lesson content after they enroll.
          </p>
          <button onClick={() => navigate('/ngo')} className="font-bold underline cursor-pointer">
            Open NGO Studio
          </button>
        </div>
      ) : enrolled ? (
        <div className="bg-white rounded-3xl border border-[#cbd5e1] p-4 space-y-3 shadow-xs">
          <div className="flex items-center justify-between text-xs">
            <span className="font-extrabold text-[#0f172a]">Your progress</span>
            <span className="font-extrabold text-[#0f2d59] tabular-nums">{course.my!.percent}% completed</span>
          </div>
          <div className="h-2.5 bg-[#f1f5f9] rounded-full overflow-hidden border border-[#cbd5e1]" role="progressbar" aria-valuenow={course.my!.percent} aria-valuemin={0} aria-valuemax={100}>
            <div className="h-full bg-gradient-to-r from-[#0f2d59] to-[#1d4e8c] rounded-full transition-all" style={{ width: `${course.my!.percent}%` }} />
          </div>
          <p className="text-[11px] text-[#64748b]">
            {doneCount} of {course.lessons_count} lessons done
          </p>
          {done ? (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-2">
              <Award className="w-8 h-8 text-emerald-700 mx-auto" />
              <h4 className="text-sm font-extrabold text-emerald-900">Course completed</h4>
              <p className="text-xs text-emerald-900/80">
                {course.my!.points_awarded ? `You earned ${course.my!.points_awarded} points and a certificate.` : 'Your certificate is ready.'}
              </p>
              <button onClick={showCertificate} className="w-full py-2.5 bg-[#0f2d59] text-white text-xs font-bold rounded-xl cursor-pointer">
                View my certificate
              </button>
            </div>
          ) : (
            <p className="text-[11px] text-[#475569]">The certificate and {course.points} points appear only after every lesson is done and every task is approved.</p>
          )}
        </div>
      ) : (
        <button
          onClick={enroll}
          disabled={enrolling}
          className="w-full py-3.5 rounded-2xl bg-[#0f2d59] hover:bg-[#1d4e8c] disabled:opacity-60 text-white text-sm font-extrabold flex items-center justify-center gap-2 shadow-sm cursor-pointer"
        >
          {enrolling && <Loader2 className="w-4 h-4 animate-spin" />} Enroll for free
        </button>
      )}

      {/* ------------------------------------------------------ how it works */}
      <div className="rounded-3xl border border-[#cbd5e1] bg-white p-4 space-y-2">
        <h2 className="text-sm font-extrabold text-[#0f172a] flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-700" /> How this course is verified
        </h2>
        <ul className="text-xs text-[#334155] space-y-1.5 list-disc pl-4 leading-relaxed">
          <li>Lessons open one at a time, in order. You cannot jump ahead.</li>
          <li>Videos must be watched, at least 90%. Dragging the playhead forward is blocked and the video pauses if you switch tabs.</li>
          <li>Readings need a minimum time on the page.</li>
          <li>Tasks (physical or online) need proof that {course.ngo.name} reviews. They approve it or send it back with feedback.</li>
          <li>Only when everything is done do you get the certificate (with a public verification link) and {course.points} points. Points are paid for up to 2 courses a week; the certificate is always issued.</li>
        </ul>
      </div>

      {/* ----------------------------------------------------------- lessons */}
      <div className="space-y-2.5">
        <h2 className="text-sm font-extrabold text-[#0f172a] px-1 flex items-center gap-1.5">
          <ListChecks className="w-4 h-4 text-[#0f2d59]" /> Lessons
        </h2>
        {course.lessons.map((l) => {
          const Icon = KIND_ICON[l.kind];
          const open = openId === l.id;
          const label = enrolled && l.state ? STATE_LABEL[l.state] : null;
          return (
            <div key={l.id} className={`bg-white rounded-2xl border ${open ? 'border-[#0f2d59]/50' : 'border-[#cbd5e1]'} overflow-hidden`}>
              <button
                onClick={() => toggle(l)}
                aria-expanded={open}
                className="w-full text-left p-3.5 flex items-start gap-3 cursor-pointer"
              >
                <span className="mt-0.5 shrink-0">
                  <StateIcon lesson={l} enrolled={enrolled} />
                </span>
                <span className="min-w-0 flex-1 space-y-0.5">
                  <span className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-[#64748b]">Lesson {l.position}</span>
                    {label && <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${label.tone}`}>{label.text}</span>}
                    {enrolled && l.kind === 'video' && l.state !== 'done' && l.state !== 'locked' && l.percent > 0 && (
                      <span className="text-[10px] text-[#64748b]">{l.percent}% watched</span>
                    )}
                  </span>
                  <span className="flex items-center gap-1.5 text-sm font-extrabold text-[#0f172a]">
                    <Icon className="w-4 h-4 text-[#0f2d59] shrink-0" /> {l.title}
                  </span>
                  <span className="block text-xs text-[#64748b]">{l.summary}</span>
                  <span className="block text-[11px] text-[#475569] font-semibold">{lessonMeta(l)}</span>
                </span>
                <ChevronDown className={`w-4 h-4 text-[#94a3b8] shrink-0 mt-1 transition-transform ${open ? 'rotate-180' : ''}`} />
              </button>

              {open && (
                <div className="px-3.5 pb-4 pt-1 border-t border-[#f1f5f9]">
                  {enrolled && !course.is_owner ? (
                    <LessonPanel key={l.id} course={course} lesson={l} onProgress={onProgress} onFinished={onFinished} />
                  ) : (
                    <OutlineDetail lesson={l} owner={course.is_owner} />
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {cert && <CertificateModal certificate={cert} onClose={() => setCert(null)} />}
    </div>
  );
};

/** What a visitor (or the author) sees when opening a lesson without taking the course. */
const OutlineDetail: React.FC<{ lesson: Lesson; owner: boolean }> = ({ lesson, owner }) => (
  <div className="space-y-2 text-xs text-[#334155]">
    {lesson.kind === 'task' && (
      <>
        <p className="font-extrabold text-[#0f172a]">What you will do</p>
        <p className="leading-relaxed whitespace-pre-line">{lesson.instructions}</p>
        <p className="text-[11px] text-[#64748b]">
          {lesson.task_mode === 'physical' ? 'Done in person.' : 'Done online.'} You submit {lesson.proof_type === 'photo' ? 'a photo' : lesson.proof_type === 'link' ? 'a link' : 'a written answer'} and the NGO checks it.
        </p>
      </>
    )}
    {lesson.kind === 'video' && (
      <>
        <p>
          A {formatDuration(lesson.duration_seconds || 0)} video lecture. You need to really watch at least {formatDuration(lesson.required_seconds)} of it.
        </p>
        {owner && lesson.video_ref && (
          <p className="text-[11px] text-[#64748b] break-all">
            Source: {lesson.video_kind === 'youtube' ? `https://youtu.be/${lesson.video_ref}` : lesson.video_ref}
          </p>
        )}
      </>
    )}
    {lesson.kind === 'reading' && (
      <>
        <p>A short reading. You need to spend at least {formatDuration(lesson.required_seconds)} on it.</p>
        {owner && lesson.body && <p className="rounded-xl bg-[#f8fafc] border border-[#e2e8f0] p-3 leading-relaxed whitespace-pre-line">{lesson.body}</p>}
      </>
    )}
    {!owner && <p className="text-[11px] text-[#0f2d59] font-bold flex items-center gap-1"><BookOpen className="w-3.5 h-3.5" /> Enroll to start this lesson.</p>}
  </div>
);
