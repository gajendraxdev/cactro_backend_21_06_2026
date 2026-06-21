import { prisma } from "@event-booking/db";
import { enqueueBookingConfirmation } from "@event-booking/queue";
import { AppError } from "../../utils/app-error.js";
import type { CreateBookingInput } from "./bookings.schema.js";

export class BookingsService {
  constructor(private readonly redisUrl: string) {}

  async create(customerId: string, input: CreateBookingInput) {
    const booking = await prisma.$transaction(async (rawTx) => {
      const tx = rawTx as typeof prisma;
      const event = await tx.event.findUnique({
        where: { id: input.eventId },
      });

      if (!event) {
        throw new AppError("Event not found", 404);
      }

      if (event.availableTickets < input.quantity) {
        throw new AppError("Not enough tickets available", 409, [
          `Requested: ${input.quantity}, available: ${event.availableTickets}`,
        ]);
      }

      const updated = await tx.event.updateMany({
        where: {
          id: input.eventId,
          availableTickets: { gte: input.quantity },
        },
        data: {
          availableTickets: { decrement: input.quantity },
        },
      });

      if (updated.count === 0) {
        throw new AppError(
          "Tickets no longer available. Please try again.",
          409,
        );
      }

      return tx.booking.create({
        data: {
          customerId,
          eventId: input.eventId,
          quantity: input.quantity,
        },
        include: {
          event: true,
        },
      });
    });

    await enqueueBookingConfirmation(this.redisUrl, {
      bookingId: booking.id,
      customerId: booking.customerId,
    });

    return booking;
  }

  async getMyBookings(customerId: string) {
    return prisma.booking.findMany({
      where: { customerId },
      include: {
        event: {
          select: {
            id: true,
            title: true,
            description: true,
            location: true,
            eventDate: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }
}