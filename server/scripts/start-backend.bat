@echo off
title STEM Center Backend
color 0A

echo ========================================
echo   STEM Center Backend Server
echo ========================================
echo.

:: Check if Ollama is running
tasklist /FI "IMAGENAME eq ollama.exe" 2>NUL | find /I /N "ollama.exe">NUL
if "%ERRORLEVEL%"=="1" (
    echo [1/2] Starting Ollama...
    start "" /B ollama serve
    timeout /t 3 /nobreak >NUL
    echo       Ollama started!
) else (
    echo [1/2] Ollama already running
)

echo.
echo [2/2] Starting backend server on port 3001...
echo.
echo Backend will be available at:
echo   - Local:  http://localhost:3001
echo   - Public: https://stem-api.meetpratham.me
echo.
echo Press Ctrl+C to stop the server
echo ========================================
echo.

cd /d "%USERPROFILE%\stem-center-backend\server"
npm run start
