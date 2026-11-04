import type { State } from './types';

export type BucketId = 'essentials' | 'guilt' | 'debt' | 'savings' | 'invest';

export interface BucketDef { id: BucketId; name: string; hint: string; icon: string; kind: 'spend' | 'save' }

/** The five-way split of income. "spend" buckets are tracked from expenses; "save" buckets from money put into goals. */
export const BUCKETS: BucketDef[] = [
  { id: 'essentials', name: 'Essentials', hint: 'Rent, food, transport, bills, health', icon: 'bx-home-alt-2', kind: 'spend' },
  { id: 'guilt', name: 'Guilt-free', hint: 'Spend it without a second thought', icon: 'bx-party', kind: 'spend' },
  { id: 'debt', name: 'Debt', hint: 'Loan and credit repayments', icon: 'bx-credit-card', kind: 'spend' },
  { id: 'savings', name: 'Short-term goals', hint: 'Money set aside for upcoming goals', icon: 'bx-target-lock', kind: 'save' },
  { id: 'invest', name: 'Investment', hint: 'Money put to work for later', icon: 'bx-trending-up', kind: 'save' },
];

export const DEFAULT_PCT: Record<BucketId, number> = { essentials: 55, guilt: 5, debt: 10, savings: 15, invest: 15 };

/** Which bucket an expense category counts against. Anything unlisted counts as guilt-free; reassign it with State.catMap. */
export const DEFAULT_CATS: Record<string, BucketId> = {
  Housing: 'essentials', Bills: 'essentials', Food: 'essentials', Transport: 'essentials', Health: 'essentials',
  Fun: 'guilt', Shopping: 'guilt', Debt: 'debt',
};
export const SPEND_BUCKETS = BUCKETS.filter((b) => b.kind === 'spend');

export const bucketOf = (s: Pick<State, 'catMap'>, cat: string): BucketId => (s.catMap[cat] as BucketId) ?? DEFAULT_CATS[cat] ?? 'guilt';

export interface BucketRow extends BucketDef {
  pct: number;
  allocated: number;
  used: number;
  left: number;
  over: boolean;
  /** What the "used" amount is made of: categories for spend buckets, goals for save buckets. */
  items: { label: string; amt: number }[];
}
export interface BudgetView {
  /** The income the percentages are applied to (USD). */
  base: number;
  /** Where `base` came from: income logged this month, the expected-income setting, or nothing yet. */
  basis: 'logged' | 'expected' | 'none';
  logged: number;
  pctTotal: number;
  buckets: BucketRow[];
}

const round2 = (n: number) => Math.round(n * 100) / 100;

export function computeBudget(s: State, month: string): BudgetView {
  const logged = s.tx.filter((t) => t.type === 'income' && t.date.startsWith(month)).reduce((a, t) => a + t.amt, 0);
  const expected = s.alloc.expected > 0 ? s.alloc.expected : 0;
  const wantExpected = s.alloc.basis === 'expected' && expected > 0;
  const basis: BudgetView['basis'] = wantExpected ? 'expected' : logged > 0 ? 'logged' : expected > 0 ? 'expected' : 'none';
  const base = basis === 'expected' ? expected : basis === 'logged' ? logged : 0;

  const expenses = s.tx.filter((t) => t.type === 'expense' && t.date.startsWith(month));
  const buckets = BUCKETS.map((b): BucketRow => {
    const pct = s.alloc.pct[b.id] ?? 0;
    const allocated = round2((base * pct) / 100);
    const byLabel = new Map<string, number>();
    if (b.kind === 'spend') {
      for (const t of expenses) if (bucketOf(s, t.cat) === b.id) byLabel.set(t.cat, (byLabel.get(t.cat) ?? 0) + t.amt);
    } else {
      for (const g of s.goals) {
        if ((g.kind === 'investment') !== (b.id === 'invest')) continue;
        const amt = (g.log ?? []).filter((e) => e.date.startsWith(month)).reduce((a, e) => a + e.amt, 0);
        if (amt) byLabel.set(g.name, amt);
      }
    }
    const items = [...byLabel].map(([label, amt]) => ({ label, amt: round2(amt) })).sort((x, y) => y.amt - x.amt);
    const used = round2(items.reduce((a, i) => a + i.amt, 0));
    return { ...b, pct, allocated, used, left: round2(allocated - used), over: b.kind === 'spend' && base > 0 && used > allocated, items };
  });
  return { base, basis, logged, pctTotal: buckets.reduce((a, b) => a + b.pct, 0), buckets };
}
