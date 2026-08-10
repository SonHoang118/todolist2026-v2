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
import { useDragStore } from "@/store/dragStore";
import { useInteractionStore } from "@/store/interactionStore";

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
  const { openEditTask, openEditCompanyTask, openConfirmDelete } = useUIStore();
  const {
    isDragging,
    isResizing,
    resizingTaskId,
    ghostTop,
    ghostHeight,
    draggingTaskId,
    floatingX,
    floatingY,
    floatingTilt,
  } =
    useDragStore();
  const { floatingWidth, floatingHeight } = useDragStore();
  const {
    resizeTaskId,
    holdingTaskId,
    consumeSuppressedTaskTap,
    enterResizeMode,
    exitResizeMode,
  } = useInteractionStore();
  const { handleMouseDown: handleDragStart, handleTouchStart } = useDragTask(task, {
    columnDate,
    containerRef,
  });
  const { handleResizeMouseDown, handleResizeTouchStart } = useResizeTask(task, {
    columnDate,
  });

  const top = getTaskTop(new Date(task.startTime));
  const height = getTaskHeight(
    new Date(task.startTime),
    new Date(task.endTime)
  );
  const widthPct = 100 / totalColumns;
  const leftPct = column * widthPct;

  const status = "status" in task ? (task as TaskDTO).status : null;
  const isDone = status === TaskStatus.DONE;
  const isHolding = holdingTaskId === task.id;
  const isResizeMode = resizeTaskId === task.id;
  const isGhostSource = isDragging && draggingTaskId === task.id;
  const isLiveResizing = isResizing && resizingTaskId === task.id;
  const isAssignedPending =
    "ownerId" in task &&
    (task as TaskDTO).type === TaskType.ASSIGNED &&
    (task as TaskDTO).status === TaskStatus.PENDING;
  const assigner = "assigner" in task ? (task as TaskDTO).assigner : null;

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();

      if (consumeSuppressedTaskTap(task.id)) {
        return;
      }

      if (isResizeMode) {
        if ("ownerId" in task) {
          openEditTask(task.id);
        } else {
          openEditCompanyTask(task.id);
        }
        return;
      }

      if ("ownerId" in task) {
        openEditTask(task.id);
      } else {
        openEditCompanyTask(task.id);
      }
    },
    [
      task,
      openEditTask,
      openEditCompanyTask,
      consumeSuppressedTaskTap,
      isResizeMode,
    ]
  );

  const handleQuickDelete = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      e.stopPropagation();
      openConfirmDelete(task.id, "ownerId" in task ? "task" : "company-task");
    },
    [openConfirmDelete, task]
  );

  const handleQuickEdit = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
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
    <>
      <div
        className={cn(
          "absolute z-20 rounded-xl overflow-hidden cursor-grab active:cursor-grabbing group border transition-all duration-150",
          dimmed && "opacity-30",
          isGhostSource && "opacity-5",
          isDone && "opacity-60",
          isAssignedPending ? "border-[#ff2e66]" : "border-black/10",
          isHolding && "scale-[0.98] ring-2 ring-[#a265ff] ring-offset-1 ring-offset-transparent",
          isResizeMode && "ring-2 ring-[#ad7bff] brightness-110"
        )}
        style={{
          top: isLiveResizing && ghostTop !== null ? ghostTop : top,
          height:
            isLiveResizing && ghostHeight !== null
              ? Math.max(ghostHeight, minutesToPx(SNAP_MINUTES))
              : Math.max(height, minutesToPx(SNAP_MINUTES)),
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

        {isResizeMode && (
          <div className="absolute top-1 right-1 z-40 flex items-center gap-1">
            <button
              onMouseDown={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
              onClick={handleQuickEdit}
              className="w-6 h-6 rounded-full bg-black/35 text-white text-[10px] font-semibold"
            >
              E
            </button>
            <button
              onMouseDown={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
              onClick={handleQuickDelete}
              className="w-6 h-6 rounded-full bg-[#ff2f63] text-white text-[10px] font-semibold"
            >
              D
            </button>
            <button
              onMouseDown={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                exitResizeMode();
              }}
              className="w-6 h-6 rounded-full bg-black/35 text-white text-[10px] font-semibold"
            >
              X
            </button>
          </div>
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
        <TaskResizeHandle
          edge="bottom"
          onMouseDown={handleResizeMouseDown}
          onTouchStart={handleResizeTouchStart}
          visible={isResizeMode}
        />
      </div>

      {isGhostSource && floatingX !== null && floatingY !== null && (
        <div
          className="fixed z-50 pointer-events-none rounded-xl border border-white/20 bg-[#0b6a4b] text-white shadow-[0_10px_24px_rgba(0,0,0,0.40)]"
          style={{
            width: floatingWidth ?? undefined,
            height: floatingHeight ?? undefined,
            left: floatingX - (floatingWidth ?? 120) / 2,
            top: floatingY - (floatingHeight ?? 40) / 2,
            transform: `rotate(${floatingTilt.toFixed(2)}deg) scale(1.015)`,
            transformOrigin: "center center",
          }}
        >
          <div className="px-2 py-1.5 h-full flex flex-col">
            <p className="text-xs font-semibold truncate">{task.title}</p>
            <p className="text-[10px] text-white/80 truncate mt-0.5">
              {formatTime(new Date(task.startTime))} – {formatTime(new Date(task.endTime))}
            </p>
          </div>
        </div>
      )}
    </>
  );
});
