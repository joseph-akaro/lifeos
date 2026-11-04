'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useMemo } from 'react';
import { NAV } from '@/lib/nav';
import { monthTx, sumTx } from '@/lib/engine';
import { authClient } from '@/lib/auth/client';
import { useStore } from '@/lib/store';
import { mondayOf, monthOf, pad, today } from '@/lib/util';
import type { State } from '@/lib/types';

type Badge = { text: string; tone: 'accent' | 'bad' | 'gold' | 'live' };

/** Live, state-derived hints so the menu shows what needs attention without opening each page. */
export function reviewDue(s: State) {
  const day = new Date().getDay(); // Fri, Sat, Sun
  return (day === 5 || day === 6 || day === 0) && !s.reviews.some((r) => r.wk === mondayOf(today()));
}

export function useBadges(): Record<string, Badge> {
  const { s, now } = useStore();
  return useMemo(() => {
    const t = today(), b: Record<string, Badge> = {};
    const pending = s.habits.filter((h) => !h.done.includes(t)).length + s.tasks.filter((x) => !x.done && x.due && x.due < t).length;
    if (pending) b['/quests'] = { text: String(pending), tone: 'accent' };
    if (s.timer) {
      const left = Math.max(0, Math.ceil((s.timer.start + s.timer.min * 60000 - now) / 1000));
      b['/time'] = { text: `${pad(Math.floor(left / 60))}:${pad(left % 60)}`, tone: 'live' };
    }
    const ex = monthTx(s, monthOf(t), 'expense');
    const over = Object.keys(s.budget).filter((k) => sumTx(ex.filter((x) => x.cat === k)) > s.budget[k]).length;
    if (over) b['/money'] = { text: `${over} over`, tone: 'bad' };
    if (reviewDue(s)) b['/career'] = { text: 'review', tone: 'accent' };
    const buy = s.rewards.filter((r) => s.gold >= r.cost).length;
    if (buy) b['/rewards'] = { text: String(buy), tone: 'gold' };
    return b;
  }, [s, now]);
}

export default function Nav({ onSearch, collapsed, onCollapse }: { onSearch: () => void; collapsed: boolean; onCollapse: () => void }) {
  const path = usePathname();
  const router = useRouter();
  const { user, sync } = useStore();
  const badges = useBadges();
  const items = NAV.filter((n) => !n.admin || user.isAdmin);
  const active = (href: string) => (href === '/' ? path === '/' : path === href || path.startsWith(href + '/'));

  const signOut = async () => {
    await authClient.signOut();
    router.replace('/auth/sign-in');
    router.refresh();
  };

  return (
    <nav>
      <div className="logo">{collapsed ? 'L' : 'LifeOS'}</div>
      <button className="navsearch" onClick={onSearch} title="Search or jump to… (⌘K)">
        <span className="ic">🔍</span><span className="lbl">Search…</span><kbd className="lbl">⌘K</kbd>
      </button>
      {items.map((n) => {
        const bd = badges[n.href];
        return (
          <Link key={n.href} href={n.href} className={active(n.href) ? 'on' : ''} title={`${n.label} (g then ${n.key})`}
            onClick={() => window.scrollTo(0, 0)}>
            <span className="ic">{n.icon}</span><span className="lbl">{n.label}</span>
            {bd && <span className={`badge ${bd.tone}`}>{bd.text}</span>}
          </Link>
        );
      })}
      <div className="spacer" />
      <div className="usercard">
        <div className="lbl" style={{ minWidth: 0 }}>
          <b className="nm1">{user.name}</b>
          <div className="small muted nm1">{user.email}</div>
          <div className="small">
            {user.isAdmin && <span className="pill adm">ADMIN</span>}{' '}
            <span className={`sync ${sync}`}>{sync === 'saved' ? '● Saved' : sync === 'saving' ? '● Saving…' : '● Not saved'}</span>
          </div>
        </div>
        <div className="row ubtns">
          <button className="icon-btn" onClick={onCollapse} title={collapsed ? 'Expand menu' : 'Collapse menu'}>{collapsed ? '»' : '«'}</button>
          <button className="icon-btn" onClick={signOut} title="Sign out">⎋</button>
        </div>
      </div>
    </nav>
  );
}
