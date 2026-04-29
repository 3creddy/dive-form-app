@echo off
setlocal

set "ROOT=%~dp0"
set "BACKEND=%ROOT%backend"
set "PORT=3000"
set "PUBLIC_BASE_URL="
set "PUBLIC_TUNNEL_PROVIDER="
set "NGROK_AUTHTOKEN="

for /f "usebackq tokens=1,* delims==" %%A in ("%BACKEND%\.env") do (
  if /i "%%A"=="PORT" set "PORT=%%B"
  if /i "%%A"=="PUBLIC_BASE_URL" set "PUBLIC_BASE_URL=%%B"
  if /i "%%A"=="PUBLIC_TUNNEL_PROVIDER" set "PUBLIC_TUNNEL_PROVIDER=%%B"
  if /i "%%A"=="NGROK_AUTHTOKEN" set "NGROK_AUTHTOKEN=%%B"
)

set "NGROK_HOST=%PUBLIC_BASE_URL%"
set "NGROK_HOST=%NGROK_HOST:https://=%"
set "NGROK_HOST=%NGROK_HOST:http://=%"
if "%NGROK_HOST:~-1%"=="/" set "NGROK_HOST=%NGROK_HOST:~0,-1%"

cd /d "%BACKEND%"
start "DIVEIndia Forms Server" cmd /k "node server.js"
ping -n 3 127.0.0.1 >nul

if /i "%PUBLIC_TUNNEL_PROVIDER%"=="ngrok" (
  if not "%NGROK_AUTHTOKEN%"=="" (
    powershell -Command "ngrok config add-authtoken %NGROK_AUTHTOKEN% | Out-Null"
  )
  if not "%NGROK_HOST%"=="" (
    start "DIVEIndia Forms ngrok Tunnel" powershell -NoExit -Command "ngrok http %PORT% --url=%NGROK_HOST%"
  ) else (
    start "DIVEIndia Forms ngrok Tunnel" powershell -NoExit -Command "ngrok http %PORT%"
  )
  ping -n 3 127.0.0.1 >nul
)

start "" "http://localhost:3000/admin"
endlocal
