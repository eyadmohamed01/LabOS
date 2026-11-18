---
title: Environment configuration
---

# Environment configuration

Configuration lives in `.env` at the repository root. Start from `.env.example`.

```bash
cp .env.example .env
```

Docker Compose reads this file when the development and production stacks start. You do not export the variables in your shell.

## Values the starter understands

| Variable | Used by | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_API_URL` | Frontend | API origin during development. Default `http://localhost:8000`. |
| `BACKEND_CORS_ORIGINS` | Backend | Browser origins allowed to call the API. Comma-separated. |
| `APP_ENV` | Backend | `development` or `production`. Compose sets this for containers. |
| `DATABASE_URL` | Backend | Optional PostgreSQL URL. The starter does not connect on startup. |
| `SUPABASE_URL` | Backend | Optional. Reserved for later Supabase setup. |
| `SUPABASE_ANON_KEY` | Backend | Optional. Reserved for later Supabase setup. |

## Development and Wi-Fi

For normal local work, keep:

```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
BACKEND_CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

`make dev-wifi` overrides the API URL and CORS origins for that process so a phone on the same network can call the API. It does not rewrite your `.env` file.

## Production

`make prod` builds the frontend with an empty `NEXT_PUBLIC_API_URL`. The browser then calls `/api/...` on the same host, and Nginx forwards those requests to the backend. You do not point the production frontend at port 8000.

After changing `.env`, stop the stack and start it again. A running container keeps the environment it was given at startup.
