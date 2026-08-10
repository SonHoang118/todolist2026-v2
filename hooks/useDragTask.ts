"use client";

import { useCallback, useRef } from "react";
import { useDragStore } from "@/store/dragStore";
import { useUpdateTask } from "@/hooks/useTasks";
import { useUpdateCompanyTask } from "@/hooks/useCompanyTasks";
import { useInteractionStore } from "@/store/interactionStore";
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
  const { startDrag, endDrag, setGhost, clearGhost, setFloatingGhost } = useDragStore();
  const {
    setHoldingTask,
    enterResizeMode,
    showBadge,
    suppressTaskTap,
    suppressCreate,
  } = useInteractionStore();
  const updateTask = useUpdateTask();
  const updateCompanyTask = useUpdateCompanyTask();

  const dragState = useRef<{
    startMouseY: number;
    startMouseX: number;
    taskStartMin: number;
    taskDurationMin: number;
    dragStarted: boolean;
    tilt: number;
    lastClientX: number;
    lastMoveTs: number;
    sourceColumnIndex: number;
    targetColumnIndex: number;
    targetDateIso: string;
    ghostWidth: number;
    ghostHeight: number;
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
    (
      startClientX: number,
      startClientY: number,
      sourceColumnIndex: number,
      ghostWidth: number,
      ghostHeight: number
    ) => {
      const { startMin, durationMin } = getTaskMinutes();
      dragState.current = {
        startMouseY: startClientY,
        startMouseX: startClientX,
        taskStartMin: startMin,
        taskDurationMin: durationMin,
        dragStarted: true,
        tilt: 0,
        lastClientX: startClientX,
        lastMoveTs: performance.now(),
        sourceColumnIndex,
        targetColumnIndex: sourceColumnIndex,
        targetDateIso: columnDate.toISOString(),
        ghostWidth,
        ghostHeight,
      };

      startDrag(task.id);
      setHoldingTask(null);
      setGhost(
        (startMin / 60) * HOUR_HEIGHT,
        (durationMin / 60) * HOUR_HEIGHT,
        sourceColumnIndex
      );
      setFloatingGhost(startClientX, startClientY, 0, ghostWidth, ghostHeight);
    },
    [getTaskMinutes, startDrag, task.id, setGhost, setFloatingGhost, setHoldingTask]
  );

  const updateDrag = useCallback(
    (clientX: number, clientY: number) => {
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

      const targetEl = document
        .elementFromPoint(clientX, clientY)
        ?.closest("[data-day-column-index]") as HTMLElement | null;
      if (targetEl) {
        const targetIndex = Number(targetEl.dataset.dayColumnIndex ?? "0");
        const targetDateIso = targetEl.dataset.dayIso ?? columnDate.toISOString();
        if (Number.isFinite(targetIndex)) {
          dragState.current.targetColumnIndex = targetIndex;
        }
        dragState.current.targetDateIso = targetDateIso;
      }

      setGhost(
        (clamped / 60) * HOUR_HEIGHT,
        (dragState.current.taskDurationMin / 60) * HOUR_HEIGHT,
        dragState.current.targetColumnIndex
      );

      const now = performance.now();
      const dt = Math.max(now - dragState.current.lastMoveTs, 8);
      const dx = clientX - dragState.current.lastClientX;
      const vx = Math.abs(dx) < 1.8 ? 0 : dx / dt;
      const targetTilt = Math.max(-6, Math.min(6, vx * 90));
      dragState.current.tilt = dragState.current.tilt * 0.88 + targetTilt * 0.12;
      dragState.current.lastClientX = clientX;
      dragState.current.lastMoveTs = now;

      setFloatingGhost(
        clientX,
        clientY,
        dragState.current.tilt,
        dragState.current.ghostWidth,
        dragState.current.ghostHeight
      );
    },
    [containerRef, setGhost, setFloatingGhost]
  );

  const commitDrag = useCallback(
    async (clientY: number) => {
      if (!dragState.current) return;

      const state = dragState.current;

      const deltaY = clientY - state.startMouseY;
      const deltaMin = pxToMinutes(deltaY);
      const rawStart = state.taskStartMin + deltaMin;
      const snapped = snapMinutes(rawStart);
      const clamped = clampMinutes(
        snapped,
        0,
        TOTAL_MINUTES - state.taskDurationMin
      );

      const targetDate = new Date(state.targetDateIso);
      const newStart = minutesToDate(targetDate, clamped);
      const newEnd = minutesToDate(
        targetDate,
        clamped + state.taskDurationMin
      );

      const hasMoved = newStart.getTime() !== new Date(task.startTime).getTime();
      const payload = hasMoved
        ? {
            startTime: newStart.toISOString(),
            endTime: newEnd.toISOString(),
          }
        : null;

      // Clear interaction layers before network work to prevent freeze feeling.
      dragState.current = null;
      clearGhost();
      endDrag();
      setHoldingTask(null);
      suppressCreate(380);

      if (!payload) return;

      void (async () => {
        try {
          if ("ownerId" in task) {
            await updateTask.mutateAsync({ id: task.id, data: payload });
          } else {
            await updateCompanyTask.mutateAsync({ id: task.id, data: payload });
          }

          showBadge(
            `Da dat lich moi ${newStart.toLocaleDateString("vi-VN")} ${newStart.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}`
          );
        } catch {
          showBadge("Khong the cap nhat vi tri task");
        }
      })();
    },
    [
      clearGhost,
      endDrag,
      task,
      updateTask,
      updateCompanyTask,
      showBadge,
      setHoldingTask,
      suppressCreate,
    ]
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const sourceColumnIndex = Number(
        containerRef.current?.dataset.columnIndex ?? "0"
      );

      beginDrag(
        e.clientX,
        e.clientY,
        Number.isFinite(sourceColumnIndex) ? sourceColumnIndex : 0,
        rect.width,
        rect.height
      );

      const onMouseMove = (me: MouseEvent) => {
        updateDrag(me.clientX, me.clientY);
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
      const firstTouch = e.touches[0];
      if (!firstTouch) return;

      const sourceElement = e.currentTarget as HTMLElement;
      const rect = sourceElement.getBoundingClientRect();
      const sourceColumnIndex = Number(
        containerRef.current?.dataset.columnIndex ?? "0"
      );

      let longPressed = false;
      let dragStarted = false;
      let movedTooMuchBeforeHold = false;
      let startX = firstTouch.clientX;
      let lastClientY = firstTouch.clientY;
      let lastClientX = firstTouch.clientX;
      const startY = firstTouch.clientY;

      const onTouchMove = (te: TouchEvent) => {
        const touch = te.touches[0];
        if (!touch) return;
        lastClientX = touch.clientX;
        lastClientY = touch.clientY;

        if (!longPressed) {
          const dy = Math.abs(lastClientY - startY);
          const dx = Math.abs(lastClientX - startX);
          if (dy > 8 || dx > 8) {
            movedTooMuchBeforeHold = true;
            clearTimeout(timer);
            setHoldingTask(null);
            cleanup();
          }
          return;
        }

        const dragDistance = Math.hypot(lastClientX - startX, lastClientY - startY);
        if (!dragStarted && dragDistance > 12) {
          dragStarted = true;
          beginDrag(
            lastClientX,
            lastClientY,
            Number.isFinite(sourceColumnIndex) ? sourceColumnIndex : 0,
            rect.width,
            rect.height
          );
        }

        te.preventDefault();
        if (!dragStarted) return;
        updateDrag(lastClientX, lastClientY);
      };

      const onTouchEnd = async (te: TouchEvent) => {
        clearTimeout(timer);
        const changed = te.changedTouches[0];
        if (changed) {
          lastClientX = changed.clientX;
          lastClientY = changed.clientY;
        }
        cleanup();

        if (!longPressed || movedTooMuchBeforeHold) return;

        suppressTaskTap(task.id);
        te.preventDefault();

        if (dragStarted) {
          await commitDrag(lastClientY);
          return;
        }

        setHoldingTask(null);
        enterResizeMode(task.id, "Keo thanh duoi de doi thoi luong");
      };

      const cleanup = () => {
        window.removeEventListener("touchmove", onTouchMove);
        window.removeEventListener("touchend", onTouchEnd);
      };

      const timer = window.setTimeout(() => {
        longPressed = true;
        suppressCreate(500);
        setHoldingTask(task.id);
      }, 260);

      window.addEventListener("touchmove", onTouchMove, { passive: false });
      window.addEventListener("touchend", onTouchEnd);
    },
    [
      beginDrag,
      updateDrag,
      commitDrag,
      setHoldingTask,
      enterResizeMode,
      suppressTaskTap,
      task.id,
      containerRef,
      suppressCreate,
    ]
  );

  return { handleMouseDown, handleTouchStart };
}
