'use client';
import { Headphones } from 'lucide-react';
import { openMusicPlayer } from './NeteasePlayer';
export default function SidebarLyric() {
  return <button onClick={openMusicPlayer} className="w-full rounded-2xl border border-slate-300/40 bg-white/30 dark:bg-slate-800/40 p-5 text-left"><Headphones size={20} className="mb-3 text-sky-600 dark:text-sky-300"/><p className="text-sm">给阅读一点背景音乐</p><span className="block mt-2 text-xs text-slate-500 dark:text-slate-400">打开网易云随身听 ↗</span></button>;
}
