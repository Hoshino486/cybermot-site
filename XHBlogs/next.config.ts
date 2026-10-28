import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

// Keep `next dev` available on Windows while making Cloudflare bindings available.
initOpenNextCloudflareForDev();

const nextConfig: NextConfig = {
  devIndicators: false,
  // React 19.2 的 useEffect 不接受编译器生成的对象形式，开着会让客户端 effect 全部失效。
  // 关掉后文章轨道自动滚动、章节观察器、主题切换等恢复。
  reactCompiler: false,
  // Route Handlers remain available; OpenNext adapts the production server.
  images: {
    unoptimized: true,
  },
  async rewrites() {
    return [{ source: "/tools/soundevent", destination: "/tools/soundevent/index.html" }];
  },
};

export default nextConfig;
