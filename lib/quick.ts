import type { Area } from './types';
import type { Store } from './store';
import { AREA_OPTS, DIFF, EXP_CATS, INC_CATS, SKILL_CATS, award } from './engine';
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

export const addTx = ({ act, openForm }: Ctx) =>
  openForm('New transaction', [
    { k: 'type', l: 'Type', t: 'select', o: [['expense', 'Expense'], ['income', 'Income']], v: 'expense' },
    { k: 'amt', l: 'Amount', t: 'number' },
    { k: 'cat', l: 'Category', dl: [...EXP_CATS, ...INC_CATS], ph: 'Food, Salary…' },
    { k: 'note', l: 'Note', req: false },
    { k: 'date', l: 'Date', t: 'date', v: today() },
  ], (v) => act((x, fx) => {
    const amt = +v.amt;
    if (!(amt > 0)) return;
    x.tx.push({ id: uid(), type: v.type as 'income' | 'expense', amt, cat: v.cat.trim() || 'Other', note: v.note, date: v.date });
    x.ui.month = monthOf(v.date);
    const c = x.txXp[today()] || 0;
    if (c < 3) { x.txXp[today()] = c + 1; award(x, fx, 5, 'wealth', 'Logged ' + v.type); }
  }), { btn: 'Add' });

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
