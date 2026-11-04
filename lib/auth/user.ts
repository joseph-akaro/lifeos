import { auth } from './server';
import type { AuthUser } from '../types';

const adminEmails = () =>
  (process.env.ADMIN_EMAILS ?? 'josephmmakaro@gmail.com')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

/** The signed-in user for this request (or null). Admin status comes from ADMIN_EMAILS, never from the client. */
export async function getUser(): Promise<AuthUser | null> {
  const { data: session } = await auth.getSession();
  const u = session?.user;
  if (!u) return null;
  return {
    id: u.id,
    email: u.email,
    name: u.name || u.email.split('@')[0],
    isAdmin: adminEmails().includes(u.email.toLowerCase()),
  };
}
