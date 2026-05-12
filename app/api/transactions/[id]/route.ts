import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

async function currentUserId() {
  const session = await auth();
  const email = session?.user?.email;
  if (!email) return null;
  const user = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  return user?.id ?? null;
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const userId = await currentUserId();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  await prisma.transaction.deleteMany({ where: { id: params.id, userId } });
  return Response.json({ ok: true });
}
