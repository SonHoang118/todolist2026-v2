import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/session";
import {
  apiOk,
  apiUnauthorized,
  apiError,
  apiForbidden,
} from "@/lib/api-helpers";
import { broadcast } from "@/lib/realtime/sse-server";
import { TaskLabel, TaskType } from "@prisma/client";
import { NextRequest } from "next/server";
import { CreateTaskInput } from "@/lib/types";

const TASK_INCLUDE = {
  owner: { select: { id: true, name: true, email: true, avatarUrl: true } },
  assigner: { select: { id: true, name: true, email: true, avatarUrl: true } },
} as const;

/** GET /api/tasks?ownerId=&from=&to= */
export async function GET(req: NextRequest) {
  let currentUser;
  try {
    currentUser = await requireAuth();
  } catch {
    return apiUnauthorized();
  }

  const { searchParams } = req.nextUrl;
  const ownerId = searchParams.get("ownerId");
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  if (!ownerId) return apiError("ownerId is required");

  // Visibility rules
  const tasks = await prisma.task.findMany({
    where: {
      ownerId,
      startTime: from ? { gte: new Date(from) } : undefined,
      endTime: to ? { lte: new Date(to) } : undefined,
      // Hide Personal tasks that don't belong to the viewer
      ...(ownerId !== currentUser.id
        ? { label: { not: TaskLabel.PERSONAL } }
        : {}),
    },
    include: TASK_INCLUDE,
    orderBy: { startTime: "asc" },
  });

  return apiOk(tasks);
}

/** POST /api/tasks */
export async function POST(req: NextRequest) {
  let currentUser;
  try {
    currentUser = await requireAuth();
  } catch {
    return apiUnauthorized();
  }

  const body = (await req.json()) as CreateTaskInput;
  const { title, description, color, startTime, endTime, ownerId, label } =
    body;

  if (!title || !startTime || !endTime || !ownerId) {
    return apiError("title, startTime, endTime, ownerId are required");
  }

  const start = new Date(startTime);
  const end = new Date(endTime);
  if (end <= start) return apiError("endTime must be after startTime");

  const isOwnCalendar = ownerId === currentUser.id;

  let type: TaskType;
  let effectiveLabel: TaskLabel;

  if (isOwnCalendar) {
    type = TaskType.PERSONAL;
    effectiveLabel = label ?? TaskLabel.DEFAULT;
  } else {
    // Creating on someone else's calendar → Assigned Task
    type = TaskType.ASSIGNED;
    effectiveLabel = TaskLabel.DEFAULT;
  }

  const task = await prisma.task.create({
    data: {
      title,
      description,
      color: color ?? "#3B82F6",
      startTime: start,
      endTime: end,
      type,
      label: effectiveLabel,
      ownerId,
      assignerId: isOwnCalendar ? null : currentUser.id,
    },
    include: TASK_INCLUDE,
  });

  broadcast({ type: "task:created", payload: task });

  return apiOk(task, 201);
}
