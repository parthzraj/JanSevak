import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Award, BookOpen, CheckCircle2, ChevronLeft, ChevronRight, Clock, GraduationCap, ListChecks, Loader2, PlayCircle, Search } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Avatar } from '../components/common/Avatar';
import { avatarFrom } from '../lib/mappers';
import { CertificateModal, formatIssued } from '../components/academy/CertificateModal';
import {
  CATEGORIES,
  fetchCourses,
  fetchMyCertificates,
  type Certificate,
  type Course,
} from '../lib/academyApi';
import { errorText, field } from '../components/volunteer/shared';

export const courseMeta = (c: Course) =>
  [c.video_count && `${c.video_count} video${c.video_count > 1 ? 's' : ''}`, c.reading_count && `${c.reading_count} reading${c.reading_count > 1 ? 's' : ''}`, c.task_count && `${c.task_count} task${c.task_count > 1 ? 's' : ''}`]
    .filter(Boolean)
    .join(' · ');

export const Chip: React.FC<{ children: React.ReactNode; tone?: string }> = ({ children, tone = 'bg-slate-100 text-slate-700' }) => (
  <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${tone}`}>{children}</span>
);

const CourseCard: React.FC<{ course: Course; onOpen: () => void; onCertificate: (code: string) => void }> = ({ course: c, onOpen, onCertificate }) => {
  const done = c.my?.completed;
  const started = c.my && !done;
  return (
    <div className="bg-white rounded-3xl p-4 border border-[#cbd5e1] shadow-xs space-y-3 hover:border-[#0f2d59]/40 transition-colors">
      <button onClick={onOpen} className="text-left w-full space-y-2 cursor-pointer">
        <div className="flex flex-wrap items-center gap-1.5">
          <Chip tone="bg-[#eff6ff] text-[#0f2d59]">{c.level}</Chip>
          <Chip tone="bg-emerald-50 text-emerald-800">{c.category}</Chip>
          <span className="text-[10px] text-[#64748b] flex items-center gap-1">
            <Clock className="w-3 h-3" /> about {c.estimated_minutes} min
          </span>
          {done && (
            <span className="ml-auto text-[10px] font-extrabold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Certified
            </span>
          )}
        </div>
        <h3 className="text-sm sm:text-base font-extrabold text-[#0f172a] leading-snug">{c.title}</h3>
        <p className="text-xs text-[#64748b] leading-relaxed">{c.summary}</p>
        <div className="flex items-center gap-2">
          <Avatar src={avatarFrom(c.ngo.avatar_url)} name={c.ngo.name} size={20} />
          <span className="text-[11px] font-semibold text-[#334155] truncate">{c.ngo.name}</span>
          <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">NGO</span>
        </div>
        <p className="text-[11px] text-[#475569]">
          {c.lessons_count} lessons: {courseMeta(c)} · {c.enrolled_count} enrolled
        </p>
      </button>

      {c.my && (
        <div className="space-y-1">
          <div className="flex justify-between text-[11px]">
            <span className="font-semibold text-[#0f172a]">Course progress</span>
            <span className="font-bold text-[#0f2d59] tabular-nums">{c.my.percent}%</span>
          </div>
          <div className="h-2 bg-[#f1f5f9] rounded-full overflow-hidden border border-[#cbd5e1]">
            <div className="h-full bg-gradient-to-r from-[#0f2d59] to-[#1d4e8c] rounded-full transition-all" style={{ width: `${c.my.percent}%` }} />
          </div>
        </div>
      )}

      <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#e2e8f0]">
        <span className="text-[11px] text-[#64748b]">Certificate + {c.points} points</span>
        <div className="flex gap-2">
          {done && c.my?.certificate_code && (
            <button onClick={() => onCertificate(c.my!.certificate_code!)} className="px-3 py-2 rounded-xl border border-emerald-300 text-emerald-800 text-xs font-bold flex items-center gap-1 cursor-pointer">
              <Award className="w-3.5 h-3.5" /> Certificate
            </button>
          )}
          <button onClick={onOpen} className="px-4 py-2 rounded-xl bg-[#0f2d59] hover:bg-[#1d4e8c] text-white text-xs font-bold flex items-center gap-1 cursor-pointer">
            <span>{done ? 'Review course' : started ? 'Continue learning' : 'View course'}</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export const AcademyScreen: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useApp();
  const [params, setParams] = useSearchParams();
  const tab = params.get('tab') === 'mine' ? 'mine' : 'explore';
  const [q, setQ] = useState('');
  const [category, setCategory] = useState('');
  const [items, setItems] = useState<Course[] | null>(null);
  const [certs, setCerts] = useState<Certificate[]>([]);
  const [error, setError] = useState('');
  const [openCert, setOpenCert] = useState<Certificate | null>(null);
  const isNgo = user.role === 'ngo' || user.role === 'admin';

  const load = useCallback(() => {
    setError('');
    const t = window.setTimeout(
      () =>
        fetchCourses({ enrolled: tab === 'mine', q: q.trim() || undefined, category: category || undefined })
          .then((r) => setItems(r.items))
          .catch((e) => {
            setItems([]);
            setError(errorText(e));
          }),
      q ? 250 : 0
    );
    return () => window.clearTimeout(t);
  }, [tab, q, category]);
  useEffect(() => load(), [load]);

  useEffect(() => {
    if (!isNgo) fetchMyCertificates().then(setCerts).catch(() => setCerts([]));
  }, [isNgo, tab]);

  const showCert = (code: string) => {
    const found = certs.find((c) => c.code === code);
    if (found) setOpenCert(found);
    else fetchMyCertificates().then((all) => { setCerts(all); setOpenCert(all.find((c) => c.code === code) ?? null); }).catch(() => undefined);
  };

  const ongoing = useMemo(() => (items ?? []).filter((c) => c.my && !c.my.completed), [items]);
  const finished = useMemo(() => (items ?? []).filter((c) => c.my?.completed), [items]);

  return (
    <div className="flex-1 flex flex-col px-3.5 sm:px-4 pt-3 pb-40 space-y-4">
      <div className="flex items-center justify-between">
        <button onClick={() => navigate('/menu')} className="flex items-center gap-1 text-xs font-bold text-[#0f2d59] hover:underline cursor-pointer">
          <ChevronLeft className="w-4 h-4" />
          <span>Back to Menu</span>
        </button>
        {isNgo && (
          <button onClick={() => navigate('/ngo')} className="text-xs font-bold text-[#0f2d59] underline cursor-pointer">
            Manage your courses
          </button>
        )}
      </div>

      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-[#cbd5e1] shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full bg-teal-50 flex items-center justify-center shrink-0">
            <GraduationCap className="w-5 h-5 text-teal-700" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-extrabold text-[#0f172a]">Civic Academy</h1>
            <p className="text-xs text-[#64748b]">Courses by verified NGOs. Finish every lesson, pass every check, earn a certificate and points.</p>
          </div>
        </div>
      </div>

      {!isNgo && (
        <div className="grid grid-cols-2 gap-1 p-1 rounded-2xl bg-[#e2e8f0]" role="tablist">
          {([['explore', 'Explore courses'], ['mine', 'My learning']] as const).map(([key, label]) => (
            <button
              key={key}
              role="tab"
              aria-selected={tab === key}
              onClick={() => setParams(key === 'mine' ? { tab: 'mine' } : {})}
              className={`py-2 rounded-xl text-xs font-extrabold cursor-pointer transition-colors ${tab === key ? 'bg-white text-[#0f2d59] shadow-sm' : 'text-[#475569]'}`}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {tab === 'explore' && (
        <div className="flex gap-2">
          <label className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#64748b]" />
            <input className={`${field} pl-9`} placeholder="Search courses" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search courses" />
          </label>
          <select className={`${field} w-auto max-w-[9rem]`} value={category} onChange={(e) => setCategory(e.target.value)} aria-label="Category">
            <option value="">All topics</option>
            {CATEGORIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>
      )}

      {items === null && (
        <div className="flex justify-center py-10">
          <Loader2 className="w-5 h-5 animate-spin text-[#64748b]" />
        </div>
      )}
      {error && <p className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl p-2.5">{error}</p>}

      {items?.length === 0 && !error && (
        <div className="bg-white rounded-3xl border border-dashed border-[#cbd5e1] p-8 text-center space-y-2">
          <BookOpen className="w-8 h-8 text-[#94a3b8] mx-auto" />
          <p className="text-sm font-bold text-[#0f172a]">{tab === 'mine' ? 'You have not started a course yet' : 'No courses match'}</p>
          <p className="text-xs text-[#64748b]">{tab === 'mine' ? 'Pick one from Explore courses and it will appear here with your progress.' : 'NGOs publish new courses here. Try a different search.'}</p>
          {tab === 'mine' && (
            <button onClick={() => setParams({})} className="mt-1 px-4 py-2 rounded-xl bg-[#0f2d59] text-white text-xs font-bold cursor-pointer">
              Explore courses
            </button>
          )}
        </div>
      )}

      {tab === 'explore' && items && items.length > 0 && (
        <div className="space-y-3">
          {items.map((c) => (
            <CourseCard key={c.id} course={c} onOpen={() => navigate(`/academy/${c.id}`)} onCertificate={showCert} />
          ))}
        </div>
      )}

      {tab === 'mine' && items && items.length > 0 && (
        <div className="space-y-5">
          {ongoing.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-sm font-extrabold text-[#0f172a] px-1 flex items-center gap-1.5">
                <PlayCircle className="w-4 h-4 text-[#0f2d59]" /> In progress
              </h2>
              {ongoing.map((c) => (
                <CourseCard key={c.id} course={c} onOpen={() => navigate(`/academy/${c.id}`)} onCertificate={showCert} />
              ))}
            </section>
          )}
          {finished.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-sm font-extrabold text-[#0f172a] px-1 flex items-center gap-1.5">
                <ListChecks className="w-4 h-4 text-emerald-700" /> Completed
              </h2>
              {finished.map((c) => (
                <CourseCard key={c.id} course={c} onOpen={() => navigate(`/academy/${c.id}`)} onCertificate={showCert} />
              ))}
            </section>
          )}
        </div>
      )}

      {tab === 'mine' && certs.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-sm font-extrabold text-[#0f172a] px-1 flex items-center gap-1.5">
            <Award className="w-4 h-4 text-amber-600" /> My certificates ({certs.length})
          </h2>
          {certs.map((c) => (
            <button key={c.code} onClick={() => setOpenCert(c)} className="w-full text-left bg-white rounded-2xl border border-[#cbd5e1] p-3 flex items-center gap-3 cursor-pointer hover:border-emerald-300">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
                <Award className="w-5 h-5 text-emerald-700" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-extrabold text-[#0f172a] truncate">{c.course_title}</p>
                <p className="text-[11px] text-[#64748b]">
                  {c.issuer.name} · {formatIssued(c.completed_at)}
                </p>
              </div>
              <ChevronRight className="w-4 h-4 text-[#94a3b8]" />
            </button>
          ))}
        </section>
      )}

      {openCert && <CertificateModal certificate={openCert} onClose={() => setOpenCert(null)} />}
    </div>
  );
};
