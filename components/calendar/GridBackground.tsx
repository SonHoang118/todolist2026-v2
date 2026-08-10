"use client";

import React, { memo } from "react";
import { HOUR_HEIGHT } from "@/lib/calendar/time";

interface GridBackgroundProps {
  onClick?: (e: React.MouseEvent) => void;
  onMouseDown?: (e: React.MouseEvent) => void;
}

/** 24 horizontal hour lines — reusable background for day columns */
export const GridBackground = memo(function GridBackground({
  onClick,
  onMouseDown,
}: GridBackgroundProps) {
  return (
    <div
      className="absolute inset-0"
      onClick={onClick}
      onMouseDown={onMouseDown}
    >
      {Array.from({ length: 24 }, (_, i) => (
        <div
          key={i}
          className="absolute w-full border-t border-gray-100"
          style={{ top: i * HOUR_HEIGHT }}
        />
      ))}
      {/* Half-hour lines */}
      {Array.from({ length: 24 }, (_, i) => (
        <div
          key={`h${i}`}
          className="absolute w-full border-t border-gray-50"
          style={{ top: i * HOUR_HEIGHT + HOUR_HEIGHT / 2 }}
        />
      ))}
    </div>
  );
});
