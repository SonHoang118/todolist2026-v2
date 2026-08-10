"use client";

import React, { memo, useCallback, useRef } from "react";
import {
  HOUR_HEIGHT,
  TOTAL_MINUTES,
  getTaskTop,
  getTaskHeight,
  minutesToPx,
} from "@/lib/calendar/time";
import { layoutTasks, LayoutTask } from "@/lib/calendar/layout";
import { TaskDTO, CompanyTaskDTO } from "@/lib/types";
import { CalendarTask } from "./CalendarTask";
import { TaskGhost } from "./TaskGhost";
import { GridBackground } from "./GridBackground";
import { useDragStore } from "@/store/dragStore";
import { useCalendarSelection } from "@/hooks/useCalendarSelection";
import { useUIStore } from "@/store/uiStore";

interface DayColumnProps {
  date: Date;
  tasks: Array<TaskDTO | CompanyTaskDTO>;
  ownerId: string; // userId or "company"
  isCurrentUser: boolean;
}

export const DayColumn = memo(function DayColumn({
  date,
  tasks,
  ownerId,
  isCurrentUser,
}: DayColumnProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { isDragging, isResizing, draggingTaskId, ghostTop, ghostHeight } =
    useDragStore();
  const { openCreateTask } = useUIStore();

  const handleSelect = useCallback(
    (startTime: Date, endTime: Date, ownerIdArg: string) => {
      openCreateTask({ startTime, endTime, ownerId: ownerIdArg });
    },
    [openCreateTask]
  );

  const { selection, handleMouseDown } = useCalendarSelection({
    columnDate: date,
    ownerId,
    onSelect: handleSelect,
    containerRef,
  });

  const layouted = layoutTasks(tasks);

  return (
    <div
      ref={containerRef}
      className="relative flex-1 min-w-0 border-l border-gray-100 select-none"
      style={{ height: minutesToPx(TOTAL_MINUTES) }}
    >
      <GridBackground onMouseDown={handleMouseDown} />

      {/* Selection preview */}
      {selection && (
        <div
          className="absolute left-0 right-0 bg-blue-100 border border-blue-400 opacity-70 z-10 pointer-events-none rounded"
          style={{
            top: minutesToPx(selection.startMin),
            height: minutesToPx(selection.endMin - selection.startMin),
          }}
        />
      )}

      {/* Task ghost during drag/resize */}
      {(isDragging || isResizing) && ghostTop !== null && ghostHeight !== null && (
        <TaskGhost top={ghostTop} height={ghostHeight} />
      )}

      {/* Rendered tasks */}
      {layouted.map(({ task, column, totalColumns }) => {
        const isBeingDragged = draggingTaskId === task.id;
        return (
          <CalendarTask
            key={task.id}
            task={task}
            column={column}
            totalColumns={totalColumns}
            columnDate={date}
            containerRef={containerRef}
            dimmed={isBeingDragged}
          />
        );
      })}
    </div>
  );
});
