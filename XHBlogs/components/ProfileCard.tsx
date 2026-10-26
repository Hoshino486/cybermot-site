"use client";

import Link from 'next/link';
import { siteConfig } from '../siteConfig';
import ClientSocials from './ClientSocials';

export default function ProfileCard({ postCount, chatterCount, photoCount }: {
  postCount: number;
  chatterCount: number;
  photoCount: number;
}) {
  return (
    <section className="md:col-span-7 rounded-3xl bg-white/40 dark:bg-slate-800/50 backdrop-blur-md border border-white/40 dark:border-white/10 shadow-xl p-5 sm:p-6 md:p-8 flex flex-col justify-between transition-all duration-700 hover:scale-[1.01] group relative overflow-hidden h-full min-h-[220px] md:min-h-[280px]">
      <Link href="/about" className="flex items-center gap-4 md:gap-6 relative z-10 rounded-xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-indigo-500">
        <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-xl md:rounded-2xl bg-gradient-to-tr from-sky-400 to-indigo-500 p-1 shadow-lg shrink-0 transition-transform duration-500 group-hover:rotate-3">
          <img src={siteConfig.avatarUrl} alt={`${siteConfig.authorName}的头像`} className="w-full h-full rounded-lg md:rounded-xl object-cover bg-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mb-1 pb-1 leading-snug tracking-wider truncate">{siteConfig.authorName}</h2>
          <p className="mb-2 text-xs font-mono tracking-[0.18em] text-sky-600 dark:text-sky-300">{siteConfig.englishName}</p>
          <p className="text-xs sm:text-sm md:text-base text-slate-700 dark:text-slate-300 leading-relaxed max-w-md line-clamp-2 md:line-clamp-none">{siteConfig.bio || '个人简介待补充。'}</p>
        </div>
      </Link>
      <div className="flex flex-col md:flex-row items-center md:items-end justify-between mt-6 md:mt-8 gap-4 relative z-10">
        <div className="flex gap-3 sm:gap-6 w-full md:w-auto justify-around md:justify-start">
          <StatItem count={postCount} label="文章" href="/blog" />
          <StatItem count={chatterCount} label="杂谈" href="/chatter" />
          <StatItem count={photoCount} label="照片" href="/photowall" />
        </div>
        <ClientSocials />
      </div>
    </section>
  );
}

function StatItem({ count, label, href }: { count: number; label: string; href: string }) {
  const safeCount = Number.isFinite(count) && count >= 0 ? Math.floor(count) : null;
  return (
    <Link href={href} className="text-center px-2 rounded-lg transition-transform hover:-translate-y-1 focus-visible:outline-2 focus-visible:outline-indigo-500">
      <div className="text-xl md:text-2xl font-black text-sky-600 dark:text-sky-300">{safeCount ?? '—'}</div>
      <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 tracking-widest mt-1">{label}</div>
    </Link>
  );
}
