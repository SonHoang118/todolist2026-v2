import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { apiOk, apiUnauthorized } from "@/lib/api-helpers";

export async function GET() {
  const sessionUser = await getCurrentUser();
  if (!sessionUser) return apiUnauthorized();

  const user = await prisma.user.findUnique({
    where: { id: sessionUser.id },
    select: { id: true, email: true, name: true, avatarUrl: true },
  });
  if (!user) return apiUnauthorized();

  return apiOk(user);
}
