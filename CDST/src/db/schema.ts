import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core';

export const chamados = sqliteTable('chamados', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  solicitante: text('solicitante').notNull(),
  titulo: text('titulo').notNull(),
  descricao: text('descricao').notNull(),
  prioridade: text('prioridade', { enum: ['Baixa', 'Média', 'Alta'] }).default('Média').notNull(),
  status: text('status', { enum: ['Aberto', 'Em Atendimento', 'Concluído'] }).default('Aberto').notNull(),
  criadoEm: text('criado_em').$defaultFn(() => new Date().toISOString())
});

export type NovoChamado = typeof chamados.$inferInsert;
export type Chamado = typeof chamados.$inferSelect;