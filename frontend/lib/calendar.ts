// Pure calendar maths. Dates are "YYYY-MM-DD" strings (Europe/Berlin wall time), weeks start on Monday (§22).
// No runtime imports, so the node:test runner can load this file directly.

export type CalendarMode = "month" | "week" | "day" | "agenda";

const noon = (date: string) => new Date(`${date}T12:00:00Z`);
const iso = (value: Date) => value.toISOString().slice(0, 10);

export function addDays(date: string, days: number): string {
  const next = noon(date);
  next.setUTCDate(next.getUTCDate() + days);
  return iso(next);
}

/** Monday of the week containing `date`. */
export function startOfWeek(date: string): string {
  const weekday = (noon(date).getUTCDay() + 6) % 7; // Mon = 0
  return addDays(date, -weekday);
}

export function weekDates(date: string): string[] {
  const start = startOfWeek(date);
  return Array.from({ length: 7 }, (_, index) => addDays(start, index));
}

/** Weeks (Mon–Sun) that cover the month of `date`: 4–6 rows. */
export function monthGrid(date: string): string[][] {
  const first = `${date.slice(0, 7)}-01`;
  const last = addDays(shiftMonth(first, 1), -1);
  const weeks: string[][] = [];
  for (let start = startOfWeek(first); start <= last; start = addDays(start, 7))
    weeks.push(weekDates(start));
  return weeks;
}

/** Same day-of-month in another month; clamps to the last day (31 Jan + 1 → 28 Feb). */
export function shiftMonth(date: string, delta: number): string {
  const [year, month, day] = date.split("-").map(Number);
  const target = new Date(Date.UTC(year, month - 1 + delta, 1, 12));
  const lastDay = new Date(
    Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0, 12),
  ).getUTCDate();
  target.setUTCDate(Math.min(day, lastDay));
  return iso(target);
}

export function sameMonth(a: string, b: string): boolean {
  return a.slice(0, 7) === b.slice(0, 7);
}

/** Moves the visible range one step in either direction. */
export function stepAnchor(mode: CalendarMode, date: string, direction: 1 | -1) {
  if (mode === "month") return shiftMonth(date, direction);
  if (mode === "week") return addDays(date, 7 * direction);
  if (mode === "day") return addDays(date, direction);
  return addDays(date, 14 * direction);
}

export function minutesOf(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

export interface Placed<T> {
  item: T;
  start: number;
  end: number;
  /** Column inside an overlapping cluster, and how many columns that cluster has. */
  lane: number;
  lanes: number;
}

/**
 * Positions timed items of one day. Items without a start time are skipped (they belong
 * in the all-day row). Missing/invalid end times default to one hour. Overlapping items
 * share a cluster and are placed side by side.
 */
export function layoutDay<T extends { time?: string; endTime?: string }>(
  items: readonly T[],
  defaultMinutes = 60,
): Placed<T>[] {
  const timed = items
    .filter((item) => item.time)
    .map((item) => {
      const start = minutesOf(item.time!);
      const end = item.endTime ? minutesOf(item.endTime) : start + defaultMinutes;
      return { item, start, end: end > start ? end : start + defaultMinutes };
    })
    .sort((a, b) => a.start - b.start || a.end - b.end);

  const placed: Placed<T>[] = [];
  let cluster: Placed<T>[] = [];
  let clusterEnd = -1;
  const flush = () => {
    const lanes = Math.max(1, ...cluster.map((entry) => entry.lane + 1));
    for (const entry of cluster) entry.lanes = lanes;
    placed.push(...cluster);
    cluster = [];
  };
  for (const entry of timed) {
    if (cluster.length && entry.start >= clusterEnd) flush();
    const taken = new Set(
      cluster.filter((other) => other.end > entry.start).map((o) => o.lane),
    );
    let lane = 0;
    while (taken.has(lane)) lane++;
    cluster.push({ ...entry, lane, lanes: 1 });
    clusterEnd = Math.max(clusterEnd, entry.end);
  }
  flush();
  return placed;
}

export function eventsOn<T extends { date: string; time?: string }>(
  events: readonly T[],
  day: string,
): T[] {
  return events
    .filter((event) => event.date === day)
    .sort((a, b) => (a.time ?? "").localeCompare(b.time ?? ""));
}
