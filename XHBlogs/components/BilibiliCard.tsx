import { ArrowUpRight, Tv } from 'lucide-react';
import profile from '../data/bilibili.json';

// Bilibili blocks data-centre and cross-origin requests, so the profile is snapshotted
// into data/bilibili.json by `npm run sync:bilibili` and rendered from the commit.
function compact(value: number): string {
  if (value >= 10000) return (value / 10000).toFixed(1).replace(/\.0$/, '') + ' 万';
  return String(value);
}

export default function BilibiliCard() {
  if (!profile.url) return null;

  return (
    <a className="bilibili-card" href={profile.url} target="_blank" rel="noopener noreferrer" aria-label={`在 B 站关注${profile.name}`}>
      <span className="bilibili-avatar">
        <img src={profile.avatar} alt="" loading="lazy" />
      </span>

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
        去 B 站
        <ArrowUpRight size={16} />
      </span>
    </a>
  );
}
