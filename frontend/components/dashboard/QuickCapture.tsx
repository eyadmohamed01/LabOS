"use client";
import { useLocale } from "./LocaleProvider";

// One entry point for new tasks: a single button that opens the task form (also bound to the N key).
export function QuickCapture({ onAdd }: { onAdd: () => void }) {
  const { t } = useLocale();
  return (
    <section className="quick-capture add-task-bar" aria-label={t("Add task")}>
      <p>{t("Add a task with an assignee, due date and details.")}</p>
      <button type="button" className="button button-primary" onClick={onAdd}>
        {t("Add task")}
        <kbd>N</kbd>
      </button>
    </section>
  );
}
