---
title: Create a category
---

# Create a category

A category is a directory of pages plus an entry in `docs/sidebars.ts`.

1. Create the directory and at least one page.

```text
docs/pages/testing/backend.md
```

2. Add a category to the sidebar in `docs/sidebars.ts`:

```ts
{
  type: "category",
  label: "Testing",
  items: ["testing/backend"],
},
```

Place the object where you want it in the sidebar. `collapsed` defaults to closed. Set `collapsed: false` only for a category that should be open on first load. Getting Started is the one category that stays open.

3. Give the first page a `title` in front matter so the sidebar label is readable even before the heading is parsed.

4. Run `make docs-build` and open `docs/build/index.html`. Confirm the category renders and its links resolve. Docusaurus fails the build on a sidebar id that does not match a file.

Do not create a category for a single short note. Add that note to an existing page, or add one page to an existing category.

Remove a category by deleting its sidebar entry and its directory in the same change, then check that no page still links to it.
