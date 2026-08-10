import { TaskDTO, CompanyTaskDTO } from "@/lib/types";

export interface LayoutTask {
  task: TaskDTO | CompanyTaskDTO;
  column: number;
  totalColumns: number;
}

/**
 * Compute non-overlapping column layout for tasks on a single day.
 * Uses a greedy interval graph coloring algorithm.
 */
export function layoutTasks(
  tasks: Array<TaskDTO | CompanyTaskDTO>
): LayoutTask[] {
  if (tasks.length === 0) return [];

  // Sort by startTime, then by duration descending
  const sorted = [...tasks].sort((a, b) => {
    const startDiff =
      new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
    if (startDiff !== 0) return startDiff;
    const durA =
      new Date(a.endTime).getTime() - new Date(a.startTime).getTime();
    const durB =
      new Date(b.endTime).getTime() - new Date(b.startTime).getTime();
    return durB - durA;
  });

  // columns[i] = end time of last task in column i
  const columnEnds: number[] = [];
  const result: LayoutTask[] = [];

  for (const task of sorted) {
    const start = new Date(task.startTime).getTime();
    const end = new Date(task.endTime).getTime();

    let col = columnEnds.findIndex((e) => e <= start);
    if (col === -1) {
      col = columnEnds.length;
      columnEnds.push(end);
    } else {
      columnEnds[col] = end;
    }

    result.push({ task, column: col, totalColumns: 0 });
  }

  const totalColumns = columnEnds.length;
  for (const item of result) {
    item.totalColumns = totalColumns;
  }

  return result;
}
