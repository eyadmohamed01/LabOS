"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { flushSync } from "react-dom";
import {
  attentionDetail,
  getProject,
  projectDetail,
  timelineDetail,
} from "../../lib/dashboard";
import {
  attentionItems,
  currentUserId,
  projects,
  timelineItems,
  workspaceDate,
  people,
} from "../../lib/dashboardData";
import type {
  AttentionItem,
  ItemDetail,
  Section,
  TimelineItem,
} from "../../types/dashboard";
import { ActiveProjects } from "./ActiveProjects";
import { AttentionPanel } from "./AttentionPanel";
import { Dialog } from "./Dialog";
import { Icon } from "./Icon";
import { LocaleProvider, useLocale } from "./LocaleProvider";
import { ProjectLabel } from "./Primitives";
import { QuickCapture } from "./QuickCapture";
import { SearchDialog } from "./SearchDialog";
import { Sidebar } from "./Sidebar";
import { TimelinePanel } from "./TimelinePanel";
import { TasksView } from "./TasksView";
import { CalendarView } from "./CalendarView";
import { TaskDialog } from "./TaskDialog";
import { EventDialog } from "./EventDialog";
import { workspaceTasks } from "../../lib/taskData";
import { taskDetail } from "../../lib/taskDetail";
import {
  composeTasks,
  deriveAttention,
  isOverdue,
  relinkDeadlines,
  taskAlerts,
  type TaskAlert,
} from "../../lib/tasks";
import type { Task, TaskStatus } from "../../types/tasks";
import { WorkInsights, WorkMetrics } from "./WorkMetrics";
import { ThemeToggle } from "./ThemeToggle";
import { EmptyDashboard } from "./EmptyDashboard";
import type { DashboardPreview } from "../../lib/dashboardPreview";
import { createCaptureId } from "../../lib/captureId";

type Overlay = "search" | "notifications" | "navigation" | null;
type FormState =
  | { kind: "task"; task?: Task }
  | { kind: "event"; event?: TimelineItem; date: string }
  | null;
type Notice = {
  message: string;
  /** Overview items: Undo toggles the completion again. */
  undoId?: string;
  /** Workspace tasks: Undo restores this exact previous status. */
  restore?: { id: string; status: TaskStatus };
};

export function Dashboard({
  initialPreview = "populated",
}: {
  initialPreview?: DashboardPreview;
}) {
  return (
    <LocaleProvider>
      <DashboardView initialPreview={initialPreview} />
    </LocaleProvider>
  );
}

function DashboardView({
  initialPreview,
}: {
  initialPreview: DashboardPreview;
}) {
  const { locale, setLocale, t, text, formatDate } = useLocale();
  const [preview, setPreview] = useState<DashboardPreview>(initialPreview);
  const [workspaceItems, setWorkspaceItems] = useState<
    Record<DashboardPreview, AttentionItem[]>
  >({ populated: attentionItems, empty: [] });
  const [workspaceCompleted, setWorkspaceCompleted] = useState<
    Record<DashboardPreview, ReadonlySet<string>>
  >({ populated: new Set(), empty: new Set() });
  const [workspaceEvents, setWorkspaceEvents] = useState<
    Record<DashboardPreview, TimelineItem[]>
  >({ populated: timelineItems, empty: [] });
  const firstUse = preview === "empty";
  const activeProjects = firstUse ? [] : projects;
  const events = workspaceEvents[preview];
  const schedule = events;
  const items = workspaceItems[preview];
  const completedIds = workspaceCompleted[preview];
  function setItems(update: (previous: AttentionItem[]) => AttentionItem[]) {
    setWorkspaceItems((previous) => ({
      ...previous,
      [preview]: update(previous[preview]),
    }));
  }
  function setCompletedIds(
    update: (previous: ReadonlySet<string>) => ReadonlySet<string>,
  ) {
    setWorkspaceCompleted((previous) => ({
      ...previous,
      [preview]: update(previous[preview]),
    }));
  }
  const [section, setSection] = useState<Section>("overview");
  // Edits (and finer statuses) layered over Overview items and the sample workspace tasks.
  const [taskEdits, setTaskEdits] = useState<Record<string, Partial<Task>>>({});
  const [form, setForm] = useState<FormState>(null);
  const [overlay, setOverlay] = useState<Overlay>(null);
  const [detail, setDetail] = useState<ItemDetail | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const menuRef = useRef<HTMLButtonElement>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const resolvingIds = useRef(new Set<string>());

  function changePreview(next: DashboardPreview) {
    setPreview(next);
    setOverlay(null);
    setDetail(null);
    setNotice(null);
    const url = new URL(window.location.href);
    if (next === "empty") url.searchParams.set("dashboard", "empty");
    else url.searchParams.delete("dashboard");
    window.history.replaceState(null, "", url);
  }

  const pageTitle =
    section === "tasks"
      ? t("Tasks")
      : section === "calendar"
        ? t("Calendar")
        : t("Overview");

  useEffect(() => {
    document.title = `${pageTitle} · LabOS`;
  }, [pageTitle]);

  function navigate(next: Section) {
    setOverlay(null);
    if (next !== "overview" && next !== "tasks" && next !== "calendar") return;
    const same = next === section;
    setSection(next);
    requestAnimationFrame(() => headingRef.current?.focus());
    window.scrollTo({ top: 0, behavior: same ? "smooth" : "auto" });
  }

  const closeNavigation = useCallback(() => {
    setOverlay(null);
    requestAnimationFrame(() => menuRef.current?.focus());
  }, []);

  useEffect(() => {
    if (overlay !== "navigation") return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    sidebarRef.current
      ?.querySelector<HTMLButtonElement>(".mobile-close")
      ?.focus();
    const desktop = window.matchMedia("(min-width: 761px)");
    const onResize = () => {
      if (desktop.matches) setOverlay(null);
    };
    desktop.addEventListener("change", onResize);
    return () => {
      document.body.style.overflow = previousOverflow;
      desktop.removeEventListener("change", onResize);
    };
  }, [overlay]);

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && overlay === "navigation") {
        closeNavigation();
        return;
      }
      if (event.key === "Tab" && overlay === "navigation") {
        const controls = Array.from(
          sidebarRef.current?.querySelectorAll<HTMLElement>(
            "a[href], button:not(:disabled)",
          ) ?? [],
        );
        const first = controls[0];
        const last = controls[controls.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
        return;
      }
      const target = event.target;
      if (
        target instanceof HTMLElement &&
        (target.matches("input, textarea, select") || target.isContentEditable)
      )
        return;
      if (
        event.ctrlKey ||
        event.metaKey ||
        event.altKey ||
        overlay ||
        detail ||
        form
      )
        return;
      if (event.key === "/") {
        event.preventDefault();
        setOverlay("search");
      }
      if (event.key.toLowerCase() === "n") {
        event.preventDefault();
        setForm({ kind: "task" });
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [overlay, detail, form, closeNavigation]);

  useEffect(() => {
    if (!notice) return;
    const timeout = window.setTimeout(() => setNotice(null), 7000);
    return () => window.clearTimeout(timeout);
  }, [notice]);

  function openDetail(next: ItemDetail) {
    setOverlay(null);
    setDetail(next);
  }
  function openProject(id: string) {
    const project = getProject(id);
    if (project) openDetail(projectDetail(project, locale));
  }

  // One list for the Tasks page, search and calendar: Overview items + workspace tasks + edits.
  const tasks = useMemo(
    () =>
      composeTasks({
        items,
        completed: completedIds,
        seeds: firstUse ? [] : workspaceTasks,
        edits: taskEdits,
        me: currentUserId,
        today: workspaceDate,
      }),
    [items, completedIds, firstUse, taskEdits],
  );
  const workspacePeople = firstUse ? [] : people;

  // Attention (Overview, metrics, search) and the bell are DERIVED from the current tasks,
  // so a moved deadline or a new assignee is reflected immediately and labels never go stale.
  const attention = useMemo(
    () =>
      deriveAttention(items, tasks, currentUserId, workspaceDate, {
        overdue: (days) =>
          days === 1 ? t("1 day overdue") : t("{count} days overdue", { count: days }),
        due: (date) => `${t("Due")} ${formatDate(date)}`,
      }),
    [items, tasks, t, formatDate],
  );
  const unresolvedCount = attention.filter(
    (item) => !completedIds.has(item.id),
  ).length;
  // Bell: calendar warnings plus important / upcoming task alerts from ALL tasks, not just Overview items.
  const alerts = useMemo(
    () => taskAlerts(tasks, firstUse ? "" : currentUserId, workspaceDate),
    [tasks, firstUse],
  );
  const calendarWarnings = attention.filter(
    (item) => item.kind === "calendar" && !completedIds.has(item.id),
  );
  const alertCount = alerts.length + calendarWarnings.length;

  function alertLabel({ reason, days, task }: TaskAlert) {
    if (reason === "overdue")
      return days === 1 ? t("1 day overdue") : t("{count} days overdue", { count: days });
    if (reason === "follow-up") return t("Follow up");
    if (reason === "important") return t("Important");
    return task.dueDate ? `${t("Due")} ${formatDate(task.dueDate)}` : t("Due");
  }

  function isDone(id: string) {
    if (items.some((item) => item.id === id)) return completedIds.has(id);
    const status = tasks.find((task) => task.id === id)?.status;
    return status === "completed" || status === "cancelled";
  }

  function setStatus(id: string, status: TaskStatus) {
    setTaskEdits((previous) => ({
      ...previous,
      [id]: { ...previous[id], status },
    }));
  }

  // Tasks that are not Overview items: toggle between done and open; Undo restores the exact previous status.
  function toggleSeedTask(id: string) {
    const task = tasks.find((item) => item.id === id);
    if (!task) return;
    const wasDone = task.status === "completed" || task.status === "cancelled";
    setStatus(id, wasDone ? "open" : "completed");
    setNotice({
      message: wasDone ? "Item reopened." : "Item resolved.",
      restore: { id, status: task.status },
    });
  }

  function saveTask(task: Task) {
    const isNew = !task.id;
    const saved: Task = { ...task, id: isNew ? createCaptureId() : task.id };
    const done = saved.status === "completed" || saved.status === "cancelled";
    const fields = {
      title: saved.title,
      description: saved.description || "Captured for review.",
      assigneeId: saved.ownerId,
      projectId: saved.projectId,
      priority: saved.priority ?? ("normal" as const),
      dueDate: saved.dueDate,
    };
    if (isNew) {
      // New tasks also appear on the Overview (Attention, metrics, search).
      setItems((previous) => [
        {
          id: saved.id,
          kind: "capture",
          label: "Just captured",
          ...fields,
        },
        ...previous,
      ]);
    } else if (items.some((item) => item.id === saved.id)) {
      setItems((previous) =>
        previous.map((item) =>
          item.id === saved.id ? { ...item, ...fields } : item,
        ),
      );
    }
    if (isNew || items.some((item) => item.id === saved.id))
      setCompletedIds((previous) => {
        const next = new Set(previous);
        if (done) next.add(saved.id);
        else next.delete(saved.id);
        return next;
      });
    setTaskEdits((previous) => ({ ...previous, [saved.id]: saved }));
    setForm(null);
    setNotice({ message: isNew ? "Task added." : "Task updated." });
  }

  function saveEvent(event: TimelineItem) {
    const isNew = !event.id;
    const saved = { ...event, id: isNew ? `event-${createCaptureId()}` : event.id };
    setWorkspaceEvents((previous) => ({
      ...previous,
      [preview]: [
        ...previous[preview].filter((item) => item.id !== saved.id),
        saved,
      ].sort((a, b) =>
        `${a.date}${a.time ?? ""}`.localeCompare(`${b.date}${b.time ?? ""}`),
      ),
    }));
    // §20: when an event moves, tasks linked with an offset move with it.
    let message = isNew ? "Event added." : "Event updated.";
    const changes = isNew ? [] : relinkDeadlines(tasks, saved);
    if (changes.length > 0) {
      setTaskEdits((previous) => {
        const next = { ...previous };
        for (const change of changes)
          next[change.id] = {
            ...next[change.id],
            dueDate: change.dueDate,
            dueTime: change.dueTime,
          };
        return next;
      });
      setItems((previous) =>
        previous.map((item) => {
          const change = changes.find((entry) => entry.id === item.id);
          return change ? { ...item, dueDate: change.dueDate } : item;
        }),
      );
      const nowOverdue = changes.some((change) => {
        const task = tasks.find((entry) => entry.id === change.id);
        return (
          !!task &&
          isOverdue({ ...task, dueDate: change.dueDate, dueTime: change.dueTime }, workspaceDate)
        );
      });
      message = nowOverdue
        ? "Calendar changed – a linked task is now overdue."
        : "Event updated. Linked task deadlines were recalculated.";
    }
    setForm(null);
    setNotice({ message });
  }

  function deleteEvent(id: string) {
    setWorkspaceEvents((previous) => ({
      ...previous,
      [preview]: previous[preview].filter((item) => item.id !== id),
    }));
    // Linked tasks are kept with their current deadline; the event link and offset are removed.
    const linked = tasks.filter((task) => task.eventId === id);
    if (linked.length > 0)
      setTaskEdits((previous) => {
        const next = { ...previous };
        for (const task of linked)
          next[task.id] = { ...next[task.id], eventId: undefined, offset: undefined };
        return next;
      });
    setForm(null);
    setNotice({
      message:
        linked.length > 0
          ? "Event deleted. Linked tasks keep their deadlines."
          : "Event deleted.",
    });
  }

  function openTask(task: Task) {
    openDetail(taskDetail(task, locale, tasks, events));
  }

  async function toggleItem(id: string) {
    if (!items.some((item) => item.id === id)) {
      toggleSeedTask(id);
      return;
    }
    if (resolvingIds.current.has(id)) return;
    resolvingIds.current.add(id);
    const active = document.activeElement;
    const list = active?.closest(".attention-panel");
    const controls = list
      ? Array.from(
          list.querySelectorAll<HTMLInputElement>('input[type="checkbox"]'),
        )
      : [];
    const focusIndex = controls.findIndex((control) => control === active);
    const wasComplete = completedIds.has(id);
    const row = document.querySelector<HTMLElement>(
      `[data-motion-id="${CSS.escape(id)}"]`,
    );
    const exit =
      row && !wasComplete
        ? row.animate(
            [
              { opacity: 1, transform: "translateX(0) scale(1)" },
              { opacity: 0, transform: "translateX(8px) scale(.985)" },
            ],
            {
              duration: 145,
              easing: "cubic-bezier(.4, 0, 1, 1)",
              fill: "forwards",
            },
          )
        : null;
    if (exit) await exit.finished.catch(() => undefined);
    flushSync(() =>
      setCompletedIds((previous) => {
        const next = new Set(previous);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
      }),
    );
    setNotice({
      message: wasComplete ? "Item reopened." : "Item resolved.",
      undoId: id,
    });
    requestAnimationFrame(() => {
      exit?.cancel();
      resolvingIds.current.delete(id);
      if (document.activeElement !== document.body) return;
      const remaining = list?.querySelectorAll<HTMLInputElement>(
        'input[type="checkbox"]',
      );
      const next =
        remaining?.[Math.min(focusIndex, remaining.length - 1)] ??
        list?.querySelector<HTMLButtonElement>(".filter-row button");
      (next ?? headingRef.current)?.focus();
    });
  }

  return (
    <div className="app-shell">
      <a
        className="skip-link"
        href="#main-content"
        onClick={(event) => {
          event.preventDefault();
          headingRef.current?.focus();
        }}
      >
        {t("Skip to content")}
      </a>
      {overlay === "navigation" && (
        <button
          className="navigation-backdrop"
          aria-label={t("Close navigation")}
          onClick={closeNavigation}
          tabIndex={-1}
        />
      )}
      <div ref={sidebarRef}>
        <Sidebar
          open={overlay === "navigation"}
          attentionCount={unresolvedCount}
          projects={activeProjects}
          memberCount={firstUse ? 0 : people.length}
          firstUse={firstUse}
          onProject={openProject}
          onClose={closeNavigation}
          section={section}
          onNavigate={navigate}
        />
      </div>
      <div className="main-shell" inert={overlay === "navigation"}>
        <header className="topbar">
          <div className="breadcrumb">
            <button
              ref={menuRef}
              className="icon-button mobile-menu"
              onClick={() => setOverlay("navigation")}
              aria-label={t("Open navigation")}
              aria-expanded={overlay === "navigation"}
            >
              <Icon name="menu" />
            </button>
            <span className="breadcrumb-workspace">{t("Workspace")}</span>
            <Icon name="chevron" size={13} />
            <span>{pageTitle}</span>
          </div>
          <div className="topbar-controls">
            <button
              className="search-trigger"
              onClick={() => setOverlay("search")}
              aria-label={t("Search workspace")}
            >
              <Icon name="search" size={17} />
              <span>{t("Search workspace…")}</span>
              <kbd>/</kbd>
            </button>
            <label className="locale-control">
              <span className="sr-only">{t("Interface language")}</span>
              <select
                value={locale}
                onChange={(event) =>
                  setLocale(event.target.value === "de" ? "de" : "en")
                }
              >
                <option value="en">EN</option>
                <option value="de">DE</option>
              </select>
            </label>
            <ThemeToggle />
            <button
              className="icon-button notification-button"
              onClick={() => setOverlay("notifications")}
              aria-label={t("View attention items")}
            >
              <Icon name="bell" size={20} />
              {alertCount > 0 && <span className="notification-dot" />}
            </button>
          </div>
        </header>
        <main id="main-content" className="dashboard-main">
          <div className="page-heading">
            <h1 ref={headingRef} tabIndex={-1}>
              {pageTitle}
            </h1>
            <time dateTime={workspaceDate}>
              {formatDate(workspaceDate, {
                weekday: "long",
                month: "long",
                year: "numeric",
              })}
            </time>
          </div>
          {process.env.NODE_ENV === "development" && (
            <div className="dashboard-preview-control">
              <span>{t("Development preview")}</span>
              <label>
                <span className="sr-only">{t("Dashboard preview")}</span>
                <select
                  value={preview}
                  onChange={(event) =>
                    changePreview(
                      event.target.value === "empty" ? "empty" : "populated",
                    )
                  }
                >
                  <option value="populated">{t("Populated Dashboard")}</option>
                  <option value="empty">{t("Empty Dashboard")}</option>
                </select>
              </label>
            </div>
          )}
          {firstUse && section === "overview" && (
            <div className="first-use-intro">
              <h2>{t("Set up your workspace")}</h2>
              <p>
                {t(
                  "Start with a task. Projects and calendar connections can be added when those features become available.",
                )}
              </p>
            </div>
          )}
          <QuickCapture onAdd={() => setForm({ kind: "task" })} />
          {section === "tasks" ? (
            <TasksView
              tasks={tasks}
              projects={activeProjects}
              people={workspacePeople}
              onToggle={toggleItem}
              onOpen={openTask}
              onEdit={(task) => setForm({ kind: "task", task })}
              onAddTask={() => setForm({ kind: "task" })}
            />
          ) : section === "calendar" ? (
            <CalendarView
              events={events}
              tasks={tasks}
              me={currentUserId}
              today={workspaceDate}
              onOpenEvent={(event) => openDetail(timelineDetail(event, locale))}
              onOpenTask={openTask}
              onAddEvent={(date) => setForm({ kind: "event", date })}
            />
          ) : firstUse ? (
            <EmptyDashboard
              items={attention}
              completedIds={completedIds}
              referenceDate={workspaceDate}
              events={events}
              onAddTask={() => setForm({ kind: "task" })}
              onToggle={toggleItem}
              onDetail={openDetail}
            />
          ) : (
            <>
              <WorkMetrics
                items={attention}
                completedIds={completedIds}
                schedule={events}
                referenceDate={workspaceDate}
              />
              <div className="dashboard-zones">
                <div className="work-zone">
                  <AttentionPanel
                    items={attention}
                    completedIds={completedIds}
                    onToggle={toggleItem}
                    onDetail={openDetail}
                  />
                  <WorkInsights items={attention} completedIds={completedIds} />
                </div>
                <TimelinePanel items={events} onDetail={openDetail} />
              </div>
              <ActiveProjects
                projects={projects}
                items={attention}
                completedIds={completedIds}
                onProject={openProject}
              />
            </>
          )}
          <footer className="workspace-footer">
            <span className="footer-brand">LabOS</span>
            <span>
              {t(
                firstUse
                  ? "Preview workspace · Changes reset on refresh"
                  : "Sample data · Changes reset on refresh",
              )}
            </span>
          </footer>
        </main>
      </div>
      {overlay === "search" && (
        <SearchDialog
          items={attention}
          completedIds={completedIds}
          projects={activeProjects}
          timelineItems={schedule}
          extraTasks={tasks}
          onClose={() => setOverlay(null)}
          onSelect={openDetail}
        />
      )}
      {overlay === "notifications" && (
        <Dialog title={t("Attention")} onClose={() => setOverlay(null)}>
          <div className="notification-list">
            {calendarWarnings.map((item) => (
              <button
                className="search-result"
                key={item.id}
                onClick={() => openDetail(attentionDetail(item, locale))}
              >
                <span>
                  <small className="status-calendar">{text(item.label)}</small>
                  <strong>{item.title}</strong>
                </span>
                <Icon name="chevron" size={16} />
              </button>
            ))}
            {alerts.map((alert) => (
              <button
                className="search-result"
                key={alert.task.id}
                onClick={() => {
                  setOverlay(null);
                  openTask(alert.task);
                }}
              >
                <span>
                  <small
                    className={
                      alert.reason === "overdue"
                        ? "status-overdue"
                        : alert.reason === "follow-up"
                          ? "status-follow-up"
                          : "status-capture"
                    }
                  >
                    {alertLabel(alert)}
                  </small>
                  <strong>{alert.task.title}</strong>
                </span>
                <Icon name="chevron" size={16} />
              </button>
            ))}
            {alertCount === 0 && (
              <p className="detail-description">
                {t("No open attention items.")}
              </p>
            )}
          </div>
        </Dialog>
      )}
      {detail && (
        <Dialog
          title={detail.title}
          eyebrow={text(detail.eyebrow)}
          onClose={() => setDetail(null)}
        >
          {detail.projectId && (
            <div className="detail-project">
              <ProjectLabel projectId={detail.projectId} />
            </div>
          )}
          <p className="detail-description">{text(detail.description)}</p>
          <dl className="detail-facts">
            {detail.facts.map((fact) => (
              <div key={fact.label}>
                <dt>{text(fact.label)}</dt>
                <dd>{text(fact.value)}</dd>
              </div>
            ))}
          </dl>
          {detail.eventId && (
            <div className="dialog-actions">
              <span />
              <button
                className="button"
                onClick={() => {
                  const event = events.find((item) => item.id === detail.eventId);
                  setDetail(null);
                  if (event)
                    setForm({ kind: "event", event, date: event.date });
                }}
              >
                {t("Edit")}
              </button>
            </div>
          )}
          {detail.attentionId && (
            <div className="dialog-actions">
              <span>
                {t(isDone(detail.attentionId) ? "Resolved" : "Open")}
              </span>
              {tasks.some((task) => task.id === detail.attentionId) && (
                <button
                  className="button"
                  onClick={() => {
                    const task = tasks.find(
                      (item) => item.id === detail.attentionId,
                    );
                    setDetail(null);
                    if (task) setForm({ kind: "task", task });
                  }}
                >
                  {t("Edit")}
                </button>
              )}
              <button
                className="button button-primary"
                onClick={() => {
                  if (detail.attentionId) void toggleItem(detail.attentionId);
                  setDetail(null);
                }}
              >
                <Icon name="check" size={16} />
                {t(
                  isDone(detail.attentionId)
                    ? "Reopen item"
                    : "Mark resolved",
                )}
              </button>
            </div>
          )}
        </Dialog>
      )}
      {form?.kind === "task" && (
        <TaskDialog
          task={form.task}
          people={workspacePeople}
          projects={activeProjects}
          events={events}
          milestones={tasks.filter(
            (task) => task.milestone && task.id !== form.task?.id,
          )}
          me={firstUse ? "" : currentUserId}
          today={workspaceDate}
          onSave={saveTask}
          onClose={() => setForm(null)}
        />
      )}
      {form?.kind === "event" && (
        <EventDialog
          event={form.event}
          defaultDate={form.date}
          people={workspacePeople}
          projects={activeProjects}
          onSave={saveEvent}
          onDelete={deleteEvent}
          onClose={() => setForm(null)}
        />
      )}
      <div className="toast-region" aria-live="polite" aria-atomic="true">
        {notice && (
          <div className="toast">
            <span className="toast-check">
              <Icon name="check" size={17} />
            </span>
            <span>{text(notice.message)}</span>
            {(notice.undoId || notice.restore) && (
              <button
                onClick={() => {
                  const { restore } = notice;
                  if (restore) setStatus(restore.id, restore.status);
                  else if (notice.undoId) void toggleItem(notice.undoId);
                  setNotice(null);
                }}
              >
                {t("Undo")}
              </button>
            )}
            <button
              className="icon-button"
              aria-label={t("Dismiss notification")}
              onClick={() => setNotice(null)}
            >
              <Icon name="close" size={15} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
