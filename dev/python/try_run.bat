@echo off
rem Перейти в папку скрипта
cd /d "%~dp0"

echo Запуск e_fontTools...
python e_fontTools_convert.py

echo.
echo Нажмите любую клавишу, чтобы выйти...
pause >nul