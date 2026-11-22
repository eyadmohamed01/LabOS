---
title: Frontend and backend communication
---

# Frontend and backend communication

The browser talks to the frontend. The frontend calls the backend over HTTP JSON. There is no shared code package between the two apps.

## Development

`make dev` publishes the services separately:

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:8000`

`NEXT_PUBLIC_API_URL` defaults to `http://localhost:8000`. `frontend/lib/api.ts` uses that origin for API calls. If you open the frontend through a LAN address, the helper swaps the hostname so the browser calls the API on that same host and port 8000.

The backend allows browser origins listed in `BACKEND_CORS_ORIGINS`. A browser on `http://localhost:3000` can call `http://localhost:8000`. Add any new origin to that variable before you rely on it.

The current UI calls `GET /api/health` from `frontend/components/HealthStatus.tsx`. Login is not on a page yet. When a screen needs an account, call `/api/auth` with `resolveApiBaseUrl()` and send `Authorization: Bearer <access_token>` on later requests. The routes and the token rules are in [Authentication](./authentication.md).

## Production

Nginx is the only published entry point. The frontend is built with an empty `NEXT_PUBLIC_API_URL`, so the browser requests `/api/health` on the same host. Nginx forwards `/api/` to the backend container. The browser does not need the backend's internal port.

```text
Browser  →  Nginx :80  →  /        →  frontend:3000
                         →  /api/   →  backend:8000
                         →  /docs   →  backend:8000
```

## Adding a call

Prefer a relative path under `/api` and prefix it with `resolveApiBaseUrl()`. That keeps one code path working in both environments:

```ts
const response = await fetch(`${resolveApiBaseUrl()}/api/health`);
```

Define the JSON shape on the backend with a Pydantic model and mirror the fields you use in a TypeScript type under `frontend/types/` when more than one component reads them.
