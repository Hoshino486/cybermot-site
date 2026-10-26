"use client";

import { useState } from 'react';
import { Globe, Mail, MessageCircle } from 'lucide-react';
import { siteConfig } from '../siteConfig';

function GithubIcon({ size = 17 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48v-1.86c-2.78.6-3.37-1.18-3.37-1.18-.45-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.61.07-.61 1 .07 1.53 1.03 1.53 1.03.89 1.53 2.34 1.09 2.91.83.09-.65.35-1.09.64-1.34-2.22-.25-4.55-1.11-4.55-4.94 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.65 0 0 .84-.27 2.75 1.03A9.56 9.56 0 0 1 12 6.84c.85 0 1.7.11 2.5.34 1.91-1.3 2.75-1.03 2.75-1.03.55 1.38.2 2.4.1 2.65.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.69-4.57 4.94.36.31.68.92.68 1.85v2.74c0 .27.18.58.69.48A10 10 0 0 0 12 2Z" />
    </svg>
  );
}

function publicUrl(value: string | undefined) {
  if (!value?.trim()) return '';
  try {
    const parsed = new URL(value);
    return ['https:', 'http:'].includes(parsed.protocol) ? parsed.href : '';
  } catch {
    return '';
  }
}

export default function ClientSocials() {
  const [message, setMessage] = useState('');
  const social = siteConfig.social;
  const links = [
    { name: 'GitHub', url: publicUrl(social?.github), icon: GithubIcon },
    { name: 'Gitee', url: publicUrl(social?.gitee), icon: Globe },
    { name: 'Google', url: publicUrl(social?.google), icon: Globe },
  ].filter(item => item.url);
  const contacts = [
    { name: '邮箱', value: social?.email?.trim(), icon: Mail },
    { name: 'QQ', value: social?.qq?.trim(), icon: MessageCircle },
    { name: '微信', value: social?.wechat?.trim(), icon: MessageCircle },
  ].filter(item => item.value);
  const buttonClass = 'w-9 h-9 rounded-xl bg-white/50 dark:bg-slate-700/50 flex items-center justify-center text-slate-700 dark:text-slate-300 hover:bg-sky-600 hover:text-white transition-colors border border-white/40 dark:border-white/10 shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500';

  async function copy(value: string, name: string) {
    try {
      await navigator.clipboard.writeText(value);
      setMessage(`${name}已复制。`);
    } catch {
      setMessage(`复制失败，请手动复制：${value}`);
    }
  }

  if (links.length === 0 && contacts.length === 0) {
    return <p className="text-xs text-slate-500 dark:text-slate-400">联系方式待补充</p>;
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex gap-2 flex-wrap justify-center">
        {links.map(({ name, url, icon: Icon }) => (
          <a key={name} href={url} target="_blank" rel="noopener noreferrer" className={buttonClass} aria-label={`访问${name}`} title={name}><Icon size={17} aria-hidden="true" /></a>
        ))}
        {contacts.map(({ name, value, icon: Icon }) => (
          <button type="button" key={name} onClick={() => copy(value!, name)} className={buttonClass} aria-label={`复制${name}`} title={`复制${name}`}><Icon size={17} aria-hidden="true" /></button>
        ))}
      </div>
      <p role="status" className="max-w-56 break-all text-xs text-slate-500 dark:text-slate-400">{message}</p>
    </div>
  );
}
