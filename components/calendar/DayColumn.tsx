"use client";

import React, { memo, useCallback, useRef } from "react";
import {
  TOTAL_MINUTES,
  minutesToPx,
} from "@/lib/calendar/time";
import { layoutTasks } from "@/lib/calendar/layout";
import { TaskDTO, CompanyTaskDTO } from "@/lib/types";
import { CalendarTask } from "./CalendarTask";
import { TaskGhost } from "./TaskGhost";
import { GridBackground } from "./GridBackground";
import { useDragStore } from "@/store/dragStore";
import { useCalendarSelection } from "@/hooks/useCalendarSelection";
import { useCreateTask } from "@/hooks/useTasks";
import { useCreateCompanyTask } from "@/hooks/useCompanyTasks";
import { useInteractionStore } from "@/store/interactionStore";

const QUICK_TASK_TITLES = [
  "Di khao sat cong trinh",
  "Di gap khach hang",
  "Hop checklist tien do",
  "Kiem tra vat tu dau vao",
  "Nghiem thu hang muc A",
  "Chot lich thi cong",
  "Ra soat bao gia",
  "Hop dieu phoi doi thi cong",
  "Xu ly phat sinh tai cong truong",
  "Theo doi ke hoach do be tong",
  "Lam viec voi nha thau phu",
  "Cap nhat bien ban hien truong",
  "Do dac va chup anh bao cao",
  "Kiem tra an toan lao dong",
  "Tong hop cong viec cuoi ngay",
];

function pickRandom<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

interface DayColumnProps {
  date: Date;
  tasks: Array<TaskDTO | CompanyTaskDTO>;
  ownerId: string; // userId or "company"
  isCurrentUser: boolean;
  highlight?: boolean;
  dayWidth?: number;
  columnIndex?: number;
}

export const DayColumn = memo(function DayColumn({
  date,
  tasks,
  ownerId,
  isCurrentUser,
  highlight,
  dayWidth,
  columnIndex,
}: DayColumnProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const {
    isDragging,
    isResizing,
    draggingTaskId,
    ghostTop,
    ghostHeight,
    ghostColumn,
  } = useDragStore();
  const createTask = useCreateTask();
  const createCompanyTask = useCreateCompanyTask();
  const creatingRef = useRef(false);
  const { resizeTaskId, exitResizeMode, enterResizeMode, showBadge } =
    useInteractionStore();

  const handleSelect = useCallback(
    async (startTime: Date, endTime: Date, ownerIdArg: string) => {
      if (resizeTaskId) {
        exitResizeMode();
        return;
      }

      if (creatingRef.current) return;
      creatingRef.current = true;

      const title = pickRandom(QUICK_TASK_TITLES);
      const description = "Nhan de chinh sua chi tiet sau khi tao";

      try {
        if (ownerIdArg === "company") {
          const created = await createCompanyTask.mutateAsync({
            title,
            description,
            color: "#0c6f4f",
            startTime: startTime.toISOString(),
            endTime: endTime.toISOString(),
          });
          enterResizeMode(created.id, "Keo thanh duoi de chinh thoi luong");
          showBadge("Da tao task moi");
        } else {
          const created = await createTask.mutateAsync({
            title,
            description,
            color: "#0c6f4f",
            startTime: startTime.toISOString(),
            endTime: endTime.toISOString(),
            ownerId: ownerIdArg,
          });
          enterResizeMode(created.id, "Keo thanh duoi de chinh thoi luong");
          showBadge("Da tao task moi");
        }
      } finally {
        creatingRef.current = false;
      }
    },
    [
      createTask,
      createCompanyTask,
      resizeTaskId,
      exitResizeMode,
      enterResizeMode,
      showBadge,
    ]
  );

  const { selection, handleMouseDown, handleTouchStart } = useCalendarSelection({
    columnDate: date,
    ownerId,
    onSelect: handleSelect,
    containerRef,
  });

  const layouted = layoutTasks(tasks);
  const activeTaskColor = tasks.find((t) => t.id === draggingTaskId)?.color;

  return (
    <div
      ref={containerRef}
      data-column-index={columnIndex ?? 0}
      className={`relative flex-1 min-w-0 border-l border-white/5 select-none ${
        highlight ? "bg-[#171127]" : "bg-[#0b0b12]"
      }`}
      style={{ height: minutesToPx(TOTAL_MINUTES), width: dayWidth ?? 100, flex: "0 0 auto" }}
    >
      <GridBackground onMouseDown={handleMouseDown} onTouchStart={handleTouchStart} />

      {/* Selection preview */}
      {selection && (
        <div
          className="absolute left-0 right-0 bg-[#9158ff]/35 border border-[#9f62ff] opacity-90 z-10 pointer-events-none rounded"
          style={{
            top: minutesToPx(selection.startMin),
            height: minutesToPx(selection.endMin - selection.startMin),
          }}
        />
      )}

      {/* Task ghost during drag/resize */}
      {(isDragging || isResizing) &&
        ghostTop !== null &&
        ghostHeight !== null &&
        (ghostColumn === null || ghostColumn === (columnIndex ?? 0)) && (
        <TaskGhost top={ghostTop} height={ghostHeight} color={activeTaskColor} />
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
