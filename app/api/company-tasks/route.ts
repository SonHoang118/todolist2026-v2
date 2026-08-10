import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/session";
import {
  apiOk,
  apiUnauthorized,
  apiError,
} from "@/lib/api-helpers";
import { broadcast } from "@/lib/realtime/sse-server";
import { NextRequest } from "next/server";
import { CreateCompanyTaskInput } from "@/lib/types";

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

/** GET /api/company-tasks?from=&to= */
export async function GET(req: NextRequest) {
  try {
    await requireAuth();
  } catch {
    return apiUnauthorized();
  }

  const { searchParams } = req.nextUrl;
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const tasks = await prisma.companyTask.findMany({
    where: {
      startTime: from ? { gte: new Date(from) } : undefined,
      endTime: to ? { lte: new Date(to) } : undefined,
    },
    include: COMPANY_TASK_INCLUDE,
    orderBy: { startTime: "asc" },
  });

  return apiOk(tasks);
}

/** POST /api/company-tasks */
export async function POST(req: NextRequest) {
  let currentUser;
  try {
    currentUser = await requireAuth();
  } catch {
    return apiUnauthorized();
  }

  const body = (await req.json()) as CreateCompanyTaskInput;
  const { title, description, color, startTime, endTime } = body;

  if (!title || !startTime || !endTime) {
    return apiError("title, startTime, endTime are required");
  }

  const start = new Date(startTime);
  const end = new Date(endTime);
  if (end <= start) return apiError("endTime must be after startTime");

  const task = await prisma.companyTask.create({
    data: {
      title,
      description,
      color: color ?? "#8B5CF6",
      startTime: start,
      endTime: end,
      createdById: currentUser.id,
      updatedById: currentUser.id,
      // Auto-confirm creator
      confirms: {
        create: { userId: currentUser.id },
      },
    },
    include: COMPANY_TASK_INCLUDE,
  });

  broadcast({ type: "companytask:created", payload: task });

  return apiOk(task, 201);
}
