🖥️ Sistema de Chamados de TI (Local)

Aplicação web enxuta e de alta performance, desenvolvida para a gestão de chamados internos de TI em redes locais.

O projeto utiliza SQLite embarcado, dispensando a instalação de servidores de banco de dados pesados, e possui notificações nativas integradas ao Windows.

Os scripts de instalação e inicialização automatizados (.bat) detectam dinamicamente o diretório do projeto, ajustando nomes de processos e atalhos de acordo com a pasta escolhida pelo usuário.

🚀 Tecnologias Utilizadas
Backend: Node.js, Fastify, TypeScript.
Banco de Dados: SQLite (via better-sqlite3 e Drizzle ORM).
Notificações: node-notifier (alertas nativos do Windows).
Frontend: HTML5, JavaScript moderno (ES6+) e Tailwind CSS (via CDN).
Automação: Windows Batch Scripts (.bat).
✨ Funcionalidades
👤 Visão do Solicitante

Identificação automática da máquina (clientId via localStorage). O usuário visualiza apenas os chamados abertos pelo seu próprio navegador.

🛠️ Painel do Técnico (/tecnico)

Área administrativa protegida por senha, destinada à equipe de TI, permitindo visualizar a fila global de chamados, gerenciar solicitações e alterar seus respectivos status.

🔔 Alertas Nativos no Host

Emissão de avisos visuais e sonoros no centro de notificações do Windows sempre que um chamado é registrado.

⚙️ Instalação Dinâmica

Script .bat que baixa as dependências, compila binários C++ e gera o script de inicialização adaptado ao nome da pasta atual do projeto.

🛠️ Pré-requisitos

Antes de instalar, certifique-se de que a máquina host possui:

Node.js: versão 18 ou superior.
Sistema Operacional: Windows 10 ou Windows 11 (necessário para suporte às notificações nativas e aos scripts .bat).
📦 Instalação
1. Clonar ou baixar o repositório
bash
git clone https://github.com/SEU_USUARIO/NOME_DO_REPOSITORIO.git

2. Executar a instalação automatizada

Navegue até a pasta do projeto e dê um duplo clique no arquivo:

text
instalar.bat


O script realizará automaticamente as seguintes tarefas:

Download dos pacotes NPM.
Aprovação dos binários nativos do better-sqlite3.
Aplicação do esquema no banco de dados SQLite.
Geração do arquivo de execução iniciar_servidor.bat.
3. Iniciar a aplicação

Após a instalação, dê um duplo clique no arquivo gerado:

text
iniciar_servidor.bat

4. Acessar o sistema

Com o servidor iniciado, acesse pelo navegador:

Acesso	Endereço
Solicitantes (Local)	http://localhost:3000
Solicitantes (Rede)	http://IP_DA_MAQUINA:3000
Painel do Técnico	http://localhost:3000/tecnico

Senha padrão do painel técnico: admin123

⚠️ Atenção: Recomenda-se alterar a senha padrão antes de disponibilizar o sistema na rede.
🔍 Troubleshooting (Resolução de Problemas)
1. Erro de política de execução no PowerShell (ExecutionPolicy)

Sintoma: Mensagem de erro informando que a execução de scripts foi desabilitada no sistema ao executar comandos NPM.

Solução:

Abra o PowerShell como Administrador e execute:

powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

2. Notificações do Windows não aparecem no Host

Sintoma: O chamado é cadastrado, mas nenhum alerta sonoro ou pop-up aparece no canto da tela.

Possíveis soluções:

Certifique-se de que o Assistente de Foco / Não Perturbe do Windows está desativado (Win + A).
Acesse Configurações > Sistema > Notificações e verifique se a opção "Obter notificações de aplicativos" está ativada.
Verifique se as notificações não estão acumuladas dentro da Central de Ações, ao lado do relógio do Windows.
3. Erro SQLite_ERROR: no such table: chamados

Sintoma: Ao acessar o sistema, a tela exibe um erro informando que a tabela chamados não existe.

Solução:

Feche a aplicação e execute a sincronização manual do banco de dados pelo terminal, na pasta do projeto:

bash
npx drizzle-kit push

4. Conflito de Porta (Port 3000 already in use)

Sintoma: O servidor falha ao iniciar, informando o erro:

text
EADDRINUSE: address already in use :::3000


Causa: Outra aplicação ou uma instância anterior do Node.js está ocupando a porta 3000.

Solução 1 – Finalizar todas as instâncias do Node.js:

Execute no terminal do Windows:

dos
taskkill /f /im node.exe


Solução 2 – Alterar a porta do sistema:

Caso prefira utilizar outra porta, edite o arquivo:

text
src/server.ts


Altere a configuração:

typescript
port: 3000


Para a porta desejada, por exemplo:

typescript
port: 8080

5. Falha de scripts bloqueados (npm install-scripts)

Sintoma: Erro de compilação relacionado ao better-sqlite3 ou esbuild após executar o npm install.

Solução:

Execute a liberação manual dos scripts nativos utilizando os comandos:

bash
npm install-scripts approve better-sqlite3 esbuild
npm rebuild

6. Senha invalida

A senha padrão desse template é admin123

mas ela pode ser alterada com o arquivo de redefinir senha na pasta, ele é acessivel somente ao pc do host, então tome cuidado.

📌 Observações
O sistema foi desenvolvido para funcionar em redes locais.
O banco de dados SQLite é armazenado localmente, dispensando a necessidade de um servidor de banco de dados externo.
As notificações nativas dependem das configurações do Windows na máquina host.
A instalação e inicialização são automatizadas por scripts .bat.

Desenvolvido para facilitar e centralizar o atendimento interno de TI. 🖥️
