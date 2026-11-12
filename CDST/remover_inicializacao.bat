@echo off
title Remover Inicializacao Automatica
color 0C

set VBS_NAME=iniciar_chamados_oculto.vbs
set STARTUP_DIR=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup

if exist "%STARTUP_DIR%\%VBS_NAME%" (
    del "%STARTUP_DIR%\%VBS_NAME%"
    echo [SUCESSO] Inicializacao automatica removida com sucesso.
) else (
    echo [INFO] Nenhuma inicializacao automatica configurada para este projeto.
)

echo.
pause
