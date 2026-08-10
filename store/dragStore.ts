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
}

interface DragActions {
  startDrag: (taskId: string) => void;
  endDrag: () => void;
  startResize: (taskId: string, edge: "top" | "bottom") => void;
  endResize: () => void;
  setGhost: (top: number, height: number, column?: number) => void;
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

  startDrag: (taskId) =>
    set({ isDragging: true, draggingTaskId: taskId }),

  endDrag: () =>
    set({
      isDragging: false,
      draggingTaskId: null,
      ghostTop: null,
      ghostHeight: null,
      ghostColumn: null,
    }),

  startResize: (taskId, edge) =>
    set({ isResizing: true, resizingTaskId: taskId, resizeEdge: edge }),

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

  clearGhost: () =>
    set({ ghostTop: null, ghostHeight: null, ghostColumn: null }),
}));
