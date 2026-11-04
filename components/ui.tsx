'use client';
import { useEffect, type ReactNode } from 'react';
import { AREAS, AREA_KEYS, areaLvl } from '@/lib/engine';
import type { Area, State } from '@/lib/types';
import { useStore } from '@/lib/store';

export function Bar({ p, color }: { p: number; color?: string }) {
  return (
    <div className="bar">
      <i style={{ width: `${Math.max(0, Math.min(100, p))}%`, ...(color ? { background: color } : {}) }} />
    </div>
  );
}

export const AreaDot = ({ a }: { a: Area }) => (
  <span className="dot" style={{ background: AREAS[a].c }} title={AREAS[a].n} />
);

export const Chk = ({ on, onClick }: { on: boolean; onClick: () => void }) => (
  <button className={`chk ${on ? 'on' : ''}`} onClick={onClick}>{on ? '✓' : ''}</button>
);

export const Empty = ({ children }: { children: ReactNode }) => <div className="empty">{children}</div>;

export function Radar({ s }: { s: State }) {
  const lv = AREA_KEYS.map((k) => areaLvl(s, k));
  const mx = Math.max(5, ...lv), cx = 110, cy = 110, R = 78, n = AREA_KEYS.length;
  const pt = (i: number, f: number): [number, number] => {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / n;
    return [cx + Math.cos(a) * R * f, cy + Math.sin(a) * R * f];
  };
  const ring = (f: number) => AREA_KEYS.map((_, i) => pt(i, f).join(',')).join(' ');
  return (
    <svg viewBox="0 0 220 220" width="100%" style={{ maxWidth: 260, display: 'block', margin: 'auto' }}>
      {[0.33, 0.66, 1].map((f) => <polygon key={f} points={ring(f)} fill="none" stroke="var(--line)" />)}
      {AREA_KEYS.map((_, i) => <line key={i} x1={cx} y1={cy} x2={pt(i, 1)[0]} y2={pt(i, 1)[1]} stroke="var(--line)" />)}
      <polygon points={AREA_KEYS.map((_, i) => pt(i, lv[i] / mx).join(',')).join(' ')} fill="var(--accent)" fillOpacity=".35" stroke="var(--accent2)" strokeWidth="2" />
      {AREA_KEYS.map((k, i) => {
        const [x, y] = pt(i, 1.27);
        return <text key={k} x={x} y={y} textAnchor="middle" dominantBaseline="middle" fontSize="11" fill="var(--mute)">{AREAS[k].i} {lv[i]}</text>;
      })}
    </svg>
  );
}

export function ModalHost() {
  const { modal, closeForm } = useStore();
  useEffect(() => {
    if (!modal) return;
    const h = (e: KeyboardEvent) => e.key === 'Escape' && closeForm();
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [modal, closeForm]);
  if (!modal) return null;
  return (
    <div id="modal" className="open" onMouseDown={(e) => e.target === e.currentTarget && closeForm()}>
      <div className="mbox">
        <h3>{modal.title}</h3>
        <form
          key={modal.id}
          onSubmit={(e) => {
            e.preventDefault();
            const v = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;
            closeForm();
            modal.onSubmit(v);
          }}
        >
          {modal.fields.map((f, i) => {
            const req = f.req !== false;
            return (
              <label key={f.k}>
                {f.l}
                {f.t === 'select' ? (
                  <select name={f.k} defaultValue={String(f.v ?? f.o?.[0]?.[0] ?? '')}>
                    {f.o!.map((o) => <option key={o[0]} value={o[0]}>{o[1]}</option>)}
                  </select>
                ) : f.t === 'textarea' ? (
                  <textarea name={f.k} required={req} placeholder={f.ph} defaultValue={f.v as string} autoFocus={i === 0} />
                ) : (
                  <>
                    <input name={f.k} type={f.t || 'text'} defaultValue={f.v} placeholder={f.ph} required={req} autoComplete="off"
                      list={f.dl ? `dl_${f.k}` : undefined} autoFocus={i === 0}
                      {...(f.t === 'number' ? { step: 'any', min: 0 } : {})} />
                    {f.dl && <datalist id={`dl_${f.k}`}>{f.dl.map((x) => <option key={x} value={x} />)}</datalist>}
                  </>
                )}
              </label>
            );
          })}
          {modal.extra}
          <div className="row end">
            <button type="button" className="btn ghost" onClick={closeForm}>Cancel</button>
            <button className="btn">{modal.btn}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function Toasts() {
  const { toasts } = useStore();
  return (
    <div id="toasts">
      {toasts.map((t) => (
        <div key={t.id} className="toast" style={t.big ? { borderLeftColor: 'var(--accent2)' } : undefined}>{t.msg}</div>
      ))}
    </div>
  );
}
