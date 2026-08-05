import "dotenv/config";
import fs from "fs";
import path from "path";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { calcAmount } from "../src/lib/orders";

async function main() {
  const file = process.argv[2];
  if (!file) {
    console.error("Usage: npx tsx scripts/import-orders.ts <orders.json>");
    process.exit(1);
  }

  const abs = path.resolve(file);
  const raw = JSON.parse(fs.readFileSync(abs, "utf8")) as Array<
    Record<string, unknown>
  >;

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL missing");

  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
  });

  let imported = 0;
  for (const row of raw) {
    const id = String(row.id || "");
    if (!id) continue;
    const quantity = Number(row.수량 ?? 1) || 1;
    const unitPrice = Number(row.단가 ?? 0) || 0;
    const detailHint = String(row.세부내용여부 ?? "") === "있음";

    await prisma.order.upsert({
      where: { id },
      create: {
        id,
        orderDate: String(row.날짜 || new Date().toISOString().slice(0, 10)),
        clientName: String(row.거래처명 ?? ""),
        contact: String(row.연락처 ?? ""),
        product: String(row["상품/서비스"] ?? ""),
        quantity,
        unitPrice,
        amount: Number(row.금액 ?? calcAmount(quantity, unitPrice)) || 0,
        status: String(row.상태 ?? "콜드콜"),
        assignee: String(row.담당자 ?? ""),
        memo: String(row.메모 ?? ""),
        hasDetail: detailHint,
      },
      update: {
        orderDate: String(row.날짜 || new Date().toISOString().slice(0, 10)),
        clientName: String(row.거래처명 ?? ""),
        contact: String(row.연락처 ?? ""),
        product: String(row["상품/서비스"] ?? ""),
        quantity,
        unitPrice,
        amount: Number(row.금액 ?? calcAmount(quantity, unitPrice)) || 0,
        status: String(row.상태 ?? "콜드콜"),
        assignee: String(row.담당자 ?? ""),
        memo: String(row.메모 ?? ""),
        hasDetail: detailHint,
      },
    });
    imported += 1;
  }

  console.log(`Imported ${imported} orders`);
  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error(err);
  process.exit(1);
});
