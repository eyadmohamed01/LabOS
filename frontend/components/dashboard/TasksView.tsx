"use client";

import { useMemo, useState } from "react";
import { useAnimatedList } from "../../hooks/useAnimatedList";
import { attentionDetail, getPerson } from "../../lib/dashboard";
import { currentUserId, workspaceDate } from "../../lib/dashboardData";
import type { TranslationKey } from "../../lib/i18n";
import {
  attentionToTask,
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
import { taskDetail } from "../../lib/taskDetail";
import type {
  AttentionItem,
  ItemDetail,
  Person,
  Project,
} from "../../types/dashboard";
import type { Task, TaskStatus, TaskViewId } from "../../types/tasks";
import { Icon } from "./Icon";
import { useLocale } from "./LocaleProvider";
import { Avatar, ProjectLabel } from "./Primitives";

type SortMode = "deadline" | "newest" | "title";

const views: { id: TaskViewId; label: TranslationKey; hint: TranslationKey }[] =
  [
    { id: "active", label: "Active", hint: "Open and in-progress tasks." },
    {
      id: "overdue",
      label: "My overdue",
      hint: "Tasks you own whose deadline has passed.",
    },
    {
      id: "waiting",
      label: "Waiting for others",
      hint: "Tasks owned by someone else that you requested.",
    },
    {
      id: "waiting-me",
      label: "Others waiting for me",
      hint: "Tasks you own that someone else requested.",
    },
    {
      id: "week",
      label: "Due this week",
      hint: "Your tasks due in the next 7 days.",
    },
    {
      id: "blocked",
      label: "Blocked milestones",
      hint: "Milestones with an open blocking task.",
    },
    {
      id: "done",
      label: "Completed",
      hint: "Completed and cancelled tasks.",
    },
  ];

const statusKeys: Record<TaskStatus, TranslationKey> = {
  open: "Open",
  "in-progress": "In progress",
  completed: "Completed",
  cancelled: "Cancelled",
};

const firstName = (id: string) => getPerson(id)?.name.split(" ")[0] ?? "";

export function TasksView({
  items,
  completedIds,
  seedTasks,
  statusOverrides,
  projects,
  people,
  onToggle,
  onDetail,
  onAddTask,
}: {
  /** Overview sample/captured items. Calendar warnings are not tasks and are skipped. */
  items: AttentionItem[];
  completedIds: ReadonlySet<string>;
  /** Fully specified tasks (owner, requester, status…). Pass [] for a fresh workspace. */
  seedTasks: Task[];
  statusOverrides: Readonly<Record<string, TaskStatus>>;
  projects: Project[];
  /** Workspace members for the Person filter. Pass [] for a fresh workspace. */
  people: Person[];
  onToggle: (id: string) => void;
  onDetail: (detail: ItemDetail) => void;
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

  const itemById = useMemo(
    () => new Map(items.map((item) => [item.id, item])),
    [items],
  );
  const tasks = useMemo<Task[]>(
    () => [
      ...items
        .filter((item) => item.kind !== "calendar")
        .map((item) =>
          attentionToTask(item, completedIds.has(item.id), me, today),
        ),
      ...seedTasks.map((task) => ({
        ...task,
        status: statusOverrides[task.id] ?? task.status,
      })),
    ],
    [items, completedIds, seedTasks, statusOverrides, me, today],
  );
  const context: TaskContext = { me, today, tasks };

  const scoped = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return tasks.filter((task) => {
      if (project === "none" && task.projectId) return false;
      if (project && project !== "none" && task.projectId !== project)
        return false;
      if (person && task.ownerId !== person && task.requesterId !== person)
        return false;
      return (
        !needle ||
        `${task.title} ${task.description}`.toLowerCase().includes(needle)
      );
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tasks, query, project, person]);

  const counts = Object.fromEntries(
    views.map(({ id }) => [
      id,
      scoped.filter((task) => matchesView(id, task, context)).length,
    ]),
  ) as Record<TaskViewId, number>;

  const visible = useMemo(() => {
    const list = scoped.filter((task) => matchesView(view, task, context));
    if (sort === "title")
      return [...list].sort((a, b) => a.title.localeCompare(b.title, locale));
    if (sort === "deadline") return [...list].sort(byDeadline);
    return [...list].sort(byNewest);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scoped, view, sort, locale]);

  const listRef = useAnimatedList<HTMLUListElement>(
    visible.map((task) => `${task.id}:${task.status}`).join("|"),
  );

  const hasFilters = !!(query || project || person);
  const resetFilters = () => {
    setQuery("");
    setProject("");
    setPerson("");
  };
  const activeView = views.find(({ id }) => id === view) ?? views[0];

  function rowStatus(task: Task): { label: string; className: string } {
    if (!isActive(task))
      return {
        label: t(statusKeys[task.status]),
        className: "status-capture",
      };
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
      return t("{name} is waiting for you", {
        name: firstName(task.requesterId),
      });
    return null;
  }

  function openTask(task: Task) {
    const item = itemById.get(task.id);
    onDetail(item ? attentionDetail(item, locale) : taskDetail(task, locale));
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
          <button
            type="button"
            className="button button-primary"
            onClick={onAddTask}
          >
            <Icon name="plus" size={16} />
            {t("New task")}
          </button>
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
            <label>
              <span>{t("Project")}</span>
              <select
                value={project}
                onChange={(event) => setProject(event.target.value)}
              >
                <option value="">{t("All projects")}</option>
                <option value="none">{t("Lab workspace")}</option>
                {projects.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>{t("Person")}</span>
              <select
                value={person}
                disabled={people.length === 0}
                onChange={(event) => setPerson(event.target.value)}
              >
                <option value="">{t("Anyone")}</option>
                {people.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>
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
            {hasFilters && (
              <button
                type="button"
                className="text-button"
                onClick={resetFilters}
              >
                {t("Reset filters")}
              </button>
            )}
          </div>

          <ul className="attention-list" ref={listRef}>
            {visible.map((task) => {
              const done = !isActive(task);
              const status = rowStatus(task);
              const relation = relationText(task);
              const blockers = task.milestone
                ? openBlockers(task, tasks).length
                : 0;
              const quiet =
                needsFollowUp(task, me, today) &&
                quietWorkingDays(task, today);
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
                    <span className={`item-status ${status.className}`}>
                      {status.label}
                    </span>
                    <button
                      type="button"
                      className="item-title"
                      onClick={() => openTask(task)}
                    >
                      {task.title}
                      {task.milestone && (
                        <span className="event-tag tag-milestone">
                          {t("Milestone")}
                        </span>
                      )}
                    </button>
                    <div className="item-meta">
                      <span className="task-meta-group">
                        <ProjectLabel projectId={task.projectId} />
                        <span className="task-meta-text">
                          <Icon name="calendar" size={12} />
                          {task.dueDate
                            ? `${formatDate(task.dueDate)}${task.dueTime ? ` · ${task.dueTime}` : ""}`
                            : t("No deadline")}
                        </span>
                        {relation && (
                          <span className="task-meta-text task-relation">
                            <Icon name="people" size={12} />
                            {relation}
                          </span>
                        )}
                        {typeof quiet === "number" && (
                          <span className="task-meta-text">
                            <Icon name="clock" size={12} />
                            {t("No reply for {count} working days", {
                              count: quiet,
                            })}
                          </span>
                        )}
                        {blockers > 0 && (
                          <span className="task-meta-text">
                            <Icon name="warning" size={12} />
                            {t(
                              blockers === 1
                                ? "{count} open blocker"
                                : "{count} open blockers",
                              { count: blockers },
                            )}
                          </span>
                        )}
                      </span>
                      <Avatar personId={task.ownerId} small />
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
                    ? "Capture your first task and it will show up here."
                    : hasFilters
                      ? "Try fewer words or adjust the filters."
                      : "Nothing in this view.",
                )}
              </p>
              {tasks.length === 0 ? (
                <button
                  type="button"
                  className="text-button"
                  onClick={onAddTask}
                >
                  {t("Add a task")}
                  <Icon name="arrow" size={14} />
                </button>
              ) : hasFilters ? (
                <button
                  type="button"
                  className="text-button"
                  onClick={resetFilters}
                >
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
