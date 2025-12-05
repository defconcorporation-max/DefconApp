@echo off
echo Launching VideoAutomationTool_v59_Debug_Console.exe...
"dist\VideoAutomationTool_v59_Debug_Console.exe"
if %errorlevel% neq 0 (
    echo.
    echo CRITICAL ERROR OCCURRED!
    echo Error Code: %errorlevel%
)
echo.
echo Press any key to close this window...
pause
