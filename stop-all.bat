@echo off
REM =====================================================================
REM  Sime - stop services launched by start-all.bat.
REM  Kills the three named service windows (and their child node procs).
REM =====================================================================
echo [deploy] stopping Sime services...
taskkill /FI "WINDOWTITLE eq Sime Backend*"  /T /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq Sime Frontend*" /T /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq Sime Landing*"  /T /F >nul 2>&1
echo [deploy] done. If a window was renamed, close it manually.
