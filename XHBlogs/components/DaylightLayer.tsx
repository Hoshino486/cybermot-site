'use client';

import { useEffect } from 'react';

// The backdrop gets a colour grade that follows the visitor's clock, so the site slowly
// warms up at dawn, goes neutral at noon, turns amber at dusk and cools down at night.
// Colours are interpolated between keyframes and written to CSS variables; the stylesheet
// transitions those variables over several seconds, which reads as light drifting.
type Stop = { hour: number; from: number[]; to: number[]; opacity: number };

const STOPS: Stop[] = [
  { hour: 0, from: [12, 26, 48], to: [22, 46, 78], opacity: 0.5 },
  { hour: 5, from: [10, 22, 42], to: [18, 38, 66], opacity: 0.52 },
  // 凌晨到 7:30 都还算夜晚，只是天光在边缘慢慢透一点蓝
  { hour: 7, from: [24, 38, 62], to: [52, 68, 92], opacity: 0.46 },
  // 蓝色直接插到桃色会经过一层脏灰，所以拆成 紫 → 玫 → 桃 三段
  { hour: 7.2, from: [56, 54, 88], to: [92, 76, 108], opacity: 0.46 },
  { hour: 7.4, from: [168, 116, 122], to: [214, 148, 146], opacity: 0.42 },
  { hour: 7.5, from: [246, 188, 166], to: [255, 216, 190], opacity: 0.38 },
  { hour: 9, from: [255, 232, 205], to: [205, 233, 243], opacity: 0.26 },
  { hour: 12, from: [255, 255, 255], to: [214, 240, 247], opacity: 0.14 },
  { hour: 16, from: [255, 236, 208], to: [247, 218, 194], opacity: 0.22 },
  { hour: 18.5, from: [255, 158, 120], to: [176, 125, 184], opacity: 0.4 },
  { hour: 21, from: [109, 90, 156], to: [42, 63, 107], opacity: 0.46 },
  { hour: 24, from: [12, 26, 48], to: [22, 46, 78], opacity: 0.5 },
];

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const mix = (a: number[], b: number[], t: number) => [
  Math.round(lerp(a[0], b[0], t)),
  Math.round(lerp(a[1], b[1], t)),
  Math.round(lerp(a[2], b[2], t)),
];

function palette(now: Date) {
  const hour = now.getHours() + now.getMinutes() / 60;
  let index = 0;
  while (index < STOPS.length - 2 && hour > STOPS[index + 1].hour) index++;
  const start = STOPS[index];
  const end = STOPS[index + 1];
  const span = Math.max(0.001, end.hour - start.hour);
  const t = Math.min(1, Math.max(0, (hour - start.hour) / span));
  return {
    from: mix(start.from, end.from, t),
    to: mix(start.to, end.to, t),
    opacity: lerp(start.opacity, end.opacity, t),
  };
}

export default function DaylightLayer() {
  useEffect(() => {
    const style = document.documentElement.style;

    const apply = () => {
      const { from, to, opacity } = palette(new Date());
      style.setProperty('--day-glow-a', `rgb(${from[0]}, ${from[1]}, ${from[2]})`);
      style.setProperty('--day-glow-b', `rgb(${to[0]}, ${to[1]}, ${to[2]})`);
      style.setProperty('--day-glow-opacity', opacity.toFixed(3));
    };

    apply();
    const timer = window.setInterval(apply, 60_000);
    const onVisible = () => { if (document.visibilityState === 'visible') apply(); };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);

  return null;
}
