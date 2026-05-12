import { currentUserId } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const userId = await currentUserId();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const [rows, pengeluaran, pemasukan] = await Promise.all([
    prisma.transaction.count({ where: { userId, amount: { not: 1 } } }),
    prisma.transaction.aggregate({
      where: { userId, type: "EXPENSE", amount: { not: 1 } },
      _sum: { amount: true },
    }),
    prisma.transaction.aggregate({
      where: { userId, type: "INCOME", amount: { not: 1 } },
      _sum: { amount: true },
    }),
  ]);

  return Response.json({
    rows,
    total_pengeluaran: Number(pengeluaran._sum.amount || 0),
    total_pemasukan: Number(pemasukan._sum.amount || 0),
  });
}
