'use client';
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import type { Field, Fx, State } from './types';
import { DEF, checkTrophies, finishTimer } from './engine';
import { beep, confettiBurst } from './fx';

const KEY = 'lifeos.v1';

export interface ModalSpec {
  id: number;
  title: string;
  fields: Field[];
  btn: string;
  onSubmit: (v: Record<string, string>) => void;
  extra?: ReactNode;
}
export interface ToastItem { id: number; msg: string; big?: boolean }

interface Store {
  s: State;
  now: number;
  act: (fn: (s: State, fx: Fx) => void) => void;
  replace: (s: State) => void;
  openForm: (title: string, fields: Field[], onSubmit: (v: Record<string, string>) => void, opts?: { btn?: string; extra?: ReactNode }) => void;
  closeForm: () => void;
  modal: ModalSpec | null;
  toasts: ToastItem[];
  toast: (msg: string, big?: boolean) => void;
}

const Ctx = createContext<Store>(null as unknown as Store);
export const useStore = () => useContext(Ctx);

function persist(s: State) {
  try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* storage unavailable */ }
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State | null>(null);
  const ref = useRef<State | null>(null);
  const [modal, setModal] = useState<ModalSpec | null>(null);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [now, setNow] = useState(() => Date.now());
  const seq = useRef(0);

  const toast = useCallback((msg: string, big?: boolean) => {
    const id = ++seq.current;
    setToasts((t) => [...t, { id, msg, big }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), big ? 3800 : 2200);
  }, []);

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
    persist(n);
    effects.forEach((e) => e());
  }, [toast]);

  const replace = useCallback((n: State) => {
    ref.current = n;
    setState(n);
    persist(n);
  }, []);

  // load once on the client
  useEffect(() => {
    let loaded: State;
    try {
      const raw = localStorage.getItem(KEY);
      loaded = raw ? { ...DEF(), ...JSON.parse(raw) } : DEF();
    } catch {
      loaded = DEF();
    }
    loaded.ui = { ...DEF().ui, ...loaded.ui };
    ref.current = loaded;
    setState(loaded);
    act((s, fx) => checkTrophies(s, fx));
  }, [act]);

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
    setModal({ id: ++seq.current, title, fields, onSubmit, btn: opts?.btn ?? 'Save', extra: opts?.extra });
  }, []);
  const closeForm = useCallback(() => setModal(null), []);

  if (!state) return null;
  return (
    <Ctx.Provider value={{ s: state, now, act, replace, openForm, closeForm, modal, toasts, toast }}>
      {children}
    </Ctx.Provider>
  );
}
