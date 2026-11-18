---
title: Documentation contributions
---

# Documentation contributions

Write the page you needed when you first ran the project. A new teammate should be able to follow it without asking someone to translate a command.

## Expectations

- Put contributor instructions in `docs/pages/` and register the page in `docs/sidebars.ts`.
- Use the commands as they exist: `make build`, `make dev`, `make dev-wifi`, `make test`, `make docs-build`. Do not document a shortcut that the repository does not provide.
- Include a working example for a command, a path, or a commit message when the rule would otherwise be abstract.
- Update the root `README.md` when the quick-start steps change.
- Run `make docs-build` and open `docs/build/index.html` before you open the pull request. A broken sidebar id fails the build.

## Style

- Address the reader as the person doing the step.
- Name the file, the command, and the URL.
- Keep product names as they are in the repository: frontend, backend, Nginx, Docusaurus, Supabase.
- Do not describe features that are not in the tree. If a calendar or chatbot page does not exist, do not document its workflow.

## Review

A documentation pull request uses the same Git workflow as code. The reviewer checks that the commands match the Makefile and that links between pages resolve.

```bash
git checkout -b docs-12-wifi-firewall-notes
git add docs/pages/developer-guide/wifi-testing.md README.md
git commit -m "docs: document firewall checks for lan testing"
```
