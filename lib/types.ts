// Plain const enums — safe to import in both server and client components
export const TaskStatus = {
  PENDING: "PENDING",
  ACCEPTED: "ACCEPTED",
  DONE: "DONE",
} as const;
export type TaskStatus = (typeof TaskStatus)[keyof typeof TaskStatus];

export const TaskLabel = {
  PERSONAL: "PERSONAL",
  DEFAULT: "DEFAULT",
} as const;
export type TaskLabel = (typeof TaskLabel)[keyof typeof TaskLabel];

export const TaskType = {
  PERSONAL: "PERSONAL",
  ASSIGNED: "ASSIGNED",
} as const;
export type TaskType = (typeof TaskType)[keyof typeof TaskType];

export interface UserPublic {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
}

export interface TaskDTO {
  id: string;
  title: string;
  description: string | null;
  color: string;
  startTime: string; // ISO
  endTime: string; // ISO
  status: TaskStatus;
  label: TaskLabel;
  type: TaskType;
  ownerId: string;
  owner: UserPublic;
  assignerId: string | null;
  assigner: UserPublic | null;
  createdAt: string;
  updatedAt: string;
}

export interface CompanyTaskDTO {
  id: string;
  title: string;
  description: string | null;
  color: string;
  startTime: string;
  endTime: string;
  createdById: string;
  createdBy: UserPublic;
  updatedById: string | null;
  updatedBy: UserPublic | null;
  confirms: CompanyTaskConfirmDTO[];
  createdAt: string;
  updatedAt: string;
}

export interface CompanyTaskConfirmDTO {
  userId: string;
  user: UserPublic;
  confirmedAt: string;
}

export type CalendarView = "day" | "week";

export interface CalendarRange {
  start: Date;
  end: Date;
}

export type RealtimeEventType =
  | "task:created"
  | "task:updated"
  | "task:deleted"
  | "companytask:created"
  | "companytask:updated"
  | "companytask:deleted"
  | "companytask:confirmed"
  | "ping";

export interface RealtimeEvent {
  type: RealtimeEventType;
  payload: unknown;
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  color?: string;
  startTime: string;
  endTime: string;
  label?: TaskLabel;
  ownerId: string; // whose calendar
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  color?: string;
  startTime?: string;
  endTime?: string;
  label?: TaskLabel;
  status?: TaskStatus;
}

export interface CreateCompanyTaskInput {
  title: string;
  description?: string;
  color?: string;
  startTime: string;
  endTime: string;
}

export interface UpdateCompanyTaskInput {
  title?: string;
  description?: string;
  color?: string;
  startTime?: string;
  endTime?: string;
}
