---
title: Development and production
---

# Development and production

The two environments are separate Compose files, separate Dockerfiles, and separate Make targets. You can read either file without mentally subtracting the other mode.

| | Development | Production |
| --- | --- | --- |
| Compose file | `docker-compose.dev.yml` | `docker-compose.prod.yml` |
| Start | `make dev` | `make prod` |
| How it runs | Foreground, logs in the terminal | Background (`-d`) |
| Stop | `Ctrl+C` or `make dev-down` | `make prod-down` |
| Logs | The `make dev` terminal, or `make dev-logs` | `make prod-logs` |
| Frontend | `next dev`, hot reload, Webpack polling | Standalone production server, no hot reload |
| Backend | Uvicorn `--reload` | Uvicorn without `--reload` |
| Proxy | None. Ports 3000 and 8000 are published | Nginx on port 80 |
| Restart policy | `no`, so a crash stays visible | `unless-stopped` |
| Image contents | Dev dependencies, source mounted from the host | Runtime dependencies and the built app |

Development mounts `./frontend` and `./backend` into the containers. Editing a file on the host changes what the process is running. Production copies the source in at build time. Editing a file after `make prod` does nothing until you build again.

`make build` downloads dependencies, starts this production stack, and also writes `docs/build/index.html`. `make prod` starts the same stack again without rebuilding the documentation.

Do not point production at the dev Compose file to "just try it". The dev file enables reloaders and publishes internal ports on purpose.
