@echo off
echo Starting server and client...

start "Server" cmd /k "cd server && npm run dev"
start "Client" cmd /k "cd client && npm run dev"

echo Both services started in separate windows.
