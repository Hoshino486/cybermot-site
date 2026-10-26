'use client';

import { useEffect, useState } from 'react';
import { ArrowUpRight, Tv } from 'lucide-react';
import { siteConfig } from '../siteConfig';

type Profile = {
  name: string;
  face: string;
  sign: string;
  level: number;
  fans: number;
  videos: number;
  likes: number;
  url: string;
};

const FALLBACK: Profile = {
  name: siteConfig.authorName,
  face: siteConfig.avatarUrl,
  sign: '',
  level: 0,
  fans: 0,
  videos: 0,
  likes: 0,
  url: siteConfig.bilibiliUid ? `https://space.bilibili.com/${siteConfig.bilibiliUid}` : '',
};

function compact(value: number): string {
  if (value >= 10000) return (value / 10000).toFixed(1).replace(/\.0$/, '') + ' 万';
  return String(value);
}

export default function BilibiliCard() {
  const [profile, setProfile] = useState<Profile>(FALLBACK);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const abort = new AbortController();
    fetch('/api/bilibili', { signal: abort.signal })
      .then((response) => (response.ok ? response.json() : Promise.reject(new Error('unavailable'))))
      .then((data: Profile) => {
        if (!data?.name) return;
        setProfile({ ...FALLBACK, ...data, face: data.face || FALLBACK.face });
        setReady(true);
      })
      .catch(() => {});
    return () => abort.abort();
  }, []);

  if (!FALLBACK.url) return null;

  return (
    <a className="bilibili-card" href={profile.url || FALLBACK.url} target="_blank" rel="noopener noreferrer" aria-label="在 B 站查看赛博刹那">
      <span className="bilibili-avatar">
        {/* B 站头像会拒绝站外 Referer */}
        <img src={profile.face} alt="" loading="lazy" referrerPolicy="no-referrer" />
      </span>

      <div className="bilibili-meta">
        <b>
          {profile.name}
          <em>BILIBILI{profile.level ? ` · LV${profile.level}` : ''}</em>
        </b>
        <p>{profile.sign || '在 B 站，也在别处，记录一点正在发生的事。'}</p>
      </div>

      {ready && (
        <div className="bilibili-stats">
          <div><b>{compact(profile.fans)}</b><span>粉丝</span></div>
          <div><b>{compact(profile.videos)}</b><span>视频</span></div>
          <div><b>{compact(profile.likes)}</b><span>获赞</span></div>
        </div>
      )}

      <span className="bilibili-go">
        <Tv size={14} strokeWidth={1.4} />
        去 B 站
        <ArrowUpRight size={16} />
      </span>
    </a>
  );
}
