import Fastify from "fastify";
import fastifyStatic from "@fastify/static";
import path from "path";
import { ticketRoutes } from "./routes/tickets.js";

const app = Fastify({ logger: true });

// Configura a entrega de arquivos estáticos da pasta 'public'
app.register(fastifyStatic, {
  root: path.join(process.cwd(), "public"),
  prefix: "/",
});

app.register(ticketRoutes);

const start = async () => {
  try {
    await app.listen({ port: 3000, host: "0.0.0.0" });
    console.log("🚀 Servidor rodando em http://localhost:3000");
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();