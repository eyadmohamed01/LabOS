"use client";
import { useLocale } from "./LocaleProvider";

import { useState } from "react";
import { addDays, timelineDetail, timelinePeriod } from "../../lib/dashboard";
import { currentUserId, workspaceDate } from "../../lib/dashboardData";
import { conflictingEvents } from "../../lib/dashboardInsights";
import type { ItemDetail, TimelineItem } from "../../types/dashboard";
import { Icon } from "./Icon";

const periods = ["Today", "Tomorrow", "Coming up", "Later"] as const;

export function TimelinePanel({
  items,
  onDetail,
}: {
  items: TimelineItem[];
  onDetail: (detail: ItemDetail) => void;
}) {
  const { t, text, locale, formatDate } = useLocale();

  const [collapsed, setCollapsed] = useState<ReadonlySet<string>>(new Set());
  const [onlyDeadlines, setOnlyDeadlines] = useState(false);
  const visibleItems = items.filter(
    (item) => !onlyDeadlines || item.kind === "deadline",
  );
  const conflicts = conflictingEvents(items, currentUserId);
  const nextDeadline = items
    .filter((item) => item.kind === "deadline" && item.date >= workspaceDate)
    .sort((a, b) =>
      `${a.date}${a.time ?? "23:59"}`.localeCompare(
        `${b.date}${b.time ?? "23:59"}`,
      ),
    )[0];

  function toggle(period: string) {
    setCollapsed((previous) => {
      const next = new Set(previous);
      if (next.has(period)) next.delete(period);
      else next.add(period);
      return next;
    });
  }

  return (
    <section aria-labelledby="timeline-heading" className="timeline-zone">
      <div className="section-heading">
        <div>
          <h2 id="timeline-heading">
            <span className="section-marker marker-violet" />
            {t("Timeline")}
          </h2>
        </div>
        <span className="timeline-today-count">
          {t("{count} today", {
            count: items.filter((item) => item.date === workspaceDate).length,
          })}
        </span>
      </div>
      <div className="panel timeline-panel">
        {nextDeadline && (
          <button
            className="next-deadline"
            onClick={() => onDetail(timelineDetail(nextDeadline, locale))}
          >
            <span className="next-deadline-icon">
              <Icon name="clock" size={21} />
            </span>
            <span>
              <small>
                {t("Next deadline")}
                <span>
                  {nextDeadline.date === workspaceDate
                    ? t("Today")
                    : formatDate(nextDeadline.date)}
                  {nextDeadline.time ? ` · ${nextDeadline.time}` : ""}
                </span>
              </small>
              <strong>{nextDeadline.title}</strong>
            </span>
            <Icon name="arrow" size={18} />
          </button>
        )}
        <div className="timeline-toolbar">
          <span>
            <Icon name="calendar" size={16} />
            {t("Your upcoming schedule")}
          </span>
          <label className="deadline-filter">
            <input
              type="checkbox"
              checked={onlyDeadlines}
              onChange={(event) => setOnlyDeadlines(event.target.checked)}
            />
            {t("Deadlines only")}
          </label>
        </div>
        <div className="timeline-groups">
          {periods.map((period) => {
            const group = visibleItems.filter(
              (item) => timelinePeriod(item.date) === period,
            );
            const isCollapsed = collapsed.has(period);
            const groupId = `timeline-${period.toLowerCase().replaceAll(" ", "-")}`;
            return (
              <div
                className={`timeline-group${period === "Today" ? " timeline-today" : ""}`}
                key={period}
              >
                <button
                  className="timeline-group-heading"
                  aria-expanded={!isCollapsed}
                  aria-controls={groupId}
                  onClick={() => toggle(period)}
                >
                  <span className="timeline-node" />
                  <strong>{text(period)}</strong>
                  <span className="timeline-date">
                    {period === "Today"
                      ? formatDate(workspaceDate)
                      : period === "Tomorrow"
                        ? formatDate(addDays(workspaceDate, 1))
                        : period === "Coming up"
                          ? t("Next 7 days")
                          : t("Beyond this week")}
                  </span>
                  <span className="group-count">{group.length}</span>
                  <Icon name={isCollapsed ? "chevron" : "down"} size={14} />
                </button>
                <div id={groupId} hidden={isCollapsed}>
                  <ul className="timeline-list">
                    {group.map((item) => (
                      <li
                        key={item.id}
                        className={`timeline-item timeline-${item.kind}${conflicts.has(item.id) ? " timeline-conflict" : ""}`}
                      >
                        <span className="timeline-time">
                          {item.time ?? formatDate(item.date)}
                          {item.endTime && <span>{item.endTime}</span>}
                        </span>
                        <button
                          className="timeline-entry"
                          onClick={() => onDetail(timelineDetail(item, locale))}
                        >
                          <span className="timeline-entry-title">
                            {item.title}
                            {conflicts.has(item.id) && (
                              <span className="event-tag tag-conflict">
                                <Icon name="warning" size={12} />
                                {t("Overlap")}
                              </span>
                            )}
                            {item.kind !== "meeting" && (
                              <span className={`event-tag tag-${item.kind}`}>
                                {t(
                                  item.kind === "deadline"
                                    ? "Due"
                                    : "Milestone",
                                )}
                              </span>
                            )}
                          </span>
                          <span className="timeline-entry-meta">
                            {item.location ? (
                              <>
                                <Icon name="location" size={12} />
                                {item.location}
                              </>
                            ) : (
                              <>
                                <Icon
                                  name={
                                    item.kind === "deadline"
                                      ? "clock"
                                      : "projects"
                                  }
                                  size={12}
                                />
                                {t(
                                  item.kind === "deadline"
                                    ? "Deadline"
                                    : "Project milestone",
                                )}
                              </>
                            )}
                            {period !== "Today" && period !== "Tomorrow" && (
                              <span>
                                · {formatDate(item.date, { weekday: "short" })}
                              </span>
                            )}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                  {group.length === 0 && (
                    <p className="timeline-empty">
                      {t(
                        onlyDeadlines
                          ? "No deadlines in this period."
                          : "No scheduled items.",
                      )}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        <div className="panel-footer">
          <span>{t("All times in Berlin · CET")}</span>
        </div>
      </div>
    </section>
  );
}
