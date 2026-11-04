'use client';
import Link from 'next/link';
import { useActionState } from 'react';
import { Icon } from '@/components/Icon';
import { signInWithEmail } from './actions';

export default function SignIn() {
  const [state, action, pending] = useActionState(signInWithEmail, null);
  return (
    <div className="auth">
      <form action={action} className="card auth-card" noValidate>
        <div className="logo"><span className="mark"><Icon n="bxs-bolt" /></span>LifeOS</div>
        <h1>Welcome back</h1>
        <p className="muted">Sign in to continue your run.</p>
        <label>Email<input name="email" type="email" required autoComplete="email" autoFocus /></label>
        <label>Password<input name="password" type="password" required autoComplete="current-password" /></label>
        {state?.error && <div className="err" role="alert"><Icon n="bx-error-circle" /> {state.error}</div>}
        <button className="btn" disabled={pending}>{pending ? 'Signing in…' : 'Sign in'}</button>
        <p className="muted small">New here? <Link href="/auth/sign-up">Create an account</Link></p>
      </form>
    </div>
  );
}
