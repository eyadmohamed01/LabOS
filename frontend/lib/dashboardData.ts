import type {
  AttentionItem,
  Person,
  Project,
  TimelineItem,
} from "../types/dashboard";

// Keep the example workspace consistent across environments until an API adapter replaces it.
export const workspaceDate = "2026-11-18";
export const workspaceName = "LabOS workspace";
export const workspaceShortName = "Research group";
export const currentUserId = "elena";

export const people: Person[] = [
  {
    id: "elena",
    name: "Elena Park",
    initials: "EP",
    role: "Principal investigator",
    tone: "violet",
  },
  {
    id: "james",
    name: "James Wilson",
    initials: "JW",
    role: "Postdoctoral researcher",
    tone: "sage",
  },
  {
    id: "amira",
    name: "Amira Hassan",
    initials: "AH",
    role: "PhD researcher",
    tone: "amber",
  },
  {
    id: "leo",
    name: "Leo Fischer",
    initials: "LF",
    role: "PhD researcher",
    tone: "blue",
  },
  {
    id: "sofia",
    name: "Sofia Chen",
    initials: "SC",
    role: "Research assistant",
    tone: "sage",
  },
];

export const projects: Project[] = [
  {
    id: "atlas",
    code: "AT",
    name: "Project Atlas",
    discipline: "Human–AI interaction",
    tone: "violet",
    description:
      "Understanding how researchers build trust in AI-assisted decision making. The team is preparing a second round of participant studies.",
    status: "On track",
    phase: "Study preparation",
    nextMilestone: "Second study protocol approved",
    dueDate: "2026-12-15",
    memberIds: ["elena", "amira", "leo"],
  },
  {
    id: "fieldnotes",
    code: "FN",
    name: "Fieldnotes",
    discipline: "Participatory research",
    tone: "sage",
    description:
      "A field study of collaborative tools in community research. Recruitment is underway; ethics approval is needed before the first interviews.",
    status: "Needs attention",
    phase: "Ethics review",
    nextMilestone: "Participant interviews begin",
    dueDate: "2026-12-08",
    memberIds: ["james", "sofia", "elena"],
  },
  {
    id: "openlab",
    code: "OL",
    name: "Open Lab Initiative",
    discipline: "Open science",
    tone: "blue",
    description:
      "Making the lab’s methods, datasets, and findings easier to share. The next milestone is an accessible, documented data release.",
    status: "On track",
    phase: "Release preparation",
    nextMilestone: "Documented dataset release",
    dueDate: "2026-11-30",
    memberIds: ["leo", "sofia", "james"],
  },
];

export const attentionItems: AttentionItem[] = [
  {
    id: "ethics",
    priority: "high",
    title: "Review ethics application",
    kind: "overdue",
    label: "2 days overdue",
    description:
      "Review the participant information sheet and consent procedure before James submits the application to the university ethics committee. Participant recruitment is waiting on this review.",
    projectId: "fieldnotes",
    assigneeId: "elena",
    dueDate: "2026-11-16",
  },
  {
    id: "feedback",
    priority: "high",
    title: "Send feedback on study protocol",
    kind: "overdue",
    label: "1 day overdue",
    description:
      "Amira has shared the revised study protocol. Review the interview prompts and confirm whether the pilot can proceed next week.",
    projectId: "atlas",
    assigneeId: "elena",
    dueDate: "2026-11-17",
  },
  {
    id: "budget",
    priority: "normal",
    title: "Follow up on equipment budget",
    kind: "follow-up",
    label: "Waiting since 13 Nov",
    description:
      "The department administrator is reviewing the equipment request. Follow up on approval for the recording kits before the next round of fieldwork.",
    projectId: "fieldnotes",
    assigneeId: "james",
    dueDate: "2026-11-18",
  },
  {
    id: "dataset",
    priority: "normal",
    title: "Confirm dataset access with Leo",
    kind: "follow-up",
    label: "Follow up today",
    description:
      "Confirm that Leo can access the anonymized dataset and that the data dictionary includes the updated variable definitions.",
    projectId: "openlab",
    assigneeId: "elena",
    dueDate: "2026-11-18",
  },
  {
    id: "conflict",
    priority: "high",
    title: "Two meetings overlap tomorrow",
    kind: "calendar",
    label: "Calendar conflict",
    description:
      "The department seminar (14:00–15:00) overlaps with the Atlas partner call (14:30–15:15) on Thursday, 19 November. Decide which meeting to move before confirming attendance.",
    projectId: "atlas",
    assigneeId: "elena",
    dueDate: "2026-11-19",
  },
];

export const timelineItems: TimelineItem[] = [
  {
    id: "standup",
    title: "Weekly lab meeting",
    kind: "meeting",
    date: "2026-11-18",
    time: "10:00",
    endTime: "11:00",
    location: "Room 3.12",
    description:
      "Research updates, this week’s priorities, and an open discussion of blockers. Amira will share findings from the Atlas pilot.",
    attendeeIds: ["elena", "james", "amira", "leo", "sofia"],
  },
  {
    id: "supervision",
    title: "Supervision · Amira Hassan",
    kind: "meeting",
    date: "2026-11-18",
    time: "14:00",
    endTime: "14:45",
    location: "Office 2.08",
    projectId: "atlas",
    description:
      "Discuss the pilot analysis, refine the research questions, and agree on the next chapter outline.",
    attendeeIds: ["elena", "amira"],
  },
  {
    id: "abstract",
    title: "Internal abstract review",
    kind: "deadline",
    date: "2026-11-18",
    time: "17:00",
    projectId: "atlas",
    description:
      "Share the revised abstract with the lab for a final internal review before submission.",
    attendeeIds: ["elena", "amira"],
  },
  {
    id: "seminar",
    title: "Department research seminar",
    kind: "meeting",
    date: "2026-11-19",
    time: "14:00",
    endTime: "15:00",
    location: "Lecture Hall B",
    description:
      "A department conversation on responsible AI in research practice. This event overlaps with the Atlas partner call.",
    attendeeIds: ["elena", "james"],
  },
  {
    id: "partner",
    title: "Atlas · partner check-in",
    kind: "meeting",
    date: "2026-11-19",
    time: "14:30",
    endTime: "15:15",
    location: "Online",
    projectId: "atlas",
    description:
      "Align on the second study and review partner recruitment. This call overlaps with the department seminar.",
    attendeeIds: ["elena", "leo"],
  },
  {
    id: "recruitment",
    title: "Participant recruitment closes",
    kind: "deadline",
    date: "2026-11-23",
    projectId: "fieldnotes",
    description:
      "Finalize the participant list and send interview invitations once ethics approval is confirmed.",
    attendeeIds: ["james", "sofia"],
  },
  {
    id: "release",
    title: "Open dataset · first release",
    kind: "milestone",
    date: "2026-11-30",
    projectId: "openlab",
    description:
      "Publish the anonymized dataset with documentation after the team’s privacy and accessibility review.",
    attendeeIds: ["leo", "sofia", "james"],
  },
];
