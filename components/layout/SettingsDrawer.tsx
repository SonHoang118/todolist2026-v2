"use client";

import React, { useMemo, useState } from "react";
import { useCalendarStore } from "@/store/calendarStore";
import { useCurrentUser, useUsers } from "@/hooks/useAuth";
import { CalendarView } from "@/lib/types";

interface SettingsDrawerProps {
  open: boolean;
  onClose: () => void;
}

export function SettingsDrawer({ open, onClose }: SettingsDrawerProps) {
  const { data: currentUser } = useCurrentUser();
  const { data: users = [] } = useUsers();
  const { selectedUserId, selectUser, view, setView } = useCalendarStore();

  const [darkMode] = useState(true);
  const [gradientOn] = useState(true);
  const [infiniteScroll] = useState(true);
  const [dayWidth] = useState(100);

  const selectedViewLabel = useMemo(() => {
    if (!selectedUserId) return "Lịch công ty";
    const user = users.find((u) => u.id === selectedUserId) || currentUser;
    return user ? `${user.name} (STAFF)` : "Lịch cá nhân";
  }, [selectedUserId, users, currentUser]);

  const activeUser = users.find((u) => u.id === selectedUserId) || currentUser;

  return (
    <>
      <div
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-black/40 transition-opacity ${
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      />

      <aside
        className={`fixed right-0 top-0 h-screen z-50 w-[86vw] max-w-90 bg-[#0b0b10] border-l border-white/10 text-white transform transition-transform duration-300 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="h-full overflow-y-auto">
          <div className="flex items-center justify-between px-5 py-5 border-b border-white/10">
            <h2 className="text-[30px] leading-none font-semibold">Cai dat</h2>
            <button onClick={onClose} className="w-8 h-8 rounded-full text-white/60 hover:text-white">
              <svg viewBox="0 0 24 24" className="w-5 h-5 mx-auto" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 6l12 12M18 6 6 18" />
              </svg>
            </button>
          </div>

          <div className="px-4 py-4 space-y-4">
            <section className="rounded-2xl border border-white/15 p-3">
              <p className="text-xs uppercase tracking-wide text-white/45 mb-3">Tai khoan dang dung</p>
              <div className="flex items-center gap-3">
                <img
                  src={currentUser?.avatarUrl || "https://i.pravatar.cc/80?img=15"}
                  alt="avatar"
                  className="w-12 h-12 rounded-xl object-cover"
                />
                <div className="min-w-0">
                  <p className="font-semibold text-lg leading-tight truncate">{currentUser?.name || "Nguoi dung"}</p>
                  <p className="text-sm text-white/60">STAFF · ID 4</p>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-white/15 p-3 space-y-2">
              <p className="text-sm text-white/80">Che do lich</p>
              <div className="rounded-xl bg-white/15 p-1 grid grid-cols-2 gap-1">
                <button
                  onClick={() => currentUser && selectUser(currentUser.id)}
                  className={`h-9 rounded-lg text-sm ${
                    selectedUserId !== null
                      ? "bg-[#7b3ef0] text-white"
                      : "text-white/70"
                  }`}
                >
                  Lich ca nhan
                </button>
                <button
                  onClick={() => selectUser(null)}
                  className={`h-9 rounded-lg text-sm ${
                    selectedUserId === null
                      ? "bg-[#7b3ef0] text-white"
                      : "text-white/70"
                  }`}
                >
                  Lich cong ty
                </button>
              </div>
              <p className="text-xs text-white/45">Lich theo tung tai khoan</p>
            </section>

            <section className="rounded-2xl border border-white/15 p-3 space-y-3">
              <p className="text-sm text-white/80">Xem lich cua</p>
              <select
                value={selectedUserId || "company"}
                onChange={(e) => {
                  if (e.target.value === "company") {
                    selectUser(null);
                  } else {
                    selectUser(e.target.value);
                  }
                }}
                className="w-full h-11 rounded-xl bg-[#3c3c47] text-white px-3 text-sm outline-none"
              >
                <option value="company">Lich cong ty</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} (STAFF)
                  </option>
                ))}
              </select>

              <div className="rounded-xl border border-white/15 p-2 flex items-center gap-3">
                <img
                  src={activeUser?.avatarUrl || "https://i.pravatar.cc/80?img=15"}
                  alt="selected user"
                  className="w-10 h-10 rounded-lg object-cover"
                />
                <div className="min-w-0">
                  <p className="text-lg leading-tight truncate">{selectedViewLabel}</p>
                  <p className="text-sm text-white/60">STAFF · ID 4</p>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-white/15 p-3 space-y-4">
              <SettingRow label="Giao dien" subLabel="Toi" enabled={darkMode} />
              <SettingRow label="Mau gio gradient" subLabel="Dang bat" enabled={gradientOn} />
              <SettingRow label="Cuon ngang vo tan" subLabel="180 ngay (nat lai task khi bat/tat)" enabled={infiniteScroll} />

              <div className="pt-1">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span>Do rong moi cot ngay</span>
                  <span className="text-white/65">{dayWidth}px</span>
                </div>
                <input
                  type="range"
                  min={80}
                  max={160}
                  value={dayWidth}
                  readOnly
                  className="w-full accent-[#7b3ef0]"
                />
              </div>
            </section>

            <section className="rounded-2xl border border-white/15 p-3 space-y-2">
              <p className="text-sm text-white/80">Khung nhin</p>
              <div className="rounded-xl bg-white/15 p-1 grid grid-cols-2 gap-1">
                {(["week", "day"] as CalendarView[]).map((v) => (
                  <button
                    key={v}
                    onClick={() => setView(v)}
                    className={`h-9 rounded-lg text-sm capitalize ${
                      view === v ? "bg-[#7b3ef0] text-white" : "text-white/70"
                    }`}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </section>
          </div>
        </div>
      </aside>
    </>
  );
}

function SettingRow({
  label,
  subLabel,
  enabled,
}: {
  label: string;
  subLabel: string;
  enabled: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div>
        <p className="text-sm">{label}</p>
        <p className="text-xs text-white/45">{subLabel}</p>
      </div>
      <div className={`w-9 h-5 rounded-full p-0.5 ${enabled ? "bg-[#7b3ef0]" : "bg-white/20"}`}>
        <div className={`w-4 h-4 rounded-full bg-white transition-transform ${enabled ? "translate-x-4" : "translate-x-0"}`} />
      </div>
    </div>
  );
}
