import { NextRequest, NextResponse } from 'next/server';
import { getEntriesInRange } from '@/lib/db';
import { CATEGORY_SLUGS } from '@/lib/categories';
import { addDays, parseISODate, rollingLast7Days, toISODate } from '@/lib/week';

// Read-only endpoint meant to be fetched by URL alone (no browser session),
// so an external AI assistant can pull the week's entries directly.
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token') ?? req.headers.get('x-access-token');
  if (!token || token !== process.env.ACCESS_TOKEN) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const startParam = req.nextUrl.searchParams.get('start');
  let weekStart: Date;
  let weekEndInclusive: Date;

  if (startParam) {
    weekStart = parseISODate(startParam);
    weekEndInclusive = addDays(weekStart, 6);
  } else {
    const { start, end } = rollingLast7Days(new Date());
    weekStart = start;
    weekEndInclusive = end;
  }
  const weekEndExclusive = addDays(weekEndInclusive, 1);

  const entries = await getEntriesInRange(weekStart, weekEndExclusive);

  const entriesByCategory: Record<string, string[]> = {};
  const entryCounts: Record<string, number> = {};
  for (const slug of CATEGORY_SLUGS) {
    entriesByCategory[slug] = [];
    entryCounts[slug] = 0;
  }
  for (const entry of entries) {
    entriesByCategory[entry.category].push(entry.text);
    entryCounts[entry.category] += 1;
  }

  return NextResponse.json({
    weekStart: toISODate(weekStart),
    weekEnd: toISODate(weekEndInclusive),
    entries: entriesByCategory,
    entryCounts,
  });
}
