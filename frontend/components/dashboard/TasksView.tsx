"use client";

import { useMemo, useState } from "react";
import { useAnimatedList } from "../../hooks/useAnimatedList";
import { getPerson } from "../../lib/dashboard";
import { currentUserId, workspaceDate } from "../../lib/dashboardData";
import type { TranslationKey } from "../../lib/i18n";
import {
  byDeadline,
  byNewest,
  isActive,
  isOverdue,
  matchesView,
  needsFollowUp,
  openBlockers,
  quietWorkingDays,
  relationOf,
  type TaskContext,
} from "../../lib/tasks";
import type { Person, Project } from "../../types/dashboard";
import type { Task, TaskStatus, TaskViewId } from "../../types/tasks";
import { Icon } from "./Icon";
import { useLocale } from "./LocaleProvider";
import { Avatar, ProjectLabel } from "./Primitives";

type SortMode = "deadline" | "newest" | "title";

const views: { id: TaskViewId; label: TranslationKey; hint: TranslationKey }[] =
  [
    { id: "active", label: "Active", hint: "Open and in-progress tasks." },
    { id: "overdue", label: "My overdue", hint: "Tasks you own whose deadline has passed." },
    { id: "waiting", label: "Waiting for others", hint: "Tasks owned by someone else that you requested." },
    { id: "waiting-me", label: "Others waiting for me", hint: "Tasks you own that someone else requested." },
    { id: "week", label: "Due this week", hint: "Your tasks due in the next 7 days." },
    { id: "blocked", label: "Blocked milestones", hint: "Milestones with an open blocking task." },
    { id: "done", label: "Completed", hint: "Completed and cancelled tasks." },
  ];

const statusKeys: Record<TaskStatus, TranslationKey> = {
  open: "Open",
  "in-progress": "In progress",
  completed: "Completed",
  cancelled: "Cancelled",
};

const firstName = (id: string) => getPerson(id)?.name.split(" ")[0] ?? "";

export function TasksView({
  tasks,
  projects,
  people,
  onToggle,
  onOpen,
  onEdit,
  onAddTask,
}: {
  /** The composed task list (see composeTasks). */
  tasks: Task[];
  projects: Project[];
  /** Workspace members. Pass [] for a fresh workspace. */
  people: Person[];
  onToggle: (id: string) => void;
  onOpen: (task: Task) => void;
  onEdit: (task: Task) => void;
  onAddTask: () => void;
}) {
  const { t, locale, formatDate } = useLocale();
  const me = currentUserId;
  const today = workspaceDate;

  const [view, setView] = useState<TaskViewId>("active");
  const [query, setQuery] = useState("");
  const [project, setProject] = useState("");
  const [person, setPerson] = useState("");
  const [sort, setSort] = useState<SortMode>("deadline");

  const context: TaskContext = { me, today, tasks };
  const activeView = views.find(({ id }) => id === view) ?? views[0];

  // Filter choices come only from the tasks in the CURRENT view, so nothing offered can lead to an empty list.
  const viewTasks = useMemo(
    () => tasks.filter((task) => matchesView(view, task, { me, today, tasks })),
    [tasks, view, me, today],
  );
  const projectChoices = projects.filter((item) =>
    viewTasks.some((task) => task.projectId === item.id),
  );
  const hasNoProject = viewTasks.some((task) => !task.projectId);
  const personChoices = people.filter((item) =>
    viewTasks.some(
      (task) => task.ownerId === item.id || task.requesterId === item.id,
    ),
  );
  const showProject = projectChoices.length + (hasNoProject ? 1 : 0) > 1;
  const showPerson = personChoices.length > 1;
  const showToolbar = viewTasks.length > 0;

  // A remembered selection that does not exist in this view is ignored (and shown as "all").
  const projectValue =
    showToolbar &&
    showProject &&
    (project === "none" ? hasNoProject : projectChoices.some((p) => p.id === project))
      ? project
      : "";
  const personValue =
    showToolbar && showPerson && personChoices.some((p) => p.id === person)
      ? person
      : "";
  const queryValue = showToolbar ? query : "";

  const scoped = useMemo(() => {
    const needle = queryValue.trim().toLowerCase();
    return tasks.filter((task) => {
      if (projectValue === "none" && task.projectId) return false;
      if (projectValue && projectValue !== "none" && task.projectId !== projectValue)
        return false;
      if (personValue && task.ownerId !== personValue && task.requesterId !== personValue)
        return false;
      return (
        !needle ||
        `${task.title} ${task.description}`.toLowerCase().includes(needle)
      );
    });
  }, [tasks, queryValue, projectValue, personValue]);

  const counts = Object.fromEntries(
    views.map(({ id }) => [
      id,
      scoped.filter((task) => matchesView(id, task, context)).length,
    ]),
  ) as Record<TaskViewId, number>;

  const visible = useMemo(() => {
    const list = scoped.filter((task) =>
      matchesView(view, task, { me, today, tasks }),
    );
    if (sort === "title")
      return [...list].sort((a, b) => a.title.localeCompare(b.title, locale));
    if (sort === "deadline") return [...list].sort(byDeadline);
    return [...list].sort(byNewest);
  }, [scoped, view, sort, locale, me, today, tasks]);

  const listRef = useAnimatedList<HTMLUListElement>(
    visible.map((task) => `${task.id}:${task.status}`).join("|"),
  );

  const hasFilters = !!(queryValue || projectValue || personValue);
  const resetFilters = () => {
    setQuery("");
    setProject("");
    setPerson("");
  };

  function rowStatus(task: Task): { label: string; className: string } {
    if (!isActive(task))
      return { label: t(statusKeys[task.status]), className: "status-capture" };
    if (isOverdue(task, today))
      return { label: t("Overdue"), className: "status-overdue" };
    if (needsFollowUp(task, me, today))
      return { label: t("Follow up"), className: "status-follow-up" };
    if (task.milestone && openBlockers(task, tasks).length > 0)
      return { label: t("Blocked"), className: "status-calendar" };
    return { label: t(statusKeys[task.status]), className: "status-capture" };
  }

  function relationText(task: Task): string | null {
    const relation = relationOf(task, me);
    if (relation === "waiting-for-others")
      return t("Waiting for {name}", { name: firstName(task.ownerId) });
    if (relation === "others-waiting" && task.requesterId)
      return t("{name} is waiting for you", { name: firstName(task.requesterId) });
    return null;
  }

  return (
    <div className="tasks-view">
      <section aria-labelledby="tasks-heading" className="attention-zone">
        <div className="section-heading">
          <div>
            <h2 id="tasks-heading">
              <span className="section-marker marker-amber" />
              {t("All tasks")}
              <span className="count">{tasks.length}</span>
            </h2>
            <p>{t("Tasks you own and tasks you are waiting on.")}</p>
          </div>
        </div>

        <div className="panel attention-panel tasks-panel">
          <div
            className="filter-row tasks-views"
            role="group"
            aria-label={t("Saved task views")}
          >
            {views.map(({ id, label }) => (
              <button
                key={id}
                type="button"
                aria-pressed={view === id}
                className={view === id ? "filter-active" : ""}
                onClick={() => setView(id)}
              >
                {t(label)}
                <span>{counts[id]}</span>
              </button>
            ))}
          </div>
          <p className="tasks-view-hint">{t(activeView.hint)}</p>

          {showToolbar && (
            <div className="tasks-toolbar">
              <div className="search-input tasks-search">
                <Icon name="search" size={16} />
                <label className="sr-only" htmlFor="tasks-filter">
                  {t("Filter tasks")}
                </label>
                <input
                  id="tasks-filter"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder={t("Filter tasks by title or description…")}
                  autoComplete="off"
                  spellCheck={false}
                  maxLength={200}
                />
                {query && (
                  <button
                    type="button"
                    className="icon-button"
                    aria-label={t("Clear search")}
                    onClick={() => setQuery("")}
                  >
                    <Icon name="close" size={14} />
                  </button>
                )}
              </div>
              {showProject && (
                <label>
                  <span>{t("Project")}</span>
                  <select
                    value={projectValue}
                    onChange={(event) => setProject(event.target.value)}
                  >
                    <option value="">{t("All projects")}</option>
                    {hasNoProject && <option value="none">{t("Lab workspace")}</option>}
                    {projectChoices.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              {showPerson && (
                <label>
                  <span>{t("Person")}</span>
                  <select
                    value={personValue}
                    onChange={(event) => setPerson(event.target.value)}
                  >
                    <option value="">{t("Anyone")}</option>
                    {personChoices.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              {viewTasks.length > 1 && (
                <label>
                  <span>{t("Sort by")}</span>
                  <select
                    value={sort}
                    onChange={(event) => setSort(event.target.value as SortMode)}
                  >
                    <option value="deadline">{t("Deadline")}</option>
                    <option value="newest">{t("Newest first")}</option>
                    <option value="title">{t("Title A–Z")}</option>
                  </select>
                </label>
              )}
              {hasFilters && (
                <button type="button" className="text-button" onClick={resetFilters}>
                  {t("Reset filters")}
                </button>
              )}
            </div>
          )}

          <ul className="attention-list" ref={listRef}>
            {visible.map((task) => {
              const done = !isActive(task);
              const status = rowStatus(task);
              const relation = relationText(task);
              const creator = task.createdById ? getPerson(task.createdById) : undefined;
              const blockers = task.milestone ? openBlockers(task, tasks).length : 0;
              const quiet = needsFollowUp(task, me, today)
                ? quietWorkingDays(task, today)
                : null;
              return (
                <li
                  key={task.id}
                  data-motion-id={task.id}
                  className={`attention-item${done ? " item-complete" : ""}`}
                >
                  <label className="completion-control">
                    <input
                      type="checkbox"
                      checked={task.status === "completed"}
                      onChange={() => onToggle(task.id)}
                      aria-label={`${t(done ? "Reopen" : "Resolve")}: ${task.title}`}
                    />
                    <span className="checkbox-visual">
                      <Icon name="check" size={13} />
                    </span>
                  </label>
                  <div className="attention-content">
                    <span className={`item-status ${status.className}`}>{status.label}</span>
                    <button type="button" className="item-title" onClick={() => onOpen(task)}>
                      {task.title}
                      {task.milestone && (
                        <span className="event-tag tag-milestone">{t("Milestone")}</span>
                      )}
                    </button>
                    {task.description && (
                      <p className="task-description">{task.description}</p>
                    )}
                    <div className="item-meta">
                      <span className="task-meta-group">
                        <ProjectLabel projectId={task.projectId} />
                        <span className="task-meta-text">
                          <Icon name="calendar" size={12} />
                          {task.dueDate
                            ? `${formatDate(task.dueDate)}${task.dueTime ? ` · ${task.dueTime}` : ""}`
                            : t("No deadline")}
                        </span>
                        <span className="task-meta-text task-priority">
                          <span className={`priority-dot priority-${task.priority ?? "normal"}`} />
                          {t(task.priority ?? "normal")}
                        </span>
                        {relation && (
                          <span className="task-meta-text task-relation">
                            <Icon name="people" size={12} />
                            {relation}
                          </span>
                        )}
                        {creator && creator.id !== task.ownerId && (
                          <span className="task-meta-text">
                            {t("Assigned by {name}", { name: creator.name })}
                          </span>
                        )}
                        {quiet !== null && (
                          <span className="task-meta-text">
                            <Icon name="clock" size={12} />
                            {t("No reply for {count} working days", { count: quiet })}
                          </span>
                        )}
                        {blockers > 0 && (
                          <span className="task-meta-text">
                            <Icon name="warning" size={12} />
                            {t(
                              blockers === 1 ? "{count} open blocker" : "{count} open blockers",
                              { count: blockers },
                            )}
                          </span>
                        )}
                      </span>
                      <span className="task-row-actions">
                        <button
                          type="button"
                          className="text-button"
                          onClick={() => onEdit(task)}
                          aria-label={`${t("Edit")}: ${task.title}`}
                        >
                          {t("Edit")}
                        </button>
                        <Avatar personId={task.ownerId} small />
                      </span>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>

          {visible.length === 0 && (
            <div className="empty-state">
              <span className="empty-icon">
                <Icon name={tasks.length === 0 ? "plus" : "check"} size={25} />
              </span>
              <h3>
                {t(
                  tasks.length === 0
                    ? "No tasks yet"
                    : hasFilters
                      ? "No matching tasks"
                      : "No tasks in this view",
                )}
              </h3>
              <p>
                {t(
                  tasks.length === 0
                    ? "Add your first task and it will show up here."
                    : hasFilters
                      ? "Try fewer words or adjust the filters."
                      : "Nothing in this view.",
                )}
              </p>
              {tasks.length === 0 ? (
                <button type="button" className="text-button" onClick={onAddTask}>
                  {t("Add task")}
                  <Icon name="arrow" size={14} />
                </button>
              ) : hasFilters ? (
                <button type="button" className="text-button" onClick={resetFilters}>
                  {t("Reset filters")}
                </button>
              ) : null}
            </div>
          )}

          <div className="panel-footer">
            <span>
              <span className="tiny-dot" />
              {t("{count} results", { count: visible.length })}
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}
