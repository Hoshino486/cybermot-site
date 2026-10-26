"use client";

import { usePathname } from 'next/navigation';
import CommentSection from './CommentSection';
import commentsConfig from '../data/comments.json';

// Comments live in D1 now: a visitor gets an anonymous catgirl identity instead of a
// GitHub login. `enabled: false` in data/comments.json still switches the section off.
export default function CommentsEmbed({
  pageId,
  compact = false,
}: {
  pageId?: string;
  compact?: boolean;
}) {
  const pathname = usePathname();
  const threadId = pageId || pathname.replace(/\/$/, '') || '/';

  if (commentsConfig.enabled === false) {
    return (
      <section aria-label="评论" className={`relative w-full ${compact ? 'mt-4' : 'mt-12 border-t border-slate-300/30 pt-8 dark:border-slate-600/30'}`}>
        <p className="rounded-2xl border border-slate-300/30 bg-white/30 p-5 text-sm text-slate-500 backdrop-blur-md dark:border-slate-700/40 dark:bg-slate-900/30 dark:text-slate-400">
          评论区正在准备中，期待与你相遇。
        </p>
      </section>
    );
  }

  return <CommentSection pageId={threadId} compact={compact} />;
}
