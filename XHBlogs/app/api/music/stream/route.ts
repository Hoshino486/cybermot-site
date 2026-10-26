import { NextRequest, NextResponse } from 'next/server';
export const runtime = 'nodejs';
export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get('id') || '';
  if (!/^\d{1,20}$/.test(id)) return new NextResponse('Invalid song ID', { status: 400 });
  try {
    // Public standard-quality playback only; no account cookies or paid-track bypass.
    const response = await fetch('https://music.163.com/api/song/enhance/player/url?ids=' + encodeURIComponent('[' + id + ']') + '&br=128000', {
      headers: { Referer: 'https://music.163.com/', 'User-Agent': 'Mozilla/5.0' }, cache: 'no-store', signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) throw new Error('upstream');
    const data = await response.json();
    const item = data.data?.[0];
    if (item?.code !== 200 || !item.url) return new NextResponse('This song is unavailable for public playback', { status: 404 });
    const target = new URL(item.url);
    if (!target.hostname.endsWith('.music.126.net')) return new NextResponse('Unsupported media host', { status: 502 });
    target.protocol = 'https:';
    return new NextResponse(null, { status: 307, headers: { Location: target.toString(), 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer' } });
  } catch {
    return new NextResponse('Music source temporarily unavailable', { status: 502, headers: { 'Cache-Control': 'no-store' } });
  }
}
