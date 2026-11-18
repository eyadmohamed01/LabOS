---
title: Commit messages
---

# Commit messages

Format:

```text
<type>: <short summary>
```

| Part | Meaning |
| --- | --- |
| `<type>` | The category of the change, such as `feat`, `fix`, or `docs`. |
| `<short summary>` | A concise description of the change in the present tense. |

## Rules

1. Write a concise message that describes what you have done.
2. Use the present tense: "add", not "added".
3. Use lowercase for the type and the summary.
4. Describe what the commit does, not why.
5. Keep commits atomic. One commit is one small, self-contained change, not a list of unrelated changes.
6. A commit should cover at most one day of work.

The issue number belongs in the branch name, not in the commit subject. Do not add `(#12)`, `[docs]`, or a similar tag.

```text
fix: remove parameter "xyz"
```

## Types

| Type | Use it for |
| --- | --- |
| `feat` | A new feature |
| `fix` | A bug fix |
| `refactor` | A code change that neither fixes a bug nor adds a feature |
| `docs` | Documentation changes only |
| `test` | Adding tests or correcting existing tests |
| `style` | Formatting or whitespace that does not change behavior |
| `ci` | CI configuration files and scripts |
| `chore` | Build tasks, dependencies, and other maintenance |
| `other` | Nothing above fits. Avoid this type. |

## Suggestive verbs

| Type | Verbs |
| --- | --- |
| `feat` | add, implement, introduce, create, enable, integrate |
| `fix` | fix, resolve, patch, correct, repair, handle |
| `refactor` | refactor, restructure, simplify, optimize, extract, consolidate |
| `docs` | add, update, revise, clarify, document, remove |
| `test` | add, update, fix, expand, cover, mock |
| `style` | format, reformat, lint, clean, style, prettify |
| `ci` | configure, update, fix, add, adjust, remove |
| `chore` | update, bump, remove, clean, upgrade, configure |

## Examples

```text
feat: add health route
fix: correct the lan origin during wifi development
docs: document the production nginx paths
test: cover the openapi health path
refactor: extract the api base url helper
chore: ignore local environment files
```

## A message to avoid

```text
feat(#12): implement the backend pagination and filtering for the dashboard table
```

The subject lists several changes, uses an issue tag, and is not one day's scope. Split the work and put `12` in the branch name: `feat-12-study-table`.

```bash
git commit -m "fix: reload the backend when a schema changes"
```
