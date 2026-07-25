import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  async rewrites() {
    return [
      {
        // Proxy all /backend/ requests directly to the VPS IP
        // This bypasses Alibaba Cloud WAF domain blocking completely!
        source: "/backend/:path*",
        destination: "http://47.99.193.142:80/:path*",
      },
    ];
  },
};

export default nextConfig;
