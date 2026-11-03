# Opening PortableLeetcode (no install)

Shipped builds are **installer-free**. SQL runs in bundled SQLite, so the computer that runs the app does not need Docker, Homebrew, or a database server.

## macOS

`release/mac-arm64/PortableLeetcode.app`

### Gatekeeper (first open)

The app is **unsigned** (no Apple Developer ID). If macOS blocks double-click:

1. **Finder** → right-click (or Control-click) the `.app` → **Open** → **Open**
2. Or once: `xattr -cr "/path/to/PortableLeetcode.app"` then double-click

No installer. Copy the `.app` anywhere (USB, Desktop).

### What the app stores (Mac)

Progress is a SQLite file, `portable-leetcode.sqlite`, in the app's user-data folder. Each Run Query uses a temporary in-memory database. Nothing is left listening on a port when you quit.

Build with `npm run pack:mac`, or both platforms with `npm run deploy`. Electron ships its English locale pack only.

## Windows (portable)

| Artifact | Path |
| --- | --- |
| Unpacked folder (always) | `release/win-unpacked/` → run `PortableLeetcode.exe` |
| Portable exe (when the build host can produce it) | `release/PortableLeetcode-0.1.0-portable.exe` |
| Zip handoff (optional) | Zip the `win-unpacked` folder or ship the portable `.exe` |

### How to hand it over

1. Send a zip (or USB copy) of either:
   - the portable `.exe`, **or**
   - the `win-unpacked` folder
2. Unzip if needed
3. Double-click **PortableLeetcode.exe** (or the portable exe)
4. No installer and no database server to set up

Windows Defender / SmartScreen may warn on unsigned builds — choose **More info** → **Run anyway**.

### What the app stores (Windows)

Progress is `portable-leetcode.sqlite` under the app's user-data folder (`%APPDATA%`). Each Run Query uses a temporary in-memory database.

### Build (maintainers)

```bash
# Mac zip and Windows zip, side by side in release/deploy/
npm run deploy

# Or one platform:
npm run pack:mac
npm run dist:win
```

- **From macOS:** electron-builder can emit `win-unpacked/` without Wine. The NSIS **portable** `.exe` may require Wine; if it fails, ship a zip of `win-unpacked/` or rebuild on Windows.
- **From Windows:** same command; prefer the portable `.exe` for single-file handoff.
- SQLite ships as one wasm file (`sql-wasm.wasm`, about 670 KB) beside the app. The same file is used on Mac and Windows.

SQL questions ship in `Contents/Resources/samples/sql-basics` (Mac) or `resources/samples/sql-basics` (Windows) and load on startup. Python chapters are built into the app.
