# Backend

Python API for LabOS, built with FastAPI.

The API exposes `GET /api/health` and Supabase Auth endpoints. Interactive docs are at `/docs`. These routes do not replace the REST API with the Supabase Data API.

| Method | Path | Who can call it |
| --- | --- | --- |
| `POST` | `/api/auth/register` | Public. Returns a session, or `confirmation_required` when email confirmation is on. |
| `POST` | `/api/auth/login` | Public. Returns the access token, refresh token, and expiry. |
| `POST` | `/api/auth/refresh` | Public. Exchanges a refresh token for a new session. Store the new refresh token; the previous one is spent. |
| `POST` | `/api/auth/logout` | Bearer access token. Revokes that session. |
| `GET` | `/api/auth/session` | Bearer access token. Returns the user id from the verified token. |

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
