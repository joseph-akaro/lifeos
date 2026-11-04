'use client';
import { TROPHIES } from '@/lib/engine';
import { useStore } from '@/lib/store';
import { uid } from '@/lib/util';
import { Empty } from '../ui';

export default function Trophies() {
  const { s, act, openForm } = useStore();
  const got = Object.keys(s.trophies).length;

  const addReward = () =>
    openForm('New reward', [
      { k: 'name', l: 'Reward', ph: '🍦 Ice cream' },
      { k: 'cost', l: 'Cost in 🪙', t: 'number', v: 100 },
    ], (v) => act((x) => { x.rewards.push({ id: uid(), name: v.name.trim(), cost: Math.round(+v.cost) }); }));

  const buy = (id: string) =>
    act((x, fx) => {
      const r = x.rewards.find((y) => y.id === id)!;
      if (x.gold < r.cost) return;
      x.gold -= r.cost;
      fx.toast(`Enjoy: ${r.name} 🎉`, true);
      fx.confetti();
    });

  return (
    <>
      <h2 className="pg">Trophies &amp; Rewards</h2>
      <div className="card">
        <h3>Trophies <span className="sub">{got}/{TROPHIES.length} unlocked · +50 XP each</span></h3>
        <div className="grid g4">
          {TROPHIES.map((t) => {
            const g = s.trophies[t.id];
            return (
              <div key={t.id} className={`trophy ${g ? 'got' : ''}`}>
                <div className="e">{t.i}</div><b>{t.n}</b><small>{t.d}</small>
                {g && <div className="small" style={{ color: 'var(--gold)' }}>{g}</div>}
              </div>
            );
          })}
        </div>
      </div>
      <div className="card" style={{ marginTop: 16 }}>
        <h3>Reward shop <span className="sub">spend your 🪙 {s.gold} on real-life treats</span> <button className="btn sm" onClick={addReward}>+ Reward</button></h3>
        {s.rewards.map((r) => (
          <div className="item" key={r.id}>
            <span className="t">{r.name}</span><span className="xp">🪙 {r.cost}</span>
            <button className="btn sm" disabled={s.gold < r.cost} onClick={() => buy(r.id)}>Redeem</button>
            <button className="btn danger" onClick={() => act((x) => { x.rewards = x.rewards.filter((y) => y.id !== r.id); })}>✕</button>
          </div>
        ))}
        {!s.rewards.length && <Empty>Add rewards you will actually enjoy.</Empty>}
      </div>
    </>
  );
}
