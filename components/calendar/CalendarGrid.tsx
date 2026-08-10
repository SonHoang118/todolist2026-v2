"use client";

import React, { memo, useEffect, useMemo, useRef } from "react";
import { useCalendarStore } from "@/store/calendarStore";
import { useCurrentUser } from "@/hooks/useAuth";
import { useTasks } from "@/hooks/useTasks";
import { useCompanyTasks } from "@/hooks/useCompanyTasks";
import { DayColumn } from "./DayColumn";
import { TimeColumn } from "./TimeColumn";
import { format, isToday } from "date-fns";
import { TaskDTO, CompanyTaskDTO } from "@/lib/types";
import { cn } from "@/lib/utils";
import { addDays, endOfDay, startOfDay } from "date-fns";

const DAY_BUFFER = 90;
const TIME_COL_WIDTH = 48;
const MIN_DAY_WIDTH = 72;
const MAX_DAY_WIDTH = 180;

export const CalendarGrid = memo(function CalendarGrid() {
  const {
    currentDate,
    selectedUserId,
    setCurrentDate,
    dayColumnWidth,
    setDayColumnWidth,
    viewportResetToken,
  } = useCalendarStore();
  const { data: currentUser } = useCurrentUser();
  const scrollerRef = useRef<HTMLDivElement>(null);
  const isRecenteringRef = useRef(false);
  const pinchStateRef = useRef<{
    startDistance: number;
    startWidth: number;
    anchorViewportX: number;
    anchorContentX: number;
  } | null>(null);

  const isCompanyCalendar = selectedUserId === null;

  const baseDate = useMemo(() => startOfDay(currentDate), [currentDate]);

  const days = useMemo(
    () =>
      Array.from({ length: DAY_BUFFER * 2 + 1 }, (_, i) =>
        addDays(baseDate, i - DAY_BUFFER)
      ),
    [baseDate]
  );

  const centerIndex = DAY_BUFFER;

  const rangeStart = startOfDay(days[0]);
  const rangeEnd = endOfDay(days[days.length - 1]);

  const viewUserId = isCompanyCalendar ? null : (selectedUserId || currentUser?.id || null);

  const { data: userTasks = [] } = useTasks(viewUserId, rangeStart, rangeEnd);
  const { data: companyTasks = [] } = useCompanyTasks(rangeStart, rangeEnd);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;

    const viewport = el.clientWidth;
    const targetLeft = centerIndex * dayColumnWidth - viewport / 2 + TIME_COL_WIDTH + dayColumnWidth / 2;
    isRecenteringRef.current = true;
    el.scrollTo({ left: Math.max(0, targetLeft), behavior: "smooth" });

    const timer = setTimeout(() => {
      isRecenteringRef.current = false;
    }, 320);

    return () => clearTimeout(timer);
  }, [viewportResetToken, centerIndex, dayColumnWidth]);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;

    const viewport = el.clientWidth;
    const targetLeft = centerIndex * dayColumnWidth - viewport / 2 + TIME_COL_WIDTH + dayColumnWidth / 2;
    el.scrollLeft = Math.max(0, targetLeft);
  }, []);

  const handleHorizontalScroll = () => {
    const el = scrollerRef.current;
    if (!el || isRecenteringRef.current) return;

    const viewportCenterX = el.scrollLeft + el.clientWidth / 2 - TIME_COL_WIDTH;
    const centerDayIndex = Math.round(viewportCenterX / dayColumnWidth);

    if (centerDayIndex < 18 || centerDayIndex > days.length - 18) {
      const clamped = Math.max(0, Math.min(days.length - 1, centerDayIndex));
      const nextDate = days[clamped];
      const inDayOffset = viewportCenterX - centerDayIndex * dayColumnWidth;

      isRecenteringRef.current = true;
      setCurrentDate(nextDate);

      requestAnimationFrame(() => {
        const next = scrollerRef.current;
        if (!next) return;
        const resetLeft =
          centerIndex * dayColumnWidth + inDayOffset - next.clientWidth / 2 + TIME_COL_WIDTH;
        next.scrollLeft = Math.max(0, resetLeft);
        setTimeout(() => {
          isRecenteringRef.current = false;
        }, 30);
      });
    }
  };

  const handlePinchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length !== 2 || !scrollerRef.current) return;
    const [a, b] = [e.touches[0], e.touches[1]];
    const startDistance = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
    const anchorViewportX = (a.clientX + b.clientX) / 2 - scrollerRef.current.getBoundingClientRect().left;
    const anchorContentX = scrollerRef.current.scrollLeft + anchorViewportX - TIME_COL_WIDTH;

    pinchStateRef.current = {
      startDistance,
      startWidth: dayColumnWidth,
      anchorViewportX,
      anchorContentX,
    };
  };

  const handlePinchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length !== 2 || !scrollerRef.current || !pinchStateRef.current) return;

    e.preventDefault();
    const [a, b] = [e.touches[0], e.touches[1]];
    const distance = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
    const ratio = distance / Math.max(1, pinchStateRef.current.startDistance);
    const newWidth = Math.max(
      MIN_DAY_WIDTH,
      Math.min(MAX_DAY_WIDTH, pinchStateRef.current.startWidth * ratio)
    );

    const scale = newWidth / pinchStateRef.current.startWidth;
    setDayColumnWidth(newWidth);

    requestAnimationFrame(() => {
      const el = scrollerRef.current;
      if (!el || !pinchStateRef.current) return;
      const newAnchorX = pinchStateRef.current.anchorContentX * scale;
      el.scrollLeft = newAnchorX - pinchStateRef.current.anchorViewportX + TIME_COL_WIDTH;
    });
  };

  const handlePinchEnd = () => {
    pinchStateRef.current = null;
  };

  return (
    <div className="flex flex-col flex-1 overflow-hidden bg-[#0b0b12]">
      {/* Header row */}
      <div className="flex border-b border-white/10 bg-[#0b0b12] z-10">
        <div className="w-12 shrink-0" />
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
      <div
        ref={scrollerRef}
        className="flex-1 overflow-auto"
        onScroll={handleHorizontalScroll}
        onTouchStart={handlePinchStart}
        onTouchMove={handlePinchMove}
        onTouchEnd={handlePinchEnd}
      >
        <div className="flex min-w-max">
          <div className="sticky left-0 z-30">
            <TimeColumn />
          </div>
          {days.map((day) => {
            const dayTasks = (isCompanyCalendar ? companyTasks : userTasks).filter(
              (t) => {
                const start = new Date(t.startTime);
                const end = new Date(t.endTime);
                const dayStartLocal = new Date(day);
                dayStartLocal.setHours(0, 0, 0, 0);
                const dayEndLocal = new Date(day);
                dayEndLocal.setHours(23, 59, 59, 999);
                return start <= dayEndLocal && end >= dayStartLocal;
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
                dayWidth={dayColumnWidth}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
});
