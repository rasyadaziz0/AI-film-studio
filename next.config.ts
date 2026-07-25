import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  async rewrites() {
    return [
      {
        // Proxy all /backend/ requests directly to the VPS domain
        // This avoids WAF blocking raw IP hits from AWS to port 4000
        source: "/backend/:path*",
        destination: "https://api.acadlabs.fun/:path*", // Proxy to the secure HTTPS API
      },
    ];
  },
};

export default nextConfig;
