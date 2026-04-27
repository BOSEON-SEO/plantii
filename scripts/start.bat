@echo off
REM Plantii 전체 기동
set ROOT=%~dp0..
if not exist "%ROOT%\logs" mkdir "%ROOT%\logs"

echo [1/3] Postgres (docker)...
docker start plantii-postgres >nul 2>&1

echo [2/3] Backend (port 3300)...
start "plantii-backend" /D "%ROOT%\backend" cmd /c "npm run dev > %ROOT%\logs\backend.log 2>&1"

echo [3/3] Frontend (port 5300)...
start "plantii-frontend" /D "%ROOT%\frontend" cmd /c "npm run dev > %ROOT%\logs\frontend.log 2>&1"

timeout /t 3 >nul
echo.
echo Backend : http://localhost:3300  (logs\backend.log)
echo Frontend: http://localhost:5300  (logs\frontend.log)
echo Stop    : scripts\stop.bat
