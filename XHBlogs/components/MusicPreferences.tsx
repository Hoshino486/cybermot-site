'use client';
import { Play, Pause, Volume2 } from 'lucide-react';
import { useMusic } from './MusicProvider';

export default function MusicPreferences() {
  const music = useMusic();
  const status = music.status === 'blocked' ? '浏览器正在等待一次点击，轻触页面即可继续。'
    : music.status === 'error' ? music.errorMessage
    : music.status === 'loading' ? '正在连接网易云音乐…'
    : music.isPlaying ? '正在播放 · ' + (music.currentSong?.title || '') : '音乐已暂停';
  return <div data-music-preference className="cm-music-preferences">
    <div className="settings-field"><div><strong>进入网站时自动播放</strong><p className="settings-note">音乐会陪伴你浏览所有页面；浏览器拦截时，首次轻触页面后继续。</p></div><button className="preference-button" type="button" role="switch" aria-checked={music.autoplay} aria-label="进入网站时自动播放音乐" onClick={() => music.setAutoplay(!music.autoplay)}>{music.autoplay ? '已开启' : '已关闭'}</button></div>
    <div className="settings-field"><label htmlFor="music-preference-volume"><Volume2 size={16} style={{display:'inline', marginRight:8}}/>音乐音量 · {Math.round(music.volume * 100)}%</label><input id="music-preference-volume" aria-label="设置音乐音量" type="range" min="0" max="1" step=".01" value={music.volume} onChange={event => music.setVolume(Number(event.target.value))} style={{accentColor:'#7b81c9',maxWidth:200}}/></div>
    <div className="settings-field"><p className="settings-note" role="status">{status}</p><button className="preference-button" onClick={music.status === 'error' ? music.retry : music.togglePlay}>{music.isPlaying ? <Pause size={15}/> : <Play size={15}/>} {music.status === 'error' ? '重新连接音乐' : music.isPlaying ? '暂停音乐' : '播放音乐'}</button></div>
  </div>;
}
