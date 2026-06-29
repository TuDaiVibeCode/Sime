@echo off
setlocal enabledelayedexpansion
REM =====================================================================
REM  Sime - full-stack deploy launcher (Windows)
REM
REM  Builds once, then starts backend + frontend + landing, each in its
REM  own window, with mapped + cross-wired ports. Close the windows or
REM  run stop-all.bat to stop. start-all.sh is the bash equivalent.
REM
REM  Usage:
REM    start-all.bat
REM    set SKIP_BUILD=1   ^& start-all.bat        reuse build (fast)
REM    set SKIP_INSTALL=1 ^& start-all.bat        skip install check
REM    set BACKEND_PORT=5000 ^& set FRONTEND_PORT=3001 ^& start-all.bat
REM
REM  Requires: node, npm, curl (bundled with Windows 10+/git).
REM
REM  COOKIES / NODE_ENV: backend is started WITHOUT NODE_ENV=production on
REM  purpose. It only sets the session-cookie Secure flag in production,
REM  and Secure cookies are dropped over plain http://localhost, breaking
REM  login. For an HTTPS deploy, set NODE_ENV=production and put TLS in
REM  front of the backend.
REM =====================================================================

cd /d "%~dp0"

if not defined BACKEND_PORT  set BACKEND_PORT=4000
if not defined FRONTEND_PORT set FRONTEND_PORT=3000
if not defined LANDING_PORT  set LANDING_PORT=8080
if not defined SKIP_BUILD    set SKIP_BUILD=0
if not defined SKIP_INSTALL  set SKIP_INSTALL=0

REM ---- cross-service wiring (child windows inherit this env) ----
set BACKEND_URL=http://localhost:%BACKEND_PORT%
set FRONTEND_ORIGIN=http://localhost:%FRONTEND_PORT%,http://127.0.0.1:%FRONTEND_PORT%

echo [deploy] ports: backend=%BACKEND_PORT% frontend=%FRONTEND_PORT% landing=%LANDING_PORT%

REM ---- install only when node_modules is missing ----
if "%SKIP_INSTALL%"=="0" (
  if not exist "backend\node_modules" (
    echo [deploy] installing backend deps...
    pushd backend & call npm install & popd
  )
  if not exist "frontend\node_modules" (
    echo [deploy] installing frontend deps...
    pushd frontend & call npm install & popd
  )
)

REM ---- build (skip with SKIP_BUILD=1) ----
if "%SKIP_BUILD%"=="1" (
  echo [deploy] SKIP_BUILD=1, reusing existing build
) else (
  echo [deploy] building backend...
  pushd backend
  call npm run build
  if errorlevel 1 ( echo [deploy] ERROR backend build failed & popd & exit /b 1 )
  popd
  echo [deploy] building frontend...
  pushd frontend
  call npm run build
  if errorlevel 1 ( echo [deploy] ERROR frontend build failed & popd & exit /b 1 )
  popd
)

REM ---- start backend (inherits PORT/BACKEND_URL/FRONTEND_ORIGIN) ----
set PORT=%BACKEND_PORT%
echo [deploy] starting backend on :%BACKEND_PORT%
start "Sime Backend" cmd /k "cd /d %~dp0backend && npm start"

REM ---- wait for backend health ----
echo [deploy] waiting for backend health...
set READY=0
for /l %%i in (1,1,30) do (
  if !READY!==0 (
    curl -fsS "http://localhost:%BACKEND_PORT%/health" >nul 2>&1
    if not errorlevel 1 set READY=1
    if !READY!==0 timeout /t 1 /nobreak >nul
  )
)
if !READY!==1 ( echo [deploy] backend healthy. ) else ( echo [deploy] WARN backend health timed out, continuing. )

REM ---- start frontend (-p overrides inherited PORT) ----
echo [deploy] starting frontend on :%FRONTEND_PORT%
start "Sime Frontend" cmd /k "cd /d %~dp0frontend && npm start -- -p %FRONTEND_PORT%"

REM ---- start landing ----
echo [deploy] starting landing on :%LANDING_PORT%
start "Sime Landing" cmd /k "cd /d %~dp0 && node scripts\serve-landing.mjs %LANDING_PORT%"

echo.
echo [deploy] Sime is up:
echo   landing   http://localhost:%LANDING_PORT%
echo   frontend  http://localhost:%FRONTEND_PORT%
echo   backend   http://localhost:%BACKEND_PORT%  (health: /health)
echo.
echo [deploy] three service windows opened. Close them or run stop-all.bat to stop.
endlocal
