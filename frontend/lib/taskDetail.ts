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
export function taskDetail(task: Task, locale: Locale = "en"): ItemDetail {
  const event = timelineItems.find((item) => item.id === task.eventId);
  const requester = task.requesterId ? getPerson(task.requesterId) : undefined;
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
      ...(requester
        ? [{ label: "Requested by", value: requester.name }]
        : []),
      {
        label: "Due",
        value: task.dueDate
          ? `${formatDate(task.dueDate, { year: "numeric" }, locale)}${task.dueTime ? ` · ${task.dueTime}` : ""}`
          : "No due date",
      },
      ...(event ? [{ label: "Linked event", value: event.title }] : []),
    ],
  };
}
