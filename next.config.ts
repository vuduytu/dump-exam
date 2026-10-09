import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  distDir: process.env.NEXT_DIST_DIR || ".next", // e2e uses .next-e2e so it never clobbers the dev server on :3000
};

export default nextConfig;
