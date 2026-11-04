'use client';
import { addSkill, startFocus } from '@/lib/quick';
import { useRouter } from 'next/navigation';
import { TITLES, award, skillLvl, skillMin, skillMinFor, titleIdx } from '@/lib/engine';
import { useStore } from '@/lib/store';
import { addDays, hm, today, uid } from '@/lib/util';
import { Bar, Empty } from '../ui';

export default function Skills() {
  const { s, act, openForm } = useStore();
  const router = useRouter();
  const wk = addDays(today(), -6);

  const practice = (id: string, name: string) =>
    openForm('Log practice: ' + name, [
      { k: 'min', l: 'Minutes practiced', t: 'number', v: 30 },
      { k: 'note', l: 'What did you do?', req: false },
    ], (v) => act((x, fx) => {
      const sk = x.skills.find((y) => y.id === id)!;
      const m = Math.max(1, Math.round(+v.min)), before = skillLvl(skillMin(x, id));
      x.focus.push({ date: today(), min: m, skillId: id, label: v.note || sk.name });
      award(x, fx, m, 'skills', `${sk.name} +${m}m`);
      const after = skillLvl(skillMin(x, id));
      if (after > before) fx.toast(`${sk.icon} ${sk.name} reached Lv ${after}!`, true);
    }), { btn: 'Log' });

  return (
    <>
      <h2 className="pg">Skill tree <button className="btn" onClick={() => addSkill({ act, openForm })}>+ New skill</button></h2>
      <div className="grid g3">
        {s.skills.map((k) => {
          const m = skillMin(s, k.id), l = skillLvl(m), a = skillMinFor(l), b = skillMinFor(l + 1);
          const w = s.focus.filter((f) => f.skillId === k.id && f.date >= wk).reduce((x, f) => x + f.min, 0);
          return (
            <div className="card skill" key={k.id}>
              <div className="row">
                <span className="big">{k.icon}</span>
                <div className="grow"><b>{k.name}</b><div className="small muted">{k.cat} · {TITLES[titleIdx(l)]}</div></div>
                <span className="lvl">Lv {l}</span>
              </div>
              <div style={{ margin: '10px 0 4px' }}><Bar p={((m - a) / (b - a)) * 100} color="var(--skills)" /></div>
              <div className="small muted">{hm(m)} total · {hm(w)} this week · next level at {hm(b)}</div>
              <div className="row" style={{ marginTop: 10 }}>
                <button className="btn sm" onClick={() => practice(k.id, k.name)}>Log practice</button>
                <button className="btn ghost sm" onClick={() => { startFocus({ act }, 25, k.name, k.id); router.push('/time'); }}>⏱ Timer</button>
                <span className="grow" />
                <button className="btn danger" onClick={() => confirm('Delete this skill? Logged time stays in your focus history.') && act((x) => { x.skills = x.skills.filter((y) => y.id !== k.id); })}>✕</button>
              </div>
            </div>
          );
        })}
        {!s.skills.length && (
          <div className="card" style={{ gridColumn: '1/-1' }}>
            <Empty>Add the skills you want to level up — coding, design, a language, public speaking… Every minute of practice earns XP.</Empty>
          </div>
        )}
      </div>
    </>
  );
}
