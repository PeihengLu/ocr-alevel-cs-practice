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

## Teacher classroom demo (live lesson)

Demo is a **projector lesson tool** — walk through SQL on a sample `students` table (not pack authoring).

1. Open **PortableLeetcode Teacher.app** (opens on **Demo**)
2. Schema is on the left; click lesson chips (**SELECT ***, **WHERE**, **ORDER BY**, …)
3. **Run for class** (or auto-run) shows a large result grid for the room
4. Use **Author** / **Practice** separately to edit packs or try student practice
5. Sample pack for students still lives at  
   `…/Contents/Resources/samples/sql-basics.plpack`
