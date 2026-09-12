export type CategorySlug =
  | 'health'
  | 'relationships'
  | 'love'
  | 'work'
  | 'money'
  | 'fun'
  | 'growth';

export interface CategoryDef {
  slug: CategorySlug;
  label: string;
  tenLooksLike: string;
}

export const CATEGORIES: CategoryDef[] = [
  {
    slug: 'health',
    label: 'Health',
    tenLooksLike: '5+ gym sessions, deadlift/bench technique work, protein target, Sunday run',
  },
  {
    slug: 'relationships',
    label: 'Relationships',
    tenLooksLike: 'real conversation with mom, one non-business hangout with a friend',
  },
  {
    slug: 'love',
    label: 'Love',
    tenLooksLike: 'one real move toward dating, or real undistracted time with a partner',
  },
  {
    slug: 'work',
    label: 'Work',
    tenLooksLike: 'hit outreach number, shipped one real deliverable',
  },
  {
    slug: 'money',
    label: 'Money',
    tenLooksLike: 'tracked spending, put something aside/invested',
  },
  {
    slug: 'fun',
    label: 'Fun',
    tenLooksLike: 'real guilt-free downtime logged',
  },
  {
    slug: 'growth',
    label: 'Personal Growth',
    tenLooksLike: 'one moment you dropped the script live, one research rep on the current niche',
  },
];

export const CATEGORY_SLUGS: CategorySlug[] = CATEGORIES.map((c) => c.slug);

export function isCategorySlug(value: unknown): value is CategorySlug {
  return typeof value === 'string' && (CATEGORY_SLUGS as string[]).includes(value);
}
