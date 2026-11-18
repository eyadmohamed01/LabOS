"use client";
import { useLocale } from "./LocaleProvider";

import { useState } from "react";
import { useAnimatedList } from "../../hooks/useAnimatedList";
import type {
  AttentionItem,
  AttentionKind,
  ItemDetail,
} from "../../types/dashboard";
import { attentionDetail } from "../../lib/dashboard";
import { Icon } from "./Icon";
import { Avatar, ProjectLabel } from "./Primitives";

const filters: { id: "all" | AttentionKind; label: string }[] = [
  { id: "all", label: "All" },
  { id: "overdue", label: "Overdue" },
  { id: "follow-up", label: "Follow-ups" },
  { id: "calendar", label: "Calendar" },
];

export function AttentionPanel({
  items,
  completedIds,
  onToggle,
  onDetail,
}: {
  items: AttentionItem[];
  completedIds: ReadonlySet<string>;
  onToggle: (id: string) => void;
  onDetail: (detail: ItemDetail) => void;
}) {
  const { t, text, locale } = useLocale();

  const [filter, setFilter] = useState<"all" | AttentionKind>("all");
  const [showResolved, setShowResolved] = useState(false);
  const unresolved = items.filter((item) => !completedIds.has(item.id));
  const resolvedCount = items.length - unresolved.length;
  const visibleItems = items.filter(
    (item) =>
      (showResolved || !completedIds.has(item.id)) &&
      (filter === "all" || item.kind === filter),
  );
  const listRef = useAnimatedList<HTMLUListElement>(
    visibleItems
      .map((item) => `${item.id}:${completedIds.has(item.id)}`)
      .join("|"),
  );

  return (
    <section aria-labelledby="attention-heading" className="attention-zone">
      <div className="section-heading">
        <div>
          <h2 id="attention-heading">
            <span className="section-marker marker-amber" />
            {t("Attention")}
            <span key={unresolved.length} className="count count-animated">
              {unresolved.length}
            </span>
          </h2>
        </div>
        <Icon name="tasks" size={19} />
      </div>
      <div className="panel attention-panel">
        <div
          className="filter-row"
          role="group"
          aria-label={t("Filter attention items")}
        >
          {filters.map(({ id, label }) => {
            const count = unresolved.filter(
              (item) => id === "all" || item.kind === id,
            ).length;
            return (
              <button
                key={id}
                aria-pressed={filter === id}
                className={filter === id ? "filter-active" : ""}
                onClick={() => setFilter(id)}
              >
                {text(label)}
                <span>{count}</span>
              </button>
            );
          })}
        </div>
        <ul className="attention-list" ref={listRef}>
          {visibleItems.map((item) => {
            const completed = completedIds.has(item.id);
            return (
              <li
                key={item.id}
                data-motion-id={item.id}
                className={`attention-item${completed ? " item-complete" : ""}`}
              >
                <label className="completion-control">
                  <input
                    type="checkbox"
                    checked={completed}
                    onChange={() => onToggle(item.id)}
                    aria-label={`${t(completed ? "Reopen" : "Resolve")}: ${item.title}`}
                  />
                  <span className="checkbox-visual">
                    <Icon name="check" size={13} />
                  </span>
                </label>
                <div className="attention-content">
                  <span className={`item-status status-${item.kind}`}>
                    {item.kind === "calendar" && (
                      <Icon name="warning" size={12} />
                    )}
                    {text(completed ? "Resolved" : item.label)}
                  </span>
                  <button
                    className="item-title"
                    onClick={() => onDetail(attentionDetail(item, locale))}
                  >
                    {item.title}
                  </button>
                  <div className="item-meta">
                    <ProjectLabel projectId={item.projectId} />
                    <Avatar personId={item.assigneeId} small />
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
        {visibleItems.length === 0 && (
          <div className="empty-state">
            <span className="empty-icon">
              <Icon name="check" size={25} />
            </span>
            <h3>{t("No open items")}</h3>
            <p>
              {t(
                unresolved.length === 0
                  ? "All items are resolved."
                  : "No open items in this category.",
              )}
            </p>
            {filter !== "all" && (
              <button className="text-button" onClick={() => setFilter("all")}>
                {t("View all attention items")}
                <Icon name="arrow" size={14} />
              </button>
            )}
          </div>
        )}
        <div className="panel-footer">
          <span>
            <span className="tiny-dot" />
            {unresolved.filter((item) => item.kind === "overdue").length}{" "}
            {t("overdue ·")}{" "}
            {unresolved.filter((item) => item.kind === "follow-up").length}{" "}
            {t("follow-ups")}
          </span>
          {resolvedCount > 0 ? (
            <button onClick={() => setShowResolved(!showResolved)}>
              {showResolved
                ? t("Hide resolved")
                : t("Show resolved ({count})", { count: resolvedCount })}
            </button>
          ) : null}
        </div>
      </div>
    </section>
  );
}
