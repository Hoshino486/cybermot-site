export type Channel = 'aihot' | 'tech' | 'zh';

export type FeedItem = {
  id: string;
  channel: Channel;
  source: string;
  title: string;
  summary?: string;
  url: string;
  extra?: { label: string; url: string };
  publishedAt?: string;
  category?: string;
  score?: number;
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
    json<{ items: AihotItem[] }>(`${AIHOT}/items?limit=60&window=7d`),
    json<{ items: HotTopic[] }>(`${AIHOT}/hot-topics`),
  ]);

  const items = (feed?.items ?? []).map((item) => ({
    id: `aihot-${item.id}`,
    channel: 'aihot' as const,
    source: item.source?.name || 'AIHOT',
    title: item.title,
    summary: item.summary,
    url: item.links?.original || item.links?.aihot || '#',
    extra: item.links?.aihot ? { label: 'AIHOT 条目', url: item.links.aihot } : undefined,
    publishedAt: item.publishedAt,
    category: item.category,
    score: item.score,
  }));

  return { items, hot: hot?.items ?? [] };
}

type HnItem = { id: number; title?: string; url?: string; time?: number; score?: number; by?: string; type?: string };

export async function fetchHackerNews(limit = 12): Promise<FeedItem[]> {
  const ids = await json<number[]>('https://hacker-news.firebaseio.com/v0/topstories.json', 7000);
  if (!ids?.length) return [];

  const picked = ids.slice(0, limit);
  const details = await Promise.all(
    picked.map((id) => json<HnItem>(`https://hacker-news.firebaseio.com/v0/item/${id}.json`, 6000)),
  );

  return details
    .filter((item): item is HnItem => Boolean(item?.title))
    .map((item) => ({
      id: `hn-${item.id}`,
      channel: 'tech' as const,
      source: 'Hacker News',
      title: item.title!,
      summary: item.by ? `由 ${item.by} 提交 · ${item.score ?? 0} 分` : undefined,
      url: item.url || `https://news.ycombinator.com/item?id=${item.id}`,
      extra: item.url ? { label: '讨论', url: `https://news.ycombinator.com/item?id=${item.id}` } : undefined,
      publishedAt: item.time ? new Date(item.time * 1000).toISOString() : undefined,
    }));
}

type SspaiItem = { id: number; title: string; summary?: string; released_time?: number };

export async function fetchSspai(limit = 10): Promise<FeedItem[]> {
  const body = await json<{ data?: SspaiItem[] }>(
    `https://sspai.com/api/v1/article/index/page/get?limit=${limit}&offset=0`,
  );
  return (body?.data ?? [])
    .filter((item) => item?.title)
    .map((item) => ({
      id: `sspai-${item.id}`,
      channel: 'zh' as const,
      source: '少数派',
      title: item.title,
      summary: item.summary,
      url: `https://sspai.com/post/${item.id}`,
      publishedAt: item.released_time ? new Date(item.released_time * 1000).toISOString() : undefined,
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
      source: item.node?.title ? `V2EX · ${item.node.title}` : 'V2EX',
      title: item.title,
      url: item.url || `https://www.v2ex.com/t/${item.id}`,
      publishedAt: item.created ? new Date(item.created * 1000).toISOString() : undefined,
    }));
}

/** 合并四路信源，任一路挂掉都不影响其他来源。 */
export async function fetchAllNews() {
  const [aihot, hn, sspai, v2ex] = await Promise.allSettled([
    fetchAihot(),
    fetchHackerNews(),
    fetchSspai(),
    fetchV2ex(),
  ]);

  const aihotItems = aihot.status === 'fulfilled' ? aihot.value.items : [];
  const hot = aihot.status === 'fulfilled' ? aihot.value.hot : [];
  const extra = [
    ...(hn.status === 'fulfilled' ? hn.value : []),
    ...(sspai.status === 'fulfilled' ? sspai.value : []),
    ...(v2ex.status === 'fulfilled' ? v2ex.value : []),
  ];

  const items = [...aihotItems, ...extra].sort((a, b) => {
    const left = a.publishedAt ? Date.parse(a.publishedAt) : 0;
    const right = b.publishedAt ? Date.parse(b.publishedAt) : 0;
    return right - left;
  });

  return { items, hot };
}
