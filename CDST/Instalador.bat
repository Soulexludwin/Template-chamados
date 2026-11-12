@echo off
title Instalacao do Sistema de Chamados - Suporte TI
color 0A

echo =======================================================
echo        INSTALAÇÃO DO SISTEMA DE CHAMADOS - CDST
echo =======================================================
echo.

echo [1/5] Instalando dependencias do projeto...
call npm install
if %errorlevel% neq 0 (
    echo ERRO: Falha ao instalar dependencias do NPM.
    pause
    exit /b %errorlevel%
)

echo.
echo [2/5] Liberando scripts nativos (better-sqlite3 / esbuild)...
call npm install-scripts approve better-sqlite3 esbuild
call npm rebuild

echo.
echo [3/5] Verificando e instalando OpenSSL (para o HTTPS)...
if not exist cert (
    mkdir cert
)

where openssl >nul 2>nul
if %errorlevel% neq 0 (
    echo OpenSSL nao encontrado. Tentando instalar via Winget (Windows)...
    winget install --id ShiningLight.OpenSSL -e --silent --accept-package-agreements --accept-source-agreements >nul 2>nul
    
    :: Atualizando o PATH temporariamente para localizar o OpenSSL recém-instalado...
    set "PATH=%PATH%;C:\Program Files\OpenSSL-Win64\bin"
)

:: Tentando gerar o certificado, se o OpenSSL estiver disponível...
where openssl >nul 2>nul
if %errorlevel% eq 0 (
    openssl req -nodes -new -x509 -keyout cert\key.pem -out cert\cert.pem -days 365 -subj "/CN=192.168.18.11" 2>nul
    echo [SUCESSO] Certificado SSL gerado com sucesso! (Modo HTTPS Ativo)
) else (
    echo [INFO] Nao foi possivel instalar o OpenSSL automaticamente.
    echo O sistema funcionara normalmente em modo HTTP padrao.
)

echo.
echo [4/5] Sincronizando banco de dados SQLite (Drizzle ORM)...
call npx drizzle-kit push

echo.
echo [5/5] Gerando o inicializador (executar_servidor.bat)...
echo @echo off > executar_servidor.bat
echo title Servidor de Chamados TI - Rodando... >> executar_servidor.bat
echo color 0B >> executar_servidor.bat
echo echo ==================================================== >> executar_servidor.bat
echo echo         SERVIDOR DE CHAMADOS TI INICIADO           >> executar_servidor.bat
echo echo ==================================================== >> executar_servidor.bat
echo echo. >> executar_servidor.bat
echo npm run dev >> executar_servidor.bat
echo pause >> executar_servidor.bat

echo.
echo ====================================================
echo    INSTALACAO CONCLUIDA COM SUCESSO!
echo    Para iniciar o sistema, execute o 'executar_servidor.bat'
echo ====================================================
echo.
pause