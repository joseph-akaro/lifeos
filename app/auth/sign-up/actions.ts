'use server';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth/server';

export async function signUpWithEmail(_prev: { error: string } | null, formData: FormData) {
  const email = String(formData.get('email') ?? '').trim();
  if (!email) return { error: 'Email address is required.' };
  const password = String(formData.get('password') ?? '');
  if (password.length < 8) return { error: 'Use a password with at least 8 characters.' };
  const { error } = await auth.signUp.email({
    email,
    name: String(formData.get('name') ?? '').trim() || email.split('@')[0],
    password,
  });
  if (error) return { error: error.message || 'Could not create the account.' };
  redirect('/');
}
