import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(2).max(80).optional(),
  email: z.string().email(),
  password: z.string().min(6),
});

export async function POST(req: Request) {
  try {
    const parsed = schema.parse(await req.json());

    const exists = await prisma.user.findUnique({ where: { email: parsed.email } });
    if (exists) {
      return Response.json({ error: "Email sudah terdaftar" }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(parsed.password, 10);
    await prisma.user.create({
      data: {
        name: parsed.name,
        email: parsed.email,
        passwordHash,
      },
    });

    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: "Input tidak valid", detail: String(error) }, { status: 400 });
  }
}
