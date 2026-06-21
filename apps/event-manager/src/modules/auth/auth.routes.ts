import type { FastifyInstance } from "fastify";
import { registerSchema, loginSchema } from "./auth.schema.js";
import { AuthService } from "./auth.service.js";

export async function authRoutes(app: FastifyInstance) {
  const authService = new AuthService(app);

  app.post(
    "/register",
    {
      schema: {
        tags: ["Auth"],
        body: {
          type: "object",
          required: ["name", "email", "password", "role"],
          properties: {
            name: { type: "string" },
            email: { type: "string", format: "email" },
            password: { type: "string" },
            role: { type: "string", enum: ["ORGANIZER", "CUSTOMER"] },
          },
        },
      },
    },
    async (request) => {
      const input = registerSchema.parse(request.body);
      const result = await authService.register(input);

      return {
        success: true,
        data: result,
      };
    },
  );

  app.post(
    "/login",
    {
      schema: {
        tags: ["Auth"],
        body: {
          type: "object",
          required: ["email", "password"],
          properties: {
            email: { type: "string", format: "email" },
            password: { type: "string" },
          },
        },
      },
    },
    async (request) => {
      const input = loginSchema.parse(request.body);
      const result = await authService.login(input);

      return {
        success: true,
        data: result,
      };
    },
  );
}