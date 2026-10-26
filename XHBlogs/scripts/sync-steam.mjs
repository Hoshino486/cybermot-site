// Snapshot the Steam profile, its recently played games and every CS2 workshop item
// the account authored or took part in.
//
// steamcommunity.com is unreachable from mainland China, so requests are tunnelled
// through the local proxy (STEAM_PROXY, default http://127.0.0.1:7897) with Node's own
// CONNECT handling — no extra dependency. Steam rate-limits aggressively, so every
// request is retried with backoff and failed items keep their previous snapshot.
//
// Usage: npm run sync:steam
import { writeFile, mkdir, readFile } from 'node:fs/promises';
import http from 'node:http';
import https from 'node:https';
import tls from 'node:tls';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DATA = path.join(ROOT, 'data', 'steam.json');
const IMAGE_DIR = path.join(ROOT, 'public', 'images', 'steam');
const WORKSHOP_DIR = path.join(ROOT, 'public', 'images', 'workshop');
const PROFILE_ID = process.env.STEAM_ID || '76561199543091926';
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36';
const RECENT_LIMIT = 3;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function parseProxy(value) {
  try {
    const url = new URL(value);
    return { host: url.hostname, port: Number(url.port) || 7897 };
  } catch {
    return { host: '127.0.0.1', port: 7897 };
  }
}

const proxy = parseProxy(process.env.STEAM_PROXY || process.env.HTTPS_PROXY || 'http://127.0.0.1:7897');

function tunnelAgent() {
  const agent = new https.Agent({ keepAlive: false });
  agent.createConnection = (options, callback) => {
    const request = http.request({ host: proxy.host, port: proxy.port, method: 'CONNECT', path: `${options.host}:${options.port}` });
    request.once('connect', (response, socket) => {
      if (response.statusCode !== 200) return callback(new Error(`proxy ${response.statusCode}`));
      const secure = tls.connect({ socket, servername: options.host }, () => callback(null, secure));
      secure.once('error', callback);
    });
    request.once('error', callback);
    request.end();
  };
  return agent;
}

const agent = tunnelAgent();

function httpsGet(url, { binary = false } = {}) {
  return new Promise((resolve, reject) => {
    const request = https.get(
      url,
      { agent, headers: { 'User-Agent': UA, 'Accept-Language': 'zh-CN,zh;q=0.9', 'Accept-Encoding': 'identity' } },
      (response) => {
        if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
          httpsGet(response.headers.location, { binary }).then(resolve, reject);
          return;
        }
        const chunks = [];
        response.on('data', (chunk) => chunks.push(chunk));
        response.on('end', () => {
          const buffer = Buffer.concat(chunks);
          resolve({ status: response.statusCode, body: binary ? buffer : buffer.toString('utf8') });
        });
      },
    );
    request.on('error', reject);
    request.setTimeout(30_000, () => request.destroy(new Error('timeout')));
  });
}

async function getRetry(url, options = {}, attempts = 4) {
  let lastError;
  for (let attempt = 0; attempt < attempts; attempt++) {
    try {
      const response = await httpsGet(url, options);
      if (response.status === 429 || response.status >= 500) {
        lastError = new Error(`HTTP ${response.status}`);
        await sleep(3_000 * (attempt + 1));
        continue;
      }
      return response;
    } catch (error) {
      lastError = error;
      await sleep(3_000 * (attempt + 1));
    }
  }
  throw lastError ?? new Error('request failed');
}

const previous = await readFile(DATA, 'utf8').then((text) => JSON.parse(text)).catch(() => ({}));
const previousItems = new Map((previous.workshop ?? []).map((item) => [item.id, item]));

const profileUrl = `https://steamcommunity.com/profiles/${PROFILE_ID}/`;

// ---- profile -----------------------------------------------------------------
const xml = await getRetry(`${profileUrl}?xml=1`);
if (xml.status !== 200) throw new Error(`xml 返回 ${xml.status}`);
const pick = (tag) => xml.body.match(new RegExp(`<${tag}><!\\[CDATA\\[([\\s\\S]*?)\\]\\]></${tag}>`))?.[1] ?? xml.body.match(new RegExp(`<${tag}>([^<]*)</${tag}>`))?.[1] ?? '';

await sleep(800);
const page = await getRetry(profileUrl);
if (page.status !== 200) throw new Error(`资料页返回 ${page.status}`);

const name = pick('steamID') || page.body.match(/<span class="actual_persona_name">([^<]+)<\/span>/)?.[1] || 'Steam';
const state = pick('onlineState') || 'offline';
const avatarUrl = pick('avatarFull');
const level = Number(page.body.match(/class="friendPlayerLevelNum">(\d+)</)?.[1] ?? 0);

let avatar = previous.avatar ?? '';
if (avatarUrl) {
  try {
    const image = await getRetry(avatarUrl, { binary: true }, 2);
    if (image.status === 200 && image.body.length > 2_000) {
      await mkdir(path.join(ROOT, 'public', 'images'), { recursive: true });
      await writeFile(path.join(ROOT, 'public', 'images', 'steam-avatar.jpg'), image.body);
      avatar = '/images/steam-avatar.jpg';
    }
  } catch {}
}

// ---- recently played ----------------------------------------------------------
await mkdir(IMAGE_DIR, { recursive: true });
const blocks = page.body.split('class="recent_game_content"').slice(1);
const recent = [];

for (const block of blocks.slice(0, RECENT_LIMIT)) {
  const link = block.match(/href="https:\/\/steamcommunity\.com\/app\/(\d+)"/)?.[1] ?? '';
  const gameName = block.match(/<div class="game_name">\s*<a[^>]*>([^<]+)<\/a>/)?.[1]?.trim() ?? '';
  const details = block.match(/<div class="game_info_details">([\s\S]*?)<\/div>/)?.[1] ?? '';
  const hours = Number((details.match(/([\d,]+)\s*小时/)?.[1] ?? '0').replace(/,/g, ''));
  const last = details.match(/最后运行日期：([^<]+)/)?.[1]?.trim() ?? '';
  const capsuleUrl = block.match(/<img class="game_capsule" src="([^"]+)"/)?.[1] ?? '';

  let capsule = previous.recent?.find((game) => game.appid === link)?.capsule ?? '';
  if (capsuleUrl && link) {
    try {
      const image = await getRetry(capsuleUrl, { binary: true }, 2);
      if (image.status === 200 && image.body.length > 2_000) {
        await writeFile(path.join(IMAGE_DIR, `${link}.jpg`), image.body);
        capsule = `/images/steam/${link}.jpg`;
      }
    } catch {}
  }

  if (gameName) {
    recent.push({ appid: link, name: gameName, hours, last, capsule: capsule || '/images/dream.webp', url: link ? `https://steamcommunity.com/app/${link}` : profileUrl });
    console.log(`  ${gameName}  ${hours} 小时${last ? `  ${last}` : ''}`);
  }
}

// ---- CS2 workshop -------------------------------------------------------------
await mkdir(WORKSHOP_DIR, { recursive: true });
const workshop = [];
console.log('创意工坊：');
try {
  await sleep(800);
  const listPage = await getRetry(`https://steamcommunity.com/profiles/${PROFILE_ID}/myworkshopfiles/?appid=730&numperpage=30`);
  const items = listPage.body.split('class="workshopItem"').slice(1);
  console.log(`  列表 ${items.length} 个条目`);

  for (const block of items) {
    const id = block.match(/data-publishedfileid="(\d+)"/)?.[1];
    if (!id) continue;

    let meta = {};
    const hover = block.match(/SharedFileBindMouseHover\(\s*"sharedfile_\d+"\s*,\s*false\s*,\s*(\{[\s\S]*?\})\s*\)/);
    if (hover) {
      try { meta = JSON.parse(hover[1]); } catch {}
    }

    const old = previousItems.get(id) ?? {};
    let title = (meta.title || block.match(/class="workshopItemTitle ellipsis">([^<]+)</)?.[1] || old.title || '').trim();
    let description = (meta.description || old.description || '').trim();
    let role = old.role ?? (meta.user_subscribed || meta.user_favorited ? 'contributor' : 'author');
    let subs = old.subs ?? 0;
    let favorites = old.favorites ?? 0;
    let views = old.views ?? 0;
    let cover = old.cover ?? '';

    try {
      await sleep(1_200);
      const detail = await getRetry(`https://steamcommunity.com/sharedfiles/filedetails/?id=${id}`);
      if (detail.status === 200 && detail.body.includes('stats_table')) {
        const creator = detail.body.match(/<div class="creatorsBlock">[\s\S]{0,600}?steamcommunity\.com\/profiles\/(\d+)/)?.[1] ?? '';
        if (creator) role = creator === PROFILE_ID ? 'author' : 'contributor';
        const stats = (detail.body.match(/class="stats_table"[\s\S]*?<\/table>/)?.[0] ?? '').replace(/<[^>]+>/g, ' ');
        const num = (label) => Number((stats.match(new RegExp(`([\\d,]+)\\s*${label}`))?.[1] ?? '0').replace(/,/g, ''));
        subs = num('当前订阅者');
        favorites = num('当前收藏人数');
        views = num('不重复访客数');

        const preview = detail.body.match(/class="workshopItemPreviewImageEnlargeable"[^>]*src="([^"]+)"/)?.[1] ?? '';
        if (preview) {
          const base = preview.replace(/&amp;/g, '&').split('?')[0];
          try {
            const image = await getRetry(`${base}?imw=640&imh=360&ima=fit&impolicy=Letterbox`, { binary: true }, 2);
            if (image.status === 200 && image.body.length > 2_000) {
              await writeFile(path.join(WORKSHOP_DIR, `${id}.jpg`), image.body);
              cover = `/images/workshop/${id}.jpg`;
            }
          } catch {}
        }
      } else {
        console.log(`  ${title || id} 详情页 ${detail.status}，保留上次数据`);
      }
    } catch (error) {
      console.log(`  ${title || id} 详情页失败（${error.message}），保留上次数据`);
    }

    workshop.push({
      id,
      title,
      description: description.slice(0, 80),
      cover: cover || '/images/dream.webp',
      role,
      subs,
      favorites,
      views,
      url: `https://steamcommunity.com/sharedfiles/filedetails/?id=${id}`,
    });
    console.log(`  [${role === 'author' ? '作者' : '参与'}] ${title || id}  ${subs} 订阅 / ${favorites} 收藏 / ${views} 访客`);
  }
} catch (error) {
  console.log(`  工坊列表失败：${error.message}`);
}

const snapshot = {
  name,
  avatar: avatar || '/images/avatar.jpg',
  state,
  level,
  url: profileUrl,
  recent: recent.length ? recent : previous.recent ?? [],
  workshop: workshop.length ? workshop : previous.workshop ?? [],
  updatedAt: new Date().toISOString(),
};

await writeFile(DATA, JSON.stringify(snapshot, null, 2) + '\n', 'utf8');
const authored = snapshot.workshop.filter((item) => item.role === 'author').length;
console.log(`已写入 data/steam.json：${name} · ${state} · LV${level} · 最近 ${snapshot.recent.length} 款 · 工坊 ${snapshot.workshop.length} 项（作者 ${authored}）`);
