"use client";

import React, { memo } from "react";

interface TaskGhostProps {
  top: number;
  height: number;
  color?: string;
}

/** Semi-transparent preview block shown during drag/resize */
export const TaskGhost = memo(function TaskGhost({ top, height, color }: TaskGhostProps) {
  return (
    <div
      className="absolute left-1 right-1 border-2 border-dashed rounded z-30 pointer-events-none"
      style={{
        top,
        height,
        backgroundColor: `${color ?? "#8b5cf6"}33`,
        borderColor: `${color ?? "#8b5cf6"}aa`,
      }}
    />
  );
});
