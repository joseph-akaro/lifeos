'use client';
import { AREAS, AREA_OPTS, award, finishTimer } from '@/lib/engine';
import type { Area } from '@/lib/types';
import { useStore } from '@/lib/store';
import { addDays, hm, pad, toMin, today, uid } from '@/lib/util';
import { AreaDot, Chk, Empty } from '../ui';

export default function TimeView() {
  const { s, act, openForm, now } = useStore();
  const t = today(), tm = s.timer;
  const days = Array.from({ length: 7 }, (_, i) => addDays(t, i - 6));
  const mins = days.map((d) => s.focus.filter((f) => f.date === d).reduce((a, f) => a + f.min, 0));
  const mx = Math.max(30, ...mins);
  const blocks = s.blocks.filter((b) => b.date === t).sort((a, b) => (a.start < b.start ? -1 : 1));
  const len = (b: { start: string; end: string }) => toMin(b.end) - toMin(b.start);
  const planned = blocks.reduce((a, b) => a + len(b), 0);
  const done = blocks.filter((b) => b.done).reduce((a, b) => a + len(b), 0);
  const d0 = new Date(), nowPct = (d0.getHours() * 60 + d0.getMinutes()) / 14.4;
  const C = 2 * Math.PI * 84;
  const skillOpts: [string, string][] = [['', '— no skill —'], ...s.skills.map((k) => [k.id, `${k.icon} ${k.name}`] as [string, string])];

  let disp = '25:00', offset = C;
  if (tm) {
    const total = tm.min * 60000, left = Math.max(0, tm.start + total - now), sec = Math.ceil(left / 1000);
    disp = `${pad(Math.floor(sec / 60))}:${pad(sec % 60)}`;
    offset = C * (1 - (total - left) / total);
  }

  const start = (preset: string) => {
    const fields: Parameters<typeof openForm>[1] = [
      { k: 'label', l: 'What are you working on?', req: false, ph: 'Deep work' },
      { k: 'skillId', l: 'Practice a skill?', t: 'select', o: skillOpts },
    ];
    if (preset === 'custom') fields.unshift({ k: 'min', l: 'Minutes', t: 'number', v: 30 });
    openForm('Start focus', fields, (v) =>
      act((x) => { x.timer = { start: Date.now(), min: Math.max(1, +(preset === 'custom' ? v.min : preset)), label: v.label, skillId: v.skillId }; }), { btn: 'Start' });
  };

  const logFocus = () =>
    openForm('Log focus time', [
      { k: 'min', l: 'Minutes', t: 'number', v: 30 },
      { k: 'label', l: 'What', req: false },
      { k: 'skillId', l: 'Skill', t: 'select', o: skillOpts },
      { k: 'date', l: 'Date', t: 'date', v: t },
    ], (v) => act((x, fx) => {
      const m = Math.max(1, Math.round(+v.min));
      x.focus.push({ date: v.date, min: m, skillId: v.skillId, label: v.label });
      award(x, fx, m, v.skillId ? 'skills' : 'time', `${m} min logged`);
    }));

  const addBlock = () =>
    openForm('New time block', [
      { k: 'label', l: 'What', ph: 'Write proposal' },
      { k: 'area', l: 'Area', t: 'select', o: AREA_OPTS, v: 'career' },
      { k: 'start', l: 'Start', t: 'time', v: '09:00' },
      { k: 'end', l: 'End', t: 'time', v: '10:00' },
    ], (v) => act((x, fx) => {
      if (toMin(v.end) <= toMin(v.start)) { fx.toast('End must be after start'); return; }
      x.blocks.push({ id: uid(), date: t, label: v.label.trim(), area: v.area as Area, start: v.start, end: v.end, done: false });
    }), { btn: 'Add block' });

  const toggleBlock = (id: string) =>
    act((x, fx) => {
      const b = x.blocks.find((y) => y.id === id)!;
      b.done = !b.done;
      award(x, fx, b.done ? 10 : -10, b.area, (b.done ? '' : 'Undo: ') + b.label);
    });

  return (
    <>
      <h2 className="pg">Time &amp; Focus</h2>
      <div className="grid g2">
        <div className="card">
          <h3>Focus timer <span className="sub">1 min focus = 1 XP</span></h3>
          <div className="timer">
            <div className="ring">
              <svg width="190" height="190">
                <circle cx="95" cy="95" r="84" fill="none" stroke="var(--panel2)" strokeWidth="10" />
                <circle cx="95" cy="95" r="84" fill="none" stroke="var(--accent2)" strokeWidth="10" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={offset} />
              </svg>
              <div className="tx">{disp}</div>
            </div>
            {tm ? (
              <>
                <div className="muted small">{tm.label || 'Focus session'}</div>
                <button className="btn" onClick={() => act((x, fx) => finishTimer(x, fx, true))}>Stop &amp; bank time</button>
              </>
            ) : (
              <>
                <div className="row wrap-r" style={{ justifyContent: 'center' }}>
                  {[15, 25, 50, 90].map((m) => <button key={m} className="btn ghost sm" onClick={() => start(String(m))}>{m}m</button>)}
                  <button className="btn ghost sm" onClick={() => start('custom')}>Custom</button>
                </div>
                <div className="muted small">Pick a duration to start</div>
              </>
            )}
          </div>
        </div>
        <div className="card">
          <h3>Last 7 days <span className="sub">focus minutes</span></h3>
          <div className="bars">
            {days.map((d, i) => (
              <div className="b" key={d}>
                <span>{mins[i] || ''}</span>
                <div className="cols"><i style={{ height: `${(mins[i] / mx) * 100}%`, background: 'var(--time)' }} /></div>
                {new Date(d + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'short' })}
              </div>
            ))}
          </div>
          <div className="row end" style={{ marginTop: 10 }}><button className="btn ghost sm" onClick={logFocus}>+ Log time manually</button></div>
        </div>
      </div>
      <div className="card" style={{ marginTop: 16 }}>
        <h3>Today&apos;s time blocks <span className="sub">planned {hm(planned)} · done {hm(done)}</span> <button className="btn sm" onClick={addBlock}>+ Block</button></h3>
        <div className="strip">
          {blocks.map((b) => (
            <i key={b.id} title={b.label} style={{ left: `${toMin(b.start) / 14.4}%`, width: `${len(b) / 14.4}%`, background: AREAS[b.area].c, opacity: b.done ? 0.9 : 0.45 }} />
          ))}
          <b style={{ left: `${nowPct}%` }} />
        </div>
        <div className="ticks"><span>12am</span><span>6am</span><span>12pm</span><span>6pm</span><span>12am</span></div>
        {blocks.map((b) => (
          <div key={b.id} className={`item ${b.done ? 'done' : ''}`}>
            <Chk on={b.done} onClick={() => toggleBlock(b.id)} />
            <AreaDot a={b.area} />
            <span className="t"><b>{b.start}–{b.end}</b> {b.label}</span>
            <span className="xp">+10</span>
            <button className="btn danger" onClick={() => act((x) => { x.blocks = x.blocks.filter((y) => y.id !== b.id); })}>✕</button>
          </div>
        ))}
        {!blocks.length && <Empty>Plan your day: add time blocks, then tick them off for XP.</Empty>}
      </div>
    </>
  );
}
