import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import staticAssetsIncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/static-assets-incremental-cache";

// Markdown pages are generated during builds. API handlers remain dynamic.
// This read-only cache serves generated pages without provisioning R2 or D1.
// Rebuild and redeploy after editing content; runtime ISR is not enabled.
export default defineCloudflareConfig({
  incrementalCache: staticAssetsIncrementalCache,
  enableCacheInterception: true,
});
