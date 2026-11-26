@echo off
cd /d "%~dp0"
if not exist node_modules\express (
  echo Installing project dependencies...
  call npm install
  if errorlevel 1 pause & exit /b 1
)
echo Starting Experiment 3...
call npm start
pause
