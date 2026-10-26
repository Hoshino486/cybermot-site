// Download every track of the NetEase playlist into public/music and keep the
// siteConfig.localMusic map in sync, so playback never depends on NetEase's
// region checks at request time (the Worker's egress is outside mainland China).
//
// Usage:  npm run sync:music
// Must be run from a mainland-China network: the playable URL is only handed out
// to domestic IPs. Files already present are left untouched.
import { mkdir, readFile, writeFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONFIG = path.join(ROOT, 'siteConfig.ts');
const OUT_DIR = path.join(ROOT, 'public', 'music');
const MIN_BYTES = 100_000;
const MAX_TRACKS = 500;

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36';
const HEADERS = { Referer: 'https://music.163.com/', 'User-Agent': UA };

const log = (...args) => console.log(...args);

async function playlistId() {
  const source = await readFile(CONFIG, 'utf8');
  const match = source.match(/musicPlaylistId:\s*"(\d+)"/);
  if (!match) throw new Error('siteConfig.ts 里找不到 musicPlaylistId');
  return { id: match[1], source };
}

async function requestJson(url) {
  const response = await fetch(url, { headers: HEADERS, signal: AbortSignal.timeout(20_000) });
  if (!response.ok) throw new Error(`HTTP ${response.status} ${url}`);
  return response.json();
}

async function trackIds(id) {
  const data = await requestJson(`https://music.163.com/api/v6/playlist/detail?id=${id}&n=1000`);
  const playlist = data.playlist;
  if (data.code !== 200 || !playlist) throw new Error('歌单不可访问，检查 musicPlaylistId 是否为公开歌单');
  const ids = (playlist.trackIds || []).map((item) => String(item.id));
  if (!ids.length) throw new Error('歌单是空的');
  return { ids: ids.slice(0, MAX_TRACKS), name: playlist.name || String(id) };
}

async function resolveUrl(id) {
  const response = await fetch(`https://music.163.com/song/media/outer/url?id=${id}.mp3`, {
    headers: HEADERS,
    redirect: 'manual',
    signal: AbortSignal.timeout(20_000),
  });
  const location = response.headers.get('location') || '';
  if (response.status !== 302 || !location || location.includes('/404')) return null;
  // The CDN hands out http:// URLs; it serves the same object over TLS, which is
  // required because the site itself is https.
  return location.replace(/^http:/, 'https:');
}

async function existing(file) {
  try {
    const info = await stat(file);
    return info.size >= MIN_BYTES ? info.size : 0;
  } catch {
    return 0;
  }
}

async function download(url, file) {
  const response = await fetch(url, { headers: HEADERS, signal: AbortSignal.timeout(120_000) });
  if (!response.ok) throw new Error(`CDN HTTP ${response.status}`);
  const buffer = Buffer.from(await response.arrayBuffer());
  const type = response.headers.get('content-type') || '';
  if (buffer.length < MIN_BYTES) throw new Error(`文件过小 (${buffer.length}B)，可能不是音频`);
  if (!type.startsWith('audio/') && !type.startsWith('application/octet-stream')) {
    throw new Error(`返回的不是音频 (${type})`);
  }
  await writeFile(file, buffer);
  return buffer.length;
}

function renderConfig(source, entries) {
  const lines = Object.keys(entries).sort().map((id) => `    "${id}": "${entries[id]}"`);
  const block = `  localMusic: {\n${lines.join(',\n')}\n  },`;
  if (/^\s*localMusic:\s*\{[\s\S]*?^\s*\},/m.test(source)) {
    return source.replace(/^\s*localMusic:\s*\{[\s\S]*?^\s*\},/m, block);
  }
  const anchor = source.match(/^.*musicPlaylistTitle:.*$/m);
  if (!anchor) throw new Error('siteConfig.ts 里找不到 musicPlaylistTitle，无法插入 localMusic');
  return source.replace(anchor[0], `${anchor[0]}\n${block}`);
}

const { id, source } = await playlistId();
const { ids, name } = await trackIds(id);
log(`歌单「${name}」共 ${ids.length} 首`);
await mkdir(OUT_DIR, { recursive: true });

const entries = {};
const failed = [];
for (const [index, trackId] of ids.entries()) {
  const label = `[${String(index + 1).padStart(2, '0')}/${ids.length}] ${trackId}`;
  const file = path.join(OUT_DIR, `${trackId}.mp3`);
  const size = await existing(file);
  if (size) {
    log(`${label} 已存在 ${(size / 1024 / 1024).toFixed(2)}MB，跳过`);
    entries[trackId] = `/music/${trackId}.mp3`;
    continue;
  }
  try {
    const url = await resolveUrl(trackId);
    if (!url) throw new Error('网易云未提供播放地址（会员曲/已下架/地区限制）');
    const bytes = await download(url, file);
    log(`${label} 下载完成 ${(bytes / 1024 / 1024).toFixed(2)}MB`);
    entries[trackId] = `/music/${trackId}.mp3`;
  } catch (error) {
    log(`${label} 失败：${error.message}`);
    failed.push({ trackId, reason: error.message });
  }
}

const next = renderConfig(source, entries);
if (next !== source) {
  await writeFile(CONFIG, next, 'utf8');
  log(`siteConfig.ts 已更新：${Object.keys(entries).length} 首自托管`);
} else {
  log('siteConfig.ts 无需改动');
}

if (failed.length) {
  log(`\n${failed.length} 首未能自托管（这些会回落到网易云在线播放）：`);
  for (const item of failed) log(`  ${item.trackId} - ${item.reason}`);
}
