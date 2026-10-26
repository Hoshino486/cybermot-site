// Snapshot the Bilibili profile and every video of the space.
//
// The space APIs answer 412 unless the request carries a freshly seeded buvid3 cookie
// and a WBI signature, so this script does both: it bootstraps cookies from the front
// page, signs `x/space/wbi/arc/search`, then downloads each cover.
//
// Usage: npm run sync:bilibili
// Set siteConfig.bilibiliVideos to a non-empty list to publish only those BV ids.
import { writeFile, mkdir, readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DATA = path.join(ROOT, 'data', 'bilibili.json');
const VIDEO_DATA = path.join(ROOT, 'data', 'bilibili-videos.json');
const IMAGE_DIR = path.join(ROOT, 'public', 'images', 'bilibili');

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36';
const MIXIN_TAB = [46, 47, 18, 2, 53, 8, 23, 32, 15, 50, 10, 31, 58, 3, 45, 35, 27, 43, 5, 49, 33, 9, 42, 19, 29, 28, 14, 39, 12, 38, 41, 13, 37, 48, 7, 16, 24, 55, 40, 61, 26, 17, 0, 1, 60, 51, 30, 4, 22, 25, 54, 21, 56, 59, 6, 63, 57, 62, 11, 36, 20, 34, 44, 52];

const config = await readFile(path.join(ROOT, 'siteConfig.ts'), 'utf8');
const uid = config.match(/bilibiliUid:\s*"(\d+)"/)?.[1];
if (!uid) throw new Error('siteConfig.ts 里没有 bilibiliUid');
const pinned = [...(config.match(/bilibiliVideos:\s*\[([^\]]*)\]/)?.[1] ?? '').matchAll(/"(BV[0-9A-Za-z]+)"/g)].map((m) => m[1]);
console.log(`UID ${uid}${pinned.length ? `，指定 ${pinned.length} 个投稿` : '，同步全部投稿'}`);

// ---- cookies + wbi key ------------------------------------------------------
const front = await fetch('https://www.bilibili.com/', {
  headers: { 'User-Agent': UA, 'Accept-Language': 'zh-CN,zh;q=0.9' },
  signal: AbortSignal.timeout(20_000),
});
const jar = {};
for (const line of front.headers.getSetCookie?.() ?? []) {
  const [pair] = line.split(';');
  const [key, value] = pair.split('=');
  if (key) jar[key.trim()] = value?.trim() ?? '';
}
const cookie = Object.entries(jar).map(([key, value]) => `${key}=${value}`).join('; ');
const HEADERS = {
  'User-Agent': UA,
  'Accept-Language': 'zh-CN,zh;q=0.9',
  Referer: `https://space.bilibili.com/${uid}`,
  ...(cookie ? { Cookie: cookie } : {}),
};
console.log(`cookie: ${Object.keys(jar).join(', ') || '(无)'}`);

const nav = await (await fetch('https://api.bilibili.com/x/web-interface/nav', { headers: HEADERS })).json();
const raw = (nav?.data?.wbi_img?.img_url?.split('/').pop()?.split('.')[0] ?? '') + (nav?.data?.wbi_img?.sub_url?.split('/').pop()?.split('.')[0] ?? '');
const mixin = MIXIN_TAB.map((index) => raw[index]).join('').slice(0, 32);

function sign(params) {
  const withTime = { ...params, wts: Math.floor(Date.now() / 1000) };
  const query = Object.keys(withTime)
    .sort()
    .map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(String(withTime[key]).replace(/[!'()*]/g, ''))}`)
    .join('&');
  return `${query}&w_rid=${createHash('md5').update(query + mixin).digest('hex')}`;
}

// ---- profile ----------------------------------------------------------------
const profileResponse = await fetch(`https://api.bilibili.com/x/web-interface/card?mid=${uid}`, { headers: HEADERS, signal: AbortSignal.timeout(20_000) });
if (!profileResponse.ok) throw new Error(`资料接口 ${profileResponse.status}`);
const profilePayload = await profileResponse.json();
const card = profilePayload?.data?.card;
if (profilePayload?.code !== 0 || !card) throw new Error(`资料异常：code=${profilePayload?.code}`);

const face = (card.face || '').replace(/^http:/, 'https:');
let avatarPath = '';
if (face) {
  const image = await fetch(face, { headers: HEADERS, signal: AbortSignal.timeout(30_000) });
  if (image.ok) {
    const buffer = Buffer.from(await image.arrayBuffer());
    if (buffer.length > 2_000) {
      await mkdir(path.join(ROOT, 'public', 'images'), { recursive: true });
      await writeFile(path.join(ROOT, 'public', 'images', 'bilibili-avatar.jpg'), buffer);
      avatarPath = '/images/bilibili-avatar.jpg';
    }
  }
}

const snapshot = {
  name: card.name,
  sign: card.sign || '',
  level: card.level_info?.current_level ?? 0,
  fans: profilePayload.data.follower ?? 0,
  videos: profilePayload.data.archive_count ?? 0,
  likes: profilePayload.data.like_num ?? 0,
  url: `https://space.bilibili.com/${uid}`,
  avatar: avatarPath || '/images/avatar.jpg',
  updatedAt: new Date().toISOString(),
};
await writeFile(DATA, JSON.stringify(snapshot, null, 2) + '\n', 'utf8');
console.log(`资料：${snapshot.name} · ${snapshot.fans} 粉丝 · ${snapshot.videos} 视频 · ${snapshot.likes} 获赞`);

// ---- video list -------------------------------------------------------------
const list = [];
for (let page = 1; page <= 5; page++) {
  const query = sign({ mid: uid, ps: 30, pn: page, order: 'pubdate', platform: 'web', web_location: 1550101 });
  const response = await fetch(`https://api.bilibili.com/x/space/wbi/arc/search?${query}`, { headers: HEADERS, signal: AbortSignal.timeout(25_000) });
  const payload = await response.json().catch(() => ({}));
  const items = payload?.data?.list?.vlist ?? [];
  if (payload?.code !== 0) {
    console.log(`分页 ${page} 失败：code=${payload?.code} ${payload?.message ?? ''}`);
    break;
  }
  list.push(...items);
  if (items.length < 30) break;
}
console.log(`接口返回 ${list.length} 个投稿`);

const picked = pinned.length ? list.filter((item) => pinned.includes(item.bvid)) : list;

function seconds(length) {
  return String(length ?? '')
    .split(':')
    .reduce((total, part) => total * 60 + (Number(part) || 0), 0);
}

await mkdir(IMAGE_DIR, { recursive: true });
const videos = [];

for (const item of picked) {
  const bvid = item.bvid;
  let cover = '';
  const pic = (item.pic || '').replace(/^http:/, 'https:').replace(/^\/\//, 'https://');
  if (pic) {
    try {
      const image = await fetch(`${pic.split('@')[0]}@480w_270h_1c`, { headers: HEADERS, signal: AbortSignal.timeout(30_000) });
      if (image.ok) {
        const buffer = Buffer.from(await image.arrayBuffer());
        if (buffer.length > 3_000) {
          await writeFile(path.join(IMAGE_DIR, `${bvid}.jpg`), buffer);
          cover = `/images/bilibili/${bvid}.jpg`;
        }
      }
    } catch {}
  }

  videos.push({
    bvid,
    title: String(item.title ?? '').trim(),
    cover: cover || '/images/dream.webp',
    views: Number(item.play ?? 0),
    duration: seconds(item.length),
    date: new Date((Number(item.created ?? item.pubdate) || 0) * 1000).toISOString().slice(0, 10),
    url: `https://www.bilibili.com/video/${bvid}/`,
  });
  console.log(`  ${bvid}  ${String(item.play ?? 0).padStart(6)} 播放  ${videos.at(-1).title}`);
}

await writeFile(VIDEO_DATA, JSON.stringify(videos, null, 2) + '\n', 'utf8');
console.log(`已写入 data/bilibili-videos.json（${videos.length} 条，封面 ${videos.filter((v) => v.cover.startsWith('/images/bilibili/')).length} 张）`);
