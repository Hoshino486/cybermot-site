import 'katex/dist/katex.min.css';
import type { Metadata } from 'next';
import './globals.css';
import './cybermot.css';
import './feature-workspace.css';
import './journal-fx.css';
import { ThemeProvider } from '../components/ThemeProvider';
import { MusicProvider } from '../components/MusicProvider';
import SiteShell from '../components/SiteShell';
import DaylightLayer from '../components/DaylightLayer';
import { SitePreferencesProvider } from '../components/SitePreferencesProvider';
import { siteConfig } from '../siteConfig';

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.siteUrl),
  title: { default: siteConfig.title, template: '%s · CyberMot' },
  description: siteConfig.bio,
  icons: {
    icon: [
      { url: '/icons/icon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icons/icon-64.png', sizes: '64x64', type: 'image/png' },
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    shortcut: '/icons/icon-32.png',
    apple: '/icons/icon-180.png',
  },
  openGraph: { title: siteConfig.title, description: siteConfig.bio, locale: 'zh_CN', type: 'website', images: [siteConfig.avatarUrl] },
  alternates: { types: { 'application/rss+xml': '/feed.xml' } },
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="zh-CN" data-scroll-behavior="smooth" suppressHydrationWarning><body>
    <DaylightLayer />
    <a className="skip-link" href="#page-content">跳至主要内容</a>
    <ThemeProvider><SitePreferencesProvider><MusicProvider><SiteShell>{children}</SiteShell></MusicProvider></SitePreferencesProvider></ThemeProvider>
  </body></html>;
}

