@echo off
set ROOT=%~dp0..
docker start plantii-postgres >nul 2>&1
cd /d "%ROOT%\backend"
call npm test
