'use client';
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { AVATARS, DEF, TITLES, gstreak, lvl, titleIdx, xpFor } from '@/lib/engine';
import { NAV } from '@/lib/nav';
import { useStore } from '@/lib/store';
import { today } from '@/lib/util';
import CommandPalette from './CommandPalette';
import Nav from './Nav';
import { Bar, ModalHost, Toasts } from './ui';

const COLLAPSE_KEY = 'lifeos.nav.collapsed';

function Hud({ onSearch }: { onSearch: () => void }) {
  const { s, user, act, replace, openForm, closeForm } = useStore();
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
      [{ k: 'name', l: 'Display name in game', v: s.name }, { k: 'cur', l: 'Currency symbol', v: s.cur }],
      (v) => act((x) => { x.name = v.name; x.cur = v.cur; }),
      {
        extra: (
          <>
            <div className="small muted" style={{ marginBottom: 10 }}>Signed in as {user.email}{user.isAdmin ? ' · admin' : ''}</div>
            <hr style={{ border: 0, borderTop: '1px solid var(--line)', margin: '4px 0 14px' }} />
            <div className="row wrap-r" style={{ marginBottom: 14 }}>
              <button type="button" className="btn ghost sm" onClick={exportData}>⬇ Export backup</button>
              <button type="button" className="btn ghost sm" onClick={importData}>⬆ Import backup</button>
              <button type="button" className="btn danger"
                onClick={() => { if (confirm('Erase ALL your LifeOS progress and start over? Export a backup first!')) { replace(DEF()); closeForm(); } }}>Reset all</button>
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
      <button className="icon-btn" onClick={onSearch} title="Search (⌘K)">🔍</button>
      <button className="icon-btn" onClick={settings} title="Settings">⚙️</button>
    </div>
  );
}

const typing = (el: EventTarget | null) => {
  const t = el as HTMLElement | null;
  return !!t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable);
};

export default function Shell({ children }: { children: ReactNode }) {
  const { user, modal } = useStore();
  const router = useRouter();
  const [pal, setPal] = useState(false);
  const [collapsed, setCollapsed] = useState(() => {
    try { return localStorage.getItem(COLLAPSE_KEY) === '1'; } catch { return false; }
  });
  const lastG = useRef(0);

  const toggleNav = useCallback(() => {
    setCollapsed((c) => {
      try { localStorage.setItem(COLLAPSE_KEY, c ? '0' : '1'); } catch { /* ignore */ }
      return !c;
    });
  }, []);

  // ⌘K / Ctrl+K or "/" opens search; "g" then a letter jumps to a page
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setPal((p) => !p); return; }
      if (e.metaKey || e.ctrlKey || e.altKey || typing(e.target) || modal) return;
      if (e.key === '/') { e.preventDefault(); setPal(true); return; }
      if (e.key === 'b') { toggleNav(); return; }
      if (e.key === 'g') { lastG.current = Date.now(); return; }
      if (Date.now() - lastG.current < 1000) {
        const n = NAV.find((x) => x.key === e.key && (!x.admin || user.isAdmin));
        if (n) { lastG.current = 0; router.push(n.href); }
      }
    };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [router, user.isAdmin, modal, toggleNav]);

  return (
    <>
      <div className={`app ${collapsed ? 'collapsed' : ''}`}>
        <Nav onSearch={() => setPal(true)} collapsed={collapsed} onCollapse={toggleNav} />
        <div className="wrap">
          <div id="top"><Hud onSearch={() => setPal(true)} /></div>
          <main>{children}</main>
        </div>
      </div>
      <CommandPalette open={pal} onClose={() => setPal(false)} toggleNav={toggleNav} />
      <ModalHost />
      <Toasts />
    </>
  );
}
