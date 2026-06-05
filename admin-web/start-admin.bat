@echo off
title Manjula Milk Admin
cd /d "%~dp0"
echo.
echo  Starting Admin Web on http://127.0.0.1:5173
echo  Keep this window OPEN while using the admin panel.
echo  Press Ctrl+C to stop the server.
echo.
if not exist "node_modules\" (
  echo Installing dependencies...
  call npm install
)
start "" "http://127.0.0.1:5173/login"
call npm run dev
