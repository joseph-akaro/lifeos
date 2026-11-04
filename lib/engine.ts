import type { Area, Fx, State, Tx } from './types';
import { addDays, monthOf, today, uid } from './util';

export const AREAS: Record<Area, { n: string; i: string; c: string }> = {
  time: { n: 'Time', i: '⏱️', c: 'var(--time)' },
  wealth: { n: 'Wealth', i: '💰', c: 'var(--wealth)' },
  career: { n: 'Career', i: '💼', c: 'var(--career)' },
  skills: { n: 'Skills', i: '🧠', c: 'var(--skills)' },
  vitality: { n: 'Vitality', i: '💪', c: 'var(--vitality)' },
};
export const AREA_KEYS = Object.keys(AREAS) as Area[];
export const AREA_OPTS: [string, string][] = AREA_KEYS.map((k) => [k, AREAS[k].i + ' ' + AREAS[k].n]);
export const TITLES = ['Rookie', 'Apprentice', 'Adventurer', 'Challenger', 'Veteran', 'Expert', 'Master', 'Champion', 'Legend', 'Mythic'];
export const AVATARS = ['🌱', '🪴', '🌿', '🌳', '⚔️', '🛡️', '🏹', '👑', '🐉', '🌌'];
export const EXP_CATS = ['Food', 'Transport', 'Housing', 'Bills', 'Health', 'Fun', 'Learning', 'Shopping', 'Other'];
export const INC_CATS = ['Salary', 'Freelance', 'Business', 'Gift', 'Other'];
export const SKILL_CATS = ['Tech', 'Creative', 'Business', 'Language', 'Body', 'Other'];
export const DIFF: [string, string][] = [['1', 'Easy'], ['2', 'Medium'], ['3', 'Hard']];
export const titleIdx = (l: number) => Math.min(9, Math.floor((l - 1) / 2));

export const DEF = (): State => ({
  v: 1, name: 'Player One', cur: '$', xp: 0, gold: 0, areaXp: {}, daily: {}, log: [],
  habits: [
    { id: uid(), name: 'Plan my day', area: 'time', diff: 1, done: [] },
    { id: uid(), name: 'Move my body', area: 'vitality', diff: 2, done: [] },
    { id: uid(), name: 'Learn something for 20 min', area: 'skills', diff: 2, done: [] },
    { id: uid(), name: 'Check my money', area: 'wealth', diff: 1, done: [] },
  ],
  tasks: [], timer: null, focus: [], blocks: [], tx: [], txXp: {}, budget: {}, goals: [], skills: [],
  objectives: [], wins: [], reviews: [], trophies: {},
  rewards: [
    { id: uid(), name: '☕ Coffee break', cost: 40 },
    { id: uid(), name: '🎮 1h guilt-free gaming', cost: 120 },
    { id: uid(), name: '🍕 Treat meal', cost: 300 },
  ],
  ui: { month: monthOf(today()), tf: 'open' },
});

/* ---- levels ---- */
export const lvl = (xp: number) => Math.floor(Math.sqrt(xp / 40)) + 1;
export const xpFor = (l: number) => 40 * (l - 1) * (l - 1);
export const areaLvl = (s: State, a: Area) => Math.floor(Math.sqrt((s.areaXp[a] || 0) / 25)) + 1;
export const skillMin = (s: State, id: string) => s.focus.filter((f) => f.skillId === id).reduce((a, f) => a + f.min, 0);
export const skillLvl = (m: number) => Math.floor(Math.sqrt(m / 30)) + 1;
export const skillMinFor = (l: number) => 30 * (l - 1) * (l - 1);
export const totalFocus = (s: State) => s.focus.reduce((a, f) => a + f.min, 0);

/* ---- streaks ---- */
export function gstreak(s: State) {
  let d = today(), n = 0;
  if (!(s.daily[d] > 0)) d = addDays(d, -1);
  while (s.daily[d] > 0) { n++; d = addDays(d, -1); }
  return n;
}
export function habitStreak(done: string[]) {
  let d = today(), n = 0;
  const set = new Set(done);
  if (!set.has(d)) d = addDays(d, -1);
  while (set.has(d)) { n++; d = addDays(d, -1); }
  return n;
}

/* ---- money ---- */
export const monthTx = (s: State, m: string, type?: Tx['type']) =>
  s.tx.filter((t) => t.date.startsWith(m) && (!type || t.type === type));
export const sumTx = (a: Tx[]) => a.reduce((x, t) => x + t.amt, 0);
export const fmt = (cur: string, n: number) =>
  (n < 0 ? '-' : '') + cur + Math.abs(n).toLocaleString(undefined, { maximumFractionDigits: 2 });

/* ---- trophies ---- */
export const TROPHIES: { id: string; i: string; n: string; d: string; t: (s: State) => boolean }[] = [
  { id: 'first', i: '🌟', n: 'First Steps', d: 'Earn your first XP', t: (s) => s.xp > 0 },
  { id: 'lv5', i: '⭐', n: 'Level 5', d: 'Reach level 5', t: (s) => lvl(s.xp) >= 5 },
  { id: 'lv10', i: '🌠', n: 'Level 10', d: 'Reach level 10', t: (s) => lvl(s.xp) >= 10 },
  { id: 'st7', i: '🔥', n: 'Week Warrior', d: '7-day XP streak', t: (s) => gstreak(s) >= 7 },
  { id: 'st30', i: '☄️', n: 'Unstoppable', d: '30-day XP streak', t: (s) => gstreak(s) >= 30 },
  { id: 'hab21', i: '🧬', n: 'Habit Forged', d: '21-day streak on any habit', t: (s) => s.habits.some((h) => habitStreak(h.done) >= 21) },
  { id: 'q25', i: '⚔️', n: 'Quest Slayer', d: 'Complete 25 quests', t: (s) => s.tasks.filter((t) => t.done).length >= 25 },
  { id: 'f10', i: '🎯', n: 'Deep Diver', d: '10 hours of focus', t: (s) => totalFocus(s) >= 600 },
  { id: 'f50', i: '🧘', n: 'Flow State', d: '50 hours of focus', t: (s) => totalFocus(s) >= 3000 },
  { id: 'tx20', i: '📒', n: 'Bookkeeper', d: 'Log 20 transactions', t: (s) => s.tx.length >= 20 },
  { id: 'goal', i: '🏦', n: 'Goal Getter', d: 'Fully fund a savings goal', t: (s) => s.goals.some((g) => g.paid) },
  {
    id: 'bud', i: '🛡️', n: 'Budget Boss', d: 'Month with 5+ expenses and all budgets respected',
    t: (s) => {
      const ex = monthTx(s, s.ui.month, 'expense');
      const ks = Object.keys(s.budget);
      return ex.length >= 5 && ks.length > 0 && ks.every((k) => sumTx(ex.filter((t) => t.cat === k)) <= s.budget[k]);
    },
  },
  { id: 'sk5', i: '🛠️', n: 'Specialist', d: 'Get any skill to level 5', t: (s) => s.skills.some((k) => skillLvl(skillMin(s, k.id)) >= 5) },
  { id: 'sk3', i: '🎓', n: 'Polymath', d: 'Three skills at level 3+', t: (s) => s.skills.filter((k) => skillLvl(skillMin(s, k.id)) >= 3).length >= 3 },
  { id: 'obj', i: '🚀', n: 'Mission Complete', d: 'Finish a career objective', t: (s) => s.objectives.some((o) => o.done) },
  { id: 'win10', i: '🏅', n: 'Win Collector', d: 'Log 10 career wins', t: (s) => s.wins.length >= 10 },
  { id: 'rev4', i: '🔭', n: 'Reflective', d: 'Complete 4 weekly reviews', t: (s) => s.reviews.length >= 4 },
];

export function checkTrophies(s: State, fx: Fx) {
  for (const t of TROPHIES) {
    if (!s.trophies[t.id] && t.t(s)) {
      s.trophies[t.id] = today();
      fx.toast(`🏆 Trophy unlocked: ${t.n}`, true);
      fx.confetti();
      award(s, fx, 50, 'career', 'Trophy: ' + t.n);
    }
  }
}

/* ---- XP ---- */
export function award(s: State, fx: Fx, amt: number, area: Area, why: string) {
  const before = lvl(s.xp);
  s.xp = Math.max(0, s.xp + amt);
  s.gold = Math.max(0, s.gold + amt);
  s.areaXp[area] = Math.max(0, (s.areaXp[area] || 0) + amt);
  const t = today();
  s.daily[t] = (s.daily[t] || 0) + amt;
  if (amt > 0) {
    s.log.unshift({ t: Date.now(), xp: amt, area, why });
    s.log.length = Math.min(s.log.length, 60);
  }
  fx.toast(`${amt > 0 ? '+' : ''}${amt} XP · ${why}`);
  const after = lvl(s.xp);
  if (after > before) {
    fx.confetti();
    fx.toast(`🎉 LEVEL UP! You are now level ${after}`, true);
  }
  checkTrophies(s, fx);
}

/** Bank a focus session. `partial` = stopped early, credit only the elapsed whole minutes. */
export function finishTimer(s: State, fx: Fx, partial: boolean) {
  const tm = s.timer;
  if (!tm) return;
  const el = partial ? Math.floor((Date.now() - tm.start) / 60000) : tm.min;
  s.timer = null;
  if (el >= 1) {
    s.focus.push({ date: today(), min: el, skillId: tm.skillId, label: tm.label || 'Focus' });
    award(s, fx, el, tm.skillId ? 'skills' : 'time', `${el} min focus${tm.label ? ' · ' + tm.label : ''}`);
  } else fx.toast('Under 1 minute — nothing banked');
}
