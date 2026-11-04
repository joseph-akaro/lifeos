import { notFound } from 'next/navigation';
import { getUser } from '@/lib/auth/user';
import { ensureSchema, sql } from '@/lib/db';
import { Icon } from '@/components/Icon';
import { AVATARS, TITLES, lvl, titleIdx } from '@/lib/engine';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const me = await getUser();
  if (!me?.isAdmin) notFound(); // non-admins can't even tell this page exists
  await ensureSchema();
  const rows = (await sql`
    SELECT user_id, email, name, xp, updated_at FROM app_state ORDER BY xp DESC LIMIT 500`) as
    { user_id: string; email: string; name: string; xp: number; updated_at: string }[];
  const weekAgo = Date.now() - 7 * 864e5;
  const active = rows.filter((r) => new Date(r.updated_at).getTime() > weekAgo).length;
  const total = rows.reduce((a, r) => a + r.xp, 0);

  return (
    <>
      <h2 className="pg">Admin <span className="pill adm">ADMIN</span></h2>
      <div className="grid g3" style={{ marginBottom: 16 }}>
        <div className="card tile"><div className="l">Players</div><div className="v">{rows.length}</div></div>
        <div className="card tile"><div className="l">Active (7 days)</div><div className="v">{active}</div></div>
        <div className="card tile"><div className="l">Total XP earned</div><div className="v">{total.toLocaleString()}</div></div>
      </div>
      <div className="card">
        <h3>Players <span className="sub">ranked by XP</span></h3>
        {rows.map((r, i) => {
          const l = lvl(r.xp);
          return (
            <div className="item" key={r.user_id}>
              <span className="muted small" style={{ width: 24 }}>{i + 1}</span>
              <span className="avatar sm"><Icon n={AVATARS[titleIdx(l)]} /></span>
              <span className="t"><b>{r.name}</b>{r.user_id === me.id && <span className="pill" style={{ marginLeft: 6 }}>you</span>}
                <div className="small muted">{r.email}</div></span>
              <span className="small muted">Lv {l} · {TITLES[titleIdx(l)]}</span>
              <span className="xp">{r.xp.toLocaleString()} XP</span>
              <span className="small muted" style={{ width: 90, textAlign: 'right' }}>{new Date(r.updated_at).toLocaleDateString()}</span>
            </div>
          );
        })}
        {!rows.length && <div className="empty">No players have saved progress yet.</div>}
      </div>
    </>
  );
}
