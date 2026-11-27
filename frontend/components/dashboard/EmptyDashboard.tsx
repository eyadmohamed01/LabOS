import type {
  AttentionItem,
  ItemDetail,
  TimelineItem,
} from "../../types/dashboard";
import type { TranslationKey } from "../../lib/i18n";
import { AttentionPanel } from "./AttentionPanel";
import { TimelinePanel } from "./TimelinePanel";
import { WorkMetrics } from "./WorkMetrics";
import { Icon, type IconName } from "./Icon";
import { useLocale } from "./LocaleProvider";

function FirstUsePanel({
  id,
  title,
  icon,
  heading,
  description,
  action,
  onAction,
  comingSoon = false,
}: {
  id: string;
  title: TranslationKey;
  icon: IconName;
  heading: TranslationKey;
  description: TranslationKey;
  action: TranslationKey;
  onAction?: () => void;
  comingSoon?: boolean;
}) {
  const { t } = useLocale();
  return (
    <section
      aria-labelledby={id}
      className={`first-use-zone ${icon === "calendar" ? "timeline-zone" : "attention-zone"}`}
    >
      <div className="section-heading">
        <h2 id={id}>
          <span
            className={`section-marker ${icon === "calendar" ? "marker-violet" : "marker-amber"}`}
          />
          {t(title)}
          <span className="count">0</span>
        </h2>
      </div>
      <div
        className={`panel first-use-panel${icon === "calendar" ? " timeline-panel" : ""}`}
      >
        <span className="first-use-icon">
          <Icon name={icon} size={23} />
        </span>
        <h3>{t(heading)}</h3>
        <p>{t(description)}</p>
        <div className="first-use-actions">
          <button
            type="button"
            className={`button${comingSoon ? "" : " button-primary"}`}
            onClick={onAction}
            disabled={comingSoon}
          >
            <Icon name={comingSoon ? "calendar" : "plus"} size={16} />
            {t(action)}
          </button>
          {comingSoon ? (
            <span className="coming-soon-label">{t("Coming soon")}</span>
          ) : (
            <span className="first-use-shortcut">
              <kbd>N</kbd>
              {t("Quick capture")}
            </span>
          )}
        </div>
      </div>
    </section>
  );
}

export function EmptyDashboard({
  items,
  completedIds,
  referenceDate,
  events = [],
  onAddTask,
  onToggle,
  onDetail,
}: {
  items: AttentionItem[];
  completedIds: ReadonlySet<string>;
  referenceDate: string;
  /** Events added in the empty workspace. */
  events?: TimelineItem[];
  onAddTask: () => void;
  onToggle: (id: string) => void;
  onDetail: (detail: ItemDetail) => void;
}) {
  const { t } = useLocale();
  return (
    <div className="first-use-dashboard">
      <WorkMetrics
        items={items}
        completedIds={completedIds}
        schedule={events}
        referenceDate={referenceDate}
      />
      <div className="dashboard-zones">
        <AttentionPanel
          items={items}
          completedIds={completedIds}
          onToggle={onToggle}
          onDetail={onDetail}
          emptyContent={
            <FirstUsePanel
              id="attention-heading"
              title="Attention"
              icon="tasks"
              heading="No tasks to review yet"
              description="Overdue tasks and follow-ups will appear here as you add work to your workspace."
              action="Add a task"
              onAction={onAddTask}
            />
          }
        />
        <TimelinePanel
          items={events}
          onDetail={onDetail}
          emptyContent={
            <FirstUsePanel
              id="timeline-heading"
              title="Timeline"
              icon="calendar"
              heading="No events scheduled"
              description="Your meetings and deadlines will appear here. Calendar connections are not available yet."
              action="Connect calendar"
              comingSoon
            />
          }
        />
      </div>
      <section className="active-projects" aria-labelledby="projects-heading">
        <div className="section-heading">
          <h2 id="projects-heading">
            {t("Active projects")}
            <span className="count">0</span>
          </h2>
        </div>
        <div className="panel first-project-panel">
          <span className="first-use-icon">
            <Icon name="projects" size={23} />
          </span>
          <div>
            <h3>{t("Create your first project")}</h3>
            <p>
              {t(
                "Keep related tasks, milestones, and documents together. Project creation is coming soon.",
              )}
            </p>
          </div>
          <div className="first-use-actions">
            <button type="button" className="button" disabled>
              <Icon name="plus" size={16} />
              {t("Create project")}
            </button>
            <span className="coming-soon-label">{t("Coming soon")}</span>
          </div>
        </div>
      </section>
    </div>
  );
}
