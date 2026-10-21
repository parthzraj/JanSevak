import React, { useMemo, useState } from 'react';
import { FileDown, Printer, Loader2, CalendarDays } from 'lucide-react';
import { fetchMonthlyReport, ApiError, type MonthlyReport } from '../../lib/api';
import { buildMonthlyReportHtml } from '../../lib/monthlyReport';

const lastMonths = (n: number) => {
  const out: { value: string; label: string }[] = [];
  const now = new Date();
  for (let i = 0; i < n; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    out.push({
      value: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      label: d.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }),
    });
  }
  return out;
};

export const MonthlyReportCard: React.FC = () => {
  const months = useMemo(() => lastMonths(12), []);
  const [month, setMonth] = useState(months[0].value);
  const [report, setReport] = useState<MonthlyReport | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const generate = async () => {
    setBusy(true);
    setError('');
    try {
      setReport(await fetchMonthlyReport(month));
    } catch (e) {
      setReport(null);
      setError(e instanceof ApiError ? e.message : 'Cannot reach the server. Is the Core API running?');
    } finally {
      setBusy(false);
    }
  };

  const download = () => {
    if (!report) return;
    const blob = new Blob([buildMonthlyReportHtml(report)], { type: 'text/html' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `jansevak-report-${report.month}.html`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };

  const print = () => {
    if (!report) return;
    const w = window.open('', '_blank');
    if (!w) {
      setError('Pop-up blocked. Allow pop-ups, or use Download and print the file.');
      return;
    }
    w.document.write(buildMonthlyReportHtml(report));
    w.document.close();
    w.focus();
    setTimeout(() => w.print(), 300);
  };

  return (
    <div className="bg-white rounded-3xl p-4 sm:p-5 border border-[#cbd5e1] shadow-xs space-y-3">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center">
          <CalendarDays className="w-4 h-4 text-emerald-700" />
        </div>
        <div>
          <h2 className="text-sm font-extrabold text-[#0f172a]">Monthly contribution report</h2>
          <p className="text-[11px] text-[#64748b]">Your reports, supporters and points for any month.</p>
        </div>
      </div>

      <div className="flex gap-2">
        <select
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="flex-1 min-w-0 rounded-xl border border-[#cbd5e1] bg-white px-3 py-2 text-xs font-semibold text-[#0f172a]"
          aria-label="Report month"
        >
          {months.map((m) => (
            <option key={m.value} value={m.value}>{m.label}</option>
          ))}
        </select>
        <button
          onClick={generate}
          disabled={busy}
          className="px-4 py-2 rounded-xl bg-[#0f2d59] hover:bg-[#1d4e8c] disabled:opacity-60 text-white text-xs font-bold flex items-center gap-1.5"
        >
          {busy && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          Generate
        </button>
      </div>

      {error && <p className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl p-2.5">{error}</p>}

      {report && (
        <div className="space-y-3" data-testid="monthly-report">
          <p className="text-xs font-bold text-[#0f2d59]">{report.month_label}</p>
          <div className="grid grid-cols-4 gap-2 text-center">
            {[
              ['Reports', report.reports_filed],
              ['Resolved', report.reports_resolved_this_month],
              ['Supporters', report.supporters_received],
              ['Net pts', report.net_points],
            ].map(([label, value]) => (
              <div key={label as string} className="rounded-2xl border border-[#cbd5e1] py-2">
                <span className="block text-lg font-extrabold text-[#0f172a] tabular-nums">{value}</span>
                <span className="text-[10px] font-bold uppercase text-[#64748b]">{label}</span>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-[#475569]">
            Verified {report.reports_supported} neighbour report(s), added {report.evidence_added} site photo(s), earned{' '}
            {report.points_earned} points{report.points_reversed ? ` (${report.points_reversed} reversed)` : ''}.
            {report.reports_filed === 0 && ' No reports filed in this month.'}
          </p>
          <div className="flex gap-2">
            <button onClick={download} className="flex-1 py-2.5 rounded-xl border border-[#cbd5e1] text-xs font-bold text-[#0f172a] flex items-center justify-center gap-1.5 hover:bg-[#f8fafc]">
              <FileDown className="w-3.5 h-3.5" /> Download
            </button>
            <button onClick={print} className="flex-1 py-2.5 rounded-xl bg-[#0f2d59] text-white text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-[#1d4e8c]">
              <Printer className="w-3.5 h-3.5" /> Print / Save PDF
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
