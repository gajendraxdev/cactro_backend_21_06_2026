import { prisma, type Event } from "@event-booking/db";
import { enqueueEventUpdateNotification } from "@event-booking/queue";
import type { PaginatedResponse } from "@event-booking/types";
import { AppError } from "../../utils/app-error.js";
import {
  buildPaginationMeta,
  parsePaginationQuery,
} from "../../utils/pagination.js";
import type {
  CreateEventInput,
  ListEventsQuery,
  UpdateEventInput,
} from "./events.schema.js";

export class EventsService {
  constructor(private readonly redisUrl: string) {}

  async create(organizerId: string, input: CreateEventInput): Promise<Event> {
    return prisma.event.create({
      data: {
        ...input,
        availableTickets: input.totalTickets,
        organizerId,
      },
    });
  }

  async list(query: ListEventsQuery): Promise<PaginatedResponse<unknown>> {
    const { page, limit } = parsePaginationQuery(
      query.page?.toString(),
      query.limit?.toString(),
    );
    const sortBy = query.sortBy ?? "eventDate";
    const sortOrder = query.sortOrder ?? "asc";

    const where: {
      eventDate?: {
        gte?: Date;
        lte?: Date;
      };
    } = {};

    if (query.from || query.to) {
      where.eventDate = {};
      if (query.from) {
        where.eventDate.gte = query.from;
      }
      if (query.to) {
        where.eventDate.lte = query.to;
      }
    }

    const [total, events] = await Promise.all([
      prisma.event.count({ where }),
      prisma.event.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          organizer: {
            select: { id: true, name: true, email: true },
          },
        },
      }),
    ]);

    return {
      data: events,
      meta: buildPaginationMeta(page, limit, total),
    };
  }

  async getById(eventId: string) {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        organizer: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    if (!event) {
      throw new AppError("Event not found", 404);
    }

    return event;
  }

  async update(
    eventId: string,
    organizerId: string,
    input: UpdateEventInput,
  ): Promise<Event> {
    const event = await this.getOwnedEvent(eventId, organizerId);

    const totalTickets = input.totalTickets ?? event.totalTickets;
    const bookedTickets = event.totalTickets - event.availableTickets;

    if (totalTickets < bookedTickets) {
      throw new AppError(
        `Cannot reduce total tickets below already booked amount (${bookedTickets})`,
        400,
      );
    }

    const availableTickets =
      input.totalTickets !== undefined
        ? totalTickets - bookedTickets
        : event.availableTickets;

    const updatedEvent = await prisma.event.update({
      where: { id: eventId },
      data: {
        ...input,
        totalTickets,
        availableTickets,
      },
    });

    await enqueueEventUpdateNotification(this.redisUrl, { eventId });

    return updatedEvent;
  }

  async delete(eventId: string, organizerId: string) {
    await this.getOwnedEvent(eventId, organizerId);

    await prisma.event.delete({
      where: { id: eventId },
    });
  }

  private async getOwnedEvent(eventId: string, organizerId: string) {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      throw new AppError("Event not found", 404);
    }

    if (event.organizerId !== organizerId) {
      throw new AppError("Forbidden: you do not own this event", 403);
    }

    return event;
  }
}