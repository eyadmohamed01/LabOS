# Documentation site

This directory is the documentation site for people working on LabOS. The pages are in `pages/`.

From the repository root, `make build` writes `docs/build/index.html` and also starts the application. Open that file in a browser. It does not use a port.

After editing pages under `docs/pages/`, rebuild only the documentation:

```bash
make docs-build
```

Then open `docs/build/index.html` again.
