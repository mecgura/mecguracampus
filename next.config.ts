import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Standalone output for Docker/VPS deploys (smaller, self-contained server).
  output: "standalone",
};

export default nextConfig;
