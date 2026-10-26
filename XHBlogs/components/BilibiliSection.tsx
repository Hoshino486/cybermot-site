import { ArrowUpRight, PlayCircle, Tv } from 'lucide-react';
import profile from '../data/bilibili.json';
import videos from '../data/bilibili-videos.json';

// Bilibili blocks data-centre and cross-origin requests, so the profile and the listed
// videos are snapshotted into data/*.json by `npm run sync:bilibili`.
function compact(value: number): string {
  if (value >= 10000) return (value / 10000).toFixed(1).replace(/\.0$/, '') + ' 万';
  return String(value);
}

function duration(seconds: number): string {
  const total = Math.max(0, Math.round(seconds));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}

export default function BilibiliSection() {
  if (!profile.url) return null;

  return (
    <section className="bilibili-section cm-section" id="bilibili" aria-labelledby="bilibili-title">
      <div className="section-topline"><span>CHAPTER 04 / BILIBILI</span><span>ELSEWHERE, ON VIDEO.</span></div>
      <div className="section-heading">
        <div>
          <span className="section-kicker">镜头之外，还有另一面。</span>
          <h2 id="bilibili-title">在 B 站<span>遇见</span></h2>
        </div>
        <a className="text-link" href={profile.url} target="_blank" rel="noopener noreferrer">全部投稿 <ArrowUpRight size={17} /></a>
      </div>

      <div className="bilibili-board">
        <a className="bilibili-profile" href={profile.url} target="_blank" rel="noopener noreferrer" aria-label={`在 B 站关注${profile.name}`}>
          <img className="bilibili-avatar" src={profile.avatar} alt="" loading="lazy" />

          <div className="bilibili-meta">
            <b>
              {profile.name}
              <em>BILIBILI{profile.level ? ` · LV${profile.level}` : ''}</em>
            </b>
            <p>{profile.sign || '在 B 站，也在别处，记录一点正在发生的事。'}</p>
          </div>

          <div className="bilibili-stats">
            <div><b>{compact(profile.fans)}</b><span>粉丝</span></div>
            <div><b>{compact(profile.videos)}</b><span>视频</span></div>
            <div><b>{compact(profile.likes)}</b><span>获赞</span></div>
          </div>

          <span className="bilibili-go">
            <Tv size={14} strokeWidth={1.4} />
            关注
            <ArrowUpRight size={16} />
          </span>
        </a>

        {videos.length > 0 && (
          <div className="bilibili-videos">
            {videos.map((video) => (
              <a key={video.bvid} className="bilibili-video" href={video.url} target="_blank" rel="noopener noreferrer">
                <span className="bilibili-video-cover">
                  <img src={video.cover} alt={video.title} loading="lazy" />
                  <em>{duration(video.duration)}</em>
                  <i><PlayCircle size={22} strokeWidth={1.2} /></i>
                </span>
                <b>{video.title}</b>
                <span className="bilibili-video-meta">{video.date} · {compact(video.views)} 播放 · {compact(video.likes)} 赞</span>
              </a>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
