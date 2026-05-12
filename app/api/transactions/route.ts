import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createSchema = z.object({
  title: z.string().min(1).max(120),
  amount: z.number().positive(),
  type: z.enum(["INCOME", "EXPENSE"]),
  category: z.string().max(60).optional(),
  notes: z.string().max(300).optional(),
  happenedAt: z.string(),
});

async function currentUserId() {
  const session = await auth();
  const email = session?.user?.email;
  if (!email) return null;
  const user = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  return user?.id ?? null;
}

export async function GET() {
  const userId = await currentUserId();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const rows = await prisma.transaction.findMany({
    where: { userId },
    orderBy: { happenedAt: "desc" },
    take: 200,
  });

  return Response.json(rows);
}

export async function POST(req: Request) {
  const userId = await currentUserId();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = createSchema.parse(await req.json());

  const row = await prisma.transaction.create({
    data: {
      userId,
      title: parsed.title,
      amount: parsed.amount,
      type: parsed.type,
      category: parsed.category,
      notes: parsed.notes,
      happenedAt: new Date(parsed.happenedAt),
    },
  });

  return Response.json(row);
}
