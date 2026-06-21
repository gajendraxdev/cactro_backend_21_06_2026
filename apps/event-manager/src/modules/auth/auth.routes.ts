import type { FastifyInstance } from "fastify";
import {
  loginRouteSchema,
  registerRouteSchema,
} from "../../docs/openapi.js";
import { registerSchema, loginSchema } from "./auth.schema.js";
import { AuthService } from "./auth.service.js";

export async function authRoutes(app: FastifyInstance) {
  const authService = new AuthService(app);

  app.post(
    "/register",
    { schema: registerRouteSchema },
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
    { schema: loginRouteSchema },
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