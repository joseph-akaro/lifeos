'use client';
import type { ComponentType } from 'react';
import type { Tab } from '@/lib/types';
import { AVATARS, DEF, TITLES, gstreak, lvl, titleIdx, xpFor } from '@/lib/engine';
import { useStore } from '@/lib/store';
import { today } from '@/lib/util';
import { Bar, ModalHost, Toasts } from './ui';
import Home from './views/Home';
import Quests from './views/Quests';
import TimeView from './views/TimeView';
import Money from './views/Money';
import Skills from './views/Skills';
import Career from './views/Career';
import Trophies from './views/Trophies';

const VIEWS: Record<Tab, ComponentType> = { home: Home, quests: Quests, time: TimeView, money: Money, skills: Skills, career: Career, trophies: Trophies };
const NAV: [Tab, string, string][] = [
  ['home', '🏠', 'Home'], ['quests', '⚔️', 'Quests'], ['time', '⏱️', 'Time'], ['money', '💰', 'Money'],
  ['skills', '🧠', 'Skills'], ['career', '💼', 'Career'], ['trophies', '🏆', 'Rewards'],
];

function Hud() {
  const { s, act, replace, openForm, closeForm } = useStore();
  const l = lvl(s.xp), cur = xpFor(l), nx = xpFor(l + 1), idx = titleIdx(l);

  const exportData = () => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([JSON.stringify(s, null, 2)], { type: 'application/json' }));
    a.download = `lifeos-backup-${today()}.json`;
    a.click();
  };
  const importData = () => {
    const i = document.createElement('input');
    i.type = 'file'; i.accept = '.json';
    i.onchange = async () => {
      const f = i.files?.[0];
      if (!f) return;
      try { replace({ ...DEF(), ...JSON.parse(await f.text()) }); closeForm(); }
      catch { alert('Invalid backup file'); }
    };
    i.click();
  };
  const settings = () =>
    openForm('Settings',
      [{ k: 'name', l: 'Your name', v: s.name }, { k: 'cur', l: 'Currency symbol', v: s.cur }],
      (v) => act((x) => { x.name = v.name; x.cur = v.cur; }),
      {
        extra: (
          <>
            <hr style={{ border: 0, borderTop: '1px solid var(--line)', margin: '14px 0' }} />
            <div className="row wrap-r" style={{ marginBottom: 14 }}>
              <button type="button" className="btn ghost sm" onClick={exportData}>⬇ Export backup</button>
              <button type="button" className="btn ghost sm" onClick={importData}>⬆ Import backup</button>
              <button type="button" className="btn danger"
                onClick={() => { if (confirm('Erase ALL LifeOS data and start over? Export a backup first!')) { replace(DEF()); closeForm(); } }}>Reset all</button>
            </div>
          </>
        ),
      });

  return (
    <div className="hud">
      <div className="avatar">{AVATARS[idx]}</div>
      <div className="mid">
        <div className="nm">{s.name} <small>Lv {l} · {TITLES[idx]}</small></div>
        <Bar p={((s.xp - cur) / (nx - cur)) * 100} />
        <div className="small muted" style={{ marginTop: 3 }}>{s.xp - cur} / {nx - cur} XP to level {l + 1}</div>
      </div>
      <div className="chips">
        <span className="chip">🔥 {gstreak(s)}<span className="hide-s"> day streak</span></span>
        <span className="chip" style={{ color: 'var(--gold)' }}>🪙 {s.gold}</span>
      </div>
      <button className="icon-btn" onClick={settings} title="Settings">⚙️</button>
    </div>
  );
}

export default function Shell() {
  const { s, act } = useStore();
  const View = VIEWS[s.ui.tab];
  return (
    <>
      <div className="app">
        <nav>
          <div className="logo">LifeOS</div>
          {NAV.map(([k, ic, n]) => (
            <button key={k} className={s.ui.tab === k ? 'on' : ''}
              onClick={() => { act((x) => { x.ui.tab = k; }); window.scrollTo(0, 0); }}>
              <span className="ic">{ic}</span>{n}
            </button>
          ))}
        </nav>
        <div className="wrap">
          <div id="top"><Hud /></div>
          <main><View /></main>
        </div>
      </div>
      <ModalHost />
      <Toasts />
    </>
  );
}
