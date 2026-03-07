@echo off
cd /d C:\Users\Hp\Desktop\commerce-platform
echo Starting Backend Server...
start "Backend" cmd.exe /k node server.ts
timeout /t 5
echo Starting Frontend (Vite)...
start "Frontend" cmd.exe /k npx vite --port 5173
echo.
echo Both servers are starting...
echo Backend: http://localhost:3000
echo Frontend: http://localhost:5173
pause
