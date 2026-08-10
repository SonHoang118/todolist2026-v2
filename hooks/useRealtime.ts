"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getSSEClient } from "@/lib/realtime/sse-client";

/**
 * Connect to SSE and invalidate relevant queries when realtime events arrive.
 * Mount this once at the app level.
 */
export function useRealtime() {
  const qc = useQueryClient();

  useEffect(() => {
    const client = getSSEClient();
    client.connect();

    const unsubConnect = client.onConnect(() => {
      qc.invalidateQueries({ queryKey: ["tasks"] });
      qc.invalidateQueries({ queryKey: ["company-tasks"] });
    });

    const unsubTask = client.on("task:created", () => {
      qc.invalidateQueries({ queryKey: ["tasks"] });
    });
    const unsubTaskUp = client.on("task:updated", () => {
      qc.invalidateQueries({ queryKey: ["tasks"] });
    });
    const unsubTaskDel = client.on("task:deleted", () => {
      qc.invalidateQueries({ queryKey: ["tasks"] });
    });
    const unsubCo = client.on("companytask:created", () => {
      qc.invalidateQueries({ queryKey: ["company-tasks"] });
    });
    const unsubCoUp = client.on("companytask:updated", () => {
      qc.invalidateQueries({ queryKey: ["company-tasks"] });
    });
    const unsubCoDel = client.on("companytask:deleted", () => {
      qc.invalidateQueries({ queryKey: ["company-tasks"] });
    });
    const unsubCoConf = client.on("companytask:confirmed", () => {
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
