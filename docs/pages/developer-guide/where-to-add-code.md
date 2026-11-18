---
title: Where to add code
---

# Where to add code

Use the existing trees. A new screen and its API do not need a new top-level folder.

## A new page

Create a route under `frontend/app/`. For a page at `/labs`:

```text
frontend/app/labs/page.tsx
```

Put pieces that are only used by that page next to it, or in `frontend/components/` when another route needs them.

## A shared UI piece

Add `frontend/components/LabList.tsx`. Keep data loading in the route or in a hook under `frontend/hooks/` when more than one component needs it.

## A call to the API

Add a small function in `frontend/lib/` that uses `resolveApiBaseUrl()` from `frontend/lib/api.ts`. That helper already switches between the development API origin and the same-origin `/api` path used in production.

## A new endpoint

1. Add a Pydantic schema in `backend/app/schemas/` if the payload is not trivial.
2. Add the router in `backend/app/api/`.
3. Register it in `backend/app/api/router.py`.
4. Put database or external calls in `backend/app/services/` once the handler would otherwise contain that logic.
5. Add a test in `backend/tests/`.

The health route is the pattern to copy: schema in `schemas/health.py`, route in `api/health.py`, registration in `api/router.py`, test in `tests/test_health.py`.

## A new table

Add a SQLAlchemy model in `backend/app/models/` using `Base` from `models/base.py`. Do not connect at import time. `core/database.py` creates an engine only when a caller asks for one, and only when `DATABASE_URL` is set.

## Configuration

Add the variable to `.env.example`, to `backend/app/core/config.py` if the backend reads it, and to the relevant Compose service `environment` block if the container must receive it. Document it in [Environment configuration](../getting-started/environment.md).

## Documentation for the change

Update `docs/pages/` when contributors need new instructions.
