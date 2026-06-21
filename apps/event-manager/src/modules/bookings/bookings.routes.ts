import type { FastifyInstance, FastifyReply } from "fastify";
import { UserRole } from "@event-booking/types";
import {
  createBookingRouteSchema,
  getMyBookingsRouteSchema,
} from "../../docs/openapi.js";
import { authenticate, getAuthUser } from "../../middleware/authenticate.js";
import { authorize } from "../../middleware/authorize.js";
import { createBookingSchema } from "./bookings.schema.js";
import { BookingsService } from "./bookings.service.js";

export async function bookingsRoutes(app: FastifyInstance) {
  const bookingsService = new BookingsService(app.config.REDIS_URL);

  app.post(
    "/",
    {
      preHandler: [authenticate, authorize(UserRole.CUSTOMER)],
      schema: createBookingRouteSchema,
    },
    async (request, reply: FastifyReply) => {
      const input = createBookingSchema.parse(request.body);
      const user = getAuthUser(request);
      const booking = await bookingsService.create(user.userId, input);

      return reply.status(201).send({ success: true, data: booking });
    },
  );

  app.get(
    "/me",
    {
      preHandler: [authenticate, authorize(UserRole.CUSTOMER)],
      schema: getMyBookingsRouteSchema,
    },
    async (request) => {
      const user = getAuthUser(request);
      const bookings = await bookingsService.getMyBookings(user.userId);

      return { success: true, data: bookings };
    },
  );
}