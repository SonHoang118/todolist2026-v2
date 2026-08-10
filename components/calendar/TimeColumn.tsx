"use client";

import React, { memo } from "react";
import { HOUR_HEIGHT, HOUR_LABELS } from "@/lib/calendar/time";

export const TimeColumn = memo(function TimeColumn() {
  return (
    <div className="w-16 flex-shrink-0 relative select-none">
      {HOUR_LABELS.map((label, i) => (
        <div
          key={label}
          className="absolute right-2 text-xs text-gray-400 -translate-y-2"
          style={{ top: i * HOUR_HEIGHT }}
        >
          {i > 0 ? label : ""}
        </div>
      ))}
    </div>
  );
});
