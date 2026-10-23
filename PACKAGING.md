# Opening PortableLeetcode (no install)

Shipped builds are **installer-free** with a bundled MySQL/MariaDB. Students do **not** need Docker, Homebrew, or a system MySQL.

## macOS — Teacher (already available)

| Edition | App |
| --- | --- |
| **Teacher** | `release/teacher-mac/mac-arm64/PortableLeetcode Teacher.app` |
| **Student** | `release/student-mac/mac-arm64/PortableLeetcode Student.app` |

Absolute Teacher path on this Mac:

`/Users/peiheng/development/portable-leetcode/release/teacher-mac/mac-arm64/PortableLeetcode Teacher.app`

### Gatekeeper (first open)

Apps are **unsigned** (no Apple Developer ID). If macOS blocks double-click:

1. **Finder** → right-click (or Control-click) the `.app` → **Open** → **Open**
2. Or once: `xattr -cr "/path/to/PortableLeetcode Teacher.app"` then double-click

No installer. Copy the `.app` anywhere (USB, Desktop).

### What starts automatically (Mac)

Bundled `mysqld` on `127.0.0.1:13306`, data in  
`~/Library/Application Support/portable-leetcode/mysql-data`.  
Stops when you quit the app.

## Windows — Student (portable)

| Artifact | Path |
| --- | --- |
| Unpacked folder (always) | `release/student-win/win-unpacked/` → run `PortableLeetcode Student.exe` |
| Portable exe (when build host can produce it) | `release/student-win/PortableLeetcode Student-0.1.0-portable.exe` |
| Zip handoff (optional) | Zip the `win-unpacked` folder or ship the portable `.exe` |

### How students get it

1. Receive a zip (or USB copy) of either:
   - the portable `.exe`, **or**
   - the `win-unpacked` folder
2. Unzip if needed
3. Double-click **PortableLeetcode Student.exe** (or the portable exe)
4. No installer, no Docker, no Homebrew, no system MySQL

Windows Defender / SmartScreen may warn on unsigned builds — choose **More info** → **Run anyway**.

### What starts automatically (Windows)

Bundled MariaDB (`resources/mysql/bin/mysqld.exe` + `server.dll`) on `127.0.0.1:13306`, data under  
`%APPDATA%\portable-leetcode\mysql-data` (Electron `userData`).  
Stops when you quit the app.

### Build (maintainers)

```bash
# Stages official MariaDB winx64 into vendor/mysql-win (not the Mac tree)
npm run dist:student:win
# alias: npm run pack:win:student
```

- **From macOS:** electron-builder can emit `win-unpacked/` without Wine. The NSIS **portable** `.exe` may require Wine; if it fails, ship a zip of `win-unpacked/` or rebuild on Windows.
- **From Windows:** same command; prefer the portable `.exe` for single-file handoff.
- Mac MySQL (`vendor/mysql`) is **never** copied into the Windows build (`win.extraResources` → `vendor/mysql-win` only).

## Teacher classroom demo (live lesson)

Demo is a **projector lesson tool** — walk through SQL on a sample `students` table (not pack authoring).

1. Open **PortableLeetcode Teacher.app** (opens on **Demo**)
2. Schema is on the left; click lesson chips (**SELECT ***, **WHERE**, **ORDER BY**, …)
3. **Run for class** (or auto-run) shows a large result grid for the room
4. Use **Author** / **Practice** separately to edit packs or try student practice
5. Sample pack for students still lives at  
   `…/Contents/Resources/samples/sql-basics.plpack`
