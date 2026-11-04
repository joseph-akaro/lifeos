import type { Projection } from '@/lib/finance';

/** Balance (solid) vs. money you put in (dashed). The gap between them is the interest. */
export default function GoalChart({ series, target }: { series: Projection['series']; target: number }) {
  const W = 300, H = 84, P = 4;
  const top = Math.max(target, series[series.length - 1].bal) * 1.05 || 1;
  const x = (i: number) => P + (i / Math.max(1, series.length - 1)) * (W - P * 2);
  const y = (v: number) => H - P - (v / top) * (H - P * 2);
  const line = (k: 'bal' | 'paid') => series.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(p[k]).toFixed(1)}`).join(' ');
  const ty = y(target);
  return (
    <svg className="gchart" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" role="img" aria-label="Projected balance over time">
      <line x1={P} x2={W - P} y1={ty} y2={ty} stroke="var(--gold)" strokeDasharray="3 3" strokeWidth="1" vectorEffect="non-scaling-stroke" />
      <path d={`${line('bal')} L${x(series.length - 1)},${H - P} L${x(0)},${H - P} Z`} fill="var(--wealth)" opacity=".14" />
      <path d={line('paid')} fill="none" stroke="var(--mute)" strokeDasharray="4 3" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
      <path d={line('bal')} fill="none" stroke="var(--wealth)" strokeWidth="2" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}
