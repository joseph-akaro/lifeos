'use client';
import { addHabit, addTask } from '@/lib/quick';
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

  return (
    <>
      <h2 className="pg">Quests</h2>
      <div className="grid g2">
        <div className="card">
          <h3>Daily habits <button className="btn sm" onClick={() => addHabit({ act, openForm })}>+ Habit</button></h3>
          {s.habits.map((h) => <HabitRow key={h.id} h={h} deletable />)}
          {!s.habits.length && <Empty>Habits repeat daily. Build streaks!</Empty>}
        </div>
        <div className="card">
          <h3>One-off quests <button className="btn sm" onClick={() => addTask({ act, openForm })}>+ Quest</button></h3>
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
