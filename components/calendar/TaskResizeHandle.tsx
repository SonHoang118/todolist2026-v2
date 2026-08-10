"use client";

import React, { memo } from "react";

interface TaskResizeHandleProps {
  edge: "top" | "bottom";
  onMouseDown: (e: React.MouseEvent, edge: "top" | "bottom") => void;
}

export const TaskResizeHandle = memo(function TaskResizeHandle({
  edge,
  onMouseDown,
}: TaskResizeHandleProps) {
  return (
    <div
      className={`
        absolute left-0 right-0 h-2 cursor-ns-resize z-30
        opacity-0 group-hover:opacity-100
        ${edge === "top" ? "top-0" : "bottom-0"}
      `}
      onMouseDown={(e) => {
        e.stopPropagation();
        onMouseDown(e, edge);
      }}
    >
      <div className="mx-auto mt-0.5 w-8 h-1 bg-white/50 rounded-full" />
    </div>
  );
});
