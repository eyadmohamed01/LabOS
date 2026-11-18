---
title: Troubleshooting
---

# Troubleshooting

## Docker daemon is not running

```text
Docker is installed, but the daemon is not running.
```

Start Docker Desktop and wait until the engine is ready. Then rerun the command. On Linux without Docker Desktop, start the `docker` service.

## Port already allocated

Compose fails if 3000, 8000, or 80 is taken.

```bash
docker ps
```

Stop the other LabOS stack (`make dev-down` or `make prod-down`) or the other process using that port. Production only needs port 80. Development needs 3000 and 8000. The documentation file does not use a port.

## Changes are not showing up

- Frontend: confirm the `make dev` terminal prints a compile after the save. The dev server polls about once a second.
- Backend: confirm Uvicorn prints a reload. Only files under `backend/app/` are watched.
- Production: source mounts are not used. Run `make prod` again after a code change.
- A new npm or pip dependency needs a rebuilt image. `make dev` builds, but a stale `labos-dev_frontend_node_modules` volume can hide a new package. Remove that volume and start again.

## Frontend stays on "Checking" or "Unavailable"

Open http://localhost:8000/api/health directly.

- If that fails, the backend container is down or still starting. Read the `make dev` log for a Python traceback.
- If it succeeds in the browser but the page does not, the page was opened from a host that CORS does not allow. Use `make dev-wifi` for another device, or add the origin to `BACKEND_CORS_ORIGINS` and restart.

## Another device cannot open the LAN URL

Follow [Wi-Fi and LAN testing](./wifi-testing.md). The usual causes are a firewall, a VPN, guest-network isolation, or a WSL virtual address instead of the Wi-Fi address.

## `make test` fails before tests run

The backend image failed to build. Run the same command and read the pip error. A missing system library in `backend/Dockerfile.dev` is the usual reason. Do not install the package only on the host. The test container would still miss it.

## Documentation file is missing or stale

Run `make docs-build`, then open `docs/build/index.html` again. `make dev` does not refresh that file.

## Reset the dev containers

```bash
make dev-down
docker compose -f docker-compose.dev.yml down --remove-orphans
```

Add `--volumes` only when you intend to drop the frontend `node_modules` volume:

```bash
docker compose -f docker-compose.dev.yml down --volumes --remove-orphans
```
