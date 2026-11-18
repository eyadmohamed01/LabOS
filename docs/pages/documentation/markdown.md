---
title: Markdown and MDX
---

# Markdown and MDX

Pages are Markdown. MDX is available when a page needs a React component. Prefer Markdown until a component is actually required.

## Front matter

```md
---
title: Make commands
---
```

`title` is the sidebar and browser title. Add `slug` only when the URL should differ from the file path. The prerequisites page uses `slug: /` so it is the site homepage.

## Headings

Use a single `#` heading that matches the title, then `##` for sections. Do not skip from `#` to `###`.

## Links

Link to another doc with a relative path:

```md
See [Make commands](../developer-guide/make-commands.md).
```

Link to a heading with the generated anchor:

```md
See [Stop](../getting-started/first-launch.md#stop).
```

External links use a full URL.

## Code

Fence a command with the language when you know it:

````md
```bash
make dev
```
````

Show a file path in a `text` fence or with backticks in a sentence: `frontend/app/page.tsx`.

## Images and diagrams

Put images in `docs/static/img/` and link them from the site root:

```md
![Development containers](/img/dev-containers.png)
```

A diagram that is easier to read as text can be a fenced block:

```text
Browser → Nginx → Frontend
                 → Backend
```

Use Mermaid only when the diagram is hard to follow as text. Keep the source of the diagram in the Markdown file so a diff shows the change.

## Tables

Use tables for short mappings, such as a command and what it does. Use paragraphs when the explanation is more than one sentence per cell.

## What not to add

Do not paste secrets, real connection strings, or a copy of `.env`. Examples use `localhost` and empty optional variables.
