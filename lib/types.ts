export type Area = 'time' | 'wealth' | 'career' | 'skills' | 'vitality';
export interface AuthUser { id: string; email: string; name: string; isAdmin: boolean }

export interface Habit { id: string; name: string; area: Area; diff: number; done: string[] }
export interface Task { id: string; text: string; area: Area; diff: number; due: string; done: boolean }
export interface Focus { date: string; min: number; skillId: string; label: string }
export interface Block { id: string; date: string; label: string; area: Area; start: string; end: string; done: boolean }
export interface Tx {
  id: string; type: 'income' | 'expense';
  /** Always in USD, the primary currency. */
  amt: number; cat: string; note: string; date: string;
  /** Set when it was paid in another currency: the ISO code, the original amount, and the rate used (units per 1 USD). */
  cur?: string; orig?: number; rate?: number;
}
export interface Stay { id: string; country: string; start: string; end?: string }
export interface Goal {
  id: string; name: string; target: number; saved: number; paid: boolean;
  /** Older goals have no kind and are plain savings. */
  kind?: 'savings' | 'investment';
  /** Expected annual return in percent (investments). */
  rate?: number;
  /** Planned monthly contribution (investments). */
  monthly?: number;
  /** Optional target date, YYYY-MM-DD. */
  deadline?: string;
  /** Money added to this goal, dated, so the monthly budget can see what was set aside. */
  log?: { date: string; amt: number }[];
}
export interface Skill { id: string; name: string; icon: string; cat: string }
export interface Step { id: string; text: string; done: boolean }
export interface Objective { id: string; title: string; due: string; steps: Step[]; done: boolean; paid: boolean }
export interface Review { wk: string; win: string; lesson: string; next: string }
export interface Reward { id: string; name: string; cost: number }
export interface Timer { start: number; min: number; label: string; skillId: string }
export interface LogEntry { t: number; xp: number; area: Area; why: string }

export interface State {
  v: number;
  name: string;
  cur: string;
  xp: number;
  gold: number;
  areaXp: Partial<Record<Area, number>>;
  daily: Record<string, number>;
  log: LogEntry[];
  habits: Habit[];
  tasks: Task[];
  /** Country you are based in right now (ISO code), and where you have been. */
  country: string;
  stays: Stay[];
  /** How income is split into budget buckets (percent per bucket, summing to 100). */
  alloc: { basis: 'logged' | 'expected'; expected: number; pct: Record<'essentials' | 'guilt' | 'debt' | 'savings' | 'invest', number> };
  /** Expense category -> bucket overrides. */
  catMap: Record<string, string>;
  timer: Timer | null;
  focus: Focus[];
  blocks: Block[];
  tx: Tx[];
  txXp: Record<string, number>;
  budget: Record<string, number>;
  goals: Goal[];
  skills: Skill[];
  objectives: Objective[];
  wins: { d: string; text: string }[];
  reviews: Review[];
  trophies: Record<string, string>;
  rewards: Reward[];
  ui: { month: string; tf: 'open' | 'done' | 'all' };
}

export interface Fx {
  toast: (msg: string, big?: boolean) => void;
  confetti: () => void;
}

export interface Field {
  k: string;
  l: string;
  t?: 'text' | 'number' | 'date' | 'time' | 'select' | 'textarea' | 'icons';
  v?: string | number;
  o?: [string, string][];
  dl?: string[];
  ph?: string;
  req?: boolean;
  /** Small helper text under the control. */
  hint?: string;
  /** Only show (and validate) this field when another field has the given value. */
  showIf?: [key: string, value: string];
  /** Hide this field when another field has the given value. */
  hideIf?: [key: string, value: string];
}
