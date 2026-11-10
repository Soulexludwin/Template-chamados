import { FastifyInstance } from "fastify";
import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { chamados } from "../db/schema.js";
import { notificarNovoChamado } from "../services/notifier.js";

const SENHA_TECNICO = "admin123";

interface CriarChamadoBody {
  clientId: string;
  solicitante: string;
  titulo: string;
  descricao: string;
  prioridade?: "Baixa" | "Média" | "Alta";
}

export async function ticketRoutes(fastify: FastifyInstance) {
  // Chamados da própria máquina
  fastify.get<{ Querystring: { clientId?: string } }>("/chamados/meus", async (request, reply) => {
    const { clientId } = request.query;
    if (!clientId) {
      return reply.status(400).send({ error: "clientId não fornecido." });
    }
    return await db.select().from(chamados).where(eq(chamados.clientId, clientId));
  });

  // Todos os chamados (Admin / Técnico)
  fastify.get<{ Headers: { "x-tech-password"?: string } }>("/admin/chamados", async (request, reply) => {
    const senha = request.headers["x-tech-password"];
    if (senha !== SENHA_TECNICO) {
      return reply.status(401).send({ error: "Senha inválida." });
    }
    return await db.select().from(chamados);
  });

  // Criar chamado gravando o clientId
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
      console.error("Erro na notificação:", e);
    }

    return reply.status(201).send(chamadoCriado);
  });

  // Alterar Status
  fastify.patch<{ Params: { id: string }; Body: { status: "Aberto" | "Em Atendimento" | "Concluído" }; Headers: { "x-tech-password"?: string } }>(
    "/admin/chamados/:id/status",
    async (request, reply) => {
      const senha = request.headers["x-tech-password"];
      if (senha !== SENHA_TECNICO) {
        return reply.status(401).send({ error: "Acesso negado." });
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
