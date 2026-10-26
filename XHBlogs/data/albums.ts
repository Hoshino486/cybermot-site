// 相册数据：由 scripts/import-wallpapers.mjs 生成，可手动增删。
export interface Photo { url: string; caption?: string; }
export interface Album { id: string; title: string; description: string; cover: string; date: string; photos: Photo[]; }

export const albums: Album[] = [
  {
    id: "night",
    title: "夜色低语",
    description: "深蓝与霓虹交界的时刻，适合把灯关掉。",
    cover: "/photos/night/mlogp9.webp",
    date: "2026-09-18",
    photos: [
      { url: "/photos/night/mlogp9.webp", caption: "2560×1440" },
      { url: "/photos/night/vp2rjp.webp", caption: "2560×1440" },
      { url: "/photos/night/216xmy.webp", caption: "2560×1440" },
      { url: "/photos/night/og761l.webp", caption: "2560×1191" },
      { url: "/photos/night/qrpxzd.webp", caption: "2560×1440" },
    ],
  },
  {
    id: "glow",
    title: "浮光掠影",
    description: "逆光、花瓣与尚未散尽的午后。",
    cover: "/photos/glow/5ypm28.webp",
    date: "2026-10-02",
    photos: [
      { url: "/photos/glow/5ypm28.webp", caption: "2560×1440" },
      { url: "/photos/glow/vp23lp.webp", caption: "2560×1513" },
      { url: "/photos/glow/216j8x.webp", caption: "2560×1228" },
      { url: "/photos/glow/5yp8v5.webp", caption: "2560×1440" },
      { url: "/photos/glow/rqe67w.webp", caption: "2560×1513" },
    ],
  },
  {
    id: "daylight",
    title: "暖阳片段",
    description: "明亮、干净，像刚好醒来的那一瞬。",
    cover: "/photos/daylight/k8jd9d.webp",
    date: "2026-10-20",
    photos: [
      { url: "/photos/daylight/k8jd9d.webp", caption: "2560×1440" },
      { url: "/photos/daylight/7jx713.webp", caption: "2560×1440" },
      { url: "/photos/daylight/mlo5d8.webp", caption: "2560×1440" },
      { url: "/photos/daylight/yqkkok.webp", caption: "2560×1440" },
    ],
  },
];
