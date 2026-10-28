"use client";

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowUpRight, Wrench } from 'lucide-react';
import { toolsData } from '../data/tools';

export default function ToolsSection({ query }: { query: string }) {
  const normalized = query.trim().toLowerCase();
  const tools = normalized
    ? toolsData.filter(
        (tool) =>
          tool.name.toLowerCase().includes(normalized) ||
          tool.description.toLowerCase().includes(normalized) ||
          tool.tags.some((tag) => tag.toLowerCase().includes(normalized))
      )
    : toolsData;

  if (normalized && tools.length === 0) return null;

  return (
    <section id="tools" className="mt-24 scroll-mt-28">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
            <Wrench className="h-3.5 w-3.5" aria-hidden="true" />
            <span className="text-[10px] font-bold uppercase tracking-[0.35em]">Tools / 工具</span>
          </div>
          <h2 className="mt-3 text-3xl font-black uppercase tracking-widest text-slate-900 drop-shadow-sm dark:text-white">
            Toolbox
          </h2>
          <p className="mt-2 font-serif text-sm text-slate-600 dark:text-slate-400">
            不用装软件，打开浏览器就能用的工具。
          </p>
        </div>
        <div className="rounded-full border border-slate-300/60 px-3 py-1 font-mono text-[11px] text-slate-500 dark:border-white/10 dark:text-slate-400">
          {tools.length} / {toolsData.length} 个工具
        </div>
      </div>

      <div className="mb-8 h-px w-full bg-gradient-to-r from-emerald-500/50 via-emerald-500/10 to-transparent" />

      <motion.div layout className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {tools.map((tool) => (
          <motion.div
            layout
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.45, ease: 'easeOut' }}
            key={tool.id}
            className="h-full"
          >
            <Link
              href={tool.href}
              className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-emerald-500/20 bg-white/60 p-6 shadow-xl backdrop-blur-xl transition-all duration-500 hover:-translate-y-1 hover:border-emerald-500/50 hover:shadow-emerald-500/20 md:p-8 dark:bg-slate-800/50"
            >
              <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-emerald-500/10 blur-2xl transition-colors duration-500 group-hover:bg-emerald-500/20" />

              <div className="relative z-10 mb-4 flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-4">
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-emerald-500/20 bg-emerald-500/10 text-2xl">
                    {tool.icon}
                  </span>
                  <div className="min-w-0">
                    <h3 className="truncate text-xl font-bold text-slate-900 transition-colors group-hover:text-emerald-600 dark:text-white dark:group-hover:text-emerald-400">
                      {tool.name}
                    </h3>
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
                  打开工具
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </span>
              </div>
            </Link>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}
