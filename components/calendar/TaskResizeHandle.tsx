"use client";

import React, { memo } from "react";

interface TaskResizeHandleProps {
  edge: "top" | "bottom";
  onMouseDown: (e: React.MouseEvent) => void;
  onTouchStart?: (e: React.TouchEvent) => void;
  visible?: boolean;
}

export const TaskResizeHandle = memo(function TaskResizeHandle({
  edge,
  onMouseDown,
  onTouchStart,
  visible,
}: TaskResizeHandleProps) {
  return (
    <div
      className={`
        absolute left-0 right-0 h-8 cursor-ns-resize z-30
        ${visible ? "opacity-100" : "opacity-0 group-hover:opacity-100"}
        ${edge === "top" ? "-top-8" : "-bottom-8"}
        flex items-center justify-center
      `}
      onMouseDown={(e) => {
        e.stopPropagation();
        onMouseDown(e);
      }}
      onTouchStart={(e) => {
        e.stopPropagation();
        onTouchStart?.(e);
      }}
    >
      <div className={`mx-auto w-8 h-1 bg-white/50 rounded-full ${edge === "top" ? "mb-1" : "mt-1"}`} />
    </div>
  );
});
