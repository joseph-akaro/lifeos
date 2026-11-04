import { getUser } from '@/lib/auth/user';
import { FX_CODES } from '@/lib/countries';

export const dynamic = 'force-dynamic';

/**
 * Daily mid-market rates (USD base) from open.er-api.com, cached for 6 hours on the server.
 * Rates By Exchange Rate API — https://www.exchangerate-api.com
 */
export async function GET() {
  const user = await getUser();
  if (!user) return Response.json({ error: 'unauthorized' }, { status: 401 });
  try {
    const r = await fetch('https://open.er-api.com/v6/latest/USD', { next: { revalidate: 21600 } });
    if (!r.ok) throw new Error(String(r.status));
    const d = await r.json();
    if (d.result !== 'success') throw new Error('provider error');
    const rates: Record<string, number> = {};
    for (const c of FX_CODES) if (typeof d.rates?.[c] === 'number') rates[c] = d.rates[c];
    return Response.json({ rates, updated: d.time_last_update_utc });
  } catch {
    return Response.json({ error: 'rates unavailable' }, { status: 502 });
  }
}
