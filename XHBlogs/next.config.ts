import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

// Keep `next dev` available on Windows while making Cloudflare bindings available.
initOpenNextCloudflareForDev();

const nextConfig: NextConfig = {
  devIndicators: false,
  // Route Handlers remain available; OpenNext adapts the production server.
  images: {
    unoptimized: true,
  },
  async rewrites() {
    return [{ source: "/tools/soundevent", destination: "/tools/soundevent/index.html" }];
  },
};

export default nextConfig;
