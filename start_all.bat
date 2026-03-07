@echo off
taskkill /F /IM node.exe >nul 2>&1
timeout /t 3 /nobreak
echo Starting backend server...
start "" node server.ts
echo.
echo Waiting for backend to start...
timeout /t 5 /nobreak
echo.
echo Starting Vite UI...
start "" cmd.exe /k "npx vite --port 5173"
echo.
echo Both servers are starting...
echo Backend: http://localhost:3000
echo Frontend: http://localhost:5173
