export type Area = 'time' | 'wealth' | 'career' | 'skills' | 'vitality';
export type Tab = 'home' | 'quests' | 'time' | 'money' | 'skills' | 'career' | 'trophies';

export interface Habit { id: string; name: string; area: Area; diff: number; done: string[] }
export interface Task { id: string; text: string; area: Area; diff: number; due: string; done: boolean }
export interface Focus { date: string; min: number; skillId: string; label: string }
export interface Block { id: string; date: string; label: string; area: Area; start: string; end: string; done: boolean }
export interface Tx { id: string; type: 'income' | 'expense'; amt: number; cat: string; note: string; date: string }
export interface Goal { id: string; name: string; target: number; saved: number; paid: boolean }
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
  ui: { tab: Tab; month: string; tf: 'open' | 'done' | 'all' };
}

export interface Fx {
  toast: (msg: string, big?: boolean) => void;
  confetti: () => void;
}

export interface Field {
  k: string;
  l: string;
  t?: 'text' | 'number' | 'date' | 'time' | 'select' | 'textarea';
  v?: string | number;
  o?: [string, string][];
  dl?: string[];
  ph?: string;
  req?: boolean;
}
