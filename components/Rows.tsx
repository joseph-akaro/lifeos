'use client';
import type { Habit, Task } from '@/lib/types';
import { award, habitStreak } from '@/lib/engine';
import { useStore } from '@/lib/store';
import { today } from '@/lib/util';
import { AreaDot, Chk } from './ui';

export function HabitRow({ h, deletable }: { h: Habit; deletable?: boolean }) {
  const { act } = useStore();
  const t = today(), on = h.done.includes(t), st = habitStreak(h.done);
  const toggle = () =>
    act((s, fx) => {
      const x = s.habits.find((y) => y.id === h.id)!;
      const i = x.done.indexOf(t);
      if (i < 0) { x.done.push(t); award(s, fx, x.diff * 10, x.area, x.name); }
      else { x.done.splice(i, 1); award(s, fx, -x.diff * 10, x.area, 'Undo: ' + x.name); }
    });
  return (
    <div className={`item ${on ? 'done' : ''}`}>
      <Chk on={on} onClick={toggle} />
      <AreaDot a={h.area} />
      <span className="t">{h.name}</span>
      {st > 1 && <span className="pill">🔥 {st}</span>}
      <span className="xp">+{h.diff * 10}</span>
      {deletable && (
        <button className="btn danger" title="Delete"
          onClick={() => confirm('Delete this habit?') && act((s) => { s.habits = s.habits.filter((x) => x.id !== h.id); })}>✕</button>
      )}
    </div>
  );
}

export function TaskRow({ x }: { x: Task }) {
  const { act } = useStore();
  const overdue = x.due && x.due < today() && !x.done;
  const toggle = () =>
    act((s, fx) => {
      const t = s.tasks.find((y) => y.id === x.id)!;
      t.done = !t.done;
      award(s, fx, t.done ? t.diff * 15 : -t.diff * 15, t.area, (t.done ? '' : 'Undo: ') + t.text);
      if (t.done && s.tasks.every((y) => y.done)) fx.toast('🧹 Quest board cleared!', true);
    });
  return (
    <div className={`item ${x.done ? 'done' : ''}`}>
      <Chk on={x.done} onClick={toggle} />
      <AreaDot a={x.area} />
      <span className="t">
        {x.text}
        {x.due && <> <span className="pill" style={overdue ? { color: 'var(--bad)' } : undefined}>{x.due}</span></>}
      </span>
      <span className="xp">+{x.diff * 15}</span>
      <button className="btn danger" title="Delete" onClick={() => act((s) => { s.tasks = s.tasks.filter((y) => y.id !== x.id); })}>✕</button>
    </div>
  );
}
