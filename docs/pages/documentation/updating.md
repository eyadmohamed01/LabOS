---
title: Update a page
---

# Update a page

Edit the Markdown file directly. Run `make docs-build`, then open `docs/build/index.html` again.

When the steps you are changing also appear in the root `README.md`, update both. The README is the short path for someone who has not opened the site. The site is the longer guide. They should not disagree about commands, ports, or file locations.

If you rename a file:

1. Change the id in `docs/sidebars.ts`.
2. Update relative links from other pages.
3. Leave a sentence on a related page if people still search for the old name, or rely on the sidebar label.

If you delete a page, delete the sidebar id in the same commit. `onBrokenLinks` is `throw`, so a leftover id fails `make docs-build`.

Preview the edited page, not only the homepage. Follow the links you touched.
