// Task persistence layer: READY BUT NOT CONNECTED.
//
// Nothing in the UI calls this file yet. When Supabase exists:
//   1. run supabase/schema.sql in the Supabase SQL editor,
//   2. copy .env.example to .env.local and replace the YOUR-… placeholders,
//   3. call getTaskRepository().list() on load, and .create()/.update() from saveTask in Dashboard.tsx.
//
// It talks to Supabase's REST interface (PostgREST) with plain fetch, so no new dependency is needed.
// Only type imports here, so Node can load this file in tests and in scripts/seed-supabase.mjs.

import type { Task, TaskOffset, TaskSource, TaskStatus } from "../types/tasks";

/* ───────────────────────────── configuration ───────────────────────────── */

export interface SupabaseConfig {
  /** e.g. https://YOUR-PROJECT-REF.supabase.co */
  url: string;
  /** Public "anon" key in the browser. NEVER put the service-role key in frontend code. */
  apiKey: string;
  /** The signed-in user's JWT once authentication exists. Falls back to apiKey. */
  accessToken?: string;
  table?: string;
}

/** True for empty values and for the YOUR-… placeholders from .env.example. */
export function isPlaceholder(value: string | undefined): boolean {
  return !value || value.includes("YOUR-");
}

/**
 * Browser/server config from NEXT_PUBLIC_* variables. Returns null until real values are set,
 * which makes getTaskRepository() fall back to the in-memory repository.
 * (The env defaults reference process.env.NEXT_PUBLIC_* statically so Next.js can inline them.)
 */
export function readSupabaseConfig(
  env: Record<string, string | undefined> = {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  },
): SupabaseConfig | null {
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const apiKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (isPlaceholder(url) || isPlaceholder(apiKey)) return null;
  return { url: url!.replace(/\/$/, ""), apiKey: apiKey! };
}

/* ───────────────────────────── row mapping ───────────────────────────── */

/** Database shape (snake_case). Mirrors supabase/schema.sql. Empty values are stored as null. */
export interface TaskRow {
  id: string;
  title: string;
  description: string;
  owner_id: string;
  created_by_id: string | null;
  requester_id: string | null;
  due_date: string | null;
  due_time: string | null;
  project_id: string | null;
  course_id: string | null;
  related_person_id: string | null;
  event_id: string | null;
  offset_amount: number | null;
  offset_unit: TaskOffset["unit"] | null;
  status: TaskStatus;
  created_date: string;
  last_contact_date: string | null;
  follow_up_after_days: number | null;
  source: TaskSource;
  milestone: boolean;
  blocks_id: string | null;
  priority: "high" | "normal" | "low" | null;
}

const plainColumns = [
  ["id", "id"],
  ["title", "title"],
  ["description", "description"],
  ["ownerId", "owner_id"],
  ["createdById", "created_by_id"],
  ["requesterId", "requester_id"],
  ["dueDate", "due_date"],
  ["dueTime", "due_time"],
  ["projectId", "project_id"],
  ["courseId", "course_id"],
  ["relatedPersonId", "related_person_id"],
  ["eventId", "event_id"],
  ["status", "status"],
  ["createdDate", "created_date"],
  ["lastContactDate", "last_contact_date"],
  ["followUpAfterDays", "follow_up_after_days"],
  ["source", "source"],
  ["blocksId", "blocks_id"],
  ["priority", "priority"],
] as const;

export function taskToRow(task: Task): TaskRow {
  return patchToRow(task, true) as unknown as TaskRow;
}

/** Only the provided keys; an explicitly undefined key becomes null (clears the column). */
export function patchToRow(
  patch: Partial<Task>,
  full = false,
): Partial<TaskRow> {
  const row: Record<string, unknown> = {};
  for (const [key, column] of plainColumns)
    if (full || key in patch) row[column] = patch[key] ?? null;
  if (full || "milestone" in patch) row.milestone = patch.milestone ?? false;
  if (full || "offset" in patch) {
    row.offset_amount = patch.offset?.amount ?? null;
    row.offset_unit = patch.offset?.unit ?? null;
  }
  if (full) {
    row.description = patch.description ?? "";
  }
  return row as Partial<TaskRow>;
}

export function rowToTask(row: TaskRow): Task {
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? "",
    ownerId: row.owner_id,
    createdById: row.created_by_id ?? undefined,
    requesterId: row.requester_id ?? undefined,
    dueDate: row.due_date ?? undefined,
    dueTime: row.due_time ? row.due_time.slice(0, 5) : undefined, // Postgres "time" returns HH:mm:ss
    projectId: row.project_id ?? undefined,
    courseId: row.course_id ?? undefined,
    relatedPersonId: row.related_person_id ?? undefined,
    eventId: row.event_id ?? undefined,
    offset:
      row.offset_amount !== null && row.offset_unit
        ? { amount: row.offset_amount, unit: row.offset_unit }
        : undefined,
    status: row.status,
    createdDate: row.created_date,
    lastContactDate: row.last_contact_date ?? undefined,
    followUpAfterDays: row.follow_up_after_days ?? undefined,
    source: row.source,
    milestone: row.milestone || undefined,
    blocksId: row.blocks_id ?? undefined,
    priority: row.priority ?? undefined,
  };
}

/* ───────────────────────────── repository ───────────────────────────── */

/** The only methods the UI should need. Swap implementations without touching components. */
export interface TaskRepository {
  list(): Promise<Task[]>;
  get(id: string): Promise<Task | null>;
  create(task: Task): Promise<Task>;
  update(id: string, patch: Partial<Task>): Promise<Task>;
  /** Insert or update many (used by seed scripts and future sync). */
  upsertMany(tasks: Task[]): Promise<Task[]>;
  remove(id: string): Promise<void>;
}

export class SupabaseError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "SupabaseError";
    this.status = status;
  }
}

type FetchLike = (
  input: string,
  init?: {
    method?: string;
    headers?: Record<string, string>;
    body?: string;
  },
) => Promise<{
  ok: boolean;
  status: number;
  text(): Promise<string>;
}>;

export function createSupabaseTaskRepository(
  config: SupabaseConfig,
  fetchImpl: FetchLike = (input, init) => fetch(input, init),
): TaskRepository {
  const base = `${config.url.replace(/\/$/, "")}/rest/v1/${config.table ?? "tasks"}`;

  async function request(
    query: string,
    method: string,
    body?: unknown,
    prefer?: string,
  ): Promise<TaskRow[]> {
    const response = await fetchImpl(`${base}${query}`, {
      method,
      headers: {
        apikey: config.apiKey,
        Authorization: `Bearer ${config.accessToken ?? config.apiKey}`,
        "Content-Type": "application/json",
        ...(prefer ? { Prefer: prefer } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const text = await response.text();
    if (!response.ok)
      throw new SupabaseError(
        `Supabase ${method} ${config.table ?? "tasks"} failed (${response.status}): ${text}`,
        response.status,
      );
    return text ? (JSON.parse(text) as TaskRow[]) : [];
  }
  const eq = (id: string) => `?id=eq.${encodeURIComponent(id)}`;

  return {
    async list() {
      const rows = await request("?select=*&order=created_date.desc", "GET");
      return rows.map(rowToTask);
    },
    async get(id) {
      const rows = await request(`${eq(id)}&select=*`, "GET");
      return rows[0] ? rowToTask(rows[0]) : null;
    },
    async create(task) {
      const rows = await request("", "POST", taskToRow(task), "return=representation");
      return rowToTask(rows[0]);
    },
    async update(id, patch) {
      const rows = await request(eq(id), "PATCH", patchToRow(patch), "return=representation");
      if (!rows[0]) throw new SupabaseError(`Task ${id} not found`, 404);
      return rowToTask(rows[0]);
    },
    async upsertMany(tasks) {
      if (tasks.length === 0) return [];
      const rows = await request(
        "?on_conflict=id",
        "POST",
        tasks.map(taskToRow),
        "resolution=merge-duplicates,return=representation",
      );
      return rows.map(rowToTask);
    },
    async remove(id) {
      await request(eq(id), "DELETE");
    },
  };
}

/** Same interface, held in memory. Used until Supabase is configured, and in tests. */
export function createMemoryTaskRepository(initial: Task[] = []): TaskRepository {
  const store = new Map(initial.map((task) => [task.id, task]));
  return {
    async list() {
      return [...store.values()];
    },
    async get(id) {
      return store.get(id) ?? null;
    },
    async create(task) {
      store.set(task.id, task);
      return task;
    },
    async update(id, patch) {
      const current = store.get(id);
      if (!current) throw new Error(`Task ${id} not found`);
      const next = { ...current, ...patch, id };
      store.set(id, next);
      return next;
    },
    async upsertMany(tasks) {
      for (const task of tasks) store.set(task.id, task);
      return tasks;
    },
    async remove(id) {
      store.delete(id);
    },
  };
}

/** Supabase when configured, otherwise in-memory. The one function the app should call. */
export function getTaskRepository(initial: Task[] = []): TaskRepository {
  const config = readSupabaseConfig();
  return config
    ? createSupabaseTaskRepository(config)
    : createMemoryTaskRepository(initial);
}
