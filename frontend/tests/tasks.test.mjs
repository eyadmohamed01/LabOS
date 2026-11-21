import assert from "node:assert/strict";
import test from "node:test";
import {
  attentionToTask,
  byNewest,
  isOverdue,
  matchesView,
  needsFollowUp,
  openBlockers,
  relationOf,
  workingDaysBetween,
} from "../lib/tasks.ts";

const ME = "elena";
const TODAY = "2026-11-18"; // Wednesday
const task = (overrides = {}) => ({
  id: "t",
  title: "Task",
  description: "",
  ownerId: ME,
  status: "open",
  createdDate: "2026-11-02",
  source: "manual",
  ...overrides,
});

test("owner/requester decide the relationship; there is no waiting status", () => {
  assert.equal(relationOf(task(), ME), "personal");
  assert.equal(relationOf(task({ requesterId: ME }), ME), "personal");
  assert.equal(relationOf(task({ ownerId: "alex", requesterId: ME }), ME), "waiting-for-others");
  assert.equal(relationOf(task({ requesterId: "alex" }), ME), "others-waiting");
  assert.equal(relationOf(task({ ownerId: "alex", requesterId: "taylor" }), ME), "third-party");
});

test("date-only deadline is overdue from 00:00 the following day", () => {
  assert.equal(isOverdue(task({ dueDate: "2026-11-18" }), TODAY), false);
  assert.equal(isOverdue(task({ dueDate: "2026-11-17" }), TODAY), true);
  assert.equal(isOverdue(task({ dueDate: "2026-11-17", status: "completed" }), TODAY), false);
  // timed deadline today: overdue only once the time has passed
  const timed = task({ dueDate: TODAY, dueTime: "17:00" });
  assert.equal(isOverdue(timed, TODAY, "16:59"), false);
  assert.equal(isOverdue(timed, TODAY, "17:01"), true);
});

test("working days exclude Saturday and Sunday", () => {
  assert.equal(workingDaysBetween("2026-11-13", "2026-11-16"), 1); // Fri → Mon
  assert.equal(workingDaysBetween("2026-11-13", "2026-11-20"), 5); // Fri → next Fri
  assert.equal(workingDaysBetween("2026-11-18", "2026-11-18"), 0);
});

test("follow-up needs: others own it, I requested it, deadline passed or none, quiet > threshold", () => {
  const base = task({ ownerId: "alex", requesterId: ME, createdDate: "2026-11-02" });
  assert.equal(needsFollowUp(base, ME, TODAY), true); // no deadline, 12 working days quiet
  assert.equal(needsFollowUp({ ...base, dueDate: "2026-11-30" }, ME, TODAY), false); // not past due
  assert.equal(needsFollowUp({ ...base, dueDate: "2026-11-10" }, ME, TODAY), true);
  assert.equal(needsFollowUp({ ...base, lastContactDate: "2026-11-17" }, ME, TODAY), false); // recent contact
  assert.equal(needsFollowUp({ ...base, status: "cancelled" }, ME, TODAY), false);
  assert.equal(needsFollowUp({ ...base, ownerId: ME }, ME, TODAY), false);
  // threshold is "exceeds": 5 working days quiet is not enough, 6 is
  const five = { ...base, lastContactDate: "2026-11-11" }; // Wed → Wed = 5 working days
  assert.equal(needsFollowUp(five, ME, TODAY), false);
  assert.equal(needsFollowUp({ ...five, followUpAfterDays: 4 }, ME, TODAY), true);
  assert.equal(needsFollowUp({ ...five, lastContactDate: "2026-11-10" }, ME, TODAY), true);
});

test("blockers are derived from relationships and disappear when completed", () => {
  const milestone = task({ id: "m", milestone: true });
  const blocker = task({ id: "b", blocksId: "m" });
  const ctx = (tasks) => ({ me: ME, today: TODAY, tasks });
  assert.equal(openBlockers(milestone, [milestone, blocker]).length, 1);
  assert.equal(matchesView("blocked", milestone, ctx([milestone, blocker])), true);
  const done = { ...blocker, status: "completed" };
  assert.equal(matchesView("blocked", milestone, ctx([milestone, done])), false);
});

test("saved views", () => {
  const ctx = (tasks) => ({ me: ME, today: TODAY, tasks });
  const mineOverdue = task({ dueDate: "2026-11-10" });
  const theirsOverdue = task({ ownerId: "alex", requesterId: ME, dueDate: "2026-11-10" });
  assert.equal(matchesView("overdue", mineOverdue, ctx([])), true);
  assert.equal(matchesView("overdue", theirsOverdue, ctx([])), false); // belongs to follow-up logic
  assert.equal(matchesView("waiting", theirsOverdue, ctx([])), true);
  assert.equal(matchesView("waiting-me", task({ requesterId: "alex" }), ctx([])), true);
  assert.equal(matchesView("week", task({ dueDate: "2026-11-24" }), ctx([])), true);
  assert.equal(matchesView("week", task({ dueDate: "2026-11-25" }), ctx([])), false);
  assert.equal(matchesView("done", task({ status: "cancelled" }), ctx([])), true);
});

test("overview follow-ups owned by someone else become 'waiting for' tasks", () => {
  const item = {
    id: "budget", title: "x", kind: "follow-up", label: "", description: "",
    assigneeId: "james", priority: "normal", dueDate: "2026-11-18",
  };
  const converted = attentionToTask(item, false, ME, TODAY);
  assert.equal(relationOf(converted, ME), "waiting-for-others");
  assert.equal(attentionToTask({ ...item, assigneeId: ME }, true, ME, TODAY).status, "completed");
});

test("newest first sorts by creation date, ties keep their original order", () => {
  const older = task({ id: "older", createdDate: "2026-11-02" });
  const newer = task({ id: "newer", createdDate: "2026-11-12" });
  const tieA = task({ id: "tie-a", createdDate: "2026-11-12" });
  const sorted = [older, newer, tieA].sort(byNewest).map((t) => t.id);
  assert.deepEqual(sorted, ["newer", "tie-a", "older"]);
});
