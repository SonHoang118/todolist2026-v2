"use client";

import React, { memo, useMemo } from "react";
import { useCalendarStore } from "@/store/calendarStore";
import { useCurrentUser } from "@/hooks/useAuth";
import { useTasks } from "@/hooks/useTasks";
import { useCompanyTasks } from "@/hooks/useCompanyTasks";
import { DayColumn } from "./DayColumn";
import { TimeColumn } from "./TimeColumn";
import { getWeekDays, getDayRange, getWeekRange } from "@/lib/calendar/time";
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

  return (
    <div className="flex flex-col flex-1 overflow-hidden bg-[#0b0b12]">
      {/* Header row */}
      <div className="flex border-b border-white/10 bg-[#0b0b12] z-10">
        <div className="w-12 flex-shrink-0" />
        {days.map((day) => (
          <div
            key={day.toISOString()}
            className={cn(
              "flex-1 text-center py-2 text-sm font-medium border-l border-white/5",
              isToday(day) ? "bg-[#23143c] text-[#9e65ff]" : "text-white/55"
            )}
          >
            <div className={cn(
              "inline-flex flex-col items-center justify-center min-w-12",
              isToday(day) && "rounded-xl"
            )}>
              <span className="text-[11px] uppercase tracking-wide">
                {format(day, "EEE")}
              </span>
              <span className={cn("text-2xl font-bold leading-none mt-0.5", isToday(day) ? "text-[#9f62ff]" : "text-white")}> 
                {format(day, "dd")}
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
              highlight={isToday(day)}
            />
          );
        })}
      </div>
    </div>
  );
});
