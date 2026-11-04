'use client';
import { addTx, goalForm } from '@/lib/quick';
import { formatMoney } from '@/lib/fx-rates';
import FxCard, { useLocal } from '../FxCard';
import { duration, monthYear, project } from '@/lib/finance';
import GoalChart from '../GoalChart';
import { CAT_GROUPS, EXP_CATS, award, catIcon, fmt, monthTx, sumTx } from '@/lib/engine';
import { useStore } from '@/lib/store';
import { addMonths, monthName, monthOf, today, uid } from '@/lib/util';
import { Bar, Empty } from '../ui';
import { Icon } from '../Icon';

export default function Money() {
  const { s, act, openForm, ask, fx } = useStore();
  const { local } = useLocal();
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
  // group categories: budgeted ones under their group, spending without a limit under "Not budgeted yet"
  const groupOf = (c: string) => CAT_GROUPS.find((g) => g.cats.includes(c))?.id ?? 'other';
  const budgetGroups = [...CAT_GROUPS.map((g) => ({ id: g.id, title: g.title, hint: g.hint })), { id: 'other', title: 'Other', hint: 'Your own categories' }]
    .map((g) => {
      const keys = bk.filter((k) => groupOf(k) === g.id);
      return { ...g, keys, limit: keys.reduce((a, k) => a + s.budget[k], 0), spent: keys.reduce((a, k) => a + (cats[k] || 0), 0) };
    })
    .filter((g) => g.keys.length);
  const unbudgeted = Object.keys(cats).filter((k) => !(k in s.budget)).sort((a, b) => cats[b] - cats[a]);
  const unbudgetedSpend = unbudgeted.reduce((a, k) => a + cats[k], 0);
  const budgetLeft = totB - spB;
  const statusColor = (p: number) => (p > 100 ? 'var(--bad)' : p > 80 ? 'var(--career)' : 'var(--good)');
  const ms = Array.from({ length: 6 }, (_, i) => addMonths(m, i - 5));
  const vals = ms.map((x) => [sumTx(monthTx(s, x, 'income')), sumTx(monthTx(s, x, 'expense'))]);
  const mx = Math.max(1, ...vals.flat());
  const go = (n: number) => act((x) => { x.ui.month = addMonths(x.ui.month, n); });

  const setBudget = (cat = '') =>
    openForm(cat ? `Budget for ${cat}` : 'Set a category budget', [
      { k: 'cat', l: 'Category', dl: EXP_CATS, v: cat, ph: 'Pick one or type your own' },
      { k: 'limit', l: 'Monthly limit', t: 'number', v: cat && s.budget[cat] ? s.budget[cat] : undefined },
    ], (v) => act((x) => { x.budget[v.cat.trim()] = +v.limit; }), { btn: cat && s.budget[cat] ? 'Update budget' : 'Set budget' });

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
      <FxCard />
      <div className="grid g4" style={{ marginBottom: 16 }}>
        <div className="card tile"><div className="l">Income</div><div className="v" style={{ color: 'var(--good)' }}>{f(inc)}</div>{local(inc) && <div className="s">≈ {local(inc)}</div>}</div>
        <div className="card tile"><div className="l">Spent</div><div className="v">{f(exp)}</div>{local(exp) && <div className="s">≈ {local(exp)}</div>}</div>
        <div className="card tile"><div className="l">Net saved</div><div className="v" style={{ color: `var(--${net >= 0 ? 'good' : 'bad'})` }}>{f(net)}</div><div className="s">{inc ? Math.round((net / inc) * 100) + '% savings rate' : '—'}</div></div>
        <div className="card tile">
          <div className="l">{isNow && totB ? 'Safe to spend / day' : 'Budget used'}</div>
          <div className="v">{totB ? (isNow ? f(Math.max(0, (totB - spB) / left)) : Math.round((spB / totB) * 100) + '%') : '—'}</div>
          <div className="s">{totB ? `${f(spB)} of ${f(totB)}${isNow && local(Math.max(0, (totB - spB) / left)) ? ` · ≈ ${local(Math.max(0, (totB - spB) / left))}/day` : ''}` : 'set budgets below'}</div>
        </div>
      </div>
      <div className="card">
        <h3>Monthly budget by category <span className="sub">{monthName(m)}</span> <button className="btn sm" onClick={() => setBudget()}><Icon n="bx-plus" /> Set budget</button></h3>
        {budgetGroups.length > 0 && (
          <div className="bsum">
            <div className="row">
              <b>{f(spB)}</b><span className="muted">spent of {f(totB)} budgeted</span>
              <span className="grow" />
              <span className={`small ${budgetLeft < 0 ? 'neg' : 'muted'}`}>{budgetLeft >= 0 ? `${f(budgetLeft)} left` : `${f(-budgetLeft)} over`}</span>
            </div>
            <Bar p={totB ? (spB / totB) * 100 : 0} color={statusColor(totB ? (spB / totB) * 100 : 0)} />
          </div>
        )}
        {budgetGroups.map((g) => (
          <section className="bgroup" key={g.id}>
            <header><span className="gt">{g.title}</span><span className="small muted">{g.hint}</span><span className="grow" /><span className="small muted">{f(g.spent)} of {f(g.limit)}</span></header>
            {g.keys.map((k) => {
              const sp = cats[k] || 0, lim = s.budget[k], p = (sp / lim) * 100, rest = lim - sp;
              return (
                <div className="brow" key={k}>
                  <span className="bic"><Icon n={catIcon(k)} /></span>
                  <div className="grow">
                    <div className="row"><b className="grow">{k}</b><span className="small">{f(sp)} <span className="muted">/ {f(lim)}</span></span></div>
                    <Bar p={p} color={statusColor(p)} />
                    <div className={`small ${rest < 0 ? 'neg' : 'muted'}`} style={{ marginTop: 3 }}>{rest >= 0 ? `${f(rest)} left` : `${f(-rest)} over budget`}</div>
                  </div>
                  <button className="btn danger" onClick={() => setBudget(k)} aria-label={`Edit ${k} budget`}><Icon n="bx-edit-alt" /></button>
                  <button className="btn danger" onClick={() => act((x) => { delete x.budget[k]; })} aria-label={`Remove ${k} budget`}><Icon n="bx-trash" /></button>
                </div>
              );
            })}
          </section>
        ))}
        {unbudgeted.length > 0 && (
          <section className="bgroup">
            <header><span className="gt">Not budgeted yet</span><span className="small muted">Spending with no limit</span><span className="grow" /><span className="small muted">{f(unbudgetedSpend)} spent</span></header>
            {unbudgeted.map((k) => (
              <div className="brow" key={k}>
                <span className="bic"><Icon n={catIcon(k)} /></span>
                <div className="grow row"><b className="grow">{k}</b><span className="small">{f(cats[k])}</span></div>
                <button className="btn ghost sm" onClick={() => setBudget(k)}>Set limit</button>
              </div>
            ))}
          </section>
        )}
        {!budgetGroups.length && !unbudgeted.length && <Empty>No budget yet. Set a monthly limit for a category like Food or Transport and track it here.</Empty>}
      </div>
      <div className="grid g2" style={{ marginTop: 16 }}>
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
        <div className="card">
          <h3>Goals &amp; investments <button className="btn sm" onClick={() => goalForm({ act, openForm })}><Icon n="bx-plus" /> Goal</button></h3>
          {s.goals.map((g) => {
            const pr = project(g), inv = g.kind === 'investment';
            return (
              <div className="goalbar goal" key={g.id}>
                <div className="row">
                  <b className="grow"><Icon n={g.paid ? 'bxs-check-circle' : inv ? 'bx-trending-up' : 'bx-target-lock'} className="lead" /> {g.name}
                    {inv && <span className="pill inv">{g.rate || 0}% / yr</span>}</b>
                  <span className="small muted">{f(g.saved)} / {f(g.target)}</span>
                  <button className="btn ghost sm" onClick={() => fundGoal(g.id, g.name)}>+ Add funds</button>
                  <button className="btn danger" aria-label={`Edit ${g.name}`} onClick={() => goalForm({ act, openForm }, g)}><Icon n="bx-edit-alt" /></button>
                  <button className="btn danger" aria-label={`Delete ${g.name}`} onClick={async () => { if (await ask({ title: 'Delete this goal?', message: `“${g.name}” and the ${f(g.saved)} tracked toward it will be removed.`, confirmLabel: 'Delete', danger: true })) act((x) => { x.goals = x.goals.filter((y) => y.id !== g.id); }); }}><Icon n="bx-trash" /></button>
                </div>
                <Bar p={(g.saved / g.target) * 100} color="var(--wealth)" />
                {pr && (
                  <div className="proj">
                    {inv && (
                      <ul>
                        <li><Icon n="bx-coin-stack" /><span>Earning about <b>{f(Math.round(pr.monthlyInterest))}</b>/month in interest right now{g.monthly ? <>, adding <b>{f(g.monthly)}</b>/month</> : null}</span></li>
                        <li><Icon n="bx-flag" /><span>{g.saved >= g.target ? 'Target reached.' : pr.monthsToTarget != null
                          ? <>Reaches {f(g.target)} in <b>{duration(pr.monthsToTarget)}</b> ({monthYear(pr.monthsToTarget)})</>
                          : <>Won&apos;t reach {f(g.target)} within 100 years at this rate. Raise the monthly amount or the return.</>}</span></li>
                        <li><Icon n="bx-line-chart" /><span>Projected interest over {duration(pr.horizon)}: <b>{f(Math.round(pr.interest))}</b></span></li>
                      </ul>
                    )}
                    {pr.deadline && (
                      <div className={`dl ${pr.deadline.onTrack ? 'ok' : 'warn'}`}>
                        <Icon n={pr.deadline.onTrack ? 'bx-check-circle' : 'bx-error-circle'} />
                        <span>
                          By {g.deadline && new Date(g.deadline + 'T00:00:00').toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}:{' '}
                          {inv ? <>about <b>{f(Math.round(pr.deadline.fv))}</b> — {pr.deadline.onTrack ? 'on track' : `${f(Math.round(g.target - pr.deadline.fv))} short`}. </> : null}
                          {pr.deadline.onTrack && inv ? '' : <>Needs <b>{f(Math.ceil(pr.deadline.neededMonthly))}</b>/month{inv ? ' to hit the target' : ' to get there on time'}.</>}
                        </span>
                      </div>
                    )}
                    {inv && <GoalChart series={pr.series} target={g.target} />}
                    {inv && <div className="small muted gleg"><span className="ln solid" /> balance <span className="ln dash" /> what you put in <span className="ln gold" /> target</div>}
                  </div>
                )}
              </div>
            );
          })}
          {!s.goals.length && <Empty>Create a goal — an emergency fund, a trip, or an investment that earns interest.</Empty>}
          {s.goals.some((g) => g.kind === 'investment') && <div className="small muted gnote">Projections assume a fixed annual return, compounded monthly. Real returns vary and aren&apos;t guaranteed.</div>}
        </div>
      </div>
      <div className="card" style={{ marginTop: 16 }}>
        <h3>Transactions <span className="sub">first 3 logged each day earn XP</span> <button className="btn sm" onClick={() => addTx({ act, openForm, fx, s })}>+ Transaction</button></h3>
        {tx.map((t) => (
          <div className="item" key={t.id}>
            <span className="small muted" style={{ width: 78 }}>{t.date.slice(5)}</span>
            <span className="t">{t.note || t.cat} <span className="pill">{t.cat}</span></span>
            {t.cur && t.orig != null && <span className="small muted" title={t.rate ? `at 1 USD = ${t.rate} ${t.cur}` : undefined}>{formatMoney(t.cur, t.orig)}</span>}
            <b style={{ color: t.type === 'income' ? 'var(--good)' : 'var(--text)' }}>{t.type === 'income' ? '+' : '-'}{f(t.amt)}</b>
            <button className="btn danger" onClick={() => act((x) => { x.tx = x.tx.filter((y) => y.id !== t.id); })} aria-label="Delete"><Icon n="bx-trash" /></button>
          </div>
        ))}
        {!tx.length && <Empty>No transactions this month.</Empty>}
      </div>
    </>
  );
}
