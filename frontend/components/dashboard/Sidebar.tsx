import type { Section } from "../../types/dashboard";
import { currentUserId, workspaceShortName } from "../../lib/dashboardData";
import { getPerson } from "../../lib/dashboard";
import { Icon } from "./Icon";
import { Avatar } from "./Primitives";
import { useLocale } from "./LocaleProvider";
import type { Project } from "../../types/dashboard";

const navigation: { id: Section; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "projects", label: "Projects" },
  { id: "tasks", label: "Tasks" },
  { id: "calendar", label: "Calendar" },
  { id: "people", label: "People" },
  { id: "decisions", label: "Decisions" },
  { id: "documents", label: "Documents" },
];

export function Sidebar({
  open,
  attentionCount,
  onProject,
  onClose,
  onOverview,
  projects,
  memberCount,
  firstUse = false,
}: {
  open: boolean;
  attentionCount: number;
  onProject: (id: string) => void;
  onClose: () => void;
  onOverview: () => void;
  projects: Project[];
  memberCount: number;
  firstUse?: boolean;
}) {
  const { t, text } = useLocale();
  const currentUser = getPerson(currentUserId);
  return (
    <aside
      className={`sidebar${open ? " sidebar-open" : ""}`}
      aria-label={t("Workspace sidebar")}
      role={open ? "dialog" : undefined}
      aria-modal={open ? true : undefined}
    >
      <div className="brand-row">
        <a
          href="#overview"
          className="brand"
          onClick={(event) => {
            event.preventDefault();
            onOverview();
          }}
          aria-label={t("LabOS overview")}
        >
          <span className="brand-mark" aria-hidden="true">
            <span />
            <span />
            <span />
            <span />
          </span>
          <span>
            Lab<span className="brand-accent">OS</span>
            <span className="brand-period">.</span>
          </span>
        </a>
        <button
          className="icon-button mobile-close"
          onClick={onClose}
          aria-label={t("Close navigation")}
        >
          <Icon name="close" />
        </button>
      </div>
      <div className="workspace-identity">
        <span className="workspace-monogram">LO</span>
        <div>
          <strong>{text(workspaceShortName)}</strong>
          <span>{t("Research workspace")}</span>
        </div>
      </div>
      <p className="sidebar-label">{t("WORKSPACE")}</p>
      <nav aria-label={t("Main navigation")}>
        {navigation.map(({ id, label }) => (
          <button
            key={id}
            className={`nav-item${id === "overview" ? " nav-active" : " nav-disabled"}`}
            aria-current={id === "overview" ? "page" : undefined}
            disabled={id !== "overview"}
            title={
              id !== "overview" ? t("Not available in this preview") : undefined
            }
            onClick={onOverview}
          >
            <Icon name={id} size={19} />
            <span>{text(label)}</span>
            {id === "tasks" && (
              <span className="nav-count">{attentionCount}</span>
            )}
          </button>
        ))}
      </nav>
      <div className="sidebar-project-heading">
        <p className="sidebar-label">{t("YOUR PROJECTS")}</p>
        <span>{projects.length}</span>
      </div>
      <nav aria-label={t("Project shortcuts")} className="project-shortcuts">
        {projects.length === 0 && (
          <p className="sidebar-empty-projects">{t("No projects yet")}</p>
        )}
        {projects.map((project) => (
          <button key={project.id} onClick={() => onProject(project.id)}>
            <span className={`project-dot tone-${project.tone}`} />
            <span>{project.name}</span>
          </button>
        ))}
      </nav>
      <div className="sidebar-bottom">
        <div className="sidebar-note">
          <Icon name="projects" size={18} />
          <p>
            {firstUse
              ? t("No projects yet")
              : t("{projects} projects · {people} members", {
                  projects: projects.length,
                  people: memberCount,
                })}
          </p>
        </div>
        <div className="sidebar-profile">
          {firstUse ? (
            <span className="avatar tone-violet" aria-label={t("Professor")}>
              P
            </span>
          ) : (
            <Avatar personId={currentUserId} />
          )}
          <div>
            <strong>{firstUse ? t("Professor") : currentUser?.name}</strong>
            <span>
              {firstUse ? t("Your workspace") : text(currentUser?.role ?? "")}
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
}
