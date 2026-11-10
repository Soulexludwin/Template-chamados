@echo off
title Redefinir Senha do Tecnico - Suporte TI
color 0E

echo ====================================================
echo       REDEFINICAO DE SENHA DO MODO TECNICO
echo ====================================================
echo.

set /p NOVASENHA=Digite a nova senha para o Modo Tecnico: 

if "%NOVASENHA%"=="" (
    echo.
    echo [ERRO] A senha nao pode ser vazia!
    echo.
    pause
    exit /b 1
)

echo {"senhaTecnico": "%NOVASENHA%"} > config.json

echo.
echo ====================================================
echo [SUCESSO] Senha atualizada com sucesso!
echo A nova senha ja esta valendo no sistema.
echo ====================================================
echo.
pause
