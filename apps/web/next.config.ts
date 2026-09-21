import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    const apiBaseUrl = (
      process.env.API_BASE_URL ?? "http://127.0.0.1:3001"
    ).replace(/\/+$/, "");

    return [{ source: "/files", destination: `${apiBaseUrl}/files/` }];
  },
};

export default nextConfig;
