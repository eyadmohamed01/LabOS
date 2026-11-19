import test from "node:test";
import assert from "node:assert/strict";
import {
  overviewMetrics,
  projectTaskCounts,
  conflictingEvents,
} from "../lib/dashboardInsights.ts";
import {
  attentionItems,
  timelineItems,
  workspaceDate,
} from "../lib/dashboardData.ts";

test("metrics count tasks and deadlines without treating calendar warnings as work", () => {
  assert.deepEqual(
    overviewMetrics(attentionItems, new Set(), timelineItems, workspaceDate),
    { open: 4, resolved: 0, captured: 0, deadlines: 2 },
  );
  assert.deepEqual(
    overviewMetrics(
      attentionItems,
      new Set(["ethics", "conflict"]),
      timelineItems,
      workspaceDate,
    ),
    { open: 3, resolved: 1, captured: 0, deadlines: 2 },
  );
});
test("capture and reopening propagate to metrics and project summaries", () => {
  const item = {
    ...attentionItems[0],
    id: "capture",
    kind: "capture",
    label: "Just captured",
    priority: "normal",
  };
  const items = [...attentionItems, item];
  assert.equal(
    overviewMetrics(items, new Set(), timelineItems, workspaceDate).captured,
    1,
  );
  assert.deepEqual(
    projectTaskCounts("fieldnotes", items, new Set(["ethics"])),
    { open: 2, overdue: 0 },
  );
  assert.deepEqual(projectTaskCounts("fieldnotes", items, new Set()), {
    open: 3,
    overdue: 1,
  });
});
test("deadlines use a seven-day window and exclude meetings and milestones", () => {
  const deadline = timelineItems.find((item) => item.kind === "deadline");
  const schedule = [
    { ...deadline, date: "2026-11-17" },
    { ...deadline, date: "2026-11-24" },
    { ...deadline, date: "2026-11-25" },
  ];
  assert.equal(
    overviewMetrics([], new Set(), schedule, workspaceDate).deadlines,
    1,
  );
});
test("overlaps require a common attendee and actual overlapping time ranges", () => {
  assert.deepEqual([...conflictingEvents(timelineItems, "elena")].sort(), [
    "partner",
    "seminar",
  ]);
  assert.equal(conflictingEvents(timelineItems, "sofia").size, 0);
  const meeting = timelineItems[0];
  assert.equal(
    conflictingEvents(
      [
        { ...meeting, id: "a", time: "10:00", endTime: "11:00" },
        { ...meeting, id: "b", time: "11:00", endTime: "12:00" },
      ],
      "elena",
    ).size,
    0,
  );
});
