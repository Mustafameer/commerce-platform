@echo off
echo Testing Frontend Server on port 5173...
timeout /t 2 /nobreak
powershell -Command "try { $r = Invoke-WebRequest -Uri 'http://localhost:5173' -UseBasicParsing -TimeoutSec 3; Write-Host 'Frontend is running on port 5173'; exit 0 } catch { Write-Host 'Frontend not running - starting Vite dev server...'; exit 1 }"
if errorlevel 1 (
  echo Starting Vite dev server in background...
  cd /d c:\Users\Hp\Desktop\commerce-platform
  start /b npm run dev:frontend 2>&1
  timeout /t 5 /nobreak
  echo Vite server started
)
