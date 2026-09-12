'use client';

import { useEffect, useState } from 'react';
import { CATEGORIES } from '@/lib/categories';

interface EntryRow {
  id: string;
  text: string;
  createdAt: string;
}

interface WeekData {
  weekStart: string;
  weekEnd: string;
  entries: Record<string, EntryRow[]>;
}

function addDaysISO(iso: string, days: number) {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function formatRange(start: string, end: string) {
  const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
  const s = new Date(`${start}T00:00:00Z`).toLocaleDateString('en-US', opts);
  const e = new Date(`${end}T00:00:00Z`).toLocaleDateString('en-US', opts);
  return `${s} – ${e}`;
}

export default function WeekPage() {
  const [data, setData] = useState<WeekData | null>(null);
  const [editing, setEditing] = useState<{ id: string; text: string } | null>(null);

  async function load(weekStart?: string) {
    const url = weekStart ? `/api/entries?weekStart=${weekStart}` : '/api/entries';
    const res = await fetch(url);
    if (res.ok) setData(await res.json());
  }

  useEffect(() => {
    load();
  }, []);

  async function handleDelete(id: string) {
    if (!confirm('Delete this entry?')) return;
    await fetch(`/api/entries/${id}`, { method: 'DELETE' });
    load(data?.weekStart);
  }

  async function handleSaveEdit() {
    if (!editing) return;
    const trimmed = editing.text.trim();
    if (!trimmed) return;
    await fetch(`/api/entries/${editing.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: trimmed }),
    });
    setEditing(null);
    load(data?.weekStart);
  }

  if (!data) {
    return <main className="px-4 pt-6 text-center text-neutral-400">Loading...</main>;
  }

  return (
    <main className="mx-auto max-w-md px-4 pt-6">
      <div className="mb-4 flex items-center justify-between">
        <button
          type="button"
          onClick={() => load(addDaysISO(data.weekStart, -7))}
          className="rounded-full bg-neutral-100 px-4 py-2 text-sm font-medium"
        >
          ← Prev
        </button>
        <h1 className="text-base font-semibold">{formatRange(data.weekStart, data.weekEnd)}</h1>
        <button
          type="button"
          onClick={() => load(addDaysISO(data.weekStart, 7))}
          className="rounded-full bg-neutral-100 px-4 py-2 text-sm font-medium"
        >
          Next →
        </button>
      </div>

      {CATEGORIES.map((cat) => {
        const list = data.entries[cat.slug] ?? [];
        return (
          <section key={cat.slug} className="mb-5">
            <h2 className="mb-2 flex items-center justify-between text-sm font-semibold text-neutral-700">
              {cat.label}
              <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-500">
                {list.length}
              </span>
            </h2>

            {list.length === 0 ? (
              <p className="text-sm text-neutral-400">No entries yet.</p>
            ) : (
              <ul className="space-y-2">
                {list.map((entry) => (
                  <li key={entry.id} className="rounded-xl bg-white p-3 shadow-sm">
                    {editing?.id === entry.id ? (
                      <div>
                        <textarea
                          value={editing.text}
                          onChange={(e) => setEditing({ id: entry.id, text: e.target.value })}
                          rows={3}
                          className="w-full rounded-lg border border-neutral-300 p-2 text-sm"
                        />
                        <div className="mt-2 flex gap-2">
                          <button
                            type="button"
                            onClick={handleSaveEdit}
                            className="rounded-lg bg-neutral-900 px-3 py-1.5 text-sm text-white"
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditing(null)}
                            className="rounded-lg bg-neutral-100 px-3 py-1.5 text-sm"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <p className="whitespace-pre-wrap text-sm">{entry.text}</p>
                        <div className="mt-2 flex items-center justify-between text-xs text-neutral-400">
                          <span>
                            {new Date(entry.createdAt).toLocaleString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              hour: 'numeric',
                              minute: '2-digit',
                            })}
                          </span>
                          <span className="flex gap-3">
                            <button
                              type="button"
                              onClick={() => setEditing({ id: entry.id, text: entry.text })}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(entry.id)}
                              className="text-red-500"
                            >
                              Delete
                            </button>
                          </span>
                        </div>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>
        );
      })}
    </main>
  );
}
