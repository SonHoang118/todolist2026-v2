"use client";

import { useCallback, useRef, useState } from "react";
import {
  pxToMinutes,
  snapMinutes,
  clampMinutes,
  minutesToDate,
  TOTAL_MINUTES,
  SNAP_MINUTES,
} from "@/lib/calendar/time";
import { useInteractionStore } from "@/store/interactionStore";
import { useDragStore } from "@/store/dragStore";

interface SelectionState {
  startMin: number;
  endMin: number;
  active: boolean;
}

interface UseCalendarSelectionOptions {
  columnDate: Date;
  ownerId: string;
  onSelect: (startTime: Date, endTime: Date, ownerId: string) => void;
  containerRef: React.RefObject<HTMLDivElement | null>;
}

function snapDown(minutes: number) {
  return Math.floor(minutes / SNAP_MINUTES) * SNAP_MINUTES;
}

/**
 * Handles drag-to-create selection on empty calendar area.
 * Does NOT conflict with task drag because tasks call stopPropagation.
 */
export function useCalendarSelection({
  columnDate,
  ownerId,
  onSelect,
  containerRef,
}: UseCalendarSelectionOptions) {
  const [selection, setSelection] = useState<SelectionState | null>(null);
  const startMinRef = useRef<number | null>(null);
  const startPointRef = useRef<{ x: number; y: number } | null>(null);
  const canCreateByTap = useInteractionStore((s) => s.canCreateByTap);
  const resizeTaskId = useInteractionStore((s) => s.resizeTaskId);
  const { isDragging, isResizing } = useDragStore();

  const getMinutesFromMouseY = useCallback(
    (clientY: number) => {
      if (!containerRef.current) return 0;
      const rect = containerRef.current.getBoundingClientRect();
      const relativeY = clientY - rect.top + containerRef.current.scrollTop;
      const rawMin = pxToMinutes(relativeY);
      return snapMinutes(clampMinutes(rawMin, 0, TOTAL_MINUTES));
    },
    [containerRef]
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (isDragging || isResizing || resizeTaskId || !canCreateByTap()) return;
      if (e.button !== 0) return;
      startPointRef.current = { x: e.clientX, y: e.clientY };
      const startMin = getMinutesFromMouseY(e.clientY);
      startMinRef.current = startMin;

      setSelection({ startMin, endMin: startMin + SNAP_MINUTES, active: true });

      const onMouseMove = (me: MouseEvent) => {
        if (startMinRef.current === null) return;
        if (!startPointRef.current) return;

        const distance = Math.hypot(
          me.clientX - startPointRef.current.x,
          me.clientY - startPointRef.current.y
        );
        if (distance < 8) return;

        const currentMin = getMinutesFromMouseY(me.clientY);
        const min = Math.min(startMinRef.current, currentMin);
        const max = Math.max(
          startMinRef.current + SNAP_MINUTES,
          currentMin
        );
        setSelection({ startMin: min, endMin: max, active: true });
      };

      const onMouseUp = (me: MouseEvent) => {
        window.removeEventListener("mousemove", onMouseMove);
        window.removeEventListener("mouseup", onMouseUp);

        if (startMinRef.current === null) return;
        if (!startPointRef.current) return;

        const travel = Math.hypot(
          me.clientX - startPointRef.current.x,
          me.clientY - startPointRef.current.y
        );
        const currentMin = getMinutesFromMouseY(me.clientY);
        const min = snapDown(Math.min(startMinRef.current, currentMin));
        const max =
          travel < 8
            ? clampMinutes(min + 60, 0, TOTAL_MINUTES)
            : snapMinutes(Math.max(startMinRef.current + SNAP_MINUTES, currentMin));

        setSelection(null);
        startMinRef.current = null;
        startPointRef.current = null;

        const start = minutesToDate(columnDate, min);
        const end = minutesToDate(columnDate, max);
        onSelect(start, end, ownerId);
      };

      window.addEventListener("mousemove", onMouseMove);
      window.addEventListener("mouseup", onMouseUp);
    },
    [
      getMinutesFromMouseY,
      columnDate,
      ownerId,
      onSelect,
      isDragging,
      isResizing,
      resizeTaskId,
      canCreateByTap,
    ]
  );

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (isDragging || isResizing || resizeTaskId || !canCreateByTap()) return;
      const touch = e.touches[0];
      if (!touch) return;
      startPointRef.current = { x: touch.clientX, y: touch.clientY };

      const startMin = getMinutesFromMouseY(touch.clientY);
      startMinRef.current = startMin;
      let cancelledByMove = false;

      const onTouchMove = (te: TouchEvent) => {
        if (startMinRef.current === null) return;
        if (!startPointRef.current) return;
        const nextTouch = te.touches[0];
        if (!nextTouch) return;

        const dx = Math.abs(nextTouch.clientX - startPointRef.current.x);
        const dy = Math.abs(nextTouch.clientY - startPointRef.current.y);
        const travel = Math.hypot(dx, dy);
        if (travel > 8) {
          // If user started scrolling/panning, cancel tap-create completely.
          cancelledByMove = true;
          startMinRef.current = null;
          startPointRef.current = null;
          window.removeEventListener("touchmove", onTouchMove);
          window.removeEventListener("touchend", onTouchEnd);
        }
      };

      const onTouchEnd = (te: TouchEvent) => {
        window.removeEventListener("touchmove", onTouchMove);
        window.removeEventListener("touchend", onTouchEnd);

        if (cancelledByMove) return;

        if (startMinRef.current === null) return;
        if (!startPointRef.current) return;
        const touchEnd = te.changedTouches[0];
        const tapMin = touchEnd
          ? getMinutesFromMouseY(touchEnd.clientY)
          : startMinRef.current;

        const min = snapDown(tapMin);
        const max = clampMinutes(min + 60, 0, TOTAL_MINUTES);

        setSelection(null);
        startMinRef.current = null;
        startPointRef.current = null;

        const start = minutesToDate(columnDate, min);
        const end = minutesToDate(columnDate, max);
        onSelect(start, end, ownerId);
      };

      window.addEventListener("touchmove", onTouchMove, { passive: false });
      window.addEventListener("touchend", onTouchEnd);
    },
    [
      getMinutesFromMouseY,
      columnDate,
      ownerId,
      onSelect,
      isDragging,
      isResizing,
      resizeTaskId,
      canCreateByTap,
    ]
  );

  return { selection, handleMouseDown, handleTouchStart };
}
