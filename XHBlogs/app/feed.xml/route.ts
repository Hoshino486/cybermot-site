import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import { siteConfig } from '../../siteConfig';

export const dynamic = 'force-static';
export const revalidate = false;

function escapeXml(value: unknown): string {
  return String(value ?? '')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\uFFFE\uFFFF]/g, '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function GET() {
  const base = siteConfig.siteUrl.replace(/\/+$/, '');
  const directory = path.join(process.cwd(), 'posts');
  const files = fs.existsSync(directory) ? fs.readdirSync(directory, { withFileTypes: true }) : [];
  const posts = files
    .filter((file) => file.isFile() && file.name.endsWith('.md'))
    .flatMap((file) => {
      const { data, content } = matter(fs.readFileSync(path.join(directory, file.name), 'utf8'));
      if (data.draft === true) return [];
      const published = data.date ? new Date(data.date) : undefined;
      return [{
        title: String(data.title || file.name.slice(0, -3)),
        description: String(data.description || content.trim().slice(0, 240)),
        url: `${base}/posts/${encodeURIComponent(file.name.slice(0, -3))}`,
        published: published && Number.isFinite(published.getTime()) ? published : undefined,
        tags: Array.isArray(data.tags) ? data.tags.filter((tag: unknown): tag is string => typeof tag === 'string') : [],
      }];
    })
    .sort((left, right) => (right.published?.getTime() ?? 0) - (left.published?.getTime() ?? 0))
    .slice(0, 30);

  const items = posts.map((post) => `
    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${escapeXml(post.url)}</link>
      <guid isPermaLink="true">${escapeXml(post.url)}</guid>
      <description>${escapeXml(post.description)}</description>
      ${post.published ? `<pubDate>${post.published.toUTCString()}</pubDate>` : ''}
      ${post.tags.map((tag: string) => `<category>${escapeXml(tag)}</category>`).join('')}
    </item>`).join('');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(siteConfig.title)}</title>
    <link>${escapeXml(base)}/</link>
    <description>${escapeXml(siteConfig.bio)}</description>
    <language>zh-cn</language>
    <atom:link href="${escapeXml(base)}/feed.xml" rel="self" type="application/rss+xml" />
    ${posts[0]?.published ? `<lastBuildDate>${posts[0].published.toUTCString()}</lastBuildDate>` : ''}
    ${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
