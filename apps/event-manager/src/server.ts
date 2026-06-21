import { prisma } from "@event-booking/db";
import { closeQueues, closeRedisConnection } from "@event-booking/queue";
import { buildApp } from "./app.js";

async function start() {
  const app = await buildApp();
  const { PORT } = app.config;

  await app.listen({ port: PORT, host: "0.0.0.0" });
  app.log.info(`Event manager listening on port ${PORT}`);
  app.log.info(`Swagger docs available at http://localhost:${PORT}/docs`);

  const shutdown = async (signal: string) => {
    app.log.info(`Received ${signal}, shutting down gracefully...`);

    try {
      await app.close();
      await closeQueues();
      await closeRedisConnection();
      await prisma.$disconnect();
      app.log.info("Shutdown complete");
      process.exit(0);
    } catch (error) {
      app.log.error(error, "Error during shutdown");
      process.exit(1);
    }
  };

  process.on("SIGINT", () => void shutdown("SIGINT"));
  process.on("SIGTERM", () => void shutdown("SIGTERM"));
}

start().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});