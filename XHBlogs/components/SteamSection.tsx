import { ArrowUpRight, Gamepad2, Map } from 'lucide-react';
import profile from '../data/steam.json';

// steamcommunity.com is not reachable from the Worker, so the profile, the recently
// played games and the workshop items are snapshotted into data/steam.json by
// `npm run sync:steam`.
const STATE: Record<string, string> = { online: '在线', offline: '离线', busy: '忙碌', away: '离开', snooze: '打盹' };

function hours(value: number): string {
  return value.toLocaleString('zh-CN');
}

export default function SteamSection() {
  if (!profile.url) return null;

  const cs2 = profile.recent.find((game) => game.appid === '730');

  return (
    <section className="steam-section cm-section" id="steam" aria-labelledby="steam-title">
      <div className="section-topline"><span>CHAPTER 05 / STEAM</span><span>PLAYER TWO, READY.</span></div>
      <div className="section-heading">
        <div>
          <span className="section-kicker">离开键盘之后，还在同一个世界。</span>
          <h2 id="steam-title">在 Steam<span>相遇</span></h2>
        </div>
        <a className="text-link" href={profile.url} target="_blank" rel="noopener noreferrer">个人资料 <ArrowUpRight size={17} /></a>
      </div>

      <div className="steam-board">
        <a className="steam-profile" href={profile.url} target="_blank" rel="noopener noreferrer" aria-label={`${profile.name} 的 Steam 资料`}>
          <img className="steam-avatar" src={profile.avatar} alt="" loading="lazy" />

          <div className="steam-meta">
            <b>
              {profile.name}
              <em>STEAM{profile.level ? ` · LV${profile.level}` : ''}</em>
              <span className={`steam-state steam-state-${profile.state}`}>{STATE[profile.state] ?? profile.state}</span>
            </b>
            <p>
              {cs2 ? `Counter-Strike 2 累计 ${hours(cs2.hours)} 小时` : '最近没有公开的游玩记录'}
              {profile.recent.length > 1 ? `，也常回 ${profile.recent[1].name}` : ''}。
            </p>
          </div>

          <div className="steam-stats">
            <div><b>{hours(cs2?.hours ?? 0)}</b><span>CS2 小时</span></div>
            <div><b>{profile.workshop.length}</b><span>工坊作品</span></div>
            <div><b>{hours(profile.recent.reduce((sum, game) => sum + game.hours, 0))}</b><span>近期时长</span></div>
          </div>

          <span className="steam-go">
            <Gamepad2 size={14} strokeWidth={1.4} />
            查看资料
            <ArrowUpRight size={16} />
          </span>
        </a>

        {profile.recent.length > 0 && (
          <div className="steam-games">
            {profile.recent.map((game) => (
              <a key={game.appid} className="steam-game" href={game.url} target="_blank" rel="noopener noreferrer">
                <span className="steam-game-cover">
                  <img src={game.capsule} alt={game.name} loading="lazy" />
                </span>
                <b>{game.name}</b>
                <span className="steam-game-meta">{hours(game.hours)} 小时{game.last ? ` · ${game.last}` : ''}</span>
              </a>
            ))}
          </div>
        )}
      </div>

      {profile.workshop.length > 0 && (
        <div className="steam-workshop">
          <div className="steam-workshop-head">
            <span><Map size={15} strokeWidth={1.4} /> CS2 创意工坊</span>
            <span>{profile.workshop.length} 项 · 地图与服务器资源</span>
          </div>
          <div className="steam-workshop-grid">
            {profile.workshop.map((item) => (
              <a key={item.id} className="steam-workshop-item" href={item.url} target="_blank" rel="noopener noreferrer">
                <span className="steam-workshop-cover">
                  <img src={item.cover} alt={item.title} loading="lazy" />
                  <span className="steam-workshop-badges">
                    <em className={item.role === 'author' ? 'is-author' : ''}>{item.role === 'author' ? '作者' : '参与'}</em>
                    {item.tag && <span className="steam-workshop-tag">{item.tag}</span>}
                  </span>
                </span>
                <b>{item.title}</b>
                <span className="steam-workshop-meta">{hours(item.subs)} 订阅 · {hours(item.views)} 访客</span>
              </a>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
