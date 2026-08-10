"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useUIStore } from "@/store/uiStore";
import { useCreateTask, useUpdateTask, useDeleteTask } from "@/hooks/useTasks";
import { useCurrentUser } from "@/hooks/useAuth";
import { TaskDTO } from "@/lib/types";
import { TaskLabel, TaskStatus, TaskType } from "@/lib/types";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

const COLORS = [
  "#3B82F6", "#10B981", "#F59E0B", "#EF4444",
  "#8B5CF6", "#EC4899", "#06B6D4", "#84CC16",
];

interface TaskDialogProps {
  // Injected from parent to avoid querying inside
  task: TaskDTO | null;
}

export function TaskDialog({ task }: TaskDialogProps) {
  const { pendingCreate, closeDialog, openConfirmDelete } = useUIStore();
  const { data: currentUser } = useCurrentUser();
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();

  const isEditing = !!task;
  const isAssigned = task?.type === TaskType.ASSIGNED;
  const isOwner = task?.ownerId === currentUser?.id;
  const isAssigner = task?.assignerId === currentUser?.id;

  // Determine what fields are editable
  const canEditContent = !isEditing || isAssigner || (isOwner && !isAssigned);
  const canEditTime = !isEditing || isAssigner || (isOwner && !isAssigned);
  const canEditStatus = isEditing && isOwner;

  const [title, setTitle] = useState(task?.title ?? "");
  const [description, setDescription] = useState(task?.description ?? "");
  const [color, setColor] = useState(task?.color ?? COLORS[0]);
  const [label, setLabel] = useState<TaskLabel>(task?.label ?? TaskLabel.DEFAULT);
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

  const isOwnCalendar =
    pendingCreate?.ownerId === currentUser?.id || isOwner;

  const handleSave = useCallback(async () => {
    if (!title.trim()) {
      setError("Title is required");
      return;
    }
    if (!startTime || !endTime) {
      setError("Start and end time are required");
      return;
    }
    if (new Date(endTime) <= new Date(startTime)) {
      setError("End time must be after start time");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      if (isEditing && task) {
        await updateTask.mutateAsync({
          id: task.id,
          data: {
            title: canEditContent ? title : undefined,
            description: canEditContent ? description : undefined,
            color: canEditContent ? color : undefined,
            startTime: canEditTime ? new Date(startTime).toISOString() : undefined,
            endTime: canEditTime ? new Date(endTime).toISOString() : undefined,
            label: canEditContent && isOwnCalendar ? label : undefined,
          },
        });
      } else if (pendingCreate) {
        await createTask.mutateAsync({
          title,
          description,
          color,
          startTime: new Date(startTime).toISOString(),
          endTime: new Date(endTime).toISOString(),
          label: pendingCreate.ownerId === currentUser?.id ? label : undefined,
          ownerId: pendingCreate.ownerId,
        });
      }
      closeDialog();
    } catch (e) {
      setError(e instanceof Error ? e.message : "An error occurred");
    } finally {
      setSaving(false);
    }
  }, [
    title, description, color, label, startTime, endTime,
    isEditing, task, pendingCreate, canEditContent, canEditTime,
    isOwnCalendar, createTask, updateTask, closeDialog, currentUser,
  ]);

  const handleStatusChange = useCallback(
    async (newStatus: TaskStatus) => {
      if (!task) return;
      setSaving(true);
      try {
        await updateTask.mutateAsync({ id: task.id, data: { status: newStatus } });
        closeDialog();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed");
      } finally {
        setSaving(false);
      }
    },
    [task, updateTask, closeDialog]
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={closeDialog}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">
            {isEditing ? "Edit Task" : "New Task"}
          </h2>
          {isEditing && (isOwner || isAssigner) && (
            <button
              className="text-red-500 text-sm hover:text-red-700"
              onClick={() => {
                closeDialog();
                openConfirmDelete(task!.id, "task");
              }}
            >
              Delete
            </button>
          )}
        </div>

        <div className="p-4 space-y-4">
          {error && (
            <p className="text-sm text-red-600 bg-red-50 rounded p-2">{error}</p>
          )}

          {task?.type === TaskType.ASSIGNED && task.assigner && (
            <p className="text-xs text-gray-500 bg-gray-50 rounded px-2 py-1">
              Assigned by: <span className="font-medium">{task.assigner.name}</span>
            </p>
          )}

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={!canEditContent}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
              placeholder="Task title"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={!canEditContent}
              rows={2}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500 resize-none"
              placeholder="Optional description"
            />
          </div>

          {/* Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start</label>
              <input
                type="datetime-local"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                disabled={!canEditTime}
                className="w-full rounded-md border border-gray-300 px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End</label>
              <input
                type="datetime-local"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                disabled={!canEditTime}
                className="w-full rounded-md border border-gray-300 px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
              />
            </div>
          </div>

          {/* Color picker */}
          {canEditContent && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Color</label>
              <div className="flex gap-2 flex-wrap">
                {COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    className={cn(
                      "w-7 h-7 rounded-full border-2 transition-transform",
                      color === c ? "border-gray-800 scale-110" : "border-transparent"
                    )}
                    style={{ backgroundColor: c }}
                    onClick={() => setColor(c)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Label — only for own calendar */}
          {canEditContent && isOwnCalendar && task?.type !== TaskType.ASSIGNED && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Visibility</label>
              <select
                value={label}
                onChange={(e) => setLabel(e.target.value as TaskLabel)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={TaskLabel.DEFAULT}>Default (visible to others)</option>
                <option value={TaskLabel.PERSONAL}>Personal (only you)</option>
              </select>
            </div>
          )}

          {/* Status actions for assigned task owner */}
          {canEditStatus && task?.type === TaskType.ASSIGNED && (
            <div className="flex gap-2 pt-1">
              {task.status === TaskStatus.PENDING && (
                <button
                  onClick={() => handleStatusChange(TaskStatus.ACCEPTED)}
                  disabled={saving}
                  className="flex-1 bg-green-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-green-700 disabled:opacity-50"
                >
                  Accept
                </button>
              )}
              {task.status === TaskStatus.ACCEPTED && (
                <button
                  onClick={() => handleStatusChange(TaskStatus.DONE)}
                  disabled={saving}
                  className="flex-1 bg-blue-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                >
                  Mark Done
                </button>
              )}
              {task.status === TaskStatus.DONE && (
                <button
                  onClick={() => handleStatusChange(TaskStatus.ACCEPTED)}
                  disabled={saving}
                  className="flex-1 bg-amber-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-amber-700 disabled:opacity-50"
                >
                  Undo Done
                </button>
              )}
            </div>
          )}

          {/* Status action for personal task */}
          {canEditStatus && task?.type === TaskType.PERSONAL && (
            <div className="pt-1">
              {task.status !== TaskStatus.DONE ? (
                <button
                  onClick={() => handleStatusChange(TaskStatus.DONE)}
                  disabled={saving}
                  className="w-full bg-green-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-green-700 disabled:opacity-50"
                >
                  Mark Done
                </button>
              ) : (
                <button
                  onClick={() => handleStatusChange(TaskStatus.PENDING)}
                  disabled={saving}
                  className="w-full bg-amber-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-amber-700 disabled:opacity-50"
                >
                  Undo Done
                </button>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 p-4 border-t">
          <button
            onClick={closeDialog}
            className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900"
          >
            Cancel
          </button>
          {(canEditContent || canEditTime) && (
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
