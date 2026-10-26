import 'katex/dist/katex.min.css';
import type { Metadata } from 'next';
import './globals.css';
import './cybermot.css';
import './feature-workspace.css';
import { ThemeProvider } from '../components/ThemeProvider';
import { MusicProvider } from '../components/MusicProvider';
import SiteShell from '../components/SiteShell';
import { SitePreferencesProvider } from '../components/SitePreferencesProvider';
import { siteConfig } from '../siteConfig';

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.siteUrl),
  title: { default: siteConfig.title, template: '%s · CyberMot' },
  description: siteConfig.bio,
  icons: { icon: '/favicon.svg', apple: siteConfig.avatarUrl },
  openGraph: { title: siteConfig.title, description: siteConfig.bio, locale: 'zh_CN', type: 'website', images: [siteConfig.avatarUrl] },
  alternates: { types: { 'application/rss+xml': '/feed.xml' } },
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="zh-CN" data-scroll-behavior="smooth" suppressHydrationWarning><body>
    <a className="skip-link" href="#page-content">跳至主要内容</a>
    <ThemeProvider><SitePreferencesProvider><MusicProvider><SiteShell>{children}</SiteShell></MusicProvider></SitePreferencesProvider></ThemeProvider>
  </body></html>;
}

