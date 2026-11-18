import { getPerson, getProject } from "../../lib/dashboard";
import { useLocale } from "./LocaleProvider";

export function Avatar({
  personId,
  small = false,
}: {
  personId: string;
  small?: boolean;
}) {
  const person = getPerson(personId);
  if (!person) return null;
  return (
    <span
      className={`avatar tone-${person.tone}${small ? " avatar-small" : ""}`}
      title={person.name}
      aria-label={person.name}
    >
      {person.initials}
    </span>
  );
}

export function AvatarGroup({ ids }: { ids: string[] }) {
  const { t } = useLocale();
  return (
    <span className="avatar-group">
      {ids.slice(0, 3).map((id) => (
        <Avatar key={id} personId={id} small />
      ))}
      {ids.length > 3 && (
        <span
          className="avatar avatar-small avatar-extra"
          aria-label={t("{count} more people", { count: ids.length - 3 })}
        >
          +{ids.length - 3}
        </span>
      )}
    </span>
  );
}

export function ProjectLabel({ projectId }: { projectId?: string }) {
  const { t } = useLocale();
  const project = getProject(projectId);
  return (
    <span className="project-label">
      <span className={`project-dot tone-${project?.tone ?? "violet"}`} />
      {project?.name ?? t("Lab workspace")}
    </span>
  );
}
