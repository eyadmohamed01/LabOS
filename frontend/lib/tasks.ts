// Pure task logic from the LabOS Implementation Brief. Nothing here touches React,
// the DOM or the clock: "today" is always passed in, so every rule is testable.
// Only `import type` is used so the node:test runner can load this file directly.

import type { AttentionItem } from "../types/dashboard";
import type {
  Task,
  TaskOffset,
  TaskRelation,
  TaskViewId,
} from "../types/tasks";

/** Global follow-up threshold (§24): 5 working days. */
export const DEFAULT_FOLLOW_UP_DAYS = 5;
/** "Due this week" = deadlines in the next 7 days, starting today. */
export const DUE_SOON_DAYS = 7;

const noon = (date: string) => Date.parse(`${date}T12:00:00Z`);

export function shiftDate(date: string, days: number): string {
  const next = new Date(noon(date));
  next.setUTCDate(next.getUTCDate() + days);
  return next.toISOString().slice(0, 10);
}

/** Weekend = Saturday/Sunday. Public holidays are a SHOULD feature (§19). */
export function isWorkingDay(date: string): boolean {
  const day = new Date(noon(date)).getUTCDay();
  return day !== 0 && day !== 6;
}

/** Moves a date by working days (Mon–Fri). Negative = earlier: 1 working day before Monday is Friday. */
export function shiftWorkingDays(date: string, amount: number): string {
  const step = amount < 0 ? -1 : 1;
  let day = date;
  for (let left = Math.abs(amount); left > 0; ) {
    day = shiftDate(day, step);
    if (isWorkingDay(day)) left--;
  }
  return day;
}

/** Whole calendar days from `from` to `to` (negative when `to` is earlier). */
export function daysBetween(from: string, to: string): number {
  return Math.round((noon(to) - noon(from)) / 86400000);
}

/** Working days elapsed in the interval (from, to]. 0 when to <= from. */
export function workingDaysBetween(from: string, to: string): number {
  let count = 0;
  for (let day = shiftDate(from, 1); day <= to; day = shiftDate(day, 1))
    if (isWorkingDay(day)) count++;
  return count;
}

export const isActive = (task: Task) =>
  task.status === "open" || task.status === "in-progress";

/**
 * §10: a date-only deadline becomes overdue at 00:00 the following day (Berlin),
 * i.e. when `today` is later than the deadline date. For timed deadlines the caller
 * may pass the current time (HH:mm); without it a task due today is never overdue.
 */
export function isOverdue(task: Task, today: string, nowTime?: string): boolean {
  if (!isActive(task) || !task.dueDate) return false;
  if (task.dueDate < today) return true;
  return !!(
    nowTime &&
    task.dueDate === today &&
    task.dueTime &&
    task.dueTime < nowTime
  );
}

/** §9: owner = who acts, requester = who waits. */
export function relationOf(task: Task, me: string): TaskRelation {
  const { ownerId, requesterId } = task;
  if (!requesterId || requesterId === ownerId) return "personal";
  if (requesterId === me && ownerId !== me) return "waiting-for-others";
  if (ownerId === me && requesterId !== me) return "others-waiting";
  return "third-party";
}

/** Working days since the last external contact (creation date if there was none). */
export function quietWorkingDays(task: Task, today: string): number {
  return workingDaysBetween(task.lastContactDate ?? task.createdDate, today);
}

/** §24 follow-up trigger, all five conditions. */
export function needsFollowUp(
  task: Task,
  me: string,
  today: string,
  nowTime?: string,
): boolean {
  return (
    relationOf(task, me) === "waiting-for-others" &&
    isActive(task) &&
    (!task.dueDate || isOverdue(task, today, nowTime)) &&
    quietWorkingDays(task, today) >
      (task.followUpAfterDays ?? DEFAULT_FOLLOW_UP_DAYS)
  );
}

/** Active tasks that block the given milestone (derived from blocksId, §15). */
export function openBlockers(milestone: Task, tasks: readonly Task[]): Task[] {
  return tasks.filter(
    (task) => task.blocksId === milestone.id && isActive(task),
  );
}

export interface TaskContext {
  me: string;
  today: string;
  tasks: readonly Task[];
}

export function matchesView(
  view: TaskViewId,
  task: Task,
  { me, today, tasks }: TaskContext,
): boolean {
  const relation = relationOf(task, me);
  switch (view) {
    case "active":
      return isActive(task);
    case "overdue": // My overdue: owner = me and deadline passed (§24)
      return task.ownerId === me && isOverdue(task, today);
    case "waiting": // Waiting for others
      return relation === "waiting-for-others" && isActive(task);
    case "waiting-me": // Others waiting for me
      return relation === "others-waiting" && isActive(task);
    case "week": // My tasks with a deadline in the next 7 days
      return (
        task.ownerId === me &&
        isActive(task) &&
        !!task.dueDate &&
        task.dueDate >= today &&
        task.dueDate < shiftDate(today, DUE_SOON_DAYS)
      );
    case "blocked":
      return (
        !!task.milestone &&
        isActive(task) &&
        openBlockers(task, tasks).length > 0
      );
    case "done":
      return !isActive(task);
  }
}

/** Earliest deadline first, tasks without a deadline last, then A–Z. */
export function byDeadline(a: Task, b: Task): number {
  const left = a.dueDate ? `${a.dueDate}${a.dueTime ?? "23:59"}` : "9999";
  const right = b.dueDate ? `${b.dueDate}${b.dueTime ?? "23:59"}` : "9999";
  return left.localeCompare(right) || a.title.localeCompare(b.title);
}

/**
 * Builds the single task list used by the Tasks page, search and calendar.
 * - Overview items become tasks; their done-ness lives in `completed` (Overview truth),
 *   the finer statuses (in-progress / cancelled) live in `edits`.
 * - Fully specified `seeds` (workspace tasks) get `edits` applied on top.
 * Calendar warnings are not tasks and are skipped.
 */
export function composeTasks({
  items,
  completed,
  seeds,
  edits,
  me,
  today,
}: {
  items: readonly AttentionItem[];
  completed: ReadonlySet<string>;
  seeds: readonly Task[];
  edits: Readonly<Record<string, Partial<Task>>>;
  me: string;
  today: string;
}): Task[] {
  const fromItems = items
    .filter((item) => item.kind !== "calendar")
    .map((item): Task => {
      const done = completed.has(item.id);
      const edit = edits[item.id];
      const wanted = edit?.status;
      return {
        ...attentionToTask(item, done, me, today),
        ...edit,
        status: done
          ? wanted === "cancelled"
            ? "cancelled"
            : "completed"
          : wanted === "in-progress"
            ? "in-progress"
            : "open",
      };
    });
  const fromSeeds = seeds.map((seed): Task => ({ ...seed, ...edits[seed.id] }));
  return [...fromItems, ...fromSeeds];
}

/* ───────────────── event-relative deadlines (§19, §20) ───────────────── */

/** Offset 0 uses the event's date and time; any other offset gives a date-only deadline. */
export function deadlineFromOffset(
  event: { date: string; time?: string },
  offset: TaskOffset,
): { dueDate: string; dueTime?: string } {
  if (offset.amount === 0) return { dueDate: event.date, dueTime: event.time };
  return {
    dueDate:
      offset.unit === "working-days"
        ? shiftWorkingDays(event.date, offset.amount)
        : shiftDate(event.date, offset.amount),
  };
}

/** Deadlines that change when `event` moves: only tasks linked to it WITH an offset, and only real changes. */
export function relinkDeadlines(
  tasks: readonly Task[],
  event: { id: string; date: string; time?: string },
): { id: string; dueDate: string; dueTime?: string }[] {
  const changes: { id: string; dueDate: string; dueTime?: string }[] = [];
  for (const task of tasks) {
    if (task.eventId !== event.id || !task.offset) continue;
    const next = deadlineFromOffset(event, task.offset);
    if (next.dueDate !== task.dueDate || next.dueTime !== task.dueTime)
      changes.push({ id: task.id, ...next });
  }
  return changes;
}

/* ───────────────── Attention + bell, derived from current task state ───────────────── */

/**
 * Re-derives the Overview items from the CURRENT tasks so labels never go stale (e.g. after a due date is edited).
 * - my task that is overdue now → "overdue" with a fresh "N days overdue" label
 * - an item that WAS "overdue" but no longer is → "follow-up" if I am waiting for it, otherwise a plain
 *   item labelled with its due date; it is never dropped, so counts and charts stay correct
 * - done tasks, calendar warnings and everything else are left untouched
 */
export function deriveAttention(
  items: readonly AttentionItem[],
  tasks: readonly Task[],
  me: string,
  today: string,
  labels: { overdue: (days: number) => string; due: (date: string) => string },
): AttentionItem[] {
  const byId = new Map(tasks.map((task) => [task.id, task]));
  return items.map((item) => {
    const task = byId.get(item.id);
    if (item.kind === "calendar" || !task || !isActive(task)) return item;
    if (task.ownerId === me && isOverdue(task, today))
      return {
        ...item,
        kind: "overdue" as const,
        label: labels.overdue(daysBetween(task.dueDate!, today)),
      };
    if (item.kind === "overdue")
      return {
        ...item,
        kind:
          relationOf(task, me) === "waiting-for-others"
            ? ("follow-up" as const)
            : ("capture" as const),
        label: task.dueDate ? labels.due(task.dueDate) : item.label,
      };
    return item;
  });
}

export type AlertReason = "overdue" | "follow-up" | "important" | "upcoming";
/** "Upcoming" = due within this many days; "important" = high priority due within IMPORTANT_DAYS. */
export const UPCOMING_DAYS = 2;
export const IMPORTANT_DAYS = 7;

export interface TaskAlert {
  task: Task;
  reason: AlertReason;
  /** Days overdue (overdue) or days until the deadline (important / upcoming). */
  days: number;
}

const alertOrder: AlertReason[] = ["overdue", "follow-up", "important", "upcoming"];

/**
 * Bell alerts, from the full task list. One alert per task, strongest reason wins:
 *   overdue (my task, deadline passed) > follow-up (§24 trigger) > important (my high-priority task
 *   due within 7 days) > upcoming (my task due within 2 days).
 */
export function taskAlerts(
  tasks: readonly Task[],
  me: string,
  today: string,
  nowTime?: string,
): TaskAlert[] {
  const alerts: TaskAlert[] = [];
  for (const task of tasks) {
    if (!isActive(task)) continue;
    const mine = task.ownerId === me;
    const until = task.dueDate ? daysBetween(today, task.dueDate) : undefined;
    if (mine && isOverdue(task, today, nowTime))
      alerts.push({ task, reason: "overdue", days: Math.max(0, -(until ?? 0)) });
    else if (needsFollowUp(task, me, today, nowTime))
      alerts.push({ task, reason: "follow-up", days: quietWorkingDays(task, today) });
    else if (mine && until !== undefined && until >= 0) {
      if (task.priority === "high" && until <= IMPORTANT_DAYS)
        alerts.push({ task, reason: "important", days: until });
      else if (until <= UPCOMING_DAYS)
        alerts.push({ task, reason: "upcoming", days: until });
    }
  }
  return alerts.sort(
    (a, b) =>
      alertOrder.indexOf(a.reason) - alertOrder.indexOf(b.reason) ||
      byDeadline(a.task, b.task),
  );
}

/** Newest creation date first. Array.sort is stable, so ties keep their original order. */
export function byNewest(a: Task, b: Task): number {
  return b.createdDate.localeCompare(a.createdDate);
}

/**
 * Bridges the dashboard's existing sample AttentionItems to the Task model.
 * A "follow-up" item owned by someone else means the current user is waiting for them.
 * Calendar warnings are not tasks and must be filtered out by the caller.
 */
export function attentionToTask(
  item: AttentionItem,
  completed: boolean,
  me: string,
  today: string,
): Task {
  return {
    id: item.id,
    title: item.title,
    description: item.description,
    ownerId: item.assigneeId,
    createdById: me,
    requesterId:
      item.kind === "follow-up" && item.assigneeId && item.assigneeId !== me
        ? me
        : undefined,
    dueDate: item.dueDate,
    projectId: item.projectId,
    status: completed ? "completed" : "open",
    createdDate: today,
    source: item.kind === "capture" ? "capture" : "manual",
    priority: item.priority,
  };
}
