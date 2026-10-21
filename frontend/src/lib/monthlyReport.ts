import type { MonthlyReport } from './api';

const esc = (v: unknown): string =>
  String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string));

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' });

/** Self-contained HTML (no scripts, no external files) so it can be saved, emailed or printed to PDF. */
export function buildMonthlyReportHtml(r: MonthlyReport): string {
  const rows = r.reports.length
    ? r.reports
        .map(
          (i) => `<tr><td>${fmtDate(i.created_at)}</td><td>${esc(i.title)}</td><td>${esc(i.category)}</td><td>${esc(i.status)}</td><td class="n">${i.supporters}</td></tr>`
        )
        .join('')
    : '<tr><td colspan="5" class="muted">No reports filed this month.</td></tr>';
  const pts = r.points_breakdown.length
    ? r.points_breakdown.map((l) => `<tr><td>${esc(l.label)}</td><td class="n">${l.count}</td><td class="n">+${l.points}</td></tr>`).join('')
    : '<tr><td colspan="3" class="muted">No points earned this month.</td></tr>';
  const cats = r.category_breakdown.length
    ? r.category_breakdown.map((c) => `<tr><td>${esc(c.category)}</td><td class="n">${c.count}</td><td class="n">${c.percent}%</td></tr>`).join('')
    : '<tr><td colspan="3" class="muted">-</td></tr>';
  const statuses = Object.entries(r.status_breakdown).map(([k, v]) => `${esc(k)}: ${v}`).join(' &middot; ') || 'none';
  const next = r.next_tier ? `${r.points_to_next_tier} more points to ${esc(r.next_tier)}` : 'Top tier reached';

  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>JanSevak contribution report - ${esc(r.month_label)}</title>
<style>
body{font-family:Arial,Helvetica,sans-serif;color:#0f172a;max-width:780px;margin:24px auto;padding:0 20px;line-height:1.45}
h1{color:#0f2d59;margin:0}h2{color:#0f2d59;font-size:15px;margin:22px 0 6px;border-bottom:2px solid #e2e8f0;padding-bottom:4px}
.sub{color:#64748b;font-size:13px;margin:2px 0 16px}.grid{display:flex;gap:10px;flex-wrap:wrap}
.card{flex:1;min-width:120px;border:1px solid #cbd5e1;border-radius:10px;padding:10px;text-align:center}
.card b{display:block;font-size:22px;color:#0f2d59}.card span{font-size:11px;color:#64748b;text-transform:uppercase}
table{width:100%;border-collapse:collapse;font-size:13px}th,td{text-align:left;padding:6px 8px;border-bottom:1px solid #e2e8f0}
th{background:#f1f5f9;font-size:11px;text-transform:uppercase;color:#475569}.n{text-align:right}.muted{color:#64748b;text-align:center}
.foot{margin-top:26px;font-size:11px;color:#64748b;border-top:1px solid #e2e8f0;padding-top:8px}
</style></head><body>
<h1>JanSevak - Monthly Contribution Report</h1>
<p class="sub">${esc(r.citizen_name)}${r.ward ? ' &middot; ' + esc(r.ward) : ''} &middot; ${esc(r.month_label)}</p>
<div class="grid">
<div class="card"><b>${r.reports_filed}</b><span>Reports filed</span></div>
<div class="card"><b>${r.reports_resolved_this_month}</b><span>Resolved</span></div>
<div class="card"><b>${r.supporters_received}</b><span>Supporters gained</span></div>
<div class="card"><b>${r.net_points}</b><span>Net points</span></div>
</div>
<h2>Reports you filed</h2>
<table><tr><th>Date</th><th>Title</th><th>Category</th><th>Status</th><th class="n">Supporters</th></tr>${rows}</table>
<p class="sub">Status: ${statuses}</p>
<h2>By category</h2><table><tr><th>Category</th><th class="n">Reports</th><th class="n">Share</th></tr>${cats}</table>
<h2>Helping others</h2>
<table><tr><td>Neighbours' reports you verified</td><td class="n">${r.reports_supported}</td></tr>
<tr><td>Site photos you added to others' reports</td><td class="n">${r.evidence_added}</td></tr>
<tr><td>Comments you made</td><td class="n">${r.comments_made}</td></tr></table>
<h2>Points this month</h2>
<table><tr><th>Activity</th><th class="n">Times</th><th class="n">Points</th></tr>${pts}
<tr><td><b>Earned</b></td><td></td><td class="n"><b>+${r.points_earned}</b></td></tr>
<tr><td>Reversed after review / undone</td><td></td><td class="n">-${r.points_reversed}</td></tr>
<tr><td><b>Net for the month</b></td><td></td><td class="n"><b>${r.net_points}</b></td></tr></table>
<h2>Where you stand</h2>
<p>Lifetime points: <b>${r.lifetime_points}</b> &middot; Level: <b>${esc(r.tier)}</b> &middot; ${next}</p>
<p class="foot">Generated on ${fmtDate(r.generated_at)} from live JanSevak data. Points are recognition points, not money.</p>
</body></html>`;
}
