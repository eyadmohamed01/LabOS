export type Section =
  | "overview"
  | "projects"
  | "tasks"
  | "calendar"
  | "people"
  | "decisions"
  | "documents";
export type Tone = "violet" | "sage" | "blue" | "amber";

export interface Person {
  id: string;
  name: string;
  initials: string;
  role: string;
  tone: Tone;
}

export interface Project {
  id: string;
  code: string;
  name: string;
  description: string;
  discipline: string;
  status: "On track" | "Needs attention";
  phase: string;
  nextMilestone: string;
  dueDate: string;
  memberIds: string[];
  tone: Tone;
}

export type AttentionKind = "overdue" | "follow-up" | "calendar" | "capture";

export interface AttentionItem {
  id: string;
  title: string;
  kind: AttentionKind;
  label: string;
  description: string;
  projectId?: string;
  assigneeId: string;
  priority: "high" | "normal" | "low";
  dueDate?: string;
}

export interface TimelineItem {
  id: string;
  title: string;
  kind: "meeting" | "deadline" | "milestone";
  date: string;
  time?: string;
  endTime?: string;
  location?: string;
  projectId?: string;
  description: string;
  attendeeIds: string[];
}

export interface ItemDetail {
  title: string;
  eyebrow: string;
  description: string;
  projectId?: string;
  facts: { label: string; value: string }[];
  attentionId?: string;
}
