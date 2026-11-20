// Task model from the LabOS Implementation Brief (§8–§10, §15, §19).
// Statuses are exactly these four; there is deliberately NO "waiting" status.
// "Waiting" is derived from owner / requester (see lib/tasks.ts).

export type TaskStatus = "open" | "in-progress" | "completed" | "cancelled";
export type TaskSource = "manual" | "capture" | "calendar" | "suggestion";

export interface TaskOffset {
  /** Negative = before the linked Event, positive = after, 0 = same moment. */
  amount: number;
  unit: "calendar-days" | "working-days";
}

export interface Task {
  id: string;
  title: string;
  description: string;
  /** Person who must act. */
  ownerId: string;
  /** Person waiting for the result. Empty or equal to owner = personal task. */
  requesterId?: string;
  /** Deadline date (YYYY-MM-DD, Europe/Berlin) and optional time (HH:mm). */
  dueDate?: string;
  dueTime?: string;
  projectId?: string;
  courseId?: string;
  relatedPersonId?: string;
  /** One specific Event occurrence this task is linked to. */
  eventId?: string;
  /** Present when the deadline is derived from the linked Event. */
  offset?: TaskOffset;
  status: TaskStatus;
  createdDate: string;
  /** Last external contact (YYYY-MM-DD). Empty → createdDate is the reference. */
  lastContactDate?: string;
  /** Overrides the global follow-up threshold (working days). */
  followUpAfterDays?: number;
  source: TaskSource;
  /** A Milestone is a Task with this flag (§15). */
  milestone?: boolean;
  /** "Task X blocks Milestone Y": X.blocksId = Y.id. Blockers are derived, never counted by hand. */
  blocksId?: string;
  priority?: "high" | "normal" | "low";
}

/** Saved views required by §34 that are about tasks. */
export type TaskViewId =
  | "active"
  | "overdue"
  | "waiting"
  | "waiting-me"
  | "week"
  | "blocked"
  | "done";

export type TaskRelation =
  | "personal"
  | "waiting-for-others"
  | "others-waiting"
  | "third-party";
