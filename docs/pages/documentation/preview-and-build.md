---
title: Preview and build
---

# Preview and build

The documentation is a file. It does not run on a port.

## First build

```bash
make build
```

This downloads the application and documentation dependencies, starts the application at http://localhost, and writes:

```text
docs/build/index.html
```

Open that file in a browser. Leave it closed when you are not reading it. Nothing has to keep running for the file to open again later.

## Rebuild after an edit

```bash
make docs-build
```

This command only rebuilds the documentation. It does not restart the application. When it finishes, open `docs/build/index.html` again.

`docs/build` is gitignored. The Markdown sources in `docs/pages/` are what Git tracks.
