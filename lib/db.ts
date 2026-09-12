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
// project/database). Env vars override these if set, but nothing needs to be
// configured for the app to work out of the box.
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://dtvuueruurhsgqpmvehp.supabase.co';
const SUPABASE_ANON_KEY =
  process.env.SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR0dnV1ZXJ1dXJoc2dxcG12ZWhwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkyMTkzMTksImV4cCI6MjEwNDc5NTMxOX0.GEZ4QQxe_VgvZH-OKOOSuk2C3EIssgqkmIjtMwTsxuU';

interface EntryRow {
  id: string;
  category: CategorySlug;
  text: string;
  created_at: string;
}

function assertConfigured(): void {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error('Missing Supabase configuration. Set SUPABASE_URL and SUPABASE_ANON_KEY.');
  }
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
  assertConfigured();
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
  assertConfigured();
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
  assertConfigured();
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
  assertConfigured();
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
