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
} from "../../lib/dashboardData";
import type { AttentionItem, ItemDetail } from "../../types/dashboard";
import { ActiveProjects } from "./ActiveProjects";
import { AttentionPanel } from "./AttentionPanel";
import { Dialog } from "./Dialog";
import { Icon } from "./Icon";
import { LocaleProvider, useLocale } from "./LocaleProvider";
import { Avatar, ProjectLabel } from "./Primitives";
import { QuickCapture } from "./QuickCapture";
import { SearchDialog } from "./SearchDialog";
import { Sidebar } from "./Sidebar";
import { TimelinePanel } from "./TimelinePanel";
import { WorkInsights, WorkMetrics } from "./WorkMetrics";
import { ThemeToggle } from "./ThemeToggle";

type Overlay = "search" | "notifications" | "navigation" | null;
type Notice = { message: string; undoId?: string };

export function Dashboard() {
  return (
    <LocaleProvider>
      <DashboardView />
    </LocaleProvider>
  );
}

function DashboardView() {
  const { locale, setLocale, t, text, formatDate } = useLocale();
  const [items, setItems] = useState<AttentionItem[]>(attentionItems);
  const [completedIds, setCompletedIds] = useState<ReadonlySet<string>>(
    new Set(),
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

  useEffect(() => {
    document.title = `${t("Overview")} · LabOS`;
  }, [t]);

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

  async function toggleItem(id: string) {
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
      id: `capture-${crypto.randomUUID()}`,
      title,
      kind: "capture",
      label: "Just captured",
      description: "Captured for review.",
      projectId,
      assigneeId: currentUserId,
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
          onProject={openProject}
          onClose={closeNavigation}
          onOverview={() => {
            setOverlay(null);
            headingRef.current?.focus();
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
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
            <span>{t("Overview")}</span>
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
            <Avatar personId={currentUserId} />
          </div>
        </header>
        <main id="main-content" className="dashboard-main">
          <div className="page-heading">
            <h1 ref={headingRef} tabIndex={-1}>
              {t("Overview")}
            </h1>
            <time dateTime={workspaceDate}>
              {formatDate(workspaceDate, {
                weekday: "long",
                month: "long",
                year: "numeric",
              })}
            </time>
          </div>
          <QuickCapture inputRef={captureRef} onCapture={capture} />
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
          <footer className="workspace-footer">
            <span className="footer-brand">LabOS</span>
            <span>{t("Sample data · Changes reset on refresh")}</span>
          </footer>
        </main>
      </div>
      {overlay === "search" && (
        <SearchDialog
          items={items}
          completedIds={completedIds}
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
                {t(completedIds.has(detail.attentionId) ? "Resolved" : "Open")}
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
                  completedIds.has(detail.attentionId)
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
            {notice.undoId && (
              <button
                onClick={() => {
                  if (notice.undoId) void toggleItem(notice.undoId);
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
