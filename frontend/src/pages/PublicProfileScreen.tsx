import React, { useEffect, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { Calendar, ChevronLeft, ChevronRight, MapPin, ShieldCheck, Trophy } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Avatar } from '../components/common/Avatar';
import { avatarFrom, toCivicPost } from '../lib/mappers';
import { ApiError, fetchIssues, fetchPublicUser, type BackendPublicUser } from '../lib/api';
import type { CivicPost } from '../types';

/** Read-only profile of another citizen (opened by tapping a name on a post, comment or supporter list). */
export const PublicProfileScreen: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, setSelectedPostForDetail } = useApp();

  const [person, setPerson] = useState<BackendPublicUser | null>(null);
  const [reports, setReports] = useState<CivicPost[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    if (!id || !/^\d+$/.test(id)) {
      setError('This profile does not exist.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    Promise.all([fetchPublicUser(id), fetchIssues({ reporter_id: Number(id), page_size: 50 })])
      .then(([p, list]) => {
        if (cancelled) return;
        setPerson(p);
        setReports(list.items.map(toCivicPost));
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof ApiError && e.status === 404 ? 'This citizen was not found.' : 'Could not load this profile. Is the backend running?');
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (id === user.id) return <Navigate to="/profile" replace />;

  const joined = person ? new Date(person.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : '';

  return (
    <div className="flex-1 flex flex-col px-3.5 sm:px-4 pt-3 pb-8 space-y-4">
      <button
        onClick={() => navigate(-1)}
        className="self-start flex items-center gap-1 text-xs font-bold text-[#0f2d59] hover:underline cursor-pointer"
      >
        <ChevronLeft className="w-4 h-4" />
        <span>Back</span>
      </button>

      {loading && <div className="p-8 text-center text-xs text-[#64748b]">Loading profile…</div>}
      {error && !loading && (
        <div className="p-8 text-center bg-white rounded-3xl border border-[#cbd5e1] text-xs text-[#64748b]">{error}</div>
      )}

      {person && !loading && (
        <>
          <div className="bg-white rounded-3xl p-5 border border-[#cbd5e1] shadow-xs space-y-4">
            <div className="flex items-start gap-4">
              <div className="relative">
                <Avatar
                  src={avatarFrom(person.avatar_url)}
                  name={person.name}
                  size={64}
                  className="border-2 border-white shadow-md"
                />
                <div className="absolute -bottom-1 -right-1 bg-[#0f2d59] rounded-full p-1 text-white shadow-xs">
                  <ShieldCheck className="w-4 h-4" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-base sm:text-lg font-bold text-[#0f172a] truncate">{person.name}</h1>
                {person.role !== 'citizen' && (
                  <span className="inline-block text-[10px] font-bold text-[#0f2d59] bg-[#eff6ff] px-2 py-0.5 rounded-full mt-0.5">
                    {person.role === 'official' ? 'Municipal Official' : 'Admin'}
                  </span>
                )}
                {person.ward && (
                  <p className="text-xs text-[#64748b] flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3.5 h-3.5 text-[#0f2d59]" />
                    {person.ward}
                  </p>
                )}
                <p className="text-[11px] text-[#98A59E] flex items-center gap-1 mt-0.5">
                  <Calendar className="w-3 h-3" />
                  Member since {joined}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-1.5 pt-3 border-t border-[#cbd5e1] text-center">
              <div className="bg-[#f8fafc] p-2 rounded-2xl">
                <span className="text-sm sm:text-base font-extrabold text-[#0f172a] tabular-nums block">{person.reports_count}</span>
                <span className="text-[10px] text-[#64748b]">Reports</span>
              </div>
              <div className="bg-[#f8fafc] p-2 rounded-2xl">
                <span className="text-sm sm:text-base font-extrabold text-[#0f172a] tabular-nums block">{person.supported_count}</span>
                <span className="text-[10px] text-[#64748b]">Supported</span>
              </div>
              <div className="bg-[#f8fafc] p-2 rounded-2xl">
                <span className="text-sm sm:text-base font-extrabold text-[#0f2d59] tabular-nums block">{person.resolved_count}</span>
                <span className="text-[10px] text-[#64748b]">Resolved</span>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-[#0f2d59] to-[#1d4e8c] text-white rounded-3xl p-4 shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center text-[#d97706]">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-white">{person.tier} Citizen</span>
                <span className="text-[10px] bg-[#d97706] text-[#0f172a] font-bold px-1.5 py-0.2 rounded-md">{person.points} pts</span>
              </div>
              <p className="text-[11px] text-[#eff6ff] mt-0.5">Civic Reward tier</p>
            </div>
          </div>

          <div className="space-y-2.5">
            <span className="text-xs font-bold text-[#0f172a]">Reports by {person.name.split(' ')[0]} ({reports.length})</span>
            {reports.length === 0 ? (
              <div className="p-8 text-center bg-white rounded-3xl border border-[#cbd5e1]">
                <p className="text-xs text-[#64748b]">No reports filed yet.</p>
              </div>
            ) : (
              reports.map((report) => (
                <div
                  key={report.id}
                  onClick={() => setSelectedPostForDetail(report)}
                  className="bg-white rounded-2xl p-3 border border-[#cbd5e1] hover:border-[#0f2d59]/40 shadow-xs transition-all cursor-pointer flex items-center justify-between gap-3"
                >
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] font-bold text-[#0f2d59] uppercase">
                      {report.category} · {report.formattedTime}
                    </span>
                    <h4 className="text-xs font-bold text-[#0f172a] truncate">{report.title}</h4>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${
                      report.status === 'Resolved'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : 'bg-amber-50 text-amber-800 border-amber-200'
                    }`}
                  >
                    {report.status}
                  </span>
                  <ChevronRight className="w-4 h-4 text-[#64748b] shrink-0" />
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
};
