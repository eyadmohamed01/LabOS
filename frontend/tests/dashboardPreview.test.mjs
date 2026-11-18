import test from "node:test";
import assert from "node:assert/strict";
import { readDashboardPreview } from "../lib/dashboardPreview.ts";
import { overviewMetrics } from "../lib/dashboardInsights.ts";
import { searchDocuments } from "../lib/search.ts";

test("the empty preview is available only in development", () => {
  assert.equal(readDashboardPreview("?dashboard=empty", true), "empty");
  assert.equal(readDashboardPreview("?dashboard=empty", false), "populated");
});

test("missing or unsupported preview values keep the populated dashboard", () => {
  for (const query of [
    "",
    "?dashboard=populated",
    "?dashboard=unknown",
    "?other=empty",
  ]) {
    assert.equal(readDashboardPreview(query, true), "populated");
  }
});

test("an unconfigured workspace has zero metrics and zero indexed records", () => {
  assert.deepEqual(overviewMetrics([], new Set(), [], "2026-11-18"), {
    open: 0,
    resolved: 0,
    captured: 0,
    deadlines: 0,
  });
  assert.deepEqual(searchDocuments([], "atlas"), []);
  assert.deepEqual(searchDocuments([], "", { type: "project" }), []);
});
