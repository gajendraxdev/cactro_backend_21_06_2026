import type { FastifyReply, FastifyRequest } from "fastify";
import { UserRole } from "@event-booking/types";
import { AppError } from "../utils/app-error.js";
import { getAuthUser } from "./authenticate.js";

export function authorize(...roles: UserRole[]) {
  return async (request: FastifyRequest, _reply: FastifyReply) => {
    const user = getAuthUser(request);

    if (!roles.includes(user.role)) {
      throw new AppError("Forbidden", 403);
    }
  };
}