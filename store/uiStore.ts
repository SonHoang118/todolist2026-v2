"use client";

import { create } from "zustand";

type DialogType = "task" | "company-task" | "confirm-delete" | null;

interface PendingTaskCreate {
  startTime: Date;
  endTime: Date;
  ownerId: string;
}

interface UIState {
  dialog: DialogType;
  editingTaskId: string | null;
  editingCompanyTaskId: string | null;
  pendingCreate: PendingTaskCreate | null;
  confirmDeleteId: string | null;
  confirmDeleteType: "task" | "company-task" | null;

  openCreateTask: (pending: PendingTaskCreate) => void;
  openEditTask: (taskId: string) => void;
  openEditCompanyTask: (taskId: string) => void;
  openConfirmDelete: (id: string, type: "task" | "company-task") => void;
  closeDialog: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  dialog: null,
  editingTaskId: null,
  editingCompanyTaskId: null,
  pendingCreate: null,
  confirmDeleteId: null,
  confirmDeleteType: null,

  openCreateTask: (pending) =>
    set({ dialog: "task", pendingCreate: pending, editingTaskId: null }),

  openEditTask: (taskId) =>
    set({ dialog: "task", editingTaskId: taskId, pendingCreate: null }),

  openEditCompanyTask: (taskId) =>
    set({
      dialog: "company-task",
      editingCompanyTaskId: taskId,
      pendingCreate: null,
    }),

  openConfirmDelete: (id, type) =>
    set({
      dialog: "confirm-delete",
      confirmDeleteId: id,
      confirmDeleteType: type,
    }),

  closeDialog: () =>
    set({
      dialog: null,
      editingTaskId: null,
      editingCompanyTaskId: null,
      pendingCreate: null,
      confirmDeleteId: null,
      confirmDeleteType: null,
    }),
}));
