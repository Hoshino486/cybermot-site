import { NextResponse } from 'next/server';

// GDELT 限流是「每 5 秒一次」，抓取节奏单独设成 10 分钟，不跟新闻页的 2 分钟一起走。
export const revalidate = 600;

const UA = 'Mozilla/5.0 (compatible; CyberMotNews/1.0; +https://cybermot.bomber.asia)';

type GdeltArticle = {
  url?: string;
  title?: string;
  seendate?: string;
  domain?: string;
  language?: string;
  sourcecountry?: string;
};

type GdeltResponse = { articles?: GdeltArticle[] };

const QUERIES: { beat: string; query: string; limit: number }[] = [
  { beat: 'politics', query: 'theme:POLITICS sourcelang:english', limit: 14 },
  { beat: 'finance', query: 'theme:ECON_STOCKMARKET sourcelang:english', limit: 8 },
  { beat: 'tech', query: 'theme:TECHNOLOGY sourcelang:english', limit: 8 },
];

function toIso(seendate?: string): string | undefined {
  if (!seendate) return undefined;
  const match = seendate.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/);
  if (!match) return undefined;
  const [, y, mo, d, h, mi, s] = match;
  return new Date(Date.UTC(+y, +mo - 1, +d, +h, +mi, +s)).toISOString();
}

async function queryGdelt(entry: (typeof QUERIES)[number]): Promise<unknown[]> {
  const url =
    'https://api.gdeltproject.org/api/v2/doc/doc?query=' +
    encodeURIComponent(entry.query) +
    `&mode=artlist&maxrecords=${entry.limit}&format=json&timespan=1d&sort=datedesc`;

  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const res = await fetch(url, {
        headers: { 'user-agent': UA, accept: 'application/json' },
        signal: AbortSignal.timeout(20_000),
      });
      if (!res.ok) {
        if (res.status === 429 && attempt < 2) {
          await new Promise((resolve) => setTimeout(resolve, 6_000));
          continue;
        }
        return [];
      }
      const body = (await res.json()) as GdeltResponse;
      return (body.articles ?? [])
        .filter((article) => article.title && article.url)
        .map((article) => ({
          title: article.title,
          url: article.url,
          source: article.domain || 'GDELT',
          beat: entry.beat,
          publishedAt: toIso(article.seendate),
        }));
    } catch {
      if (attempt < 2) {
        await new Promise((resolve) => setTimeout(resolve, 4_000));
        continue;
      }
      return [];
    }
  }
  return [];
}

export async function GET() {
  const items: unknown[] = [];
  for (const query of QUERIES) {
    // GDELT 一次只接受一个请求，串行发，中间留出限流间隔
    items.push(...(await queryGdelt(query)));
    await new Promise((resolve) => setTimeout(resolve, 1_200));
  }

  return NextResponse.json(
    { count: items.length, items },
    { headers: { 'cache-control': 'public, s-maxage=600, stale-while-revalidate=300' } },
  );
}
