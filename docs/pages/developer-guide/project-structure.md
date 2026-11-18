---
title: Project structure
---

# Project structure

LabOS is a monorepo. Application code, infrastructure, and documentation live in one Git repository. Product features are not split into their own top-level directories yet. Add a feature inside the existing frontend and backend trees when the team starts building it.

```text
LabOS/
├── frontend/                 Next.js application
├── backend/                  FastAPI application
├── docs/                     Documentation site
│   ├── pages/                Documentation pages
│   └── build/                Generated file, open index.html in a browser
├── infra/nginx/              Production reverse proxy
├── scripts/                  Dev and docs startup scripts
├── docker-compose.dev.yml
├── docker-compose.prod.yml
├── docker-compose.docs.yml
├── Makefile
├── .env.example
└── README.md
```

## Frontend

| Path | What belongs here |
| --- | --- |
| `frontend/app/` | Routes, layouts, and global styles. A folder becomes a URL segment. |
| `frontend/components/` | React components used by more than one route. |
| `frontend/hooks/` | Shared hooks, named `useSomething`. |
| `frontend/lib/` | Functions that are not components: API helpers, formatting, small clients. |
| `frontend/types/` | Shared TypeScript types. |
| `frontend/public/` | Files that should be served unchanged. |

## Backend

| Path | What belongs here |
| --- | --- |
| `backend/app/api/` | HTTP routers. Register each router in `api/router.py`. |
| `backend/app/core/` | Settings, logging, and infrastructure such as the database factory. |
| `backend/app/models/` | SQLAlchemy models. |
| `backend/app/schemas/` | Pydantic request and response models. |
| `backend/app/services/` | Operations that should not depend on the HTTP layer. |
| `backend/tests/` | Pytest modules. |

## Documentation

`docs/pages/` is the contributor guide you are reading. It explains how to run and change the repository. `make docs-build` writes it to `docs/build/index.html`. That output is not copied into the application image.

## What this starter intentionally omits

There is no calendar module, chatbot, project board, or task module. Do not add empty feature directories "for later". When a feature starts, add its routes, components, and tests in the directories above.
