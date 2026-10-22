# PortableLeetcode

Offline, plug-and-play coding practice for an A-level student. Ships toward a self-contained desktop app (macOS + Windows) with **Python 3** and **MySQL** later. **Milestone 1** focuses on classroom SQL demos and student SQL practice — algorithms come after.

One codebase. **Teacher** vs **Student** are different *build artifacts*, not forks.

## Product model

| Concern | Approach |
| --- | --- |
| Content updates | **Question packs** (`.plpack`) — teacher exports, student imports (USB / email / shared folder); optional auto-load from `content/` next to the app |
| Editions | Same source; `EDITION` / `VITE_EDITION` set at dev/build time |
| Storage (later) | Bundled MySQL for question bank, progress, and exercise schemas |
| Platforms | macOS and Windows, installer-free folder / `.app` / zip |

### Packs (draft)

- `manifest.json` — pack id, version, title, created_at, min_app_version, checksum
- `questions/` — SQL items (prompt, starter query, expected checks, tags, difficulty)
- `sql/` — schema + seed data per exercise (or shared datasets)

Stub TypeScript types live under `src/pack/`. Import/export and MySQL are **not** implemented in this scaffold.

### Editions

| | Teacher build | Student build |
| --- | --- | --- |
| Create/edit questions | Yes | No |
| Export packs | Yes | No |
| Import packs | Yes (testing) | Yes |
| Classroom demo UI | Yes | No |
| Practice + check answers | Yes | Yes |

Teacher-only routes/UI are gated with `isTeacher` from `src/edition.ts` (reads `import.meta.env.VITE_EDITION`).

## Requirements

- Node.js 20+ (22 recommended)
- npm

## Run (dev)

```bash
npm install

# Student edition (default if unset)
npm run dev:student
# equivalent: EDITION=student / VITE_EDITION=student

# Teacher edition (Author + Demo nav)
npm run dev:teacher
```

Scripts set `VITE_EDITION=student|teacher` via `cross-env`. The Vite config also accepts `EDITION` as a fallback.

## Build

```bash
npm run build:student   # renderer + electron → out/
npm run build:teacher
```

### Packaging intent (mac / win)

Self-contained, **no system installer** preferred:

```bash
# After build:student or build:teacher
npm run pack:mac   # electron-builder --mac dir  → release/
npm run pack:win   # electron-builder --win dir  → release/
```

Up to four packages: teacher/student × macOS/Windows. Bundled portable MySQL is **out of scope** for this scaffold; packaging scripts are placeholders for the packaging phase.

## Project layout

```
src/main/                 # Electron main process
src/preload/              # Preload bridge
src/renderer/src/
  edition.ts              # build-time edition flag (VITE_EDITION)
  screens/                # Student practice; Teacher author/demo (gated)
  pack/                   # .plpack types + import/export stubs
```

## Milestone 1 (next)

1. Pack format + MySQL schema for questions/attempts  
2. Student: import → list → run query → check  
3. Teacher: author → export; classroom demo UI  
4. Portable MySQL + OS packaging  

See project docs in the PortableLeetcode coordinator store for locked decisions.
