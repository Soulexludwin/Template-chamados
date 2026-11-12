import notifier from "node-notifier";
import type { Chamado } from "../db/schema.js";

export function notificarNovoChamado(chamado: Chamado): void {
  notifier.notify(
    {
      title: `🔔 Novo Chamado #${chamado.id} [${chamado.prioridade}]`,
      message: `${chamado.solicitante}: ${chamado.titulo}`,
      sound: true,
      wait: false
    },
    (err) => {
      if (err) {
        console.error("Erro ao disparar notificação do Windows:", err);
      }
    }
  );
}