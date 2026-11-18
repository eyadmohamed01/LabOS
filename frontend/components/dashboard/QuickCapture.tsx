"use client";
import { useLocale } from "./LocaleProvider";

import { useEffect, useRef, useState, type RefObject } from "react";
import { projects } from "../../lib/dashboardData";
import { Icon } from "./Icon";

export function QuickCapture({
  inputRef,
  onCapture,
}: {
  inputRef: RefObject<HTMLInputElement | null>;
  onCapture: (title: string, projectId?: string) => void;
}) {
  const { t } = useLocale();

  const [value, setValue] = useState("");
  const [projectId, setProjectId] = useState("");
  const composing = useRef(false);
  const [captureSequence, setCaptureSequence] = useState(0);
  const [captured, setCaptured] = useState(false);

  useEffect(() => {
    if (!captured) return;
    const timeout = setTimeout(() => setCaptured(false), 720);
    return () => clearTimeout(timeout);
  }, [captured, captureSequence]);

  return (
    <section className="quick-capture" aria-labelledby="capture-heading">
      <div className="capture-heading">
        <h2 className="eyebrow" id="capture-heading">
          {t("QUICK CAPTURE")}
        </h2>
        <span>
          <kbd>N</kbd>
        </span>
      </div>
      <form
        className={`capture-form${captured ? " capture-confirmed" : ""}`}
        onSubmit={(event) => {
          event.preventDefault();
          if (!value.trim() || composing.current) return;
          onCapture(value.trim(), projectId || undefined);
          setValue("");
          setCaptured(true);
          setCaptureSequence((previous) => previous + 1);
          inputRef.current?.focus();
        }}
      >
        <span
          key={captureSequence}
          className={`capture-symbol${captured ? " capture-symbol-confirmed" : ""}`}
        >
          <Icon name={captured ? "check" : "plus"} size={22} />
        </span>
        <label className="sr-only" htmlFor="quick-capture">
          {t("Capture a task or follow-up")}
        </label>
        <input
          ref={inputRef}
          id="quick-capture"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onCompositionStart={() => {
            composing.current = true;
          }}
          onCompositionEnd={() => {
            composing.current = false;
          }}
          placeholder={t("Capture a task or follow-up…")}
          maxLength={240}
          autoComplete="off"
        />
        <label className="sr-only" htmlFor="capture-project">
          {t("Capture project")}
        </label>
        <select
          id="capture-project"
          value={projectId}
          onChange={(event) => setProjectId(event.target.value)}
        >
          <option value="">{t("No project")}</option>
          {projects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.name}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="button button-primary"
          disabled={!value.trim()}
        >
          {t("Capture")}
          <Icon name="arrow" size={16} />
        </button>
      </form>
    </section>
  );
}
