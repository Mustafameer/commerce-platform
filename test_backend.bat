@echo off
echo Testing Backend Server...
echo.
timeout /t 2 /nobreak
echo.
echo Sending request to http://localhost:3000/api/stores
powershell -Command "try { $r = Invoke-WebRequest -Uri 'http://localhost:3000/api/stores' -UseBasicParsing -TimeoutSec 5; Write-Host ('Status: ' + $r.StatusCode); if ($r.StatusCode -eq 200) { Write-Host 'SUCCESS: Backend is running!'; exit 0 } else { Write-Host 'ERROR: Unexpected status'; exit 1 } } catch { Write-Host ('ERROR: ' + $_.Exception.Message); exit 1 }"
