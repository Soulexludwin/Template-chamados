@echo off
title Instalacao do Sistema de Chamados - Suporte TI
color 0A

echo ====================================================
echo          INSTALANDO SISTEMA DE CHAMADOS
echo ====================================================
echo.

echo [1/4] Instalando dependencias do projeto...
call npm install
if %errorlevel% neq 0 (
    echo ERRO: Falha ao instalar dependencias do NPM.
    pause
    exit /b %errorlevel%
)

echo.
echo [2/4] Liberando scripts nativos (better-sqlite3 / esbuild)...
call npm install-scripts approve better-sqlite3 esbuild
call npm rebuild

echo.
echo [3/4] Sincronizando banco de dados SQLite...
call npx drizzle-kit push

echo.
echo [4/4] Gerando o inicializador (executar_servidor.bat)...
echo @echo off > executar_servidor.bat
echo title Servidor de Chamados TI - Rodando... >> executar_servidor.bat
echo color 0B >> executar_servidor.bat
echo echo ==================================================== >> executar_servidor.bat
echo echo        SERVIDOR DE CHAMADOS TI INICIADO              >> executar_servidor.bat
echo echo ==================================================== >> executar_servidor.bat
echo echo. >> executar_servidor.bat
echo npm run dev >> executar_servidor.bat
echo pause >> executar_servidor.bat

echo.
echo ====================================================
echo   INSTALACAO CONCLUIDA COM SUCESSO!
echo   Para iniciar o sistema, execute o 'executar_servidor.bat'
echo ====================================================
echo.
pause