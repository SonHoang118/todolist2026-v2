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
import { TaskStatus, TaskType } from "@prisma/client";
import { NextRequest } from "next/server";
import { UpdateTaskInput } from "@/lib/types";

const TASK_INCLUDE = {
  owner: { select: { id: true, name: true, email: true, avatarUrl: true } },
  assigner: { select: { id: true, name: true, email: true, avatarUrl: true } },
} as const;

/** PATCH /api/tasks/[id] */
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
  const task = await prisma.task.findUnique({ where: { id }, include: TASK_INCLUDE });
  if (!task) return apiNotFound("Task");

  const body = (await req.json()) as UpdateTaskInput;

  // Permission rules
  const isOwner = task.ownerId === currentUser.id;
  const isAssigner = task.assignerId === currentUser.id;

  if (!isOwner && !isAssigner) return apiForbidden();

  // Assigner can only edit title/description/color/time - not status
  if (isAssigner && !isOwner && body.status !== undefined) {
    return apiForbidden();
  }

  // Owner of ASSIGNED task can only change status
  if (isOwner && task.type === TaskType.ASSIGNED) {
    // Restrict to status change + accept rule
    if (body.status === TaskStatus.ACCEPTED) {
      if (task.status !== TaskStatus.PENDING) {
        return apiError("Task is not in PENDING state");
      }
    }
    if (body.status === TaskStatus.DONE) {
      if (task.status !== TaskStatus.ACCEPTED) {
        return apiError("Task must be ACCEPTED before marking DONE");
      }
    }
    if (body.status === TaskStatus.PENDING) {
      // Undo DONE
      if (task.status !== TaskStatus.DONE) {
        return apiError("Task is not DONE");
      }
    }
  }

  const updated = await prisma.task.update({
    where: { id },
    data: {
      title: body.title,
      description: body.description,
      color: body.color,
      startTime: body.startTime ? new Date(body.startTime) : undefined,
      endTime: body.endTime ? new Date(body.endTime) : undefined,
      label: body.label,
      status: body.status,
    },
    include: TASK_INCLUDE,
  });

  broadcast({ type: "task:updated", payload: updated });

  return apiOk(updated);
}

/** DELETE /api/tasks/[id] */
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
  const task = await prisma.task.findUnique({ where: { id } });
  if (!task) return apiNotFound("Task");

  const isOwner = task.ownerId === currentUser.id;
  const isAssigner = task.assignerId === currentUser.id;

  if (!isOwner && !isAssigner) return apiForbidden();

  await prisma.task.delete({ where: { id } });
  broadcast({ type: "task:deleted", payload: { id } });

  return apiOk({ ok: true });
}
