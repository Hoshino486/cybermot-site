import 'server-only';
import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
export type PostSummary = { slug: string; title: string; description: string; date: string; cover: string; tags: string[]; sample: boolean; readingMinutes: number; searchText: string };
export function getPosts(): PostSummary[] {
  const directory = path.join(process.cwd(), 'posts');
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory).filter(file => file.endsWith('.md')).flatMap(file => {
    const { data, content } = matter(fs.readFileSync(path.join(directory, file), 'utf8'));
    if (data.draft === true) return [];
    return [{ slug: file.replace(/\.md$/, ''), title: String(data.title || '未命名文章'), description: String(data.description || content.replace(/[#*>`]/g, '').slice(0, 100)), date: data.date instanceof Date ? data.date.toISOString() : String(data.date || ''), cover: String(data.cover || '/images/dream.webp'), tags: Array.isArray(data.tags) ? data.tags.map(String) : [], sample: data.sample === true, readingMinutes: Math.max(1, Math.ceil(content.length / 450)), searchText: content }];
  }).sort((a, b) => Date.parse(b.date) - Date.parse(a.date));
}
