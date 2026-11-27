"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  addDays,
  eventsOn,
  layoutDay,
  monthGrid,
  sameMonth,
  startOfWeek,
  stepAnchor,
  weekDates,
  type CalendarMode,
} from "../../lib/calendar";
import { conflictingEvents } from "../../lib/dashboardInsights";
import { isActive } from "../../lib/tasks";
import type { TimelineItem } from "../../types/dashboard";
import type { Task } from "../../types/tasks";
import { Icon } from "./Icon";
import { useLocale } from "./LocaleProvider";

const HOUR = 48; // px per hour in the time grid
// The grid covers the whole day so early (01:00) and late (23:00) events are placed correctly.
const FIRST_HOUR = 0;
const LAST_HOUR = 24;
const MAX_CHIPS = 3;

const modes: { id: CalendarMode; label: "Month" | "Week" | "Day" | "Agenda" }[] = [
  { id: "month", label: "Month" },
  { id: "week", label: "Week" },
  { id: "day", label: "Day" },
  { id: "agenda", label: "Agenda" },
];

export function CalendarView({
  events,
  tasks,
  me,
  today,
  onOpenEvent,
  onOpenTask,
  onAddEvent,
}: {
  events: TimelineItem[];
  tasks: Task[];
  me: string;
  today: string;
  onOpenEvent: (event: TimelineItem) => void;
  onOpenTask: (task: Task) => void;
  onAddEvent: (date: string) => void;
}) {
  const { t, formatDate } = useLocale();
  const [mode, setMode] = useState<CalendarMode>("month");
  const [anchor, setAnchor] = useState(today);
  const [showTasks, setShowTasks] = useState(true);
  const gridRef = useRef<HTMLDivElement>(null);

  const conflicts = useMemo(() => conflictingEvents(events, me), [events, me]);
  const deadlines = useMemo(
    () =>
      showTasks
        ? tasks.filter((task) => isActive(task) && task.dueDate && task.ownerId === me)
        : [],
    [tasks, me, showTasks],
  );
  const tasksOn = (day: string) => deadlines.filter((task) => task.dueDate === day);

  // Scroll the time grid to the morning when it appears.
  useEffect(() => {
    if (mode === "week" || mode === "day")
      gridRef.current?.scrollTo({ top: (8 - FIRST_HOUR) * HOUR });
  }, [mode]);

  const dayLabel = (day: string, options: Intl.DateTimeFormatOptions) =>
    formatDate(day, { day: undefined, month: undefined, ...options });

  const title =
    mode === "month"
      ? dayLabel(anchor, { month: "long", year: "numeric" })
      : mode === "week"
        ? `${formatDate(startOfWeek(anchor))} – ${formatDate(addDays(startOfWeek(anchor), 6), { year: "numeric" })}`
        : mode === "day"
          ? formatDate(anchor, { weekday: "long", year: "numeric", month: "long" })
          : `${formatDate(anchor)} – ${formatDate(addDays(anchor, 29), { year: "numeric" })}`;

  function eventChip(event: TimelineItem, compact = false) {
    const conflict = conflicts.has(event.id);
    return (
      <button
        key={event.id}
        type="button"
        className={`cal-chip cal-${event.kind}${conflict ? " cal-conflict" : ""}`}
        onClick={() => onOpenEvent(event)}
        title={`${event.time ?? t("All day")} · ${event.title}`}
      >
        {conflict && <Icon name="warning" size={11} />}
        {!compact && <span className="cal-chip-time">{event.time ?? ""}</span>}
        <span className="cal-chip-title">{event.title}</span>
      </button>
    );
  }
  const taskChip = (task: Task) => (
    <button
      key={task.id}
      type="button"
      className="cal-chip cal-task"
      onClick={() => onOpenTask(task)}
      title={`${t("Due")}: ${task.title}`}
    >
      <Icon name="check" size={11} />
      <span className="cal-chip-time">{task.dueTime ?? ""}</span>
      <span className="cal-chip-title">{task.title}</span>
    </button>
  );

  function dayHeader(day: string) {
    return (
      <button
        type="button"
        className={`cal-day-number${day === today ? " cal-today" : ""}`}
        onClick={() => {
          setAnchor(day);
          setMode("day");
        }}
        aria-label={formatDate(day, { weekday: "long", year: "numeric", month: "long" })}
      >
        {Number(day.slice(8))}
      </button>
    );
  }

  function renderMonth() {
    const weeks = monthGrid(anchor);
    return (
      <div className="cal-month" role="grid" aria-label={title}>
        <div className="cal-weekdays" role="row">
          {weekDates(anchor).map((day) => (
            <span key={day} role="columnheader">
              {dayLabel(day, { weekday: "short" })}
            </span>
          ))}
        </div>
        {weeks.map((week) => (
          <div className="cal-week" role="row" key={week[0]}>
            {week.map((day) => {
              const dayEvents = eventsOn(events, day);
              const dayTasks = tasksOn(day);
              const entries = [
                ...dayEvents.map((event) => ({ key: event.id, node: eventChip(event) })),
                ...dayTasks.map((task) => ({ key: task.id, node: taskChip(task) })),
              ];
              return (
                <div
                  key={day}
                  role="gridcell"
                  className={`cal-cell${sameMonth(day, anchor) ? "" : " cal-outside"}${day === today ? " cal-cell-today" : ""}`}
                >
                  {dayHeader(day)}
                  <div className="cal-chips">
                    {entries.slice(0, MAX_CHIPS).map((entry) => entry.node)}
                    {entries.length > MAX_CHIPS && (
                      <button
                        type="button"
                        className="cal-more"
                        onClick={() => {
                          setAnchor(day);
                          setMode("day");
                        }}
                      >
                        {t("{count} more", { count: entries.length - MAX_CHIPS })}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    );
  }

  function renderTimeGrid(days: string[]) {
    const hours = Array.from({ length: LAST_HOUR - FIRST_HOUR }, (_, i) => FIRST_HOUR + i);
    return (
      <div className="cal-time">
        <div className="cal-time-head" style={{ "--cal-days": days.length } as React.CSSProperties}>
          <span />
          {days.map((day) => (
            <div key={day} className="cal-time-day">
              <span>{dayLabel(day, { weekday: "short" })}</span>
              {dayHeader(day)}
            </div>
          ))}
          <span className="cal-allday-label">{t("All day")}</span>
          {days.map((day) => (
            <div key={day} className="cal-allday">
              {eventsOn(events, day)
                .filter((event) => !event.time)
                .map((event) => eventChip(event, true))}
              {tasksOn(day).map(taskChip)}
            </div>
          ))}
        </div>
        <div className="cal-time-scroll" ref={gridRef}>
          <div
            className="cal-time-body"
            style={
              {
                "--cal-days": days.length,
                height: hours.length * HOUR,
              } as React.CSSProperties
            }
          >
            <div className="cal-hours">
              {hours.map((hour) => (
                <span key={hour} style={{ height: HOUR }}>
                  {`${String(hour).padStart(2, "0")}:00`}
                </span>
              ))}
            </div>
            {days.map((day) => (
              <div key={day} className={`cal-time-column${day === today ? " cal-cell-today" : ""}`}>
                {hours.map((hour) => (
                  <span key={hour} className="cal-hour-line" style={{ height: HOUR }} />
                ))}
                {layoutDay(eventsOn(events, day)).map(({ item, start, end, lane, lanes }) => {
                  const top = Math.max(0, ((start - FIRST_HOUR * 60) / 60) * HOUR);
                  const bottom = Math.min(
                    hours.length * HOUR,
                    ((end - FIRST_HOUR * 60) / 60) * HOUR,
                  );
                  return (
                    <button
                      key={item.id}
                      type="button"
                      className={`cal-block cal-${item.kind}${conflicts.has(item.id) ? " cal-conflict" : ""}`}
                      style={{
                        top,
                        height: Math.max(22, bottom - top),
                        left: `${(lane / lanes) * 100}%`,
                        width: `${100 / lanes}%`,
                      }}
                      onClick={() => onOpenEvent(item)}
                    >
                      <strong>{item.title}</strong>
                      <span>
                        {item.time}
                        {item.endTime ? `–${item.endTime}` : ""}
                        {item.location ? ` · ${item.location}` : ""}
                      </span>
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  function renderAgenda() {
    const days = Array.from({ length: 30 }, (_, i) => addDays(anchor, i)).filter(
      (day) => eventsOn(events, day).length + tasksOn(day).length > 0,
    );
    if (days.length === 0)
      return <p className="cal-empty">{t("No events or deadlines in this period.")}</p>;
    return (
      <ul className="cal-agenda">
        {days.map((day) => (
          <li key={day}>
            <h3 className={day === today ? "cal-today-text" : ""}>
              {day === today
                ? t("Today")
                : formatDate(day, { weekday: "long" })}
              <span>{formatDate(day, { year: "numeric" })}</span>
            </h3>
            <div className="cal-agenda-items">
              {eventsOn(events, day).map((event) => (
                <button
                  key={event.id}
                  type="button"
                  className={`cal-agenda-row cal-${event.kind}${conflicts.has(event.id) ? " cal-conflict" : ""}`}
                  onClick={() => onOpenEvent(event)}
                >
                  <span className="cal-agenda-time">
                    {event.time ? `${event.time}${event.endTime ? `–${event.endTime}` : ""}` : t("All day")}
                  </span>
                  <strong>{event.title}</strong>
                  {event.location && <span className="cal-agenda-place">{event.location}</span>}
                  {conflicts.has(event.id) && (
                    <span className="event-tag tag-conflict">
                      <Icon name="warning" size={12} />
                      {t("Overlap")}
                    </span>
                  )}
                </button>
              ))}
              {tasksOn(day).map((task) => (
                <button
                  key={task.id}
                  type="button"
                  className="cal-agenda-row cal-task"
                  onClick={() => onOpenTask(task)}
                >
                  <span className="cal-agenda-time">{task.dueTime ?? t("Due")}</span>
                  <strong>{task.title}</strong>
                </button>
              ))}
            </div>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <section className="calendar-view" aria-labelledby="calendar-heading">
      <div className="section-heading">
        <div>
          <h2 id="calendar-heading">
            <span className="section-marker marker-violet" />
            {t("Calendar")}
            <span className="count">{events.length}</span>
          </h2>
          <p>{title}</p>
        </div>
        <button
          type="button"
          className="button button-primary"
          onClick={() => onAddEvent(mode === "month" || mode === "agenda" ? today : anchor)}
        >
          {t("Add event")}
        </button>
      </div>
      <div className="panel calendar-panel">
        <div className="cal-toolbar">
          <div className="cal-nav" role="group" aria-label={t("Calendar navigation")}>
            <button type="button" className="button" onClick={() => setAnchor(today)}>
              {t("Today")}
            </button>
            <button
              type="button"
              className="icon-button"
              aria-label={t("Previous")}
              onClick={() => setAnchor(stepAnchor(mode, anchor, -1))}
            >
              <span className="cal-flip">
                <Icon name="chevron" size={16} />
              </span>
            </button>
            <button
              type="button"
              className="icon-button"
              aria-label={t("Next")}
              onClick={() => setAnchor(stepAnchor(mode, anchor, 1))}
            >
              <Icon name="chevron" size={16} />
            </button>
          </div>
          <div className="filter-row cal-modes" role="group" aria-label={t("Calendar views")}>
            {modes.map(({ id, label }) => (
              <button
                key={id}
                type="button"
                aria-pressed={mode === id}
                className={mode === id ? "filter-active" : ""}
                onClick={() => setMode(id)}
              >
                {t(label)}
              </button>
            ))}
          </div>
          <label className="deadline-filter">
            <input
              type="checkbox"
              checked={showTasks}
              onChange={(event) => setShowTasks(event.target.checked)}
            />
            {t("Show task deadlines")}
          </label>
        </div>
        {mode === "month" && renderMonth()}
        {mode === "week" && renderTimeGrid(weekDates(anchor))}
        {mode === "day" && renderTimeGrid([anchor])}
        {mode === "agenda" && renderAgenda()}
        <div className="panel-footer">
          <span>{t("All times in Berlin · CET")}</span>
        </div>
      </div>
    </section>
  );
}
