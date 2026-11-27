// Populates the Supabase `tasks` table with the sample tasks from lib/taskData.ts.
//
//   node scripts/seed-supabase.mjs            → dry run: prints what WOULD be sent, touches nothing
//   node scripts/seed-supabase.mjs --apply    → upserts the rows (safe to re-run; same ids are updated)
//
// Needs Node 22.18+ (runs the .ts imports directly) and SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in the
// environment (e.g. `node --env-file=.env.local scripts/seed-supabase.mjs`). Refuses to run with YOUR-… placeholders.
import { workspaceTasks } from "../lib/taskData.ts";
import {
  createSupabaseTaskRepository,
  isPlaceholder,
  taskToRow,
} from "../lib/taskRepository.ts";

const apply = process.argv.includes("--apply");
const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log(`${workspaceTasks.length} sample tasks from lib/taskData.ts`);
if (!apply) {
  console.log("Dry run. First row as it would be stored:\n");
  console.log(JSON.stringify(taskToRow(workspaceTasks[0]), null, 2));
  console.log("\nRe-run with --apply once Supabase is set up.");
  process.exit(0);
}
if (isPlaceholder(url) || isPlaceholder(key)) {
  console.error(
    "SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are missing or still contain YOUR-… placeholders. Nothing was sent.",
  );
  process.exit(1);
}
const repository = createSupabaseTaskRepository({ url, apiKey: key });
const saved = await repository.upsertMany(workspaceTasks);
console.log(`Upserted ${saved.length} tasks.`);
