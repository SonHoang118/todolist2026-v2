import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/session";
import {
  apiOk,
  apiUnauthorized,
  apiError,
  apiNotFound,
} from "@/lib/api-helpers";
import { broadcast } from "@/lib/realtime/sse-server";
import { NextRequest } from "next/server";

const COMPANY_TASK_INCLUDE = {
  createdBy: { select: { id: true, name: true, email: true, avatarUrl: true } },
  updatedBy: { select: { id: true, name: true, email: true, avatarUrl: true } },
  confirms: {
    include: {
      user: { select: { id: true, name: true, email: true, avatarUrl: true } },
    },
    orderBy: { confirmedAt: "asc" as const },
  },
} as const;

/** POST /api/company-tasks/[id]/confirm */
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let currentUser;
  try {
    currentUser = await requireAuth();
  } catch {
    return apiUnauthorized();
  }

  const { id } = await params;
  const task = await prisma.companyTask.findUnique({ where: { id } });
  if (!task) return apiNotFound("Company task");

  // Upsert confirm (idempotent)
  await prisma.companyTaskConfirm.upsert({
    where: { companyTaskId_userId: { companyTaskId: id, userId: currentUser.id } },
    create: { companyTaskId: id, userId: currentUser.id },
    update: {},
  });

  const updated = await prisma.companyTask.findUnique({
    where: { id },
    include: COMPANY_TASK_INCLUDE,
  });

  broadcast({ type: "companytask:confirmed", payload: updated });

  return apiOk(updated);
}
