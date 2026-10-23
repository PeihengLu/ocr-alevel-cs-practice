# Vendor binaries (packaging)

Platform trees must not be mixed. Mac apps ship `vendor/mysql`; Windows Student ships `vendor/mysql-win`.

## macOS

Regenerate a relocatable MySQL tree from Homebrew (dev machine only):

```bash
brew install mysql          # once
npm run vendor:mysql       # → vendor/mysql/ (gitignored)
```

Packaged `.app` copies this into `Contents/Resources/mysql` via electron-builder `mac.extraResources`.

## Windows (Student)

Download official MariaDB **winx64** zip and stage a slim portable tree (includes `mysqld.exe` + `server.dll`):

```bash
npm run vendor:mysql:win   # → vendor/mysql-win/ (gitignored)
```

Cache: `vendor/.cache/mariadb-*-winx64.zip`.

Then:

```bash
npm run dist:student:win   # → release/student-win/
```

Cross-build from macOS produces `win-unpacked/` (and a portable `.exe` when Wine is available). On a Windows machine the same script produces a double-click portable `.exe`.

See `PACKAGING.md`.
