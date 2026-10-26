import { NextRequest, NextResponse } from 'next/server';
import { siteConfig } from '../../../siteConfig';
export const runtime = 'nodejs';
const headers = { Referer: 'https://music.163.com/', 'User-Agent': 'Mozilla/5.0' };
type RawSong = { id: number; name?: string; artists?: {name: string}[]; ar?: {name: string}[]; album?: {picUrl?: string}; al?: {picUrl?: string}; duration?: number; dt?: number };
async function request(path: string) {
  const response = await fetch('https://music.163.com' + path, { headers, signal: AbortSignal.timeout(10000), next: { revalidate: 300 } });
  if (!response.ok) throw new Error('NetEase unavailable');
  return response.json();
}
function normalize(song: RawSong) {
  return { id: String(song.id), title: song.name || '未命名歌曲', artist: (song.ar || song.artists || []).map(item => item.name).join(' / ') || '未知歌手',
    cover: (song.al?.picUrl || song.album?.picUrl || siteConfig.avatarUrl).replace(/^http:/, 'https:'),
    duration: (song.dt || song.duration || 0) / 1000, src: '/api/music/stream?id=' + song.id };
}
export async function GET(requestInfo: NextRequest) {
  try {
    const lyric = requestInfo.nextUrl.searchParams.get('lyric');
    if (lyric !== null) {
      if (!/^\d{1,20}$/.test(lyric)) return NextResponse.json({error: 'Invalid song ID'}, {status: 400});
      const data = await request('/api/song/lyric?id=' + lyric + '&lv=-1&kv=-1&tv=-1');
      return NextResponse.json({ lyric: data.lrc?.lyric || '' }, { headers: { 'Cache-Control': 'public, max-age=3600' } });
    }
    // Keep the upstream single-song API usable by the original optional music card.
    const ids = requestInfo.nextUrl.searchParams.get('ids');
    if (ids !== null) {
      if (!/^\d{1,20}(,\d{1,20}){0,49}$/.test(ids)) return NextResponse.json({error: 'Invalid song IDs'}, {status: 400});
      const data = await request('/api/song/detail?ids=' + encodeURIComponent('[' + ids + ']'));
      return NextResponse.json((data.songs || []).map((song: RawSong) => { const item = normalize(song); return {...item, name: item.title, url: item.src}; }));
    }
    const playlistId = String(siteConfig.musicPlaylistId);
    if (!/^\d{1,20}$/.test(playlistId)) return NextResponse.json({error:'Playlist is not configured'}, {status: 400});
    const data = await request('/api/v6/playlist/detail?id=' + playlistId + '&n=1000');
    const list = data.playlist;
    if (data.code !== 200 || !list) return NextResponse.json({error:'Public playlist unavailable'}, {status: 502});
    const songs: RawSong[] = list.tracks || [];
    const existing = new Set(songs.map(song => song.id));
    const missing: number[] = (list.trackIds || []).map((item: {id:number}) => item.id).filter((id:number) => !existing.has(id)).slice(0, 1000);
    for (let start = 0; start < missing.length; start += 100) {
      const details = await request('/api/song/detail?ids=' + encodeURIComponent(JSON.stringify(missing.slice(start, start + 100))));
      songs.push(...(details.songs || []));
    }
    const byId = new Map(songs.map(song => [song.id, song]));
    const ordered: RawSong[] = list.trackIds?.length ? list.trackIds.map((item: {id:number}) => byId.get(item.id)).filter(Boolean) : songs;
    return NextResponse.json({id: playlistId, name: list.name || siteConfig.musicPlaylistTitle, tracks: ordered.map(normalize), source: 'netease', total: list.trackCount || ordered.length},
      {headers:{'Cache-Control':'public, max-age=300, stale-while-revalidate=600'}});
  } catch {
    return NextResponse.json({error:'网易云暂时连接不上，请稍后重试。'}, {status: 502});
  }
}
