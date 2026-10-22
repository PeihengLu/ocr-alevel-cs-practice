# Vendor binaries (packaging)

Place portable **MySQL** or **MariaDB** server binaries here during the packaging slice:

```
vendor/mysql/mysqld          # macOS / Linux
vendor/mysql/mysqld.exe      # Windows
# or vendor/mariadb/mariadbd(.exe)
```

Electron packaged builds look under `resources/mysql` (copied by electron-builder). See `src/main/db/portableMysql.ts` and README **Packaging / portable ship**.

This folder is intentionally empty in source control — binaries are large and OS-specific.
