import { auth, signOut } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import DashboardClient from "@/components/dashboard-client";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.email) redirect("/");

  const user = await prisma.user.findUnique({ where: { email: session.user.email }, select: { id: true, email: true, name: true } });
  if (!user) redirect("/");

  const tx = await prisma.transaction.findMany({ where: { userId: user.id }, orderBy: { happenedAt: "desc" }, take: 200 });

  return (
    <main className="min-h-screen bg-brut-bg text-brut-fg p-6 md:p-10">
      <div className="mx-auto max-w-5xl grid gap-4">
        <div className="brutal-box flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h1 className="text-3xl font-black">Dashboard Keuangan</h1>
            <p className="font-semibold">Halo, {user.name || user.email}</p>
          </div>
          <form action={async () => { "use server"; await signOut({ redirectTo: "/" }); }}>
            <button className="brut-btn bg-white" type="submit">Logout</button>
          </form>
        </div>

        <DashboardClient initial={tx.map((t) => ({ ...t, amount: Number(t.amount) }))} />
      </div>
    </main>
  );
}
