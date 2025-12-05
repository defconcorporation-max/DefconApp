@echo off
cd /d "F:\antigravity agents\VideoAutomationApp"
echo Running gui.py...
python gui.py
if %errorlevel% neq 0 (
    echo.
    echo CRITICAL PYTHON ERROR:
    echo ---------------------------------------------------
)
pause
