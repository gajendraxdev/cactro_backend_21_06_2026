import fp from "fastify-plugin";
import fjwt from "@fastify/jwt";
import type { JwtPayload } from "@event-booking/types";

declare module "@fastify/jwt" {
  interface FastifyJWT {
    payload: JwtPayload;
    user: JwtPayload;
  }
}

async function jwtPlugin(fastify: import("fastify").FastifyInstance) {
  await fastify.register(fjwt, {
    secret: fastify.config.JWT_SECRET,
  });
}

export default fp(jwtPlugin);