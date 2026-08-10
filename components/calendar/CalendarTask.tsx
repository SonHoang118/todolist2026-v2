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
import { TaskStatus, TaskType } from "@/lib/types";
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
  const { handleMouseDown: handleDragStart, handleTouchStart } = useDragTask(task, {
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
  const isAssignedPending =
    "ownerId" in task &&
    (task as TaskDTO).type === TaskType.ASSIGNED &&
    (task as TaskDTO).status === TaskStatus.PENDING;
  const assigner = "assigner" in task ? (task as TaskDTO).assigner : null;

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
        "absolute z-20 rounded-xl overflow-hidden cursor-grab active:cursor-grabbing group border",
        dimmed && "opacity-30",
        isDone && "opacity-60",
        isAssignedPending ? "border-[#ff2e66]" : "border-black/10"
      )}
      style={{
        top,
        height: Math.max(height, minutesToPx(SNAP_MINUTES)),
        left: `${leftPct + 1}%`,
        width: `${widthPct - 2}%`,
        backgroundColor: isAssignedPending ? "#0b6a4b" : task.color,
      }}
      onMouseDown={handleDragStart}
      onTouchStart={handleTouchStart}
      onClick={handleClick}
    >
      {isAssignedPending && (
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-[#ff2e66]" />
      )}

      {/* Content */}
      <div className="px-2 py-1.5 h-full flex flex-col overflow-hidden pointer-events-none">
        <p className={cn("text-white text-[13px] font-semibold leading-tight truncate", isDone && "line-through")}>
          {task.title}
        </p>
        <p className="text-white/85 text-[10px] leading-tight truncate mt-0.5">
          {formatTime(new Date(task.startTime))} – {formatTime(new Date(task.endTime))}
        </p>
        {isAssignedPending && (
          <span className="inline-block mt-auto mb-1 w-fit px-2 py-0.5 text-[10px] rounded-full border border-white/40 text-white/95 font-medium">
            Dang cho
          </span>
        )}
        {assigner && (
          <div className="mt-auto flex items-center gap-1.5 text-[10px] text-white/85">
            <span>from:</span>
            <img
              src={assigner.avatarUrl || "https://i.pravatar.cc/40?img=12"}
              alt={assigner.name}
              className="w-4 h-4 rounded-full object-cover"
            />
          </div>
        )}
      </div>

      {/* Resize handles */}
      <TaskResizeHandle edge="top" onMouseDown={handleResizeMouseDown} />
      <TaskResizeHandle edge="bottom" onMouseDown={handleResizeMouseDown} />
    </div>
  );
});
