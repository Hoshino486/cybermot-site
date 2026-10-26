// Snapshot the Bilibili profile and the videos listed in siteConfig.bilibiliVideos.
//
// Bilibili answers 412 to its space APIs for data-centre traffic, but the public video
// page HTML is open, so metadata is parsed from `__INITIAL_STATE__` and the covers are
// downloaded. The site then renders from the commit with no runtime dependency.
//
// Usage: npm run sync:bilibili
import { writeFile, mkdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DATA = path.join(ROOT, 'data', 'bilibili.json');
const VIDEO_DATA = path.join(ROOT, 'data', 'bilibili-videos.json');
const IMAGE_DIR = path.join(ROOT, 'public', 'images', 'bilibili');

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36';
const HEADERS = { 'User-Agent': UA, Referer: 'https://www.bilibili.com/', 'Accept-Language': 'zh-CN,zh;q=0.9' };
const MAX_VIDEOS = 3;

const config = await readFile(path.join(ROOT, 'siteConfig.ts'), 'utf8');
const uid = config.match(/bilibiliUid:\s*"(\d+)"/)?.[1];
if (!uid) throw new Error('siteConfig.ts 里没有 bilibiliUid');
const videoIds = [...(config.match(/bilibiliVideos:\s*\[([^\]]*)\]/)?.[1] ?? '').matchAll(/"(BV[0-9A-Za-z]+)"/g)].map((m) => m[1]);
console.log(`UID ${uid}，投稿 ${videoIds.length} 个`);

// ---- profile + avatar -------------------------------------------------------
const profileResponse = await fetch(`https://api.bilibili.com/x/web-interface/card?mid=${uid}`, {
  headers: HEADERS,
  signal: AbortSignal.timeout(20_000),
});
if (!profileResponse.ok) throw new Error(`B 站资料接口返回 ${profileResponse.status}`);
const profilePayload = await profileResponse.json();
const card = profilePayload?.data?.card;
if (profilePayload?.code !== 0 || !card) throw new Error(`B 站资料异常：code=${profilePayload?.code}`);

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
      console.log(`头像 ${(buffer.length / 1024).toFixed(1)}KB`);
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
console.log(`资料：${snapshot.name} · ${snapshot.fans} 粉丝 · ${snapshot.videos} 视频`);

// ---- videos -----------------------------------------------------------------
await mkdir(IMAGE_DIR, { recursive: true });
const videos = [];

for (const bvid of videoIds.slice(0, MAX_VIDEOS)) {
  try {
    const response = await fetch(`https://www.bilibili.com/video/${bvid}/`, { headers: HEADERS, signal: AbortSignal.timeout(25_000) });
    if (!response.ok) throw new Error(`页面 ${response.status}`);
    const html = await response.text();
    const state = html.match(/window\.__INITIAL_STATE__\s*=\s*(\{[\s\S]*?\});/);
    if (!state) throw new Error('未找到 __INITIAL_STATE__（可能被风控）');
    const parsed = JSON.parse(state[1].replace(/undefined/g, 'null'));
    const data = parsed.videoData ?? {};
    if (!data.title) throw new Error('videoData 为空');

    let cover = '';
    const pic = (data.pic || '').replace(/^http:/, 'https:');
    if (pic) {
      const base = pic.split('@')[0];
      const image = await fetch(`${base}@480w_270h_1c`, { headers: HEADERS, signal: AbortSignal.timeout(30_000) });
      if (image.ok) {
        const buffer = Buffer.from(await image.arrayBuffer());
        if (buffer.length > 3_000) {
          await writeFile(path.join(IMAGE_DIR, `${bvid}.jpg`), buffer);
          cover = `/images/bilibili/${bvid}.jpg`;
        }
      }
    }

    videos.push({
      bvid,
      title: String(data.title).trim(),
      cover: cover || '/images/dream.webp',
      views: Number(data.stat?.view ?? 0),
      likes: Number(data.stat?.like ?? 0),
      duration: Number(data.duration ?? 0),
      date: new Date((Number(data.pubdate) || 0) * 1000).toISOString().slice(0, 10),
      url: `https://www.bilibili.com/video/${bvid}/`,
    });
    console.log(`  ${bvid}  ${data.stat?.view ?? 0} 播放  ${videos.at(-1).title}`);
  } catch (error) {
    console.log(`  ${bvid} 失败：${error.message}`);
  }
}

await writeFile(VIDEO_DATA, JSON.stringify(videos, null, 2) + '\n', 'utf8');
console.log(`已写入 data/bilibili-videos.json（${videos.length} 条）`);
