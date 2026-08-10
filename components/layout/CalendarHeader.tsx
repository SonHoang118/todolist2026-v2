"use client";

import React from "react";
import { useCalendarStore } from "@/store/calendarStore";
import { useCurrentUser, useLogout } from "@/hooks/useAuth";
import { format } from "date-fns";
import { CalendarView } from "@/lib/types";

export function CalendarHeader() {
  const { view, currentDate, navigateNext, navigatePrev, navigateToday, setView } =
    useCalendarStore();
  const { data: currentUser } = useCurrentUser();
  const logout = useLogout();

  const title =
    view === "week"
      ? `${format(currentDate, "MMMM yyyy")}`
      : format(currentDate, "EEEE, MMMM d yyyy");

  return (
    <header className="flex items-center justify-between px-4 py-2 border-b border-gray-200 bg-white">
      {/* Navigation */}
      <div className="flex items-center gap-2">
        <button
          onClick={navigateToday}
          className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          Today
        </button>
        <button
          onClick={navigatePrev}
          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600"
          aria-label="Previous"
        >
          ‹
        </button>
        <button
          onClick={navigateNext}
          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600"
          aria-label="Next"
        >
          ›
        </button>
        <h2 className="text-base font-semibold text-gray-900 ml-1">{title}</h2>
      </div>

      {/* View toggle + user */}
      <div className="flex items-center gap-3">
        <div className="flex rounded-lg border border-gray-200 overflow-hidden text-sm">
          {(["week", "day"] as CalendarView[]).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-3 py-1.5 capitalize ${
                view === v
                  ? "bg-blue-600 text-white"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              {v}
            </button>
          ))}
        </div>

        {currentUser && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-700 hidden sm:block">
              {currentUser.name}
            </span>
            <button
              onClick={() => logout.mutate()}
              className="text-xs text-gray-500 hover:text-gray-700 border border-gray-200 rounded px-2 py-1"
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
