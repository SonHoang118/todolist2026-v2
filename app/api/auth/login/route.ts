import { prisma } from "@/lib/prisma";
import { apiError, apiOk } from "@/lib/api-helpers";
import bcrypt from "bcryptjs";
import { NextRequest } from "next/server";
import { getSession } from "@/lib/session";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body as { email: string; password: string };

    if (!email || !password) {
      return apiError("Email and password are required");
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return apiError("Invalid credentials", 401);

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return apiError("Invalid credentials", 401);

    const session = await getSession();
    session.userId = user.id;
    session.email = user.email;
    session.name = user.name;
    await session.save();

    return apiOk({
      id: user.id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
    });
  } catch (e) {
    // Log full error so it appears in Vercel Function logs
    console.error("[login] error:", e instanceof Error ? e.message : e);
    const msg = e instanceof Error ? e.message : "Server error";
    return apiError(msg, 500);
  }
}
