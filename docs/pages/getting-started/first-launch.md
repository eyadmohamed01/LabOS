---
title: First launch
---

# First launch

From the repository root:

```bash
make build
```

What that command does:

1. Downloads the frontend and backend dependencies into Docker images.
2. Starts the application in the background.
3. Downloads the documentation dependencies and writes `docs/build/index.html`.

Open the application at http://localhost. The health check is http://localhost/api/health. The API docs are http://localhost/docs.

Open the contributor documentation by opening `docs/build/index.html` in a browser. Do not start a separate documentation server and do not pick a port.

## Development after the first build

```bash
make dev
```

This starts the frontend on http://localhost:3000 and the backend on http://localhost:8000 with live reload. Logs stay in that terminal. It does not rebuild the documentation.

Stop it with `Ctrl+C`. The script prints `LabOS development environment has stopped.`

From another terminal:

```bash
make dev-down
```

Later `make dev` runs reuse the images. A change to `frontend/package.json`, `backend/requirements.txt`, or a Dockerfile still needs a rebuild, and `make dev` passes `--build`.

## Rebuild the documentation only

```bash
make docs-build
```

Then open `docs/build/index.html` again.
