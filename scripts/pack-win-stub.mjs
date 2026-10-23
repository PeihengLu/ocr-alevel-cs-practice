#!/usr/bin/env node
console.log(`
Windows packaging is stubbed on this Mac.

When building on Windows (or a Win CI agent):
  1. Stage a portable MySQL/MariaDB into vendor/mysql (Windows mysqld.exe + libs)
  2. npm run build:teacher   # or build:student
  3. npx electron-builder --win dir

Mac Teacher/Student packs:
  npm run pack:mac:teacher
  npm run pack:mac:student
`)
process.exit(0)
