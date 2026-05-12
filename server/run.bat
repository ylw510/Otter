@echo off
REM Otter backend startup script (Windows)
REM Environment: OTTER_HOST (default 0.0.0.0), OTTER_PORT (default 8000)
REM In Git Bash set port with: export OTTER_PORT=8001 (not cmd "set" syntax)

cd /d "%~dp0"

if not exist ".venv\Scripts\activate.bat" (
    echo Please create a virtual environment and install dependencies:
    echo   python -m venv .venv
    echo   then: .venv\Scripts\pip install -r requirements.txt
    exit /b 1
)

if not exist ".venv\Scripts\uvicorn.exe" (
    echo Virtual environment exists but dependencies are missing. Run:
    echo   PowerShell: .venv\Scripts\pip install -r requirements.txt
    echo   Git Bash:   .venv/Scripts/pip install -r requirements.txt
    exit /b 1
)

if "%OTTER_HOST%"=="" set "OTTER_HOST=0.0.0.0"
if "%OTTER_PORT%"=="" set "OTTER_PORT=8000"

.venv\Scripts\python.exe check_port.py %OTTER_PORT%
if errorlevel 1 exit /b 1

.venv\Scripts\uvicorn main:app --host %OTTER_HOST% --port %OTTER_PORT% --reload %*
