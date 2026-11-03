# PortableLeetcode

Offline, plug-and-play coding practice for an A-level student. SQL practice and Python data-structure chapters ship in one app. Python runs in bundled Pyodide, so students do not install Python.

## Product model

| Concern | Approach |
| --- | --- |
| Content | Python chapters and SQL questions ship inside the app. A new build adds or updates them. Progress stays on each question id |
| Storage / practice | SQLite for the question bank and each exercise; JSON bank fallback if SQLite cannot open |
| **Shipped app** | **Portable folder / `.app` / zip. No installer and no database server** |
| Platforms | macOS and Windows |

### SQL questions

The SQL set lives in `samples/sql-basics/`. On launch the app merges that folder into the question bank.

- A new question `id` is added.
- A higher `version` on an existing `id` replaces the question. Progress stays.
- An `id` in `retiredIds` is removed.

The statements to know by heart: SELECT (including a nested SELECT), FROM, WHERE, LIKE, AND, OR, JOIN, INSERT, DELETE, DROP, and the wildcards `*` and `%`.

## Packaging / portable ship

**The machine that runs the app must not install anything.** Shipped builds are self-contained `.app` bundles (no installer, no Docker, no Homebrew).

### Double-click (macOS arm64, built on this Mac)

`release/mac-arm64/PortableLeetcode.app`

**Gatekeeper:** the app is unsigned. First open → right-click `.app` → **Open** → **Open**. Or `xattr -cr "…/PortableLeetcode.app"`.

### What the packaged app does

1. SQL runs in bundled SQLite (`sql.js`). Each Run Query gets a fresh in-memory database seeded from the question schema.
2. Progress is stored in `portable-leetcode.sqlite` in the app's user-data folder, with a JSON copy beside it.
3. SQL questions ship in `Contents/Resources/samples/sql-basics` (Mac) or `resources/samples/sql-basics` (Windows) and are merged into the bank on launch.

### Rebuild

```bash
npm run pack:mac   # → release/mac-arm64/PortableLeetcode.app
npm run dist:win   # → release/PortableLeetcode-0.1.0-portable.exe and win-unpacked/
```

See `PACKAGING.md`.

```bash
# Force JSON-only bank. Run Query still uses SQLite when the wasm loaded.
export PORTABLE_LEETCODE_STORAGE=json
```

### Run Query safety

- SELECT questions: a single `SELECT` / `WITH … SELECT`
- INSERT, DELETE, and DROP TABLE questions: one write on a freshly seeded database, then a check query

## Run (dev)

```bash
npm install
npm run dev   # Practice opens on the Python chapters; SQL is the other tab

npm run typecheck
npm run test:practice
```

### What to try — Run Query

1. `npm run dev`
2. Practice → **SQL**
3. Open `1. SELECT *`, finish the query, **Run query**
4. Confirm pass/fail + result grid

## Build

```bash
npm run deploy     # Mac .app zip and Windows zip together → release/deploy/
npm run pack:mac   # Mac only
npm run dist:win   # Windows only
```

## Project layout

```
sql/                      # SQLite question-bank schema
samples/sql-basics/       # SQL questions merged on launch
src/main/db/              # SQLite engine, schema migrate, file paths
src/main/practice/        # Sanitize, compare, exercise runner
src/main/content/         # Reads the built-in SQL catalog
src/main/store/           # Question bank (SQLite + JSON fallback)
src/renderer/src/screens/ # Practice (Python and SQL)
```
