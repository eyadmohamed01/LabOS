---
title: Adding dependencies
---

# Adding dependencies

Add a dependency when the team would otherwise maintain something the library already does well. A few lines of code do not need a package.

## Frontend

Runtime packages belong in `dependencies`. Types and test tools belong in `devDependencies`.

```bash
docker compose -f docker-compose.dev.yml run --rm --no-deps frontend npm install example-package
```

Commit `frontend/package.json` and `frontend/package-lock.json`.

## Backend

Runtime packages go in `backend/requirements.txt`. Packages used only by pytest go in `backend/requirements-dev.txt`, which already includes the runtime file.

The production image installs `requirements.txt` only. A test package listed there would ship in production. Keep pytest in the dev file.

## Documentation site

Dependencies of Docusaurus stay in `docs/package.json`. Do not add them to the frontend. The documentation container is separate.

## Pull request note

Say why the package is needed, which environment installs it, and how you confirmed the lockfile or requirements file is updated. Prefer a maintained release. Pin a major or minor range the way the existing files do, and commit the lockfile for Node projects.

## After it is merged

`make dev` rebuilds when the dependency file changes. If a frontend package is missing inside the container, the named volume is stale. Remove `labos-dev_frontend_node_modules` and start again. The same applies to `labos-docs_docs_node_modules` after a documentation dependency change.
