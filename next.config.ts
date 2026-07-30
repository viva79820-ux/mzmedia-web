import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    "/api/offline-students/lookup": ["./data/**/*"],
  },
};

export default nextConfig;
