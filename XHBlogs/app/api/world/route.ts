import { NextResponse } from 'next/server';
import { fetchWorldItems } from '../../../lib/world';

// 全球要闻单独一条管线，缓存 10 分钟，比新闻页的 2 分钟慢一档。
export const revalidate = 600;

export async function GET() {
  const items = await fetchWorldItems();
  return NextResponse.json(
    { count: items.length, items },
    { headers: { 'cache-control': 'public, s-maxage=600, stale-while-revalidate=300' } },
  );
}
