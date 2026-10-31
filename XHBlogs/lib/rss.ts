export type RssEntry = {
  title: string;
  link: string;
  publishedAt?: string;
  summary?: string;
};

const ENTITIES: Record<string, string> = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', '#39': "'",
  ldquo: '“', rdquo: '”', lsquo: '‘', rsquo: '’', mdash: '—', ndash: '–', hellip: '…', middot: '·',
};

function decode(text: string): string {
  return text
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(parseInt(code, 16)))
    .replace(/&([a-z]+|#39);/gi, (match, name) => ENTITIES[name.toLowerCase()] ?? match);
}

function stripTags(text: string): string {
  return decode(
    text
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' '),
  ).trim();
}

function pick(block: string, tag: string): string | undefined {
  const cdata = block.match(new RegExp(`<${tag}[^>]*>\\s*<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>\\s*</${tag}>`, 'i'));
  if (cdata) return cdata[1].trim();
  const plain = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, 'i'));
  return plain ? plain[1].trim() : undefined;
}

function pickLink(block: string): string | undefined {
  const href = block.match(/<link[^>]*href="([^"]+)"/i);
  if (href) return href[1];
  const plain = pick(block, 'link');
  return plain ? plain.replace(/<!\[CDATA\[|\]\]>/g, '').trim() : undefined;
}

/** 极简 RSS / Atom 解析：只取标题、链接、时间、摘要，够新闻列表用。 */
export function parseFeed(xml: string, limit = 8): RssEntry[] {
  const blocks = xml.match(/<(item|entry)[\s>][\s\S]*?<\/\1>/gi) ?? [];
  const entries: RssEntry[] = [];

  for (const block of blocks.slice(0, limit)) {
    const title = pick(block, 'title');
    const link = pickLink(block);
    if (!title || !link) continue;

    const date = pick(block, 'pubDate') ?? pick(block, 'published') ?? pick(block, 'updated') ?? pick(block, 'dc:date');
    const parsed = date ? Date.parse(decode(date)) : NaN;
    const summary = pick(block, 'description') ?? pick(block, 'summary') ?? pick(block, 'content:encoded');

    entries.push({
      title: stripTags(title),
      link: decode(link),
      publishedAt: Number.isFinite(parsed) ? new Date(parsed).toISOString() : undefined,
      summary: summary ? stripTags(summary).slice(0, 220) : undefined,
    });
  }

  return entries;
}
