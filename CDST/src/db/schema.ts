import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const chamados = sqliteTable("chamados", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  clientId: text("client_id").notNull(),
  solicitante: text("solicitante").notNull(),
  titulo: text("titulo").notNull(),
  descricao: text("descricao").notNull(),
  prioridade: text("prioridade").default("Média").notNull(),
  status: text("status").default("Aberto").notNull(),
  criadoEm: text("criado_em").notNull(),
  notasConclusao: text("notas_conclusao"),
  anexo: text("anexo"),
});

export const mensagens = sqliteTable("mensagens", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  chamadoId: integer("chamado_id").notNull(),
  autor: text("autor").notNull(),
  texto: text("texto"),
  anexo: text("anexo"),
  criadoEm: text("criado_em").notNull(),
});

export type Mensagem = typeof mensagens.$inferSelect;
export type Chamado = typeof chamados.$inferSelect;