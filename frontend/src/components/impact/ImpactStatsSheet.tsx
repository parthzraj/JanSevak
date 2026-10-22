import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { type BackendImpactStats, getImpactStats } from '../../lib/reelsApi';

/** City-wide impact numbers, all computed by the server from real reports. */
export const ImpactStatsSheet: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [stats, setStats] = useState<BackendImpactStats | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let live = true;
    getImpactStats()
      .then((s) => live && setStats(s))
      .catch(() => live && setError(true));
    return () => {
      live = false;
    };
  }, []);

  const tiles = stats
    ? [
        { label: 'Issues resolved', value: stats.resolved_total },
        { label: 'Resolution rate', value: `${stats.resolution_rate}%` },
        { label: 'Resolved in last 30 days', value: stats.resolved_last_30_days },
        { label: 'Avg. days to fix', value: stats.avg_days_to_resolve ?? '–' },
        { label: 'Citizens who backed them', value: stats.citizens_supporting },
        { label: 'Reporters who saw a fix', value: stats.citizens_reporting },
      ]
    : [];
  const top = stats?.by_category[0]?.resolved || 1;

  return (
    <div className="fixed inset-0 z-[60] bg-black/70 flex items-end justify-center" onClick={onClose}>
      <div
        className="w-full max-w-lg bg-white rounded-t-3xl p-5 pb-8 text-[#0f172a] space-y-4 max-h-[82vh] overflow-y-auto animate-in slide-in-from-bottom"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-10 h-1.5 bg-[#cbd5e1] rounded-full mx-auto" />
        <div className="flex items-center justify-between">
          <h3 className="text-base font-extrabold">Our impact so far</h3>
          <button onClick={onClose} aria-label="Close" className="p-1.5 rounded-full text-[#64748b] cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>
        {error && <p className="text-xs text-red-600">Could not load impact numbers.</p>}
        {!stats && !error && <p className="text-xs text-[#64748b]">Loading…</p>}
        {stats && (
          <>
            <div className="grid grid-cols-2 gap-2.5">
              {tiles.map((t) => (
                <div key={t.label} className="p-3 rounded-2xl bg-[#f1f5f9]">
                  <div className="text-xl font-black text-[#0f2d59] tabular-nums">{t.value}</div>
                  <div className="text-[11px] font-semibold text-[#64748b] leading-tight">{t.label}</div>
                </div>
              ))}
            </div>
            <p className="text-[11px] text-[#64748b]">
              Based on {stats.reports_total} reports. {stats.with_after_photo} of {stats.resolved_total} resolved issues have an
              official after photo.
            </p>
            {stats.by_category.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-[#0f2d59]">Resolved by category</h4>
                {stats.by_category.map((c) => (
                  <div key={c.category} className="flex items-center gap-2 text-xs">
                    <span className="w-24 shrink-0 font-semibold">{c.category}</span>
                    <div className="flex-1 h-2.5 rounded-full bg-[#e2e8f0] overflow-hidden">
                      <div className="h-full bg-[#0f2d59] rounded-full" style={{ width: `${(c.resolved / top) * 100}%` }} />
                    </div>
                    <span className="w-6 text-right font-bold tabular-nums">{c.resolved}</span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
