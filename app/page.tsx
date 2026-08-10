"use client";

import React from "react";
import { useCurrentUser } from "@/hooks/useAuth";
import { useRealtime } from "@/hooks/useRealtime";
import { useCalendarStore } from "@/store/calendarStore";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { CalendarHeader } from "@/components/layout/CalendarHeader";
import { CalendarGrid } from "@/components/calendar/CalendarGrid";
import { DialogManager } from "@/components/dialogs/DialogManager";

export default function CalendarPage() {
  const { data: currentUser, isLoading } = useCurrentUser();
  const router = useRouter();
  const didInitSelection = useRef(false);

  useRealtime();

  const { selectedUserId, selectUser } = useCalendarStore();
  useEffect(() => {
    if (!didInitSelection.current && currentUser && selectedUserId === null) {
      selectUser(currentUser.id);
      didInitSelection.current = true;
    }
  }, [currentUser, selectedUserId, selectUser]);

  useEffect(() => {
    if (!isLoading && !currentUser) {
      router.push("/login");
    }
  }, [isLoading, currentUser, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!currentUser) return null;

  return (
    <div className="flex h-screen overflow-hidden bg-white">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <CalendarHeader />
        <CalendarGrid />
      </div>
      <DialogManager />
    </div>
  );
}
