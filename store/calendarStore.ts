"use client";

import { create } from "zustand";
import { addWeeks, addDays, startOfWeek } from "date-fns";
import { CalendarView } from "@/lib/types";

interface CalendarState {
  view: CalendarView;
  currentDate: Date;
  selectedUserId: string | null; // null = company calendar
  dayColumnWidth: number;
  viewportResetToken: number;

  setView: (view: CalendarView) => void;
  setCurrentDate: (date: Date) => void;
  setDayColumnWidth: (width: number) => void;
  navigateNext: () => void;
  navigatePrev: () => void;
  navigateToday: () => void;
  selectUser: (userId: string | null) => void;
}

export const useCalendarStore = create<CalendarState>((set, get) => ({
  view: "week",
  currentDate: new Date(),
  selectedUserId: null,
  dayColumnWidth: 100,
  viewportResetToken: 0,

  setView: (view) => set({ view }),
  setCurrentDate: (date) => set({ currentDate: date }),
  setDayColumnWidth: (width) =>
    set({ dayColumnWidth: Math.max(72, Math.min(180, width)) }),

  navigateNext: () => {
    const { view, currentDate } = get();
    set({
      currentDate:
        view === "week" ? addWeeks(currentDate, 1) : addDays(currentDate, 1),
    });
  },

  navigatePrev: () => {
    const { view, currentDate } = get();
    set({
      currentDate:
        view === "week"
          ? addWeeks(currentDate, -1)
          : addDays(currentDate, -1),
    });
  },

  navigateToday: () =>
    set((state) => ({
      currentDate: new Date(),
      viewportResetToken: state.viewportResetToken + 1,
    })),

  selectUser: (userId) => set({ selectedUserId: userId }),
}));
