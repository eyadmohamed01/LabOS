---
title: Docker and Compose
---

# Docker and Compose

Docker runs the frontend and the backend in separate containers. You do not start `npm` and Uvicorn yourself.

## Files

| File | What it starts |
| --- | --- |
| `docker-compose.dev.yml` | Frontend dev server and backend with reload |
| `docker-compose.prod.yml` | Frontend, backend, and Nginx |
| `docker-compose.docs.yml` | Builds the documentation file. Does not publish a port. |
| `frontend/Dockerfile.dev` | Node image used by development |
| `frontend/Dockerfile` | Multi-stage production build |
| `backend/Dockerfile.dev` | Python image with test dependencies and reload |
| `backend/Dockerfile` | Python runtime image |
| `docs/Dockerfile.dev` | Node image for the documentation site |

Each Compose file sets `name:`, so the projects are `labos-dev`, `labos-prod`, and `labos-docs`. Stopping one does not stop the others.

## Why volumes exist in development

The frontend source is bind-mounted at `/app`. A named volume keeps `/app/node_modules` from being hidden by that mount, because the host directory does not contain `node_modules`.

The backend source is bind-mounted at `/app`. Python packages stay in the image, outside `/app`, so a volume for site-packages is unnecessary.

The documentation site uses the same node_modules volume pattern.

## Signals and shutdown

Every service sets `init: true` so zombie processes are reaped and stop signals reach the server. `stop_grace_period: 30s` matches the `docker compose down --timeout 30` used by the Make targets. `Ctrl+C` during `make dev` runs `scripts/dev.sh`, which asks Compose to stop the project and remove orphaned containers.

Containers are not killed with `docker kill` as the normal path. Compose sends a stop signal and waits.

## Rebuild

`make dev`, `make build`, and `make prod` use `--build`. Change a Dockerfile or a dependency file and the next start picks it up. An ordinary source edit does not need a rebuild in development because the source is mounted.
