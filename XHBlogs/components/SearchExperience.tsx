'use client';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight, Search, X } from 'lucide-react';
import Navbar from './Navbar';
import type { PostSummary } from '../lib/posts';
export default function SearchExperience({ posts }: { posts: PostSummary[] }) {
  const [query, setQuery] = useState('');
  const results = useMemo(() => {
    const terms = query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
    return posts.filter(post => terms.every(term => [post.title, post.description, post.searchText, ...post.tags].join(' ').toLocaleLowerCase().includes(term)));
  }, [query, posts]);
  return <><Navbar/><main className="search-page"><span className="section-kicker">FIND A LITTLE INSPIRATION</span><h1>寻找一段<span>灵感。</span></h1><label className="search-input"><Search size={23}/><input autoFocus value={query} onChange={event => setQuery(event.target.value)} placeholder="搜索文章、内容或标签…" aria-label="搜索文章、内容或标签"/>{query && <button aria-label="清空搜索" onClick={() => setQuery('')}><X size={18}/></button>}<kbd>Ctrl K</kbd></label><p className="search-count" aria-live="polite">{query ? '找到 ' : '全部 '}{results.length} 篇文章</p><div className="search-results">{results.map(post => <Link className="search-result" key={post.slug} href={'/posts/' + post.slug}><span>{post.tags[0] || '文章'} · {post.date.slice(0, 10)}{post.sample ? ' · 示例' : ''}</span><h2>{post.title}<ArrowUpRight size={21}/></h2><p>{post.description}</p></Link>)}</div>{!results.length && <div className="empty-message"><Search size={32}/><h2>还没有找到这段故事</h2><p>试试更短的词，或者搜索“空间”“灵感”。</p></div>}</main></>;
}
