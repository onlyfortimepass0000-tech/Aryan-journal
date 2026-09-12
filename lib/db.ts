import type { CategorySlug } from './categories';

// Storage backend: Supabase Postgres, accessed directly over its REST API
// (PostgREST) with plain fetch — no client SDK dependency needed.

export interface Entry {
  id: string;
  category: CategorySlug;
  text: string;
  createdAt: string;
}

// Dedicated Supabase project for this app only (separate from any other
// project/database). Read from env vars, not hardcoded: this is a public
// repo, so the key must never be committed to it.
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

interface EntryRow {
  id: string;
  category: CategorySlug;
  text: string;
  created_at: string;
}

function restUrl(path: string): string {
  return `${SUPABASE_URL}/rest/v1${path}`;
}

function restHeaders(extra?: Record<string, string>): Record<string, string> {
  return {
    apikey: SUPABASE_ANON_KEY as string,
    Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    'Content-Type': 'application/json',
    ...extra,
  };
}

function toEntry(row: EntryRow): Entry {
  return {
    id: row.id,
    category: row.category,
    text: row.text,
    createdAt: row.created_at,
  };
}

export async function getEntriesInRange(start: Date, endExclusive: Date): Promise<Entry[]> {
  const params = new URLSearchParams({
    select: 'id,category,text,created_at',
    created_at: `gte.${start.toISOString()}`,
    order: 'created_at.desc',
  });
  // created_at needs two filters (>= start and < end); URLSearchParams only keeps
  // the last value per key, so append the second one directly.
  const url = `${restUrl('/entries')}?${params.toString()}&created_at=lt.${endExclusive.toISOString()}`;

  const res = await fetch(url, { headers: restHeaders(), cache: 'no-store' });
  if (!res.ok) {
    throw new Error(`Failed to fetch entries: ${res.status} ${await res.text()}`);
  }
  const rows: EntryRow[] = await res.json();
  return rows.map(toEntry);
}

export async function createEntry(category: CategorySlug, text: string): Promise<Entry> {
  const res = await fetch(restUrl('/entries'), {
    method: 'POST',
    headers: restHeaders({ Prefer: 'return=representation' }),
    body: JSON.stringify({ category, text }),
  });
  if (!res.ok) {
    throw new Error(`Failed to create entry: ${res.status} ${await res.text()}`);
  }
  const rows: EntryRow[] = await res.json();
  return toEntry(rows[0]);
}

export async function updateEntry(id: string, text: string): Promise<Entry | null> {
  const res = await fetch(`${restUrl('/entries')}?id=eq.${id}`, {
    method: 'PATCH',
    headers: restHeaders({ Prefer: 'return=representation' }),
    body: JSON.stringify({ text }),
  });
  if (!res.ok) {
    throw new Error(`Failed to update entry: ${res.status} ${await res.text()}`);
  }
  const rows: EntryRow[] = await res.json();
  return rows[0] ? toEntry(rows[0]) : null;
}

export async function deleteEntry(id: string): Promise<boolean> {
  const res = await fetch(`${restUrl('/entries')}?id=eq.${id}`, {
    method: 'DELETE',
    headers: restHeaders({ Prefer: 'return=representation' }),
  });
  if (!res.ok) {
    throw new Error(`Failed to delete entry: ${res.status} ${await res.text()}`);
  }
  const rows: EntryRow[] = await res.json();
  return rows.length > 0;
}
