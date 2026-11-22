---
title: Backend workflow
---

# Backend workflow

The backend is a FastAPI application in `backend/`. Uvicorn serves `app.main:app` on port 8000.

## Day-to-day loop

```bash
make dev
```

The development image starts Uvicorn with `--reload --reload-dir app`. Saving a file under `backend/app/` restarts the worker. The reload log appears in the `make dev` terminal.

Routes are mounted under `/api` in `app/main.py`. A handler declared as `@router.get("/health")` is available at `/api/health`.

## Layout

Keep the HTTP function small. Read and validate input with a schema, call a service when there is real work to do, and return a schema. Settings come from `app/core/config.py`, which reads environment variables.

`app/core/database.py` is the place to create a SQLAlchemy engine. Nothing calls it during startup, so the API runs without PostgreSQL.

Sign-in, sessions, and protecting a route are described in [Authentication](./authentication.md). Auth calls Supabase Auth and leaves LabOS data on this API.

## Tests

```bash
make test
```

Pytest uses `backend/tests` and the development image, which installs `requirements-dev.txt`. The application stack does not need to be running. Add a test next to `tests/test_health.py` for every endpoint you add.

Run a single file when you are iterating:

```bash
docker compose -f docker-compose.dev.yml run --rm --no-deps backend pytest tests/test_health.py
```

## API docs

FastAPI publishes Swagger UI at `/docs`, ReDoc at `/redoc`, and the schema at `/openapi.json`. In development those URLs are on port 8000. In production Nginx exposes `/docs` and `/openapi.json` on port 80.

## Dependencies

Add runtime packages to `backend/requirements.txt`. Add test-only packages to `backend/requirements-dev.txt`. `make dev` rebuilds the image when those files change.
