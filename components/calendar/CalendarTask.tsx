"use client";

import React, { memo, useCallback } from "react";
import { TaskDTO, CompanyTaskDTO } from "@/lib/types";
import {
  getTaskTop,
  getTaskHeight,
  formatTime,
  minutesToPx,
  SNAP_MINUTES,
} from "@/lib/calendar/time";
import { useDragTask } from "@/hooks/useDragTask";
import { useResizeTask } from "@/hooks/useResizeTask";
import { useUIStore } from "@/store/uiStore";
import { TaskResizeHandle } from "./TaskResizeHandle";
import { TaskStatus } from "@prisma/client";
import { cn } from "@/lib/utils";

const STATUS_OPACITY: Record<TaskStatus, string> = {
  PENDING: "opacity-100",
  ACCEPTED: "opacity-100",
  DONE: "opacity-60",
};

interface CalendarTaskProps {
  task: TaskDTO | CompanyTaskDTO;
  column: number;
  totalColumns: number;
  columnDate: Date;
  containerRef: React.RefObject<HTMLDivElement | null>;
  dimmed?: boolean;
}

export const CalendarTask = memo(function CalendarTask({
  task,
  column,
  totalColumns,
  columnDate,
  containerRef,
  dimmed,
}: CalendarTaskProps) {
  const { openEditTask, openEditCompanyTask } = useUIStore();
  const { handleMouseDown: handleDragStart } = useDragTask(task, {
    columnDate,
    containerRef,
  });
  const { handleResizeMouseDown } = useResizeTask(task, { columnDate });

  const top = getTaskTop(new Date(task.startTime));
  const height = getTaskHeight(
    new Date(task.startTime),
    new Date(task.endTime)
  );
  const widthPct = 100 / totalColumns;
  const leftPct = column * widthPct;

  const status = "status" in task ? (task as TaskDTO).status : null;
  const isDone = status === TaskStatus.DONE;

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if ("ownerId" in task) {
        openEditTask(task.id);
      } else {
        openEditCompanyTask(task.id);
      }
    },
    [task, openEditTask, openEditCompanyTask]
  );

  return (
    <div
      className={cn(
        "absolute z-20 rounded overflow-hidden cursor-grab active:cursor-grabbing group",
        dimmed && "opacity-30",
        isDone && "opacity-60"
      )}
      style={{
        top,
        height: Math.max(height, minutesToPx(SNAP_MINUTES)),
        left: `${leftPct + 1}%`,
        width: `${widthPct - 2}%`,
        backgroundColor: task.color,
      }}
      onMouseDown={handleDragStart}
      onClick={handleClick}
    >
      {/* Content */}
      <div className="px-1 py-0.5 h-full flex flex-col overflow-hidden pointer-events-none">
        <p className={cn("text-white text-xs font-medium leading-tight truncate", isDone && "line-through")}>
          {task.title}
        </p>
        <p className="text-white/80 text-[10px] leading-tight truncate mt-0.5">
          {formatTime(new Date(task.startTime))} – {formatTime(new Date(task.endTime))}
        </p>
        {"assigner" in task && (task as TaskDTO).assigner && (
          <p className="text-white/70 text-[10px] leading-tight truncate mt-auto">
            From: {(task as TaskDTO).assigner!.name}
          </p>
        )}
      </div>

      {/* Resize handles */}
      <TaskResizeHandle edge="top" onMouseDown={handleResizeMouseDown} />
      <TaskResizeHandle edge="bottom" onMouseDown={handleResizeMouseDown} />
    </div>
  );
});
