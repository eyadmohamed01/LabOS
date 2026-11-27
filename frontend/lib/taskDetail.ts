import { formatDate, getPerson } from "./dashboard";
import { timelineItems } from "./dashboardData";
import type { Locale } from "./i18n";
import type { ItemDetail } from "../types/dashboard";
import type { Task, TaskStatus } from "../types/tasks";

export const statusLabels: Record<TaskStatus, string> = {
  open: "Open",
  "in-progress": "In progress",
  completed: "Completed",
  cancelled: "Cancelled",
};

// Values are English source strings; the dialog translates them with text().
// `events` defaults to the sample schedule; pass the live list so newly added events resolve too.
export function taskDetail(
  task: Task,
  locale: Locale = "en",
  all: readonly Task[] = [],
  events: readonly { id: string; title: string }[] = timelineItems,
): ItemDetail {
  const date = (value: string) => formatDate(value, { year: "numeric" }, locale);
  const requester = task.requesterId ? getPerson(task.requesterId) : undefined;
  const creator = task.createdById ? getPerson(task.createdById) : undefined;
  const event = events.find((item) => item.id === task.eventId);
  const blocked = all.find((item) => item.id === task.blocksId);
  return {
    title: task.title,
    eyebrow: task.milestone ? "Milestone" : "Task",
    description: task.description || "No description.",
    projectId: task.projectId,
    attentionId: task.id,
    facts: [
      { label: "Status", value: statusLabels[task.status] },
      {
        label: "Assigned to",
        value: getPerson(task.ownerId)?.name ?? "Unassigned",
      },
      ...(requester ?? creator
        ? [{ label: "Assigned by", value: (requester ?? creator)!.name }]
        : []),
      { label: "Created", value: date(task.createdDate) },
      {
        label: "Due",
        value: task.dueDate
          ? `${date(task.dueDate)}${task.dueTime ? ` · ${task.dueTime}` : ""}`
          : "No due date",
      },
      { label: "Priority", value: task.priority ?? "normal" },
      ...(event ? [{ label: "Linked event", value: event.title }] : []),
      ...(blocked ? [{ label: "Blocks milestone", value: blocked.title }] : []),
      ...(task.lastContactDate
        ? [{ label: "Last contact", value: date(task.lastContactDate) }]
        : []),
      ...(task.followUpAfterDays
        ? [
            {
              label: "Follow up after (working days)",
              value: String(task.followUpAfterDays),
            },
          ]
        : []),
    ],
  };
}
