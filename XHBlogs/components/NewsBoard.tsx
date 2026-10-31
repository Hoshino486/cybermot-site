'use client';

import { useMemo, useState } from 'react';
import { ArrowUpRight, ChevronDown, Flame, Radio, RefreshCw } from 'lucide-react';
import type { FeedItem, HotTopic } from '../lib/news';
import { clusterItems, relatedMap } from '../lib/news-cluster';

const TABS: { key: string; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'ai-models', label: '模型' },
  { key: 'ai-products', label: '产品' },
  { key: 'industry', label: '行业' },
  { key: 'paper', label: '论文' },
  { key: 'tip', label: '教程' },
  { key: 'opinion', label: '观点' },
  { key: 'tech', label: '科技' },
  { key: 'zh', label: '中文' },
];

const LABEL: Record<string, string> = {
  'ai-models': '模型',
  'ai-products': '产品',
  industry: '行业',
  paper: '论文',
  tip: '教程',
  opinion: '观点',
};

const CHANNEL_LABEL: Record<FeedItem['channel'], string> = {
  aihot: 'AI',
  tech: 'TECH',
  zh: '中文',
};

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

function matchesTab(item: FeedItem, tab: string): boolean {
  if (tab === 'all') return true;
  if (tab === 'tech' || tab === 'zh') return item.channel === tab;
  if (item.channel !== 'aihot') return false;
  return (item.category || 'industry') === tab;
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
  const [tab, setTab] = useState('all');
  const [open, setOpen] = useState<string | null>(null);

  const clusters = useMemo(() => clusterItems(items), [items]);
  const related = useMemo(() => relatedMap(items), [items]);

  const counts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const cluster of clusters) {
      for (const entry of TABS) {
        if (matchesTab(cluster.primary, entry.key)) map[entry.key] = (map[entry.key] ?? 0) + 1;
      }
    }
    return map;
  }, [clusters]);

  const visible = useMemo(
    () => clusters.filter((cluster) => matchesTab(cluster.primary, tab)),
    [clusters, tab],
  );

  const merged = clusters.filter((cluster) => cluster.others.length > 0).length;
  const relatedCount = clusters.filter((cluster) => (related.get(cluster.primary.id) ?? []).length > 0).length;

  return (
    <main className="news-page">
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
          AI 为主，也收科技与中文社区；四处信源每 2 分钟同步一次，同一件事只留一条，同主体的其它报道折在卡片里。
          <em className="news-merged">同题合并 {merged} 组 · 同主题关联 {relatedCount} 条</em>
        </p>
      </header>

      <div className="news-rail">
        <section className="news-hot" aria-label="当前热点">
          <div className="news-hot-head">
            <Flame size={15} />
            <span>正在被讨论</span>
          </div>
          <ol>
            {hotTopics.slice(0, 8).map((topic, index) => (
              <li key={topic.id}>
                <a href={topic.links?.original || topic.links?.aihot || '#'} target="_blank" rel="noopener noreferrer">
                  <span className="news-rank">{String(topic.rank ?? index + 1).padStart(2, '0')}</span>
                  <span className="news-hot-title">{topic.title}</span>
                  <span className="news-hot-meta">
                    {topic.sourceCount ? `${topic.sourceCount} 家信源` : topic.source?.name || ''}
                    {topic.latestAt ? ` · ${timeAgo(topic.latestAt)}` : ''}
                  </span>
                </a>
              </li>
            ))}
            {hotTopics.length === 0 && <li className="news-empty">热点暂时取不到，稍后刷新试试。</li>}
          </ol>
        </section>

        <section className="news-feed" aria-label="新闻列表">
          <div className="news-tabs" role="tablist">
            {TABS.map((entry) => (
              <button
                key={entry.key}
                role="tab"
                aria-selected={tab === entry.key}
                className={tab === entry.key ? 'is-active' : ''}
                onClick={() => setTab(entry.key)}
              >
                {entry.label}
                <em>{counts[entry.key] ?? 0}</em>
              </button>
            ))}
          </div>

          <div className="news-list">
            {visible.map((cluster) => {
              const item = cluster.primary;
              const extra = cluster.others;
              const opened = open === cluster.id;
              return (
                <article className="news-card" key={cluster.id}>
                  <div className="news-card-top">
                    <span className={`news-chip is-${item.channel}`}>
                      {item.channel === 'aihot' ? LABEL[item.category || 'industry'] ?? '行业' : CHANNEL_LABEL[item.channel]}
                    </span>
                    <span className="news-source">{item.source}</span>
                    <time dateTime={item.publishedAt}>{timeAgo(item.publishedAt)}</time>
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
                      <button type="button" onClick={() => setOpen(opened ? null : cluster.id)} aria-expanded={opened}>
                        另有 {extra.length} 条同题报道
                        <ChevronDown size={13} className={opened ? 'is-open' : ''} />
                      </button>
                      {opened && (
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

                  {(() => {
                    const peers = related.get(item.id) ?? [];
                    if (peers.length === 0) return null;
                    const key = `related-${cluster.id}`;
                    const opened = open === key;
                    return (
                      <div className="news-cluster news-related">
                        <button type="button" onClick={() => setOpen(opened ? null : key)} aria-expanded={opened}>
                          同主题还有 {peers.length} 条
                          <ChevronDown size={13} className={opened ? 'is-open' : ''} />
                        </button>
                        {opened && (
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
                    );
                  })()}
                  <div className="news-card-foot">
                    {item.extra && (
                      <a href={item.extra.url} target="_blank" rel="noopener noreferrer">
                        {item.extra.label} <ArrowUpRight size={13} />
                      </a>
                    )}
                    {item.channel === 'aihot' && item.url !== item.extra?.url && (
                      <a href={item.url} target="_blank" rel="noopener noreferrer">
                        原文 <ArrowUpRight size={13} />
                      </a>
                    )}
                  </div>
                </article>
              );
            })}
            {visible.length === 0 && <p className="news-empty">这个分类暂时没有内容。</p>}
          </div>
        </section>
      </div>

      <footer className="news-credit">
        <Radio size={13} />
        <span>
          信源：<a href="https://aihot.news" target="_blank" rel="noopener noreferrer">AIHOT</a> ·
          <a href="https://news.ycombinator.com" target="_blank" rel="noopener noreferrer"> Hacker News</a> ·
          <a href="https://sspai.com" target="_blank" rel="noopener noreferrer"> 少数派</a> ·
          <a href="https://www.v2ex.com" target="_blank" rel="noopener noreferrer"> V2EX</a>
          ，每 2 分钟同步；标题与摘要版权归各原始来源。
        </span>
      </footer>
    </main>
  );
}
