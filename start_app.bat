@echo off
cd /d "%~dp0"
echo ==========================================
echo      Travel Agency App Setup & Run
echo ==========================================
echo.

echo [1/4] Checking Client Dependencies...
if exist "client\node_modules" (
    echo Dependencies already installed. Skipping...
) else (
    echo Installing Client Dependencies...
    cd client
    call npm install
    cd ..
    if %errorlevel% neq 0 (
        echo Error installing client dependencies!
        pause
        exit /b
    )
)

echo.
echo [2/4] Checking Server Dependencies...
if exist "server\node_modules" (
    echo Dependencies already installed. Skipping...
) else (
    echo Installing Server Dependencies...
    cd server
    call npm install
    cd ..
    if %errorlevel% neq 0 (
        echo Error installing server dependencies!
        pause
        exit /b
    )
)

echo.
echo [3/4] Starting Backend Server...
cd server
start "Travel Agency Server" npm start
cd ..

echo.
echo [4/4] Starting Frontend Client...
cd client
start "Travel Agency Client" npm run dev
cd ..

echo.
echo ==========================================
echo      SUCCESS! App is launching...
echo ==========================================
echo.
echo Two new windows should have opened (keep them open!).
echo Opening your browser now...
timeout /t 5
start http://localhost:5173

echo.
pause
