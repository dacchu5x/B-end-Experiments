@echo off
cd /d "%~dp0"
if not exist node_modules\express npm install
npm start
pause
