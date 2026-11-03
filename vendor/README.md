# Vendor binaries

SQL no longer ships a database server. Practice uses `sql.js` (SQLite compiled to WebAssembly), copied into the app as `sqlite/sql-wasm.wasm` at pack time.

Python still ships the small Pyodide subset listed in `package.json` `extraResources`.
