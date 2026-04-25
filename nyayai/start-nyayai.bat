@echo off
echo ==========================================
echo      NYAY AI COURT - STARTUP SCRIPT
echo ==========================================
echo.
echo [1/2] Starting Node.js Backend (Port 5000)
start "Nyay AI Backend" cmd /c "cd server && npm run dev"
echo [2/2] Starting React Frontend (Port 3000)
start "Nyay AI Frontend" cmd /c "cd client && npm start"
echo.
echo Both services are launching in separate windows.
echo.
pause
