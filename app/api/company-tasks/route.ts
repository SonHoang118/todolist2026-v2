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
    try {
      await requireAuth();
    } catch {
      return apiUnauthorized();
    }

    const { searchParams } = req.nextUrl;
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    const fromDate = from ? new Date(from) : null;
    const toDate = to ? new Date(to) : null;

    if ((from && Number.isNaN(fromDate?.getTime())) || (to && Number.isNaN(toDate?.getTime()))) {
      return apiError("Invalid date format for from/to", 400);
    }

    const tasks = await prisma.companyTask.findMany({
      where: {
        ...(fromDate || toDate
          ? {
              AND: [
                fromDate ? { endTime: { gte: fromDate } } : {},
                toDate ? { startTime: { lte: toDate } } : {},
              ],
            }
          : {}),
      },
      include: COMPANY_TASK_INCLUDE,
      orderBy: { startTime: "asc" },
    });

    return apiOk(tasks);
  } catch (e) {
    console.error("[company-tasks][GET] error:", e);
    return apiError("Failed to load company tasks", 500);
  }
}

/** POST /api/company-tasks */
export async function POST(req: NextRequest) {
  try {
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
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return apiError("Invalid startTime/endTime format", 400);
    }
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
  } catch (e) {
    console.error("[company-tasks][POST] error:", e);
    return apiError("Failed to create company task", 500);
  }
}
