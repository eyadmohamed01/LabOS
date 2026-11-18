---
title: Frontend workflow
---

# Frontend workflow

The frontend is a Next.js App Router project in `frontend/`. The language is TypeScript. React components live in `app/` and `components/`.

## Day-to-day loop

```bash
make dev
```

Edit files under `frontend/`. The dev server runs `next dev` with Webpack file polling so saves are picked up from the Docker bind mount. The browser refreshes changed pages.

The container command is:

```bash
npm run dev -- --hostname 0.0.0.0 --port 3000 --webpack
```

`--hostname 0.0.0.0` makes the server reachable through the published port. `--webpack` keeps the polling configuration in `next.config.ts` active. Hot reload stays on in development and is absent from the production image.

## Useful files

- `frontend/app/layout.tsx` wraps every page.
- `frontend/app/page.tsx` is the `/` route.
- `frontend/app/globals.css` is the global stylesheet.
- `frontend/lib/api.ts` resolves the API base URL.
- `frontend/next.config.ts` sets `output: "standalone"` for the production image and turns on dev-server polling.

## Dependencies

Add a package from the repository root with a one-off container so the lockfile on the host is updated:

```bash
docker compose -f docker-compose.dev.yml run --rm --no-deps frontend npm install <package>
```

Commit both `frontend/package.json` and `frontend/package-lock.json`. The next `make dev` rebuilds the image if the lockfile changed. If the `frontend_node_modules` volume still has the old install, remove it once:

```bash
docker volume rm labos-dev_frontend_node_modules
```

Then start `make dev` again.

## Production build

Do not run the dev server as the deployed app. `make build` produces a standalone Node server from `frontend/Dockerfile` and starts it behind Nginx. That image has `NODE_ENV=production` and does not run Webpack or React Refresh.
