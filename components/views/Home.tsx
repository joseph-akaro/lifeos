'use client';
import { AREAS, AREA_KEYS, areaLvl, fmt, monthTx, skillMin, sumTx, totalFocus } from '@/lib/engine';
import { useStore } from '@/lib/store';
import { addDays, hm, monthOf, today } from '@/lib/util';
import { HabitRow, TaskRow } from '../Rows';
import { AreaDot, Bar, Empty, Radar } from '../ui';

export default function Home() {
  const { s, act } = useStore();
  const t = today(), m = monthOf(t);
  const inc = sumTx(monthTx(s, m, 'income')), exp = sumTx(monthTx(s, m, 'expense'));
  const focusToday = s.focus.filter((f) => f.date === t).reduce((a, f) => a + f.min, 0);
  const openTasks = s.tasks.filter((x) => !x.done && (!x.due || x.due <= t)).slice(0, 6);
  const doneH = s.habits.filter((h) => h.done.includes(t)).length;
  const maxA = Math.max(1, ...AREA_KEYS.map((k) => s.areaXp[k] || 0));
  const skillHours = s.skills.reduce((a, k) => a + skillMin(s, k.id), 0) / 60;

  const dow = (new Date().getDay() + 6) % 7, start = addDays(t, -(15 * 7 + dow));
  const cells = Array.from({ length: 16 * 7 }, (_, i) => {
    const d = addDays(start, i), xp = s.daily[d] || 0;
    const lv = xp <= 0 ? 0 : xp < 20 ? 1 : xp < 60 ? 2 : xp < 120 ? 3 : 4;
    return <i key={d} className={`${lv ? 'l' + lv : ''} ${d > t ? 'fut' : ''}`} title={`${d}: ${Math.max(0, xp)} XP`} />;
  });

  return (
    <>
      <h2 className="pg">Today <span className="muted small">{new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</span></h2>
      <div className="grid g4" style={{ marginBottom: 16 }}>
        <div className="card tile"><div className="l">Focus today</div><div className="v">{hm(focusToday)}</div><div className="s">{hm(totalFocus(s))} all-time</div></div>
        <div className="card tile"><div className="l">Habits</div><div className="v">{doneH}/{s.habits.length}</div><div className="s">done today</div></div>
        <div className="card tile"><div className="l">Saved this month</div><div className="v" style={{ color: `var(--${inc - exp >= 0 ? 'good' : 'bad'})` }}>{fmt(s.cur, inc - exp)}</div><div className="s">{fmt(s.cur, exp)} spent</div></div>
        <div className="card tile"><div className="l">Skill hours</div><div className="v">{skillHours.toFixed(1)}</div><div className="s">{s.skills.length} skills</div></div>
      </div>
      <div className="grid g2">
        <div className="card">
          <h3>Daily quests <span className="sub">{doneH}/{s.habits.length} habits</span></h3>
          {s.habits.length ? s.habits.map((h) => <HabitRow key={h.id} h={h} />) : <Empty>No habits yet — add some in Quests.</Empty>}
          {openTasks.map((x) => <TaskRow key={x.id} x={x} />)}
          <div className="row end" style={{ marginTop: 10 }}>
            <button className="btn ghost sm" onClick={() => act((x) => { x.ui.tab = 'quests'; })}>Manage quests →</button>
          </div>
        </div>
        <div className="card">
          <h3>Character stats <span className="sub">level per life area</span></h3>
          <Radar s={s} />
          <div className="areas">
            {AREA_KEYS.map((k) => (
              <div className="a" key={k}>
                <span>{AREAS[k].i} {AREAS[k].n}</span>
                <Bar p={((s.areaXp[k] || 0) / maxA) * 100} color={AREAS[k].c} />
                <span className="small muted">Lv {areaLvl(s, k)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="grid g2" style={{ marginTop: 16 }}>
        <div className="card"><h3>Activity <span className="sub">last 16 weeks</span></h3><div className="heat">{cells}</div></div>
        <div className="card">
          <h3>Recent XP</h3>
          {s.log.slice(0, 6).map((l, i) => (
            <div className="item" key={`${l.t}-${i}`}><AreaDot a={l.area} /><span className="t">{l.why}</span><span className="xp">+{l.xp}</span></div>
          ))}
          {!s.log.length && <Empty>Complete a quest to earn your first XP.</Empty>}
        </div>
      </div>
    </>
  );
}
