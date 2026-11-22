"use client";

import { useRef, useState, type FormEvent } from "react";
import type { Person, TimelineItem } from "../../types/dashboard";
import type { Task, TaskStatus } from "../../types/tasks";
import { Dialog } from "./Dialog";
import { useLocale } from "./LocaleProvider";

const statuses: { id: TaskStatus; label: "Open" | "In progress" | "Completed" | "Cancelled" }[] = [
  { id: "open", label: "Open" },
  { id: "in-progress", label: "In progress" },
  { id: "completed", label: "Completed" },
  { id: "cancelled", label: "Cancelled" },
];

/**
 * Add / edit form for one task. Returns a complete Task; a new task has id "" and the
 * caller assigns the id. `people` is empty in a fresh workspace: the only choice is then "me".
 */
export function TaskDialog({
  task,
  people,
  projects,
  events,
  milestones,
  me,
  today,
  onSave,
  onClose,
}: {
  task?: Task;
  people: Person[];
  projects: { id: string; name: string }[];
  events: TimelineItem[];
  /** Milestones a task can block (excludes the task being edited). */
  milestones: Task[];
  /** Current user id; "" in a fresh workspace. */
  me: string;
  today: string;
  onSave: (task: Task) => void;
  onClose: () => void;
}) {
  const { t, formatDate } = useLocale();
  const editing = !!task;
  const titleRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState(task?.title ?? "");
  const [description, setDescription] = useState(task?.description ?? "");
  const [ownerId, setOwnerId] = useState(task?.ownerId ?? me);
  const [requesterId, setRequesterId] = useState(task?.requesterId ?? "");
  const [createdById, setCreatedById] = useState(task?.createdById ?? me);
  const [dueDate, setDueDate] = useState(task?.dueDate ?? "");
  const [dueTime, setDueTime] = useState(task?.dueTime ?? "");
  const [projectId, setProjectId] = useState(task?.projectId ?? "");
  const [priority, setPriority] = useState(task?.priority ?? "normal");
  const [status, setStatus] = useState<TaskStatus>(task?.status ?? "open");
  const [eventId, setEventId] = useState(task?.eventId ?? "");
  const [followUp, setFollowUp] = useState(
    task?.followUpAfterDays ? String(task.followUpAfterDays) : "",
  );
  const [lastContact, setLastContact] = useState(task?.lastContactDate ?? "");
  const [milestone, setMilestone] = useState(!!task?.milestone);
  const [blocksId, setBlocksId] = useState(task?.blocksId ?? "");

  // With no workspace people the only person is the user themself.
  const choices =
    people.length > 0
      ? people.map((person) => ({ id: person.id, name: person.name }))
      : [{ id: "", name: t("Professor") }];

  function chooseEvent(id: string) {
    setEventId(id);
    const event = events.find((item) => item.id === id);
    if (event && !dueDate) {
      setDueDate(event.date);
      if (event.time) setDueTime(event.time);
    }
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!title.trim()) return;
    onSave({
      ...task,
      id: task?.id ?? "",
      title: title.trim(),
      description: description.trim(),
      ownerId,
      createdById: createdById || undefined,
      requesterId: requesterId || undefined,
      dueDate: dueDate || undefined,
      dueTime: dueDate && dueTime ? dueTime : undefined,
      projectId: projectId || undefined,
      eventId: eventId || undefined,
      priority: priority as Task["priority"],
      status,
      followUpAfterDays: followUp ? Math.max(1, Number(followUp)) : undefined,
      lastContactDate: lastContact || undefined,
      milestone: milestone || undefined,
      blocksId: blocksId || undefined,
      createdDate: task?.createdDate ?? today,
      source: task?.source ?? "manual",
    });
  }

  return (
    <Dialog
      className="task-dialog"
      title={t(editing ? "Edit task" : "Add task")}
      eyebrow={t("Task")}
      onClose={onClose}
      initialFocus={titleRef}
    >
      <form className="task-form" onSubmit={submit}>
        <label className="field field-wide">
          <span>{t("Title")}</span>
          <input
            ref={titleRef}
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            maxLength={240}
            required
            autoComplete="off"
            placeholder={t("What needs to be done?")}
          />
        </label>
        <label className="field field-wide">
          <span>{t("Description")}</span>
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={3}
            maxLength={2000}
          />
        </label>
        <label className="field">
          <span>{t("Assigned to")}</span>
          <select value={ownerId} onChange={(event) => setOwnerId(event.target.value)}>
            {choices.map((person) => (
              <option key={person.id} value={person.id}>
                {person.name}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>{t("Requested by")}</span>
          <select
            value={requesterId}
            onChange={(event) => setRequesterId(event.target.value)}
          >
            <option value="">{t("Nobody (personal task)")}</option>
            {people.map((person) => (
              <option key={person.id} value={person.id}>
                {person.name}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>{t("Created by")}</span>
          <select
            value={createdById}
            onChange={(event) => setCreatedById(event.target.value)}
          >
            {choices.map((person) => (
              <option key={person.id} value={person.id}>
                {person.name}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>{t("Project")}</span>
          <select value={projectId} onChange={(event) => setProjectId(event.target.value)}>
            <option value="">{t("No project")}</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>{t("Due date")}</span>
          <input
            type="date"
            value={dueDate}
            onChange={(event) => setDueDate(event.target.value)}
          />
        </label>
        <label className="field">
          <span>{t("Due time")}</span>
          <input
            type="time"
            value={dueTime}
            disabled={!dueDate}
            onChange={(event) => setDueTime(event.target.value)}
          />
        </label>
        <label className="field">
          <span>{t("Priority")}</span>
          <select value={priority} onChange={(event) => setPriority(event.target.value as typeof priority)}>
            <option value="high">{t("high")}</option>
            <option value="normal">{t("normal")}</option>
            <option value="low">{t("low")}</option>
          </select>
        </label>
        {editing && (
          <label className="field">
            <span>{t("Status")}</span>
            <select value={status} onChange={(event) => setStatus(event.target.value as TaskStatus)}>
              {statuses.map(({ id, label }) => (
                <option key={id} value={id}>
                  {t(label)}
                </option>
              ))}
            </select>
          </label>
        )}

        <details className="task-form-more field-wide">
          <summary>{t("More details")}</summary>
          <div className="task-form-grid">
            {events.length > 0 && (
              <label className="field field-wide">
                <span>{t("Linked event")}</span>
                <select value={eventId} onChange={(event) => chooseEvent(event.target.value)}>
                  <option value="">{t("No linked event")}</option>
                  {events.map((item) => (
                    <option key={item.id} value={item.id}>
                      {formatDate(item.date)} · {item.title}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <label className="field">
              <span>{t("Follow up after (working days)")}</span>
              <input
                type="number"
                min={1}
                max={60}
                value={followUp}
                placeholder="5"
                onChange={(event) => setFollowUp(event.target.value)}
              />
            </label>
            <label className="field">
              <span>{t("Last contact")}</span>
              <input
                type="date"
                value={lastContact}
                onChange={(event) => setLastContact(event.target.value)}
              />
            </label>
            <label className="field field-check">
              <input
                type="checkbox"
                checked={milestone}
                onChange={(event) => setMilestone(event.target.checked)}
              />
              <span>{t("This task is a milestone")}</span>
            </label>
            {milestones.length > 0 && (
              <label className="field">
                <span>{t("Blocks milestone")}</span>
                <select value={blocksId} onChange={(event) => setBlocksId(event.target.value)}>
                  <option value="">{t("Nothing")}</option>
                  {milestones.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.title}
                    </option>
                  ))}
                </select>
              </label>
            )}
          </div>
        </details>

        <div className="dialog-actions field-wide">
          <button type="button" className="button" onClick={onClose}>
            {t("Cancel")}
          </button>
          <button type="submit" className="button button-primary" disabled={!title.trim()}>
            {t(editing ? "Save changes" : "Add task")}
          </button>
        </div>
      </form>
    </Dialog>
  );
}
