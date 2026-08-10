"use client";

import { useCallback, useRef } from "react";
import { useDragStore } from "@/store/dragStore";
import { useUpdateTask } from "@/hooks/useTasks";
import { useUpdateCompanyTask } from "@/hooks/useCompanyTasks";
import {
  pxToMinutes,
  snapMinutes,
  clampMinutes,
  minutesToDate,
  TOTAL_MINUTES,
  HOUR_HEIGHT,
  SNAP_MINUTES,
} from "@/lib/calendar/time";
import { TaskDTO, CompanyTaskDTO } from "@/lib/types";
import { differenceInMinutes } from "date-fns";

interface UseResizeTaskOptions {
  columnDate: Date;
}

export function useResizeTask(
  task: TaskDTO | CompanyTaskDTO,
  { columnDate }: UseResizeTaskOptions
) {
  const { startResize, endResize, setGhost, clearGhost } = useDragStore();
  const updateTask = useUpdateTask();
  const updateCompanyTask = useUpdateCompanyTask();

  const resizeState = useRef<{
    startMouseY: number;
    originalStartMin: number;
    originalEndMin: number;
    edge: "top" | "bottom";
  } | null>(null);

  const handleResizeMouseDown = useCallback(
    (e: React.MouseEvent, edge: "top" | "bottom") => {
      e.preventDefault();
      e.stopPropagation();

      const originalStartMin =
        new Date(task.startTime).getHours() * 60 +
        new Date(task.startTime).getMinutes();
      const originalEndMin =
        new Date(task.endTime).getHours() * 60 +
        new Date(task.endTime).getMinutes();

      resizeState.current = {
        startMouseY: e.clientY,
        originalStartMin,
        originalEndMin,
        edge,
      };

      startResize(task.id, edge);
      setGhost(
        (originalStartMin / 60) * HOUR_HEIGHT,
        ((originalEndMin - originalStartMin) / 60) * HOUR_HEIGHT
      );

      const onMouseMove = (me: MouseEvent) => {
        if (!resizeState.current) return;

        const deltaY = me.clientY - resizeState.current.startMouseY;
        const deltaMin = pxToMinutes(deltaY);
        const { originalStartMin, originalEndMin, edge } = resizeState.current;

        let newStartMin = originalStartMin;
        let newEndMin = originalEndMin;

        if (edge === "bottom") {
          newEndMin = snapMinutes(originalEndMin + deltaMin);
          newEndMin = clampMinutes(newEndMin, originalStartMin + SNAP_MINUTES, TOTAL_MINUTES);
        } else {
          newStartMin = snapMinutes(originalStartMin + deltaMin);
          newStartMin = clampMinutes(newStartMin, 0, originalEndMin - SNAP_MINUTES);
        }

        setGhost(
          (newStartMin / 60) * HOUR_HEIGHT,
          ((newEndMin - newStartMin) / 60) * HOUR_HEIGHT
        );
      };

      const onMouseUp = async (me: MouseEvent) => {
        window.removeEventListener("mousemove", onMouseMove);
        window.removeEventListener("mouseup", onMouseUp);

        if (!resizeState.current) return;

        const deltaY = me.clientY - resizeState.current.startMouseY;
        const deltaMin = pxToMinutes(deltaY);
        const { originalStartMin, originalEndMin, edge } = resizeState.current;

        let newStartMin = originalStartMin;
        let newEndMin = originalEndMin;

        if (edge === "bottom") {
          newEndMin = snapMinutes(originalEndMin + deltaMin);
          newEndMin = clampMinutes(newEndMin, originalStartMin + SNAP_MINUTES, TOTAL_MINUTES);
        } else {
          newStartMin = snapMinutes(originalStartMin + deltaMin);
          newStartMin = clampMinutes(newStartMin, 0, originalEndMin - SNAP_MINUTES);
        }

        const newStart = minutesToDate(columnDate, newStartMin);
        const newEnd = minutesToDate(columnDate, newEndMin);

        const startChanged =
          newStart.getTime() !== new Date(task.startTime).getTime();
        const endChanged =
          newEnd.getTime() !== new Date(task.endTime).getTime();

        if (startChanged || endChanged) {
          const payload = {
            startTime: newStart.toISOString(),
            endTime: newEnd.toISOString(),
          };
          if ("ownerId" in task) {
            await updateTask.mutateAsync({ id: task.id, data: payload });
          } else {
            await updateCompanyTask.mutateAsync({ id: task.id, data: payload });
          }
        }

        resizeState.current = null;
        clearGhost();
        endResize();
      };

      window.addEventListener("mousemove", onMouseMove);
      window.addEventListener("mouseup", onMouseUp);
    },
    [task, columnDate, startResize, endResize, setGhost, clearGhost, updateTask, updateCompanyTask]
  );

  return { handleResizeMouseDown };
}
