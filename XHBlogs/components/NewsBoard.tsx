'use client';

import { useMemo, useState } from 'react';
import { ArrowUpRight, ChevronDown, Flame, Layers, Radio, RefreshCw, Star } from 'lucide-react';
import type { Beat, FeedItem, HotTopic } from '../lib/news';
import { clusterItems, relatedMap } from '../lib/news-cluster';

const BEATS: { key: Beat | 'all'; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'ai', label: 'AI' },
  { key: 'tech', label: '科技' },
  { key: 'politics', label: '国际' },
  { key: 'finance', label: '财经' },
  { key: 'community', label: '社区' },
];

const BEAT_LABEL: Record<Beat, string> = {
  ai: 'AI',
  tech: '科技',
  politics: '国际',
  finance: '财经',
  community: '社区',
};

const CATEGORY_LABEL: Record<string, string> = {
  'ai-models': '模型',
  'ai-products': '产品',
  industry: '行业',
  paper: '论文',
  tip: '教程',
  opinion: '观点',
};

type View = 'selected' | 'all' | 'hot';

function dayKey(iso?: string): string {
  if (!iso) return '未知时间';
  const date = new Date(iso);
  if (!Number.isFinite(date.getTime())) return '未知时间';
  return new Intl.DateTimeFormat('zh-CN', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

function dayLabel(key: string): string {
  if (key === '未知时间') return key;
  const [year, month, day] = key.split('/').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  const weekday = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'][date.getUTCDay()];
  return `${month} 月 ${day} 日 · ${weekday}`;
}

function clock(iso?: string): string {
  if (!iso) return '--:--';
  const date = new Date(iso);
  if (!Number.isFinite(date.getTime())) return '--:--';
  return new Intl.DateTimeFormat('zh-CN', {
    timeZone: 'Asia/Shanghai',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);
}

function timeAgo(value?: string): string {
  if (!value) return '';
  const then = new Date(value).getTime();
  if (!Number.isFinite(then)) return '';
  const minutes = Math.round((Date.now() - then) / 60000);
  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes} 分钟前`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} 小时前`;
  return `${Math.round(hours / 24)} 天前`;
}

export default function NewsBoard({
  hotTopics,
  items,
  updatedAt,
  live,
}: {
  hotTopics: HotTopic[];
  items: FeedItem[];
  updatedAt: string;
  live: boolean;
}) {
  const [view, setView] = useState<View>('selected');
  const [beat, setBeat] = useState<Beat | 'all'>('all');
  const [open, setOpen] = useState<string | null>(null);

  const clusters = useMemo(() => clusterItems(items), [items]);
  const related = useMemo(() => relatedMap(items), [items]);

  const beatCounts = useMemo(() => {
    const map: Record<string, number> = { all: items.length };
    for (const item of items) map[item.beat] = (map[item.beat] ?? 0) + 1;
    return map;
  }, [items]);

  const base = useMemo(() => {
    if (beat !== 'all') return clusters.filter((cluster) => cluster.primary.beat === beat);
    if (view === 'selected') {
      return clusters.filter(({ primary }) => primary.beat === 'politics' || primary.beat === 'finance' || primary.beat === 'ai');
    }
    return clusters;
  }, [clusters, view, beat]);

  const grouped = useMemo(() => {
    const map = new Map<string, typeof base>();
    for (const cluster of base) {
      const key = dayKey(cluster.primary.publishedAt);
      const bucket = map.get(key) ?? [];
      bucket.push(cluster);
      map.set(key, bucket);
    }
    return [...map.entries()];
  }, [base]);

  const mergedCount = clusters.filter((cluster) => cluster.others.length > 0).length;
  const relatedCount = clusters.filter((cluster) => (related.get(cluster.primary.id) ?? []).length > 0).length;

  return (
    <main className="news-page">
      <aside className="news-side">
        <div className="news-side-title">内容</div>
        {([
          ['selected', '精选', Star],
          ['all', '全部', Layers],
          ['hot', '热点榜', Flame],
        ] as const).map(([key, label, Icon]) => (
          <button
            key={key}
            type="button"
            className={view === key ? 'is-active' : ''}
            onClick={() => { setView(key); setBeat('all'); }}
          >
            <Icon size={14} />
            {label}
            <em>{key === 'hot' ? hotTopics.length : key === 'all' ? items.length : base.length}</em>
          </button>
        ))}

        <div className="news-side-title">分类</div>
        {BEATS.filter((entry) => entry.key !== 'all').map((entry) => (
          <button
            key={entry.key}
            type="button"
            className={beat === entry.key && view !== 'hot' ? 'is-active' : ''}
            onClick={() => { setView('all'); setBeat(entry.key as Beat); }}
          >
            {entry.label}
            <em>{beatCounts[entry.key] ?? 0}</em>
          </button>
        ))}

        <div className="news-side-title">关于</div>
        <p className="news-side-note">
          四类信源自动汇总：AIHOT 的精选与热点、国际通讯社 RSS、财经媒体，以及 HN / 少数派 / V2EX。
        </p>
      </aside>

      <section className="news-main">
        <header className="news-heading">
          <div className="news-kicker">
            <span className={live ? 'news-dot' : 'news-dot is-off'} />
            NEWS WIRE · 实时热点
          </div>
          <div className="news-title-row">
            <h1>
              新闻<span>与热点</span>
            </h1>
            <div className="news-stamp">
              <RefreshCw size={13} />
              <span>{updatedAt} 更新</span>
            </div>
          </div>
          <p className="news-sub">
            AI、国际、财经、科技与社区，十四路信源每 2 分钟同步一次，同一件事只留一条。
            <em className="news-merged">同题合并 {mergedCount} 组 · 同主题关联 {relatedCount} 条</em>
          </p>
        </header>

        {view === 'hot' ? (
          <ol className="news-hotlist">
            {hotTopics.map((topic, index) => (
              <li key={topic.id}>
                <a href={topic.links?.original || topic.links?.aihot || '#'} target="_blank" rel="noopener noreferrer">
                  <span className="news-rank">{String(topic.rank ?? index + 1).padStart(2, '0')}</span>
                  <span className="news-hotlist-body">
                    <b>{topic.title}</b>
                    <span>
                      {topic.sourceCount ? `${topic.sourceCount} 家信源` : ''}
                      {topic.latestAt ? ` · ${timeAgo(topic.latestAt)}` : ''}
                    </span>
                  </span>
                </a>
              </li>
            ))}
            {hotTopics.length === 0 && <li className="news-empty">热点暂时取不到。</li>}
          </ol>
        ) : (
          <>
            <div className="news-tabs" role="tablist">
              {BEATS.map((entry) => (
                <button
                  key={entry.key}
                  role="tab"
                  aria-selected={beat === entry.key}
                  className={beat === entry.key ? 'is-active' : ''}
                  onClick={() => setBeat(entry.key)}
                >
                  {entry.label}
                  <em>{entry.key === 'all' ? base.length : beatCounts[entry.key] ?? 0}</em>
                </button>
              ))}
            </div>

            <div className="news-list">
              {grouped.map(([key, bucket]) => (
                <section className="news-day" key={key}>
                  <div className="news-day-head">
                    <b>{dayLabel(key)}</b>
                    <span>{bucket.length} 条</span>
                  </div>
                  {bucket.map((cluster) => {
                    const item = cluster.primary;
                    const extra = cluster.others;
                    const peers = related.get(item.id) ?? [];
                    const mergedOpen = open === cluster.id;
                    const relatedKey = `related-${cluster.id}`;
                    const relatedOpen = open === relatedKey;
                    return (
                      <article className="news-card" key={cluster.id}>
                        <div className="news-card-top">
                          <time dateTime={item.publishedAt}>{clock(item.publishedAt)}</time>
                          <span className={`news-chip is-${item.channel}`}>
                            {item.channel === 'aihot' ? CATEGORY_LABEL[item.category ?? 'industry'] ?? '行业' : BEAT_LABEL[item.beat]}
                          </span>
                          <span className="news-source">{item.source}</span>
                          {extra.length > 0 && <span className="news-cluster-count">+{extra.length} 家</span>}
                        </div>
                        <h2>
                          <a href={item.url} target="_blank" rel="noopener noreferrer">
                            {item.title}
                          </a>
                        </h2>
                        {item.summary && <p>{item.summary}</p>}

                        {extra.length > 0 && (
                          <div className="news-cluster">
                            <button type="button" onClick={() => setOpen(mergedOpen ? null : cluster.id)} aria-expanded={mergedOpen}>
                              另有 {extra.length} 条同题报道
                              <ChevronDown size={13} className={mergedOpen ? 'is-open' : ''} />
                            </button>
                            {mergedOpen && (
                              <ul>
                                {extra.map((other) => (
                                  <li key={other.id}>
                                    <a href={other.url} target="_blank" rel="noopener noreferrer">
                                      {other.title}
                                    </a>
                                    <span>{other.source}</span>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        )}

                        {peers.length > 0 && (
                          <div className="news-cluster news-related">
                            <button type="button" onClick={() => setOpen(relatedOpen ? null : relatedKey)} aria-expanded={relatedOpen}>
                              同主题还有 {peers.length} 条
                              <ChevronDown size={13} className={relatedOpen ? 'is-open' : ''} />
                            </button>
                            {relatedOpen && (
                              <ul>
                                {peers.map((peer) => (
                                  <li key={peer.id}>
                                    <a href={peer.url} target="_blank" rel="noopener noreferrer">
                                      {peer.title}
                                    </a>
                                    <span>{peer.source}</span>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        )}

                        <div className="news-card-foot">
                          {item.extra && (
                            <a href={item.extra.url} target="_blank" rel="noopener noreferrer">
                              {item.extra.label} <ArrowUpRight size={13} />
                            </a>
                          )}
                          <a href={item.url} target="_blank" rel="noopener noreferrer">
                            原文 <ArrowUpRight size={13} />
                          </a>
                        </div>
                      </article>
                    );
                  })}
                </section>
              ))}
              {grouped.length === 0 && <p className="news-empty">这个分类暂时没有内容。</p>}
            </div>
          </>
        )}

        <footer className="news-credit">
          <Radio size={13} />
          <span>
            信源：<a href="https://aihot.news" target="_blank" rel="noopener noreferrer">AIHOT</a> ·
            BBC · The Guardian · Al Jazeera · NYT · DW · France 24 · NPR ·
            <a href="https://news.ycombinator.com" target="_blank" rel="noopener noreferrer"> Hacker News</a> ·
            <a href="https://sspai.com" target="_blank" rel="noopener noreferrer"> 少数派</a> ·
            <a href="https://www.v2ex.com" target="_blank" rel="noopener noreferrer"> V2EX</a> · 华尔街见闻
            ，每 2 分钟同步；标题与摘要版权归各原始来源。
          </span>
        </footer>
      </section>
    </main>
  );
}
