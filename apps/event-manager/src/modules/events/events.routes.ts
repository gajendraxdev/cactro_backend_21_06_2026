import type { FastifyInstance, FastifyReply } from "fastify";
import { UserRole } from "@event-booking/types";
import {
  createEventRouteSchema,
  deleteEventRouteSchema,
  getEventRouteSchema,
  listEventsRouteSchema,
  updateEventRouteSchema,
} from "../../docs/openapi.js";
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
      schema: createEventRouteSchema,
    },
    async (request, reply: FastifyReply) => {
      const input = createEventSchema.parse(request.body);
      const user = getAuthUser(request);
      const event = await eventsService.create(user.userId, input);

      return reply.status(201).send({ success: true, data: event });
    },
  );

  app.get(
    "/",
    { schema: listEventsRouteSchema },
    async (request) => {
      const query = listEventsQuerySchema.parse(request.query);
      const result = await eventsService.list(query);

      return { success: true, ...result };
    },
  );

  app.get(
    "/:id",
    { schema: getEventRouteSchema },
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
      schema: updateEventRouteSchema,
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
      schema: deleteEventRouteSchema,
    },
    async (request) => {
      const { id } = request.params as { id: string };
      const user = getAuthUser(request);
      await eventsService.delete(id, user.userId);

      return { success: true, data: { message: "Event deleted" } };
    },
  );
}