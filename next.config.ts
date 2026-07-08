import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // Pin the workspace root to this project so Next.js ignores the stray
  // package-lock.json in C:\Users\User and stops warning about it.
  turbopack: {
    root: path.join(__dirname),
  },
};

export default nextConfig;
