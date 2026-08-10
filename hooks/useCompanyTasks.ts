"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  CompanyTaskDTO,
  CreateCompanyTaskInput,
  UpdateCompanyTaskInput,
} from "@/lib/types";
import { format } from "date-fns";

export function useCompanyTasks(from: Date, to: Date) {
  const fromStr = format(from, "yyyy-MM-dd'T'HH:mm:ss");
  const toStr = format(to, "yyyy-MM-dd'T'HH:mm:ss");

  return useQuery<CompanyTaskDTO[]>({
    queryKey: ["company-tasks", fromStr, toStr],
    queryFn: async () => {
      const url = `/api/company-tasks?from=${encodeURIComponent(fromStr)}&to=${encodeURIComponent(toStr)}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to load company tasks");
      return res.json();
    },
    staleTime: 30_000,
    refetchOnReconnect: true,
    refetchOnWindowFocus: true,
    refetchInterval: 10_000,
    refetchIntervalInBackground: false,
  });
}

export function useCreateCompanyTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateCompanyTaskInput) => {
      const res = await fetch("/api/company-tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Failed to create company task");
      }
      return res.json() as Promise<CompanyTaskDTO>;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["company-tasks"] });
    },
  });
}

export function useUpdateCompanyTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: UpdateCompanyTaskInput;
    }) => {
      const res = await fetch(`/api/company-tasks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Failed to update company task");
      }
      return res.json() as Promise<CompanyTaskDTO>;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["company-tasks"] });
    },
  });
}

export function useDeleteCompanyTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/company-tasks/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Failed to delete company task");
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["company-tasks"] });
    },
  });
}

export function useConfirmCompanyTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/company-tasks/${id}/confirm`, {
        method: "POST",
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Failed to confirm task");
      }
      return res.json() as Promise<CompanyTaskDTO>;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["company-tasks"] });
    },
  });
}
