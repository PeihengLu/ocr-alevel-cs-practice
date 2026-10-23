# Opening PortableLeetcode on macOS (unsigned)

## Double-click paths

| Edition | App |
| --- | --- |
| **Teacher** | `release/teacher-mac/mac-arm64/PortableLeetcode Teacher.app` |
| **Student** | `release/student-mac/mac-arm64/PortableLeetcode Student.app` |

Absolute Teacher path on this Mac:

`/Users/peiheng/development/portable-leetcode/release/teacher-mac/mac-arm64/PortableLeetcode Teacher.app`

## Gatekeeper (first open)

Apps are **unsigned** (no Apple Developer ID). If macOS blocks double-click:

1. **Finder** → right-click (or Control-click) the `.app` → **Open** → **Open**
2. Or once: `xattr -cr "/path/to/PortableLeetcode Teacher.app"` then double-click

No installer. Copy the `.app` anywhere (USB, Desktop).

## What starts automatically

Bundled `mysqld` on `127.0.0.1:13306`, data in  
`~/Library/Application Support/portable-leetcode/mysql-data`.  
Stops when you quit the app.

## Teacher classroom demo

1. Open **PortableLeetcode Teacher.app**
2. **Practice** → Import `.plpack` → choose  
   `…/PortableLeetcode Teacher.app/Contents/Resources/samples/sql-basics.plpack`  
   (or the repo `samples/sql-basics.plpack`)
3. **Demo** → pick a question → **Load solution** → **Run for class**
4. **Author** → edit/save questions → **Export .plpack…** for students
