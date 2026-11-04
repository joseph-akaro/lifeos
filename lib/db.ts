import { neon } from '@neondatabase/serverless';

export const sql = neon(process.env.DATABASE_URL!);

let ready: Promise<unknown> | null = null;

/** Create the table on first use. One row per user; `data` is the whole game state. */
export function ensureSchema() {
  ready ??= sql`
    CREATE TABLE IF NOT EXISTS app_state (
      user_id    text PRIMARY KEY,
      email      text NOT NULL,
      name       text NOT NULL,
      data       jsonb NOT NULL,
      xp         integer NOT NULL DEFAULT 0,
      updated_at timestamptz NOT NULL DEFAULT now()
    )`.catch((e) => {
    ready = null;
    throw e;
  });
  return ready;
}
