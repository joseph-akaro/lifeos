'use client';
import { addTx, allocForm, assignForm, goalForm } from '@/lib/quick';
import { computeBudget } from '@/lib/budget';
import { formatMoney } from '@/lib/fx-rates';
import FxCard, { useLocal } from '../FxCard';
import { duration, monthYear, project } from '@/lib/finance';
import GoalChart from '../GoalChart';
import { award, fmt, monthTx, sumTx } from '@/lib/engine';
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
  const expTx = monthTx(s, m, 'expense');
  const isNow = m === monthOf(today());
  const dim = new Date(+m.slice(0, 4), +m.slice(5), 0).getDate();
  const left = Math.max(1, dim - new Date().getDate() + 1);
  // the income split: each bucket's share of this month's income, and how much of it is used
  const bud = computeBudget(s, m);
  const spendB = bud.buckets.filter((b) => b.kind === 'spend');
  const spendAlloc = spendB.reduce((a, b) => a + b.allocated, 0), spendUsed = spendB.reduce((a, b) => a + b.used, 0);
  const statusColor = (p: number) => (p > 100 ? 'var(--bad)' : p > 80 ? 'var(--career)' : 'var(--good)');
  const BUCKET_COLOR: Record<string, string> = { essentials: 'var(--time)', guilt: 'var(--vitality)', debt: 'var(--career)', savings: 'var(--skills)', invest: 'var(--wealth)' };
  const basisText = bud.basis === 'logged' ? 'income logged this month' : bud.basis === 'expected' ? 'expected monthly income' : '';
  const ms = Array.from({ length: 6 }, (_, i) => addMonths(m, i - 5));
  const vals = ms.map((x) => [sumTx(monthTx(s, x, 'income')), sumTx(monthTx(s, x, 'expense'))]);
  const mx = Math.max(1, ...vals.flat());
  const go = (n: number) => act((x) => { x.ui.month = addMonths(x.ui.month, n); });

  const fundGoal = (id: string, name: string) =>
    openForm('Add to ' + name, [{ k: 'amt', l: 'Amount', t: 'number' }], (v) => act((x, fx) => {
      const g = x.goals.find((y) => y.id === id)!;
      g.saved += +v.amt;
      (g.log ??= []).push({ date: today(), amt: +v.amt });
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
          <div className="l">{isNow && spendAlloc ? 'Safe to spend / day' : 'Spending used'}</div>
          <div className="v">{spendAlloc ? (isNow ? f(Math.max(0, (spendAlloc - spendUsed) / left)) : Math.round((spendUsed / spendAlloc) * 100) + '%') : '—'}</div>
          <div className="s">{spendAlloc ? `${f(spendUsed)} of ${f(spendAlloc)}${isNow && local(Math.max(0, (spendAlloc - spendUsed) / left)) ? ` · ≈ ${local(Math.max(0, (spendAlloc - spendUsed) / left))}/day` : ''}` : 'log income to see your budget'}</div>
        </div>
      </div>
      <div className="card">
        <h3>Monthly budget <span className="sub">{monthName(m)}</span>
          <button className="btn ghost sm" onClick={() => assignForm({ act, openForm, s })}>Assign category</button>
          <button className="btn sm" onClick={() => allocForm({ act, openForm, s })}><Icon n="bx-slider-alt" /> Edit split</button>
        </h3>
        {bud.base > 0 ? (
          <div className="bsum">
            <div className="row"><b>{f(bud.base)}</b><span className="muted">{basisText}</span></div>
            <div className="splitbar" role="img" aria-label={`Income split ${bud.buckets.map((b) => `${b.name} ${b.pct}%`).join(', ')}`}>
              {bud.buckets.map((b) => <i key={b.id} title={`${b.name} ${b.pct}%`} style={{ width: `${b.pct}%`, background: BUCKET_COLOR[b.id] }} />)}
            </div>
            <div className="small muted">{bud.buckets.map((b) => `${b.pct}%`).join(' / ')}{local(bud.base) ? ` · ≈ ${local(bud.base)} to split` : ''}</div>
          </div>
        ) : (
          <Empty>Log your income, or set an expected monthly income under Edit split, and LifeOS divides it for you: {bud.buckets.map((b) => `${b.pct}% ${b.name}`).join(', ')}.</Empty>
        )}
        {bud.buckets.map((b) => {
          const p = b.allocated ? (b.used / b.allocated) * 100 : 0;
          const goalKind = b.id === 'invest' ? 'an investment' : 'a savings';
          return (
            <section className="bucket" key={b.id}>
              <div className="brow">
                <span className="bic" style={{ color: BUCKET_COLOR[b.id], background: `color-mix(in srgb, ${BUCKET_COLOR[b.id]} 16%, var(--panel2))` }}><Icon n={b.icon} /></span>
                <div className="grow">
                  <div className="row">
                    <b>{b.name}</b><span className="pill">{b.pct}%</span><span className="grow" />
                    <span className="small"><b>{f(b.used)}</b> <span className="muted">of {f(b.allocated)}</span></span>
                  </div>
                  <Bar p={p} color={b.kind === 'spend' ? statusColor(p) : BUCKET_COLOR[b.id]} />
                  <div className="row small" style={{ marginTop: 3 }}>
                    <span className="muted">{b.hint}</span><span className="grow" />
                    {bud.base > 0 && (b.kind === 'spend'
                      ? <span className={b.left < 0 ? 'neg' : 'muted'}>{b.left >= 0 ? `${f(b.left)} left` : `${f(-b.left)} over`}</span>
                      : <span className="muted">{b.left <= 0 ? 'Fully set aside' : `${f(b.left)} still to set aside`}</span>)}
                  </div>
                  {local(b.allocated) && b.allocated > 0 && <div className="small muted">≈ {local(b.allocated)} for this bucket</div>}
                  {b.items.length > 0 && (
                    <div className="sugs ro">{b.items.map((i) => <span key={i.label} className="chipro">{i.label} <b>{f(i.amt)}</b></span>)}</div>
                  )}
                  {b.kind === 'save' && !s.goals.some((g) => (g.kind === 'investment') === (b.id === 'invest')) && (
                    <div className="small muted" style={{ marginTop: 4 }}>Create {goalKind} goal below, then use Add funds to count money toward this bucket.</div>
                  )}
                </div>
              </div>
            </section>
          );
        })}
        {Object.keys(s.catMap).length > 0 && (
          <div className="small muted bmap">Custom assignments: {Object.entries(s.catMap).map(([c, id]) => `${c} → ${bud.buckets.find((b) => b.id === id)?.name}`).join(', ')}</div>
        )}
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
