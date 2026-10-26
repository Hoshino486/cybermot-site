'use client';

import { useEffect, useRef } from 'react';

// A synthwave floor under the hero copy: neon lines converge on a vanishing point that
// drifts with the pointer, and the horizontal lines keep flowing toward the viewer so the
// space reads as perspective rather than a flat grid.
export default function CyberGrid() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const host = canvas?.closest('.hero-scene') as HTMLElement | null;
    if (!canvas || !host) return;
    const context = canvas.getContext('2d');
    if (!context) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    let width = 0;
    let height = 0;
    let frame = 0;
    let visible = true;
    const pointer = { x: 0, y: 0, tx: 0, ty: 0 };

    const resize = () => {
      const rect = host.getBoundingClientRect();
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      width = rect.width;
      height = rect.height;
      canvas.width = Math.max(1, Math.round(width * dpr));
      canvas.height = Math.max(1, Math.round(height * dpr));
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

    const draw = (now: number) => {
      const still = reduced.matches || document.documentElement.classList.contains('motion-off');
      pointer.x = lerp(pointer.x, pointer.tx, 0.06);
      pointer.y = lerp(pointer.y, pointer.ty, 0.06);

      const horizon = height * 0.68;
      const vx = width / 2 + pointer.x * width * 0.07;
      const vy = horizon + pointer.y * height * 0.02;
      const time = still ? 0 : now / 1000;

      context.clearRect(0, 0, width, height);

      // horizon bloom
      const bloom = context.createRadialGradient(vx, vy, 0, vx, vy, width * 0.5);
      bloom.addColorStop(0, 'rgba(86, 232, 255, .30)');
      bloom.addColorStop(0.45, 'rgba(120, 120, 255, .10)');
      bloom.addColorStop(1, 'rgba(0, 0, 0, 0)');
      context.fillStyle = bloom;
      context.fillRect(0, vy - height * 0.28, width, height * 0.56);

      context.lineWidth = 1;

      // converging verticals
      const columns = 16;
      for (let index = -columns; index <= columns; index++) {
        const spread = index / columns;
        const targetX = width / 2 + spread * width * 1.5;
        const depth = Math.min(1, Math.abs(spread));
        context.strokeStyle = `rgba(${Math.round(86 + 130 * depth)}, ${Math.round(232 - 120 * depth)}, 255, ${0.05 + depth * 0.16})`;
        context.beginPath();
        context.moveTo(vx, vy);
        context.lineTo(targetX, height + 40);
        context.stroke();
      }

      // flowing horizontals in perspective
      const rows = 16;
      for (let row = 0; row < rows; row++) {
        const progress = (row + (time * 0.35) % 1) / rows;
        const eased = Math.pow(progress, 2.4);
        const y = vy + eased * (height - vy) * 1.25;
        if (y > height + 2) continue;
        const alpha = 0.04 + eased * 0.26;
        context.strokeStyle = `rgba(${Math.round(86 + 150 * eased)}, ${Math.round(226 - 140 * eased)}, 250, ${alpha})`;
        context.beginPath();
        context.moveTo(0, y);
        context.lineTo(width, y);
        context.stroke();
      }

      // a slow scanline sweeping down the floor
      if (!still) {
        const sweep = ((time * 60) % (height + 200)) - 100;
        const band = context.createLinearGradient(0, sweep - 60, 0, sweep + 60);
        band.addColorStop(0, 'rgba(0, 0, 0, 0)');
        band.addColorStop(0.5, 'rgba(150, 255, 250, .05)');
        band.addColorStop(1, 'rgba(0, 0, 0, 0)');
        context.fillStyle = band;
        context.fillRect(0, sweep - 60, width, 120);
      }
    };

    const loop = (now: number) => {
      if (visible) draw(now);
      frame = window.requestAnimationFrame(loop);
    };

    const onPointerMove = (event: PointerEvent) => {
      const rect = host.getBoundingClientRect();
      pointer.tx = Math.max(-1, Math.min(1, ((event.clientX - rect.left) / rect.width - 0.5) * 2));
      pointer.ty = Math.max(-1, Math.min(1, ((event.clientY - rect.top) / rect.height - 0.5) * 2));
      host.style.setProperty('--mx', pointer.tx.toFixed(3));
      host.style.setProperty('--my', pointer.ty.toFixed(3));
      host.style.setProperty('--spot-x', `${((event.clientX - rect.left) / rect.width) * 100}%`);
      host.style.setProperty('--spot-y', `${((event.clientY - rect.top) / rect.height) * 100}%`);
    };

    const onPointerLeave = () => {
      pointer.tx = 0;
      pointer.ty = 0;
      host.style.setProperty('--mx', '0');
      host.style.setProperty('--my', '0');
    };

    const observer = new IntersectionObserver((entries) => {
      visible = entries.some((entry) => entry.isIntersecting);
    }, { threshold: 0 });

    resize();
    observer.observe(host);
    host.addEventListener('pointermove', onPointerMove, { passive: true });
    host.addEventListener('pointerleave', onPointerLeave, { passive: true });
    window.addEventListener('resize', resize);
    frame = window.requestAnimationFrame(loop);

    return () => {
      window.cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener('resize', resize);
      host.removeEventListener('pointermove', onPointerMove);
      host.removeEventListener('pointerleave', onPointerLeave);
    };
  }, []);

  return <canvas ref={canvasRef} className="cyber-grid" aria-hidden="true" />;
}
