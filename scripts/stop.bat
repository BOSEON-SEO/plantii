@echo off
REM Plantii 전체 종료
echo Killing ports 3300/5300/5301...
for %%P in (3300 5300 5301) do (
  for /f "tokens=5" %%A in ('netstat -ano ^| findstr ":%%P" ^| findstr LISTENING') do (
    taskkill /PID %%A /F >nul 2>&1
  )
)
echo Stopping postgres container...
docker stop plantii-postgres >nul 2>&1
echo Done.
