'use client';
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import type { AuthUser, Field, Fx, State } from './types';
import { DEF, checkTrophies, finishTimer } from './engine';
import { beep, confettiBurst } from './fx';
import { EMPTY_FX, hoursSince, type FxData } from './fx-rates';

const FX_KEY = 'lifeos.fx';
const FX_REFRESH_HOURS = 6;
const LEGACY_KEY = 'lifeos.v1'; // pre-account, browser-only data; migrated once on first sign-in
const SAVE_DELAY = 700;

export interface ModalSpec {
  id: number;
  title: string;
  fields: Field[];
  btn: string;
  onSubmit: (v: Record<string, string>) => void;
  extra?: ReactNode;
  /** Return a message to block the save and show it in the form, or null when the values are fine. */
  validate?: (v: Record<string, string>) => string | null;
}
export interface DialogSpec {
  title: string;
  message: string;
  confirmLabel: string;
  danger: boolean;
  alertOnly: boolean;
}
export interface AskOpts { title: string; message: string; confirmLabel?: string; danger?: boolean; alertOnly?: boolean }
export interface ToastItem { id: number; msg: string; big?: boolean }
export type SyncStatus = 'saved' | 'saving' | 'error';

export interface Store {
  s: State;
  /** Exchange rates (units per 1 USD). `status` says whether they're live, cached from an earlier visit, or missing. */
  fx: FxData;
  refreshFx: () => Promise<void>;
  user: AuthUser;
  sync: SyncStatus;
  now: number;
  act: (fn: (s: State, fx: Fx) => void) => void;
  replace: (s: State) => void;
  openForm: (title: string, fields: Field[], onSubmit: (v: Record<string, string>) => void, opts?: { btn?: string; extra?: ReactNode; validate?: ModalSpec['validate'] }) => void;
  closeForm: () => void;
  modal: ModalSpec | null;
  /** In-app replacement for window.confirm / window.alert. Resolves true when confirmed. */
  ask: (o: AskOpts) => Promise<boolean>;
  dialog: DialogSpec | null;
  answer: (ok: boolean) => void;
  toasts: ToastItem[];
  toast: (msg: string, big?: boolean) => void;
}

const Ctx = createContext<Store>(null as unknown as Store);
export const useStore = () => useContext(Ctx);

async function fetchState(): Promise<State | null> {
  const r = await fetch('/api/state', { cache: 'no-store' });
  if (!r.ok) throw new Error('load failed');
  return (await r.json()).data;
}

export function StoreProvider({ user, children }: { user: AuthUser; children: ReactNode }) {
  const [state, setState] = useState<State | null>(null);
  const [loadError, setLoadError] = useState(false);
  const ref = useRef<State | null>(null);
  const [modal, setModal] = useState<ModalSpec | null>(null);
  const [dialog, setDialog] = useState<DialogSpec | null>(null);
  const resolver = useRef<((ok: boolean) => void) | null>(null);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [sync, setSync] = useState<SyncStatus>('saved');
  const [now, setNow] = useState(() => Date.now());
  const [fx, setFx] = useState<FxData>(EMPTY_FX);
  const seq = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dirty = useRef(false);

  const toast = useCallback((msg: string, big?: boolean) => {
    const id = ++seq.current;
    setToasts((t) => [...t, { id, msg, big }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), big ? 3800 : 2200);
  }, []);

  const flush = useCallback(async () => {
    if (timer.current) { clearTimeout(timer.current); timer.current = null; }
    if (!dirty.current || !ref.current) return;
    dirty.current = false;
    setSync('saving');
    try {
      const r = await fetch('/api/state', {
        method: 'PUT', keepalive: true,
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(ref.current),
      });
      if (!r.ok) throw new Error(String(r.status));
      setSync(dirty.current ? 'saving' : 'saved');
    } catch {
      dirty.current = true;
      setSync('error');
    }
  }, []);

  const persist = useCallback(() => {
    dirty.current = true;
    setSync('saving');
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(flush, SAVE_DELAY);
  }, [flush]);

  const act = useCallback((fn: (s: State, fx: Fx) => void) => {
    if (!ref.current) return;
    const n = structuredClone(ref.current);
    const effects: (() => void)[] = [];
    const fx: Fx = {
      toast: (m, b) => effects.push(() => toast(m, b)),
      confetti: () => effects.push(confettiBurst),
    };
    fn(n, fx);
    ref.current = n;
    setState(n);
    persist();
    effects.forEach((e) => e());
  }, [toast, persist]);

  const replace = useCallback((n: State) => {
    ref.current = n;
    setState(n);
    persist();
  }, [persist]);

  // load this user's state from Neon (migrating any pre-account browser data once)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        let loaded = await fetchState();
        let migrated = false;
        if (!loaded) {
          try {
            const raw = localStorage.getItem(LEGACY_KEY);
            if (raw) { loaded = JSON.parse(raw); migrated = true; }
          } catch { /* ignore unreadable legacy data */ }
        }
        if (cancelled) return;
        const s: State = { ...DEF(), ...(loaded ?? {}) };
        s.ui = { ...DEF().ui, ...s.ui };
        s.cur = '$'; // USD is the primary currency
        checkTrophies(s, { toast: () => {}, confetti: () => {} });
        ref.current = s;
        setState(s);
        if (!loaded || migrated) { persist(); if (migrated) toast('Imported your saved progress into your account', true); }
      } catch {
        if (!cancelled) setLoadError(true);
      }
    })();
    return () => { cancelled = true; };
  }, [persist, toast]);

  // exchange rates: show the last cached copy instantly, then fetch fresh ones (and again every few hours)
  const refreshFx = useCallback(async () => {
    try {
      const r = await fetch('/api/fx', { cache: 'no-store' });
      if (!r.ok) throw new Error(String(r.status));
      const d = await r.json();
      const next: FxData = { rates: { USD: 1, ...d.rates }, updated: d.updated, fetchedAt: Date.now(), status: 'live' };
      setFx(next);
      try { localStorage.setItem(FX_KEY, JSON.stringify(next)); } catch { /* storage unavailable */ }
    } catch {
      setFx((f) => (f.status === 'live' ? f : { ...f, status: f.fetchedAt ? 'cached' : 'none' }));
    }
  }, []);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(FX_KEY);
      if (raw) setFx({ ...(JSON.parse(raw) as FxData), status: 'cached' });
    } catch { /* ignore a corrupt cache */ }
    refreshFx();
    const iv = setInterval(() => refreshFx(), FX_REFRESH_HOURS * 36e5);
    const vis = () => {
      if (document.visibilityState !== 'visible') return;
      try {
        const c = JSON.parse(localStorage.getItem(FX_KEY) || 'null') as FxData | null;
        if (!c || hoursSince(c.fetchedAt) > FX_REFRESH_HOURS) refreshFx();
      } catch { refreshFx(); }
    };
    document.addEventListener('visibilitychange', vis);
    return () => { clearInterval(iv); document.removeEventListener('visibilitychange', vis); };
  }, [refreshFx]);

  // flush pending changes when the tab is hidden or closed
  useEffect(() => {
    const h = () => { if (document.visibilityState === 'hidden') flush(); };
    document.addEventListener('visibilitychange', h);
    window.addEventListener('pagehide', flush);
    return () => { document.removeEventListener('visibilitychange', h); window.removeEventListener('pagehide', flush); };
  }, [flush]);

  // focus timer heartbeat
  const timerOn = !!state?.timer;
  useEffect(() => {
    if (!timerOn) return;
    const iv = setInterval(() => {
      setNow(Date.now());
      const tm = ref.current?.timer;
      if (tm && Date.now() >= tm.start + tm.min * 60000) {
        act((s, fx) => finishTimer(s, fx, false));
        beep();
      }
    }, 1000);
    setNow(Date.now());
    return () => clearInterval(iv);
  }, [timerOn, act]);

  const openForm: Store['openForm'] = useCallback((title, fields, onSubmit, opts) => {
    setModal({ id: ++seq.current, title, fields, onSubmit, btn: opts?.btn ?? 'Save', extra: opts?.extra, validate: opts?.validate });
  }, []);
  const closeForm = useCallback(() => setModal(null), []);
  const ask = useCallback((o: AskOpts) => new Promise<boolean>((resolve) => {
    resolver.current?.(false);
    resolver.current = resolve;
    setDialog({ title: o.title, message: o.message, confirmLabel: o.confirmLabel ?? 'Confirm', danger: !!o.danger, alertOnly: !!o.alertOnly });
  }), []);
  const answer = useCallback((ok: boolean) => {
    resolver.current?.(ok);
    resolver.current = null;
    setDialog(null);
  }, []);

  if (loadError) {
    return (
      <div className="auth"><div className="card auth-card">
        <h1>Couldn&apos;t load your data</h1>
        <p className="muted">The database didn&apos;t respond. Check your connection and Neon settings, then retry.</p>
        <button className="btn" onClick={() => location.reload()}>Retry</button>
      </div></div>
    );
  }
  if (!state) return <div className="auth"><div className="muted">Loading your world…</div></div>;
  return (
    <Ctx.Provider value={{ s: state, fx, refreshFx, user, sync, now, act, replace, openForm, closeForm, modal, ask, dialog, answer, toasts, toast }}>
      {children}
    </Ctx.Provider>
  );
}
