'use client';

import { useEffect, useState } from 'react';
import CategoryTabs from '@/components/CategoryTabs';
import { CATEGORIES, type CategorySlug } from '@/lib/categories';

interface EntryRow {
  id: number;
  text: string;
  createdAt: string;
}

interface WeekEntries {
  weekStart: string;
  weekEnd: string;
  entries: Record<string, EntryRow[]>;
}

export default function LogPage() {
  const [category, setCategory] = useState<CategorySlug>(CATEGORIES[0].slug);
  const [text, setText] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [week, setWeek] = useState<WeekEntries | null>(null);

  async function loadWeek() {
    const res = await fetch('/api/entries');
    if (res.ok) setWeek(await res.json());
  }

  useEffect(() => {
    loadWeek();
  }, []);

  const counts = week
    ? Object.fromEntries(Object.entries(week.entries).map(([slug, list]) => [slug, list.length]))
    : undefined;

  const activeCategory = CATEGORIES.find((c) => c.slug === category)!;

  async function handleSave() {
    const trimmed = text.trim();
    if (!trimmed || saving) return;
    setSaving(true);
    setSaved(false);

    const res = await fetch('/api/entries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ category, text: trimmed }),
    });

    setSaving(false);
    if (res.ok) {
      setText('');
      setSaved(true);
      loadWeek();
    }
  }

  return (
    <main className="mx-auto max-w-md px-4 pt-6">
      <h1 className="mb-4 text-xl font-semibold">Quick Entry</h1>

      <CategoryTabs value={category} onChange={setCategory} counts={counts} />

      <p className="mt-3 text-sm text-neutral-500">A 10 this week: {activeCategory.tenLooksLike}</p>

      <textarea
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          setSaved(false);
        }}
        placeholder={`What happened in ${activeCategory.label.toLowerCase()}?`}
        rows={5}
        className="mt-3 w-full rounded-xl border border-neutral-300 p-4 text-base"
      />

      <button
        type="button"
        onClick={handleSave}
        disabled={!text.trim() || saving}
        className="mt-3 w-full rounded-xl bg-neutral-900 py-3 text-lg font-medium text-white disabled:opacity-40"
      >
        {saving ? 'Saving...' : 'Save Entry'}
      </button>

      {saved && <p className="mt-2 text-center text-sm text-green-600">Saved.</p>}
    </main>
  );
}
