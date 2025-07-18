@echo off
echo Starting GearTrack Frontend...
echo.

REM Check if node_modules exists
if not exist "node_modules" (
    echo Installing dependencies...
    npm install
)

REM Start the development server
echo Starting development server on port 5175...
npx vite --port 5175