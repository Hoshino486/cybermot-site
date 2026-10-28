export type CoverFx = 'wave' | 'scan' | 'terminal' | 'grid' | 'shine';

// 按文章内容挑一个封面动态签名：音频是频谱，ZE 是准星扫描，服务器是终端，工具是网格。
export function coverFxFor(post: { slug: string; tags: string[] }): CoverFx {
  const slug = post.slug.toLowerCase();
  const tags = post.tags.join(' ');
  if (slug.includes('soundevent') || tags.includes('音频')) return 'wave';
  if (slug.includes('ze-practice')) return 'scan';
  if (slug.includes('local-ze-server')) return 'terminal';
  if (slug.includes('bomberstudio')) return 'grid';
  if (tags.includes('CS2')) return 'scan';
  if (tags.includes('工具')) return 'grid';
  return 'shine';
}

export function CoverFxLayer({ variant }: { variant: CoverFx }) {
  return (
    <span className="cover-fx" data-fx={variant} aria-hidden="true">
      <span className="fx-corners" />
      {variant === 'wave' && (
        <span className="fx-eq">
          {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
            <i
              key={i}
              style={{ height: `${7 + (i % 4) * 4}px`, animationDelay: `${i * 0.11}s` }}
            />
          ))}
        </span>
      )}
      {variant === 'scan' && (
        <>
          <span className="fx-scan" />
          <span className="fx-reticle"><i /><b /></span>
        </>
      )}
      {variant === 'terminal' && (
        <>
          <span className="fx-scan" />
          <span className="fx-term">
            <span><b>&gt;</b> build addon</span>
            <span className="dim">soundevents_addon.vsndevts</span>
            <span><em>compiling</em><i className="caret" /></span>
          </span>
        </>
      )}
      {variant === 'grid' && <span className="fx-grid" />}
    </span>
  );
}
