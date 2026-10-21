import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart3,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  MapPin,
  Calendar,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { fetchAnalytics, type BackendStats } from '../lib/api';

const CATEGORY_COLOURS: Record<string, string> = {
  Roads: 'bg-amber-500',
  Sanitation: 'bg-emerald-500',
  Water: 'bg-blue-500',
  Streetlights: 'bg-yellow-500',
  'Public Safety': 'bg-red-500',
  Parks: 'bg-teal-500',
  Community: 'bg-indigo-500',
};

const formatHours = (h: number | null): string => {
  if (h === null) return 'No resolved issues yet';
  if (h < 1) return `${Math.max(1, Math.round(h * 60))} minutes`;
  if (h < 48) return `${h.toFixed(h < 10 ? 1 : 0)} hours`;
  return `${(h / 24).toFixed(1)} days`;
};

export const ReportAnalysisScreen: React.FC = () => {
  const navigate = useNavigate();
  const { posts, user, setSelectedPostForDetail } = useApp();

  const [stats, setStats] = useState<{ mine: BackendStats; community: BackendStats } | null>(null);
  const [statsError, setStatsError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchAnalytics()
      .then((res) => !cancelled && setStats(res))
      .catch(() => !cancelled && setStatsError(true));
    return () => {
      cancelled = true;
    };
  }, [posts.length, user.id]);

  const [statusFilter, setStatusFilter] = useState<'All' | 'Reported' | 'In Progress' | 'Resolved'>('All');

  // User's own reports (matching user.id or created by user)
  const myReports = posts.filter(
    (p) => p.reporter.id === user.id || p.reporter.name === user.name
  );

  const filteredReports = myReports.filter((p) => {
    if (statusFilter === 'All') return true;
    return p.status === statusFilter;
  });

  const reportedCount = myReports.filter((p) => p.status === 'Reported').length;
  const inProgressCount = myReports.filter((p) => p.status === 'In Progress' || p.status === 'Under Review').length;
  const resolvedCount = myReports.filter((p) => p.status === 'Resolved').length;

  const mine = stats?.mine;
  const community = stats?.community;

  return (
    <div className="flex-1 flex flex-col px-3.5 sm:px-4 pt-3 pb-8 space-y-4">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/menu')}
          className="flex items-center gap-1 text-xs font-bold text-[#0f2d59] hover:underline"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back to Menu</span>
        </button>
        <span className="text-xs text-[#64748b] font-medium">
          Live data from the community
        </span>
      </div>

      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-[#cbd5e1] shadow-xs">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-800 flex items-center justify-center font-bold">
            <BarChart3 className="w-4 h-4 text-blue-700" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-extrabold text-[#0f172a]">
              Report & Civic Analysis
            </h1>
            <p className="text-xs text-[#64748b]">
              Track your logged issues and ward resolution velocity.
            </p>
          </div>
        </div>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-white p-3 rounded-2xl border border-[#cbd5e1] shadow-xs text-center">
          <span className="text-[10px] text-[#64748b] font-bold uppercase block">
            Logged
          </span>
          <span className="text-xl font-extrabold text-[#0f172a] tabular-nums mt-0.5 block">
            {mine?.total ?? myReports.length}
          </span>
          <span className="text-[10px] text-[#64748b]">total issues</span>
        </div>

        <div className="bg-white p-3 rounded-2xl border border-[#cbd5e1] shadow-xs text-center">
          <span className="text-[10px] text-amber-800 font-bold uppercase block">
            In Action
          </span>
          <span className="text-xl font-extrabold text-amber-700 tabular-nums mt-0.5 block">
            {mine?.in_progress ?? inProgressCount}
          </span>
          <span className="text-[10px] text-[#64748b]">under repair</span>
        </div>

        <div className="bg-white p-3 rounded-2xl border border-[#cbd5e1] shadow-xs text-center">
          <span className="text-[10px] text-[#0f2d59] font-bold uppercase block">
            Resolved
          </span>
          <span className="text-xl font-extrabold text-[#0f2d59] tabular-nums mt-0.5 block">
            {mine?.resolved ?? resolvedCount}
          </span>
          <span className="text-[10px] text-[#1d4e8c]">{mine ? `${mine.resolution_rate}% rate` : '—'}</span>
        </div>
      </div>

      {/* Category Breakdown Bar Chart */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-[#cbd5e1] shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-[#0f172a] flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-[#0f2d59]" />
            Your Reports by Category
          </span>
          <span className="text-[11px] text-[#64748b]">{mine ? `${mine.total} total` : ""}</span>
        </div>

        <div className="space-y-2.5">
          {statsError && (
            <p className="text-[11px] text-[#64748b]">Could not load live statistics. Is the backend running?</p>
          )}
          {mine && mine.by_category.length === 0 && (
            <p className="text-[11px] text-[#64748b]">You have not reported anything yet. Your categories will show up here.</p>
          )}
          {(mine?.by_category ?? []).map((item) => (
            <div key={item.category} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-[#0f172a]">{item.category}</span>
                <span className="text-[#64748b] tabular-nums text-[11px]">
                  {item.count} ({item.percent}%)
                </span>
              </div>
              <div className="h-2 bg-[#f8fafc] rounded-full overflow-hidden border border-[#cbd5e1]">
                <div
                  className={`h-full rounded-full ${CATEGORY_COLOURS[item.category] ?? 'bg-slate-500'}`}
                  style={{ width: `${item.percent}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Community benchmark (all citizens, computed live) */}
        <div className="mt-2 pt-3 border-t border-[#cbd5e1] space-y-1.5 text-[11px] text-[#64748b]">
          <div className="flex items-center justify-between">
            <span>Community reports (all time):</span>
            <span className="font-bold text-[#0f2d59]">{community ? community.total : '—'}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Community resolution rate:</span>
            <span className="font-bold text-[#0f2d59]">{community ? `${community.resolution_rate}%` : '—'}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>New reports in the last 7 days:</span>
            <span className="font-bold text-[#0f2d59]">{community ? community.last_7_days : '—'}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Average time to resolve:</span>
            <span className="font-bold text-[#0f2d59]">{community ? formatHours(community.avg_resolution_hours) : '—'}</span>
          </div>
        </div>
      </div>

      {/* Filter Tabs for User's Reports */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-[#0f172a]">
            Your Submitted Reports
          </span>
          <div className="flex items-center gap-1 p-0.5 bg-white rounded-xl border border-[#cbd5e1]">
            {(['All', 'Reported', 'In Progress', 'Resolved'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                  statusFilter === status
                    ? 'bg-[#0f2d59] text-white shadow-xs'
                    : 'text-[#64748b] hover:text-[#0f172a]'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {filteredReports.length === 0 ? (
          <div className="bg-white rounded-3xl p-6 text-center border border-[#cbd5e1] text-[#64748b]">
            <p className="text-xs font-bold text-[#0f172a]">
              No reports in &ldquo;{statusFilter}&rdquo; status
            </p>
            <p className="text-[11px] mt-1">
              Use the central + button to log a new neighborhood concern!
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {filteredReports.map((report) => (
              <div
                key={report.id}
                onClick={() => setSelectedPostForDetail(report)}
                className="bg-white rounded-2xl p-3.5 border border-[#cbd5e1] hover:border-[#0f2d59]/40 shadow-xs transition-all cursor-pointer flex items-center justify-between gap-3"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-[10px] font-bold uppercase text-[#0f2d59] bg-[#eff6ff] px-2 py-0.5 rounded-full">
                      {report.category}
                    </span>
                    <span className="text-[10px] text-[#64748b] font-mono">
                      #{report.id.toUpperCase()}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-[#0f172a] truncate">
                    {report.title}
                  </h4>
                  <div className="flex items-center gap-2 mt-1 text-[10px] text-[#64748b]">
                    <span className="flex items-center gap-0.5">
                      <MapPin className="w-3 h-3 text-[#0f2d59]" />
                      {report.reporter.wardOrArea}
                    </span>
                    <span>·</span>
                    <span>{report.formattedTime}</span>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      report.status === 'Resolved'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : report.status === 'In Progress'
                        ? 'bg-amber-50 text-amber-800 border-amber-200'
                        : 'bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    {report.status}
                  </span>
                  <ChevronRight className="w-4 h-4 text-[#64748b]" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
