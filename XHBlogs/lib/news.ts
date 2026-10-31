import { parseFeed } from './rss';

export type Channel = 'aihot' | 'tech' | 'zh' | 'world' | 'finance';

export type Beat = 'ai' | 'tech' | 'politics' | 'finance' | 'community';

export type FeedItem = {
  id: string;
  channel: Channel;
  beat: Beat;
  source: string;
  title: string;
  summary?: string;
  url: string;
  extra?: { label: string; url: string };
  publishedAt?: string;
  category?: string;
  score?: number;
  lang?: 'zh' | 'en';
};

export type HotTopic = {
  rank?: number;
  id: string;
  title: string;
  source?: { name?: string };
  links?: { aihot?: string; original?: string };
  sourceCount?: number;
  latestAt?: string;
};

const AIHOT = 'https://aihot.news/api/v1';
const UA = 'Mozilla/5.0 (compatible; CyberMotNews/1.0; +https://cybermot.bomber.asia)';

async function json<T>(url: string, timeout = 8000): Promise<T | null> {
  try {
    const res = await fetch(url, {
      next: { revalidate: 120 },
      signal: AbortSignal.timeout(timeout),
      headers: { accept: 'application/json', 'user-agent': UA },
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

async function xml(url: string, timeout = 9000): Promise<string | null> {
  try {
    const res = await fetch(url, {
      next: { revalidate: 180 },
      signal: AbortSignal.timeout(timeout),
      headers: {
        accept: 'application/rss+xml, application/xml, text/xml, */*',
        'user-agent': UA,
      },
    });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

/** 国际与财经：公开 RSS，无需密钥。 */
const FEEDS: { name: string; url: string; beat: Beat; limit: number; lang: 'en' | 'zh' }[] = [
  { name: 'BBC World', url: 'https://feeds.bbci.co.uk/news/world/rss.xml', beat: 'politics', limit: 7, lang: 'en' },
  { name: 'The Guardian', url: 'https://www.theguardian.com/world/rss', beat: 'politics', limit: 6, lang: 'en' },
  { name: 'Al Jazeera', url: 'https://www.aljazeera.com/xml/rss/all.xml', beat: 'politics', limit: 5, lang: 'en' },
  { name: 'NYT World', url: 'https://rss.nytimes.com/services/xml/rss/nyt/World.xml', beat: 'politics', limit: 5, lang: 'en' },
  { name: 'DW', url: 'https://rss.dw.com/rdf/rss-en-world', beat: 'politics', limit: 4, lang: 'en' },
  { name: 'France 24', url: 'https://www.france24.com/en/rss', beat: 'politics', limit: 4, lang: 'en' },
  { name: 'NPR World', url: 'https://feeds.npr.org/1004/rss.xml', beat: 'politics', limit: 3, lang: 'en' },
  { name: 'BBC Business', url: 'https://feeds.bbci.co.uk/news/business/rss.xml', beat: 'finance', limit: 6, lang: 'en' },
  { name: 'Guardian Business', url: 'https://www.theguardian.com/uk/business/rss', beat: 'finance', limit: 5, lang: 'en' },
  { name: '华尔街见闻', url: 'https://dedicated.wallstreetcn.com/rss.xml', beat: 'finance', limit: 6, lang: 'zh' },
];

async function fetchFeeds(): Promise<FeedItem[]> {
  const results = await Promise.allSettled(FEEDS.map((feed) => xml(feed.url)));

  return results.flatMap((result, index) => {
    if (result.status !== 'fulfilled' || !result.value) return [];
    const feed = FEEDS[index];
    return parseFeed(result.value, feed.limit).map((entry, order) => ({
      id: `rss-${feed.name}-${order}-${entry.link.slice(-24)}`,
      channel: (feed.beat === 'finance' ? 'finance' : 'world') as Channel,
      beat: feed.beat,
      source: feed.name,
      title: entry.title,
      summary: entry.summary,
      url: entry.link,
      publishedAt: entry.publishedAt,
      lang: feed.lang,
    }));
  });
}

type AihotItem = {
  id: string;
  title: string;
  summary?: string;
  source?: { name?: string };
  links?: { aihot?: string; original?: string };
  publishedAt?: string;
  category?: string;
  score?: number;
};

export async function fetchAihot(): Promise<{ items: FeedItem[]; hot: HotTopic[] }> {
  const [feed, hot] = await Promise.all([
    json<{ items: AihotItem[] }>(`${AIHOT}/items?limit=48&window=7d`),
    json<{ items: HotTopic[] }>(`${AIHOT}/hot-topics`),
  ]);

  const items = (feed?.items ?? []).map((item) => ({
    id: `aihot-${item.id}`,
    channel: 'aihot' as const,
    beat: 'ai' as const,
    source: item.source?.name || 'AIHOT',
    title: item.title,
    summary: item.summary,
    url: item.links?.original || item.links?.aihot || '#',
    extra: item.links?.aihot ? { label: 'AIHOT', url: item.links.aihot } : undefined,
    publishedAt: item.publishedAt,
    category: item.category,
    score: item.score,
    lang: 'zh' as const,
  }));

  return { items, hot: hot?.items ?? [] };
}

type HnItem = { id: number; title?: string; url?: string; time?: number; score?: number; by?: string };

export async function fetchHackerNews(limit = 10): Promise<FeedItem[]> {
  const ids = await json<number[]>('https://hacker-news.firebaseio.com/v0/topstories.json', 7000);
  if (!ids?.length) return [];

  const details = await Promise.all(
    ids.slice(0, limit).map((id) => json<HnItem>(`https://hacker-news.firebaseio.com/v0/item/${id}.json`, 6000)),
  );

  return details
    .filter((item): item is HnItem => Boolean(item?.title))
    .map((item) => ({
      id: `hn-${item.id}`,
      channel: 'tech' as const,
      beat: 'tech' as const,
      source: 'Hacker News',
      title: item.title!,
      summary: item.by ? `由 ${item.by} 提交 · ${item.score ?? 0} 分` : undefined,
      url: item.url || `https://news.ycombinator.com/item?id=${item.id}`,
      extra: item.url ? { label: '讨论', url: `https://news.ycombinator.com/item?id=${item.id}` } : undefined,
      publishedAt: item.time ? new Date(item.time * 1000).toISOString() : undefined,
      lang: 'en' as const,
    }));
}

type SspaiItem = { id: number; title: string; summary?: string; released_time?: number };

export async function fetchSspai(limit = 8): Promise<FeedItem[]> {
  const body = await json<{ data?: SspaiItem[] }>(`https://sspai.com/api/v1/article/index/page/get?limit=${limit}&offset=0`);
  return (body?.data ?? [])
    .filter((item) => item?.title)
    .map((item) => ({
      id: `sspai-${item.id}`,
      channel: 'zh' as const,
      beat: 'tech' as const,
      source: '少数派',
      title: item.title,
      summary: item.summary,
      url: `https://sspai.com/post/${item.id}`,
      publishedAt: item.released_time ? new Date(item.released_time * 1000).toISOString() : undefined,
      lang: 'zh' as const,
    }));
}

type V2exTopic = { id: number; title: string; url?: string; created?: number; node?: { title?: string } };

export async function fetchV2ex(limit = 8): Promise<FeedItem[]> {
  const body = await json<V2exTopic[]>('https://www.v2ex.com/api/topics/hot.json', 7000);
  return (body ?? [])
    .filter((item) => item?.title)
    .slice(0, limit)
    .map((item) => ({
      id: `v2ex-${item.id}`,
      channel: 'zh' as const,
      beat: 'community' as const,
      source: item.node?.title ? `V2EX · ${item.node.title}` : 'V2EX',
      title: item.title,
      url: item.url || `https://www.v2ex.com/t/${item.id}`,
      publishedAt: item.created ? new Date(item.created * 1000).toISOString() : undefined,
      lang: 'zh' as const,
    }));
}

export type NewsBundle = { items: FeedItem[]; hot: HotTopic[] };

/** 合并全部信源，任一路挂掉都不影响其他来源。 */
export async function fetchAllNews(): Promise<NewsBundle> {
  const [aihot, hn, sspai, v2ex, feeds] = await Promise.allSettled([
    fetchAihot(),
    fetchHackerNews(),
    fetchSspai(),
    fetchV2ex(),
    fetchFeeds(),
  ]);

  const ai = aihot.status === 'fulfilled' ? aihot.value : { items: [] as FeedItem[], hot: [] as HotTopic[] };
  const extra = [
    ...(hn.status === 'fulfilled' ? hn.value : []),
    ...(sspai.status === 'fulfilled' ? sspai.value : []),
    ...(v2ex.status === 'fulfilled' ? v2ex.value : []),
    ...(feeds.status === 'fulfilled' ? feeds.value : []),
  ];

  const seen = new Set<string>();
  const items = [...ai.items, ...extra]
    .filter((item) => {
      const key = item.url.split('?')[0];
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => {
      const left = a.publishedAt ? Date.parse(a.publishedAt) : 0;
      const right = b.publishedAt ? Date.parse(b.publishedAt) : 0;
      return right - left;
    });

  return { items, hot: ai.hot };
}
