---
title: Coding conventions
---

# Coding conventions

Match the surrounding file. The starter is small on purpose, so a new file should look like the files next to it.

## TypeScript and React

- Use function components.
- Type component props. Do not use `any`.
- A component file uses `PascalCase.tsx`. A hook file uses `useSomething.ts`.
- Keep route files in `frontend/app/` focused on the page. Move reusable markup to `frontend/components/`.
- Prefer the API helper in `frontend/lib/api.ts` over a hardcoded `http://localhost:8000`.

## Python

- Use type hints on functions you add.
- Name modules and functions in `snake_case`. Name classes in `PascalCase`.
- Keep FastAPI path functions thin. Put reusable work in `app/services/`.
- Read configuration from `app.core.config.settings` rather than calling `os.environ` in a route.
- Do not open a database connection at import time.

## Formatting

- UTF-8, LF line endings, and a final newline. `.editorconfig` records the indentation: 2 spaces in the frontend and docs, 4 spaces in Python, tabs in the Makefile.
- Do not reformat an entire file as part of an unrelated fix.

## Comments

Comment a constraint that the code cannot show, such as why the dev server uses Webpack polling inside Docker. Do not comment that a function returns its result.

## Secrets

Never commit `.env`, tokens, or connection strings. `.env.example` contains names and empty or local-only examples.
