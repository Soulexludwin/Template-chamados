@echo off
title Configurar Inicializacao Automatica
color 0A

set PASTA_PROJETO=%~dp0
set VBS_NAME=iniciar_chamados_oculto.vbs
set STARTUP_DIR=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup

echo ====================================================
echo   CONFIGURANDO SERVIDOR PARA INICIAR COM O WINDOWS
echo ====================================================
echo.

:: Gerando o script VBScript que roda o bat de forma 100%% oculta
echo Set WshShell = CreateObject("WScript.Shell") > "%STARTUP_DIR%\%VBS_NAME%"
echo WshShell.Run """%PASTA_PROJETO%iniciar_servidor.bat""", 0, False >> "%STARTUP_DIR%\%VBS_NAME%"

echo [SUCESSO] O sistema agora sera iniciado automaticamente com o Windows!
echo Ele rodara em segundo plano (sem janela do CMD).
echo.
pause
