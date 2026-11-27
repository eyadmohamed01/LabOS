"use client";

import { useRef, useState, type FormEvent } from "react";
import type { Person, TimelineItem } from "../../types/dashboard";
import { Dialog } from "./Dialog";
import { useLocale } from "./LocaleProvider";

type Kind = TimelineItem["kind"];
const kinds: { id: Kind; label: "Meeting" | "Deadline" | "Milestone" }[] = [
  { id: "meeting", label: "Meeting" },
  { id: "deadline", label: "Deadline" },
  { id: "milestone", label: "Milestone" },
];

/** Add / edit / delete one calendar event. A new event has id "" and the caller assigns it. */
export function EventDialog({
  event,
  defaultDate,
  people,
  projects,
  onSave,
  onDelete,
  onClose,
}: {
  event?: TimelineItem;
  defaultDate: string;
  people: Person[];
  projects: { id: string; name: string }[];
  onSave: (event: TimelineItem) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}) {
  const { t } = useLocale();
  const titleRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState(event?.title ?? "");
  const [kind, setKind] = useState<Kind>(event?.kind ?? "meeting");
  const [date, setDate] = useState(event?.date ?? defaultDate);
  const [allDay, setAllDay] = useState(event ? !event.time : false);
  const [time, setTime] = useState(event?.time ?? "09:00");
  const [endTime, setEndTime] = useState(event?.endTime ?? "10:00");
  const [location, setLocation] = useState(event?.location ?? "");
  const [projectId, setProjectId] = useState(event?.projectId ?? "");
  const [attendeeIds, setAttendeeIds] = useState<string[]>(event?.attendeeIds ?? []);
  const [description, setDescription] = useState(event?.description ?? "");
  const [confirmDelete, setConfirmDelete] = useState(false);

  const badRange = !allDay && !!endTime && endTime <= time;

  function toggleAttendee(id: string) {
    setAttendeeIds((previous) =>
      previous.includes(id) ? previous.filter((item) => item !== id) : [...previous, id],
    );
  }

  function submit(submitEvent: FormEvent) {
    submitEvent.preventDefault();
    if (!title.trim() || !date || badRange) return;
    onSave({
      id: event?.id ?? "",
      title: title.trim(),
      kind,
      date,
      time: allDay ? undefined : time,
      endTime: allDay || !endTime ? undefined : endTime,
      location: location.trim() || undefined,
      projectId: projectId || undefined,
      description: description.trim(),
      attendeeIds,
    });
  }

  return (
    <Dialog
      className="task-dialog"
      title={t(event ? "Edit event" : "Add event")}
      eyebrow={t("Event")}
      onClose={onClose}
      initialFocus={titleRef}
    >
      <form className="task-form" onSubmit={submit}>
        <label className="field field-wide">
          <span>{t("Title")}</span>
          <input
            ref={titleRef}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={240}
            required
            autoComplete="off"
          />
        </label>
        <label className="field">
          <span>{t("Type")}</span>
          <select value={kind} onChange={(e) => setKind(e.target.value as Kind)}>
            {kinds.map(({ id, label }) => (
              <option key={id} value={id}>
                {t(label)}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>{t("Date")}</span>
          <input type="date" value={date} required onChange={(e) => setDate(e.target.value)} />
        </label>
        <label className="field field-check field-wide">
          <input type="checkbox" checked={allDay} onChange={(e) => setAllDay(e.target.checked)} />
          <span>{t("All day")}</span>
        </label>
        {!allDay && (
          <>
            <label className="field">
              <span>{t("Start time")}</span>
              <input type="time" value={time} required onChange={(e) => setTime(e.target.value)} />
            </label>
            <label className="field">
              <span>{t("End time")}</span>
              <input
                type="time"
                value={endTime}
                aria-invalid={badRange}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </label>
            {badRange && (
              <p className="field-error field-wide" role="alert">
                {t("The end time must be after the start time.")}
              </p>
            )}
          </>
        )}
        <label className="field">
          <span>{t("Location")}</span>
          <input value={location} onChange={(e) => setLocation(e.target.value)} maxLength={160} />
        </label>
        <label className="field">
          <span>{t("Project")}</span>
          <select value={projectId} onChange={(e) => setProjectId(e.target.value)}>
            <option value="">{t("No project")}</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        </label>
        <label className="field field-wide">
          <span>{t("Description")}</span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            maxLength={2000}
          />
        </label>
        {people.length > 0 && (
          <fieldset className="field field-wide attendee-list">
            <legend>{t("Attendees")}</legend>
            {people.map((person) => (
              <label key={person.id}>
                <input
                  type="checkbox"
                  checked={attendeeIds.includes(person.id)}
                  onChange={() => toggleAttendee(person.id)}
                />
                {person.name}
              </label>
            ))}
          </fieldset>
        )}
        <div className="dialog-actions field-wide">
          {event ? (
            <button
              type="button"
              className="button button-danger"
              onClick={() => (confirmDelete ? onDelete(event.id) : setConfirmDelete(true))}
            >
              {t(confirmDelete ? "Confirm delete" : "Delete event")}
            </button>
          ) : (
            <span />
          )}
          <span className="dialog-actions-right">
            <button type="button" className="button" onClick={onClose}>
              {t("Cancel")}
            </button>
            <button
              type="submit"
              className="button button-primary"
              disabled={!title.trim() || !date || badRange}
            >
              {t(event ? "Save changes" : "Add event")}
            </button>
          </span>
        </div>
      </form>
    </Dialog>
  );
}
