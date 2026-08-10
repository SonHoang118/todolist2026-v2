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
} from "@/lib/calendar/time";
import { TaskDTO, CompanyTaskDTO } from "@/lib/types";
import { differenceInMinutes } from "date-fns";

interface UseDragTaskOptions {
  columnDate: Date; // the day this column represents
  containerRef: React.RefObject<HTMLDivElement | null>;
}

/**
 * Returns mousedown handler for dragging a task.
 * All drag preview happens via Zustand store, zero API calls during drag.
 * On mouseup: one commit.
 */
export function useDragTask(
  task: TaskDTO | CompanyTaskDTO,
  { columnDate, containerRef }: UseDragTaskOptions
) {
  const { startDrag, endDrag, setGhost, clearGhost } = useDragStore();
  const updateTask = useUpdateTask();
  const updateCompanyTask = useUpdateCompanyTask();

  const dragState = useRef<{
    startMouseY: number;
    taskStartMin: number;
    taskDurationMin: number;
  } | null>(null);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const startMin =
        new Date(task.startTime).getHours() * 60 +
        new Date(task.startTime).getMinutes();
      const endMin =
        new Date(task.endTime).getHours() * 60 +
        new Date(task.endTime).getMinutes();
      const durationMin = differenceInMinutes(
        new Date(task.endTime),
        new Date(task.startTime)
      );

      dragState.current = {
        startMouseY: e.clientY,
        taskStartMin: startMin,
        taskDurationMin: durationMin,
      };

      startDrag(task.id);
      setGhost(
        (startMin / 60) * HOUR_HEIGHT,
        (durationMin / 60) * HOUR_HEIGHT
      );

      const onMouseMove = (me: MouseEvent) => {
        if (!dragState.current || !containerRef.current) return;

        const deltaY = me.clientY - dragState.current.startMouseY;
        const deltaMin = pxToMinutes(deltaY);
        const rawStart = dragState.current.taskStartMin + deltaMin;
        const snapped = snapMinutes(rawStart);
        const clamped = clampMinutes(
          snapped,
          0,
          TOTAL_MINUTES - dragState.current.taskDurationMin
        );

        setGhost(
          (clamped / 60) * HOUR_HEIGHT,
          (dragState.current.taskDurationMin / 60) * HOUR_HEIGHT
        );
      };

      const onMouseUp = async (me: MouseEvent) => {
        window.removeEventListener("mousemove", onMouseMove);
        window.removeEventListener("mouseup", onMouseUp);

        if (!dragState.current) return;

        const deltaY = me.clientY - dragState.current.startMouseY;
        const deltaMin = pxToMinutes(deltaY);
        const rawStart = dragState.current.taskStartMin + deltaMin;
        const snapped = snapMinutes(rawStart);
        const clamped = clampMinutes(
          snapped,
          0,
          TOTAL_MINUTES - dragState.current.taskDurationMin
        );

        const newStart = minutesToDate(columnDate, clamped);
        const newEnd = minutesToDate(
          columnDate,
          clamped + dragState.current.taskDurationMin
        );

        // Only commit if position actually changed
        if (
          newStart.getTime() !== new Date(task.startTime).getTime()
        ) {
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

        dragState.current = null;
        clearGhost();
        endDrag();
      };

      window.addEventListener("mousemove", onMouseMove);
      window.addEventListener("mouseup", onMouseUp);
    },
    [
      task,
      columnDate,
      containerRef,
      startDrag,
      endDrag,
      setGhost,
      clearGhost,
      updateTask,
      updateCompanyTask,
    ]
  );

  return { handleMouseDown };
}
