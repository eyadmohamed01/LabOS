import type { AttentionItem, TimelineItem } from "../../types/dashboard";
import { overviewMetrics, openTasks } from "../../lib/dashboardInsights";
import { people } from "../../lib/dashboardData";
import { useLocale } from "./LocaleProvider";
import { Avatar } from "./Primitives";
import { Icon, type IconName } from "./Icon";
import type { TranslationKey } from "../../lib/i18n";

interface MetricsProps {
  items: AttentionItem[];
  completedIds: ReadonlySet<string>;
}

export function WorkMetrics({
  items,
  completedIds,
  schedule,
  referenceDate,
}: MetricsProps & { schedule: TimelineItem[]; referenceDate: string }) {
  const { t } = useLocale();
  const metrics = overviewMetrics(items, completedIds, schedule, referenceDate);
  const cells: {
    label: TranslationKey;
    value: number;
    hint: TranslationKey;
    icon: IconName;
    tone: string;
  }[] = [
    {
      label: "Open tasks",
      value: metrics.open,
      hint: "Current workspace",
      icon: "tasks",
      tone: "violet",
    },
    {
      label: "Resolved",
      value: metrics.resolved,
      hint: "This session",
      icon: "check",
      tone: "sage",
    },
    {
      label: "Captured",
      value: metrics.captured,
      hint: "This session",
      icon: "plus",
      tone: "blue",
    },
    {
      label: "Deadlines",
      value: metrics.deadlines,
      hint: "Next 7 days",
      icon: "calendar",
      tone: "amber",
    },
  ];
  return (
    <section aria-label={t("Workspace metrics")} className="metrics-strip">
      <dl>
        {cells.map((cell) => (
          <div key={cell.label} className="metric-cell">
            <span className={`metric-icon tone-${cell.tone}`}>
              <Icon name={cell.icon} size={20} />
            </span>
            <div>
              <dt>{t(cell.label)}</dt>
              <dd>
                <strong key={cell.value} className="metric-value">
                  {cell.value}
                </strong>
                <span>{t(cell.hint)}</span>
              </dd>
            </div>
          </div>
        ))}
      </dl>
    </section>
  );
}

export function WorkInsights({ items, completedIds }: MetricsProps) {
  const { t } = useLocale();
  const tasks = openTasks(items, completedIds);
  const resolved = items.filter(
    (item) => item.kind !== "calendar" && completedIds.has(item.id),
  ).length;
  const total = tasks.length + resolved;
  const priorities = ["high", "normal", "low"] as const;
  const assignments = people.map((person) => ({
    person,
    count: tasks.filter((item) => item.assigneeId === person.id).length,
  }));
  const max = Math.max(1, ...assignments.map(({ count }) => count));
  return (
    <section className="work-insights" aria-label={t("Work overview")}>
      <div className="panel status-overview">
        <div className="insight-heading">
          <h2>{t("Task status")}</h2>
          <span>{t("{count} tasks", { count: total })}</span>
        </div>
        <div className="status-counts">
          <div>
            <span className="status-key key-open" />
            {t("Open")}
            <strong>{tasks.length}</strong>
          </div>
          <div>
            <span className="status-key key-resolved" />
            {t("Resolved")}
            <strong>{resolved}</strong>
          </div>
        </div>
        <div className="task-distribution" aria-hidden="true">
          {tasks.length > 0 && (
            <span
              className="distribution-open"
              style={{ flex: tasks.length }}
            />
          )}
          {resolved > 0 && (
            <span
              className="distribution-resolved"
              style={{ flex: resolved }}
            />
          )}
        </div>
        <h3>{t("Open tasks by priority")}</h3>
        <dl className="priority-counts">
          {priorities.map((priority) => (
            <div key={priority}>
              <dt>
                <span className={`priority-dot priority-${priority}`} />
                {t(priority)}
              </dt>
              <dd>
                {
                  tasks.filter(
                    (item) => (item.priority ?? "normal") === priority,
                  ).length
                }
              </dd>
            </div>
          ))}
        </dl>
        <p className="chart-note">
          {t("Calendar warnings are counted separately.")}
        </p>
      </div>
      <div className="panel assignee-overview">
        <div className="insight-heading">
          <h2>{t("Open tasks by assignee")}</h2>
          <Icon name="people" size={17} />
        </div>
        <ul className="assignee-chart">
          {assignments.map(({ person, count }) => (
            <li key={person.id}>
              <span className="assignee-name">
                <Avatar personId={person.id} small />
                <span>{person.name}</span>
              </span>
              <span className="assignee-track" aria-hidden="true">
                <span style={{ width: `${(count / max) * 100}%` }} />
              </span>
              <strong>{count}</strong>
            </li>
          ))}
        </ul>
        <p className="chart-note">
          {t("Task counts, not an estimate of capacity.")}
        </p>
      </div>
    </section>
  );
}
