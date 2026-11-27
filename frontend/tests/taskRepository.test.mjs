import assert from "node:assert/strict";
import test from "node:test";
import { workspaceTasks } from "../lib/taskData.ts";
import {
  createMemoryTaskRepository,
  createSupabaseTaskRepository,
  isPlaceholder,
  patchToRow,
  readSupabaseConfig,
  rowToTask,
  taskToRow,
} from "../lib/taskRepository.ts";

test("every sample task survives a row round trip unchanged", () => {
  for (const task of workspaceTasks) {
    const back = rowToTask(taskToRow(task));
    assert.deepEqual(JSON.parse(JSON.stringify(back)), JSON.parse(JSON.stringify(task)));
  }
});

test("patches only include provided keys; undefined clears a column", () => {
  assert.deepEqual(patchToRow({ status: "completed" }), { status: "completed" });
  assert.deepEqual(patchToRow({ requesterId: undefined }), { requester_id: null });
  assert.deepEqual(patchToRow({ offset: { amount: -1, unit: "working-days" } }), {
    offset_amount: -1,
    offset_unit: "working-days",
  });
});

test("placeholders keep Supabase switched off", () => {
  assert.equal(isPlaceholder("https://YOUR-PROJECT-REF.supabase.co"), true);
  assert.equal(readSupabaseConfig({}), null);
  assert.equal(
    readSupabaseConfig({
      NEXT_PUBLIC_SUPABASE_URL: "https://YOUR-PROJECT-REF.supabase.co",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "YOUR-ANON-KEY",
    }),
    null,
  );
  const real = readSupabaseConfig({
    NEXT_PUBLIC_SUPABASE_URL: "https://abc.supabase.co/",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon",
  });
  assert.deepEqual(real, { url: "https://abc.supabase.co", apiKey: "anon" });
});

test("supabase repository builds the expected REST requests", async () => {
  const calls = [];
  const fetchImpl = async (url, init) => {
    calls.push({ url, ...init });
    return { ok: true, status: 200, text: async () => JSON.stringify([taskToRow(workspaceTasks[0])]) };
  };
  const repo = createSupabaseTaskRepository(
    { url: "https://abc.supabase.co", apiKey: "anon", accessToken: "jwt" },
    fetchImpl,
  );
  await repo.list();
  await repo.update("a b", { status: "completed" });
  await repo.upsertMany([workspaceTasks[0]]);
  await repo.remove("x");
  assert.equal(calls[0].url, "https://abc.supabase.co/rest/v1/tasks?select=*&order=created_date.desc");
  assert.equal(calls[0].headers.Authorization, "Bearer jwt");
  assert.equal(calls[0].headers.apikey, "anon");
  assert.equal(calls[1].method, "PATCH");
  assert.ok(calls[1].url.endsWith("?id=eq.a%20b"));
  assert.equal(calls[1].body, JSON.stringify({ status: "completed" }));
  assert.ok(calls[2].url.endsWith("?on_conflict=id"));
  assert.match(calls[2].headers.Prefer, /merge-duplicates/);
  assert.equal(calls[3].method, "DELETE");
});

test("supabase errors carry the status", async () => {
  const repo = createSupabaseTaskRepository(
    { url: "https://abc.supabase.co", apiKey: "anon" },
    async () => ({ ok: false, status: 401, text: async () => "nope" }),
  );
  await assert.rejects(repo.list(), (error) => error.status === 401);
});

test("memory repository behaves like the real one", async () => {
  const repo = createMemoryTaskRepository(workspaceTasks.slice(0, 2));
  assert.equal((await repo.list()).length, 2);
  await repo.update(workspaceTasks[0].id, { status: "completed" });
  assert.equal((await repo.get(workspaceTasks[0].id)).status, "completed");
  await repo.remove(workspaceTasks[0].id);
  assert.equal(await repo.get(workspaceTasks[0].id), null);
});
