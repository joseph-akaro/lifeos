'use client';
import { addTx } from '@/lib/quick';
import { EXP_CATS, INC_CATS, award, fmt, monthTx, sumTx } from '@/lib/engine';
import { useStore } from '@/lib/store';
import { addMonths, monthName, monthOf, today, uid } from '@/lib/util';
import { Bar, Empty } from '../ui';
import { Icon } from '../Icon';

export default function Money() {
  const { s, act, openForm, ask } = useStore();
  const m = s.ui.month, cur = s.cur, f = (n: number) => fmt(cur, n);
  const tx = monthTx(s, m).sort((a, b) => (a.date < b.date ? 1 : -1));
  const inc = sumTx(monthTx(s, m, 'income')), exp = sumTx(monthTx(s, m, 'expense')), net = inc - exp;
  const bk = Object.keys(s.budget);
  const totB = bk.reduce((a, k) => a + s.budget[k], 0);
  const expTx = monthTx(s, m, 'expense');
  const spB = bk.reduce((a, k) => a + sumTx(expTx.filter((t) => t.cat === k)), 0);
  const isNow = m === monthOf(today());
  const dim = new Date(+m.slice(0, 4), +m.slice(5), 0).getDate();
  const left = Math.max(1, dim - new Date().getDate() + 1);
  const cats: Record<string, number> = {};
  expTx.forEach((t) => { cats[t.cat] = (cats[t.cat] || 0) + t.amt; });
  const catKeys = [...new Set([...bk, ...Object.keys(cats)])];
  const ms = Array.from({ length: 6 }, (_, i) => addMonths(m, i - 5));
  const vals = ms.map((x) => [sumTx(monthTx(s, x, 'income')), sumTx(monthTx(s, x, 'expense'))]);
  const mx = Math.max(1, ...vals.flat());
  const go = (n: number) => act((x) => { x.ui.month = addMonths(x.ui.month, n); });

  const setBudget = () =>
    openForm('Monthly budget', [
      { k: 'cat', l: 'Category', dl: EXP_CATS },
      { k: 'limit', l: 'Monthly limit', t: 'number' },
    ], (v) => act((x) => { x.budget[v.cat.trim()] = +v.limit; }));

  const addGoal = () =>
    openForm('New savings goal', [
      { k: 'name', l: 'Goal', ph: 'Emergency fund' },
      { k: 'target', l: 'Target amount', t: 'number' },
      { k: 'saved', l: 'Already saved', t: 'number', v: 0 },
    ], (v) => act((x) => {
      if (+v.target > 0) x.goals.push({ id: uid(), name: v.name.trim(), target: +v.target, saved: +v.saved || 0, paid: false });
    }), { btn: 'Create goal' });

  const fundGoal = (id: string, name: string) =>
    openForm('Add to ' + name, [{ k: 'amt', l: 'Amount', t: 'number' }], (v) => act((x, fx) => {
      const g = x.goals.find((y) => y.id === id)!;
      g.saved += +v.amt;
      award(x, fx, 20, 'wealth', 'Funded ' + g.name);
      if (g.saved >= g.target && !g.paid) {
        g.paid = true;
        award(x, fx, 200, 'wealth', 'Goal reached: ' + g.name);
        fx.confetti();
      }
    }), { btn: 'Add funds' });

  return (
    <>
      <h2 className="pg">Money
        <span className="row">
          <button className="icon-btn" onClick={() => go(-1)} aria-label="Previous month"><Icon n="bx-chevron-left" /></button>
          <b style={{ minWidth: 130, textAlign: 'center' }}>{monthName(m)}</b>
          <button className="icon-btn" onClick={() => go(1)} aria-label="Next month"><Icon n="bx-chevron-right" /></button>
        </span>
      </h2>
      <div className="grid g4" style={{ marginBottom: 16 }}>
        <div className="card tile"><div className="l">Income</div><div className="v" style={{ color: 'var(--good)' }}>{f(inc)}</div></div>
        <div className="card tile"><div className="l">Spent</div><div className="v">{f(exp)}</div></div>
        <div className="card tile"><div className="l">Net saved</div><div className="v" style={{ color: `var(--${net >= 0 ? 'good' : 'bad'})` }}>{f(net)}</div><div className="s">{inc ? Math.round((net / inc) * 100) + '% savings rate' : '—'}</div></div>
        <div className="card tile">
          <div className="l">{isNow && totB ? 'Safe to spend / day' : 'Budget used'}</div>
          <div className="v">{totB ? (isNow ? f(Math.max(0, (totB - spB) / left)) : Math.round((spB / totB) * 100) + '%') : '—'}</div>
          <div className="s">{totB ? `${f(spB)} of ${f(totB)}` : 'set budgets below'}</div>
        </div>
      </div>
      <div className="grid g2">
        <div className="card">
          <h3>Budgets <button className="btn sm" onClick={setBudget}>+ Budget</button></h3>
          {catKeys.map((k) => {
            const sp = cats[k] || 0, b = s.budget[k], p = b ? (sp / b) * 100 : 0;
            return (
              <div className="goalbar" key={k}>
                <div className="row">
                  <span className="grow">{k}</span>
                  <span className="small muted">{f(sp)}{b ? ' / ' + f(b) : ''}</span>
                  {b && <button className="btn danger" onClick={() => act((x) => { delete x.budget[k]; })} aria-label="Delete"><Icon n="bx-trash" /></button>}
                </div>
                {b && <Bar p={p} color={p > 100 ? 'var(--bad)' : p > 80 ? 'var(--career)' : 'var(--good)'} />}
              </div>
            );
          })}
          {!catKeys.length && <Empty>Set category limits to track your spending.</Empty>}
        </div>
        <div className="card">
          <h3>6-month trend <span className="sub"><span className="lg" style={{ background: 'var(--good)' }} /> income <span className="lg" style={{ background: 'var(--bad)' }} /> spent</span></h3>
          <div className="bars">
            {ms.map((x, i) => (
              <div className="b" key={x}>
                <div className="cols">
                  <i style={{ height: `${(vals[i][0] / mx) * 100}%`, background: 'var(--good)' }} />
                  <i style={{ height: `${(vals[i][1] / mx) * 100}%`, background: 'var(--bad)' }} />
                </div>
                {monthName(x).slice(0, 3)}
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="card" style={{ marginTop: 16 }}>
        <h3>Savings goals <button className="btn sm" onClick={addGoal}>+ Goal</button></h3>
        {s.goals.map((g) => (
          <div className="goalbar" key={g.id}>
            <div className="row">
              <b className="grow"><Icon n={g.paid ? 'bxs-check-circle' : 'bx-target-lock'} className="lead" /> {g.name}</b>
              <span className="small muted">{f(g.saved)} / {f(g.target)}</span>
              <button className="btn ghost sm" onClick={() => fundGoal(g.id, g.name)}>+ Add funds</button>
              <button className="btn danger" aria-label="Delete" onClick={async () => { if (await ask({ title: 'Delete this goal?', message: `“${g.name}” and the ${f(g.saved)} tracked toward it will be removed.`, confirmLabel: 'Delete', danger: true })) act((x) => { x.goals = x.goals.filter((y) => y.id !== g.id); }); }}><Icon n="bx-trash" /></button>
            </div>
            <Bar p={(g.saved / g.target) * 100} color="var(--wealth)" />
          </div>
        ))}
        {!s.goals.length && <Empty>Create a goal — an emergency fund, a trip, a laptop…</Empty>}
      </div>
      <div className="card" style={{ marginTop: 16 }}>
        <h3>Transactions <span className="sub">first 3 logged each day earn XP</span> <button className="btn sm" onClick={() => addTx({ act, openForm })}>+ Transaction</button></h3>
        {tx.map((t) => (
          <div className="item" key={t.id}>
            <span className="small muted" style={{ width: 78 }}>{t.date.slice(5)}</span>
            <span className="t">{t.note || t.cat} <span className="pill">{t.cat}</span></span>
            <b style={{ color: t.type === 'income' ? 'var(--good)' : 'var(--text)' }}>{t.type === 'income' ? '+' : '-'}{f(t.amt)}</b>
            <button className="btn danger" onClick={() => act((x) => { x.tx = x.tx.filter((y) => y.id !== t.id); })} aria-label="Delete"><Icon n="bx-trash" /></button>
          </div>
        ))}
        {!tx.length && <Empty>No transactions this month.</Empty>}
      </div>
    </>
  );
}
