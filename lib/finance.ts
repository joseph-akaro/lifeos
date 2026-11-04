import type { Goal } from './types';

export interface Projection {
  /** Months until the balance reaches the target, or null if it won't within 100 years. */
  monthsToTarget: number | null;
  /** Interest earned between now and the end of the projection window (target date or 10 years). */
  interest: number;
  /** Months covered by `interest` and `series`. */
  horizon: number;
  /** Interest the current balance earns each month. */
  monthlyInterest: number;
  /** Only when a future target date is set. */
  deadline?: { months: number; fv: number; onTrack: boolean; neededMonthly: number };
  series: { bal: number; paid: number }[];
}

const MAX_MONTHS = 1200;

/** Whole months from today to a YYYY-MM-DD date (never negative). */
export function monthsUntil(date: string, from = new Date()) {
  const d = new Date(date + 'T00:00:00');
  return Math.max(0, (d.getFullYear() - from.getFullYear()) * 12 + d.getMonth() - from.getMonth());
}

/**
 * Compound-growth estimate for an investment goal (monthly compounding, contribution at month end),
 * plus "what do I need to save each month" for any goal that has a future target date.
 * Returns null when there is nothing to project.
 */
export function project(g: Goal): Projection | null {
  const invest = g.kind === 'investment';
  const n = g.deadline ? monthsUntil(g.deadline) : 0;
  if (!invest && !n) return null;

  const r = invest ? (g.rate || 0) / 100 / 12 : 0;
  const c = invest ? g.monthly || 0 : 0;

  let bal = g.saved;
  const full = [{ bal, paid: g.saved }];
  while (bal < g.target && full.length <= MAX_MONTHS) {
    bal = bal * (1 + r) + c;
    full.push({ bal, paid: g.saved + c * full.length });
  }
  const reached = full[full.length - 1].bal >= g.target;
  const monthsToTarget = reached ? full.length - 1 : null;

  // window shown on the chart: until the target is hit, or the target date, or 10 years
  const horizon = Math.min(MAX_MONTHS, Math.max(1, reached ? monthsToTarget! : n || 120));
  const series = [{ bal: g.saved, paid: g.saved }];
  for (let m = 1; m <= horizon; m++) {
    const prev = series[m - 1];
    series.push({ bal: prev.bal * (1 + r) + c, paid: g.saved + c * m });
  }
  const end = series[series.length - 1];

  let deadline: Projection['deadline'];
  if (n > 0) {
    const grow = Math.pow(1 + r, n);
    const fv = g.saved * grow + (r > 0 ? c * ((grow - 1) / r) : c * n);
    const needed = r > 0 ? ((g.target - g.saved * grow) * r) / (grow - 1) : (g.target - g.saved) / n;
    deadline = { months: n, fv, onTrack: fv >= g.target, neededMonthly: Math.max(0, needed) };
  }

  return { monthsToTarget, interest: end.bal - g.saved - c * horizon, horizon, monthlyInterest: g.saved * r, deadline, series };
}

export function duration(months: number) {
  const y = Math.floor(months / 12), m = months % 12;
  if (!y) return `${m} month${m === 1 ? '' : 's'}`;
  return m ? `${y}y ${m}m` : `${y} year${y === 1 ? '' : 's'}`;
}

export const monthYear = (monthsFromNow: number) =>
  new Date(new Date().getFullYear(), new Date().getMonth() + monthsFromNow, 1).toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
