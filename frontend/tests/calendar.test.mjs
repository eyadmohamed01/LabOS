import assert from "node:assert/strict";
import test from "node:test";
import {
  addDays,
  eventsOn,
  layoutDay,
  monthGrid,
  shiftMonth,
  startOfWeek,
  stepAnchor,
  weekDates,
} from "../lib/calendar.ts";

test("weeks start on Monday", () => {
  assert.equal(startOfWeek("2026-11-18"), "2026-11-16"); // Wed → Mon
  assert.equal(startOfWeek("2026-11-22"), "2026-11-16"); // Sun belongs to the previous Monday
  assert.equal(startOfWeek("2026-11-16"), "2026-11-16");
  assert.deepEqual(weekDates("2026-11-18")[6], "2026-11-22");
});

test("month grid covers the month in whole Mon–Sun weeks", () => {
  const grid = monthGrid("2026-11-18"); // 1 Nov 2026 is a Sunday
  assert.equal(grid[0][0], "2026-10-26");
  assert.equal(grid[0][6], "2026-11-01");
  assert.equal(grid.at(-1).at(-1), "2026-12-06");
  assert.ok(grid.every((week) => week.length === 7));
  assert.equal(monthGrid("2026-02-10").length, 5); // Feb 2026: Mon 26 Jan → Sun 1 Mar
});

test("month stepping clamps to the last day and crosses years", () => {
  assert.equal(shiftMonth("2026-01-31", 1), "2026-02-28");
  assert.equal(shiftMonth("2026-12-15", 1), "2027-01-15");
  assert.equal(shiftMonth("2026-01-15", -1), "2025-12-15");
  assert.equal(stepAnchor("week", "2026-11-18", -1), "2026-11-11");
  assert.equal(stepAnchor("day", "2026-11-30", 1), "2026-12-01");
  assert.equal(addDays("2026-02-28", 1), "2026-03-01");
});

test("overlapping events share a cluster; later events start a new one", () => {
  const placed = layoutDay([
    { id: "a", time: "14:00", endTime: "15:00" },
    { id: "b", time: "14:30", endTime: "15:15" },
    { id: "c", time: "16:00", endTime: "17:00" },
    { id: "allday" },
  ]);
  const byId = Object.fromEntries(placed.map((p) => [p.item.id, p]));
  assert.equal(placed.length, 3); // untimed items belong in the all-day row
  assert.deepEqual([byId.a.lane, byId.a.lanes, byId.b.lane, byId.b.lanes], [0, 2, 1, 2]);
  assert.deepEqual([byId.c.lane, byId.c.lanes], [0, 1]);
});

test("missing or invalid end times default to one hour", () => {
  const [open] = layoutDay([{ time: "10:00" }]);
  assert.equal(open.end - open.start, 60);
  const [backwards] = layoutDay([{ time: "10:00", endTime: "09:00" }]);
  assert.equal(backwards.end - backwards.start, 60);
});

test("events on a day are ordered, all-day first", () => {
  const list = eventsOn(
    [
      { id: "late", date: "2026-11-18", time: "14:00" },
      { id: "other", date: "2026-11-19", time: "09:00" },
      { id: "all", date: "2026-11-18" },
      { id: "early", date: "2026-11-18", time: "10:00" },
    ],
    "2026-11-18",
  );
  assert.deepEqual(list.map((e) => e.id), ["all", "early", "late"]);
});
