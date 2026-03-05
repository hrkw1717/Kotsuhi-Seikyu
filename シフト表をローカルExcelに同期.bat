@echo off
chcp 65001 > nul
cd /d "%~dp0"
echo.
python sync_shift_to_excel.py
echo.
pause
