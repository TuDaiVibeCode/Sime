# Sime Database

PostgreSQL is the primary data store for Sime. It stores users, lessons, progress,
voice profiles, analysis jobs, and pgvector embeddings for acoustic similarity.

## Local Setup

The local PostgreSQL tools are expected at:

```powershell
E:\PostgreSQL\18\bin
```

Create the database and apply migrations:

```powershell
cd E:\Sime\backend
$env:PGPASSWORD = "<your-postgres-password>"
.\db\setup-local.ps1 -User app_backend -Database sime_db -Schema public
Remove-Item Env:PGPASSWORD
```

If your server uses a different admin user or port:

```powershell
.\db\setup-local.ps1 -User app_backend -Host localhost -Port 5432 -Database sime_db -Schema public
```

## Files

- `migrations/001_init.sql` creates core extensions, tables, indexes, and constraints.
- `migrations/002_seed_lessons.sql` seeds the initial free curriculum.
- `migrations/003_pgvector.sql` is optional and requires pgvector installed on the PostgreSQL server.
- `setup-local.ps1` creates the local database if needed and applies migrations.
- `install-pgvector-admin.cmd` installs a locally built pgvector package into `E:\PostgreSQL\18`; run it from an elevated shell or approve the UAC prompt.

## pgvector

After installing pgvector, apply the vector migration with a PostgreSQL superuser:

```powershell
$env:PGPASSWORD = "<postgres-admin-password>"
E:\PostgreSQL\18\bin\psql.exe -h localhost -U postgres -d sime_db -v ON_ERROR_STOP=1 -f .\db\migrations\003_pgvector.sql
Remove-Item Env:PGPASSWORD
```

The app still connects as `app_backend`; the superuser is only needed to create
the extension.

## Security Notes

Never commit real database passwords. Store the local connection string in
`backend/.env`, which is ignored by git. Application queries must use
parameterized SQL only.
