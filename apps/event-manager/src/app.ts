import Fastify from "fastify";
import cors from "@fastify/cors";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import configPlugin from "./plugins/config.js";
import jwtPlugin from "./plugins/jwt.js";
import errorHandlerPlugin from "./plugins/error-handler.js";
import { API_DESCRIPTION, TAGS, healthRouteSchema } from "./docs/openapi.js";
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
      openapi: "3.1.0",
      info: {
        title: "Event Booking System API",
        description: API_DESCRIPTION,
        version: "1.0.0",
        contact: {
          name: "Event Booking System",
        },
      },
      tags: [...TAGS],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: "http",
            scheme: "bearer",
            bearerFormat: "JWT",
            description:
              "JWT access token from POST /auth/login or POST /auth/register. Payload: { userId, email, role }.",
          },
        },
      },
    },
  });

  await app.register(swaggerUi, {
    routePrefix: "/docs",
  });

  app.get(
    "/health",
    { schema: healthRouteSchema },
    async () => ({
      success: true,
      data: {
        status: "ok",
        timestamp: new Date().toISOString(),
      },
    }),
  );

  await app.register(authRoutes, { prefix: "/auth" });
  await app.register(eventsRoutes, { prefix: "/events" });
  await app.register(bookingsRoutes, { prefix: "/bookings" });

  return app;
}