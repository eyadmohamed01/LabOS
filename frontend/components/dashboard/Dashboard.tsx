"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import {
  attentionDetail,
  getProject,
  projectDetail,
} from "../../lib/dashboard";
import {
  attentionItems,
  currentUserId,
  projects,
  timelineItems,
  workspaceDate,
  people,
} from "../../lib/dashboardData";
import type { AttentionItem, ItemDetail, Section } from "../../types/dashboard";
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
import { workspaceTasks } from "../../lib/taskData";
import type { TaskStatus } from "../../types/tasks";
import { WorkInsights, WorkMetrics } from "./WorkMetrics";
import { ThemeToggle } from "./ThemeToggle";
import { EmptyDashboard } from "./EmptyDashboard";
import type { DashboardPreview } from "../../lib/dashboardPreview";
import { createCaptureId } from "../../lib/captureId";

type Overlay = "search" | "notifications" | "navigation" | null;
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
  const firstUse = preview === "empty";
  const activeProjects = firstUse ? [] : projects;
  const schedule = firstUse ? [] : timelineItems;
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
  // Status changes for the fully specified sample tasks (see lib/taskData.ts).
  const [taskStatuses, setTaskStatuses] = useState<Record<string, TaskStatus>>(
    {},
  );
  const [overlay, setOverlay] = useState<Overlay>(null);
  const [detail, setDetail] = useState<ItemDetail | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);
  const captureRef = useRef<HTMLInputElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const menuRef = useRef<HTMLButtonElement>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const resolvingIds = useRef(new Set<string>());
  const unresolvedCount = items.filter(
    (item) => !completedIds.has(item.id),
  ).length;

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

  const pageTitle = section === "tasks" ? text("Tasks") : t("Overview");

  useEffect(() => {
    document.title = `${pageTitle} · LabOS`;
  }, [pageTitle]);

  function navigate(next: Section) {
    setOverlay(null);
    if (next !== "overview" && next !== "tasks") return;
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
      if (event.ctrlKey || event.metaKey || event.altKey || overlay || detail)
        return;
      if (event.key === "/") {
        event.preventDefault();
        setOverlay("search");
      }
      if (event.key.toLowerCase() === "n") {
        event.preventDefault();
        captureRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [overlay, detail, closeNavigation]);

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

  // Workspace tasks with their current statuses, shared by the search index.
  const currentWorkspaceTasks = firstUse
    ? []
    : workspaceTasks.map((task) => ({
        ...task,
        status: taskStatuses[task.id] ?? task.status,
      }));

  function isDone(id: string) {
    if (items.some((item) => item.id === id)) return completedIds.has(id);
    const base = workspaceTasks.find((task) => task.id === id);
    const status = taskStatuses[id] ?? base?.status;
    return status === "completed" || status === "cancelled";
  }

  function toggleSeedTask(id: string) {
    const base = workspaceTasks.find((task) => task.id === id);
    if (!base) return;
    const previous = taskStatuses[id] ?? base.status;
    const wasDone = previous === "completed" || previous === "cancelled";
    setTaskStatuses((statuses) => ({
      ...statuses,
      [id]: wasDone ? "open" : "completed",
    }));
    setNotice({
      message: wasDone ? "Item reopened." : "Item resolved.",
      restore: { id, status: previous },
    });
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

  function capture(title: string, projectId?: string) {
    const item: AttentionItem = {
      id: createCaptureId(),
      title,
      kind: "capture",
      label: "Just captured",
      description: "Captured for review.",
      projectId,
      assigneeId: firstUse ? "" : currentUserId,
      priority: "normal",
    };
    setItems((previous) => [item, ...previous]);
    setNotice({ message: "Captured for this session." });
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
              {unresolvedCount > 0 && <span className="notification-dot" />}
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
          <QuickCapture
            key={preview}
            projects={activeProjects}
            inputRef={captureRef}
            onCapture={capture}
          />
          {section === "tasks" ? (
            <TasksView
              items={items}
              completedIds={completedIds}
              seedTasks={firstUse ? [] : workspaceTasks}
              statusOverrides={taskStatuses}
              projects={activeProjects}
              people={firstUse ? [] : people}
              onToggle={toggleItem}
              onDetail={openDetail}
              onAddTask={() => captureRef.current?.focus()}
            />
          ) : firstUse ? (
            <EmptyDashboard
              items={items}
              completedIds={completedIds}
              referenceDate={workspaceDate}
              onAddTask={() => captureRef.current?.focus()}
              onToggle={toggleItem}
              onDetail={openDetail}
            />
          ) : (
            <>
              <WorkMetrics
                items={items}
                completedIds={completedIds}
                schedule={timelineItems}
                referenceDate={workspaceDate}
              />
              <div className="dashboard-zones">
                <div className="work-zone">
                  <AttentionPanel
                    items={items}
                    completedIds={completedIds}
                    onToggle={toggleItem}
                    onDetail={openDetail}
                  />
                  <WorkInsights items={items} completedIds={completedIds} />
                </div>
                <TimelinePanel items={timelineItems} onDetail={openDetail} />
              </div>
              <ActiveProjects
                projects={projects}
                items={items}
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
          items={items}
          completedIds={completedIds}
          projects={activeProjects}
          timelineItems={schedule}
          extraTasks={currentWorkspaceTasks}
          onClose={() => setOverlay(null)}
          onSelect={openDetail}
        />
      )}
      {overlay === "notifications" && (
        <Dialog title={t("Attention")} onClose={() => setOverlay(null)}>
          <div className="notification-list">
            {items
              .filter((item) => !completedIds.has(item.id))
              .map((item) => (
                <button
                  className="search-result"
                  key={item.id}
                  onClick={() => openDetail(attentionDetail(item, locale))}
                >
                  <span>
                    <small className={`status-${item.kind}`}>
                      {text(item.label)}
                    </small>
                    <strong>{item.title}</strong>
                  </span>
                  <Icon name="chevron" size={16} />
                </button>
              ))}
            {unresolvedCount === 0 && (
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
          {detail.attentionId && (
            <div className="dialog-actions">
              <span>
                {t(isDone(detail.attentionId) ? "Resolved" : "Open")}
              </span>
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
                  if (restore)
                    setTaskStatuses((statuses) => ({
                      ...statuses,
                      [restore.id]: restore.status,
                    }));
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
