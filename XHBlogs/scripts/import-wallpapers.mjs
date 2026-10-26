// One-off importer that fills the photo wall with 4K anime wallpapers from Wallhaven.
//
// The originals are 3840×2160 and up; each is re-encoded to a 2560-wide WebP so a page
// with fifteen of them still loads quickly, then sorted into three albums by luminance
// (night → glow → daylight) and written into data/albums.ts.
//
// Usage: node scripts/import-wallpapers.mjs [count]
// The artwork belongs to its original authors; this is meant for a personal gallery.
import { mkdir, writeFile, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'public', 'photos');
const TMP = path.join(ROOT, '.photo-tmp');
const COUNT = Math.max(6, Number(process.argv[2] ?? 15));
const WIDTH = 2560;
const QUALITY = 80;

const require = createRequire(import.meta.url);
const sharp = require('sharp');

const ALBUMS = [
  { id: 'night', title: '夜色低语', description: '深蓝与霓虹交界的时刻，适合把灯关掉。', date: '2026-09-18' },
  { id: 'glow', title: '浮光掠影', description: '逆光、花瓣与尚未散尽的午后。', date: '2026-10-02' },
  { id: 'daylight', title: '暖阳片段', description: '明亮、干净，像刚好醒来的那一瞬。', date: '2026-10-20' },
];

const BANNED_TAGS = ['cleavage', 'sexy', 'ecchi', 'swimsuit', 'underwear', 'panties', 'nude', 'lingerie', 'bikini', 'breasts', 'lewd', 'topless'];
// Hand-picked rejects: a character close-up slipped through the tag filter once.
const EXCLUDE = new Set(['rqez2j']);
// Wallhaven has no "scenery" tag, so several quiet subject searches are pooled instead.
const TERMS = ['sky', 'clouds', 'night', 'city', 'stars', 'sunset', 'rain', 'forest', 'ocean', 'snow'];

async function collect() {
  const found = [];
  for (const term of TERMS) {
    for (let page = 1; page <= 3 && found.length < COUNT; page++) {
      const url = `https://wallhaven.cc/api/v1/search?q=${encodeURIComponent(term)}&categories=010&purity=100&atleast=3840x2160&sorting=toplist&order=desc&page=${page}`;
      const response = await fetch(url, { signal: AbortSignal.timeout(30_000) });
      if (!response.ok) throw new Error(`wallhaven ${response.status}`);
      const payload = await response.json();
      const items = payload.data ?? [];
      for (const item of items) {
        if (found.length >= COUNT) break;
        if (!item.path || found.some((entry) => entry.id === item.id)) continue;
        if (EXCLUDE.has(item.id)) continue;
        const [width, height] = String(item.resolution ?? '').split('x').map(Number);
        const ratio = width && height ? width / height : 0;
        if (ratio < 1.6 || ratio > 2.2) continue;
        const tags = (item.tags ?? []).map((tag) => String(tag.name ?? '').toLowerCase());
        if (tags.some((tag) => BANNED_TAGS.includes(tag))) continue;
        found.push({ id: item.id, path: item.path, resolution: item.resolution });
      }
      if (items.length < 24) break;
      await new Promise((resolve) => setTimeout(resolve, 1_000));
    }
    if (found.length >= COUNT) break;
    await new Promise((resolve) => setTimeout(resolve, 800));
  }
  return found;
}

const picked = await collect();
console.log(`选中 ${picked.length} 张 4K 壁纸`);
await rm(OUT, { recursive: true, force: true });
await mkdir(TMP, { recursive: true });

const photos = [];
for (const [index, item] of picked.entries()) {
  try {
    const response = await fetch(item.path, { signal: AbortSignal.timeout(120_000) });
    if (!response.ok) throw new Error(`下载 ${response.status}`);
    const buffer = Buffer.from(await response.arrayBuffer());

    const image = sharp(buffer);
    const meta = await image.metadata();
    const pipeline = image.resize({ width: Math.min(WIDTH, meta.width ?? WIDTH), withoutEnlargement: true });
    const encoded = await pipeline.webp({ quality: QUALITY, effort: 5 }).toBuffer();
    const stats = await sharp(encoded).stats();
    const luminance = (stats.channels[0].mean * 0.2126 + stats.channels[1].mean * 0.7152 + stats.channels[2].mean * 0.0722) / 255;

    photos.push({
      id: item.id,
      buffer: encoded,
      luminance,
      width: Math.min(WIDTH, meta.width ?? WIDTH),
      height: Math.round((meta.height ?? 0) * (Math.min(WIDTH, meta.width ?? WIDTH) / (meta.width ?? 1))),
    });
    console.log(`  [${index + 1}/${picked.length}] ${item.id}  ${(buffer.length / 1048576).toFixed(1)}MB → ${(encoded.length / 1024).toFixed(0)}KB  L=${luminance.toFixed(3)}`);
  } catch (error) {
    console.log(`  ${item.id} 失败：${error.message}`);
  }
}

if (!photos.length) throw new Error('没有成功下载任何图片');

photos.sort((a, b) => a.luminance - b.luminance);
const per = Math.ceil(photos.length / ALBUMS.length);

const albums = ALBUMS.map((album, index) => {
  const slice = photos.slice(index * per, (index + 1) * per);
  return { ...album, photos: slice };
}).filter((album) => album.photos.length);

for (const album of albums) {
  await mkdir(path.join(OUT, album.id), { recursive: true });
  for (const photo of album.photos) {
    await writeFile(path.join(OUT, album.id, `${photo.id}.webp`), photo.buffer);
  }
}

const lines = [];
lines.push('// 相册数据：由 scripts/import-wallpapers.mjs 生成，可手动增删。');
lines.push('export interface Photo { url: string; caption?: string; }');
lines.push('export interface Album { id: string; title: string; description: string; cover: string; date: string; photos: Photo[]; }');
lines.push('');
lines.push('export const albums: Album[] = [');
for (const album of albums) {
  const cover = `/photos/${album.id}/${album.photos[0].id}.webp`;
  lines.push('  {');
  lines.push(`    id: ${JSON.stringify(album.id)},`);
  lines.push(`    title: ${JSON.stringify(album.title)},`);
  lines.push(`    description: ${JSON.stringify(album.description)},`);
  lines.push(`    cover: ${JSON.stringify(cover)},`);
  lines.push(`    date: ${JSON.stringify(album.date)},`);
  lines.push('    photos: [');
  for (const photo of album.photos) {
    lines.push(`      { url: ${JSON.stringify(`/photos/${album.id}/${photo.id}.webp`)}, caption: ${JSON.stringify(`${photo.width}×${photo.height}`)} },`);
  }
  lines.push('    ],');
  lines.push('  },');
}
lines.push('];');
lines.push('');

await writeFile(path.join(ROOT, 'data', 'albums.ts'), lines.join('\n'), 'utf8');
await rm(TMP, { recursive: true, force: true });

const total = photos.reduce((sum, photo) => sum + photo.buffer.length, 0);
console.log(`完成：${albums.length} 个相册 / ${photos.length} 张，共 ${(total / 1048576).toFixed(1)}MB`);
