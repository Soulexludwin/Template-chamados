import Fastify from "fastify";
import fastifyStatic from "@fastify/static";
import fastifyCors from "@fastify/cors";
import fastifyHelmet from "@fastify/helmet";
import fastifyRateLimit from "@fastify/rate-limit";
import fastifyMultipart from "@fastify/multipart";
import fs from "fs";
import path from "path";
import { ticketRoutes } from "./routes/tickets.js";

const app = Fastify({ logger: true });

// 1. Configurar pasta de uploads e cache de 72 horas
const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Tarefa de limpeza de arquivos com mais de 72 horas
function limparCacheAntigo() {
  fs.readdir(uploadDir, (err, files) => {
    if (err) return;
    const agora = Date.now();
    const limite72h = 72 * 60 * 60 * 1000; // 72 horas em milissegundos

    files.forEach(file => {
      const filePath = path.join(uploadDir, file);
      fs.stat(filePath, (err, stats) => {
        if (err) return;
        if (agora - stats.mtimeMs > limite72h) {
          fs.unlink(filePath, () => {});
        }
      });
    });
  });
}

// Executa a verificação de limpeza a cada 1 hora
setInterval(limparCacheAntigo, 60 * 60 * 1000);

// Registrar plugin Multipart
await app.register(fastifyMultipart, {
  limits: { fileSize: 10 * 1024 * 1024 } // Limite de 10MB por imagem
});

// Servir arquivos de upload estaticamente
app.register(fastifyStatic, {
  root: uploadDir,
  prefix: "/uploads/",
  decorateReply: false,
});

// Segurança e rotas (Helmet, CORS, Rate Limit)
await app.register(fastifyHelmet, {
  contentSecurityPolicy: false, // Permite carregar imagens locais sem bloqueio
});

await app.register(fastifyCors, {
  origin: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"]
});

await app.register(fastifyRateLimit, {
  max: 200,
  timeWindow: "1 minute"
});

app.register(fastifyStatic, {
  root: path.join(process.cwd(), "public"),
  prefix: "/",
  extensions: ["html"],
});

app.register(ticketRoutes);

const start = async () => {
  try {
    await app.listen({ port: 3000, host: "0.0.0.0" });
    console.log("🚀 Servidor rodando com sistema de cache de 72h para imagens!");
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();