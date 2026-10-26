// Snapshot the Bilibili profile into data/bilibili.json and download the avatar.
// Bilibili answers 412/403 to anything that is not a mainland browser request, so the
// snapshot has to be produced here and committed; the site then renders offline.
//
// Usage: npm run sync:bilibili
import { writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DATA = path.join(ROOT, 'data', 'bilibili.json');
const IMAGE_DIR = path.join(ROOT, 'public', 'images');

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36';

async function readUid() {
  const { readFile } = await import('node:fs/promises');
  const config = await readFile(path.join(ROOT, 'siteConfig.ts'), 'utf8');
  const match = config.match(/bilibiliUid:\s*"(\d+)"/);
  if (!match) throw new Error('siteConfig.ts 里没有 bilibiliUid');
  return match[1];
}

const uid = await readUid();
const response = await fetch(`https://api.bilibili.com/x/web-interface/card?mid=${uid}`, {
  headers: { 'User-Agent': UA, Referer: `https://space.bilibili.com/${uid}` },
  signal: AbortSignal.timeout(20_000),
});
if (!response.ok) throw new Error(`B 站接口返回 ${response.status}`);
const payload = await response.json();
const card = payload?.data?.card;
if (payload?.code !== 0 || !card) throw new Error(`B 站接口异常：code=${payload?.code} ${payload?.message ?? ''}`);

const face = (card.face || '').replace(/^http:/, 'https:');
let avatarPath = '';
if (face) {
  const image = await fetch(face, {
    headers: { 'User-Agent': UA, Referer: 'https://space.bilibili.com/' },
    signal: AbortSignal.timeout(30_000),
  });
  if (image.ok) {
    const buffer = Buffer.from(await image.arrayBuffer());
    if (buffer.length > 2_000) {
      await mkdir(IMAGE_DIR, { recursive: true });
      const file = path.join(IMAGE_DIR, 'bilibili-avatar.jpg');
      await writeFile(file, buffer);
      avatarPath = '/images/bilibili-avatar.jpg';
      console.log(`头像已保存 ${(buffer.length / 1024).toFixed(1)}KB`);
    }
  }
}

const snapshot = {
  name: card.name,
  sign: card.sign || '',
  level: card.level_info?.current_level ?? 0,
  fans: payload.data.follower ?? 0,
  videos: payload.data.archive_count ?? 0,
  likes: payload.data.like_num ?? 0,
  url: `https://space.bilibili.com/${uid}`,
  avatar: avatarPath || '/images/avatar.jpg',
  updatedAt: new Date().toISOString(),
};

await writeFile(DATA, JSON.stringify(snapshot, null, 2) + '\n', 'utf8');
console.log('已写入 data/bilibili.json');
console.log(JSON.stringify(snapshot, null, 2));
