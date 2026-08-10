import {
  startOfWeek,
  endOfWeek,
  startOfDay,
  endOfDay,
  addMinutes,
  differenceInMinutes,
  format,
  isSameDay,
  isWithinInterval,
  roundToNearestMinutes,
} from "date-fns";

export const HOUR_HEIGHT = 64; // px per hour
export const SNAP_MINUTES = 15;
export const DAY_START_HOUR = 0;
export const DAY_END_HOUR = 24;
export const TOTAL_MINUTES = DAY_END_HOUR * 60;

export function getWeekDays(referenceDate: Date): Date[] {
  const start = startOfWeek(referenceDate, { weekStartsOn: 1 }); // Mon
  return Array.from({ length: 7 }, (_, i) => addMinutes(start, i * 24 * 60));
}

export function minutesToPx(minutes: number): number {
  return (minutes / 60) * HOUR_HEIGHT;
}

export function pxToMinutes(px: number): number {
  return (px / HOUR_HEIGHT) * 60;
}

export function snapMinutes(minutes: number): number {
  return Math.round(minutes / SNAP_MINUTES) * SNAP_MINUTES;
}

export function clampMinutes(minutes: number, min = 0, max = TOTAL_MINUTES): number {
  return Math.max(min, Math.min(max, minutes));
}

export function dateToMinutes(date: Date): number {
  return date.getHours() * 60 + date.getMinutes();
}

export function minutesToDate(baseDate: Date, minutes: number): Date {
  const d = startOfDay(baseDate);
  return addMinutes(d, minutes);
}

export function formatTime(date: Date): string {
  return format(date, "HH:mm");
}

export function formatDateHeader(date: Date): string {
  return format(date, "EEE dd");
}

export function getTaskTop(startTime: Date): number {
  return minutesToPx(dateToMinutes(startTime));
}

export function getTaskHeight(startTime: Date, endTime: Date): number {
  const minutes = differenceInMinutes(endTime, startTime);
  return Math.max(minutesToPx(minutes), minutesToPx(SNAP_MINUTES));
}

export function snapDate(date: Date): Date {
  return roundToNearestMinutes(date, { nearestTo: SNAP_MINUTES });
}

export function getWeekRange(date: Date) {
  return {
    start: startOfWeek(date, { weekStartsOn: 1 }),
    end: endOfWeek(date, { weekStartsOn: 1 }),
  };
}

export function getDayRange(date: Date) {
  return {
    start: startOfDay(date),
    end: endOfDay(date),
  };
}

export function isTaskOnDay(
  taskStart: Date,
  taskEnd: Date,
  day: Date
): boolean {
  return (
    isSameDay(taskStart, day) ||
    isSameDay(taskEnd, day) ||
    isWithinInterval(day, { start: taskStart, end: taskEnd })
  );
}

export const HOUR_LABELS = Array.from({ length: 24 }, (_, i) =>
  format(new Date(2000, 0, 1, i), "HH:mm")
);
