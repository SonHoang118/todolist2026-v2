"use client";

import React, { useCallback, useState } from "react";
import { useUIStore } from "@/store/uiStore";
import {
  useCreateCompanyTask,
  useUpdateCompanyTask,
  useDeleteCompanyTask,
  useConfirmCompanyTask,
} from "@/hooks/useCompanyTasks";
import { useCurrentUser } from "@/hooks/useAuth";
import { CompanyTaskDTO } from "@/lib/types";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

const COLORS = [
  "#8B5CF6", "#3B82F6", "#10B981", "#F59E0B",
  "#EF4444", "#EC4899", "#06B6D4", "#84CC16",
];

interface CompanyTaskDialogProps {
  task: CompanyTaskDTO | null;
}

export function CompanyTaskDialog({ task }: CompanyTaskDialogProps) {
  const { pendingCreate, closeDialog, openConfirmDelete } = useUIStore();
  const { data: currentUser } = useCurrentUser();

  const createTask = useCreateCompanyTask();
  const updateTask = useUpdateCompanyTask();
  const confirmTask = useConfirmCompanyTask();

  const isEditing = !!task;
  const isCreator = task?.createdById === currentUser?.id;
  const hasConfirmed = task?.confirms.some((c) => c.userId === currentUser?.id);

  const [title, setTitle] = useState(task?.title ?? "");
  const [description, setDescription] = useState(task?.description ?? "");
  const [color, setColor] = useState(task?.color ?? COLORS[0]);
  const [startTime, setStartTime] = useState(
    task
      ? format(new Date(task.startTime), "yyyy-MM-dd'T'HH:mm")
      : pendingCreate
      ? format(pendingCreate.startTime, "yyyy-MM-dd'T'HH:mm")
      : ""
  );
  const [endTime, setEndTime] = useState(
    task
      ? format(new Date(task.endTime), "yyyy-MM-dd'T'HH:mm")
      : pendingCreate
      ? format(pendingCreate.endTime, "yyyy-MM-dd'T'HH:mm")
      : ""
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canEdit = !isEditing || isCreator;

  const handleSave = useCallback(async () => {
    if (!title.trim()) { setError("Title is required"); return; }
    if (!startTime || !endTime) { setError("Time required"); return; }
    if (new Date(endTime) <= new Date(startTime)) { setError("End must be after start"); return; }

    setSaving(true);
    setError(null);

    try {
      if (isEditing && task) {
        await updateTask.mutateAsync({
          id: task.id,
          data: {
            title,
            description,
            color,
            startTime: new Date(startTime).toISOString(),
            endTime: new Date(endTime).toISOString(),
          },
        });
      } else if (pendingCreate) {
        await createTask.mutateAsync({
          title,
          description,
          color,
          startTime: new Date(startTime).toISOString(),
          endTime: new Date(endTime).toISOString(),
        });
      }
      closeDialog();
    } catch (e) {
      setError(e instanceof Error ? e.message : "An error occurred");
    } finally {
      setSaving(false);
    }
  }, [title, description, color, startTime, endTime, isEditing, task, pendingCreate, createTask, updateTask, closeDialog]);

  const handleConfirm = useCallback(async () => {
    if (!task) return;
    setSaving(true);
    try {
      await confirmTask.mutateAsync(task.id);
      closeDialog();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setSaving(false);
    }
  }, [task, confirmTask, closeDialog]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">
            {isEditing ? "Company Task" : "New Company Task"}
          </h2>
          {isEditing && isCreator && (
            <button
              className="text-red-500 text-sm hover:text-red-700"
              onClick={() => { closeDialog(); openConfirmDelete(task!.id, "company-task"); }}
            >
              Delete
            </button>
          )}
        </div>

        <div className="p-4 space-y-4">
          {error && <p className="text-sm text-red-600 bg-red-50 rounded p-2">{error}</p>}

          {task && (
            <div className="text-xs text-gray-500 space-y-0.5">
              <p>Created by: <span className="font-medium text-gray-700">{task.createdBy.name}</span></p>
              {task.updatedBy && <p>Last updated by: <span className="font-medium text-gray-700">{task.updatedBy.name}</span></p>}
              {task.confirms.length > 0 && (
                <div className="mt-1">
                  <p className="font-medium text-gray-700">Confirmed:</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {task.confirms.map((c) => (
                      <span key={c.userId} className="inline-block bg-green-100 text-green-700 rounded-full px-2 py-0.5 text-xs">
                        {c.user.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={!canEdit}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
              placeholder="Company task title"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={!canEdit}
              rows={2}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start</label>
              <input
                type="datetime-local"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                disabled={!canEdit}
                className="w-full rounded-md border border-gray-300 px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End</label>
              <input
                type="datetime-local"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                disabled={!canEdit}
                className="w-full rounded-md border border-gray-300 px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
              />
            </div>
          </div>

          {canEdit && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Color</label>
              <div className="flex gap-2 flex-wrap">
                {COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    className={cn("w-7 h-7 rounded-full border-2 transition-transform", color === c ? "border-gray-800 scale-110" : "border-transparent")}
                    style={{ backgroundColor: c }}
                    onClick={() => setColor(c)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Confirm button for non-confirmed users */}
          {isEditing && !hasConfirmed && (
            <button
              onClick={handleConfirm}
              disabled={saving}
              className="w-full bg-green-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-green-700 disabled:opacity-50"
            >
              Confirm
            </button>
          )}
          {isEditing && hasConfirmed && (
            <p className="text-sm text-green-600 text-center font-medium">✓ You confirmed this task</p>
          )}
        </div>

        <div className="flex justify-end gap-2 p-4 border-t">
          <button onClick={closeDialog} className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900">
            Cancel
          </button>
          {canEdit && (
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
