import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  async redirects() {
    return [
      {
        source: '/dashbard',
        destination: '/dashboard',
        permanent: true,
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://127.0.0.1:8000/api/:path*',
      },
      {
        source: '/hb/:path*',
        destination: 'http://127.0.0.1:8000/hb/:path*',
      },
      {
        source: '/metrics',
        destination: 'http://127.0.0.1:8000/metrics',
      },
      {
        source: '/badge/:path*',
        destination: 'http://127.0.0.1:8000/badge/:path*',
      },
    ];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
