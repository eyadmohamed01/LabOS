import test from "node:test";
import assert from "node:assert/strict";
import { searchDocuments, highlightMatches } from "../lib/search.ts";
import {
  attentionItems,
  projects,
  people,
  timelineItems,
} from "../lib/dashboardData.ts";

const documents = [
  ...attentionItems.map((item) => ({
    id: item.id,
    type: "task",
    status: "open",
    title: item.title,
    description: item.description,
    project:
      projects.find((project) => project.id === item.projectId)?.name ?? "",
    people: people.find((person) => person.id === item.assigneeId)?.name ?? "",
    labels: item.priority,
  })),
  ...projects.map((project) => ({
    id: project.id,
    type: "project",
    status: "active",
    title: project.name,
    description: project.description,
    project: project.name,
    people: project.memberIds
      .map((id) => people.find((person) => person.id === id)?.name)
      .join(" "),
    labels: project.phase,
  })),
  ...timelineItems.map((item) => ({
    id: item.id,
    type: "event",
    status: "scheduled",
    title: item.title,
    description: item.description,
    project:
      projects.find((project) => project.id === item.projectId)?.name ?? "",
    people: item.attendeeIds
      .map((id) => people.find((person) => person.id === id)?.name)
      .join(" "),
    labels: item.kind,
  })),
];

test("a single letter searches title word prefixes, not every description", () => {
  const hits = searchDocuments(documents, "a");
  assert.ok(hits.length > 0 && hits.length < documents.length);
  assert.ok(
    hits.every(({ document }) =>
      document.title
        .toLowerCase()
        .split(/\W+/)
        .some((word) => word.startsWith("a")),
    ),
  );
  assert.ok(!hits.some(({ document }) => document.id === "budget"));
});
test("exact titles rank before descriptive matches", () => {
  assert.equal(
    searchDocuments(documents, "review ethics application")[0].document.id,
    "ethics",
  );
  assert.equal(searchDocuments(documents, "ethics")[0].document.id, "ethics");
});
test("all terms must match, including across title and assignee", () => {
  assert.deepEqual(
    searchDocuments(documents, "ethics elena", { type: "task" }).map(
      ({ document }) => document.id,
    ),
    ["ethics"],
  );
  assert.equal(searchDocuments(documents, "ethics qzvx").length, 0);
});
test("common transposition typos are tolerated for longer words", () => {
  const hits = searchDocuments(documents, "ethcis");
  assert.equal(hits[0].document.id, "ethics");
  assert.equal(hits[0].approximate, true);
});
test("type, project and resolved status compose without leaking results", () => {
  const withResolved = documents.map((item) =>
    item.id === "ethics" ? { ...item, status: "resolved" } : item,
  );
  const hits = searchDocuments(withResolved, "", {
    type: "task",
    status: "resolved",
    project: "Fieldnotes",
  });
  assert.deepEqual(
    hits.map(({ document }) => document.id),
    ["ethics"],
  );
  assert.equal(
    searchDocuments(withResolved, "ethics", { status: "open" }).some(
      ({ document }) => document.id === "ethics",
    ),
    false,
  );
});
test("accents and German sharp-s normalize while highlights preserve the original", () => {
  const item = {
    ...documents[0],
    title: "Überprüfung der Geräte in der Straße",
  };
  assert.equal(searchDocuments([item], "uberprufung gerate strasse").length, 1);
  const parts = highlightMatches(item.title, "uberprufung");
  assert.equal(parts.map((part) => part.text).join(""), item.title);
  assert.equal(parts.find((part) => part.match)?.text, "Überprüfung");
});
test("empty input is distinct from suggestions and real filters still work", () => {
  assert.equal(searchDocuments(documents, "   ").length, 0);
  assert.equal(
    searchDocuments(documents, "", { type: "project" }).length,
    projects.length,
  );
  assert.equal(searchDocuments(documents, "qzvx-no-match").length, 0);
});
test("titles captured in the session participate in the same index", () => {
  const capture = {
    ...documents[0],
    id: "capture",
    title: "Arrange committee meeting",
  };
  assert.equal(
    searchDocuments([...documents, capture], "arrange")[0].document.id,
    "capture",
  );
});
