import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    "/api/offline-students/lookup": ["./data/**/*"],
    "/api/office/jobs": ["./prisma/migrations/20261103000000_ai_office/migration.sql", "./knowledge/**/*.md"],
    "/api/office/jobs/[id]": ["./prisma/migrations/20261103000000_ai_office/migration.sql", "./knowledge/**/*.md"],
    "/api/office/summary": ["./prisma/migrations/20261103000000_ai_office/migration.sql"],
    "/api/office/memory": ["./prisma/migrations/20261103000000_ai_office/migration.sql"],
    "/api/office/improvements": ["./prisma/migrations/20261103000000_ai_office/migration.sql"],
    "/api/office/improvements/[id]": ["./prisma/migrations/20261103000000_ai_office/migration.sql"],
    "/api/office/briefs": ["./prisma/migrations/20261103000000_ai_office/migration.sql"],
    "/api/office/packages": ["./prisma/migrations/20261103000000_ai_office/migration.sql"],
    "/api/office/work": ["./prisma/migrations/20261103000000_ai_office/migration.sql"],
    "/api/office/week": ["./prisma/migrations/20261103000000_ai_office/migration.sql"],
    "/api/office/morning": ["./prisma/migrations/20261103000000_ai_office/migration.sql", "./knowledge/**/*.md"],
    "/api/office/chat": ["./prisma/migrations/20261103000000_ai_office/migration.sql", "./knowledge/**/*.md"],
    "/api/office/backend": ["./prisma/migrations/20261103000000_ai_office/migration.sql"],
    "/api/office/agents/[id]": ["./prisma/migrations/20261103000000_ai_office/migration.sql"],
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
    ];
  },
};

export default nextConfig;
