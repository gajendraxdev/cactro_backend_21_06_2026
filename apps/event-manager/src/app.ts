import Fastify from "fastify";
import cors from "@fastify/cors";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import configPlugin from "./plugins/config.js";
import jwtPlugin from "./plugins/jwt.js";
import errorHandlerPlugin from "./plugins/error-handler.js";
import { authRoutes } from "./modules/auth/auth.routes.js";
import { eventsRoutes } from "./modules/events/events.routes.js";
import { bookingsRoutes } from "./modules/bookings/bookings.routes.js";

export async function buildApp() {
  const app = Fastify({
    logger: {
      level: process.env.NODE_ENV === "production" ? "info" : "debug",
      transport:
        process.env.NODE_ENV !== "production"
          ? { target: "pino-pretty", options: { colorize: true } }
          : undefined,
    },
  });

  await app.register(configPlugin);
  await app.register(cors, { origin: true });
  await app.register(jwtPlugin);
  await app.register(errorHandlerPlugin);

  await app.register(swagger, {
    openapi: {
      info: {
        title: "Event Booking System API",
        description: "REST API for event management and ticket booking",
        version: "1.0.0",
      },
      components: {
        securitySchemes: {
          bearerAuth: {
            type: "http",
            scheme: "bearer",
            bearerFormat: "JWT",
          },
        },
      },
    },
  });

  await app.register(swaggerUi, {
    routePrefix: "/docs",
  });

  app.get("/health", async () => ({
    success: true,
    data: {
      status: "ok",
      timestamp: new Date().toISOString(),
    },
  }));

  await app.register(authRoutes, { prefix: "/auth" });
  await app.register(eventsRoutes, { prefix: "/events" });
  await app.register(bookingsRoutes, { prefix: "/bookings" });

  return app;
}