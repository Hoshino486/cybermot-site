'use client';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import NeteasePlayer from './NeteasePlayer';
import { siteConfig } from '../siteConfig';
import CyberCat from './CyberCat';
import AnimeBackdrop from './AnimeBackdrop';

export default function SiteShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); router.push('/search'); }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [router]);
  return <div className={pathname === '/' ? 'site-shell' : 'site-shell inner-page'}>
    <AnimeBackdrop/>
    <div id="page-content">{children}</div>
    <NeteasePlayer />
    {siteConfig.enableAIAssistant && <CyberCat />}
    {pathname !== '/' && <footer className="inner-footer">© 2026 {siteConfig.englishName} · 赛博刹那 <span>基于 XHBlogs · CC BY-NC 4.0</span></footer>}
  </div>;
}
