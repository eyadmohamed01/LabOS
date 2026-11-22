---
title: How documentation is organized
---

# How documentation is organized

`docs/` is a Docusaurus site. Its pages live in `docs/pages/` and appear in the sidebar defined by `docs/sidebars.ts`.

| Category | Directory | What it answers |
| --- | --- | --- |
| Getting Started | `docs/pages/getting-started/` | How to install tools, configure `.env`, and start the stack |
| User stories | `docs/pages/user-stories/` | What a person should be able to do in the product |
| Developer Guide | `docs/pages/developer-guide/` | Where code goes and how the environments work |
| Contribution Guidelines | `docs/pages/contributing/` | Git, commits, and coding rules |
| Documentation Guide | `docs/pages/documentation/` | How to change this site |

`make build` writes the site to `docs/build/index.html`. Open that file directly. `make dev` does not rebuild it.

Edit `docs/pages/` when a teammate needs a new instruction, then run `make docs-build`.
