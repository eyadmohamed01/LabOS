---
title: Authentication
---

# Authentication

LabOS accounts are email and password accounts in Supabase Auth. The FastAPI app exposes them at `/api/auth`. The browser does not have login screens yet. Call these routes from a future page, from Swagger, or with `curl`. The behavior those screens must show is in [Account access](../user-stories/account-access.md).

Supabase is the account server. LabOS data stays on the FastAPI routes. Do not send LabOS records through the Supabase Data API (`/rest/v1`).

## Configuration

Set these in `.env` at the repository root. Names and empty examples are in `.env.example`. See [Environment configuration](../getting-started/environment.md).

```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

Compose passes both values into the backend container. The frontend image does not receive them. Keep the publishable key out of any `NEXT_PUBLIC_` variable. Do not commit a secret key or a service-role key, and do not add either one to `.env`.

The API still starts when the values are empty. `GET /api/health` keeps working. Auth routes then return `503` with `Supabase auth is not configured`.

After changing `.env`, stop the stack and start it again. A running container keeps the environment it was given at startup.

In the Supabase dashboard, **Confirm email** changes registration:

- When confirmation is on, `POST /api/auth/register` creates the user and returns `confirmation_required: true` with `session: null`. Login answers `Invalid login credentials` until that address is confirmed.
- When confirmation is off, registration returns a session immediately.

## Where the code lives

| Path | What it does |
| --- | --- |
| `backend/app/api/auth.py` | Register, login, refresh, logout, and session routes. |
| `backend/app/api/deps.py` | `get_current_user`, for any route that needs a signed-in user. |
| `backend/app/core/jwt.py` | Checks the access-token signature against the project public keys. |
| `backend/app/services/supabase_auth.py` | Calls Supabase Auth. It does not read or write LabOS tables. |
| `backend/app/schemas/auth.py` | Request and response bodies. |
| `backend/tests/test_auth.py` | Route and token tests. They do not create a user in the hosted project. |

## Register

`POST /api/auth/register`

```bash
curl -s -X POST http://localhost:8000/api/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"email":"ada@university.edu","password":"a-long-password"}'
```

In production the same path is `http://localhost/api/auth/register`, through Nginx.

The password must be at least 6 characters. A shorter one is rejected with `422` before Supabase is called. Supabase can still reject a longer password when the project rules are stricter. The response `detail` is the message Supabase returned.

When confirmation is off, the body contains a session:

```json
{
  "user": { "id": "user-uuid", "email": "ada@university.edu" },
  "session": {
    "access_token": "<jwt>",
    "refresh_token": "<refresh>",
    "token_type": "bearer",
    "expires_in": 3600,
    "expires_at": 1700000000,
    "user": { "id": "user-uuid", "email": "ada@university.edu" }
  },
  "confirmation_required": false
}
```

When confirmation is on, `session` is `null` and `confirmation_required` is `true`. The user object still has `id` and `email`.

## Log in

`POST /api/auth/login`

```bash
curl -s -X POST http://localhost:8000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"ada@university.edu","password":"a-long-password"}'
```

A successful body is the session object above: `access_token`, `refresh_token`, `token_type`, `expires_in`, `expires_at`, and `user`. Store the access token and the refresh token in the client. LabOS does not keep a second copy of the session.

A wrong password, an unknown address, and an unconfirmed address all return `400` and `Invalid login credentials`.

## Keep a session

The access token is a JWT. It expires at `expires_at` (a UNIX timestamp). `expires_in` is the same lifetime in seconds.

Send it on later requests:

```http
Authorization: Bearer <access_token>
```

When a protected route returns `401` and `Access token expired`, exchange the refresh token:

```bash
curl -s -X POST http://localhost:8000/api/auth/refresh \
  -H 'Content-Type: application/json' \
  -d '{"refresh_token":"<refresh>"}'
```

The response is a new session. Replace both stored tokens. Supabase accepts a refresh token once, so the previous refresh token cannot be sent again.

A client can refresh shortly before `expires_at`, or after the `401` above, and then retry the original request with the new access token.

## Read the current user

`GET /api/auth/session`

```bash
curl -s http://localhost:8000/api/auth/session \
  -H 'Authorization: Bearer <access_token>'
```

```json
{
  "user_id": "user-uuid",
  "email": "ada@university.edu",
  "role": "authenticated",
  "expires_at": 1700000000
}
```

The values come from the verified token. This route does not load a database row.

## Log out

`POST /api/auth/logout` with the same `Authorization` header. A successful response is `204` and an empty body.

```bash
curl -s -o /dev/null -w '%{http_code}\n' \
  -X POST http://localhost:8000/api/auth/logout \
  -H 'Authorization: Bearer <access_token>'
```

That revokes the refresh token for this session. Sessions on other devices stay signed in. Discard both tokens in the client after the call.

The access token can still pass the signature check until `expires_at`. A refresh after logout fails, so the client cannot mint a new one.

If the access token is already expired, refresh once and then log out. A refresh that fails means the session is already gone.

## Protect an endpoint

Add `get_current_user` to the route. Register the router in `backend/app/api/router.py` the same way as the health route.

```python
from fastapi import APIRouter, Depends

from app.api.deps import AuthenticatedUser, get_current_user

router = APIRouter()


@router.get("/labs")
def list_labs(user: AuthenticatedUser = Depends(get_current_user)) -> dict[str, str]:
    return {"user_id": user.id}
```

Use `user.id` as the signed-in user. Do not accept a user id from the request body and treat it as already authenticated.

The dependency checks the bearer token locally:

| Result | Status | `detail` |
| --- | --- | --- |
| Header missing | `401` | `Missing bearer token` |
| Signature, issuer, audience, or role rejected | `401` | `Invalid access token` |
| Expired | `401` | `Access token expired` |
| `SUPABASE_URL` empty | `503` | `Supabase auth is not configured` |
| Public keys could not be fetched | `503` | `Could not verify access token` |

The signature is checked against `{SUPABASE_URL}/auth/v1/.well-known/jwks.json`. The issuer must be `{SUPABASE_URL}/auth/v1`. The audience and the `role` claim must both be `authenticated`. Shared-secret tokens are rejected. The check caches the public keys for five minutes.

Ignore `user_metadata` when deciding what a user may do. In Supabase that object is editable by the user. Store authorization data somewhere the user cannot rewrite, such as a LabOS table keyed by `user.id`.

## Try it

With `make dev` running and the two variables set, open http://localhost:8000/docs. In production, open http://localhost/docs. The **auth** tag lists the five routes. For logout and session, choose **Authorize** and paste the access token from login.

```bash
make test
```

`backend/tests/test_auth.py` covers registration, login, refresh, logout, and token checks with a stand-in for Supabase. `make test` does not need the hosted project.
