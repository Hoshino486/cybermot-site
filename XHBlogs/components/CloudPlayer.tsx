'use client';
import { Headphones, Play } from 'lucide-react';
import { openMusicPlayer } from './NeteasePlayer';
export default function CloudPlayer() {
  return <button className="cloud-player-card h-full" onClick={openMusicPlayer}>
    <span><Headphones size={17} className="inline mr-3"/> NETEASE CLOUD MUSIC</span>
    <div><h2>给此刻，配一段旋律。</h2><p>赛博刹那的网易云歌单 · 点击打开播放器</p></div>
    <span className="listen-button"><Play size={13}/> 打开随身听</span>
  </button>;
}
