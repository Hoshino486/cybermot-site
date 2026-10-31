import type { FeedItem } from './news';

export type Cluster = {
  id: string;
  primary: FeedItem;
  others: FeedItem[];
};

const STOP = new Set(['the', 'and', 'for', 'with', 'that', 'this', 'from', 'are', 'was', 'has', 'have', 'will', 'into', 'your', 'you', 'how', 'why', 'what', 'new', 'show', 'tell', 'ask', 'hn']);

/** 标题里认得出的主体：英文专有名词 + 常见中文公司名。 */
const CN_ENTITIES = [
  '苹果', '阿里', '腾讯', '字节', '百度', '华为', '小米', '京东', '美团', '拼多多', '网易', '快手', '滴滴',
  '谷歌', '微软', '亚马逊', '英伟达', '英特尔', '台积电', '三星', '特斯拉', 'openai', 'anthropic', 'google',
  'apple', 'microsoft', 'meta', 'nvidia', 'amd', 'intel', 'amazon', 'tesla', 'xai', 'deepseek', 'mistral',
  'claude', 'gemini', 'gpt', 'llama', 'sora', 'midjourney', 'figma', 'vercel', 'cloudflare', 'github',
  'steam', 'valve', 'blender', 'unity', 'epic', 'adobe', 'notion', 'stripe', 'spacex', 'tiktok', 'reddit',
];

function signature(title: string): Set<string> {
  const lower = title.toLowerCase();
  const tokens = new Set<string>();

  for (const word of lower.split(/[^a-z0-9]+/)) {
    if (word.length > 2 && !STOP.has(word)) tokens.add(word);
  }

  const han = lower.replace(/[^\p{Script=Han}]/gu, '');
  for (let i = 0; i + 1 < han.length; i++) tokens.add(han.slice(i, i + 2));

  return tokens;
}

function jaccard(left: Set<string>, right: Set<string>): number {
  if (left.size === 0 || right.size === 0) return 0;
  let shared = 0;
  for (const token of left) if (right.has(token)) shared++;
  return shared / (left.size + right.size - shared);
}

export function entitiesOf(title: string): Set<string> {
  const lower = title.toLowerCase();
  const found = new Set<string>();

  for (const entity of CN_ENTITIES) {
    if (lower.includes(entity)) found.add(entity);
  }

  const han = lower.replace(/[^\p{Script=Han}]/gu, '');
  for (const word of title.split(/[^A-Za-z0-9]+/)) {
    if (word.length > 2 && /^[A-Z]/.test(word) && !STOP.has(word.toLowerCase())) found.add(word.toLowerCase());
  }

  return found;
}

const CHANNEL_WEIGHT: Record<FeedItem['channel'], number> = { aihot: 4, zh: 3, world: 2, finance: 2, china: 2, global: 2, tech: 1 };

/** 把同一件事的多家报道合成一条，主条目优先取整理过的中文摘要。 */
export function clusterItems(items: FeedItem[], threshold = 0.4): Cluster[] {
  const prepared = items.map((item) => ({ item, sig: signature(item.title) }));
  const used = new Set<number>();
  const clusters: Cluster[] = [];

  for (let i = 0; i < prepared.length; i++) {
    if (used.has(i)) continue;
    used.add(i);
    const members = [prepared[i].item];

    for (let j = i + 1; j < prepared.length; j++) {
      if (used.has(j)) continue;
      if (jaccard(prepared[i].sig, prepared[j].sig) >= threshold) {
        used.add(j);
        members.push(prepared[j].item);
      }
    }

    const [primary, ...others] = members.sort((a, b) => {
      const weight = CHANNEL_WEIGHT[b.channel] - CHANNEL_WEIGHT[a.channel];
      if (weight !== 0) return weight;
      return (b.score ?? 0) - (a.score ?? 0);
    });

    clusters.push({ id: primary.id, primary, others });
  }

  return clusters.sort((a, b) => {
    const left = a.primary.publishedAt ? Date.parse(a.primary.publishedAt) : 0;
    const right = b.primary.publishedAt ? Date.parse(b.primary.publishedAt) : 0;
    return right - left;
  });
}

/**
 * 同主题：标题里提到同一个主体就算相关。
 * 出现次数太多的主体（比如满屏都是 OpenAI）权重降低，避免什么都关联到一起。
 */
export function relatedMap(items: FeedItem[], maxRelated = 4): Map<string, FeedItem[]> {
  const entities = new Map<string, Set<string>>();
  const frequency = new Map<string, number>();

  for (const item of items) {
    const set = entitiesOf(item.title);
    entities.set(item.id, set);
    for (const entity of set) frequency.set(entity, (frequency.get(entity) ?? 0) + 1);
  }

  const result = new Map<string, FeedItem[]>();
  for (const item of items) {
    const own = entities.get(item.id);
    if (!own || own.size === 0) continue;

    const scored: { item: FeedItem; score: number }[] = [];
    for (const other of items) {
      if (other.id === item.id) continue;
      const theirs = entities.get(other.id);
      if (!theirs) continue;

      let score = 0;
      for (const entity of own) {
        if (!theirs.has(entity)) continue;
        const count = frequency.get(entity) ?? 1;
        if (count > 13) continue;
        score += 1 / count;
      }
      if (score > 0) scored.push({ item: other, score });
    }

    if (scored.length === 0) continue;
    scored.sort((a, b) => b.score - a.score);
    result.set(item.id, scored.slice(0, maxRelated).map((entry) => entry.item));
  }

  return result;
}
