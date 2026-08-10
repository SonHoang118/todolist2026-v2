"use client";

import { create } from "zustand";
import { addWeeks, addDays, startOfWeek } from "date-fns";
import { CalendarView } from "@/lib/types";

interface CalendarState {
  view: CalendarView;
  currentDate: Date;
  selectedUserId: string | null; // null = company calendar

  setView: (view: CalendarView) => void;
  setCurrentDate: (date: Date) => void;
  navigateNext: () => void;
  navigatePrev: () => void;
  navigateToday: () => void;
  selectUser: (userId: string | null) => void;
}

export const useCalendarStore = create<CalendarState>((set, get) => ({
  view: "week",
  currentDate: new Date(),
  selectedUserId: null,

  setView: (view) => set({ view }),
  setCurrentDate: (date) => set({ currentDate: date }),

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

  navigateToday: () => set({ currentDate: new Date() }),

  selectUser: (userId) => set({ selectedUserId: userId }),
}));
