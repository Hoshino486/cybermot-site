import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { siteConfig } from '../../../siteConfig';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type CommentRow = { id: number; name: string; seed: number; body: string; created_at: number; author: number };
type Result<T> = { results?: T[]; meta?: { last_row_id?: number } };
type Statement = {
  bind(...values: unknown[]): Statement;
  all<T>(): Promise<Result<T>>;
  first<T>(): Promise<T | null>;
  run(): Promise<Result<never>>;
};
type Database = { prepare(sql: string): Statement };
type Bindings = { COMMENTS_DB?: Database; AUTHOR_KEY?: string };

const MAX_BODY = 500;
const MAX_NAME = 16;
const PAGE_LIMIT = 200;
const BURST_WINDOW_MS = 60_000;
const BURST_LIMIT = 3;

// Created on first request: the API token used for deployment only has D1 read access,
// while the Worker itself is allowed to run DDL against its own database.
let schemaReady: Promise<void> | null = null;

function bindings(): Bindings {
  const { env } = getCloudflareContext();
  return env as Bindings;
}

function database(): Database {
  const db = bindings().COMMENTS_DB;
  if (!db) throw new Error('COMMENTS_DB binding is missing');
  return db;
}

function ensureSchema(db: Database) {
  if (!schemaReady) {
    schemaReady = (async () => {
      await db
        .prepare(
          `CREATE TABLE IF NOT EXISTS comments (
             id INTEGER PRIMARY KEY AUTOINCREMENT,
             page TEXT NOT NULL,
             name TEXT NOT NULL,
             seed INTEGER NOT NULL,
             body TEXT NOT NULL,
             created_at INTEGER NOT NULL,
             ip_hash TEXT,
             approved INTEGER NOT NULL DEFAULT 1,
             author INTEGER NOT NULL DEFAULT 0
           )`,
        )
        .run();
      const columns = await db.prepare('PRAGMA table_info(comments)').all<{ name: string }>();
      if (!(columns.results ?? []).some((column) => column.name === 'author')) {
        await db.prepare('ALTER TABLE comments ADD COLUMN author INTEGER NOT NULL DEFAULT 0').run();
      }
      await db.prepare('CREATE INDEX IF NOT EXISTS idx_comments_page ON comments (page, approved, created_at)').run();
      await db.prepare('CREATE INDEX IF NOT EXISTS idx_comments_ip ON comments (ip_hash, created_at)').run();
    })().catch((error: unknown) => {
      schemaReady = null;
      throw error;
    });
  }
  return schemaReady;
}

function normalizePage(raw: string | null): string {
  const value = (raw ?? '/').split('?')[0].split('#')[0].trim();
  if (!value.startsWith('/')) return '/';
  return value.slice(0, 120) || '/';
}

async function hashIp(value: string): Promise<string> {
  const bytes = new TextEncoder().encode('cybermot-comments:' + value);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('').slice(0, 32);
}

function present(row: CommentRow) {
  return {
    id: String(row.id),
    name: row.name,
    seed: row.seed,
    body: row.body,
    createdAt: row.created_at,
    author: row.author === 1,
  };
}

export async function GET(request: NextRequest) {
  try {
    const db = database();
    await ensureSchema(db);
    const page = normalizePage(request.nextUrl.searchParams.get('page'));
    const { results } = await db
      .prepare('SELECT id, name, seed, body, created_at, author FROM comments WHERE page = ? AND approved = 1 ORDER BY created_at DESC LIMIT ?')
      .bind(page, PAGE_LIMIT)
      .all<CommentRow>();
    return NextResponse.json(
      { page, authorMode: Boolean(bindings().AUTHOR_KEY), comments: (results ?? []).map(present) },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch {
    return NextResponse.json({ error: '评论暂时加载不出来，稍后再试。' }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
  }
}

export async function POST(request: NextRequest) {
  try {
    const db = database();
    await ensureSchema(db);

    const payload = (await request.json().catch(() => null)) as
      | { page?: unknown; name?: unknown; body?: unknown; seed?: unknown; key?: unknown }
      | null;
    if (!payload) return NextResponse.json({ error: '请求格式不对。' }, { status: 400 });

    const page = normalizePage(typeof payload.page === 'string' ? payload.page : null);
    const body = String(payload.body ?? '').replace(/\r\n/g, '\n').trim();
    if (!body) return NextResponse.json({ error: '还没有写内容。' }, { status: 400 });
    if (body.length > MAX_BODY) return NextResponse.json({ error: `内容最多 ${MAX_BODY} 个字。` }, { status: 400 });

    // The author may sign with their real name and avatar instead of the virtual one.
    const authorKey = bindings().AUTHOR_KEY;
    const suppliedKey = typeof payload.key === 'string' ? payload.key : '';
    const isAuthor = Boolean(authorKey) && suppliedKey.length > 0 && suppliedKey === authorKey;
    if (suppliedKey.length > 0 && !isAuthor) {
      return NextResponse.json({ error: '作者密钥不正确。' }, { status: 403 });
    }

    const rawName = String(payload.name ?? '').trim().slice(0, MAX_NAME);
    const name = isAuthor ? siteConfig.authorName : rawName;
    if (!name) return NextResponse.json({ error: '还没有昵称。' }, { status: 400 });

    const seedValue = Number(payload.seed);
    const seed = Number.isFinite(seedValue) ? Math.abs(Math.trunc(seedValue)) % 100000 : 0;

    const forwarded = request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for') || 'local';
    const ipHash = await hashIp(forwarded);
    const since = Date.now() - BURST_WINDOW_MS;
    const recent = await db
      .prepare('SELECT COUNT(*) AS total FROM comments WHERE ip_hash = ? AND created_at > ?')
      .bind(ipHash, since)
      .first<{ total: number }>();
    if ((recent?.total ?? 0) >= BURST_LIMIT) {
      return NextResponse.json({ error: '发得有点快，歇一会儿再发吧。' }, { status: 429 });
    }

    const createdAt = Date.now();
    const inserted = await db
      .prepare('INSERT INTO comments (page, name, seed, body, created_at, ip_hash, approved, author) VALUES (?, ?, ?, ?, ?, ?, 1, ?)')
      .bind(page, name, seed, body, createdAt, ipHash, isAuthor ? 1 : 0)
      .run();

    const id = inserted.meta?.last_row_id ?? 0;
    return NextResponse.json(
      { comment: { id: String(id), name, seed, body, createdAt, author: isAuthor } },
      { status: 201, headers: { 'Cache-Control': 'no-store' } },
    );
  } catch {
    return NextResponse.json({ error: '评论没有送达，稍后再试一次。' }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
  }
}
