---
title: Verify the stack
---

# Verify the stack

Use this list after the first launch, and again after you change Docker or environment files.

## Development

1. Run `make dev`.
2. Open http://localhost:3000. The page title is LabOS, and the text says LabOS is running.
3. Wait until **Backend** status says **Running**.
4. Open http://localhost:8000/api/health. The JSON body is `{"status":"ok"}`.
5. Open http://localhost:8000/docs. The Swagger page lists `GET /api/health` and the `/api/auth` routes.
6. Change a word in `frontend/app/page.tsx` and save. The browser updates without a manual restart. The terminal shows a frontend rebuild.
7. Add a temporary log line in `backend/app/main.py` and save. Uvicorn reloads, and the terminal shows the process restarting. Remove the temporary line afterwards.
8. Press `Ctrl+C`. Confirm the shutdown message and that `docker ps` no longer lists `labos-dev` containers.

## Tests

In a second terminal, or after stopping the stack:

```bash
make test
```

The command builds the backend dev image if needed and runs pytest. The health tests and the auth tests should pass. The auth tests do not create a user in Supabase.

## Production shape

This check is optional during everyday feature work.

```bash
make build
```

Then open:

- http://localhost
- http://localhost/api/health
- http://localhost/docs

Stop it with `make prod-down`. Ports 3000 and 8000 are not published by the production stack. Traffic goes through Nginx on port 80.

## Documentation

Open `docs/build/index.html` after `make build`. If the file is missing, run `make docs-build` and open it again. No port is involved.
