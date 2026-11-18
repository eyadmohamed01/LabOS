# Backend

Python API for LabOS, built with FastAPI.

The starter exposes `GET /api/health` and the generated API docs at `/docs`. It does not contain product features.

Run it through the repository root:

```bash
make dev
make test
```

| Path | Purpose |
| --- | --- |
| `app/api/` | HTTP routers |
| `app/core/` | Settings and shared infrastructure |
| `app/models/` | SQLAlchemy models |
| `app/schemas/` | Request and response models |
| `app/services/` | Logic that should not live in route functions |
| `tests/` | Automated tests |
