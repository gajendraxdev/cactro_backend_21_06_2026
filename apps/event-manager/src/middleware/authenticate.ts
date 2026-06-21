import type { FastifyReply, FastifyRequest } from "fastify";
import type { JwtPayload } from "@event-booking/types";
import { AppError } from "../utils/app-error.js";

export async function authenticate(
  request: FastifyRequest,
  _reply: FastifyReply,
): Promise<void> {
  try {
    await request.jwtVerify();
  } catch {
    throw new AppError("Unauthorized", 401);
  }
}

export function getAuthUser(request: FastifyRequest): JwtPayload {
  return request.user as JwtPayload;
}