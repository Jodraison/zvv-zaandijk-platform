import type { NextConfig } from "next";
import path from "path";
import { fileURLToPath } from "url";

const dir = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  reactStrictMode: true,
  /** Optional alternate output dir when `.next` is locked by `next dev` (e.g. C-006 build). */
  distDir: process.env.NEXT_DIST_DIR || ".next",
  outputFileTracingRoot: path.join(dir),
  /** Hide Next.js Issues / Turbopack badge from Academy portfolio screenshots. */
  devIndicators: false,
  experimental: {
    serverActions: {
      bodySizeLimit: "6mb",
    },
  },
  images: {
    remotePatterns: [{ protocol: "https", hostname: "**.supabase.co", pathname: "/**" }],
  },
};

export default nextConfig;
