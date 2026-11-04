'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { NAV } from '@/lib/nav';
import { addHabit, addSkill, addTask, addTx, addWin, startFocus, toggleHabit } from '@/lib/quick';
import { useStore } from '@/lib/store';
import { today } from '@/lib/util';
import { authClient } from '@/lib/auth/client';
import { reviewDue } from './Nav';

interface Item { id: string; icon: string; label: string; hint?: string; group: string; kw?: string; run: () => void }

export default function CommandPalette({ open, onClose, toggleNav }: { open: boolean; onClose: () => void; toggleNav: () => void }) {
  const store = useStore();
  const { s, user, act, openForm } = store;
  const router = useRouter();
  const [q, setQ] = useState('');
  const [sel, setSel] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) { setQ(''); setSel(0); setTimeout(() => inputRef.current?.focus(), 0); }
  }, [open]);

  const { suggested, all } = useMemo(() => {
    const t = today();
    const go = (href: string) => () => router.push(href);
    const ctx = { act, openForm };
    const undone = s.habits.filter((h) => !h.done.includes(t));

    const pages: Item[] = NAV.filter((n) => !n.admin || user.isAdmin).map((n) => ({
      id: 'go' + n.href, icon: n.icon, label: n.label, hint: `g ${n.key}`, group: 'Go to', kw: 'open page navigate', run: go(n.href),
    }));
    const actions: Item[] = [
      { id: 'a-habit', icon: '🔁', label: 'Add habit', group: 'Actions', kw: 'new create daily', run: () => addHabit(ctx) },
      { id: 'a-task', icon: '⚔️', label: 'Add quest', group: 'Actions', kw: 'new create task todo', run: () => addTask(ctx) },
      { id: 'a-tx', icon: '💸', label: 'Add transaction', group: 'Actions', kw: 'expense income money spend log', run: () => { router.push('/money'); addTx(ctx); } },
      { id: 'a-skill', icon: '🧠', label: 'Add skill', group: 'Actions', kw: 'new learn', run: () => { router.push('/skills'); addSkill(ctx); } },
      { id: 'a-win', icon: '🏅', label: 'Log a career win', group: 'Actions', kw: 'achievement', run: () => { router.push('/career'); addWin(ctx); } },
      s.timer
        ? { id: 'a-timer', icon: '⏱️', label: 'Open focus timer', group: 'Actions', kw: 'stop pomodoro', run: go('/time') }
        : { id: 'a-focus', icon: '🎯', label: 'Start 25-minute focus', group: 'Actions', kw: 'timer pomodoro deep work', run: () => { startFocus(ctx); router.push('/time'); } },
      { id: 'a-nav', icon: '↔️', label: 'Collapse / expand menu', group: 'Actions', kw: 'sidebar', run: toggleNav },
      { id: 'a-out', icon: '⎋', label: 'Sign out', group: 'Actions', kw: 'logout', run: async () => { await authClient.signOut(); router.replace('/auth/sign-in'); router.refresh(); } },
    ];
    const habits: Item[] = s.habits.map((h) => {
      const done = h.done.includes(t);
      return { id: 'h' + h.id, icon: done ? '✅' : '☐', label: `${done ? 'Undo' : 'Complete'}: ${h.name}`, group: 'Habits', kw: 'habit check', run: () => toggleHabit(act, h.id) };
    });
    const skills: Item[] = s.skills.map((k) => ({
      id: 'k' + k.id, icon: k.icon, label: `Practice ${k.name}`, hint: '25m timer', group: 'Skills', kw: 'skill learn timer',
      run: () => { startFocus({ act }, 25, k.name, k.id); router.push('/time'); },
    }));

    // context-aware suggestions shown before you type anything
    const sug: Item[] = [];
    if (s.timer) sug.push({ ...actions.find((a) => a.id === 'a-timer')!, group: 'Suggested', label: 'Focus session running — open timer' });
    undone.slice(0, 3).forEach((h) => sug.push({ ...habits.find((x) => x.id === 'h' + h.id)!, group: 'Suggested' }));
    if (reviewDue(s)) sug.push({ id: 's-rev', icon: '🔭', label: 'Do your weekly review (+40 XP)', group: 'Suggested', run: go('/career') });
    if (!s.tx.some((x) => x.date === t)) sug.push({ ...actions.find((a) => a.id === 'a-tx')!, group: 'Suggested', label: "Log today's spending" });
    if (!s.timer && sug.length < 5) sug.push({ ...actions.find((a) => a.id === 'a-focus')!, group: 'Suggested' });
    return { suggested: sug.slice(0, 5), all: [...pages, ...actions, ...habits, ...skills] };
  }, [s, user.isAdmin, act, openForm, router, toggleNav]);

  const results = useMemo(() => {
    const terms = q.toLowerCase().split(/\s+/).filter(Boolean);
    if (!terms.length) return [...suggested, ...all.filter((i) => i.group === 'Go to' || i.group === 'Actions')];
    return all
      .map((i) => {
        const hay = (i.label + ' ' + (i.kw ?? '')).toLowerCase();
        if (!terms.every((w) => hay.includes(w))) return null;
        return { i, score: i.label.toLowerCase().startsWith(terms[0]) ? 0 : 1 };
      })
      .filter((x): x is { i: Item; score: number } => !!x)
      .sort((a, b) => a.score - b.score)
      .map((x) => x.i);
  }, [q, suggested, all]);

  useEffect(() => setSel(0), [q]);
  useEffect(() => {
    document.querySelector('.pal-item.sel')?.scrollIntoView({ block: 'nearest' });
  }, [sel]);

  if (!open) return null;
  const run = (i?: Item) => { if (!i) return; onClose(); i.run(); };
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSel((x) => Math.min(results.length - 1, x + 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setSel((x) => Math.max(0, x - 1)); }
    else if (e.key === 'Enter') { e.preventDefault(); run(results[sel]); }
    else if (e.key === 'Escape') onClose();
  };

  let lastGroup = '';
  return (
    <div className="pal-bg" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="pal" role="dialog" aria-label="Command palette">
        <input ref={inputRef} value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={onKey}
          placeholder="Jump to a page, add something, complete a habit…" aria-label="Search commands" />
        <div className="pal-list">
          {results.map((i, idx) => {
            const head = i.group !== lastGroup ? <div className="pal-group">{i.group}</div> : null;
            lastGroup = i.group;
            return (
              <div key={i.group + i.id}>
                {head}
                <div className={`pal-item ${idx === sel ? 'sel' : ''}`} onMouseMove={() => setSel(idx)} onClick={() => run(i)}>
                  <span className="ic">{i.icon}</span><span className="grow">{i.label}</span>{i.hint && <kbd>{i.hint}</kbd>}
                </div>
              </div>
            );
          })}
          {!results.length && <div className="empty">Nothing matches “{q}”.</div>}
        </div>
        <div className="pal-foot"><span><kbd>↑↓</kbd> move</span><span><kbd>↵</kbd> run</span><span><kbd>esc</kbd> close</span></div>
      </div>
    </div>
  );
}
