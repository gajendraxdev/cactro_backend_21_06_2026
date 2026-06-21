import fp from "fastify-plugin";
import { config, type EnvConfig } from "@event-booking/config";

declare module "fastify" {
  interface FastifyInstance {
    config: EnvConfig;
  }
}

async function configPlugin(fastify: import("fastify").FastifyInstance) {
  fastify.decorate("config", config);
}

export default fp(configPlugin);