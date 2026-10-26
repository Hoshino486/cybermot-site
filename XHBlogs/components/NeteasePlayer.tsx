'use client';
import { useEffect, useRef, useState } from 'react';
import { ListMusic, Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, ExternalLink, ChevronDown, Repeat, Repeat1, Shuffle, RotateCw } from 'lucide-react';
import { siteConfig } from '../siteConfig';
import { useMusic } from './MusicProvider';
import './music-player.css';
export function openMusicPlayer() { window.dispatchEvent(new Event('cybermot:music')); }
export function formatMusicTime(value: number) { const seconds = Math.max(0, Math.floor(Number.isFinite(value) ? value : 0)); return Math.floor(seconds / 60) + ':' + String(seconds % 60).padStart(2, '0'); }
export default function NeteasePlayer() {
  const music = useMusic();
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const show = () => setOpen(true);
    const key = (event: KeyboardEvent) => { if (event.key === 'Escape' && open) { setOpen(false); trigger.current?.focus(); } };
    window.addEventListener('cybermot:music', show); window.addEventListener('keydown', key);
    return () => { window.removeEventListener('cybermot:music', show); window.removeEventListener('keydown', key); };
  }, [open]);
  const modeText = music.playMode === 'loop' ? '列表循环' : music.playMode === 'single' ? '单曲循环' : '随机播放';
  const statusText = music.soundLocked ? '轻触任意处开启声音' : music.status === 'blocked' ? '轻触页面即可播放' : music.status === 'error' ? '音源暂不可用' : music.status === 'loading' ? '正在连接音乐…' : music.isPlaying ? music.currentSong?.artist : '已暂停 · 随时继续';
  return <aside className={'cm-audio ' + (open ? 'cm-audio-expanded' : '')} aria-label="全站音乐播放器" data-music-status={music.status}>
    {open && <section id="cm-playlist" className="cm-audio-panel" aria-label="网易云歌单">
      <div className="cm-audio-panel-heading"><span><ListMusic size={18}/> {music.playlistTitle}</span><button aria-label="收起歌单，继续播放" onClick={() => {setOpen(false); trigger.current?.focus();}}><ChevronDown size={18}/></button></div>
      <p className="cm-audio-caption">给此刻，配一段旋律。<span>{music.playlist.length} 首</span></p>
      <ol className="cm-track-list">{music.playlist.map((song, i) => <li key={song.id}><button data-music-control aria-current={i === music.currentIndex ? 'true' : undefined} onClick={() => music.playSong(i)} aria-label={'播放 ' + song.title}>
        <span className="cm-track-number">{String(i + 1).padStart(2, '0')}</span><img src={song.cover} alt="" loading="lazy"/><span><b>{song.title}</b><small>{song.artist}</small></span><span className="cm-track-length">{formatMusicTime(song.duration || 0)}</span>
      </button></li>)}</ol>
      {music.status === 'error' && <div className="cm-audio-error" role="status"><p>{music.errorMessage}</p><button data-music-control onClick={music.retry}><RotateCw size={14}/> 重新连接</button></div>}
      <p className="cm-audio-lyric">{music.currentLyric}</p>
      <div className="cm-audio-progress"><span>{formatMusicTime(music.currentTime)}</span><input data-music-control aria-label="音乐播放进度" type="range" min="0" max="100" step=".1" value={music.progress} onChange={music.handleSeek} disabled={!music.duration}/><span>{formatMusicTime(music.duration)}</span></div>
      <div className="cm-audio-options"><button data-music-control onClick={music.togglePlayMode} aria-label={'播放模式：' + modeText}>{music.playMode === 'random' ? <Shuffle size={16}/> : music.playMode === 'single' ? <Repeat1 size={16}/> : <Repeat size={16}/>} {modeText}</button><a href={'https://music.163.com/playlist?id=' + siteConfig.musicPlaylistId} target="_blank" rel="noopener noreferrer">网易云歌单 <ExternalLink size={13}/></a></div>
    </section>}
    <div className="cm-audio-mini">
      <button ref={trigger} className="cm-audio-cover" onClick={() => setOpen(!open)} aria-expanded={open} aria-controls="cm-playlist" aria-label={open ? '收起音乐歌单' : '展开音乐歌单'}>
        <img src={music.currentSong?.cover || siteConfig.avatarUrl} alt=""/><span><ListMusic size={16}/></span>
      </button>
      <div className="cm-audio-info"><b>{music.currentSong?.title || '刹那的随身听'}</b><small title={statusText || ''}>{statusText}</small></div>
      <div className="cm-audio-controls" data-music-control><button aria-label="上一曲" onClick={music.prevSong} disabled={!music.playlist.length}><SkipBack size={17}/></button><button className="cm-audio-play" aria-label={music.isPlaying ? '暂停音乐' : '播放音乐'} onClick={music.status === 'error' ? music.retry : music.togglePlay}>{music.isPlaying ? <Pause size={17} fill="currentColor"/> : <Play size={17} fill="currentColor"/>}</button><button aria-label="下一曲" onClick={music.nextSong} disabled={!music.playlist.length}><SkipForward size={17}/></button></div>
    </div>
    <div className="cm-audio-bottom"><span className={'cm-equalizer ' + (music.isPlaying ? 'is-playing' : '')} aria-hidden="true"><i/><i/><i/><i/></span><small>NETEASE CLOUD MUSIC</small><div className="cm-audio-volume" data-music-control><button onClick={music.toggleMute} aria-label={music.isMuted ? '取消静音' : '静音音乐'}>{music.isMuted || music.volume === 0 ? <VolumeX size={14}/> : <Volume2 size={14}/>}</button><input aria-label="音乐音量" type="range" min="0" max="1" step=".01" value={music.isMuted ? 0 : music.volume} onChange={event => music.setVolume(Number(event.target.value))}/></div></div>
    <div className="cm-mini-progress" style={{width: music.progress + '%'}} aria-hidden="true"/>
  </aside>;
}
