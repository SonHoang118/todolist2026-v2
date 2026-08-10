"use client";

import React, { memo, useMemo } from "react";
import { useCalendarStore } from "@/store/calendarStore";
import { useCurrentUser } from "@/hooks/useAuth";
import { useTasks } from "@/hooks/useTasks";
import { useCompanyTasks } from "@/hooks/useCompanyTasks";
import { DayColumn } from "./DayColumn";
import { TimeColumn } from "./TimeColumn";
import {
  getWeekDays,
  getDayRange,
  getWeekRange,
  formatDateHeader,
  TOTAL_MINUTES,
  minutesToPx,
  HOUR_HEIGHT,
} from "@/lib/calendar/time";
import { format, isToday } from "date-fns";
import { TaskDTO, CompanyTaskDTO } from "@/lib/types";
import { cn } from "@/lib/utils";

export const CalendarGrid = memo(function CalendarGrid() {
  const { view, currentDate, selectedUserId } = useCalendarStore();
  const { data: currentUser } = useCurrentUser();

  const isCompanyCalendar = selectedUserId === null;

  // Compute date range for queries
  const { start: rangeStart, end: rangeEnd } = useMemo(
    () =>
      view === "week"
        ? getWeekRange(currentDate)
        : getDayRange(currentDate),
    [view, currentDate]
  );

  const viewUserId = isCompanyCalendar ? null : (selectedUserId || currentUser?.id || null);

  const { data: userTasks = [] } = useTasks(viewUserId, rangeStart, rangeEnd);
  const { data: companyTasks = [] } = useCompanyTasks(rangeStart, rangeEnd);

  const days = useMemo(
    () =>
      view === "week"
        ? getWeekDays(currentDate)
        : [currentDate],
    [view, currentDate]
  );

  const totalHeight = minutesToPx(TOTAL_MINUTES);

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* Header row */}
      <div className="flex border-b border-gray-200 bg-white z-10">
        <div className="w-16 flex-shrink-0" />
        {days.map((day) => (
          <div
            key={day.toISOString()}
            className={cn(
              "flex-1 text-center py-2 text-sm font-medium",
              isToday(day) ? "text-blue-600" : "text-gray-600"
            )}
          >
            <div className={cn(
              "inline-flex flex-col items-center",
              isToday(day) && "bg-blue-50 rounded-lg px-2 py-1"
            )}>
              <span className="text-xs uppercase tracking-wide">
                {format(day, "EEE")}
              </span>
              <span className={cn("text-xl font-bold leading-none", isToday(day) ? "text-blue-600" : "text-gray-900")}>
                {format(day, "d")}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Scrollable grid */}
      <div className="flex flex-1 overflow-y-auto overflow-x-hidden">
        <TimeColumn />
        {days.map((day) => {
          const dayTasks = (isCompanyCalendar ? companyTasks : userTasks).filter(
            (t) => {
              const start = new Date(t.startTime);
              const end = new Date(t.endTime);
              const dayStart = new Date(day);
              dayStart.setHours(0, 0, 0, 0);
              const dayEnd = new Date(day);
              dayEnd.setHours(23, 59, 59, 999);
              return start <= dayEnd && end >= dayStart;
            }
          );

          return (
            <DayColumn
              key={day.toISOString()}
              date={day}
              tasks={dayTasks}
              ownerId={isCompanyCalendar ? "company" : (viewUserId ?? currentUser?.id ?? "")}
              isCurrentUser={viewUserId === currentUser?.id}
            />
          );
        })}
      </div>
    </div>
  );
});
