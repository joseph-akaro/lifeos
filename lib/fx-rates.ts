/** Exchange-rate helpers. Rates are "units of that currency per 1 USD"; USD is the primary currency. */
export interface FxData {
  rates: Record<string, number>;
  /** When the provider last updated its rates (UTC string). */
  updated: string;
  fetchedAt: number;
  status: 'live' | 'cached' | 'none';
}

export const EMPTY_FX: FxData = { rates: { USD: 1 }, updated: '', fetchedAt: 0, status: 'none' };

export function formatMoney(code: string, n: number) {
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency: code, currencyDisplay: 'code' }).format(n).replace(/ /g, ' ');
  } catch {
    return `${code} ${n.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
  }
}

/** Short, readable rate: 129.98 for big numbers, 0.007693 for small ones. */
export function rateStr(n: number) {
  if (!Number.isFinite(n)) return '—';
  if (n >= 100) return n.toLocaleString(undefined, { maximumFractionDigits: 2 });
  if (n >= 1) return n.toLocaleString(undefined, { maximumFractionDigits: 3 });
  return n.toPrecision(3).replace(/\.?0+$/, '');
}

/** `override` is what you actually got at the bureau, M-Pesa, ATM, etc. (local units per 1 USD). */
export const toUsd = (amount: number, rate: number) => amount / rate;
export const fromUsd = (usd: number, rate: number) => usd * rate;

/** Whole days between two YYYY-MM-DD dates, as "3 months", "1 yr 2 mo". */
export function stayLength(start: string, end?: string) {
  const a = new Date(start + 'T00:00:00').getTime();
  const b = end ? new Date(end + 'T00:00:00').getTime() : Date.now();
  const days = Math.max(0, Math.floor((b - a) / 864e5));
  if (days < 31) return `${days} day${days === 1 ? '' : 's'}`;
  const months = Math.floor(days / 30.44);
  if (months < 12) return `${months} month${months === 1 ? '' : 's'}`;
  const y = Math.floor(months / 12), m = months % 12;
  return m ? `${y} yr ${m} mo` : `${y} yr`;
}

export const hoursSince = (t: number) => (Date.now() - t) / 36e5;
