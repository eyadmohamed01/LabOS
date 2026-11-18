import { useLocale } from "./LocaleProvider";
import type { AttentionItem, Project } from "../../types/dashboard";
import { projectTaskCounts } from "../../lib/dashboardInsights";
import { Icon } from "./Icon";
import { AvatarGroup } from "./Primitives";

export function ActiveProjects({
  projects,
  onProject,
  items,
  completedIds,
}: {
  projects: Project[];
  onProject: (id: string) => void;
  items: AttentionItem[];
  completedIds: ReadonlySet<string>;
}) {
  const { t, formatDate } = useLocale();

  return (
    <section className="active-projects" aria-labelledby="projects-heading">
      <div className="section-heading">
        <div>
          <h2 id="projects-heading">
            {t("Active projects")}
            <span className="count">{projects.length}</span>
          </h2>
        </div>
      </div>
      <div className="project-grid">
        {projects.map((project) => {
          const counts = projectTaskCounts(project.id, items, completedIds);
          return (
            <article key={project.id} className="panel project-card">
              <div className="project-card-top">
                <span className={`project-code tone-${project.tone}`}>
                  {project.code}
                </span>
                <span
                  className={`project-status${project.status === "Needs attention" ? " project-status-warning" : ""}`}
                >
                  <span />
                  {t(project.status)}
                </span>
              </div>
              <h3>
                <button onClick={() => onProject(project.id)}>
                  {project.name}
                  <Icon name="chevron" size={16} />
                </button>
              </h3>
              <p>{project.discipline}</p>
              <div className="project-phase">
                <span>{t("Phase")}</span>
                <strong>{project.phase}</strong>
              </div>
              <div className="project-next">
                <span>{t("Next milestone")}</span>
                <strong>{project.nextMilestone}</strong>
              </div>
              <div className="project-task-counts">
                <span>{t("{count} open", { count: counts.open })}</span>
                {counts.overdue > 0 && (
                  <span className="project-overdue">
                    {t("{count} overdue", { count: counts.overdue })}
                  </span>
                )}
              </div>
              <div className="project-card-footer">
                <AvatarGroup ids={project.memberIds} />
                <span>
                  <Icon name="calendar" size={13} />
                  {formatDate(project.dueDate)}
                </span>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
