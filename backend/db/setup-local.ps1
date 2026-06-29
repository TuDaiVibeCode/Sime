param(
  [string]$HostName = "localhost",
  [int]$Port = 5432,
  [string]$User = "postgres",
  [string]$Database = "sime_db",
  [string]$Schema = "public",
  [string]$PsqlBin = "E:\PostgreSQL\18\bin"
)

$ErrorActionPreference = "Stop"

if ($Database -notmatch "^[A-Za-z_][A-Za-z0-9_]*$") {
  throw "Invalid database name '$Database'. Use letters, numbers, and underscores only."
}
if ($Schema -notmatch "^[A-Za-z_][A-Za-z0-9_]*$") {
  throw "Invalid schema name '$Schema'. Use letters, numbers, and underscores only."
}

$psql = Join-Path $PsqlBin "psql.exe"
if (-not (Test-Path -LiteralPath $psql)) {
  throw "psql.exe not found at $psql"
}

function Invoke-Psql {
  param(
    [string[]]$PsqlArgs,
    [string]$SearchPath = ""
  )
  $previousPgOptions = $env:PGOPTIONS
  try {
    if ($SearchPath) {
      $env:PGOPTIONS = "-c search_path=$SearchPath,public"
    }
    & $psql @PsqlArgs
    if ($LASTEXITCODE -ne 0) {
      throw "psql failed with exit code $LASTEXITCODE"
    }
  } finally {
    if ($null -eq $previousPgOptions) {
      Remove-Item Env:PGOPTIONS -ErrorAction SilentlyContinue
    } else {
      $env:PGOPTIONS = $previousPgOptions
    }
  }
}

$dbExists = & $psql -h $HostName -p $Port -U $User -d postgres -tAc "select 1 from pg_database where datname = '$Database'"
if ($dbExists -ne "1") {
  Invoke-Psql -PsqlArgs @("-h", $HostName, "-p", "$Port", "-U", $User, "-d", "postgres", "-c", "create database $Database")
}

Invoke-Psql -PsqlArgs @("-h", $HostName, "-p", "$Port", "-U", $User, "-d", $Database, "-v", "ON_ERROR_STOP=1", "-c", "create schema if not exists $Schema")
# Schema and seed are managed by Prisma now (prisma/migrations + prisma/seed.ts).
# The init migration creates the pgcrypto and vector extensions, all tables,
# indexes, and constraints. The old SQL lives in db/legacy for reference.
Write-Host "Applying Prisma migrations..."
& npx prisma migrate deploy
if ($LASTEXITCODE -ne 0) { throw "prisma migrate deploy failed with exit code $LASTEXITCODE" }

Write-Host "Seeding curriculum..."
& npm run db:seed
if ($LASTEXITCODE -ne 0) { throw "db:seed failed with exit code $LASTEXITCODE" }

Write-Host "Database '$Database' is ready."
