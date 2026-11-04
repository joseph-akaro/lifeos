'use server';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth/server';

export async function signInWithEmail(_prev: { error: string } | null, formData: FormData) {
  const { error } = await auth.signIn.email({
    email: String(formData.get('email') ?? '').trim(),
    password: String(formData.get('password') ?? ''),
  });
  if (error) return { error: error.message || 'Could not sign in. Try again.' };
  redirect('/');
}
