'use client';
import Link from 'next/link';
import { useActionState } from 'react';
import { Icon } from '@/components/Icon';
import { signUpWithEmail } from './actions';

export default function SignUp() {
  const [state, action, pending] = useActionState(signUpWithEmail, null);
  return (
    <div className="auth">
      <form action={action} className="card auth-card" noValidate>
        <div className="logo"><span className="mark"><Icon n="bxs-bolt" /></span>LifeOS</div>
        <h1>Create your account</h1>
        <p className="muted">Your progress is saved to your account.</p>
        <label>Name<input name="name" required autoComplete="name" autoFocus /></label>
        <label>Email<input name="email" type="email" required autoComplete="email" /></label>
        <label>Password<input name="password" type="password" required autoComplete="new-password" /></label>
        {state?.error && <div className="err" role="alert"><Icon n="bx-error-circle" /> {state.error}</div>}
        <button className="btn" disabled={pending}>{pending ? 'Creating…' : 'Create account'}</button>
        <p className="muted small">Already have one? <Link href="/auth/sign-in">Sign in</Link></p>
      </form>
    </div>
  );
}
