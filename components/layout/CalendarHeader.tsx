"use client";

import React from "react";
import { useCalendarStore } from "@/store/calendarStore";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

interface CalendarHeaderProps {
  onOpenSettings: () => void;
}

export function CalendarHeader({ onOpenSettings }: CalendarHeaderProps) {
  const { currentDate, navigateNext, navigatePrev, navigateToday } =
    useCalendarStore();

  const title = format(currentDate, "EEEE, d/M/yyyy", { locale: vi });

  return (
    <header className="flex items-center justify-between px-3 py-2 border-b border-white/10 bg-[#0a0b12] text-white">
      <div className="flex items-center gap-2 min-w-0">
        <button
          onClick={navigatePrev}
          className="w-7 h-7 rounded-full bg-white/5 border border-white/10 text-white/80"
          aria-label="Previous"
        >
          {'<'}
        </button>
        <button
          onClick={navigateNext}
          className="w-7 h-7 rounded-full bg-white/5 border border-white/10 text-white/80"
          aria-label="Next"
        >
          {'>'}
        </button>

        <h2 className="text-sm font-semibold truncate text-white/90 capitalize">
          {title}
        </h2>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={navigateToday}
          className="px-3 h-8 rounded-full text-xs font-semibold text-white/90 bg-[#6b2eea]"
        >
          Reset view
        </button>

        <button className="relative w-8 h-8 rounded-full bg-white/5 border border-white/10">
          <span className="absolute -top-1 -right-1 text-[10px] leading-none px-1.5 py-0.5 rounded-full bg-[#ff356b] text-white font-semibold">
            9+
          </span>
          <svg viewBox="0 0 24 24" className="w-4 h-4 mx-auto text-white/80" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M15 17h5l-1.4-1.4a2 2 0 0 1-.6-1.4V11a6 6 0 1 0-12 0v3.2c0 .5-.2 1-.6 1.4L4 17h5" />
            <path d="M10 17a2 2 0 0 0 4 0" />
          </svg>
        </button>

        <button
          onClick={onOpenSettings}
          className="w-8 h-8 rounded-full bg-white/5 border border-white/10"
          aria-label="Open settings"
        >
          <svg viewBox="0 0 24 24" className="w-4 h-4 mx-auto text-white/80" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" />
            <path d="M19.4 15a1.5 1.5 0 0 0 .3 1.7l.1.1a1.8 1.8 0 1 1-2.5 2.5l-.1-.1a1.5 1.5 0 0 0-1.7-.3 1.5 1.5 0 0 0-.9 1.4V21a1.8 1.8 0 1 1-3.6 0v-.2a1.5 1.5 0 0 0-.9-1.4 1.5 1.5 0 0 0-1.7.3l-.1.1a1.8 1.8 0 1 1-2.5-2.5l.1-.1a1.5 1.5 0 0 0 .3-1.7 1.5 1.5 0 0 0-1.4-.9H3a1.8 1.8 0 1 1 0-3.6h.2a1.5 1.5 0 0 0 1.4-.9 1.5 1.5 0 0 0-.3-1.7l-.1-.1a1.8 1.8 0 1 1 2.5-2.5l.1.1a1.5 1.5 0 0 0 1.7.3h.1a1.5 1.5 0 0 0 .8-1.4V3a1.8 1.8 0 1 1 3.6 0v.2a1.5 1.5 0 0 0 .9 1.4h.1a1.5 1.5 0 0 0 1.7-.3l.1-.1a1.8 1.8 0 1 1 2.5 2.5l-.1.1a1.5 1.5 0 0 0-.3 1.7v.1a1.5 1.5 0 0 0 1.4.8H21a1.8 1.8 0 1 1 0 3.6h-.2a1.5 1.5 0 0 0-1.4.9Z" />
          </svg>
        </button>
      </div>
    </header>
  );
}
