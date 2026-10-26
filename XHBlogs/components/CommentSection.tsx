'use client';

import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { usePathname } from 'next/navigation';
import { Loader2, MessageCircle, RefreshCw, Send } from 'lucide-react';
import CatAvatar from './CatAvatar';

type Comment = { id: string; name: string; seed: number; body: string; createdAt: number };
type Identity = { name: string; seed: number };

const STORAGE_KEY = 'cybermot:comment-identity';
const NAMES = ['橘子', '雪团', '黑糖', '白桃', '月见', '奶糖', '薄荷', '柚子', '可可', '焦糖', '云朵', '海盐', '抹茶', '蜜柑', '铃兰', '夜昙', '星星', '草莓', '墨鱼', '年糕'];
const TAILS = ['', '子', '酱', '团', '饼', '丸'];
const MAX_BODY = 500;

function createIdentity(): Identity {
  const pick = (list: string[]) => list[Math.floor(Math.random() * list.length)];
  return { name: pick(NAMES) + pick(TAILS) + '喵', seed: Math.floor(Math.random() * 1_000_000_000) };
}

function readIdentity(): Identity {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<Identity>;
      if (typeof parsed.name === 'string' && typeof parsed.seed === 'number' && parsed.name.endsWith('喵')) {
        return { name: parsed.name, seed: parsed.seed };
      }
    }
  } catch {}
  const created = createIdentity();
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(created)); } catch {}
  return created;
}

function relativeTime(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const minute = 60_000;
  if (diff < minute) return '刚刚';
  if (diff < 60 * minute) return `${Math.floor(diff / minute)} 分钟前`;
  if (diff < 24 * 60 * minute) return `${Math.floor(diff / (60 * minute))} 小时前`;
  if (diff < 30 * 24 * 60 * minute) return `${Math.floor(diff / (24 * 60 * minute))} 天前`;
  return new Date(timestamp).toLocaleDateString('zh-CN');
}

export default function CommentSection({ pageId, compact = false }: { pageId?: string; compact?: boolean }) {
  const pathname = usePathname();
  const page = pageId || pathname.replace(/\/$/, '') || '/';
  const [identity, setIdentity] = useState<Identity | null>(null);
  const [draftName, setDraftName] = useState<string | null>(null);
  const [body, setBody] = useState('');
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    // 虚拟身份存在 localStorage 里，只能挂载后再读，所以这里必须同步 setState
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIdentity(readIdentity());
    return () => { mounted.current = false; };
  }, []);

  const load = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/comments?page=${encodeURIComponent(page)}`, { signal, cache: 'no-store' });
      const data = (await response.json()) as { comments?: Comment[]; error?: string };
      if (!response.ok) throw new Error(data.error || '评论暂时加载不出来。');
      if (!mounted.current) return;
      setComments(Array.isArray(data.comments) ? data.comments : []);
      setError('');
    } catch (problem) {
      if ((problem as Error).name === 'AbortError') return;
      if (mounted.current) setError(problem instanceof Error ? problem.message : '评论暂时加载不出来。');
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    const abort = new AbortController();
    // 拉取留言：请求在本帧之后才落地，不构成渲染期副作用
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load(abort.signal);
    return () => abort.abort();
  }, [load]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!identity || sending) return;
    const text = body.trim();
    if (!text) { setError('先写点什么吧。'); return; }
    setSending(true);
    setError('');
    try {
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ page, name: (draftName ?? identity.name).trim() || identity.name, body: text, seed: identity.seed }),
      });
      const data = (await response.json()) as { comment?: Comment; error?: string };
      if (!response.ok || !data.comment) throw new Error(data.error || '评论没有送达。');
      setComments((current) => [data.comment as Comment, ...current]);
      setBody('');
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ name: (draftName ?? identity.name).trim() || identity.name, seed: identity.seed })); } catch {}
    } catch (problem) {
      setError(problem instanceof Error ? problem.message : '评论没有送达。');
    } finally {
      setSending(false);
    }
  };

  const reroll = () => {
    const next = createIdentity();
    setIdentity(next);
    setDraftName(null);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
  };

  return (
    <section aria-label="评论" className={`relative w-full ${compact ? 'mt-4' : 'mt-12 border-t border-slate-300/30 pt-8 dark:border-slate-600/30'}`}>
      <header className="mb-5 flex items-center gap-2 text-sm font-bold tracking-widest text-slate-600 uppercase dark:text-slate-300">
        <MessageCircle size={16} aria-hidden="true" />
        <span>留言 · {comments.length}</span>
      </header>

      <form onSubmit={submit} className="mb-8 rounded-2xl border border-white/40 bg-white/50 p-4 shadow-lg backdrop-blur-md dark:border-white/10 dark:bg-slate-900/40">
        <div className="mb-3 flex items-center gap-3">
          {identity ? <CatAvatar seed={identity.seed} size={44} className="shrink-0 rounded-full" /> : <div className="h-11 w-11 shrink-0 rounded-full bg-slate-300/40" />}
          <input
            value={draftName ?? identity?.name ?? ''}
            onChange={(event) => setDraftName(event.target.value.slice(0, 16))}
            maxLength={16}
            aria-label="你的昵称"
            placeholder="随便起个名字"
            className="min-w-0 flex-1 rounded-full border border-white/50 bg-white/60 px-4 py-2 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-indigo-400 dark:border-white/10 dark:bg-slate-800/60 dark:text-white"
          />
          <button
            type="button"
            onClick={reroll}
            title="换一个虚拟身份"
            aria-label="换一个虚拟身份"
            className="shrink-0 rounded-full border border-white/50 bg-white/60 p-2 text-slate-500 transition hover:text-indigo-500 dark:border-white/10 dark:bg-slate-800/60 dark:text-slate-400"
          >
            <RefreshCw size={15} />
          </button>
        </div>
        <textarea
          value={body}
          onChange={(event) => setBody(event.target.value.slice(0, MAX_BODY))}
          rows={compact ? 2 : 3}
          maxLength={MAX_BODY}
          aria-label="留言内容"
          placeholder="说点什么，匿名的猫娘会替你署名。"
          className="w-full resize-none rounded-xl border border-white/50 bg-white/60 px-4 py-3 text-sm leading-relaxed text-slate-800 outline-none focus:ring-2 focus:ring-indigo-400 dark:border-white/10 dark:bg-slate-800/60 dark:text-white"
        />
        <div className="mt-3 flex items-center justify-between gap-3">
          <span className="text-xs text-slate-400">{body.length}/{MAX_BODY}</span>
          <button
            type="submit"
            disabled={sending || !body.trim()}
            className="inline-flex items-center gap-2 rounded-full bg-indigo-500/90 px-5 py-2 text-sm font-bold text-white shadow-md transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {sending ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
            留下
          </button>
        </div>
      </form>

      {error && <p role="status" className="mb-4 text-sm text-rose-500">{error}</p>}

      {loading ? (
        <p className="flex items-center gap-2 text-sm text-slate-400"><Loader2 size={14} className="animate-spin" /> 正在翻看留言…</p>
      ) : comments.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-slate-300/50 px-5 py-8 text-center text-sm text-slate-400 dark:border-slate-600/40">还没有人说话，第一只猫娘在等你。</p>
      ) : (
        <ul className="space-y-4">
          {comments.map((item) => (
            <li key={item.id} className="flex gap-3 rounded-2xl border border-white/40 bg-white/40 p-4 backdrop-blur-sm dark:border-white/10 dark:bg-slate-900/30">
              <CatAvatar seed={item.seed} size={40} className="shrink-0 self-start rounded-full" />
              <div className="min-w-0">
                <div className="mb-1 flex flex-wrap items-baseline gap-2">
                  <b className="text-sm text-slate-800 dark:text-slate-100">{item.name}</b>
                  <time className="text-xs text-slate-400" dateTime={new Date(item.createdAt).toISOString()}>{relativeTime(item.createdAt)}</time>
                </div>
                <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-slate-700 dark:text-slate-300">{item.body}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
