import { NextResponse } from 'next/server';
import { cached } from '../../../lib/cache.js';
import { runSource, sources } from '../../../lib/router.js';
import { normalizeList } from '../../../lib/normalize.js';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export async function GET(req) {
  const q = Object.fromEntries(req.nextUrl.searchParams.entries());
  const source = q.source || 'sokuja';
  const action = q.action || 'home';
  const key = `media:${JSON.stringify(q)}`;
  try {
    const result = await cached(key, () => runSource(source, action, q), Number(process.env.CACHE_TTL || 300));
    const data = normalizeList(result.data, source);
    return NextResponse.json({ ok: true, source, action, page: Number(q.page || 1), cached: result.cached, count: data.length, data: data.length ? data : result.data });
  } catch (error) {
    return NextResponse.json({ ok: false, source, action, sources, error: error?.message || 'Request failed' }, { status: 502 });
  }
}
