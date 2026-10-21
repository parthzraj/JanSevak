import React from 'react';
import { X } from 'lucide-react';
import {
  POINTS_PER_BLOCK,
  RUPEES_PER_BLOCK,
  MIN_WITHDRAWAL_POINTS,
  MIN_WITHDRAWAL_RUPEES,
  formatRupees,
  redeemableSummary,
} from '../../lib/rewardsValue';

const EXAMPLES = [250, 750, 1250, 2500, 5000];

export const RedeemModal: React.FC<{ points: number; onClose: () => void; onRequest: () => void }> = ({
  points,
  onClose,
  onRequest,
}) => {
  const s = redeemableSummary(points);
  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Redeemable points value"
    >
      <div
        className="w-full max-w-md bg-white dark:bg-[#111c2e] rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 cursor-pointer"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        <h3 className="text-base font-black text-[#0f2d59] dark:text-white">Redeemable points</h3>

        <div className="rounded-2xl bg-[#EAF6EE] dark:bg-emerald-950/40 p-4 space-y-1">
          <div className="flex items-baseline justify-between">
            <span className="text-xs font-bold text-slate-600 dark:text-slate-300">Your points</span>
            <span className="text-lg font-black tabular-nums text-[#0f172a] dark:text-white">{s.points}</span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
              Value ({s.points} {'×'} {'₹'}0.08)
            </span>
            <span className="text-lg font-black tabular-nums text-emerald-700 dark:text-emerald-300">
              {formatRupees(s.rupees)}
            </span>
          </div>
          <div className="h-2 rounded-full bg-white dark:bg-slate-800 overflow-hidden mt-2">
            <div className="h-full bg-emerald-600 transition-all" style={{ width: `${s.progressPercent}%` }} />
          </div>
          <p className="text-[11px] text-slate-600 dark:text-slate-300 pt-1">
            {s.meetsMinimum
              ? `You meet the ${formatRupees(MIN_WITHDRAWAL_RUPEES)} minimum withdrawal.`
              : `${s.pointsToMinimum} more points to reach the ${formatRupees(MIN_WITHDRAWAL_RUPEES)} minimum (${MIN_WITHDRAWAL_POINTS} points).`}
          </p>
        </div>

        <div>
          <p className="text-xs font-black uppercase tracking-wider text-[#64748b] mb-1.5">
            Conversion: {POINTS_PER_BLOCK} points = {formatRupees(RUPEES_PER_BLOCK)}
          </p>
          <table className="w-full text-xs">
            <tbody>
              {EXAMPLES.map((p) => {
                const r = redeemableSummary(p);
                return (
                  <tr key={p} className="border-t border-slate-100 dark:border-slate-800">
                    <td className="py-1.5 tabular-nums text-slate-700 dark:text-slate-200">{p} pts</td>
                    <td className="py-1.5 tabular-nums font-bold text-slate-900 dark:text-white">{formatRupees(r.rupees)}</td>
                    <td className={`py-1.5 text-right font-semibold ${r.meetsMinimum ? 'text-emerald-700' : 'text-amber-700'}`}>
                      {r.meetsMinimum ? 'Meets minimum' : 'Below minimum'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <button
          disabled={!s.meetsMinimum}
          onClick={onRequest}
          className="w-full py-2.5 rounded-xl bg-[#0f2d59] hover:bg-[#07172c] disabled:bg-slate-300 disabled:text-slate-500 disabled:cursor-not-allowed text-white text-xs font-bold transition-all cursor-pointer"
        >
          {s.meetsMinimum ? 'Request withdrawal (demo)' : 'Withdrawal locked'}
        </button>

        <p className="text-[10px] leading-snug text-slate-500 dark:text-slate-400">
          Proposed rate, not a guarantee of payment. Lifetime points still decide your level and badges. In this
          prototype withdrawals use simulated money; real payouts need funding, legal, tax and KYC review first.
        </p>
      </div>
    </div>
  );
};
