# PortableLeetcode

Offline, plug-and-play coding practice for an A-level student. **Milestone 1** focuses on classroom SQL demos and student SQL practice — algorithms come after.

One codebase. **Teacher** vs **Student** are different *build artifacts*, not forks (`EDITION` / `VITE_EDITION` only).

## Product model

| Concern | Approach |
| --- | --- |
| Content updates | **Question packs** (`.plpack`) — teacher exports, student imports |
| Editions | Same source; `VITE_EDITION=student\|teacher` at dev/build time |
| Storage / practice | MySQL for bank + exercise sandbox; JSON bank fallback if MySQL is down |
| **Shipped apps** | **Portable folder / `.app` / zip — no installer, no Docker, no Homebrew, no system MySQL** |
| Platforms | macOS and Windows |

### Pack format (`.plpack`)

A `.plpack` is a zip:

```
manifest.json
questions/<id>.json
sql/<schemaRef>.sql
```

- Stable question `id`s; higher `version` wins on import; `retiredIds` remove from bank.
- `result_set` checks support `ordered: true` (ORDER BY) or unordered compare (default).

| Pack | Path | Audience |
| --- | --- | --- |
| SQL Basics | `samples/sql-basics.plpack` | Absolute beginners (progressive, no JOINs) |
| Intro SQL | `samples/intro-sql.plpack` | Tiny 2-question starter |

Rebuild: `npm run sample:pack`.

## Packaging / portable ship (product direction)

**Students and classroom machines must not install anything.** Shipped Teacher/Student builds are self-contained folders (or `.app` / zip) that:

1. Bundle a **portable MySQL or MariaDB** binary per OS under e.g. `resources/mysql/` (or `vendor/mysql/` in the repo during packaging).
2. On launch, Electron calls `ensureMysqlSidecar()` (`src/main/db/portableMysql.ts`) to start `mysqld` with:
   - `--datadir` under the app-owned data directory (`MYSQL_DATA_DIR` / Electron `userData/mysql-data`)
   - `--port` on an app-owned localhost port (`MYSQL_PORT`, default `3306` for now)
3. On quit, `stopMysqlSidecar()` stops the process the app started.
4. The UI always connects via `MYSQL_HOST` / `MYSQL_PORT` / `MYSQL_USER` / `MYSQL_PASSWORD` — never assuming Homebrew or Docker.

**This PR** wires the connection + lifecycle *hooks* and the exercise runner. **It does not yet ship OS MySQL binaries.** Until packaging lands, developers point the same config at a local server (Homebrew recommended on this Mac).

Set `MYSQL_PREFER_BUNDLED=1` later to prefer spawning a found bundled binary (start/stop implementation is the packaging slice).

## Dev MySQL on this Mac (Homebrew — not for students)

Docker Desktop is broken here; use Homebrew for **development only**:

```bash
brew install mysql          # or: brew install mariadb
brew services start mysql   # or: brew services start mariadb

# Create app DB + user + exercise sandbox (once)
chmod +x scripts/setup-local-mysql.sh
./scripts/setup-local-mysql.sh

# If root needs a password:
# MYSQL_ROOT_PASSWORD='…' ./scripts/setup-local-mysql.sh
```

Defaults (`.env.example` / `src/main/db/config.ts`):

| Variable | Default |
| --- | --- |
| `MYSQL_HOST` | `127.0.0.1` |
| `MYSQL_PORT` | `3306` |
| `MYSQL_USER` | `portable` |
| `MYSQL_PASSWORD` | `portable` |
| `MYSQL_DATABASE` | `portable_leetcode` |
| `MYSQL_DATA_DIR` | `<userData>/mysql-data` (for future bundled mysqld) |

Exercise sandbox DB: `pl_exercise` (created by the setup script / `sql/000_exercise_db.sql`).

**Optional / secondary:** `docker-compose.yml` exists for developers who have working Docker — not the recommended path on this Mac, and never a student dependency.

```bash
# Force JSON-only bank (Run Query will error clearly without MySQL)
export PORTABLE_LEETCODE_STORAGE=json
```

### Run Query safety

- Single `SELECT` / `WITH … SELECT` only (multi-statement + DDL/DML rejected)
- Seed applied into isolated `pl_exercise`; student query uses `multipleStatements: false` + read-only transaction

## Run (dev)

```bash
npm install
npm run sample:pack
./scripts/setup-local-mysql.sh   # once, after brew MySQL is running

npm run dev:student   # Import samples/sql-basics.plpack → Run query
npm run dev:teacher   # Author / Demo → Load solution → Run for class

npm run typecheck
npm run test:practice
```

### What to try — Run Query

1. `brew services start mysql` + `./scripts/setup-local-mysql.sh`
2. `npm run dev:student`
3. Practice → **Import .plpack…** → `samples/sql-basics.plpack`
4. Open **1. Select every column**, finish the query, **Run query**
5. Confirm pass/fail + result grid

## Build

```bash
npm run build:student
npm run build:teacher
npm run pack:mac   # electron-builder dir — portable folder (mysqld bundling later)
npm run pack:win
```

## Project layout

```
sql/                      # App schema + exercise DB grants
samples/sql-basics/       # Beginner pack
src/main/db/              # Config + portable mysqld lifecycle hooks
src/main/practice/        # Sanitize, compare, exercise runner
src/main/pack/            # .plpack zip I/O
src/main/store/           # Question bank (MySQL + JSON fallback)
src/renderer/src/screens/ # Practice / Author / Demo
```
