import fs from 'node:fs';
import path from 'node:path';
import type { MetadataRoute } from 'next';
import matter from 'gray-matter';
import { siteConfig } from '../siteConfig';

export const dynamic = 'force-static';

// The sitemap is generated at build time; source files aren't runtime assets.
function contentEntries(directory: 'posts' | 'chatters', route: string): MetadataRoute.Sitemap {
  const folder = path.join(/* turbopackIgnore: true */ process.cwd(), directory);
  if (!fs.existsSync(/* turbopackIgnore: true */ folder)) return [];
  const base = siteConfig.siteUrl.replace(/\/+$/, '');

  return fs.readdirSync(/* turbopackIgnore: true */ folder, { withFileTypes: true })
    .filter((file) => file.isFile() && file.name.endsWith('.md'))
    .flatMap((file) => {
      const { data } = matter(fs.readFileSync(/* turbopackIgnore: true */ path.join(/* turbopackIgnore: true */ folder, file.name), 'utf8'));
      if (data.draft === true || data.published === false) return [];
      const rawDate = data.updated ?? data.date;
      const date = rawDate ? new Date(rawDate) : undefined;
      return [{
        url: `${base}/${route}/${encodeURIComponent(file.name.slice(0, -3))}`,
        ...(date && Number.isFinite(date.getTime()) ? { lastModified: date } : {}),
      }];
    });
}

export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteConfig.siteUrl.replace(/\/+$/, '');
  const pages = ['', '/blog', '/search', '/moments', '/timeline', '/projects', '/photowall', '/music', '/chatter', '/about', '/friends', '/tree'];
  return [
    ...pages.map((page) => ({ url: `${base}${page || '/'}` })),
    ...contentEntries('posts', 'posts'),
    ...contentEntries('chatters', 'chatter'),
  ];
}

