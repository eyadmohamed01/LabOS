import type { AttentionItem, TimelineItem } from "../types/dashboard";

export function openTasks(
  items: readonly AttentionItem[],
  completed: ReadonlySet<string>,
) {
  return items.filter(
    (item) => item.kind !== "calendar" && !completed.has(item.id),
  );
}

export function overviewMetrics(
  items: readonly AttentionItem[],
  completed: ReadonlySet<string>,
  schedule: readonly TimelineItem[],
  referenceDate: string,
) {
  const reference = Date.parse(`${referenceDate}T12:00:00Z`);
  return {
    open: openTasks(items, completed).length,
    resolved: items.filter(
      (item) => item.kind !== "calendar" && completed.has(item.id),
    ).length,
    captured: items.filter((item) => item.kind === "capture").length,
    deadlines: schedule.filter(
      (item) =>
        item.kind === "deadline" &&
        Date.parse(`${item.date}T12:00:00Z`) >= reference &&
        Date.parse(`${item.date}T12:00:00Z`) < reference + 7 * 86400000,
    ).length,
  };
}

export function projectTaskCounts(
  projectId: string,
  items: readonly AttentionItem[],
  completed: ReadonlySet<string>,
) {
  const tasks = openTasks(items, completed).filter(
    (item) => item.projectId === projectId,
  );
  return {
    open: tasks.length,
    overdue: tasks.filter((item) => item.kind === "overdue").length,
  };
}

export function conflictingEvents(
  items: readonly TimelineItem[],
  personId: string,
): ReadonlySet<string> {
  const conflicts = new Set<string>();
  const meetings = items.filter(
    (item) =>
      item.kind === "meeting" &&
      item.time &&
      item.endTime &&
      item.attendeeIds.includes(personId),
  );
  for (let a = 0; a < meetings.length; a++)
    for (let b = a + 1; b < meetings.length; b++) {
      const left = meetings[a],
        right = meetings[b];
      if (
        left.date === right.date &&
        left.time! < right.endTime! &&
        right.time! < left.endTime!
      ) {
        conflicts.add(left.id);
        conflicts.add(right.id);
      }
    }
  return conflicts;
}
