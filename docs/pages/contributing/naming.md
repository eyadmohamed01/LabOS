---
title: Naming conventions
---

# Naming conventions

## Git

| Item | Pattern | Example |
| --- | --- | --- |
| Branch | `Type-IssueNumber-IssueName` | `feat-1-login-page` |
| Commit | `<type>: <short summary>` | `feat: add health route` |

## Frontend

| Item | Pattern | Example |
| --- | --- | --- |
| Component | PascalCase | `HealthStatus` |
| Hook | `use` prefix | `useLabs` |
| File for a component | PascalCase | `HealthStatus.tsx` |
| Utility module | camelCase or short noun | `api.ts` |
| Route folder | URL segment | `app/labs/page.tsx` |

## Backend

| Item | Pattern | Example |
| --- | --- | --- |
| Module | snake_case | `health.py` |
| Function | snake_case | `create_db_engine` |
| Schema or model class | PascalCase | `HealthResponse` |
| Environment variable | UPPER_SNAKE | `DATABASE_URL` |
| HTTP path | plural noun, under `/api` | `/api/health` |

## Docker and Make

Compose project names are fixed: `labos-dev`, `labos-prod`, `labos-docs`. Make targets stay lowercase with hyphens: `dev-wifi`, `prod-logs`, `docs-build`.

## Product names in code

Keep framework and protocol names as the project uses them: Next.js, FastAPI, Nginx, Supabase, PostgreSQL. Do not invent a second name for the same service in documentation.
