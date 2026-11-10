import { FastifyInstance } from "fastify";
import { eq } from "drizzle-orm";
import fs from "fs";
import path from "path";
import { db } from "../db/index.js";
import { chamados } from "../db/schema.js";
import { notificarNovoChamado } from "../services/notifier.js";

// Função para obter a senha atualizada do config.json
function obterSenhaTecnico(): string {
  try {
    const configPath = path.join(process.cwd(), "config.json");
    if (fs.existsSync(configPath)) {
      const content = fs.readFileSync(configPath, "utf-8");
      const data = JSON.parse(content);
      return data.senhaTecnico || "admin123";
    }
  } catch (err) {
    console.error("Erro ao ler config.json, utilizando senha padrao:", err);
  }
  return "admin123";
}

interface CriarChamadoBody {
  clientId: string;
  solicitante: string;
  titulo: string;
  descricao: string;
  prioridade?: "Baixa" | "Média" | "Alta";
}

export async function ticketRoutes(fastify: FastifyInstance) {
  // 1. Rota pública: Solicitante consulta APENAS chamados da própria máquina (Sem botões de alteração)
  fastify.get<{ Querystring: { clientId?: string } }>("/chamados/meus", async (request, reply) => {
    const { clientId } = request.query;
    if (!clientId) {
      return reply.status(400).send({ error: "clientId não fornecido." });
    }
    return await db.select().from(chamados).where(eq(chamados.clientId, clientId));
  });

  // 2. Rota restrita (Técnico): Consulta a lista global de todos os chamados
  fastify.get<{ Headers: { "x-tech-password"?: string } }>("/admin/chamados", async (request, reply) => {
    const senha = request.headers["x-tech-password"];
    if (senha !== obterSenhaTecnico()) {
      return reply.status(401).send({ error: "Senha do modo técnico inválida." });
    }
    return await db.select().from(chamados);
  });

  // 3. Rota pública: Criar novo chamado
  fastify.post<{ Body: CriarChamadoBody }>("/chamados", async (request, reply) => {
    const { clientId, solicitante, titulo, descricao, prioridade } = request.body;

    const [chamadoCriado] = await db.insert(chamados).values({
      clientId: clientId || "desconhecido",
      solicitante,
      titulo,
      descricao,
      prioridade
    }).returning();

    try {
      notificarNovoChamado(chamadoCriado);
    } catch (e) {
      console.error("Erro ao disparar notificação:", e);
    }

    return reply.status(201).send(chamadoCriado);
  });

  // 4. Rota RESTRICTA de alteração de status: Exige senha de técnico válida
  fastify.patch<{ Params: { id: string }; Body: { status: "Aberto" | "Em Atendimento" | "Concluído" }; Headers: { "x-tech-password"?: string } }>(
    "/admin/chamados/:id/status",
    async (request, reply) => {
      const senha = request.headers["x-tech-password"];
      if (senha !== obterSenhaTecnico()) {
        return reply.status(401).send({ error: "Permissão negada. Apenas técnicos podem alterar o status do chamado." });
      }

      const ticketId = Number(request.params.id);
      const { status } = request.body;

      const [chamadoAtualizado] = await db
        .update(chamados)
        .set({ status })
        .where(eq(chamados.id, ticketId))
        .returning();

      return reply.send(chamadoAtualizado);
    }
  );
}
