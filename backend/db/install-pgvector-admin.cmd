@echo off
setlocal

set "PGROOT=E:\PostgreSQL\18"
set "PGVECTOR_DIR=E:\tmp\pgvector"
set "VSDEV=D:\VS2026\Common7\Tools\VsDevCmd.bat"
set "LOG=E:\tmp\pgvector-install.log"

(
  echo Installing pgvector into %PGROOT%
  echo Source: %PGVECTOR_DIR%

  if not exist "%VSDEV%" (
    echo Missing Visual Studio developer command: %VSDEV%
    exit /b 1
  )

  if not exist "%PGVECTOR_DIR%\Makefile.win" (
    echo Missing pgvector source directory: %PGVECTOR_DIR%
    exit /b 1
  )

  call "%VSDEV%" -arch=x64 -host_arch=x64
  if errorlevel 1 exit /b 1

  cd /d "%PGVECTOR_DIR%"
  nmake /F Makefile.win install
  exit /b %ERRORLEVEL%
) > "%LOG%" 2>&1

exit /b %ERRORLEVEL%
