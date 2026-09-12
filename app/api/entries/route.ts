import { NextRequest, NextResponse } from 'next/server';
import { createEntry, getEntriesInRange } from '@/lib/db';
import { CATEGORY_SLUGS, isCategorySlug } from '@/lib/categories';
import { addDays, parseISODate, startOfWeekMonday, toISODate } from '@/lib/week';

function resolveWeek(weekStartParam: string | null) {
  const weekStart = weekStartParam ? parseISODate(weekStartParam) : startOfWeekMonday(new Date());
  const weekEndExclusive = addDays(weekStart, 7);
  const weekEndInclusive = addDays(weekStart, 6);
  return { weekStart, weekEndExclusive, weekEndInclusive };
}

export async function GET(req: NextRequest) {
  const weekStartParam = req.nextUrl.searchParams.get('weekStart');
  const { weekStart, weekEndExclusive, weekEndInclusive } = resolveWeek(weekStartParam);

  const entries = await getEntriesInRange(weekStart, weekEndExclusive);

  const grouped: Record<string, { id: string; text: string; createdAt: string }[]> = {};
  for (const slug of CATEGORY_SLUGS) grouped[slug] = [];
  for (const entry of entries) {
    grouped[entry.category].push({ id: entry.id, text: entry.text, createdAt: entry.createdAt });
  }

  return NextResponse.json({
    weekStart: toISODate(weekStart),
    weekEnd: toISODate(weekEndInclusive),
    entries: grouped,
  });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const category = body?.category;
  const text = typeof body?.text === 'string' ? body.text.trim() : '';

  if (!isCategorySlug(category)) {
    return NextResponse.json({ error: 'Invalid category' }, { status: 400 });
  }
  if (!text) {
    return NextResponse.json({ error: 'Text is required' }, { status: 400 });
  }

  const entry = await createEntry(category, text);
  return NextResponse.json(entry, { status: 201 });
}
