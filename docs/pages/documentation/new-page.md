---
title: Create a page
---

# Create a page

1. Add a Markdown file under the category directory.

```text
docs/pages/developer-guide/logging.md
```

2. Start with a title:

```md
---
title: Logging
---

# Logging

Application logs appear in the `make dev` terminal.
```

3. Add the document id to `docs/sidebars.ts` inside the matching category. The id is the path under `docs/pages/` without `.md`.

```ts
{
  type: "category",
  label: "Developer Guide",
  items: [
    "developer-guide/project-structure",
    "developer-guide/logging",
  ],
}
```

4. Link it from a related page when a reader would not find it from the sidebar alone:

```md
See [Logging](./logging.md).
```

5. Run `make docs-build` and open `docs/build/index.html`. The new page should appear in the sidebar. This does not restart the LabOS application.

The file name is the URL segment. `developer-guide/logging.md` is served at `/developer-guide/logging`. Do not put spaces in the file name. Use hyphens.

Keep one topic on the page. A page that explains both Nginx and commit messages should be two pages.
