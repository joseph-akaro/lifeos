import { auth } from '@/lib/auth/server';

// Everything except the auth pages/API, other API routes (they return 401 themselves) and static assets requires sign-in.
export default auth.middleware({ loginUrl: '/auth/sign-in' });

export const config = {
  matcher: ['/((?!api|auth|_next|favicon.ico).*)'],
};
