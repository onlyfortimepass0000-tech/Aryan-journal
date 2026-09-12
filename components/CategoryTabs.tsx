'use client';

import { CATEGORIES, type CategorySlug } from '@/lib/categories';

export default function CategoryTabs({
  value,
  onChange,
  counts,
}: {
  value: CategorySlug;
  onChange: (slug: CategorySlug) => void;
  counts?: Record<string, number>;
}) {
  return (
    <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-2">
      {CATEGORIES.map((cat) => {
        const active = value === cat.slug;
        const count = counts?.[cat.slug] ?? 0;
        return (
          <button
            key={cat.slug}
            type="button"
            onClick={() => onChange(cat.slug)}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition ${
              active ? 'bg-neutral-900 text-white' : 'bg-neutral-100 text-neutral-600'
            }`}
          >
            {cat.label}
            {count > 0 && (
              <span
                className={`ml-1.5 rounded-full px-1.5 text-xs ${
                  active ? 'bg-white/20' : 'bg-neutral-300/60'
                }`}
              >
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
