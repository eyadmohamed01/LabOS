# LabOS

LabOS is a monorepo starter for a research-group web application. This repository contains the development environment, the production-shaped stack, and the contributor documentation. It does not contain product features yet.

The frontend is Next.js, React, and TypeScript. The backend is Python and FastAPI. PostgreSQL access is prepared with SQLAlchemy, and Supabase is reserved in the environment file for later. Development and production both run through Docker Compose.

## Prerequisites

Install:

- Git
- Docker Desktop, or Docker Engine with the Compose plugin
- Make (use WSL on Windows)

Check them:

```bash
git --version
docker version
docker compose version
make --version
```

Start Docker and wait until `docker info` works.

You do not need a host install of Node.js or Python. The images install those dependencies.

Development uses ports **3000** (frontend) and **8000** (backend). Production uses port **80**. The documentation is the file `docs/build/index.html` and does not use a port.

## Initial setup

```bash
git clone git@github.com:eyadmohamed01/LabOS.git
cd LabOS
cp .env.example .env
```

`make dev` copies `.env.example` to `.env` when the file is missing, so the copy step is optional.

`.env` is local and ignored by Git. Change shared defaults in `.env.example` and commit that file.

## Environment variables

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_API_URL` | API origin for the dev frontend. Default `http://localhost:8000`. |
| `BACKEND_CORS_ORIGINS` | Comma-separated browser origins allowed to call the API. |
| `APP_ENV` | `development` or `production`. Compose sets this in the containers. |
| `DATABASE_URL` | Optional PostgreSQL URL. The starter does not connect on startup. |
| `SUPABASE_URL` | Optional. Not used yet. |
| `SUPABASE_ANON_KEY` | Optional. Not used yet. |

## Start development

```bash
make dev
```

This builds the dev images on first run, starts the frontend and the backend, and follows their logs in the same terminal. Hot reload is on. Frontend saves are picked up by the Next.js dev server. Backend saves under `backend/app/` restart Uvicorn.

Open:

- Frontend: http://localhost:3000
- Backend: http://localhost:8000
- API docs: http://localhost:8000/docs
- Health: http://localhost:8000/api/health

The home page reports the backend status. **Running** means the browser reached `GET /api/health`.

`make dev` does not start Nginx and does not rebuild the documentation file.

## Start development for another device

```bash
make dev-wifi
```

This is the same dev stack, including hot reload, live logs, and `Ctrl+C` shutdown. It also prints LAN URLs:

```text
Frontend:
  http://localhost:3000
  http://192.168.x.x:3000
Backend:
  http://localhost:8000
  http://192.168.x.x:8000
```

Open the `192.168.x.x` frontend URL on a phone, tablet, or another computer on the same Wi-Fi. The command does not rewrite `.env`.

If no address is detected, read the IPv4 address of the Wi-Fi adapter (`ipconfig` on Windows, `ipconfig getifaddr en0` on macOS, `ip -4 addr` on Linux) and open `http://<that-address>:3000`.

Under WSL, an address in `172.16.0.0/12` is often the virtual adapter. Use the Wi-Fi address shown by Windows instead.

If the device cannot connect:

- Allow inbound TCP 3000 and 8000. On Windows, allow Docker Desktop on private networks.
- Use the same Wi-Fi. Guest networks and client isolation block device-to-device traffic.
- Disconnect from a VPN and try again.
- Campus networks sometimes isolate clients. A phone hotspot is a useful comparison.

## Stop development

Press `Ctrl+C` in the `make dev` terminal.

The script announces the shutdown, waits up to 30 seconds for the containers to exit, removes orphaned containers, and prints:

```text
LabOS development environment has stopped.
```

From another terminal:

```bash
make dev-down
```

## Logs

`make dev` and `make dev-wifi` already stream frontend, backend, and Docker startup logs.

To follow a stack that is already running, from a second terminal:

```bash
make dev-logs
```

## Tests

```bash
make test
```

Pytest runs in a one-off backend container. The dev stack does not have to be up.

## Production

```bash
make build
```

`make build` downloads dependencies, starts this stack in the background, and writes the documentation file. `make prod` starts the same stack again without rebuilding the documentation.

Nginx is the only published port:

- App: http://localhost
- Health: http://localhost/api/health
- API docs: http://localhost/docs

The production frontend is a Next.js standalone build. The backend runs without the reloader. Ports 3000 and 8000 are not published.

Follow logs, including Nginx access and error logs:

```bash
make prod-logs
```

Stop the stack:

```bash
make prod-down
```

## First build

```bash
make build
```

This downloads the application and documentation dependencies, starts the application in the background, and writes the documentation file.

- Application: http://localhost
- Health: http://localhost/api/health
- API docs: http://localhost/docs
- Contributor documentation: open `docs/build/index.html`

The documentation file does not need a server or a port. Open it again later from the same path.

After editing `docs/pages/`, rebuild only the documentation and open the same file:

```bash
make docs-build
```

## Makefile

```text
make dev          Start the development environment with live reload and logs
make dev-wifi     Start development and print URLs for other devices on the LAN
make dev-down     Stop the development environment
make dev-logs     Follow development logs
make build        Download dependencies, start the app, and write docs/build/index.html
make prod         Start the production environment in the background
make prod-down    Stop the production environment
make prod-logs    Follow production logs
make test         Run backend tests
make help         Show this list

make docs-build   Rebuild the documentation file docs/build/index.html
make docs-help    Show documentation commands
```

## Directory structure

```text
frontend/          Next.js, React, TypeScript
  app/             Routes and the root layout
  components/      Reusable UI
  hooks/           Shared React hooks
  lib/             Helpers that are not UI
  types/           Shared TypeScript types
  public/          Static files
backend/           FastAPI
  app/api/         HTTP routers
  app/core/        Settings and shared infrastructure
  app/models/      SQLAlchemy models
  app/schemas/     Request and response models
  app/services/    Logic that should stay out of route functions
  tests/           Pytest
docs/              Documentation site
  pages/           Documentation pages
  build/           Generated file, open index.html in a browser
infra/nginx/       Production reverse proxy
scripts/           Startup scripts used by Make
```

Add new application code inside `frontend/` and `backend/`. Do not create feature directories such as `calendar/` or `chatbot/` until there is code to put in the existing trees. The health route (`backend/app/api/health.py` and `frontend/components/HealthStatus.tsx`) is the pattern for a minimal endpoint, not a product screen.

## Troubleshooting

**Docker is not running.** Start Docker Desktop, then rerun the command.

**Port already allocated.** Stop the other stack with `make dev-down` or `make prod-down`, or free ports 3000, 8000, or 80.

**A frontend edit does not appear.** Watch the `make dev` terminal for a compile. Polling runs about once a second. A new npm package can be hidden by the `labos-dev_frontend_node_modules` volume. Remove that volume and start `make dev` again.

**A backend edit does not reload.** Uvicorn watches `backend/app/` only. Confirm a traceback is not keeping the process down.

**The home page stays on Unavailable.** Open http://localhost:8000/api/health. If that fails, read the backend log. If it succeeds from another device but the page does not, start with `make dev-wifi` so CORS allows the LAN origin.

**Production did not pick up a code change.** Production does not mount the source tree. Run `make prod` again.

**Reset dev containers.**

```bash
make dev-down
docker compose -f docker-compose.dev.yml down --remove-orphans
```

Add `--volumes` only when you also want to delete the frontend dependency volume.

More detail is in `docs/build/index.html`, under the Developer Guide. Run `make docs-build` first if that file is not there yet.
