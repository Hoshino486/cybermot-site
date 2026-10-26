import type { MetadataRoute } from 'next';
import { siteConfig } from '../siteConfig';

export default function robots(): MetadataRoute.Robots {
  const base = siteConfig.siteUrl.replace(/\/+$/, '');
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: '/api/',
    },
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
