"use client";

import React, { memo } from "react";
import { HOUR_HEIGHT, HOUR_LABELS } from "@/lib/calendar/time";

export const TimeColumn = memo(function TimeColumn() {
  return (
    <div className="w-12 flex-shrink-0 relative select-none bg-[#0b0b12]">
      {HOUR_LABELS.map((label, i) => (
        <div
          key={label}
          className="absolute left-1 text-[11px] text-white/45 -translate-y-2"
          style={{ top: i * HOUR_HEIGHT }}
        >
          {i > 0 ? label : ""}
        </div>
      ))}
    </div>
  );
});
