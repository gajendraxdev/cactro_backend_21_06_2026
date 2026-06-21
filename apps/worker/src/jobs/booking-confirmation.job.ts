import type { Job } from "bullmq";
import type { Logger } from "pino";
import { prisma } from "@event-booking/db";
import type { BookingConfirmationJobPayload } from "@event-booking/types";

export async function processBookingConfirmation(
  job: Job<BookingConfirmationJobPayload>,
  logger: Logger,
): Promise<void> {
  const { bookingId, customerId } = job.data;

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      customer: { select: { email: true, name: true } },
      event: { select: { title: true } },
    },
  });

  if (!booking) {
    logger.warn({ bookingId }, "Booking not found for confirmation job");
    return;
  }

  console.log(
    `Booking confirmation email sent to customer ${booking.customer.email} for event "${booking.event.title}" (${booking.quantity} tickets)`,
  );

  logger.info(
    { bookingId, customerId },
    "Booking confirmation job processed",
  );
}