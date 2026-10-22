# PortableLeetcode

Offline, plug-and-play coding practice for an A-level student. **Milestone 1** focuses on classroom SQL demos and student SQL practice — algorithms come after.

One codebase. **Teacher** vs **Student** are different *build artifacts*, not forks (`EDITION` / `VITE_EDITION` only).

## Product model

| Concern | Approach |
| --- | --- |
| Content updates | **Question packs** (`.plpack`) — teacher exports, student imports |
| Editions | Same source; `VITE_EDITION=student\|teacher` at dev/build time |
| Storage | **MySQL** for question bank / packs / attempts when available; **JSON fallback** under Electron `userData` if MySQL is down |
| Platforms | macOS and Windows (portable MySQL *binary bundling* is a later slice) |

### Pack format (`.plpack`)

A `.plpack` is a zip:

```
manifest.json
questions/<id>.json
sql/<schemaRef>.sql
```

- Stable question `id`s; each question has a monotonic `version` (higher wins on import).
- `manifest.retiredIds` removes questions from the local bank.
- Import/export run in the Electron main process (file dialogs + zip).

Sample pack sources: `samples/intro-sql/`. Built artifact: `samples/intro-sql.plpack` (also copied to `content/sample-intro.plpack` by `npm run sample:pack`).

### Editions

| | Teacher build | Student build |
| --- | --- | --- |
| Create/edit questions | Yes | No |
| Export packs | Yes | No |
| Import packs | Yes (testing) | Yes |
| Classroom demo UI | Yes | No |
| Practice + check answers | Yes | Yes |

## Requirements

- Node.js 20+ (22+ recommended)
- npm
- **Optional MySQL 8** for durable app storage (local install or Docker). Without it, pack round-trip still works via the JSON bank.

## MySQL (local / Docker)

Defaults (see `.env.example` and `src/main/db/config.ts`):

| Variable | Default |
| --- | --- |
| `MYSQL_HOST` | `127.0.0.1` |
| `MYSQL_PORT` | `3306` |
| `MYSQL_USER` | `portable` |
| `MYSQL_PASSWORD` | `portable` |
| `MYSQL_DATABASE` | `portable_leetcode` |

Schema migration: `sql/001_app_schema.sql` (applied automatically when MySQL connects).

```bash
# Option A — Docker
docker compose up -d

# Option B — any local MySQL 8 with matching user/db (or export MYSQL_* to match)

# Force JSON-only storage (skip MySQL probe)
export PORTABLE_LEETCODE_STORAGE=json
```

Bundled portable `mysqld` is **out of scope** for this milestone slice.

## Run (dev)

```bash
npm install
npm run sample:pack   # refresh samples/intro-sql.plpack

# Student edition
npm run dev:student

# Teacher edition (Author + Demo nav)
npm run dev:teacher

npm run typecheck
```

### What to try

1. **Student:** Practice → **Import .plpack…** → choose `samples/intro-sql.plpack` → pick a question → edit SQL → **Run query** (stub message until the exercise runner lands).
2. **Teacher:** Author → save a question → select questions → **Export .plpack…** → re-import in Student to verify merge.

## Build

```bash
npm run build:student
npm run build:teacher
npm run pack:mac   # after build — electron-builder dir target
npm run pack:win
```

## Project layout

```
sql/                      # MySQL app schema migrations
samples/intro-sql/        # Sample pack source + built .plpack
src/shared/pack/          # Pack types, validate, merge rules
src/main/pack/            # Zip encode/decode
src/main/store/           # Question bank (MySQL + JSON fallback)
src/main/db/              # MySQL config + migrate
src/preload/              # IPC bridge
src/renderer/src/
  edition.ts              # VITE_EDITION gate
  pack/                   # Thin IPC wrappers
  screens/                # Practice / Author / Demo
```

## Milestone 1 status (this slice)

Done: pack format, import/export, MySQL schema, Student import→list→open, Teacher author→export, sample pack, JSON fallback.

Next: MySQL exercise runner (pass/fail), classroom demo polish, portable MySQL packaging.
