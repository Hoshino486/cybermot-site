'use client';

import { useEffect } from 'react';

// The backdrop gets a colour grade that follows the visitor's clock, so the site slowly
// warms up at dawn, goes neutral at noon, turns amber at dusk and cools down at night.
// Colours are interpolated between keyframes and written to CSS variables; the stylesheet
// transitions those variables over several seconds, which reads as light drifting.
type Stop = { hour: number; from: number[]; to: number[]; opacity: number };

const STOPS: Stop[] = [
  { hour: 0, from: [12, 26, 48], to: [22, 46, 78], opacity: 0.5 },
  { hour: 4.5, from: [14, 30, 54], to: [30, 52, 84], opacity: 0.48 },
  { hour: 6, from: [246, 188, 166], to: [255, 216, 190], opacity: 0.38 },
  { hour: 8, from: [255, 232, 205], to: [205, 233, 243], opacity: 0.24 },
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
