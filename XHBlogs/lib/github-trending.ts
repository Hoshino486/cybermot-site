export type TrendingRepo = {
  fullName: string;
  owner: string;
  name: string;
  url: string;
  description: string;
  language: string;
  stars: number;
  forks: number;
  periodStars: number;
};

export type TrendingPeriod = 'daily' | 'weekly' | 'monthly';

const UA = 'Mozilla/5.0 (compatible; CyberMotSite/1.0; +https://cybermot.bomber.asia)';

function clean(text = ''): string {
  return text
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function number(text = ''): number {
  const match = text.replace(/,/g, '').match(/\d+/);
  return match ? Number(match[0]) : 0;
}

/** github.com/trending 的 HTML 没有接口，只能按区块拆。 */
export function parseTrending(html: string): TrendingRepo[] {
  const blocks = html.match(/<article class="Box-row"[\s\S]*?<\/article>/g) ?? [];

  return blocks.flatMap((block) => {
    const heading = block.slice(block.indexOf('<h2'), block.indexOf('</h2>'));
    const link = heading.match(/href="\/([^"/]+)\/([^"/?#]+)"/);
    if (!link) return [];

    const owner = link[1];
    const name = link[2];
    const description = block.match(/<p class="col-9[^"]*">([\s\S]*?)<\/p>/);
    const language = block.match(/itemprop="programmingLanguage">([^<]+)</);
    const starsBlock = block.match(/href="\/[^"]+\/stargazers"[^>]*>([\s\S]*?)<\/a>/);
    const forksBlock = block.match(/href="\/[^"]+\/forks"[^>]*>([\s\S]*?)<\/a>/);
    const period = clean(block.slice(block.lastIndexOf('float-sm-right'))).match(/([\d,]+)\s+stars?\s+(?:today|this week|this month)/);

    return [{
      fullName: `${owner}/${name}`,
      owner,
      name,
      url: `https://github.com/${owner}/${name}`,
      description: description ? clean(description[1]) : '',
      language: language ? language[1].trim() : '',
      stars: starsBlock ? number(clean(starsBlock[1])) : 0,
      forks: forksBlock ? number(clean(forksBlock[1])) : 0,
      periodStars: period ? number(period[1]) : 0,
    }];
  });
}

async function trending(period: TrendingPeriod): Promise<TrendingRepo[]> {
  const since = period === 'daily' ? 'daily' : period === 'weekly' ? 'weekly' : 'monthly';
  try {
    const res = await fetch(`https://github.com/trending?since=${since}`, {
      next: { revalidate: 600 },
      headers: { 'user-agent': UA, accept: 'text/html' },
      signal: AbortSignal.timeout(20_000),
    });
    if (!res.ok) return [];
    return parseTrending(await res.text());
  } catch {
    return [];
  }
}

type SearchRepo = {
  full_name: string;
  html_url: string;
  description?: string | null;
  language?: string | null;
  stargazers_count?: number;
  forks_count?: number;
};

async function search(query: string, sort: 'stars' | 'updated', perPage = 12): Promise<TrendingRepo[]> {
  try {
    const res = await fetch(
      `https://api.github.com/search/repositories?q=${encodeURIComponent(query)}&sort=${sort}&order=desc&per_page=${perPage}`,
      {
        next: { revalidate: 600 },
        headers: { accept: 'application/vnd.github+json', 'user-agent': UA },
        signal: AbortSignal.timeout(20_000),
      },
    );
    if (!res.ok) return [];
    const body = (await res.json()) as { items?: SearchRepo[] };
    return (body.items ?? []).map((item) => {
      const [owner, name] = item.full_name.split('/');
      return {
        fullName: item.full_name,
        owner,
        name,
        url: item.html_url,
        description: item.description ?? '',
        language: item.language ?? '',
        stars: item.stargazers_count ?? 0,
        forks: item.forks_count ?? 0,
        periodStars: 0,
      };
    });
  } catch {
    return [];
  }
}

function daysAgo(days: number): string {
  const date = new Date(Date.now() - days * 86_400_000);
  return date.toISOString().slice(0, 10);
}

export type TrendingBundle = {
  daily: TrendingRepo[];
  weekly: TrendingRepo[];
  monthly: TrendingRepo[];
  starred: TrendingRepo[];
  fresh: TrendingRepo[];
};

/** 四路并行：三个 trending 周期 + 两个搜索视角（总星标、最近冒头）。 */
export async function fetchTrending(): Promise<TrendingBundle> {
  const [daily, weekly, monthly, starred, fresh] = await Promise.all([
    trending('daily'),
    trending('weekly'),
    trending('monthly'),
    search('stars:>100000', 'stars', 12),
    search(`created:>${daysAgo(30)} stars:>500`, 'stars', 12),
  ]);

  return { daily, weekly, monthly, starred, fresh };
}
