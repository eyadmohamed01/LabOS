---
title: Make commands
---

# Make commands

Run these from the repository root. `make` and `make help` print the same list.

## Application

| Command | What it does |
| --- | --- |
| `make dev` | Start frontend and backend in the foreground with live reload. Logs stay in this terminal. |
| `make dev-wifi` | Same as `make dev`, then print LAN URLs and allow another device on the network to open them. |
| `make dev-down` | Stop the development containers. |
| `make dev-logs` | Follow logs for a development stack that is already running. |
| `make build` | Download dependencies, start the application, and write `docs/build/index.html`. |
| `make prod` | Build if needed and start the production stack in the background. |
| `make prod-down` | Stop the production stack. |
| `make prod-logs` | Follow frontend, backend, and Nginx logs. |
| `make test` | Run backend pytest in a one-off container. |
| `make help` | Print the command list. |

`make dev` is the command for feature work. It does not rebuild the documentation.

## Documentation

| Command | What it does |
| --- | --- |
| `make docs-build` | Rebuild `docs/build/index.html`. |
| `make docs-help` | Print the documentation commands. |

`make build` already creates that file. Open it directly in a browser. `make docs-build` is the command to run after the documentation source changes. Open the same file again. There is no documentation port.

Details for the docs commands are in [Preview and build](../documentation/preview-and-build.md).

## Examples

Start work:

```bash
make dev
```

Run tests while the stack is up, from a second terminal:

```bash
make test
```

Inspect a production run:

```bash
make prod
make prod-logs
make prod-down
```
