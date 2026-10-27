'use client';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { ArrowDown, ArrowRight, ArrowUpRight, AudioLines, BookOpen, Camera, ChevronRight, Code2, Compass, ExternalLink, Feather, Headphones, Layers3, MoveUpRight, Orbit, Pause, Play, Radio, Rss, Sparkles } from 'lucide-react';
import Navbar from './Navbar';
import CyberGrid from './CyberGrid';
import BilibiliSection from './BilibiliSection';
import SteamSection from './SteamSection';
import { useSitePreferences } from './SitePreferencesProvider';
import { openMusicPlayer } from './NeteasePlayer';
import { siteConfig } from '../siteConfig';
import type { PostSummary } from '../lib/posts';

const chapters = [{ id: 'home', title: '序章', english: 'PROLOGUE' }, { id: 'journal', title: '记录', english: 'JOURNAL' }, { id: 'universe', title: '回响', english: 'UNIVERSE' }, { id: 'bilibili', title: '频道', english: 'BILIBILI' }, { id: 'steam', title: '游戏', english: 'STEAM' }];
const destinations = [
  { title: '灵感工坊', subtitle: '把想象，变成现实', href: '/projects', icon: Code2, number: '01' },
  { title: '瞬间收藏', subtitle: '那些不想忘记的日常', href: '/moments', icon: Feather, number: '02' },
  { title: '光影相册', subtitle: '用画面，留住时间', href: '/photowall', icon: Camera, number: '03' },
  { title: '灵境漫游', subtitle: '在交互里，发现好奇', href: '/tree', icon: Orbit, number: '04' },
];
const formatDate = (date: string) => date ? date.slice(0, 10).replaceAll('-', '.') : '';

export default function HomeExperience({ posts }: { posts: PostSummary[] }) {
  const root = useRef<HTMLDivElement>(null);
  const railRef = useRef<HTMLDivElement | null>(null);
  const [active, setActive] = useState('home');
  const { scene, setScene, motion, setMotion } = useSitePreferences();
  const [category, setCategory] = useState('全部');
  const tags = ['全部', ...Array.from(new Set(posts.flatMap(post => post.tags.filter(tag => tag !== '示例'))))];
  const visiblePosts = category === '全部' ? posts : posts.filter(post => post.tags.includes(category));
  // 标题故障：位置每次随机，节奏也随机，比固定 CSS 动画更像信号干扰
  useEffect(() => {
    const targets = Array.from(document.querySelectorAll<HTMLElement>('[data-glitch]'));
    if (!targets.length) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let timer = 0;
    let alive = true;
    const randomBand = () => {
      const top = 4 + Math.random() * 68;
      const height = 5 + Math.random() * 13;
      return { top, bottom: Math.max(0, 100 - top - height) };
    };

    const flick = () => {
      if (!alive) return;
      if (!document.documentElement.classList.contains('motion-off')) {
        for (const target of targets) {
          const first = randomBand();
          const second = randomBand();
          target.style.setProperty('--g-top', `${first.top.toFixed(1)}%`);
          target.style.setProperty('--g-bottom', `${first.bottom.toFixed(1)}%`);
          target.style.setProperty('--g2-top', `${second.top.toFixed(1)}%`);
          target.style.setProperty('--g2-bottom', `${second.bottom.toFixed(1)}%`);
          target.style.setProperty('--g-x', `${(Math.random() * 22 - 11).toFixed(1)}px`);
          target.style.setProperty('--g2-x', `${(Math.random() * 22 - 11).toFixed(1)}px`);
          target.classList.add('is-glitching');
        }
        window.setTimeout(() => {
          if (!alive) return;
          for (const target of targets) target.classList.remove('is-glitching');
          // 有时补一下短促的第二闪，像信号没接稳
          if (Math.random() > 0.55) {
            window.setTimeout(() => {
              if (!alive) return;
              for (const target of targets) target.classList.add('is-glitching');
              window.setTimeout(() => {
                for (const target of targets) target.classList.remove('is-glitching');
              }, 60);
            }, 70);
          }
        }, 80 + Math.random() * 70);
      }
      timer = window.setTimeout(flick, 480 + Math.random() * 620);
    };

    timer = window.setTimeout(flick, 1_900);
    return () => {
      alive = false;
      window.clearTimeout(timer);
      for (const target of targets) target.classList.remove('is-glitching');
    };
  }, []);
  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => { if (entry.isIntersecting) setActive(entry.target.id); });
    }, { rootMargin: '-25% 0px -45% 0px', threshold: 0 });
    chapters.forEach(chapter => { const node = document.getElementById(chapter.id); if (node) observer.observe(node); });
    return () => observer.disconnect();
  }, []);
  // 文章轨道：自动推进、鼠标拖拽、触摸滑动，到一半宽度就无缝回接
  useEffect(() => {
    const rail = railRef.current;
    if (!rail || visiblePosts.length < 4) return;
    rail.scrollLeft = 0;

    const loopWidth = () => rail.scrollWidth / 2;
    const wrap = () => {
      const half = loopWidth();
      if (half <= 0) return;
      if (rail.scrollLeft >= half) rail.scrollLeft -= half;
      else if (rail.scrollLeft < 0) rail.scrollLeft += half;
    };

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let frame = 0;
    let hovered = false;
    let dragging = false;
    let moved = 0;
    let startX = 0;
    let startScroll = 0;

    const step = () => {
      if (!reduce && !hovered && !dragging) {
        rail.scrollLeft += 0.65;
        wrap();
      }
      frame = requestAnimationFrame(step);
    };

    const onPointerEnter = (event: PointerEvent) => { if (event.pointerType === 'mouse') hovered = true; };
    const onPointerLeave = () => { hovered = false; };
    const onPointerDown = (event: PointerEvent) => {
      if (event.pointerType === 'mouse' && event.button !== 0) return;
      dragging = true; moved = 0;
      startX = event.clientX;
      startScroll = rail.scrollLeft;
      rail.classList.add('is-dragging');
      try { rail.setPointerCapture(event.pointerId); } catch {}
    };
    const onPointerMove = (event: PointerEvent) => {
      if (!dragging) return;
      const delta = event.clientX - startX;
      moved = Math.max(moved, Math.abs(delta));
      rail.scrollLeft = startScroll - delta;
      wrap();
    };
    const onPointerUp = (event: PointerEvent) => {
      if (!dragging) return;
      dragging = false;
      rail.classList.remove('is-dragging');
      try { rail.releasePointerCapture(event.pointerId); } catch {}
    };
    // 拖完松手不要顺手点进文章
    const onClickCapture = (event: MouseEvent) => {
      if (moved > 6) { event.preventDefault(); event.stopPropagation(); moved = 0; }
    };

    rail.addEventListener('pointerenter', onPointerEnter);
    rail.addEventListener('pointerleave', onPointerLeave);
    rail.addEventListener('pointerdown', onPointerDown);
    rail.addEventListener('pointermove', onPointerMove);
    rail.addEventListener('pointerup', onPointerUp);
    rail.addEventListener('pointercancel', onPointerUp);
    rail.addEventListener('click', onClickCapture, true);
    frame = requestAnimationFrame(step);

    return () => {
      cancelAnimationFrame(frame);
      rail.removeEventListener('pointerenter', onPointerEnter);
      rail.removeEventListener('pointerleave', onPointerLeave);
      rail.removeEventListener('pointerdown', onPointerDown);
      rail.removeEventListener('pointermove', onPointerMove);
      rail.removeEventListener('pointerup', onPointerUp);
      rail.removeEventListener('pointercancel', onPointerUp);
      rail.removeEventListener('click', onClickCapture, true);
    };
  }, [visiblePosts.length, category]);
  useEffect(() => {
    const node = root.current;
    if (!node) return;
    if (!motion || !window.matchMedia('(pointer: fine)').matches) { node.style.setProperty('--mx', '0'); node.style.setProperty('--my', '0'); return; }
    let frame = 0;
    let x = 0, y = 0;
    const update = () => { node.style.setProperty('--mx', String(x)); node.style.setProperty('--my', String(y)); frame = 0; };
    const mouse = (event: PointerEvent) => { x = event.clientX / window.innerWidth - .5; y = event.clientY / window.innerHeight - .5; if (!frame) frame = requestAnimationFrame(update); };
    const reset = () => { x = 0; y = 0; if (!frame) frame = requestAnimationFrame(update); };
    window.addEventListener('pointermove', mouse, { passive: true }); document.addEventListener('pointerleave', reset);
    return () => { window.removeEventListener('pointermove', mouse); document.removeEventListener('pointerleave', reset); cancelAnimationFrame(frame); };
  }, [motion]);
  function toggleMotion() { setMotion(!motion); }
  const visit = (id: string) => { document.getElementById(id)?.scrollIntoView({ behavior: motion ? 'smooth' : 'instant' }); };

  return <div ref={root} className={'cm-experience ' + (motion ? '' : 'motion-off') + (scene ? ' dream-scene' : '')}>
    <Navbar />
    <nav className="chapter-rail" aria-label="页面章节">
      {chapters.map((chapter, index) => <button key={chapter.id} className={active === chapter.id ? 'active' : ''} onClick={() => visit(chapter.id)} aria-label={'跳转到' + chapter.title} aria-current={active === chapter.id ? 'location' : undefined}><span>0{index + 1}</span><i/><b>{chapter.title}</b></button>)}
      <span className="rail-line"/><span className="rail-caption">SCROLL TO EXPLORE</span>
    </nav>

    <main>
      <section className="hero-scene" id="home" aria-labelledby="hero-title">
        <div className="scene-coordinate"><span>CM / PERSONAL UNIVERSE</span><span>EST. 2026 — ∞</span></div>

        <CyberGrid />
        <div className="hero-spotlight" aria-hidden="true" />

        <div className="hero-inner">
          <div className="hero-copy">
            <div className="hero-eyebrow"><span className="live-dot"/> HELLO, WORLD. <span className="eyebrow-line"/> 很高兴在这里遇见你</div>
            <h1 id="hero-title" data-text="赛博刹那" data-glitch><span className="cp-char">赛</span><span className="cp-char">博</span><span className="cp-char">刹</span><span className="cp-char">那</span><i>✦</i></h1>
            <div className="hero-english">
              <span className="cp-word" data-text="CYBERMOT" data-glitch>
                {'CYBERMOT'.split('').map((letter, index) => <span className="cp-char" key={index}>{letter}</span>)}
              </span>
              <span className="hero-english-note">THE MOMENT IS INFINITE.</span>
            </div>
            <p className="hero-description">一位酷爱逆向解包游戏资源的动画人，<br className="desktop-break"/>也是<span>CS2zeMapper</span>，擅长制作皮肤模型等，爱好二次元。</p>
            <div className="hero-actions"><button className="primary-action" onClick={() => visit('journal')}>开始探索 <ArrowDown size={17}/></button><Link className="secondary-action" href="/about">关于我 <ArrowUpRight size={17}/></Link></div>
            <div className="hero-signature"><span>创作</span><i/><span>记录</span><i/><span>一点点天马行空</span></div>
          </div>

          <div className="hero-art" aria-label="赛博刹那的个人空间卡片">
            <div className="orbit-system" aria-hidden="true"><div className="orbit-ring ring-one"/><div className="orbit-ring ring-two"/><div className="orbit-ring ring-three"/><span className="orbit-cross cross-one">+</span><span className="orbit-cross cross-two">+</span><span className="orbit-label">KEEP EXPLORING<br/>STAY CURIOUS.</span></div>
            <div className="floating-shard shard-one" aria-hidden="true"/><div className="floating-shard shard-two" aria-hidden="true"/>
            <Link href="/about" className="identity-card">
              <div className="identity-card-top"><span>PERSONAL FILE</span><span>NO. 001 ↗</span></div>
              <div className="identity-image"><img src={siteConfig.avatarUrl} alt="赛博刹那的蓝发动漫头像" width="1080" height="1080" fetchPriority="high"/><span className="identity-sticker">THIS IS ME.</span></div>
              <div className="identity-bottom"><div><span>独立于世界，也连接着世界。</span><h2>{siteConfig.englishName}<small>赛博刹那</small></h2></div><ArrowUpRight size={25}/></div>
              <div className="identity-card-bottom"><span>CREATOR / DREAMER</span><span className="barcode">▌▎▎▌▌▎▌▎▎▌▌</span></div>
            </Link>
            <div className="floating-note"><span className="live-dot"/> 捕获一段灵感 <Sparkles size={13}/></div>
          </div>
        </div>

        <div className="hero-bottom">
          <button className="scroll-cue" onClick={() => visit('journal')} aria-label="向下探索"><span className="mouse-outline"><i/></span><span>向下滚动<small>THERE IS MORE BELOW</small></span></button>
          <div className="scene-switch" aria-label="切换背景场景"><span>SCENE</span><button onClick={() => setScene(0)} aria-pressed={scene === 0}>01 <span>浮光</span></button><i/><button onClick={() => setScene(1)} aria-pressed={scene === 1}>02 <span>星夜</span></button></div>
          <button className="motion-toggle" onClick={toggleMotion} aria-label={motion ? '关闭空间动效' : '开启空间动效'} aria-pressed={motion}>{motion ? <Pause size={12}/> : <Play size={12}/>}<span>空间动效 {motion ? 'ON' : 'OFF'}</span></button>
        </div>
      </section>

      <section className="journal-section cm-section" id="journal" aria-labelledby="journal-title">
        <div className="section-topline"><span>CHAPTER 02 / JOURNAL</span><span>WORDS ARE LITTLE WORLDS.</span></div>
        <div className="section-heading"><div><span className="section-kicker">留下一点，存在过的痕迹。</span><h2 id="journal-title">文字与<span>灵感</span><sup>({String(posts.length).padStart(2, '0')})</sup></h2></div><Link className="text-link" href="/blog">进入博客 <ArrowUpRight size={17}/></Link></div>
        <div className="journal-toolbar"><div className="category-tabs" aria-label="按标签筛选文章">{tags.map(tag => <button key={tag} aria-pressed={category === tag} className={category === tag ? 'selected' : ''} onClick={() => setCategory(tag)}>{tag}</button>)}</div><Link href="/timeline" className="archive-link">按时间归档 <Layers3 size={15}/></Link></div>
        <div className={'journal-grid' + (visiblePosts.length >= 4 ? ' is-marquee' : '')} ref={railRef} tabIndex={visiblePosts.length >= 4 ? 0 : undefined} aria-label={visiblePosts.length >= 4 ? '最新文章，可拖动或滑动浏览' : undefined}>
          <div className="journal-track">
            {(() => {
              const looped = visiblePosts.length >= 4 ? [...visiblePosts, ...visiblePosts] : visiblePosts;
              return looped.map((post, index) => <article className="journal-card" key={post.slug + '-' + index} aria-hidden={index >= visiblePosts.length ? true : undefined} tabIndex={index >= visiblePosts.length ? -1 : undefined}>
                <Link className="post-cover" href={'/posts/' + post.slug}><img src={post.cover} alt="" loading="lazy"/><span className="post-number">0{(index % visiblePosts.length) + 1}</span><span className="post-open"><ArrowUpRight size={20}/></span><span className="post-image-label">{index % visiblePosts.length === 0 ? 'A NEW BEGINNING' : index % visiblePosts.length === 1 ? 'SOMEWHERE TO STAY' : 'SMALL, BEAUTIFUL THINGS'}</span></Link>
                <div className="post-content"><div className="post-meta"><span>{post.tags[0] || '随笔'}</span><time dateTime={post.date}>{formatDate(post.date)}</time>{post.sample && <em>示例文章</em>}</div><h3><Link href={'/posts/' + post.slug}>{post.title}</Link></h3><p>{post.description}</p><div className="post-bottom"><span>{post.readingMinutes} 分钟阅读</span><Link href={'/posts/' + post.slug} aria-label={'阅读' + post.title}>阅读全文 <ArrowRight size={14}/></Link></div></div>
              </article>);
            })()}
          </div>
          {visiblePosts.length === 0 && <p className="empty-message">这个分类还没有文章，新的故事正在路上。</p>}
        </div>
        <div className="journal-footnote"><span className="tiny-cross">+</span><span>每一个微小的想法，都值得被认真保存。</span><span className="tiny-cross">+</span></div>
      </section>

      <section className="universe-section cm-section" id="universe" aria-labelledby="universe-title">
        <div className="section-topline"><span>CHAPTER 03 / UNIVERSE</span><span>MORE THAN JUST WORDS.</span></div>
        <div className="section-heading"><div><span className="section-kicker">在这里，还可以找到…</span><h2 id="universe-title">我的小小<span>宇宙</span><Orbit size={36}/></h2></div><span className="universe-note">自由生长，持续更新。</span></div>
        <div className="universe-grid"><div className="destination-grid">{destinations.map(item => <Link key={item.href} className="destination-card" href={item.href}><div><item.icon size={25} strokeWidth={1.3}/><span>{item.number} / EXPLORE</span></div><h3>{item.title}<ArrowUpRight size={20}/></h3><p>{item.subtitle}</p></Link>)}</div>
          <button className="music-feature" onClick={openMusicPlayer}><div className="music-feature-top"><Headphones size={18}/><span>SOUNDTRACK OF MY LIFE</span><ArrowUpRight size={20}/></div><div className="vinyl"><div><img src={siteConfig.avatarUrl} alt=""/><i/></div></div><div className="music-feature-text"><span>网易云音乐 / MY PLAYLIST</span><h3>听见，<br/>另一个世界。</h3><p>给生活一点背景音乐。</p><span className="listen-button"><Play size={13} fill="currentColor"/> 打开我的歌单</span></div></button>
        </div>
        <div className="connection-strip"><div><Compass size={23} strokeWidth={1.3}/><p>相遇本身，就是一件很浪漫的事。<span>让我们在互联网的某个角落，交换彼此的宇宙。</span></p></div><Link href="/friends">去朋友家坐坐 <ArrowUpRight size={18}/></Link></div>
        <div className="more-links"><Link href="/chatter">碎碎念 <ChevronRight size={13}/></Link><Link href="/timeline">时间轴 <ChevronRight size={13}/></Link><Link href="/music">音乐馆 <ChevronRight size={13}/></Link><a href="/feed.xml">RSS 订阅 <Rss size={13}/></a></div>
      </section>

      <BilibiliSection />

      <SteamSection />
    </main>
    <footer className="cm-footer"><div className="footer-brand"><span className="cm-mark"><i/></span><b>CyberMot<span>记录刹那，连接无限。</span></b></div><div><span>© 2026 CyberMot · 赛博刹那</span><span>基于 <a href="https://github.com/heiehiehi/XinghuisamaBlogs" target="_blank" rel="noopener noreferrer">XHBlogs</a> · CC BY-NC 4.0</span></div><button onClick={() => visit('home')}>BACK TO TOP <MoveUpRight size={15}/></button></footer>
  </div>;
}
