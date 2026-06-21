import type { Job } from "bullmq";
import type { Logger } from "pino";
import { prisma } from "@event-booking/db";
import type { EventUpdateNotificationJobPayload } from "@event-booking/types";

export async function processEventUpdateNotification(
  job: Job<EventUpdateNotificationJobPayload>,
  logger: Logger,
): Promise<void> {
  const { eventId } = job.data;

  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: { title: true },
  });

  if (!event) {
    logger.warn({ eventId }, "Event not found for update notification job");
    return;
  }

  const bookings = await prisma.booking.findMany({
    where: { eventId },
    include: {
      customer: { select: { email: true } },
    },
    distinct: ["customerId"],
  });

  for (const booking of bookings) {
    console.log(
      `Notify ${booking.customer.email}: Event updated - "${event.title}"`,
    );
  }

  logger.info(
    { eventId, notifiedCount: bookings.length },
    "Event update notification job processed",
  );
}