import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { eq, desc, asc, sql } from "drizzle-orm";
import fs from "fs";
import path from "path";
import { pipeline } from "stream/promises";
import { randomUUID, createHash } from "crypto";
import { db } from "../db/index.js";
import { chamados, mensagens } from "../db/schema.js";

const uploadDir = path.join(process.cwd(), "uploads");
const configPath = path.join(process.cwd(), "config.json");

function obterSenhaConfig(): string {
  try {
    if (fs.existsSync(configPath)) {
      const raw = fs.readFileSync(configPath, "utf-8").replace(/^\uFEFF/, "").trim();
      const parsed = JSON.parse(raw);

      const candidatos = [
        parsed.senhaTecnico,
        parsed.senha_tecnico,
        parsed.techPassword,
        parsed.tech_password,
        parsed.adminPassword,
        parsed.admin_password,
        parsed.password,
        parsed.senha,
      ];

      for (const val of candidatos) {
        if (typeof val === "string" && val.trim() !== "") {
          return val.trim();
        }
      }

      // Fallback: pega a primeira string definida no config.json
      const primeiraString = Object.values(parsed).find(
        (v): v is string => typeof v === "string" && v.trim() !== ""
      );
      if (primeiraString) return primeiraString.trim();
    }
  } catch (err) {
    console.error("Erro ao ler config.json:", err);
  }
  return "admin123";
}

function validarTecnico(req: FastifyRequest, reply: FastifyReply): boolean {
  const senhaRecebida = String(req.headers["x-tech-password"] || "").trim();
  const senhaConfig = obterSenhaConfig();

  if (!senhaRecebida) {
    reply.code(401).send({ error: "Senha técnica não informada." });
    return false;
  }

  const hashRecebido = createHash("sha256").update(senhaRecebida).digest("hex");
  const valida =
    senhaRecebida === senhaConfig ||
    hashRecebido.toLowerCase() === senhaConfig.toLowerCase();

  if (!valida) {
    reply.code(401).send({ error: "Senha técnica inválida." });
    return false;
  }
  return true;
}

async function garantirEstruturaBanco() {
  try {
    await db.run(sql`
      CREATE TABLE IF NOT EXISTS mensagens (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        chamado_id INTEGER NOT NULL,
        autor TEXT NOT NULL,
        texto TEXT,
        anexo TEXT,
        criado_em TEXT NOT NULL
      )
    `);
  } catch (err) {
    console.error("Aviso ao verificar tabela mensagens:", err);
  }

  try {
    await db.run(sql`ALTER TABLE chamados ADD COLUMN notas_conclusao TEXT`);
  } catch {
    // Coluna já existe
  }

  try {
    await db.run(sql`ALTER TABLE chamados ADD COLUMN anexo TEXT`);
  } catch {
    // Coluna já existe
  }
}

async function processarMultipart(req: FastifyRequest) {
  const fields: Record<string, string> = {};
  let anexoUrl: string | null = null;

  if (!req.isMultipart()) {
    const body = (req.body as Record<string, any>) || {};
    for (const [k, v] of Object.entries(body)) {
      if (v !== undefined && v !== null) fields[k] = String(v);
    }
    return { fields, anexoUrl };
  }

  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  for await (const part of req.parts()) {
    if (part.type === "file") {
      if (part.filename && part.filename.trim() !== "") {
        const ext = path.extname(part.filename) || ".png";
        const nomeArquivo = `${Date.now()}-${randomUUID()}${ext}`;
        const caminhoDestino = path.join(uploadDir, nomeArquivo);
        await pipeline(part.file, fs.createWriteStream(caminhoDestino));
        anexoUrl = `/uploads/${nomeArquivo}`;
      } else {
        part.file.resume();
      }
    } else {
      fields[part.fieldname] = String(part.value ?? "");
    }
  }

  return { fields, anexoUrl };
}

export async function ticketRoutes(app: FastifyInstance) {
  await garantirEstruturaBanco();

  // 1. Listar chamados do portal do usuário (filtrados por setor)
  app.get("/chamados/meus", async (req, reply) => {
    const query = req.query as { solicitante?: string };
    const todos = await db.select().from(chamados).orderBy(asc(chamados.id));

    if (query.solicitante && query.solicitante.trim() !== "") {
      const alvo = query.solicitante.trim().toLowerCase();
      return todos.filter((c) => c.solicitante.trim().toLowerCase() === alvo);
    }

    return todos;
  });

  // 2. Criar novo chamado (com foto/print opcional)
  app.post("/chamados", async (req, reply) => {
    try {
      const { fields, anexoUrl } = await processarMultipart(req);

      const solicitante = (fields.solicitante || "").trim();
      const titulo = (fields.titulo || "").trim();
      const descricao = (fields.descricao || "").trim();
      const prioridade = (fields.prioridade || "Média").trim();
      const clientId = (fields.clientId || solicitante || "local").trim();

      if (!solicitante || !titulo || !descricao) {
        return reply.code(400).send({ error: "Setor, título e descrição são obrigatórios." });
      }

      const [novoChamado] = await db
        .insert(chamados)
        .values({
          clientId,
          solicitante,
          titulo,
          descricao,
          prioridade,
          status: "Aberto",
          criadoEm: new Date().toISOString(),
          anexo: anexoUrl,
        })
        .returning();

      return reply.code(201).send(novoChamado);
    } catch (err: any) {
      req.log.error(err);
      return reply.code(500).send({
        error: `Erro interno ao salvar chamado: ${err?.message || "desconhecido"}`,
      });
    }
  });

  // 3. Listar todos os chamados (Painel Técnico)
  app.get("/admin/chamados", async (req, reply) => {
    if (!validarTecnico(req, reply)) return;
    return await db.select().from(chamados).orderBy(desc(chamados.id));
  });

  // 4. Alterar status do chamado (Atender / Concluir)
  const atualizarStatusHandler = async (req: FastifyRequest, reply: FastifyReply) => {
    if (!validarTecnico(req, reply)) return;

    const params = req.params as { id: string };
    const idNum = Number(params.id);
    if (isNaN(idNum)) {
      return reply.code(400).send({ error: "ID de chamado inválido." });
    }

    const body = (req.body as { status?: string; notasConclusao?: string | null }) || {};
    const status = (body.status || "").trim();

    if (!status) {
      return reply.code(400).send({ error: "Novo status é obrigatório." });
    }

    const updateData: { status: string; notasConclusao?: string | null } = { status };
    if (body.notasConclusao !== undefined) {
      updateData.notasConclusao = body.notasConclusao;
    }

    const [atualizado] = await db
      .update(chamados)
      .set(updateData)
      .where(eq(chamados.id, idNum))
      .returning();

    if (!atualizado) {
      return reply.code(404).send({ error: "Chamado não encontrado." });
    }

    return atualizado;
  };

  app.patch("/admin/chamados/:id/status", atualizarStatusHandler);
  app.put("/admin/chamados/:id/status", atualizarStatusHandler);

  // 5. Listar mensagens do chat de um chamado
  app.get("/chamados/:id/mensagens", async (req, reply) => {
    const params = req.params as { id: string };
    const idNum = Number(params.id);
    if (isNaN(idNum)) {
      return reply.code(400).send({ error: "ID de chamado inválido." });
    }

    return await db
      .select()
      .from(mensagens)
      .where(eq(mensagens.chamadoId, idNum))
      .orderBy(asc(mensagens.id));
  });

  // 6. Enviar nova mensagem no chat (texto e/ou print)
  app.post("/chamados/:id/mensagens", async (req, reply) => {
    try {
      const params = req.params as { id: string };
      const idNum = Number(params.id);
      if (isNaN(idNum)) {
        return reply.code(400).send({ error: "ID de chamado inválido." });
      }

      const { fields, anexoUrl } = await processarMultipart(req);
      const autor = (fields.autor || "solicitante").trim();
      const texto = (fields.texto || "").trim();

      if (autor === "tecnico" && !validarTecnico(req, reply)) {
        return;
      }

      if (!texto && !anexoUrl) {
        return reply.code(400).send({ error: "Envie uma mensagem de texto ou anexe uma imagem." });
      }

      const [novaMensagem] = await db
        .insert(mensagens)
        .values({
          chamadoId: idNum,
          autor,
          texto: texto || null,
          anexo: anexoUrl,
          criadoEm: new Date().toISOString(),
        })
        .returning();

      return reply.code(201).send(novaMensagem);
    } catch (err: any) {
      req.log.error(err);
      return reply.code(500).send({
        error: `Erro interno ao enviar mensagem: ${err?.message || "desconhecido"}`,
      });
    }
  });
}