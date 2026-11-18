import type { NextConfig } from "next";

const allowedDevOrigins = (process.env.ALLOWED_DEV_ORIGINS ?? "")
  .split(",")
  .map((value) => value.trim())
  .filter((value) => value.length > 0);

const nextConfig: NextConfig = {
  output: "standalone",
  ...(allowedDevOrigins.length > 0 ? { allowedDevOrigins } : {}),
  watchOptions: {
    pollIntervalMs: 1000,
  },
};

export default nextConfig;
