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

  const getTaskMinutes = useCallback(() => {
    const startMin =
      new Date(task.startTime).getHours() * 60 +
      new Date(task.startTime).getMinutes();
    const durationMin = differenceInMinutes(
      new Date(task.endTime),
      new Date(task.startTime)
    );
    return { startMin, durationMin };
  }, [task.startTime, task.endTime]);

  const beginDrag = useCallback(
    (startClientY: number) => {
      const { startMin, durationMin } = getTaskMinutes();
      dragState.current = {
        startMouseY: startClientY,
        taskStartMin: startMin,
        taskDurationMin: durationMin,
      };

      startDrag(task.id);
      setGhost((startMin / 60) * HOUR_HEIGHT, (durationMin / 60) * HOUR_HEIGHT);
    },
    [getTaskMinutes, startDrag, task.id, setGhost]
  );

  const updateDrag = useCallback(
    (clientY: number) => {
      if (!dragState.current || !containerRef.current) return;

      const deltaY = clientY - dragState.current.startMouseY;
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
    },
    [containerRef, setGhost]
  );

  const commitDrag = useCallback(
    async (clientY: number) => {
      if (!dragState.current) return;

      const deltaY = clientY - dragState.current.startMouseY;
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

      if (newStart.getTime() !== new Date(task.startTime).getTime()) {
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
    },
    [clearGhost, endDrag, columnDate, task, updateTask, updateCompanyTask]
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      beginDrag(e.clientY);

      const onMouseMove = (me: MouseEvent) => {
        updateDrag(me.clientY);
      };

      const onMouseUp = async (me: MouseEvent) => {
        window.removeEventListener("mousemove", onMouseMove);
        window.removeEventListener("mouseup", onMouseUp);
        await commitDrag(me.clientY);
      };

      window.addEventListener("mousemove", onMouseMove);
      window.addEventListener("mouseup", onMouseUp);
    },
    [
      beginDrag,
      updateDrag,
      commitDrag,
    ]
  );

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      e.stopPropagation();
      const firstTouch = e.touches[0];
      if (!firstTouch) return;

      let longPressed = false;
      let lastClientY = firstTouch.clientY;
      const startY = firstTouch.clientY;

      const onTouchMove = (te: TouchEvent) => {
        const touch = te.touches[0];
        if (!touch) return;
        lastClientY = touch.clientY;

        if (!longPressed) {
          if (Math.abs(lastClientY - startY) > 8) {
            clearTimeout(timer);
            cleanup();
          }
          return;
        }

        te.preventDefault();
        updateDrag(lastClientY);
      };

      const onTouchEnd = async (te: TouchEvent) => {
        clearTimeout(timer);
        const changed = te.changedTouches[0];
        if (changed) {
          lastClientY = changed.clientY;
        }
        cleanup();

        if (!longPressed) return;
        te.preventDefault();
        await commitDrag(lastClientY);
      };

      const cleanup = () => {
        window.removeEventListener("touchmove", onTouchMove);
        window.removeEventListener("touchend", onTouchEnd);
      };

      const timer = window.setTimeout(() => {
        longPressed = true;
        beginDrag(lastClientY);
      }, 260);

      window.addEventListener("touchmove", onTouchMove, { passive: false });
      window.addEventListener("touchend", onTouchEnd);
    },
    [beginDrag, updateDrag, commitDrag]
  );

  return { handleMouseDown, handleTouchStart };
}
