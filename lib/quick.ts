import type { Area, Goal } from './types';
import type { Store } from './store';
import { AREA_OPTS, DIFF, EXP_CATS, INC_CATS, SKILL_CATS, award } from './engine';
import { BUCKETS, SPEND_BUCKETS, type BucketId } from './budget';
import { COUNTRIES, countryOf } from './countries';
import { SKILL_ICONS } from './icons';
import { monthOf, today, uid } from './util';

type Ctx = Pick<Store, 'act' | 'openForm'>;

export const addHabit = ({ act, openForm }: Ctx) =>
  openForm('New habit', [
    { k: 'name', l: 'Habit', ph: 'e.g. Read 10 pages' },
    { k: 'area', l: 'Life area', t: 'select', o: AREA_OPTS, v: 'vitality' },
    { k: 'diff', l: 'Difficulty (10/20/30 XP)', t: 'select', o: DIFF, v: '1' },
  ], (v) => act((x) => { x.habits.push({ id: uid(), name: v.name.trim(), area: v.area as Area, diff: +v.diff, done: [] }); }), { btn: 'Add habit' });

export const addTask = ({ act, openForm }: Ctx) =>
  openForm('New quest', [
    { k: 'text', l: 'Quest', ph: 'e.g. Send invoice to client' },
    { k: 'area', l: 'Life area', t: 'select', o: AREA_OPTS, v: 'career' },
    { k: 'diff', l: 'Difficulty (15/30/45 XP)', t: 'select', o: DIFF, v: '1' },
    { k: 'due', l: 'Due date', t: 'date', req: false },
  ], (v) => act((x) => { x.tasks.push({ id: uid(), text: v.text.trim(), area: v.area as Area, diff: +v.diff, due: v.due || '', done: false }); }), { btn: 'Add quest' });

type FxCtx = Pick<Store, 'act' | 'openForm' | 'fx' | 's'>;

/** Log income/expense. Amounts typed in a local currency are converted to USD at today's rate, or at the rate you actually got. */
export const addTx = ({ act, openForm, fx, s }: FxCtx) => {
  const home = countryOf(s.country)?.cur ?? 'USD';
  const codes = [...new Set([home, 'USD', ...COUNTRIES.map((c) => c.cur)])];
  openForm('New transaction', [
    { k: 'type', l: 'Type', t: 'select', o: [['expense', 'Expense'], ['income', 'Income']], v: 'expense' },
    { k: 'cur', l: 'Paid in', t: 'select', o: codes.map((c) => [c, c === 'USD' ? 'USD (primary)' : c === home ? `${c} (where you are)` : c] as [string, string]), v: home },
    { k: 'amt', l: 'Amount', t: 'number' },
    { k: 'rate', l: 'Rate you got (optional)', t: 'number', req: false, hideIf: ['cur', 'USD'], hint: `Local currency per 1 USD, if your bureau, M-Pesa or ATM rate differed. Today's market rate is used when blank.` },
    { k: 'cat', l: 'Category', dl: [...EXP_CATS, ...INC_CATS], ph: 'Food, Salary…' },
    { k: 'note', l: 'Note', req: false },
    { k: 'date', l: 'Date', t: 'date', v: today() },
  ], (v) => act((x, fx2) => {
    const amt = +v.amt;
    if (!(amt > 0)) return;
    const code = v.cur || 'USD';
    let usd = amt, rate: number | undefined;
    if (code !== 'USD') {
      rate = +v.rate > 0 ? +v.rate : fx.rates[code];
      if (!rate) { fx2.toast(`No exchange rate for ${code} yet. Enter the rate you got, or try again once you're online.`); return; }
      usd = Math.round((amt / rate) * 100) / 100;
    }
    x.tx.push({ id: uid(), type: v.type as 'income' | 'expense', amt: usd, cat: v.cat.trim() || 'Other', note: v.note, date: v.date,
      ...(code !== 'USD' ? { cur: code, orig: amt, rate } : {}) });
    x.ui.month = monthOf(v.date);
    const c = x.txXp[today()] || 0;
    if (c < 3) { x.txXp[today()] = c + 1; award(x, fx2, 5, 'wealth', 'Logged ' + v.type); }
  }), { btn: 'Add' });
};

/** Pick the country you're staying in. The currency, rates and new-transaction default follow from it. */
export const countryForm = ({ act, openForm, fx, s }: FxCtx) =>
  openForm(s.country ? 'Change country' : 'Where are you based?', [
    { k: 'country', l: 'Country', t: 'select', o: COUNTRIES.map((c) => [c.code, `${c.name} (${c.cur})`] as [string, string]), v: s.country || 'KE' },
    { k: 'since', l: 'Since', t: 'date', v: today(), hint: 'The day you arrived. Back-date it if you are already settled in.' },
  ], (v) => act((x, fx2) => {
    const c = countryOf(v.country);
    if (!c) return;
    const open = x.stays.find((y) => !y.end);
    if (open && open.country === v.country) { open.start = v.since; x.country = v.country; return; }
    if (open) open.end = v.since < open.start ? open.start : v.since;
    x.stays.push({ id: uid(), country: v.country, start: v.since });
    x.country = v.country;
    const r = fx.rates[c.cur];
    fx2.toast(c.cur === 'USD' ? `Now based in ${c.name}` : r ? `Now in ${c.name}: 1 USD = ${r.toLocaleString(undefined, { maximumFractionDigits: 2 })} ${c.cur}` : `Now based in ${c.name}`);
  }), { btn: 'Save' });

export const addSkill = ({ act, openForm }: Ctx) =>
  openForm('New skill', [
    { k: 'name', l: 'Skill', ph: 'Python, Spanish, Public speaking…' },
    { k: 'icon', l: 'Icon', t: 'icons', o: SKILL_ICONS },
    { k: 'cat', l: 'Category', t: 'select', o: SKILL_CATS.map((c) => [c, c]) },
  ], (v) => act((x) => { x.skills.push({ id: uid(), name: v.name.trim(), icon: v.icon || 'bx-brain', cat: v.cat }); }), { btn: 'Add skill' });

export const addWin = ({ act, openForm }: Ctx) =>
  openForm('Log a career win', [{ k: 'text', l: 'What did you achieve?', t: 'textarea' }], (v) =>
    act((x, fx) => { x.wins.unshift({ d: today(), text: v.text.trim() }); award(x, fx, 10, 'career', 'Career win'); }));

export const startFocus = ({ act }: Pick<Store, 'act'>, min = 25, label = '', skillId = '') =>
  act((x) => { x.timer = { start: Date.now(), min, label, skillId }; });

export const toggleHabit = (act: Store['act'], id: string) =>
  act((s, fx) => {
    const t = today();
    const x = s.habits.find((y) => y.id === id)!;
    const i = x.done.indexOf(t);
    if (i < 0) { x.done.push(t); award(s, fx, x.diff * 10, x.area, x.name); }
    else { x.done.splice(i, 1); award(s, fx, -x.diff * 10, x.area, 'Undo: ' + x.name); }
  });

/** Create a goal, or edit `g`. Editing never pays XP; a goal that has been completed stays completed. */
export const goalForm = ({ act, openForm }: Ctx, g?: Goal) =>
  openForm(g ? `Edit ${g.name}` : 'New goal', [
    { k: 'name', l: 'Goal', ph: 'Emergency fund', v: g?.name },
    { k: 'kind', l: 'Type', t: 'select', o: [['savings', 'Savings'], ['investment', 'Investment (earns interest)']], v: g?.kind ?? 'savings' },
    { k: 'target', l: 'Target amount', t: 'number', v: g?.target },
    { k: 'saved', l: g ? 'Amount so far' : 'Already saved', t: 'number', v: g?.saved ?? 0 },
    { k: 'rate', l: 'Expected annual return (%)', t: 'number', v: g?.rate, showIf: ['kind', 'investment'], hint: 'Interest rate or average yearly growth, e.g. 7' },
    { k: 'monthly', l: 'Monthly contribution', t: 'number', v: g?.monthly, req: false, showIf: ['kind', 'investment'], hint: 'What you plan to add every month' },
    { k: 'deadline', l: 'Target date', t: 'date', v: g?.deadline, req: false },
  ], (v) => act((x) => {
    const target = +v.target;
    if (!(target > 0)) return;
    const inv = v.kind === 'investment';
    const fields = {
      name: v.name.trim(), kind: (inv ? 'investment' : 'savings') as Goal['kind'], target, saved: +v.saved || 0,
      rate: inv ? +v.rate || 0 : undefined, monthly: inv ? +v.monthly || 0 : undefined, deadline: v.deadline || undefined,
    };
    const cur = g && x.goals.find((y) => y.id === g.id);
    if (cur) {
      Object.assign(cur, fields);
      if (cur.saved >= cur.target) cur.paid = true;
    } else x.goals.push({ id: uid(), paid: false, ...fields });
  }), { btn: g ? 'Save changes' : 'Create goal' });

/** Edit how income is split across the five budget buckets. Percentages must add up to 100. */
export const allocForm = ({ act, openForm, s }: Pick<Store, 'act' | 'openForm' | 's'>) =>
  openForm('Split your income', [
    ...BUCKETS.map((b) => ({ k: b.id, l: `${b.name} (%)`, t: 'number' as const, v: s.alloc.pct[b.id], hint: b.hint })),
    { k: 'basis', l: 'Calculate from', t: 'select', o: [['logged', 'Income I log each month'], ['expected', 'A fixed monthly income']], v: s.alloc.basis },
    { k: 'expected', l: 'Expected monthly income (USD)', t: 'number', v: s.alloc.expected || undefined, showIf: ['basis', 'expected'], hint: 'Use this if your income arrives late or in lumps.' },
  ], (v) => act((x) => {
    for (const b of BUCKETS) x.alloc.pct[b.id] = +v[b.id];
    x.alloc.basis = v.basis as 'logged' | 'expected';
    x.alloc.expected = +v.expected || 0;
  }), {
    btn: 'Save split',
    validate: (v) => {
      const total = BUCKETS.reduce((a, b) => a + (+v[b.id] || 0), 0);
      return Math.abs(total - 100) < 0.001 ? null : `These add up to ${Math.round(total * 100) / 100}%. They need to total 100%.`;
    },
  });

/** Choose which bucket an expense category counts against. */
export const assignForm = ({ act, openForm, s }: Pick<Store, 'act' | 'openForm' | 's'>, cat = '') =>
  openForm('Which bucket does it count against?', [
    { k: 'cat', l: 'Expense category', dl: EXP_CATS, v: cat, ph: 'Pick one or type your own' },
    { k: 'bucket', l: 'Bucket', t: 'select', o: SPEND_BUCKETS.map((b) => [b.id, b.name] as [string, string]), v: (cat && (s.catMap[cat] ?? '')) || 'essentials' },
  ], (v) => act((x) => { x.catMap[v.cat.trim()] = v.bucket as BucketId; }), { btn: 'Assign' });
