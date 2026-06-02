@echo off
echo ==========================================
echo        Texas Hold'em Game Launcher
echo ==========================================
echo.
echo Starting game...
echo.

start "" "http://localhost:5173"
npm run dev

echo.
echo Game started!
echo If browser doesn't open automatically, please visit: http://localhost:5173
echo.
pause
