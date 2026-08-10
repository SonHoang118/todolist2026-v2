"use client";

import React, { useCallback, useState } from "react";
import { useUIStore } from "@/store/uiStore";
import { useDeleteTask } from "@/hooks/useTasks";
import { useDeleteCompanyTask } from "@/hooks/useCompanyTasks";

export function ConfirmDialog() {
  const { confirmDeleteId, confirmDeleteType, closeDialog } = useUIStore();
  const deleteTask = useDeleteTask();
  const deleteCompanyTask = useDeleteCompanyTask();
  const [loading, setLoading] = useState(false);

  const handleConfirm = useCallback(async () => {
    if (!confirmDeleteId || !confirmDeleteType) return;
    setLoading(true);
    try {
      if (confirmDeleteType === "task") {
        await deleteTask.mutateAsync(confirmDeleteId);
      } else {
        await deleteCompanyTask.mutateAsync(confirmDeleteId);
      }
      closeDialog();
    } catch {
      setLoading(false);
    }
  }, [confirmDeleteId, confirmDeleteType, deleteTask, deleteCompanyTask, closeDialog]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm mx-4 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Delete Task</h2>
        <p className="text-sm text-gray-600 mb-6">
          Are you sure you want to delete this task? This action cannot be undone.
        </p>
        <div className="flex justify-end gap-3">
          <button
            onClick={closeDialog}
            className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
          >
            {loading ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}
