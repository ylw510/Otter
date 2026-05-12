@echo off
REM Otter 后端启动脚本 (Windows)
REM 环境变量: OTTER_HOST (默认 0.0.0.0), OTTER_PORT (默认 8000)

cd /d "%~dp0"

if not exist ".venv\Scripts\activate.bat" (
    echo 请先创建虚拟环境并安装依赖：
    echo   python -m venv .venv
    echo   .venv\Scripts\pip install -r requirements.txt
    exit /b 1
)

if "%OTTER_HOST%"=="" set "OTTER_HOST=0.0.0.0"
if "%OTTER_PORT%"=="" set "OTTER_PORT=8000"

.venv\Scripts\uvicorn main:app --host %OTTER_HOST% --port %OTTER_PORT% --reload %*