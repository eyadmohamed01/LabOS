---
title: Git workflow
---

# Git workflow

`main` is the branch other people start from. Keep it runnable. Do feature work on a short-lived branch and open a pull request.

## Start a branch

```bash
git checkout main
git pull
git checkout -b feat-1-login-page
```

Name the branch `Type-IssueNumber-IssueName`. The type is the same set used for commits (`feat`, `fix`, `docs`, and the others on the [commit messages](./commit-messages.md) page). The issue number is the tracker id. The issue name is a short lowercase slug.

```text
feat-1-login-page
feat-2-dashboard
fix-3-incorrect-icon-placement
```

Use hyphens between the three parts and inside the issue name. Do not use slashes. The branch name describes the issue, not the person working on it.

## Save work

```bash
git status
git add frontend/app/page.tsx
git commit -m "feat: add backend status on the home page"
git push -u origin HEAD
```

Commit the files you mean to publish. Do not commit `.env`, `node_modules`, `.next`, or `docs/build`.

## Update a branch

Prefer merge from `main` when you need newer commits:

```bash
git checkout main
git pull
git checkout feat-1-login-page
git merge main
```

Push the result and open the pull request against `main`.

## After the pull request is merged

```bash
git checkout main
git pull
git branch -d feat-1-login-page
```

Delete the remote branch from the pull request page once it is merged.
