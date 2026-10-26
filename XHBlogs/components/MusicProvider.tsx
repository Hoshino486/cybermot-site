'use client';
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ChangeEvent, type ReactNode } from 'react';
import { siteConfig } from '../siteConfig';

type PlayMode = 'loop' | 'single' | 'random';
type MusicStatus = 'loading' | 'ready' | 'playing' | 'paused' | 'blocked' | 'error';
export type MusicSong = { id: string; title: string; artist: string; cover: string; src: string; duration?: number };
type Lyric = { time: number; text: string };
interface MusicContextType {
  playlist: MusicSong[]; playlistTitle: string; currentIndex: number; currentSong: MusicSong | undefined;
  isPlaying: boolean; progress: number; currentTime: number; duration: number; currentLyric: string;
  isLoading: boolean; status: MusicStatus; errorMessage: string; volume: number; isMuted: boolean; playMode: PlayMode;
  soundLocked: boolean;
  autoplay: boolean; setAutoplay: (enabled: boolean) => void; togglePlay: () => void; nextSong: () => void;
  prevSong: () => void; handleSeek: (event: ChangeEvent<HTMLInputElement>) => void; playSong: (index: number) => void;
  setVolume: (value: number) => void; toggleMute: () => void; togglePlayMode: () => void; retry: () => void;
}
const MusicContext = createContext<MusicContextType | null>(null);
const PREFIX = 'cybermot:music:';
function read(key: string, fallback: string) { try { return localStorage.getItem(PREFIX + key) ?? fallback; } catch { return fallback; } }
function save(key: string, value: string) { try { localStorage.setItem(PREFIX + key, value); } catch {} }
function pausedBefore() { try { return sessionStorage.getItem(PREFIX + 'paused') === 'true'; } catch { return false; } }
function savePaused(value: boolean) { try { sessionStorage.setItem(PREFIX + 'paused', String(value)); } catch {} }
// NetEase refuses playback requests coming from overseas IPs (the Worker's egress),
// but the visitor's browser sits in mainland China, so resolve the audio there.
// A src under /music/ is a self-hosted file in public/music and always wins.
function playbackUrl(song: MusicSong) {
  if (song.src.startsWith('/music/')) return song.src;
  return 'https://music.163.com/song/media/outer/url?id=' + song.id + '.mp3';
}
function parseLyrics(value: string): Lyric[] {
  if (value.length > 60000) return [];
  return value.split(/\r?\n/).flatMap(line => {
    const text = line.replace(/\[\d+:\d+(?:\.\d+)?\]/g, '').trim();
    return [...line.matchAll(/\[(\d+):(\d+)(?:\.(\d+))?\]/g)].map(m => ({ time: Number(m[1]) * 60 + Number(m[2]) + Number('0.' + (m[3] || '0')), text }));
  }).filter(line => line.text).sort((a, b) => a.time - b.time);
}
export function MusicProvider({ children }: { children: ReactNode }) {
  const [playlist, setPlaylist] = useState<MusicSong[]>([]);
  const [playlistTitle, setPlaylistTitle] = useState(siteConfig.musicPlaylistTitle);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [status, setStatus] = useState<MusicStatus>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const [volume, setVolumeState] = useState(.45);
  const [isMuted, setIsMuted] = useState(false);
  const [soundLocked, setSoundLocked] = useState(false);
  const [autoplay, setAutoplayState] = useState(true);
  const [playMode, setPlayMode] = useState<PlayMode>('loop');
  const [lyrics, setLyrics] = useState<Lyric[]>([]);
  const [loadVersion, setLoadVersion] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);
  const tracksRef = useRef<MusicSong[]>([]);
  const indexRef = useRef(0);
  const wantedRef = useRef(true);
  const autoplayRef = useRef(true);
  const modeRef = useRef<PlayMode>('loop');
  const failedRef = useRef(new Set<number>());
  const generation = useRef(0);
  const failRef = useRef<() => void>(() => {});
  const selectRef = useRef<(index: number, play: boolean) => void>(() => {});
  const lockedRef = useRef(false);

  const attemptPlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !audio.getAttribute('src') || !wantedRef.current) return;
    const token = generation.current;
    // Keep this call synchronous: a document pointer/key event can unlock real audio.
    const promise = audio.play();
    promise?.catch((error: unknown) => {
      if (token !== generation.current || !wantedRef.current) return;
      const name = error instanceof DOMException ? error.name : '';
      if (name === 'NotAllowedError') {
        // Every browser refuses audible autoplay before the first gesture. Start the
        // track muted instead so the page is already playing, then unmute on the first
        // interaction (pointer/keydown listeners below).
        lockedRef.current = true;
        setSoundLocked(true);
        audio.muted = true;
        setIsMuted(true);
        audio.play()?.catch(() => { setIsPlaying(false); setStatus('blocked'); });
      } else if (name !== 'AbortError') failRef.current();
    });
  }, []);
  const selectSong = useCallback((index: number, play: boolean) => {
    const song = tracksRef.current[index];
    const audio = audioRef.current;
    if (!song || !audio) return;
    generation.current++;
    indexRef.current = index;
    setCurrentIndex(index);
    setCurrentTime(0); setDuration(0); setIsPlaying(false); setErrorMessage('');
    wantedRef.current = play;
    audio.src = playbackUrl(song);
    audio.load();
    setStatus(play ? 'loading' : 'paused');
    if (play) attemptPlay();
  }, [attemptPlay]);
  useEffect(() => { selectRef.current = selectSong; }, [selectSong]);
  useEffect(() => {
    failRef.current = () => {
      if (!tracksRef.current.length || failedRef.current.has(indexRef.current)) return;
      failedRef.current.add(indexRef.current);
      const next = tracksRef.current.findIndex((_, i) => !failedRef.current.has(i));
      if (next >= 0 && wantedRef.current) selectRef.current(next, true);
      else {
        wantedRef.current = false;
        setIsPlaying(false); setStatus('error');
        setErrorMessage('这首歌暂时无法播放（可能在版权地区之外或需要会员），可点歌单到网易云收听。');
      }
    };
  }, []);
  useEffect(() => {
    const preferred = read('autoplay', 'true') !== 'false';
    autoplayRef.current = preferred; setAutoplayState(preferred);
    wantedRef.current = preferred && !pausedBefore();
    const stored = Number(read('volume', '.45'));
    const level = Number.isFinite(stored) ? Math.max(0, Math.min(1, stored)) : .45;
    setVolumeState(level);
    const muted = read('muted', 'false') === 'true'; setIsMuted(muted);
    if (audioRef.current) { audioRef.current.volume = level; audioRef.current.muted = muted; }
    const mode = read('mode', 'loop');
    if (mode === 'single' || mode === 'random' || mode === 'loop') { modeRef.current = mode; setPlayMode(mode); }
    const unlock = (event: Event) => {
      const audio = audioRef.current;
      if (!audio) return;
      // The first interaction restores sound no matter where on the page it lands.
      if (lockedRef.current) {
        lockedRef.current = false; setSoundLocked(false);
        audio.muted = false; setIsMuted(false);
        if (audio.paused && wantedRef.current && !audio.error) attemptPlay();
        return;
      }
      if (event.target instanceof Element && event.target.closest('[data-music-control], [data-music-preference]')) return;
      if (wantedRef.current && audio.paused && !audio.error) attemptPlay();
    };
    document.addEventListener('pointerdown', unlock, true);
    document.addEventListener('keydown', unlock, true);
    return () => {
      document.removeEventListener('pointerdown', unlock, true);
      document.removeEventListener('keydown', unlock, true);
      generation.current++;
    };
  }, [attemptPlay]);
  useEffect(() => {
    const abort = new AbortController();
    setStatus('loading');
    fetch('/api/music', { signal: abort.signal }).then(async response => {
      if (!response.ok) throw new Error('歌单暂时连接不上，请稍后重试。');
      const data = await response.json() as { tracks?: MusicSong[]; name?: string };
      if (!Array.isArray(data.tracks) || !data.tracks.length) throw new Error('歌单里暂时没有歌曲。');
      const tracks = data.tracks.filter(song => /^\d+$/.test(song.id) && (song.src.startsWith('/music/') || song.src.startsWith('/api/music/stream?')));
      if (!tracks.length) throw new Error('歌单里暂时没有可播放的歌曲。');
      if (abort.signal.aborted) return;
      tracksRef.current = tracks; setPlaylist(tracks);
      if (data.name) setPlaylistTitle(data.name);
      failedRef.current.clear();
      selectSong(Math.min(indexRef.current, tracks.length - 1), wantedRef.current);
    }).catch((error: unknown) => {
      if (abort.signal.aborted) return;
      setStatus('error'); setIsPlaying(false);
      setErrorMessage(error instanceof Error ? error.message : '歌单加载失败。');
    });
    return () => abort.abort();
  }, [loadVersion, selectSong]);
  const currentSong = playlist[currentIndex];
  useEffect(() => {
    setLyrics([]);
    if (!currentSong) return;
    const abort = new AbortController();
    fetch('/api/music?lyric=' + currentSong.id, { signal: abort.signal }).then(r => r.ok ? r.json() : null).then(data => {
      if (!abort.signal.aborted && typeof data?.lyric === 'string') setLyrics(parseLyrics(data.lyric));
    }).catch(() => {});
    return () => abort.abort();
  }, [currentSong?.id]);
  const pause = useCallback(() => {
    wantedRef.current = false; generation.current++; savePaused(true);
    audioRef.current?.pause(); setIsPlaying(false); setStatus('paused');
  }, []);
  const resume = useCallback(() => {
    savePaused(false); wantedRef.current = true; failedRef.current.clear(); setErrorMessage('');
    if (audioRef.current?.error) selectSong(indexRef.current, true);
    else attemptPlay();
  }, [attemptPlay, selectSong]);
  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (audio && !audio.paused) { pause(); return; }
    if (lockedRef.current) {
      lockedRef.current = false; setSoundLocked(false);
      if (audio) audio.muted = false;
      setIsMuted(false);
    }
    resume();
  }, [pause, resume]);
  const move = useCallback((direction: number) => {
    const count = tracksRef.current.length; if (!count) return;
    const candidate = modeRef.current === 'random' && count > 1
      ? (indexRef.current + 1 + Math.floor(Math.random() * (count - 1))) % count
      : (indexRef.current + direction + count) % count;
    failedRef.current.clear(); savePaused(false); selectSong(candidate, true);
  }, [selectSong]);
  const playSong = useCallback((index: number) => {
    if (!Number.isInteger(index) || index < 0 || index >= tracksRef.current.length) return;
    failedRef.current.clear(); savePaused(false); selectSong(index, true);
  }, [selectSong]);
  const handleSeek = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (audio && Number.isFinite(audio.duration) && audio.duration > 0) {
      audio.currentTime = Math.max(0, Math.min(100, Number(event.target.value))) / 100 * audio.duration;
      setCurrentTime(audio.currentTime);
    }
  }, []);
  const setVolume = useCallback((value: number) => {
    if (!Number.isFinite(value)) return;
    const bounded = Math.max(0, Math.min(1, value));
    setVolumeState(bounded); save('volume', String(bounded));
    if (audioRef.current) audioRef.current.volume = bounded;
    if (bounded > 0) { lockedRef.current = false; setSoundLocked(false); setIsMuted(false); save('muted', 'false'); if (audioRef.current) audioRef.current.muted = false; }
  }, []);
  const toggleMute = useCallback(() => {
    const muted = !audioRef.current?.muted;
    lockedRef.current = false; setSoundLocked(false);
    setIsMuted(muted); save('muted', String(muted));
    if (audioRef.current) audioRef.current.muted = muted;
  }, []);
  const togglePlayMode = useCallback(() => {
    const next: PlayMode = modeRef.current === 'loop' ? 'single' : modeRef.current === 'single' ? 'random' : 'loop';
    modeRef.current = next; setPlayMode(next); save('mode', next);
  }, []);
  const setAutoplay = useCallback((enabled: boolean) => {
    autoplayRef.current = enabled; setAutoplayState(enabled); save('autoplay', String(enabled));
    if (enabled) resume(); else pause();
  }, [pause, resume]);
  const retry = useCallback(() => {
    wantedRef.current = true; savePaused(false); failedRef.current.clear(); setErrorMessage('');
    if (tracksRef.current.length) selectSong(indexRef.current, true); else setLoadVersion(v => v + 1);
  }, [selectSong]);
  const timeUpdate = () => {
    const audio = audioRef.current; if (!audio) return;
    setCurrentTime(audio.currentTime || 0);
    setDuration(Number.isFinite(audio.duration) ? audio.duration : 0);
  };
  useEffect(() => {
    if (!('mediaSession' in navigator) || !currentSong) return;
    navigator.mediaSession.metadata = new MediaMetadata({ title: currentSong.title, artist: currentSong.artist, album: playlistTitle, artwork: [{ src: currentSong.cover }] });
    const handlers: [MediaSessionAction, MediaSessionActionHandler][] = [['play', resume], ['pause', pause], ['nexttrack', () => move(1)], ['previoustrack', () => move(-1)]];
    for (const [action, handler] of handlers) { try { navigator.mediaSession.setActionHandler(action, handler); } catch {} }
    return () => { for (const [action] of handlers) { try { navigator.mediaSession.setActionHandler(action, null); } catch {} } };
  }, [currentSong, playlistTitle, resume, pause, move]);
  const activeLyric = lyrics.filter(line => line.time <= currentTime).at(-1)?.text;
  const currentLyric = activeLyric || (soundLocked ? '已静音播放 · 轻触任意处开启声音' : status === 'blocked' ? '轻触页面，音乐即刻继续' : status === 'error' ? errorMessage : status === 'loading' ? '正在连接音乐…' : '给此刻，配一段旋律。');
  return <MusicContext.Provider value={{ playlist, playlistTitle, currentIndex, currentSong, isPlaying, currentTime, duration,
    progress: duration > 0 ? currentTime / duration * 100 : 0, currentLyric, isLoading: status === 'loading', status, errorMessage,
    soundLocked, volume, isMuted, playMode, autoplay, setAutoplay, togglePlay, nextSong: () => move(1), prevSong: () => move(-1),
    handleSeek, playSong, setVolume, toggleMute, togglePlayMode, retry }}>
    {children}
    <audio ref={audioRef} data-testid="site-audio" preload="auto" onTimeUpdate={timeUpdate} onLoadedMetadata={timeUpdate}
      onPlaying={() => { setIsPlaying(true); setStatus('playing'); setErrorMessage(''); }}
      onPause={() => { setIsPlaying(false); if (!wantedRef.current) setStatus('paused'); }}
      onWaiting={() => { if (wantedRef.current) setStatus('loading'); }}
      onError={() => failRef.current()}
      onEnded={() => { if (modeRef.current === 'single') selectSong(indexRef.current, true); else move(1); }} />
  </MusicContext.Provider>;
}
export function useMusic() { const context = useContext(MusicContext); if (!context) throw new Error('useMusic must be used within MusicProvider'); return context; }
