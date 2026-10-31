import { NextResponse } from 'next/server';

// 全球要闻单独一条管线：Google News 的三个板块，缓存 10 分钟，
// 比新闻页的 2 分钟慢一档，避免频繁请求被挡。
export const revalidate = 600;

const UA = 'Mozilla/5.0 (compatible; CyberMotNews/1.0; +https://cybermot.bomber.asia)';

type RawItem = { title: string; url: string; source: string; beat: 'politics' | 'finance' | 'tech'; publishedAt?: string };

const GOOGLE_FEEDS: { name: string; url: string; beat: RawItem['beat']; limit: number }[] = [
  { name: 'Google News', url: 'https://news.google.com/rss/headlines/section/topic/WORLD?hl=en-US&gl=US&ceid=US:en', beat: 'politics', limit: 8 },
  { name: 'Google News', url: 'https://news.google.com/rss/headlines/section/topic/BUSINESS?hl=en-US&gl=US&ceid=US:en', beat: 'finance', limit: 5 },
  { name: 'Google News', url: 'https://news.google.com/rss/headlines/section/topic/TECHNOLOGY?hl=en-US&gl=US&ceid=US:en', beat: 'tech', limit: 4 },
];

function decode(text: string): string {
  return text
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(parseInt(code, 16)))
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, ' ');
}

function stripTags(text: string): string {
  return decode(text.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ')).trim();
}

async function googleFeed(feed: (typeof GOOGLE_FEEDS)[number]): Promise<RawItem[]> {
  try {
    const res = await fetch(feed.url, {
      headers: { 'user-agent': UA, accept: 'application/rss+xml, */*' },
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) return [];
    const xml = await res.text();
    const blocks = xml.match(/<item[\s>][\s\S]*?<\/item>/gi) ?? [];

    return blocks.slice(0, feed.limit).flatMap((block) => {
      const rawTitle = (block.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [])[1];
      const link = (block.match(/<link[^>]*>([\s\S]*?)<\/link>/i) || [])[1];
      const date = (block.match(/<pubDate[^>]*>([\s\S]*?)<\/pubDate>/i) || [])[1];
      if (!rawTitle || !link) return [];

      const title = stripTags(rawTitle);
      // Google News 的标题尾巴带 " - 来源名"，拆出来单独显示
      const split = title.match(/^(.*)\s-\s([^-]{2,40})$/);
      const parsed = date ? Date.parse(date) : NaN;

      return [{
        title: split ? split[1] : title,
        url: link.trim(),
        source: split ? split[2] : feed.name,
        beat: feed.beat,
        publishedAt: Number.isFinite(parsed) ? new Date(parsed).toISOString() : undefined,
      }];
    });
  } catch {
    return [];
  }
}

/**
 * GDELT 作为兜底：它限流严格、对数据中心出口常常不通，
 * 通了就多几条，不通就当没有，不影响上面的 Google News。
 */
async function gdelt(): Promise<RawItem[]> {
  try {
    const url =
      'https://api.gdeltproject.org/api/v2/doc/doc?query=' +
      encodeURIComponent('theme:POLITICS sourcelang:english') +
      '&mode=artlist&maxrecords=8&format=json&timespan=1d&sort=datedesc';
    const res = await fetch(url, { headers: { 'user-agent': UA }, signal: AbortSignal.timeout(15_000) });
    if (!res.ok) return [];
    const body = (await res.json()) as { articles?: { title?: string; url?: string; domain?: string; seendate?: string }[] };
    return (body.articles ?? []).flatMap((article) => {
      if (!article.title || !article.url) return [];
      const match = article.seendate?.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/);
      const publishedAt = match
        ? new Date(Date.UTC(+match[1], +match[2] - 1, +match[3], +match[4], +match[5], +match[6])).toISOString()
        : undefined;
      return [{ title: article.title, url: article.url, source: article.domain || 'GDELT', beat: 'politics' as const, publishedAt }];
    });
  } catch {
    return [];
  }
}

export async function GET() {
  const results = await Promise.all([...GOOGLE_FEEDS.map(googleFeed), gdelt()]);
  const seen = new Set<string>();
  const items = results.flat().filter((item) => {
    if (seen.has(item.url)) return false;
    seen.add(item.url);
    return true;
  });

  return NextResponse.json(
    { count: items.length, items },
    { headers: { 'cache-control': 'public, s-maxage=600, stale-while-revalidate=300' } },
  );
}
