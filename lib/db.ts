import { sql } from '@vercel/postgres';
import type { CategorySlug } from './categories';

export interface Entry {
  id: number;
  category: CategorySlug;
  text: string;
  createdAt: string;
}

let schemaReady: Promise<unknown> | null = null;

function ensureSchema() {
  if (!schemaReady) {
    schemaReady = sql`
      CREATE TABLE IF NOT EXISTS entries (
        id SERIAL PRIMARY KEY,
        category TEXT NOT NULL CHECK (
          category IN ('health','relationships','love','work','money','fun','growth')
        ),
        text TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `;
  }
  return schemaReady;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toEntry(row: any): Entry {
  return {
    id: row.id,
    category: row.category,
    text: row.text,
    createdAt: new Date(row.created_at).toISOString(),
  };
}

export async function getEntriesInRange(start: Date, endExclusive: Date): Promise<Entry[]> {
  await ensureSchema();
  const { rows } = await sql`
    SELECT id, category, text, created_at
    FROM entries
    WHERE created_at >= ${start.toISOString()} AND created_at < ${endExclusive.toISOString()}
    ORDER BY created_at DESC
  `;
  return rows.map(toEntry);
}

export async function createEntry(category: CategorySlug, text: string): Promise<Entry> {
  await ensureSchema();
  const { rows } = await sql`
    INSERT INTO entries (category, text)
    VALUES (${category}, ${text})
    RETURNING id, category, text, created_at
  `;
  return toEntry(rows[0]);
}

export async function updateEntry(id: number, text: string): Promise<Entry | null> {
  await ensureSchema();
  const { rows } = await sql`
    UPDATE entries SET text = ${text} WHERE id = ${id}
    RETURNING id, category, text, created_at
  `;
  return rows[0] ? toEntry(rows[0]) : null;
}

export async function deleteEntry(id: number): Promise<boolean> {
  await ensureSchema();
  const { rowCount } = await sql`DELETE FROM entries WHERE id = ${id}`;
  return (rowCount ?? 0) > 0;
}
