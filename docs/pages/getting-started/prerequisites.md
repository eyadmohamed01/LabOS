---
title: Prerequisites
slug: /
---

# Prerequisites

Install these tools before the first launch. You do not need Node.js or Python on the host. Docker builds both.

## Required

- **Git**, to clone the repository and publish branches.
- **Docker Desktop** or Docker Engine with the Compose plugin. The command `docker compose version` must succeed.
- **Make**. It is preinstalled on macOS and most Linux distributions. On Windows, use WSL and run the commands from the Linux shell.

Check the tools:

```bash
git --version
docker version
docker compose version
make --version
```

Start Docker Desktop and wait until it reports that the engine is running. If `docker info` cannot reach the daemon, the LabOS commands will stop with that error.

## Ports

Development uses:

| Port | Process |
| --- | --- |
| 3000 | Frontend |
| 8000 | Backend |

Production uses port **80** for Nginx. The documentation is a file in `docs/build/` and does not use a port.

Close anything else already bound to those ports, or stop it before `make dev`.