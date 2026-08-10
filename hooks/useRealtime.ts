"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getSSEClient } from "@/lib/realtime/sse-client";
import { CompanyTaskDTO, TaskDTO, TaskLabel, UserPublic } from "@/lib/types";

function overlapsRange(startIso: string, endIso: string, fromStr: string, toStr: string) {
  const start = new Date(startIso);
  const end = new Date(endIso);
  const from = new Date(fromStr);
  const to = new Date(toStr);
  return start <= to && end >= from;
}

function upsertById<T extends { id: string; startTime: string }>(list: T[], item: T): T[] {
  const idx = list.findIndex((x) => x.id === item.id);
  if (idx === -1) {
    return [...list, item].sort(
      (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    );
  }

  const next = [...list];
  next[idx] = item;
  return next.sort(
    (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
  );
}

function removeById<T extends { id: string }>(list: T[], id: string): T[] {
  return list.filter((x) => x.id !== id);
}

/**
 * Connect to SSE and invalidate relevant queries when realtime events arrive.
 * Mount this once at the app level.
 */
export function useRealtime() {
  const qc = useQueryClient();

  useEffect(() => {
    const client = getSSEClient();
    client.connect();

    const applyTaskToCache = (task: TaskDTO) => {
      const me = qc.getQueryData<UserPublic>(["me"]);

      const entries = qc.getQueriesData<TaskDTO[]>({ queryKey: ["tasks"] });
      for (const [key, old] of entries) {
        if (!old) continue;

        const ownerId = typeof key[1] === "string" ? key[1] : null;
        const from = typeof key[2] === "string" ? key[2] : null;
        const to = typeof key[3] === "string" ? key[3] : null;
        if (!ownerId || !from || !to) continue;

        let next = old;

        if (task.ownerId !== ownerId) {
          next = removeById(next, task.id);
        } else if (me?.id && ownerId !== me.id && task.label === TaskLabel.PERSONAL) {
          // Match server visibility: personal tasks are hidden when viewing another user's calendar.
          next = removeById(next, task.id);
        } else if (!overlapsRange(task.startTime, task.endTime, from, to)) {
          next = removeById(next, task.id);
        } else {
          next = upsertById(next, task);
        }

        qc.setQueryData(key, next);
      }
    };

    const applyCompanyTaskToCache = (task: CompanyTaskDTO) => {
      const entries = qc.getQueriesData<CompanyTaskDTO[]>({
        queryKey: ["company-tasks"],
      });
      for (const [key, old] of entries) {
        if (!old) continue;

        const from = typeof key[1] === "string" ? key[1] : null;
        const to = typeof key[2] === "string" ? key[2] : null;
        if (!from || !to) continue;

        const next = overlapsRange(task.startTime, task.endTime, from, to)
          ? upsertById(old, task)
          : removeById(old, task.id);

        qc.setQueryData(key, next);
      }
    };

    const removeTaskFromCache = (id: string) => {
      qc.setQueriesData(
        { queryKey: ["tasks"] },
        (old: TaskDTO[] | undefined) => (old ? removeById(old, id) : old)
      );
    };

    const removeCompanyTaskFromCache = (id: string) => {
      qc.setQueriesData(
        { queryKey: ["company-tasks"] },
        (old: CompanyTaskDTO[] | undefined) => (old ? removeById(old, id) : old)
      );
    };

    const unsubConnect = client.onConnect(() => {
      qc.invalidateQueries({ queryKey: ["tasks"] });
      qc.invalidateQueries({ queryKey: ["company-tasks"] });
    });

    const unsubTask = client.on("task:created", (payload) => {
      const task = payload as TaskDTO;
      if (task?.id) applyTaskToCache(task);
      qc.invalidateQueries({ queryKey: ["tasks"] });
    });
    const unsubTaskUp = client.on("task:updated", (payload) => {
      const task = payload as TaskDTO;
      if (task?.id) applyTaskToCache(task);
      qc.invalidateQueries({ queryKey: ["tasks"] });
    });
    const unsubTaskDel = client.on("task:deleted", (payload) => {
      const data = payload as { id?: string };
      if (data?.id) removeTaskFromCache(data.id);
      qc.invalidateQueries({ queryKey: ["tasks"] });
    });
    const unsubCo = client.on("companytask:created", (payload) => {
      const task = payload as CompanyTaskDTO;
      if (task?.id) applyCompanyTaskToCache(task);
      qc.invalidateQueries({ queryKey: ["company-tasks"] });
    });
    const unsubCoUp = client.on("companytask:updated", (payload) => {
      const task = payload as CompanyTaskDTO;
      if (task?.id) applyCompanyTaskToCache(task);
      qc.invalidateQueries({ queryKey: ["company-tasks"] });
    });
    const unsubCoDel = client.on("companytask:deleted", (payload) => {
      const data = payload as { id?: string };
      if (data?.id) removeCompanyTaskFromCache(data.id);
      qc.invalidateQueries({ queryKey: ["company-tasks"] });
    });
    const unsubCoConf = client.on("companytask:confirmed", (payload) => {
      const task = payload as CompanyTaskDTO;
      if (task?.id) applyCompanyTaskToCache(task);
      qc.invalidateQueries({ queryKey: ["company-tasks"] });
    });

    return () => {
      unsubTask?.();
      unsubTaskUp?.();
      unsubTaskDel?.();
      unsubCo?.();
      unsubCoUp?.();
      unsubCoDel?.();
      unsubCoConf?.();
      unsubConnect?.();
      client.disconnect();
    };
  }, [qc]);
}
