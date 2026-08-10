import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/session";
import { apiOk, apiUnauthorized } from "@/lib/api-helpers";

export async function GET() {
  try {
    await requireAuth();
  } catch {
    return apiUnauthorized();
  }

  const users = await prisma.user.findMany({
    select: { id: true, email: true, name: true, avatarUrl: true },
    orderBy: { name: "asc" },
  });

  return apiOk(users);
}
