"use client";

import { create } from "zustand";

interface DragState {
  isDragging: boolean;
  isResizing: boolean;
  draggingTaskId: string | null;
  resizingTaskId: string | null;
  resizeEdge: "top" | "bottom" | null;
  // Ghost preview position (px from top of column, column index)
  ghostTop: number | null;
  ghostHeight: number | null;
  ghostColumn: number | null;
  floatingX: number | null;
  floatingY: number | null;
  floatingTilt: number;
  floatingWidth: number | null;
  floatingHeight: number | null;
  previewColor: string | null;
}

interface DragActions {
  startDrag: (taskId: string, previewColor?: string) => void;
  endDrag: () => void;
  startResize: (taskId: string) => void;
  endResize: () => void;
  setGhost: (top: number, height: number, column?: number) => void;
  setFloatingGhost: (
    x: number,
    y: number,
    tilt?: number,
    width?: number,
    height?: number
  ) => void;
  clearGhost: () => void;
}

export const useDragStore = create<DragState & DragActions>((set) => ({
  isDragging: false,
  isResizing: false,
  draggingTaskId: null,
  resizingTaskId: null,
  resizeEdge: null,
  ghostTop: null,
  ghostHeight: null,
  ghostColumn: null,
  floatingX: null,
  floatingY: null,
  floatingTilt: 0,
  floatingWidth: null,
  floatingHeight: null,
  previewColor: null,

  startDrag: (taskId, previewColor) =>
    set({ isDragging: true, draggingTaskId: taskId, previewColor: previewColor ?? null }),

  endDrag: () =>
    set({
      isDragging: false,
      draggingTaskId: null,
      ghostTop: null,
      ghostHeight: null,
      ghostColumn: null,
      floatingX: null,
      floatingY: null,
      floatingTilt: 0,
      floatingWidth: null,
      floatingHeight: null,
      previewColor: null,
    }),

  startResize: (taskId) =>
    set({ isResizing: true, resizingTaskId: taskId, resizeEdge: "bottom" }),

  endResize: () =>
    set({
      isResizing: false,
      resizingTaskId: null,
      resizeEdge: null,
      ghostTop: null,
      ghostHeight: null,
    }),

  setGhost: (top, height, column) =>
    set({ ghostTop: top, ghostHeight: height, ghostColumn: column ?? null }),

  setFloatingGhost: (x, y, tilt = 0, width, height) =>
    set({
      floatingX: x,
      floatingY: y,
      floatingTilt: tilt,
      floatingWidth: width ?? null,
      floatingHeight: height ?? null,
    }),

  clearGhost: () =>
    set({
      ghostTop: null,
      ghostHeight: null,
      ghostColumn: null,
      floatingX: null,
      floatingY: null,
      floatingTilt: 0,
      floatingWidth: null,
      floatingHeight: null,
      previewColor: null,
    }),
}));
