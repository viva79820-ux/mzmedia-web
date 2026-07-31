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
    ];
  },
};

export default nextConfig;
