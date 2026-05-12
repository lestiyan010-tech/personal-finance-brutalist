import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function currentUserId() {
  const session = await auth();
  const email = session?.user?.email;
  if (!email) return null;

  const user = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  return user?.id ?? null;
}
