import type { FastifyError, FastifyReply } from "fastify";
import fp from "fastify-plugin";
import { ZodError } from "zod";
import { AppError } from "../utils/app-error.js";

async function errorHandlerPlugin(fastify: import("fastify").FastifyInstance) {
  fastify.setErrorHandler(
    (error: FastifyError | AppError | ZodError, _request, reply: FastifyReply) => {
      if (error instanceof ZodError) {
        return reply.status(400).send({
          success: false,
          message: "Validation failed",
          errors: error.errors.map((issue) => issue.message),
        });
      }

      if (error instanceof AppError) {
        fastify.log.error(error);
        return reply.status(error.statusCode).send({
          success: false,
          message: error.message,
          errors: error.errors,
        });
      }

      if (error.validation) {
        return reply.status(400).send({
          success: false,
          message: "Validation failed",
          errors: error.validation.map((issue) => issue.message),
        });
      }

      fastify.log.error(error);
      return reply.status(500).send({
        success: false,
        message: "Internal server error",
        errors: [],
      });
    },
  );
}

export default fp(errorHandlerPlugin);