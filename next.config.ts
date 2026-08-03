import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  async rewrites() {
    return [
      {
        source: "/backend/:path*",
        destination: "https://api.acadlabs.fun/:path*",
      },
    ];
  },
};

export default nextConfig;
