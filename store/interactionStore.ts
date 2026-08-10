"use client";

import { create } from "zustand";

interface InteractionState {
  badge: string | null;
  resizeTaskId: string | null;
  instruction: string | null;
  holdingTaskId: string | null;
  suppressedTaskTapId: string | null;
  suppressCreateUntil: number;
  showBadge: (message: string, durationMs?: number) => void;
  enterResizeMode: (taskId: string, instruction?: string) => void;
  exitResizeMode: () => void;
  setHoldingTask: (taskId: string | null) => void;
  suppressTaskTap: (taskId: string) => void;
  consumeSuppressedTaskTap: (taskId: string) => boolean;
  suppressCreate: (durationMs?: number) => void;
  canCreateByTap: () => boolean;
}

let badgeTimer: ReturnType<typeof setTimeout> | null = null;

export const useInteractionStore = create<InteractionState>((set, get) => ({
  badge: null,
  resizeTaskId: null,
  instruction: null,
  holdingTaskId: null,
  suppressedTaskTapId: null,
  suppressCreateUntil: 0,

  showBadge: (message, durationMs = 1400) => {
    if (badgeTimer) {
      clearTimeout(badgeTimer);
      badgeTimer = null;
    }

    set({ badge: message });
    badgeTimer = setTimeout(() => {
      set({ badge: null });
      badgeTimer = null;
    }, durationMs);
  },

  enterResizeMode: (taskId, instruction) =>
    set({
      resizeTaskId: taskId,
      instruction: instruction ?? "Keo thanh duoi de doi thoi luong",
    }),

  exitResizeMode: () => set({ resizeTaskId: null, instruction: null }),

  setHoldingTask: (taskId) => set({ holdingTaskId: taskId }),

  suppressTaskTap: (taskId) => set({ suppressedTaskTapId: taskId }),

  consumeSuppressedTaskTap: (taskId) => {
    const state = useInteractionStore.getState();
    if (state.suppressedTaskTapId !== taskId) return false;
    set({ suppressedTaskTapId: null });
    return true;
  },

  suppressCreate: (durationMs = 420) =>
    set({ suppressCreateUntil: Date.now() + durationMs }),

  canCreateByTap: () => Date.now() > get().suppressCreateUntil,
}));
