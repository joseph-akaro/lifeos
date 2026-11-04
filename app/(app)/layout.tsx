import { redirect } from 'next/navigation';
import Shell from '@/components/Shell';
import { getUser } from '@/lib/auth/user';
import { StoreProvider } from '@/lib/store';

export const dynamic = 'force-dynamic';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getUser();
  if (!user) redirect('/auth/sign-in');
  return (
    <StoreProvider user={user}>
      <Shell>{children}</Shell>
    </StoreProvider>
  );
}
