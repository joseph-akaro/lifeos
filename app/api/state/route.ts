import { ensureSchema, sql } from '@/lib/db';
import { getUser } from '@/lib/auth/user';

export const dynamic = 'force-dynamic';
const MAX_BYTES = 2_000_000;

export async function GET() {
  const user = await getUser();
  if (!user) return Response.json({ error: 'unauthorized' }, { status: 401 });
  await ensureSchema();
  const rows = await sql`SELECT data FROM app_state WHERE user_id = ${user.id}`;
  return Response.json({ data: rows[0]?.data ?? null });
}

export async function PUT(req: Request) {
  const user = await getUser();
  if (!user) return Response.json({ error: 'unauthorized' }, { status: 401 });
  const text = await req.text();
  if (text.length > MAX_BYTES) return Response.json({ error: 'too large' }, { status: 413 });
  let body: unknown;
  try { body = JSON.parse(text); } catch { return Response.json({ error: 'bad json' }, { status: 400 }); }
  const d = body as { xp?: unknown; habits?: unknown };
  if (!d || typeof d !== 'object' || typeof d.xp !== 'number' || !Array.isArray(d.habits)) {
    return Response.json({ error: 'invalid state' }, { status: 400 });
  }
  await ensureSchema();
  await sql`
    INSERT INTO app_state (user_id, email, name, data, xp, updated_at)
    VALUES (${user.id}, ${user.email}, ${user.name}, ${text}::jsonb, ${Math.round(d.xp)}, now())
    ON CONFLICT (user_id) DO UPDATE
      SET email = EXCLUDED.email, name = EXCLUDED.name, data = EXCLUDED.data, xp = EXCLUDED.xp, updated_at = now()`;
  return Response.json({ ok: true });
}
