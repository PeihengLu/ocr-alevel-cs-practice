# Vendor binaries (packaging)

## macOS

Regenerate a relocatable MySQL tree from Homebrew (dev machine only):

```bash
brew install mysql          # once
npm run vendor:mysql       # → vendor/mysql/ (gitignored)
```

Packaged apps copy this into `Contents/Resources/mysql` via electron-builder `extraResources`.

## Windows

Not staged on this Mac. On a Windows build host, place:

```
vendor/mysql/bin/mysqld.exe
vendor/mysql/bin/mysql.exe
vendor/mysql/bin/mysqladmin.exe
vendor/mysql/share/...
vendor/mysql/lib/...       # required DLLs
```

Then `npm run build:teacher && npx electron-builder --win dir`.

See README → Packaging / portable ship.
