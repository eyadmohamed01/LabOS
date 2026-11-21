"use client";

import { useId, useMemo, useRef, useState, type KeyboardEvent } from "react";
import {
  attentionDetail,
  getPerson,
  getProject,
  projectDetail,
  timelineDetail,
} from "../../lib/dashboard";
import {
  highlightMatches,
  normalizeSearch,
  searchDocuments,
  type SearchDocument,
  type SearchFilters,
  type SearchType,
} from "../../lib/search";
import type {
  AttentionItem,
  ItemDetail,
  Project,
  TimelineItem,
} from "../../types/dashboard";
import { statusLabels, taskDetail } from "../../lib/taskDetail";
import type { Task } from "../../types/tasks";
import { Dialog } from "./Dialog";
import { Icon } from "./Icon";
import { useLocale } from "./LocaleProvider";

interface IndexedItem extends SearchDocument {
  detail: ItemDetail;
}

function Highlighted({ value, query }: { value: string; query: string }) {
  return (
    <>
      {highlightMatches(value, query).map((part, index) =>
        part.match ? (
          <mark key={index}>{part.text}</mark>
        ) : (
          <span key={index}>{part.text}</span>
        ),
      )}
    </>
  );
}

function excerpt(value: string, query: string) {
  const terms = normalizeSearch(query).split(" ");
  const match = [...value.matchAll(/[\p{L}\p{N}]+/gu)].find((word) =>
    terms.some((term) => normalizeSearch(word[0]).includes(term)),
  );
  const start = Math.max(0, (match?.index ?? 0) - 30);
  return `${start ? "…" : ""}${value.slice(start, start + 135)}${value.length > start + 135 ? "…" : ""}`;
}

export function SearchDialog({
  items,
  completedIds,
  onClose,
  onSelect,
  projects,
  timelineItems,
  extraTasks = [],
}: {
  items: AttentionItem[];
  completedIds: ReadonlySet<string>;
  onClose: () => void;
  onSelect: (detail: ItemDetail) => void;
  projects: Project[];
  timelineItems: TimelineItem[];
  /** Fully specified workspace tasks (current statuses applied). Overview items are not repeated here. */
  extraTasks?: Task[];
}) {
  const { t, text, locale, formatDate } = useLocale();
  const [query, setQuery] = useState("");
  const [type, setType] = useState<SearchType | "all">("all");
  const [status, setStatus] = useState<"all" | "open" | "resolved">("all");
  const [project, setProject] = useState("");
  const [active, setActive] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  const list = useRef<HTMLDivElement>(null);
  const listId = useId();
  const indexed = useMemo<IndexedItem[]>(
    () => [
      ...items.map((item): IndexedItem => ({
        id: `task-${item.id}`,
        type: "task",
        title: item.title,
        description: item.description,
        status: completedIds.has(item.id) ? "resolved" : "open",
        project: getProject(item.projectId)?.name ?? "",
        people: getPerson(item.assigneeId)?.name ?? "",
        labels: `${item.label} ${text(item.label)} ${item.priority ?? "normal"} ${text(item.priority ?? "normal")}`,
        detail: attentionDetail(item, locale),
      })),
      ...extraTasks
        .filter((task) => !items.some((item) => item.id === task.id))
        .map((task): IndexedItem => ({
          id: `task-${task.id}`,
          type: "task",
          title: task.title,
          description: task.description,
          status:
            task.status === "completed" || task.status === "cancelled"
              ? "resolved"
              : "open",
          project: getProject(task.projectId)?.name ?? "",
          people: [task.ownerId, task.requesterId]
            .map((id) => (id ? getPerson(id)?.name : undefined))
            .filter(Boolean)
            .join(" "),
          labels: `${statusLabels[task.status]} ${text(statusLabels[task.status])} ${task.milestone ? "Milestone" : ""} ${task.priority ?? "normal"} ${text(task.priority ?? "normal")}`,
          detail: taskDetail(task, locale),
        })),
      ...projects.map((item): IndexedItem => ({
        id: `project-${item.id}`,
        type: "project",
        status: "active",
        title: item.name,
        description: item.description,
        project: item.name,
        people: item.memberIds.map((id) => getPerson(id)?.name).join(" "),
        labels: `${item.discipline} ${item.phase} ${item.nextMilestone}`,
        detail: projectDetail(item, locale),
      })),
      ...timelineItems.map((item): IndexedItem => ({
        id: `event-${item.id}`,
        type: "event",
        status: "scheduled",
        title: item.title,
        description: item.description,
        project: getProject(item.projectId)?.name ?? "",
        people: item.attendeeIds.map((id) => getPerson(id)?.name).join(" "),
        labels: `${item.kind} ${text(item.kind)} ${item.location ?? ""} ${item.date} ${formatDate(item.date, { weekday: "long", month: "long" })}`,
        detail: timelineDetail(item, locale),
      })),
    ],
    [
      items,
      completedIds,
      extraTasks,
      projects,
      timelineItems,
      locale,
      text,
      formatDate,
    ],
  );
  const filters: SearchFilters = {
    status: status === "all" ? undefined : status,
    project: project || undefined,
  };
  const scoped =
    !query.trim() && status === "all" && !project
      ? indexed.map((document) => ({ document }))
      : searchDocuments(indexed, query, filters);
  const isSuggestion =
    !query.trim() && status === "all" && !project && type === "all";
  const hits = isSuggestion
    ? indexed
        .filter((item) => item.status === "open")
        .slice(0, 4)
        .map((document) => ({
          document,
          score: 0,
          matchedField: "title" as const,
          approximate: false,
        }))
    : searchDocuments(indexed, query, {
        ...filters,
        type: type === "all" ? undefined : type,
      });
  const selected = Math.min(active, Math.max(0, hits.length - 1));
  const typeLabels = {
    all: "All",
    task: "Tasks",
    project: "Projects",
    event: "Events",
  } as const;
  const resultLabels = {
    task: "Task",
    project: "Project",
    event: "Event",
  } as const;
  const hasFilters = type !== "all" || status !== "all" || !!project;

  function resetPosition() {
    setActive(0);
    if (list.current) list.current.scrollTop = 0;
  }
  function handleKeys(event: KeyboardEvent<HTMLInputElement>) {
    if (!hits.length || event.nativeEvent.isComposing) return;
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      const next =
        (selected + (event.key === "ArrowDown" ? 1 : -1) + hits.length) %
        hits.length;
      setActive(next);
      list.current
        ?.querySelectorAll<HTMLElement>('[role="option"]')
        [next]?.scrollIntoView({ block: "nearest" });
    }
    if (event.key === "Enter") {
      event.preventDefault();
      onSelect(hits[selected].document.detail);
    }
  }

  return (
    <Dialog
      className="workspace-search-dialog"
      title={t("Search your workspace")}
      eyebrow={t("WORKSPACE SEARCH")}
      onClose={onClose}
      initialFocus={input}
    >
      <div className="search-input">
        <Icon name="search" />
        <label className="sr-only" htmlFor={`${listId}-input`}>
          {t("Search tasks, projects, and schedule")}
        </label>
        <input
          id={`${listId}-input`}
          ref={input}
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={hits.length > 0}
          aria-controls={listId}
          aria-activedescendant={
            hits.length ? `${listId}-${selected}` : undefined
          }
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            resetPosition();
          }}
          onKeyDown={handleKeys}
          placeholder={t("Search by title, person, project, or keyword…")}
          autoComplete="off"
          spellCheck={false}
          maxLength={200}
        />
        {query && (
          <button
            className="icon-button"
            aria-label={t("Clear search")}
            onClick={() => {
              setQuery("");
              resetPosition();
              input.current?.focus();
            }}
          >
            <Icon name="close" size={16} />
          </button>
        )}
      </div>
      <div
        className="search-type-filters"
        role="group"
        aria-label={t("Result type")}
      >
        {(["all", "task", "project", "event"] as const).map((value) => (
          <button
            key={value}
            aria-pressed={type === value}
            onClick={() => {
              setType(value);
              resetPosition();
            }}
          >
            {t(typeLabels[value])}
            {!isSuggestion && (
              <span>
                {value === "all"
                  ? scoped.length
                  : scoped.filter((hit) => hit.document.type === value).length}
              </span>
            )}
          </button>
        ))}
      </div>
      <div className="search-scope-filters">
        <label>
          <span>{t("Project")}</span>
          <select
            value={project}
            onChange={(event) => {
              setProject(event.target.value);
              resetPosition();
            }}
          >
            <option value="">{t("All projects")}</option>
            {projects.map((item) => (
              <option key={item.id} value={item.name}>
                {item.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>{t("Task status")}</span>
          <select
            value={status}
            onChange={(event) => {
              setStatus(event.target.value as typeof status);
              resetPosition();
            }}
          >
            <option value="all">{t("Any status")}</option>
            <option value="open">{t("Open")}</option>
            <option value="resolved">{t("Resolved")}</option>
          </select>
        </label>
        {hasFilters && (
          <button
            className="text-button"
            onClick={() => {
              setType("all");
              setStatus("all");
              setProject("");
              resetPosition();
            }}
          >
            {t("Reset filters")}
          </button>
        )}
      </div>
      <p className="search-summary" role="status">
        {isSuggestion && indexed.length > 0
          ? t("Suggested open tasks")
          : t(hits.length === 1 ? "{count} result" : "{count} results", {
              count: hits.length,
            })}
        <span>{!isSuggestion && t("Sorted by relevance")}</span>
      </p>
      <div
        ref={list}
        className="search-results"
        id={listId}
        role="listbox"
        aria-label={t("Search results")}
      >
        {hits.map(({ document, approximate, matchedField }, index) => (
          <button
            id={`${listId}-${index}`}
            role="option"
            aria-selected={selected === index}
            tabIndex={-1}
            className={`search-result${selected === index ? " search-result-active" : ""}`}
            key={document.id}
            onMouseMove={() => setActive(index)}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => onSelect(document.detail)}
          >
            <span className="search-result-icon">
              <Icon
                name={
                  document.type === "task"
                    ? "tasks"
                    : document.type === "project"
                      ? "projects"
                      : "calendar"
                }
                size={19}
              />
            </span>
            <span className="search-result-body">
              <span className="search-result-kind">
                {t(resultLabels[document.type])}
                {document.status === "resolved" && <span>{t("Resolved")}</span>}
                {approximate && <span>{t("Similar match")}</span>}
              </span>
              <strong>
                <Highlighted value={document.title} query={query} />
              </strong>
              <span className="search-result-context">
                <Highlighted
                  value={
                    matchedField === "description"
                      ? excerpt(document.description, query)
                      : matchedField === "people"
                        ? document.people
                        : matchedField === "labels"
                          ? excerpt(document.labels, query)
                          : document.type === "project"
                            ? excerpt(document.description, query)
                            : document.project ||
                              document.people ||
                              excerpt(document.description, query)
                  }
                  query={query}
                />
              </span>
            </span>
            <Icon name="arrow" size={16} />
          </button>
        ))}
      </div>
      {hits.length === 0 && (
        <div className="empty-state">
          <Icon name="search" size={25} />
          <h3>
            {t(indexed.length === 0 ? "Nothing to search yet" : "No results")}
          </h3>
          <p>
            {t(
              indexed.length === 0
                ? "Tasks you capture will be searchable here."
                : "Try fewer words or adjust the filters.",
            )}
          </p>
        </div>
      )}
      <div className="search-keyboard-help">
        <span>
          <kbd>↑</kbd>
          <kbd>↓</kbd>
          {t("Navigate")}
        </span>
        <span>
          <kbd>Enter</kbd>
          {t("Open result")}
        </span>
        <span>
          <kbd>Esc</kbd>
          {t("Close")}
        </span>
      </div>
    </Dialog>
  );
}
