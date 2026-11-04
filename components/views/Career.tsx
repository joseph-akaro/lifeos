'use client';
import { award } from '@/lib/engine';
import { useStore } from '@/lib/store';
import { mondayOf, today, uid } from '@/lib/util';
import { Bar, Chk, Empty } from '../ui';

export default function Career() {
  const { s, act, openForm } = useStore();
  const wk = mondayOf(today());
  const reviewed = s.reviews.some((r) => r.wk === wk);

  const addObj = () =>
    openForm('New objective', [
      { k: 'title', l: 'Objective', ph: 'Get AWS certified' },
      { k: 'due', l: 'Target date (optional)', t: 'date', req: false },
    ], (v) => act((x) => { x.objectives.push({ id: uid(), title: v.title.trim(), due: v.due || '', steps: [], done: false, paid: false }); }), { btn: 'Create' });

  const addStep = (id: string) =>
    openForm('Add step', [{ k: 'text', l: 'Step' }], (v) => act((x) => {
      const o = x.objectives.find((y) => y.id === id)!;
      o.steps.push({ id: uid(), text: v.text.trim(), done: false });
      o.done = false;
    }));

  const toggleStep = (oid: string, sid: string) =>
    act((x, fx) => {
      const o = x.objectives.find((y) => y.id === oid)!, st = o.steps.find((y) => y.id === sid)!;
      st.done = !st.done;
      award(x, fx, st.done ? 15 : -15, 'career', (st.done ? '' : 'Undo: ') + st.text);
      o.done = o.steps.every((y) => y.done);
      if (o.done && !o.paid) {
        o.paid = true;
        award(x, fx, 100, 'career', 'Objective complete: ' + o.title);
        fx.confetti();
      }
    });

  const addWin = () =>
    openForm('Log a career win', [{ k: 'text', l: 'What did you achieve?', t: 'textarea' }], (v) =>
      act((x, fx) => { x.wins.unshift({ d: today(), text: v.text.trim() }); award(x, fx, 10, 'career', 'Career win'); }));

  const review = () =>
    openForm('Weekly review', [
      { k: 'win', l: 'Biggest win this week', t: 'textarea' },
      { k: 'lesson', l: 'What did I learn?', t: 'textarea' },
      { k: 'next', l: 'Top focus for next week', t: 'textarea' },
    ], (v) => act((x, fx) => {
      x.reviews.unshift({ wk, win: v.win, lesson: v.lesson, next: v.next });
      award(x, fx, 40, 'career', 'Weekly review');
    }), { btn: 'Complete review' });

  return (
    <>
      <h2 className="pg">Career
        <span className="row">
          <button className="btn ghost" onClick={addWin}>+ Log a win</button>
          <button className="btn" disabled={reviewed} onClick={review}>{reviewed ? 'Reviewed this week ✓' : 'Weekly review'}</button>
        </span>
      </h2>
      <div className="grid g2">
        <div className="card">
          <h3>Objectives <button className="btn sm" onClick={addObj}>+ Objective</button></h3>
          {s.objectives.map((o) => {
            const n = o.steps.length, d = o.steps.filter((x) => x.done).length;
            return (
              <div key={o.id} style={{ marginBottom: 14, paddingBottom: 10, borderBottom: '1px solid var(--line)' }}>
                <div className="row">
                  <b className="grow">{o.done ? '🚀 ' : '🧭 '}{o.title}</b>
                  {o.due && <span className="pill">{o.due}</span>}
                  <button className="btn danger" onClick={() => confirm('Delete this objective?') && act((x) => { x.objectives = x.objectives.filter((y) => y.id !== o.id); })}>✕</button>
                </div>
                {n > 0 && <Bar p={(d / n) * 100} color="var(--career)" />}
                {o.steps.map((st) => (
                  <div key={st.id} className={`item ${st.done ? 'done' : ''}`}>
                    <Chk on={st.done} onClick={() => toggleStep(o.id, st.id)} />
                    <span className="t">{st.text}</span><span className="xp">+15</span>
                  </div>
                ))}
                <div className="row end" style={{ marginTop: 6 }}>
                  <span className="small muted grow">Finish all steps for +100 bonus XP</span>
                  <button className="btn ghost sm" onClick={() => addStep(o.id)}>+ Step</button>
                </div>
              </div>
            );
          })}
          {!s.objectives.length && <Empty>Break big career goals (promotion, portfolio, certification) into steps.</Empty>}
        </div>
        <div>
          <div className="card">
            <h3>Wins journal <span className="sub">+10 XP each</span></h3>
            {s.wins.slice(0, 8).map((w, i) => (
              <div className="item" key={i}><span className="small muted" style={{ width: 60 }}>{w.d.slice(5)}</span><span className="t">{w.text}</span></div>
            ))}
            {!s.wins.length && <Empty>Shipped something? Got praise? Log it.</Empty>}
          </div>
          <div className="card" style={{ marginTop: 16 }}>
            <h3>Weekly reviews</h3>
            {s.reviews.slice(0, 3).map((r) => (
              <div key={r.wk} style={{ marginBottom: 10 }}>
                <div className="small muted">Week of {r.wk}</div>
                <div><b>Win:</b> {r.win}</div><div><b>Lesson:</b> {r.lesson}</div><div><b>Next:</b> {r.next}</div>
              </div>
            ))}
            {!s.reviews.length && <Empty>A 2-minute weekly reflection earns +40 XP.</Empty>}
          </div>
        </div>
      </div>
    </>
  );
}
