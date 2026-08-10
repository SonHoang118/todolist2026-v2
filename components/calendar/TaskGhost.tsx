"use client";

import React, { memo } from "react";

interface TaskGhostProps {
  top: number;
  height: number;
}

/** Semi-transparent preview block shown during drag/resize */
export const TaskGhost = memo(function TaskGhost({ top, height }: TaskGhostProps) {
  return (
    <div
      className="absolute left-1 right-1 bg-blue-400/30 border-2 border-blue-400 border-dashed rounded z-30 pointer-events-none"
      style={{ top, height }}
    />
  );
});
