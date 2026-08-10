"use client";

import { useCallback, useRef } from "react";
import { useDragStore } from "@/store/dragStore";
import { useUpdateTask } from "@/hooks/useTasks";
import { useUpdateCompanyTask } from "@/hooks/useCompanyTasks";
import { useInteractionStore } from "@/store/interactionStore";
import {
  pxToMinutes,
  clampMinutes,
  minutesToDate,
  TOTAL_MINUTES,
  HOUR_HEIGHT,
} from "@/lib/calendar/time";
import { TaskDTO, CompanyTaskDTO } from "@/lib/types";

const RESIZE_STEP_MINUTES = 30;

function snapToStep(minutes: number): number {
  return Math.round(minutes / RESIZE_STEP_MINUTES) * RESIZE_STEP_MINUTES;
}

interface UseResizeTaskOptions {
  columnDate: Date;
}

export function useResizeTask(
  task: TaskDTO | CompanyTaskDTO,
  { columnDate }: UseResizeTaskOptions
) {
  const { startResize, endResize, setGhost, clearGhost } = useDragStore();
  const { showBadge } = useInteractionStore();
  const updateTask = useUpdateTask();
  const updateCompanyTask = useUpdateCompanyTask();

  const resizeState = useRef<{
    startMouseY: number;
    originalStartMin: number;
    originalEndMin: number;
    edge: "top" | "bottom";
  } | null>(null);

  const computeResize = useCallback((clientY: number) => {
    if (!resizeState.current) return null;

    const deltaY = clientY - resizeState.current.startMouseY;
    const deltaMin = pxToMinutes(deltaY);
    const { originalStartMin, originalEndMin, edge } = resizeState.current;

    let newStartMin = originalStartMin;
    let newEndMin = originalEndMin;

    if (edge === "bottom") {
      newEndMin = snapToStep(originalEndMin + deltaMin);
      newEndMin = clampMinutes(
        newEndMin,
        originalStartMin + RESIZE_STEP_MINUTES,
        TOTAL_MINUTES
      );
    } else {
      newStartMin = snapToStep(originalStartMin + deltaMin);
      newStartMin = clampMinutes(
        newStartMin,
        0,
        originalEndMin - RESIZE_STEP_MINUTES
      );
    }

    return { newStartMin, newEndMin };
  }, []);

  const commitResize = useCallback(
    async (clientY: number) => {
      const result = computeResize(clientY);
      if (!result) return;

      const { newStartMin, newEndMin } = result;
      const newStart = minutesToDate(columnDate, newStartMin);
      const newEnd = minutesToDate(columnDate, newEndMin);

      const startChanged = newStart.getTime() !== new Date(task.startTime).getTime();
      const endChanged = newEnd.getTime() !== new Date(task.endTime).getTime();

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

        const nextDuration = newEndMin - newStartMin;
        showBadge(`Thoi luong moi ${nextDuration} phut`);
      }

      resizeState.current = null;
      clearGhost();
      endResize();
    },
    [
      computeResize,
      columnDate,
      task,
      updateTask,
      updateCompanyTask,
      showBadge,
      clearGhost,
      endResize,
    ]
  );

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
        const result = computeResize(me.clientY);
        if (!result) return;
        const { newStartMin, newEndMin } = result;

        setGhost(
          (newStartMin / 60) * HOUR_HEIGHT,
          ((newEndMin - newStartMin) / 60) * HOUR_HEIGHT
        );
      };

      const onMouseUp = async (me: MouseEvent) => {
        window.removeEventListener("mousemove", onMouseMove);
        window.removeEventListener("mouseup", onMouseUp);
        await commitResize(me.clientY);
      };

      window.addEventListener("mousemove", onMouseMove);
      window.addEventListener("mouseup", onMouseUp);
    },
    [task, startResize, setGhost, computeResize, commitResize]
  );

  const handleResizeTouchStart = useCallback(
    (e: React.TouchEvent, edge: "top" | "bottom") => {
      e.preventDefault();
      e.stopPropagation();

      const touch = e.touches[0];
      if (!touch) return;

      const originalStartMin =
        new Date(task.startTime).getHours() * 60 +
        new Date(task.startTime).getMinutes();
      const originalEndMin =
        new Date(task.endTime).getHours() * 60 +
        new Date(task.endTime).getMinutes();

      resizeState.current = {
        startMouseY: touch.clientY,
        originalStartMin,
        originalEndMin,
        edge,
      };

      startResize(task.id, edge);
      setGhost(
        (originalStartMin / 60) * HOUR_HEIGHT,
        ((originalEndMin - originalStartMin) / 60) * HOUR_HEIGHT
      );

      const onTouchMove = (te: TouchEvent) => {
        const nextTouch = te.touches[0];
        if (!nextTouch) return;
        te.preventDefault();

        const result = computeResize(nextTouch.clientY);
        if (!result) return;

        const { newStartMin, newEndMin } = result;
        setGhost(
          (newStartMin / 60) * HOUR_HEIGHT,
          ((newEndMin - newStartMin) / 60) * HOUR_HEIGHT
        );
      };

      const onTouchEnd = async (te: TouchEvent) => {
        window.removeEventListener("touchmove", onTouchMove);
        window.removeEventListener("touchend", onTouchEnd);

        const changed = te.changedTouches[0];
        if (!changed) return;
        await commitResize(changed.clientY);
      };

      window.addEventListener("touchmove", onTouchMove, { passive: false });
      window.addEventListener("touchend", onTouchEnd);
    },
    [task, startResize, setGhost, computeResize, commitResize]
  );

  return { handleResizeMouseDown, handleResizeTouchStart };
}
