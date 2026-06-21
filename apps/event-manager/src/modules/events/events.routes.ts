import type { FastifyInstance } from "fastify";
import { UserRole } from "@event-booking/types";
import { authenticate, getAuthUser } from "../../middleware/authenticate.js";
import { authorize } from "../../middleware/authorize.js";
import {
  createEventSchema,
  listEventsQuerySchema,
  updateEventSchema,
} from "./events.schema.js";
import { EventsService } from "./events.service.js";

export async function eventsRoutes(app: FastifyInstance) {
  const eventsService = new EventsService(app.config.REDIS_URL);

  app.post(
    "/",
    {
      preHandler: [authenticate, authorize(UserRole.ORGANIZER)],
      schema: {
        tags: ["Events"],
        security: [{ bearerAuth: [] }],
      },
    },
    async (request) => {
      const input = createEventSchema.parse(request.body);
      const user = getAuthUser(request);
      const event = await eventsService.create(user.userId, input);

      return { success: true, data: event };
    },
  );

  app.get(
    "/",
    {
      schema: { tags: ["Events"] },
    },
    async (request) => {
      const query = listEventsQuerySchema.parse(request.query);
      const result = await eventsService.list(query);

      return { success: true, ...result };
    },
  );

  app.get(
    "/:id",
    {
      schema: { tags: ["Events"] },
    },
    async (request) => {
      const { id } = request.params as { id: string };
      const event = await eventsService.getById(id);

      return { success: true, data: event };
    },
  );

  app.patch(
    "/:id",
    {
      preHandler: [authenticate, authorize(UserRole.ORGANIZER)],
      schema: {
        tags: ["Events"],
        security: [{ bearerAuth: [] }],
      },
    },
    async (request) => {
      const { id } = request.params as { id: string };
      const input = updateEventSchema.parse(request.body);
      const user = getAuthUser(request);
      const event = await eventsService.update(id, user.userId, input);

      return { success: true, data: event };
    },
  );

  app.delete(
    "/:id",
    {
      preHandler: [authenticate, authorize(UserRole.ORGANIZER)],
      schema: {
        tags: ["Events"],
        security: [{ bearerAuth: [] }],
      },
    },
    async (request) => {
      const { id } = request.params as { id: string };
      const user = getAuthUser(request);
      await eventsService.delete(id, user.userId);

      return { success: true, data: { message: "Event deleted" } };
    },
  );
}