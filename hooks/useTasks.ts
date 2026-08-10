"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { TaskDTO, CreateTaskInput, UpdateTaskInput } from "@/lib/types";
import { format } from "date-fns";

function taskKeys(ownerId: string, from: string, to: string) {
  return ["tasks", ownerId, from, to] as const;
}

export function useTasks(ownerId: string | null, from: Date, to: Date) {
  const fromStr = from.toISOString();
  const toStr = to.toISOString();

  return useQuery<TaskDTO[]>({
    queryKey: ["tasks", ownerId, fromStr, toStr],
    enabled: !!ownerId,
    queryFn: async () => {
      const url = `/api/tasks?ownerId=${ownerId}&from=${encodeURIComponent(fromStr)}&to=${encodeURIComponent(toStr)}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to load tasks");
      return res.json();
    },
    staleTime: 30_000,
    refetchOnReconnect: true,
    refetchOnWindowFocus: true,
    refetchInterval: 10_000,
    refetchIntervalInBackground: false,
  });
}

export function useCreateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateTaskInput) => {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Failed to create task");
      }
      return res.json() as Promise<TaskDTO>;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}

export function useUpdateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateTaskInput }) => {
      const res = await fetch(`/api/tasks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Failed to update task");
      }
      return res.json() as Promise<TaskDTO>;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}

export function useDeleteTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/tasks/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Failed to delete task");
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}
