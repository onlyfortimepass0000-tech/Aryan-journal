import { NextResponse } from 'next/server';

export async function GET() {
  const url = process.env.SUPABASE_URL || 'https://dtvuueruurhsgqpmvehp.supabase.co';
  const key =
    process.env.SUPABASE_ANON_KEY ||
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR0dnV1ZXJ1dXJoc2dxcG12ZWhwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkyMTkzMTksImV4cCI6MjEwNDc5NTMxOX0.GEZ4QQxe_VgvZH-OKOOSuk2C3EIssgqkmIjtMwTsxuU';

  const res = await fetch(`${url}/rest/v1/`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
    cache: 'no-store',
  });
  const body = await res.text();
  return NextResponse.json({ status: res.status, body: body.slice(0, 3000) });
}
