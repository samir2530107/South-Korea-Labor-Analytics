@echo off
title South Korea Labor Analytics
echo Starting backend (port 5000) and frontend (port 5173)...
echo Make sure MySQL is running first.
start "Backend - API" cmd /k "cd /d %~dp0backend && npm start"
start "Frontend - React" cmd /k "cd /d %~dp0frontend && npm run dev"
timeout /t 6 >nul
start http://localhost:5173
