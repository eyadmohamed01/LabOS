---
title: Initial setup
---

# Initial setup

Clone the repository and enter it:

```bash
git clone git@github.com:eyadmohamed01/LabOS.git
cd LabOS
```

Create the local environment file. `make dev` does this for you when `.env` is missing. To create it yourself:

```bash
cp .env.example .env
```

`.env` stays on your machine. It is listed in `.gitignore`. Commit `.env.example` when you add a new variable that other people need.

Build the project, start it, and build the documentation:

```bash
make build
```

The first run downloads the frontend, backend, and documentation dependencies, so it takes longer than later runs. The application stays running in the background at http://localhost.

Open the documentation by opening this file in a browser:

```text
docs/build/index.html
```

That file does not need a server or a port. After you change the documentation, run `make docs-build` and open the same file again.

For day-to-day work with live reload, use `make dev` instead of leaving the production build running. Stop that development session with `Ctrl+C`.
