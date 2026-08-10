"use client";

import React from "react";
import { useCalendarStore } from "@/store/calendarStore";
import { useCurrentUser, useUsers } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const { selectedUserId, selectUser } = useCalendarStore();
  const { data: currentUser } = useCurrentUser();
  const { data: users = [] } = useUsers();

  return (
    <aside className="w-56 flex-shrink-0 border-r border-gray-200 bg-white flex flex-col">
      <div className="p-4">
        <h1 className="text-lg font-bold text-gray-900">Calendar</h1>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 space-y-1">
        {/* My Calendar */}
        {currentUser && (
          <SidebarItem
            label="My Calendar"
            active={selectedUserId === currentUser.id}
            onClick={() => selectUser(currentUser.id)}
            color="#3B82F6"
          />
        )}

        {/* Company Calendar */}
        <SidebarItem
          label="Company"
          active={selectedUserId === null}
          onClick={() => selectUser(null)}
          color="#8B5CF6"
        />

        {/* Other users */}
        {users.length > 1 && (
          <div className="mt-3">
            <p className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
              Team
            </p>
            {users
              .filter((u) => u.id !== currentUser?.id)
              .map((user) => (
                <SidebarItem
                  key={user.id}
                  label={user.name}
                  active={selectedUserId === user.id}
                  onClick={() => selectUser(user.id)}
                  color="#10B981"
                />
              ))}
          </div>
        )}
      </nav>
    </aside>
  );
}

function SidebarItem({
  label,
  active,
  onClick,
  color,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  color: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-left transition-colors",
        active
          ? "bg-blue-50 text-blue-700 font-medium"
          : "text-gray-700 hover:bg-gray-100"
      )}
    >
      <span
        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
        style={{ backgroundColor: color }}
      />
      <span className="truncate">{label}</span>
    </button>
  );
}
