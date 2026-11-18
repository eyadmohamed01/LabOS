---
title: Pull requests
---

# Pull requests

Open a pull request into `main` when the branch is ready for someone else to read. A small request is easier to review than a branch that mixes an unrelated cleanup with the change.

## Before you open it

- The branch builds with the command that matches the change: `make dev` for application work, `make test` when the backend changed, `make docs-build` when the documentation changed.
- `.env` is not part of the diff.
- New environment variables are in `.env.example` and in the docs.
- The pull request description says what changed, why, and how to test it.

## Description template

```markdown
## Summary
- Show the backend status on the starter page.

## How to test
- [ ] `make dev`
- [ ] Open http://localhost:3000 and confirm the status becomes Running
- [ ] `make test`
```

Add a screenshot when the visual layout changed.

## Size

Include the code, the test, and the doc update that belong to the same change. Leave drive-by formatting of unrelated files for another branch.

## After review

Push more commits to the same branch. Do not open a second pull request to address comments unless the reviewer asks you to split the work.
