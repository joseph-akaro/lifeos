'use server';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth/server';

export async function signUpWithEmail(_prev: { error: string } | null, formData: FormData) {
  const email = String(formData.get('email') ?? '').trim();
  if (!email) return { error: 'Email address is required.' };
  const { error } = await auth.signUp.email({
    email,
    name: String(formData.get('name') ?? '').trim() || email.split('@')[0],
    password: String(formData.get('password') ?? ''),
  });
  if (error) return { error: error.message || 'Could not create the account.' };
  redirect('/');
}
