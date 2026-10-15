import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    "/api/offline-students/lookup": ["./data/**/*"],
  },
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "mzmedia.co.kr" }],
        destination: "https://www.mzmedia.co.kr/:path*",
        permanent: true,
      },
      {
        source: "/quote",
        destination: "/estimate",
        permanent: true,
      },
      { source: "/admin", destination: "/os/login", permanent: false },
      { source: "/admin/orders", destination: "/os/legacy/orders", permanent: false },
      { source: "/admin/products", destination: "/os/catalog", permanent: false },
      { source: "/admin/inquiries", destination: "/os/leads", permanent: false },
      { source: "/admin/wages", destination: "/os/wages", permanent: false },
    ];
  },
};

export default nextConfig;
