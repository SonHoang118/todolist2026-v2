"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  CompanyTaskDTO,
  CreateCompanyTaskInput,
  UpdateCompanyTaskInput,
} from "@/lib/types";

async function getErrorMessage(res: Response, fallback: string) {
  const contentType = res.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    try {
      const data = (await res.json()) as { error?: string; message?: string };
      return data.error || data.message || fallback;
    } catch {
      return fallback;
    }
  }

  try {
    const text = await res.text();
    return text.trim() || fallback;
  } catch {
    return fallback;
  }
}

export function useCompanyTasks(from: Date, to: Date) {
  const fromStr = from.toISOString();
  const toStr = to.toISOString();

  return useQuery<CompanyTaskDTO[]>({
    queryKey: ["company-tasks", fromStr, toStr],
    queryFn: async () => {
      const url = `/api/company-tasks?from=${encodeURIComponent(fromStr)}&to=${encodeURIComponent(toStr)}`;
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(await getErrorMessage(res, "Failed to load company tasks"));
      }
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
        throw new Error(await getErrorMessage(res, "Failed to create company task"));
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
        throw new Error(await getErrorMessage(res, "Failed to update company task"));
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
        throw new Error(await getErrorMessage(res, "Failed to delete company task"));
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
        throw new Error(await getErrorMessage(res, "Failed to confirm task"));
      }
      return res.json() as Promise<CompanyTaskDTO>;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["company-tasks"] });
    },
  });
}
