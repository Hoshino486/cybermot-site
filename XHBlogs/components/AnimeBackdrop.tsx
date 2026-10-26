'use client';
import { useEffect, useRef, useState } from 'react';
import { useSitePreferences } from './SitePreferencesProvider';
import { siteConfig } from '../siteConfig';
import './anime-backdrop.css';
type Mote = { x: number; y: number; size: number; speed: number; phase: number; depth: number };

/** Stationary artwork with independently animated petals, light, fireflies and stars. */
export default function AnimeBackdrop() {
  const { scene, motion, backgroundMode, ready } = useSitePreferences();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationTimeRef = useRef(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [visible, setVisible] = useState(true);
  const [limited, setLimited] = useState(true);
  const [videoFailed, setVideoFailed] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const running = ready && motion && !limited && visible;
  const videoUrl = siteConfig.backgroundVideoUrl;
  const useVideo = backgroundMode === 'video' && Boolean(videoUrl) && !videoFailed && !limited && ready;
  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const connection = (navigator as Navigator & { connection?: EventTarget & { saveData?: boolean } }).connection;
    const sync = () => { setLimited(media.matches || Boolean(connection?.saveData)); setVisible(!document.hidden); };
    sync(); media.addEventListener('change', sync); connection?.addEventListener('change', sync); document.addEventListener('visibilitychange', sync);
    return () => { media.removeEventListener('change', sync); connection?.removeEventListener('change', sync); document.removeEventListener('visibilitychange', sync); };
  }, []);
  useEffect(() => { setVideoFailed(false); setVideoReady(false); }, [videoUrl, backgroundMode]);
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (running) video.play().catch(() => setVideoFailed(true)); else video.pause();
  }, [running, useVideo, videoReady]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d', { alpha: true });
    if (!canvas || !ctx) return;
    let width = 0, height = 0, raf = 0, last = 0, elapsed = animationTimeRef.current, frames = 0, mobile = false;
    let petals: Mote[] = [], fireflies: Mote[] = [], stars: Mote[] = [], seed = 683;
    const random = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
    const mote = (): Mote => ({ x: random(), y: random(), size: 3 + random() * 8, speed: 0.5 + random(), phase: random() * Math.PI * 2, depth: 0.3 + random() * 0.7 });
    const draw = (time: number) => {
      ctx.clearRect(0, 0, width, height);
      if (scene === 0) {
        for (let beam = 0; beam < 3; beam++) {
          const x = width * (0.54 + beam * 0.2);
          const glow = ctx.createLinearGradient(x, 0, x - width * 0.22, height);
          glow.addColorStop(0, 'rgba(255,238,207,' + (0.055 + Math.sin(time * 0.3 + beam) * 0.017) + ')');
          glow.addColorStop(1, 'rgba(255,248,224,0)'); ctx.fillStyle = glow;
          ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + width * 0.09, 0); ctx.lineTo(x - width * 0.12, height); ctx.lineTo(x - width * 0.43, height); ctx.closePath(); ctx.fill();
        }
        petals.forEach(p => {
          const x = ((p.x * width + time * (12 + 20 * p.depth) + Math.sin(time * 0.65 + p.phase) * 27) % (width + 70)) - 35;
          const y = ((p.y * (height + 90) + time * (17 + 34 * p.depth)) % (height + 90)) - 45;
          ctx.save(); ctx.translate(x, y); ctx.rotate(p.phase + time * p.speed * 0.45);
          ctx.scale(0.45 + Math.abs(Math.sin(time * 0.7 + p.phase)) * 0.55, 1);
          const size = p.size * (mobile ? 0.8 : 1);
          ctx.fillStyle = 'rgba(255,' + (182 + Math.round(p.depth * 35)) + ',' + (211 + Math.round(p.depth * 25)) + ',' + (0.32 + p.depth * 0.4) + ')';
          ctx.beginPath(); ctx.moveTo(0, -size);
          ctx.bezierCurveTo(size * 1.3, -size * 0.25, size * 0.85, size, 0, size * 0.65);
          ctx.bezierCurveTo(-size * 0.9, size * 0.2, -size * 0.5, -size * 0.8, 0, -size); ctx.fill(); ctx.restore();
        });
      } else {
        const halo = ctx.createRadialGradient(width * 0.72, height * 0.24, 0, width * 0.72, height * 0.24, width * 0.38);
        halo.addColorStop(0, 'rgba(163,157,255,' + (0.075 + Math.sin(time * 0.23) * 0.018) + ')'); halo.addColorStop(1, 'rgba(125,183,245,0)');
        ctx.fillStyle = halo; ctx.fillRect(0, 0, width, height);
        stars.forEach(s => {
          const brightness = 0.18 + (Math.sin(time * s.speed + s.phase) + 1) * 0.26;
          ctx.fillStyle = 'rgba(232,246,255,' + brightness + ')'; ctx.beginPath(); ctx.arc(s.x * width, s.y * height * 0.8, s.depth * 1.6, 0, Math.PI * 2); ctx.fill();
          if (s.depth > 0.88) {
            const size = 3 + brightness * 4; ctx.strokeStyle = 'rgba(203,238,255,' + brightness * 0.6 + ')'; ctx.lineWidth = 0.8;
            ctx.beginPath(); ctx.moveTo(s.x * width - size, s.y * height * 0.8); ctx.lineTo(s.x * width + size, s.y * height * 0.8); ctx.moveTo(s.x * width, s.y * height * 0.8 - size); ctx.lineTo(s.x * width, s.y * height * 0.8 + size); ctx.stroke();
          }
        });
        const shooting = time % 9;
        if (shooting < 1.8) {
          const progress = shooting / 1.8, x = width * (0.9 - progress * 0.4), y = height * (0.12 + progress * 0.3);
          const trail = ctx.createLinearGradient(x, y, x + 100, y - 60);
          trail.addColorStop(0, 'rgba(222,246,255,' + Math.sin(progress * Math.PI) * 0.75 + ')'); trail.addColorStop(1, 'rgba(184,219,255,0)');
          ctx.strokeStyle = trail; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 100, y - 60); ctx.stroke();
        }
      }
      fireflies.forEach(f => {
        const x = (f.x * width + Math.sin(time * 0.22 + f.phase) * 40 + time * f.depth * 4 + width) % width;
        const y = ((f.y * height - time * (4 + f.depth * 8) + Math.cos(time * 0.4 + f.phase) * 20) % height + height) % height;
        const alpha = (scene ? 0.4 : 0.3) * (0.5 + (Math.sin(time * f.speed + f.phase) + 1) * 0.25), size = (scene ? 2.6 : 2) * f.depth;
        const glow = ctx.createRadialGradient(x, y, 0, x, y, size * 5);
        glow.addColorStop(0, 'rgba(' + (scene ? '160,234,255' : '255,242,187') + ',' + alpha + ')'); glow.addColorStop(1, 'rgba(200,239,255,0)');
        ctx.fillStyle = glow; ctx.fillRect(x - size * 5, y - size * 5, size * 10, size * 10);
        ctx.fillStyle = 'rgba(' + (scene ? '211,255,255' : '255,248,217') + ',' + (alpha + 0.2) + ')'; ctx.beginPath(); ctx.arc(x, y, size * 0.5, 0, Math.PI * 2); ctx.fill();
      });
      canvas.dataset.frame = String(++frames);
    };
    const resize = () => {
      width = window.innerWidth; height = window.innerHeight; mobile = width < 700;
      const dpr = Math.min(window.devicePixelRatio || 1, mobile ? 1.25 : 1.5);
      canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr); ctx.setTransform(dpr, 0, 0, dpr, 0, 0); seed = 683;
      petals = Array.from({ length: mobile ? 22 : 42 }, mote); fireflies = Array.from({ length: mobile ? 24 : 45 }, mote); stars = Array.from({ length: mobile ? 45 : 100 }, mote); draw(elapsed);
    };
    const tick = (timestamp: number) => {
      if (!last || timestamp - last >= (mobile ? 1000 / 24 : 1000 / 30)) { elapsed += last ? Math.min((timestamp - last) / 1000, 0.08) : 0; animationTimeRef.current = elapsed; last = timestamp; draw(elapsed); }
      raf = requestAnimationFrame(tick);
    };
    resize(); if (running) raf = requestAnimationFrame(tick); window.addEventListener('resize', resize, { passive: true });
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); };
  }, [scene, running]);
  return <div className="anime-backdrop" data-scene={scene === 1 ? 'night' : 'day'} data-animation={running ? 'running' : 'paused'} data-mode={useVideo ? 'video' : 'effects'} aria-hidden="true">
    <div className="anime-still-image anime-image-day" style={{ backgroundImage: 'url(' + (siteConfig.videoPosterUrl || '/images/dream.webp') + ')' }} />
    <div className="anime-still-image anime-image-night" style={{ backgroundImage: 'url(' + (siteConfig.alternateBackgroundImage || '/images/evening.webp') + ')' }} />
    {useVideo && <video ref={videoRef} className={'anime-background-video' + (videoReady ? ' is-ready' : '')} src={videoUrl} poster={scene ? siteConfig.alternateBackgroundImage : siteConfig.videoPosterUrl} muted loop playsInline preload="metadata" onCanPlay={() => setVideoReady(true)} onError={() => setVideoFailed(true)} />}
    <div className="anime-readability-wash" /><canvas ref={canvasRef} className="anime-atmosphere" data-frame="0" /><div className="anime-horizon" />
  </div>;
}

