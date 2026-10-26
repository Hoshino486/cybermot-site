import { NextResponse } from 'next/server';
import { siteConfig } from '../../../siteConfig';

export const runtime = 'nodejs';

// Bilibili's space APIs reject unsigned/data-centre traffic with 412, but the public
// card endpoint (name, avatar, signature, follower count) still answers.
export async function GET() {
  const uid = siteConfig.bilibiliUid;
  if (!uid) return NextResponse.json({ error: 'bilibili 未配置' }, { status: 404 });

  try {
    const response = await fetch(`https://api.bilibili.com/x/web-interface/card?mid=${encodeURIComponent(uid)}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
        Referer: `https://space.bilibili.com/${uid}`,
      },
      signal: AbortSignal.timeout(8000),
      next: { revalidate: 1800 },
    });
    if (!response.ok) throw new Error(`upstream ${response.status}`);
    const data = await response.json();
    const card = data?.data?.card;
    if (data?.code !== 0 || !card) throw new Error('unexpected payload');

    return NextResponse.json(
      {
        name: card.name,
        face: (card.face || '').replace(/^http:/, 'https:'),
        sign: card.sign || '',
        level: card.level_info?.current_level ?? 0,
        fans: data.data.follower ?? 0,
        videos: data.data.archive_count ?? 0,
        likes: data.data.like_num ?? 0,
        url: `https://space.bilibili.com/${uid}`,
      },
      { headers: { 'Cache-Control': 'public, max-age=1800, stale-while-revalidate=3600' } },
    );
  } catch {
    return NextResponse.json({ error: 'bilibili 暂时连不上' }, { status: 502, headers: { 'Cache-Control': 'no-store' } });
  }
}
