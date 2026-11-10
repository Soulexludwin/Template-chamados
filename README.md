# 🖥️ Sistema de Chamados de TI (Local)

Aplicação web leve e eficiente para gestão de chamados internos de TI em redes locais.

O projeto utiliza SQLite embarcado, dispensando a instalação de um servidor de banco de dados pesado, e conta com notificações nativas integradas ao Windows.

Os scripts de instalação e inicialização automatizados (`.bat`) detectam dinamicamente o diretório do projeto e ajustam nomes de processos e atalhos conforme a pasta escolhida pelo usuário.

## 🚀 Tecnologias utilizadas

- Backend: Node.js + Fastify + TypeScript
- Banco de dados: SQLite com `better-sqlite3` e Drizzle ORM
- Notificações: `node-notifier` (alertas nativos do Windows)
- Frontend: HTML5, JavaScript moderno (ES6+) e Tailwind CSS via CDN
- Automação: scripts Windows Batch (`.bat`)

## ✨ Funcionalidades

### 👤 Visão do solicitante
Identificação automática da máquina via `clientId` no `localStorage`. O usuário visualiza apenas os chamados abertos pelo seu próprio navegador.

### 🛠️ Painel do técnico (`/tecnico`)
Área administrativa protegida por senha, destinada à equipe de TI. Permite visualizar a fila global de chamados, gerenciar solicitações e alterar o status de cada uma.

### 🔔 Alertas nativos no host
Emissão de avisos visuais e sonoros no centro de notificações do Windows sempre que um chamado é registrado.

### ⚙️ Instalação dinâmica
Script `.bat` que baixa as dependências, compila binários C++ e gera o script de inicialização adaptado ao nome da pasta atual do projeto.

---

## 🛠️ Pré-requisitos

Antes de instalar, certifique-se de que a máquina host possui:

- Node.js 18 ou superior
- Windows 10 ou Windows 11
- Permissão para executar scripts do PowerShell e arquivos `.bat`

> O suporte a notificações nativas e scripts automáticos depende do sistema operacional Windows.

---

## 📦 Instalação

### 1) Clonar ou baixar o repositório

```bash
git clone https://github.com/Soulexludwin/Template-chamados
cd CDST
```

### 2) Executar a instalação automatizada

Navegue até a pasta do projeto e dê um duplo clique no arquivo:

```bat
instalar.bat
```

O script realizará automaticamente:

- Download dos pacotes NPM
- Aprovação dos binários nativos do `better-sqlite3`
- Criação e aplicação do esquema do banco SQLite
- Geração do arquivo de execução `iniciar_servidor.bat`

### 3) Iniciar a aplicação

Após a instalação, dê um duplo clique no arquivo gerado:

```bat
iniciar_servidor.bat
```

### 4) Acessar o sistema

Após o servidor iniciar, acesse no navegador:

| Tipo de acesso | Endereço |
|---|---|
| Solicitantes (Local) | http://localhost:3000 |
| Solicitantes (Rede) | http://IP_DA_MAQUINA:3000 |
| Painel do Técnico | http://localhost:3000/tecnico |

Senha padrão do painel técnico:

```text
admin123
```

> Recomendado alterar a senha padrão antes de disponibilizar o sistema na rede.

---

## 🔍 Troubleshooting

### 1) Erro de política de execução no PowerShell

Sintoma: mensagem informando que a execução de scripts foi desabilitada ao executar comandos NPM.

Solução:

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

---

### 2) Notificações do Windows não aparecem no host

Sintoma: o chamado é cadastrado, mas nenhum aviso sonoro ou pop-up aparece.

Possíveis soluções:

- Verifique se o Assistente de Foco / Não Perturbe do Windows está desativado (`Win + A`)
- Acesse Configurações > Sistema > Notificações e confirme que a opção "Obter notificações de aplicativos" está ativada
- Verifique se as notificações não estão acumuladas na Central de Ações

---

### 3) Erro `SQLite_ERROR: no such table: chamados`

Sintoma: a tela exibe um erro informando que a tabela `chamados` não existe.

Solução:

```bash
npx drizzle-kit push
```

---

### 4) Conflito de porta (`Port 3000 already in use`)

Sintoma: o servidor falha ao iniciar com:

```text
EADDRINUSE: address already in use :::3000
```

Causa: outra aplicação ou uma instância anterior do Node.js está ocupando a porta 3000.

#### Opção 1: encerrar todas as instâncias do Node.js

```bat
taskkill /f /im node.exe
```

#### Opção 2: alterar a porta do sistema

Edite o arquivo:

```text
src/server.ts
```

E altere:

```typescript
port: 3000
```

para, por exemplo:

```typescript
port: 8080
```

---

### 5) Falha de scripts bloqueados (`npm install-scripts`)

Sintoma: erro de compilação relacionado ao `better-sqlite3` ou ao `esbuild` após executar `npm install`.

Solução:

```bash
npm install-scripts approve better-sqlite3 esbuild
npm rebuild
```

---

### 6) Senha inválida

A senha padrão desse template é:

```text
admin123
```

Ela pode ser alterada por meio do arquivo de redefinição de senha na pasta do sistema, acessível apenas no computador do host. Tome cuidado com esse acesso.

---

## 📌 Observações

- O sistema foi desenvolvido para funcionar em redes locais
- O banco de dados SQLite é armazenado localmente, sem necessidade de um servidor externo
- As notificações nativas dependem das configurações do Windows na máquina host
- A instalação e a inicialização são automatizadas por scripts `.bat`

Desenvolvido para facilitar e centralizar o atendimento interno de TI. 🖥️
