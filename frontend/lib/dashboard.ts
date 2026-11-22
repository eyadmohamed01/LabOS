import { people, projects, workspaceDate } from "./dashboardData";
import { translate, type Locale } from "./i18n";
import type {
  AttentionItem,
  ItemDetail,
  Project,
  TimelineItem,
} from "../types/dashboard";

export function formatDate(
  date: string,
  options?: Intl.DateTimeFormatOptions,
  locale: Locale = "en",
): string {
  return new Intl.DateTimeFormat(locale === "de" ? "de-DE" : "en-GB", {
    day: "numeric",
    month: "short",
    ...options,
    timeZone: "UTC",
  }).format(new Date(`${date}T12:00:00Z`));
}

export function getProject(id?: string) {
  return projects.find((project) => project.id === id);
}

export function getPerson(id: string) {
  return people.find((person) => person.id === id);
}

export function addDays(date: string, days: number): string {
  const next = new Date(`${date}T12:00:00Z`);
  next.setUTCDate(next.getUTCDate() + days);
  return next.toISOString().slice(0, 10);
}

export function attentionDetail(
  item: AttentionItem,
  locale: Locale = "en",
): ItemDetail {
  return {
    title: item.title,
    eyebrow: item.kind === "capture" ? "Quick capture" : item.label,
    description: item.description,
    projectId: item.projectId,
    attentionId: item.id,
    facts: [
      { label: "Priority", value: item.priority ?? "normal" },
      {
        label: "Assigned to",
        value: getPerson(item.assigneeId)?.name ?? "Unassigned",
      },
      {
        label: "Due",
        value: item.dueDate
          ? formatDate(item.dueDate, { year: "numeric" }, locale)
          : "No due date",
      },
    ],
  };
}

export function timelineDetail(
  item: TimelineItem,
  locale: Locale = "en",
): ItemDetail {
  return {
    title: item.title,
    eyebrow: item.kind,
    description: item.description,
    projectId: item.projectId,
    eventId: item.id,
    facts: [
      {
        label: "When",
        value: `${formatDate(item.date, { weekday: "long" }, locale)} · ${item.time ? `${item.time}${item.endTime ? `–${item.endTime}` : ""}` : translate(locale, "All day")}`,
      },
      ...(item.location ? [{ label: "Where", value: item.location }] : []),
      {
        label: "People",
        value: item.attendeeIds
          .map((id) => getPerson(id)?.name)
          .filter(Boolean)
          .join(", "),
      },
    ],
  };
}

export function projectDetail(
  project: Project,
  locale: Locale = "en",
): ItemDetail {
  return {
    title: project.name,
    eyebrow: project.discipline,
    description: project.description,
    projectId: project.id,
    facts: [
      { label: "Status", value: project.status },
      { label: "Phase", value: project.phase },
      {
        label: "Next milestone",
        value: `${project.nextMilestone} · ${formatDate(project.dueDate, { year: "numeric" }, locale)}`,
      },
      {
        label: "Team",
        value: project.memberIds.map((id) => getPerson(id)?.name).join(", "),
      },
    ],
  };
}

export function timelinePeriod(
  date: string,
): "Today" | "Tomorrow" | "Coming up" | "Later" {
  const days = Math.round(
    (Date.parse(`${date}T12:00:00Z`) -
      Date.parse(`${workspaceDate}T12:00:00Z`)) /
      86400000,
  );
  return days <= 0
    ? "Today"
    : days === 1
      ? "Tomorrow"
      : days < 7
        ? "Coming up"
        : "Later";
}
