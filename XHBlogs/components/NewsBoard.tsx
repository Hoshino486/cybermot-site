'use client';

import { useMemo, useState } from 'react';
import { ArrowUpRight, Flame, RefreshCw, Radio } from 'lucide-react';

export type NewsItem = {
  id: string;
  title: string;
  originalTitle?: string;
  summary?: string;
  source?: { name?: string };
  links?: { aihot?: string; original?: string };
  publishedAt?: string;
  discoveredAt?: string;
  category?: string;
  score?: number;
  reason?: string;
};

export type HotTopic = {
  rank?: number;
  id: string;
  title: string;
  source?: { name?: string };
  links?: { aihot?: string; original?: string };
  sourceCount?: number;
  signalCount?: number;
  latestAt?: string;
};

const TABS: { key: string; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'ai-models', label: '模型' },
  { key: 'ai-products', label: '产品' },
  { key: 'industry', label: '行业' },
  { key: 'paper', label: '论文' },
  { key: 'tip', label: '教程' },
  { key: 'opinion', label: '观点' },
];

const LABEL: Record<string, string> = Object.fromEntries(TABS.map((tab) => [tab.key, tab.label]));

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
  items: NewsItem[];
  updatedAt: string;
  live: boolean;
}) {
  const [tab, setTab] = useState('all');

  const counts = useMemo(() => {
    const map: Record<string, number> = { all: items.length };
    for (const item of items) {
      const key = item.category || 'industry';
      map[key] = (map[key] ?? 0) + 1;
    }
    return map;
  }, [items]);

  const visible = useMemo(
    () => (tab === 'all' ? items : items.filter((item) => (item.category || 'industry') === tab)),
    [items, tab],
  );

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
        <p className="news-sub">AI 为主，兼顾模型、产品、行业、论文与观点；同一件事只留一条，按热度排在前面。</p>
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
            {visible.map((item) => (
              <article className="news-card" key={item.id}>
                <div className="news-card-top">
                  <span className="news-chip">{LABEL[item.category || 'industry'] ?? '行业'}</span>
                  <span className="news-source">{item.source?.name || '未知来源'}</span>
                  <time dateTime={item.publishedAt}>{timeAgo(item.publishedAt)}</time>
                </div>
                <h2>
                  <a href={item.links?.original || item.links?.aihot || '#'} target="_blank" rel="noopener noreferrer">
                    {item.title}
                  </a>
                </h2>
                {item.summary && <p>{item.summary}</p>}
                <div className="news-card-foot">
                  {item.links?.aihot && (
                    <a href={item.links.aihot} target="_blank" rel="noopener noreferrer">
                      AIHOT 条目 <ArrowUpRight size={13} />
                    </a>
                  )}
                  {item.links?.original && (
                    <a href={item.links.original} target="_blank" rel="noopener noreferrer">
                      原文 <ArrowUpRight size={13} />
                    </a>
                  )}
                </div>
              </article>
            ))}
            {visible.length === 0 && <p className="news-empty">这个分类暂时没有内容。</p>}
          </div>
        </section>
      </div>

      <footer className="news-credit">
        <Radio size={13} />
        <span>
          数据来自 <a href="https://aihot.news" target="_blank" rel="noopener noreferrer">AIHOT</a>
          ，每 2 分钟同步一次；标题与摘要由对方整理，版权归各原始来源。
        </span>
      </footer>
    </main>
  );
}
