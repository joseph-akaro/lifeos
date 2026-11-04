'use client';
import { AREA_OPTS, DIFF } from '@/lib/engine';
import type { Area } from '@/lib/types';
import { useStore } from '@/lib/store';
import { uid } from '@/lib/util';
import { HabitRow, TaskRow } from '../Rows';
import { Empty } from '../ui';

export default function Quests() {
  const { s, act, openForm } = useStore();
  const f = s.ui.tf;
  const list = s.tasks
    .filter((x) => f === 'all' || (f === 'done' ? x.done : !x.done))
    .sort((a, b) => ((a.due || '9') < (b.due || '9') ? -1 : 1));

  const addHabit = () =>
    openForm('New habit', [
      { k: 'name', l: 'Habit', ph: 'e.g. Read 10 pages' },
      { k: 'area', l: 'Life area', t: 'select', o: AREA_OPTS, v: 'vitality' },
      { k: 'diff', l: 'Difficulty (10/20/30 XP)', t: 'select', o: DIFF, v: '1' },
    ], (v) => act((x) => { x.habits.push({ id: uid(), name: v.name.trim(), area: v.area as Area, diff: +v.diff, done: [] }); }), { btn: 'Add habit' });

  const addTask = () =>
    openForm('New quest', [
      { k: 'text', l: 'Quest', ph: 'e.g. Send invoice to client' },
      { k: 'area', l: 'Life area', t: 'select', o: AREA_OPTS, v: 'career' },
      { k: 'diff', l: 'Difficulty (15/30/45 XP)', t: 'select', o: DIFF, v: '1' },
      { k: 'due', l: 'Due date (optional)', t: 'date', req: false },
    ], (v) => act((x) => { x.tasks.push({ id: uid(), text: v.text.trim(), area: v.area as Area, diff: +v.diff, due: v.due || '', done: false }); }), { btn: 'Add quest' });

  return (
    <>
      <h2 className="pg">Quests</h2>
      <div className="grid g2">
        <div className="card">
          <h3>Daily habits <button className="btn sm" onClick={addHabit}>+ Habit</button></h3>
          {s.habits.map((h) => <HabitRow key={h.id} h={h} deletable />)}
          {!s.habits.length && <Empty>Habits repeat daily. Build streaks!</Empty>}
        </div>
        <div className="card">
          <h3>One-off quests <button className="btn sm" onClick={addTask}>+ Quest</button></h3>
          <div className="seg" style={{ marginBottom: 8 }}>
            {(['open', 'done', 'all'] as const).map((k) => (
              <button key={k} className={f === k ? 'on' : ''} onClick={() => act((x) => { x.ui.tf = k; })}>{k}</button>
            ))}
          </div>
          {list.map((x) => <TaskRow key={x.id} x={x} />)}
          {!list.length && <Empty>Nothing here. Add a quest!</Empty>}
        </div>
      </div>
    </>
  );
}
