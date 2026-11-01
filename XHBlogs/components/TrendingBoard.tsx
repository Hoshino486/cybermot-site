'use client';

import { useMemo, useState } from 'react';
import { ArrowUpRight, Star, GitFork, Flame, Clock, TrendingUp, Sparkles } from 'lucide-react';
import type { TrendingRepo } from '../lib/github-trending';

const VIEWS = [
  { key: 'daily', label: '今日热门', icon: Flame },
  { key: 'weekly', label: '本周热门', icon: TrendingUp },
  { key: 'monthly', label: '本月热门', icon: TrendingUp },
  { key: 'fresh', label: '最近冒头', icon: Sparkles },
  { key: 'starred', label: '最多星标', icon: Star },
] as const;

type ViewKey = (typeof VIEWS)[number]['key'];

function compact(value: number): string {
  if (value >= 100000) return `${(value / 1000).toFixed(0)}k`;
  if (value >= 1000) return `${(value / 1000).toFixed(1)}k`;
  return String(value);
}

const LANG_COLOR: Record<string, string> = {
  TypeScript: '#3178c6',
  JavaScript: '#f1e05a',
  Python: '#3572A5',
  Rust: '#dea584',
  Go: '#00ADD8',
  'C++': '#f34b7d',
  C: '#555555',
  'C#': '#178600',
  Java: '#b07219',
  Shell: '#89e051',
  HTML: '#e34c26',
  CSS: '#563d7c',
  Vue: '#41b883',
  Swift: '#F05138',
  Kotlin: '#A97BFF',
  Ruby: '#701516',
  PHP: '#4F5D95',
  Lua: '#000080',
  Zig: '#ec915c',
  Dart: '#00B4AB',
};

export default function TrendingBoard({
  data,
  updatedAt,
}: {
  data: {
    daily: TrendingRepo[];
    weekly: TrendingRepo[];
    monthly: TrendingRepo[];
    fresh: TrendingRepo[];
    starred: TrendingRepo[];
  };
  updatedAt: string;
}) {
  const [view, setView] = useState<ViewKey>('daily');
  const [lang, setLang] = useState<string>('all');

  const pool = data[view] ?? [];

  const languages = useMemo(() => {
    const counts = new Map<string, number>();
    for (const repo of pool) {
      if (!repo.language) continue;
      counts.set(repo.language, (counts.get(repo.language) ?? 0) + 1);
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);
  }, [pool]);

  const visible = useMemo(
    () => (lang === 'all' ? pool : pool.filter((repo) => repo.language === lang)),
    [pool, lang],
  );

  return (
    <section className="gh-trend" aria-label="GitHub 热门开源项目">
      <div className="gh-head">
        <div>
          <div className="gh-kicker">
            <span className="gh-dot" />
            GITHUB TRENDING · 实时榜
          </div>
          <h2>
            GitHub 热门<span>开源项目</span>
          </h2>
        </div>
        <div className="gh-stamp">
          <Clock size={13} />
          <span>{updatedAt} 更新</span>
        </div>
      </div>

      <div className="gh-tabs" role="tablist">
        {VIEWS.map((entry) => {
          const Icon = entry.icon;
          return (
            <button
              key={entry.key}
              role="tab"
              aria-selected={view === entry.key}
              className={view === entry.key ? 'is-active' : ''}
              onClick={() => { setView(entry.key); setLang('all'); }}
            >
              <Icon size={13} />
              {entry.label}
              <em>{(data[entry.key] ?? []).length}</em>
            </button>
          );
        })}
      </div>

      {languages.length > 1 && (
        <div className="gh-langs">
          <button type="button" className={lang === 'all' ? 'is-active' : ''} onClick={() => setLang('all')}>
            全部语言
          </button>
          {languages.map(([name, count]) => (
            <button key={name} type="button" className={lang === name ? 'is-active' : ''} onClick={() => setLang(name)}>
              <i style={{ background: LANG_COLOR[name] ?? '#7a8b94' }} />
              {name}
              <em>{count}</em>
            </button>
          ))}
        </div>
      )}

      <div className="gh-grid">
        {visible.map((repo, index) => (
          <a
            key={repo.fullName}
            className="gh-card"
            href={repo.url}
            target="_blank"
            rel="noopener noreferrer"
          >
            <span className="gh-rank">{String(index + 1).padStart(2, '0')}</span>
            <div className="gh-card-body">
              <div className="gh-name">
                <b>{repo.owner}/</b>
                {repo.name}
              </div>
              {repo.description && <p>{repo.description}</p>}
              <div className="gh-meta">
                {repo.language && (
                  <span className="gh-lang">
                    <i style={{ background: LANG_COLOR[repo.language] ?? '#7a8b94' }} />
                    {repo.language}
                  </span>
                )}
                <span>
                  <Star size={12} /> {compact(repo.stars)}
                </span>
                <span>
                  <GitFork size={12} /> {compact(repo.forks)}
                </span>
                {repo.periodStars > 0 && <span className="gh-gain">+{repo.periodStars.toLocaleString()} 本期</span>}
              </div>
            </div>
            <ArrowUpRight size={16} className="gh-out" />
          </a>
        ))}
        {visible.length === 0 && <p className="gh-empty">这一组暂时取不到数据，稍后再看。</p>}
      </div>

      <p className="gh-note">
        数据来自 GitHub Trending 与 GitHub Search API，每 15 分钟刷新；星标与 fork 数为当前总数。
      </p>
    </section>
  );
}
