# Frontend

Next.js application for LabOS, written in React and TypeScript.

The operational dashboard at `/` brings together Quick Capture, Attention, a grouped Timeline, and Active Projects. This change implements **Overview only**. Other sidebar sections are visibly disabled placeholders for future work; there are no additional screens or routes.

Run it from the repository root:

```bash
make dev
```

| Path          | Purpose                    |
| ------------- | -------------------------- |
| `app/`        | Routes and the root layout |
| `components/` | Reusable UI                |
| `hooks/`      | Shared React hooks         |
| `lib/`        | Helpers that are not UI    |
| `types/`      | Shared TypeScript types    |
| `public/`     | Static files               |

## Dashboard frontend

- `components/dashboard/` contains the workspace shell, reusable panels, search, native dialogs, and locale provider.
- `lib/dashboardData.ts` holds typed sample data, separate from rendering. Its reference date is **18 November 2026**, with schedule times in Berlin (CET).
- `types/dashboard.ts` defines the data contracts; `lib/dashboard.ts` contains date formatting and detail projections.
- Projects show phase, the next milestone, and live open/overdue task counts. Research progress is not represented as a percentage.
- `lib/dashboardInsights.ts` derives open, resolved, captured, and upcoming-deadline counts, plus priority and assignee distributions. Calendar warnings are separate from tasks. Resolved/captured counts describe this session; assignee charts count tasks and do not estimate capacity.
- `lib/search.ts` provides ranked multi-term search across titles, projects, people, labels, and descriptions. Every term must match. One-character queries match title word prefixes only. Longer words support one-edit typo tolerance, including adjacent transpositions. Search includes type/project/status filters, original-text highlighting, contextual matches, and arrow/Enter keyboard selection. The index includes session captures and resolved items.
- `app/globals.css` defines the warm light palette, graphite navigation, violet accent, and responsive breakpoints. No UI library, external fonts, or additional runtime dependencies are needed.
- The header theme toggle offers light/dark palettes and remembers `labos.theme` in browser storage. A small pre-hydration initializer applies the saved palette before paint; the toggle still works if storage is blocked. Theme changes synchronize across tabs on the same origin. The default is light, independent of the operating system setting.
- The layout is desktop first: a persistent sidebar and parallel Attention/Timeline columns. Narrow layouts stack these panels and use an accessible navigation drawer.
- `lib/i18n.ts` contains a typed English/German message catalog. The EN/DE control updates interface labels, document language, and `Intl.DateTimeFormat` output. It is a session-only frontend preference, ready for a future account setting. Research titles, descriptions, and user-authored text retain their original language.
- Core interaction motion uses CSS and the Web Animations API: spring-shaped feedback, coordinated panel entry, dialog entry/exit, capture confirmation, and FLIP list reflow in `hooks/useAnimatedList.ts`. These brief animations remain enabled independently of the system motion preference, as specified for this frontend.

Capture, task resolution/reopening, and Undo update React state only. Refreshing resets the workspace. Search covers the dashboard’s sample tasks, projects, and schedule entries. Item/project dialogs show their context without leaving Overview. There are no new API endpoints, calendar connections, document downloads, authentication flows, or persistent writes.

Keyboard support includes `N` to focus capture, `/` to open search, `Escape` to close dialogs/navigation, and a skip link. Shortcuts do not intercept text entry. Native dialogs contain focus; the mobile navigation contains focus and makes background content inert.

## Empty dashboard preview

In development (`npm run dev -- --webpack`), use **Development preview → Empty Dashboard** above Quick Capture, or open `http://localhost:3000/?dashboard=empty`. Choose **Populated Dashboard** to return. The control and query override are disabled in production.

The empty workspace supplies no projects or events to the sidebar, capture field, metrics, or search. It uses a generic professor identity. **Add a task** focuses the existing session-only capture field; captured tasks appear in Attention, metrics, and search. Project creation and calendar connection are visibly marked **Coming soon** and disabled. There are no integration calls or backend changes.

Both previews keep separate task/completion state while switching, so populated sample edits stay intact. Switching closes overlays and resets filter/draft UI; refreshing clears both sessions. Themes and EN/DE translations apply to both views. Zero-data charts are omitted from the first-use view.

## Local checks

From `frontend/`, with Node.js and the locked dependencies installed:

```bash
npm ci
npm run build
npx tsc --noEmit --incremental false
node --test tests/*.test.mjs
```

The repository currently has no lint script or ESLint configuration. For hot reload without Docker, use `npm run dev -- --webpack` and open the printed local URL. The existing Next.js configuration produces a standalone production build.

The dependency-free Node test runner uses native TypeScript stripping (Node 22.18+ or Node 24). Tests cover short-query precision, ranking, multi-term matching, typos, German normalization, combined filters, session records, metric boundaries, and meeting overlaps.

For a UI smoke test, check capture (including blank input), attention categories, resolution and Undo, search and its no-results state, and event/project detail dialogs. Check EN/DE labels, dates, and longer German strings on desktop. Verify keyboard focus and responsive overflow. Sample edits should reset on refresh.
