"use client";

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useTheme } from './ThemeProvider';
import { MessageCircle } from 'lucide-react';
import commentsConfig from '../data/comments.json';

// Only public identifiers belong here. giscus handles GitHub authorization.
const configured = Boolean(
  commentsConfig.enabled && commentsConfig.repo && commentsConfig.repoId &&
  commentsConfig.category && commentsConfig.categoryId,
);

export default function CommentsEmbed({
  pageId,
  compact = false,
}: {
  pageId?: string;
  compact?: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const { isDark } = useTheme();
  const [failed, setFailed] = useState(false);
  const threadId = pageId || pathname.replace(/\/$/, '') || '/';

  useEffect(() => {
    const container = containerRef.current;
    if (!configured || !container) return;

    container.replaceChildren();
    const script = document.createElement('script');
    script.src = 'https://giscus.app/client.js';
    script.async = true;
    script.crossOrigin = 'anonymous';
    const attributes: Record<string, string> = {
      'data-repo': commentsConfig.repo,
      'data-repo-id': commentsConfig.repoId,
      'data-category': commentsConfig.category,
      'data-category-id': commentsConfig.categoryId,
      'data-mapping': 'specific',
      'data-term': threadId,
      'data-strict': '1',
      'data-reactions-enabled': '1',
      'data-emit-metadata': '0',
      'data-input-position': 'top',
      'data-theme': document.documentElement.classList.contains('dark') ? 'dark_dimmed' : 'light',
      'data-lang': 'zh-CN',
      'data-loading': 'lazy',
    };
    Object.entries(attributes).forEach(([key, value]) => script.setAttribute(key, value));
    script.onerror = () => setFailed(true);
    script.onload = () => setFailed(false);
    container.appendChild(script);

    return () => {
      script.onerror = null;
      script.onload = null;
      container.replaceChildren();
    };
  }, [threadId]);

  useEffect(() => {
    const frame = containerRef.current?.querySelector<HTMLIFrameElement>('iframe.giscus-frame');
    frame?.contentWindow?.postMessage({
      giscus: { setConfig: { theme: isDark ? 'dark_dimmed' : 'light' } },
    }, 'https://giscus.app');
  }, [isDark]);

  return (
    <section
      aria-label="评论"
      className={`relative w-full ${compact ? 'mt-4' : 'mt-12 border-t border-slate-300/30 pt-8 dark:border-slate-600/30'}`}
    >
      {!configured ? (
        <div className="flex items-center gap-3 rounded-2xl border border-slate-300/30 bg-white/30 p-5 text-sm text-slate-500 backdrop-blur-md dark:border-slate-700/40 dark:bg-slate-900/30 dark:text-slate-400">
          <MessageCircle size={20} aria-hidden="true" />
          <p>评论区正在准备中，期待与你相遇。</p>
        </div>
      ) : (
        <>
          {failed && (
            <p role="status" className="mb-4 text-sm text-slate-500 dark:text-slate-400">
              评论暂时没有加载成功，可以前往{' '}
              <a className="underline underline-offset-4" href={`https://github.com/${commentsConfig.repo}/discussions`} target="_blank" rel="noopener noreferrer">GitHub 讨论区</a>
              {' '}留言。
            </p>
          )}
          <div ref={containerRef} className="min-h-24" />
        </>
      )}
    </section>
  );
}


