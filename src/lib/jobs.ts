import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import { JOB_CATEGORIES, JOB_LOCATIONS } from "@/lib/job-categories";

export type JobListQuery = {
  type?: "REQUEST" | "PROMOTE";
  category?: string;
  location?: string;
  q?: string;
  page?: number;
};

const PAGE_SIZE = 20;

export async function listJobs(query: JobListQuery) {
  const page = Math.max(1, query.page ?? 1);
  const where: Prisma.PostWhereInput = {};

  if (query.type) where.type = query.type;
  if (query.category && (JOB_CATEGORIES as readonly string[]).includes(query.category)) {
    where.category = query.category;
  }
  if (query.location && (JOB_LOCATIONS as readonly string[]).includes(query.location)) {
    where.location = query.location;
  }
  if (query.q) {
    where.OR = [
      { title: { contains: query.q, mode: "insensitive" } },
      { content: { contains: query.q, mode: "insensitive" } },
    ];
  }

  const [total, posts] = await Promise.all([
    prisma.post.count({ where }),
    prisma.post.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        type: true,
        category: true,
        title: true,
        budget: true,
        location: true,
        createdAt: true,
        views: true,
        author: { select: { name: true, username: true } },
      },
    }),
  ]);

  return { total, page, pageSize: PAGE_SIZE, posts };
}

const postDetailInclude = {
  author: { select: { name: true, username: true } },
} as const;

export async function findJobById(id: string) {
  return prisma.post.findUnique({
    where: { id },
    include: postDetailInclude,
  });
}

export async function getJobById(id: string) {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.post.findUnique({
      where: { id },
      include: postDetailInclude,
    });
    if (!existing) return null;

    return tx.post.update({
      where: { id },
      data: { views: { increment: 1 } },
      include: postDetailInclude,
    });
  });
}

export function formatJobDate(date: Date) {
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}
