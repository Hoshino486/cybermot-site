"use client";

import { motion } from 'framer-motion';
import { ArrowUpRight, Wrench } from 'lucide-react';
import BackButton from '../../components/BackButton';
import { toolsData } from '../../data/tools';

export default function ToolsBoard() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-10 relative z-10">
      <div className="mb-8 flex flex-col items-center md:items-start">
        <div className="mb-6 flex w-full justify-start">
          <BackButton />
        </div>
        <div className="w-full text-center md:text-left">
          <div className="flex items-center justify-center gap-2 text-emerald-600 md:justify-start dark:text-emerald-400">
            <Wrench className="h-3.5 w-3.5" aria-hidden="true" />
            <span className="text-[10px] font-bold uppercase tracking-[0.35em]">Tools / 工具</span>
          </div>
          <h1 className="mt-4 text-4xl font-black uppercase tracking-widest text-slate-900 drop-shadow-sm dark:text-white">
            Toolbox
          </h1>
          <p className="mt-3 font-serif text-slate-600 dark:text-slate-400">
            不用装软件，打开浏览器就能用的工具。
          </p>
        </div>
      </div>

      <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-slate-500 dark:text-slate-400">
          Open in a new tab · 独立工具页
        </p>
        <div className="rounded-full border border-slate-300/60 px-3 py-1 font-mono text-[11px] text-slate-500 dark:border-white/10 dark:text-slate-400">
          {toolsData.length} / {toolsData.length} 个工具
        </div>
      </div>

      <div className="mb-8 h-px w-full bg-gradient-to-r from-emerald-500/50 via-emerald-500/10 to-transparent" />

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {toolsData.map((tool) => (
          <motion.div
            key={tool.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: 'easeOut' }}
            className="h-full"
          >
            <a
              href={tool.href.startsWith('http') ? tool.href : `${tool.href}/`}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-emerald-500/20 bg-white/60 p-6 shadow-xl backdrop-blur-xl transition-all duration-500 hover:-translate-y-1 hover:border-emerald-500/50 hover:shadow-emerald-500/20 md:p-8 dark:bg-slate-800/50"
            >
              <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-emerald-500/10 blur-2xl transition-colors duration-500 group-hover:bg-emerald-500/20" />

              <div className="relative z-10 mb-4 flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-4">
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-emerald-500/20 bg-emerald-500/10 text-2xl">
                    {tool.icon}
                  </span>
                  <div className="min-w-0">
                    <h2 className="truncate text-xl font-bold text-slate-900 transition-colors group-hover:text-emerald-600 dark:text-white dark:group-hover:text-emerald-400">
                      {tool.name}
                    </h2>
                    <span className="mt-1 inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      {tool.status}
                    </span>
                  </div>
                </div>
                <ArrowUpRight className="h-5 w-5 shrink-0 text-slate-400 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-emerald-500" />
              </div>

              <p className="relative z-10 mb-6 line-clamp-3 min-h-[60px] font-serif text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                {tool.description}
              </p>

              <div className="relative z-10 mt-auto flex flex-wrap items-center gap-2">
                {tool.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-md border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700 shadow-sm dark:text-emerald-300"
                  >
                    {tag}
                  </span>
                ))}
                <span className="ml-auto inline-flex items-center gap-1 font-mono text-[11px] text-slate-500 transition-colors group-hover:text-emerald-600 dark:text-slate-400 dark:group-hover:text-emerald-400">
                  新标签页打开
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </span>
              </div>
            </a>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
