/**
 * Cash-value rules from the PrajaPulse Rewards System Workflow (proposal, not a guarantee of payment):
 *   250 redeemable points = Rs 20  (one point = Rs 0.08)
 *   minimum withdrawal    = Rs 100 (1,250 points)
 * Lifetime points drive levels and badges; redeemable points are a separate balance.
 */
export const POINTS_PER_BLOCK = 250;
export const RUPEES_PER_BLOCK = 20;
export const RUPEES_PER_POINT = RUPEES_PER_BLOCK / POINTS_PER_BLOCK; // 0.08
export const MIN_WITHDRAWAL_RUPEES = 100;
export const MIN_WITHDRAWAL_POINTS = MIN_WITHDRAWAL_RUPEES / RUPEES_PER_POINT; // 1250

export interface RedeemableSummary {
  points: number;
  rupees: number;
  meetsMinimum: boolean;
  pointsToMinimum: number;
  progressPercent: number;
}

export function redeemableSummary(points: number): RedeemableSummary {
  const p = Math.max(0, Math.floor(points));
  const rupees = Math.round(p * RUPEES_PER_POINT * 100) / 100;
  return {
    points: p,
    rupees,
    meetsMinimum: rupees >= MIN_WITHDRAWAL_RUPEES,
    pointsToMinimum: Math.max(0, MIN_WITHDRAWAL_POINTS - p),
    progressPercent: Math.min(100, Math.round((p / MIN_WITHDRAWAL_POINTS) * 100)),
  };
}

export const formatRupees = (n: number): string =>
  `₹${n.toLocaleString('en-IN', { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 })}`;
