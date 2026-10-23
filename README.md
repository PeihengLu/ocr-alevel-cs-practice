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

## Packaging / portable ship

**Students and classroom machines must not install anything.** Shipped builds are self-contained `.app` bundles (no installer, no Docker, no Homebrew).

### Double-click (macOS arm64, built on this Mac)

| Edition | Path |
| --- | --- |
| **Teacher** | `release/teacher-mac/mac-arm64/PortableLeetcode Teacher.app` |
| **Student** | `release/student-mac/mac-arm64/PortableLeetcode Student.app` |

Full Teacher path:

`/Users/peiheng/development/portable-leetcode/release/teacher-mac/mac-arm64/PortableLeetcode Teacher.app`

**Gatekeeper:** apps are unsigned. First open → right-click `.app` → **Open** → **Open**. Or `xattr -cr "…/PortableLeetcode Teacher.app"`.

See also `release/HOW-TO-OPEN.md`.

### What the packaged app does

1. Bundles portable MySQL under `Contents/Resources/mysql` (staged via `npm run vendor:mysql` from Homebrew on the *build* Mac only).
2. On launch, `ensureMysqlSidecar()` starts `mysqld` on **`127.0.0.1:13306`** with `--datadir` in `~/Library/Application Support/portable-leetcode/mysql-data`.
3. On quit, `stopMysqlSidecar()` shuts it down.
4. Sample packs ship in `Contents/Resources/samples/*.plpack`.

### Rebuild packs (dev machine with Homebrew MySQL)

```bash
npm run pack:mac:teacher   # → release/teacher-mac/…
npm run pack:mac:student   # → release/student-mac/…
npm run pack:win           # stub note — build Win on a Windows host
```

### Windows

Stubbed on this Mac (`npm run pack:win` prints steps). Needs a Windows-staged `vendor/mysql` + `electron-builder --win dir`.

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
| `MYSQL_PORT` | `3306` (dev) / **`13306`** (packaged / `MYSQL_PREFER_BUNDLED`) |
| `MYSQL_USER` | `portable` |
| `MYSQL_PASSWORD` | `portable` |
| `MYSQL_DATABASE` | `portable_leetcode` |
| `MYSQL_DATA_DIR` | `<userData>/mysql-data` |

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
