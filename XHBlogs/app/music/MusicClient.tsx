'use client';
import { Headphones, ArrowUpRight, Play, Pause, ExternalLink, RotateCw } from 'lucide-react';
import Navbar from '../../components/Navbar';
import { openMusicPlayer, formatMusicTime } from '../../components/NeteasePlayer';
import { useMusic } from '../../components/MusicProvider';
import { siteConfig } from '../../siteConfig';
export default function MusicClient() {
  const music = useMusic();
  return <><Navbar/><main className="music-page"><span className="section-kicker">MY SOUNDTRACK / NETEASE CLOUD MUSIC</span><h1>听见，另一个世界。</h1><p>有些心情，用一首歌就能表达。<br/>让喜欢的旋律，陪你逛过这个小小的世界。</p>
    <button className="music-feature" onClick={openMusicPlayer}><div className="music-feature-top"><Headphones size={18}/><span>CYBERMOT'S PLAYLIST</span><ArrowUpRight size={20}/></div><div className="vinyl"><div style={{animationPlayState:music.isPlaying?'running':'paused'}}><img src={music.currentSong?.cover || siteConfig.avatarUrl} alt=""/><i/></div></div><div className="music-feature-text"><span>网易云音乐 / MUSIC COLLECTION</span><h3>{music.currentSong?.title || '让时间慢一点，'}<br/>{music.currentSong ? '此刻，与你同频。' : '让音乐响起来。'}</h3><span className="listen-button"><Headphones size={13}/> 查看随身听</span></div></button>
    <section className="cm-music-library" aria-label="音乐歌单"><div className="cm-library-heading"><div><h2>{music.playlistTitle}</h2><p>网易云公开歌单 · {music.playlist.length} 首歌曲</p></div><button data-music-control onClick={music.status==='error'?music.retry:music.togglePlay}>{music.status==='error'?<RotateCw size={16}/>:music.isPlaying?<Pause size={16}/>:<Play size={16}/>} {music.status==='error'?'重新连接':music.isPlaying?'暂停播放':'播放音乐'}</button></div>
    <ol className="cm-library-tracks">{music.playlist.map((song,index)=><li key={song.id}><button data-music-control onClick={()=>music.playSong(index)} aria-label={'播放 '+song.title} aria-current={index===music.currentIndex?'true':undefined}><img src={song.cover} alt=""/><span><b>{song.title}</b><small>{song.artist}</small></span><em>{formatMusicTime(song.duration||0)}</em>{index===music.currentIndex&&music.isPlaying?<Pause size={16}/>:<Play size={16}/>}</button></li>)}</ol>
    {music.status==='error'&&<p className="cm-library-empty" role="status">{music.errorMessage}</p>}
    <p className="cm-music-status">{music.status==='blocked'?'浏览器正在等待一次页面交互，轻触页面即可开始播放。':music.isPlaying?'正在播放 · 切换页面，音乐也会一直陪着你。':music.status==='loading'?'正在连接网易云…':'音乐会在进入网站时尝试自动播放，也可以在设置中关闭。'}</p></section>
    <a className="text-link mt-6" href={'https://music.163.com/playlist?id='+siteConfig.musicPlaylistId} target="_blank" rel="noopener noreferrer">在网易云打开歌单 <ExternalLink size={15}/></a></main></>;
}
