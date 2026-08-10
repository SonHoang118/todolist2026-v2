import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/session";
import {
  apiOk,
  apiUnauthorized,
  apiError,
  apiForbidden,
  apiNotFound,
} from "@/lib/api-helpers";
import { broadcast } from "@/lib/realtime/sse-server";
import { NextRequest } from "next/server";
import { UpdateCompanyTaskInput } from "@/lib/types";

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

/** PATCH /api/company-tasks/[id] */
export async function PATCH(
  req: NextRequest,
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

  // Only the creator can edit
  if (task.createdById !== currentUser.id) return apiForbidden();

  const body = (await req.json()) as UpdateCompanyTaskInput;

  if (body.startTime && body.endTime) {
    const start = new Date(body.startTime);
    const end = new Date(body.endTime);
    if (end <= start) return apiError("endTime must be after startTime");
  }

  const updated = await prisma.companyTask.update({
    where: { id },
    data: {
      title: body.title,
      description: body.description,
      color: body.color,
      startTime: body.startTime ? new Date(body.startTime) : undefined,
      endTime: body.endTime ? new Date(body.endTime) : undefined,
      updatedById: currentUser.id,
    },
    include: COMPANY_TASK_INCLUDE,
  });

  broadcast({ type: "companytask:updated", payload: updated });

  return apiOk(updated);
}

/** DELETE /api/company-tasks/[id] */
export async function DELETE(
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

  if (task.createdById !== currentUser.id) return apiForbidden();

  await prisma.companyTask.delete({ where: { id } });
  broadcast({ type: "companytask:deleted", payload: { id } });

  return apiOk({ ok: true });
}
