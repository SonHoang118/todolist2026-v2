"use client";

import React from "react";
import { useUIStore } from "@/store/uiStore";
import { useQueryClient } from "@tanstack/react-query";
import { TaskDialog } from "./TaskDialog";
import { CompanyTaskDialog } from "./CompanyTaskDialog";
import { ConfirmDialog } from "./ConfirmDialog";
import { TaskDTO, CompanyTaskDTO } from "@/lib/types";

/**
 * Mounted once at app level. Reads dialog state from UIStore and renders
 * the appropriate dialog. Reads tasks from the TanStack Query cache.
 */
export function DialogManager() {
  const { dialog, editingTaskId, editingCompanyTaskId } = useUIStore();
  const qc = useQueryClient();

  if (!dialog) return null;

  if (dialog === "task") {
    // Search all task queries in cache
    let task: TaskDTO | null = null;
    if (editingTaskId) {
      const allTaskData = qc.getQueriesData<TaskDTO[]>({ queryKey: ["tasks"] });
      for (const [, data] of allTaskData) {
        const found = data?.find((t) => t.id === editingTaskId);
        if (found) { task = found; break; }
      }
    }
    return <TaskDialog task={task} />;
  }

  if (dialog === "company-task") {
    let task: CompanyTaskDTO | null = null;
    if (editingCompanyTaskId) {
      const allData = qc.getQueriesData<CompanyTaskDTO[]>({ queryKey: ["company-tasks"] });
      for (const [, data] of allData) {
        const found = data?.find((t) => t.id === editingCompanyTaskId);
        if (found) { task = found; break; }
      }
    }
    return <CompanyTaskDialog task={task} />;
  }

  if (dialog === "confirm-delete") {
    return <ConfirmDialog />;
  }

  return null;
}
