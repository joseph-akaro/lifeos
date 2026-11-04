'use client';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { AREAS, AREA_KEYS, areaLvl } from '@/lib/engine';
import type { Area, Field, State } from '@/lib/types';
import { useStore, type ModalSpec } from '@/lib/store';
import { pad, today } from '@/lib/util';
import { Icon } from './Icon';

/* ───────── small pieces ───────── */

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

export const Chk = ({ on, onClick, label }: { on: boolean; onClick: () => void; label?: string }) => (
  <button className={`chk ${on ? 'on' : ''}`} onClick={onClick} role="checkbox" aria-checked={on} aria-label={label}>
    {on && <Icon n="bx-check" />}
  </button>
);

export const Empty = ({ children }: { children: ReactNode }) => <div className="empty">{children}</div>;

export function Radar({ s }: { s: State }) {
  const lv = AREA_KEYS.map((k) => areaLvl(s, k));
  const mx = Math.max(5, ...lv), cx = 110, cy = 110, R = 74, n = AREA_KEYS.length;
  const pt = (i: number, f: number): [number, number] => {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / n;
    return [cx + Math.cos(a) * R * f, cy + Math.sin(a) * R * f];
  };
  const ring = (f: number) => AREA_KEYS.map((_, i) => pt(i, f).join(',')).join(' ');
  return (
    <svg viewBox="-26 0 272 220" width="100%" style={{ maxWidth: 260, display: 'block', margin: 'auto' }} role="img" aria-label="Level in each life area">
      {[0.33, 0.66, 1].map((f) => <polygon key={f} points={ring(f)} fill="none" stroke="var(--line)" />)}
      {AREA_KEYS.map((_, i) => <line key={i} x1={cx} y1={cy} x2={pt(i, 1)[0]} y2={pt(i, 1)[1]} stroke="var(--line)" />)}
      <polygon points={AREA_KEYS.map((_, i) => pt(i, lv[i] / mx).join(',')).join(' ')} fill="var(--accent)" fillOpacity=".3" stroke="var(--accent)" strokeWidth="2" strokeLinejoin="round" />
      {AREA_KEYS.map((k, i) => {
        const [x, y] = pt(i, 1.28);
        return <text key={k} x={x} y={y} textAnchor="middle" dominantBaseline="middle" fontSize="10.5" fontWeight="600" fill="var(--mute)">{AREAS[k].n} {lv[i]}</text>;
      })}
    </svg>
  );
}

/* ───────── popover plumbing (replaces native select / date / datalist popups) ───────── */

function useOutside(ref: React.RefObject<HTMLElement | null>, cb: () => void) {
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) cb(); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [ref, cb]);
}

/** Opens a fixed-position panel under (or above, if cramped) the trigger button. */
function usePopover(height: number) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number; width: number } | null>(null);
  const wrap = useRef<HTMLDivElement>(null);
  const btn = useRef<HTMLButtonElement>(null);
  useOutside(wrap, () => setOpen(false));
  const toggle = () => {
    if (!open && btn.current) {
      const r = btn.current.getBoundingClientRect();
      const up = r.bottom + height > window.innerHeight && r.top > height;
      setPos({ top: up ? r.top - height - 4 : r.bottom + 4, left: r.left, width: r.width });
    }
    setOpen((o) => !o);
  };
  return { open, setOpen, pos, wrap, btn, toggle };
}

function Dropdown({ value, options, onChange, k, label }: { value: string; options: [string, string][]; onChange: (v: string) => void; k: string; label?: string }) {
  const p = usePopover(Math.min(240, options.length * 36 + 8));
  const cur = options.find((o) => o[0] === value);
  const onKey = (e: React.KeyboardEvent) => {
    const i = options.findIndex((o) => o[0] === value);
    if (e.key === 'Escape' && p.open) { e.stopPropagation(); p.setOpen(false); }
    else if (e.key === 'ArrowDown') { e.preventDefault(); onChange(options[Math.min(options.length - 1, i + 1)][0]); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); onChange(options[Math.max(0, i - 1)][0]); }
  };
  return (
    <div ref={p.wrap} className="sel">
      <button type="button" ref={p.btn} data-k={k} className="selbtn" onClick={p.toggle} onKeyDown={onKey}
        aria-haspopup="listbox" aria-expanded={p.open} aria-label={label}>
        <span>{cur?.[1] ?? 'Select…'}</span><Icon n="bx-chevron-down" />
      </button>
      {p.open && p.pos && (
        <div className="pop list" role="listbox" style={p.pos}>
          {options.map((o) => (
            <div key={o[0]} role="option" aria-selected={o[0] === value} className={`opt ${o[0] === value ? 'on' : ''}`}
              onClick={() => { onChange(o[0]); p.setOpen(false); }}>
              <span>{o[1]}</span>{o[0] === value && <Icon n="bx-check" />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function DateField({ value, onChange, k }: { value: string; onChange: (v: string) => void; k: string }) {
  const p = usePopover(318);
  const [view, setView] = useState(() => (value || today()).slice(0, 7));
  const [y, m] = view.split('-').map(Number);
  const first = (new Date(y, m - 1, 1).getDay() + 6) % 7; // Monday first
  const days = new Date(y, m, 0).getDate();
  const shift = (n: number) => { const d = new Date(y, m - 1 + n, 1); setView(`${d.getFullYear()}-${pad(d.getMonth() + 1)}`); };
  const t = today();
  const label = value ? new Date(value + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }) : 'Pick a date';
  const pick = (v: string) => { onChange(v); p.setOpen(false); };
  return (
    <div ref={p.wrap} className="sel">
      <button type="button" ref={p.btn} data-k={k} className="selbtn" onClick={() => { setView((value || t).slice(0, 7)); p.toggle(); }}
        onKeyDown={(e) => { if (e.key === 'Escape' && p.open) { e.stopPropagation(); p.setOpen(false); } }} aria-haspopup="dialog" aria-expanded={p.open}>
        <span>{label}</span><Icon n="bx-calendar" />
      </button>
      {p.open && p.pos && (
        <div className="pop cal" role="dialog" aria-label="Choose a date" style={{ top: p.pos.top, left: p.pos.left, width: Math.max(p.pos.width, 280) }}>
          <div className="calhead">
            <button type="button" className="icon-btn" onClick={() => shift(-1)} aria-label="Previous month"><Icon n="bx-chevron-left" /></button>
            <b>{MONTHS[m - 1]} {y}</b>
            <button type="button" className="icon-btn" onClick={() => shift(1)} aria-label="Next month"><Icon n="bx-chevron-right" /></button>
          </div>
          <div className="calgrid">
            {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => <span key={i} className="dow">{d}</span>)}
            {Array.from({ length: first }, (_, i) => <span key={'b' + i} />)}
            {Array.from({ length: days }, (_, i) => {
              const v = `${view}-${pad(i + 1)}`;
              return <button type="button" key={v} className={`day ${v === value ? 'sel' : ''} ${v === t ? 'today' : ''}`} onClick={() => pick(v)}>{i + 1}</button>;
            })}
          </div>
          <div className="calfoot"><button type="button" className="btn ghost sm" onClick={() => pick(t)}>Today</button></div>
        </div>
      )}
    </div>
  );
}

const HOURS: [string, string][] = Array.from({ length: 24 }, (_, i) => [pad(i), pad(i)]);

function TimeField({ value, onChange, k }: { value: string; onChange: (v: string) => void; k: string }) {
  const [h, mi] = (value || '09:00').split(':');
  const mins: [string, string][] = Array.from({ length: 12 }, (_, i) => [pad(i * 5), pad(i * 5)]);
  if (!mins.some((x) => x[0] === mi)) mins.push([mi, mi]);
  return (
    <div className="timefield">
      <Dropdown k={k} value={h} options={HOURS} onChange={(v) => onChange(`${v}:${mi}`)} label="Hour" />
      <span className="muted">:</span>
      <Dropdown k={k + '-m'} value={mi} options={mins} onChange={(v) => onChange(`${h}:${v}`)} label="Minute" />
    </div>
  );
}

/* ───────── modal form (inline validation, no browser bubbles) ───────── */

function ModalForm({ modal }: { modal: ModalSpec }) {
  const { closeForm } = useStore();
  const [vals, setVals] = useState<Record<string, string>>(() =>
    Object.fromEntries(modal.fields.map((f) => [f.k, String(f.v ?? (f.t === 'select' || f.t === 'icons' ? f.o?.[0]?.[0] : '') ?? '')])));
  const [errs, setErrs] = useState<Record<string, string>>({});
  const root = useRef<HTMLFormElement>(null);
  const set = (k: string, v: string) => { setVals((x) => ({ ...x, [k]: v })); setErrs((x) => { const n = { ...x }; delete n[k]; return n; }); };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const bad: Record<string, string> = {};
    for (const f of modal.fields) {
      const v = (vals[f.k] ?? '').trim();
      if (f.req !== false && !v) bad[f.k] = f.t === 'number' ? 'Enter a number' : f.t === 'date' ? 'Pick a date' : 'This field is required';
      else if (f.t === 'number' && v && !Number.isFinite(+v)) bad[f.k] = 'Enter a valid number';
    }
    if (Object.keys(bad).length) {
      setErrs(bad);
      const first = modal.fields.find((f) => bad[f.k]);
      requestAnimationFrame(() => root.current?.querySelector<HTMLElement>(`[name="${first?.k}"],[data-k="${first?.k}"]`)?.focus());
      return;
    }
    closeForm();
    modal.onSubmit(vals);
  };

  const control = (f: Field, i: number) => {
    const v = vals[f.k] ?? '';
    if (f.t === 'select') return <Dropdown k={f.k} value={v} options={f.o!} onChange={(x) => set(f.k, x)} label={f.l} />;
    if (f.t === 'date') return <DateField k={f.k} value={v} onChange={(x) => set(f.k, x)} />;
    if (f.t === 'time') return <TimeField k={f.k} value={v} onChange={(x) => set(f.k, x)} />;
    if (f.t === 'icons')
      return (
        <div className="iconpick" role="radiogroup" aria-label={f.l}>
          {f.o!.map((o) => (
            <button type="button" key={o[0]} role="radio" aria-checked={v === o[0]} title={o[1]} className={v === o[0] ? 'on' : ''} onClick={() => set(f.k, o[0])}>
              <Icon n={o[0]} />
            </button>
          ))}
        </div>
      );
    if (f.t === 'textarea')
      return <textarea name={f.k} value={v} placeholder={f.ph} autoFocus={i === 0} onChange={(e) => set(f.k, e.target.value)} />;
    return (
      <>
        <input name={f.k} type={f.t === 'number' ? 'number' : 'text'} {...(f.t === 'number' ? { step: 'any', min: 0 } : {})}
          value={v} placeholder={f.ph} autoComplete="off" autoFocus={i === 0} onChange={(e) => set(f.k, e.target.value)} />
        {f.dl && (
          <div className="sugs">
            {f.dl.filter((x, j, a) => a.indexOf(x) === j).map((x) => (
              <button type="button" key={x} className={v === x ? 'on' : ''} onClick={() => set(f.k, x)}>{x}</button>
            ))}
          </div>
        )}
      </>
    );
  };

  return (
    <form ref={root} onSubmit={submit} noValidate>
      {modal.fields.map((f, i) => (
        <div className={`field ${errs[f.k] ? 'bad' : ''}`} key={f.k}>
          <label>{f.l}{f.req === false && <span className="opt-tag"> · optional</span>}</label>
          {control(f, i)}
          {errs[f.k] && <div className="ferr"><Icon n="bx-error-circle" /> {errs[f.k]}</div>}
        </div>
      ))}
      {modal.extra}
      <div className="row end">
        <button type="button" className="btn ghost" onClick={closeForm}>Cancel</button>
        <button className="btn">{modal.btn}</button>
      </div>
    </form>
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
      <div className="mbox" role="dialog" aria-modal="true" aria-label={modal.title}>
        <h3>{modal.title}</h3>
        <ModalForm key={modal.id} modal={modal} />
      </div>
    </div>
  );
}

/* ───────── confirm / alert dialog (replaces window.confirm & window.alert) ───────── */

export function ConfirmHost() {
  const { dialog, answer } = useStore();
  useEffect(() => {
    if (!dialog) return;
    const h = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.stopPropagation(); answer(false); }
    };
    document.addEventListener('keydown', h, true);
    return () => document.removeEventListener('keydown', h, true);
  }, [dialog, answer]);
  if (!dialog) return null;
  return (
    <div className="confirm-bg" onMouseDown={(e) => e.target === e.currentTarget && answer(false)}>
      <div className="mbox confirm" role="alertdialog" aria-modal="true" aria-label={dialog.title}>
        <div className={`cicon ${dialog.danger ? 'danger' : ''}`}><Icon n={dialog.danger ? 'bx-error' : 'bx-info-circle'} /></div>
        <h3>{dialog.title}</h3>
        <p className="muted">{dialog.message}</p>
        <div className="row end">
          {!dialog.alertOnly && <button className="btn ghost" autoFocus={dialog.danger} onClick={() => answer(false)}>Cancel</button>}
          <button className={`btn ${dialog.danger ? 'bad' : ''}`} autoFocus={!dialog.danger} onClick={() => answer(true)}>{dialog.confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}

export function Toasts() {
  const { toasts } = useStore();
  return (
    <div id="toasts" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className={`toast ${t.big ? 'big' : ''}`}>
          <Icon n={t.big ? 'bxs-star' : 'bxs-bolt'} />
          <span>{t.msg}</span>
        </div>
      ))}
    </div>
  );
}
