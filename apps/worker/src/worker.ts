import { Worker } from "bullmq";
import pino from "pino";
import { config } from "@event-booking/config";
import { prisma } from "@event-booking/db";
import {
  QUEUE_NAMES,
  closeQueues,
  closeRedisConnection,
  getQueueConnection,
} from "@event-booking/queue";
import type {
  BookingConfirmationJobPayload,
  EventUpdateNotificationJobPayload,
} from "@event-booking/types";
import { processBookingConfirmation } from "./jobs/booking-confirmation.job.js";
import { processEventUpdateNotification } from "./jobs/event-update-notification.job.js";

const logger = pino({
  level: config.NODE_ENV === "production" ? "info" : "debug",
  transport:
    config.NODE_ENV !== "production"
      ? { target: "pino-pretty", options: { colorize: true } }
      : undefined,
});

const WORKER_CONCURRENCY = 5;

const connection = getQueueConnection(config.REDIS_URL);

const bookingConfirmationWorker = new Worker<BookingConfirmationJobPayload>(
  QUEUE_NAMES.BOOKING_CONFIRMATION,
  async (job) => processBookingConfirmation(job, logger),
  { connection, concurrency: WORKER_CONCURRENCY },
);

const eventUpdateNotificationWorker =
  new Worker<EventUpdateNotificationJobPayload>(
    QUEUE_NAMES.EVENT_UPDATE_NOTIFICATION,
    async (job) => processEventUpdateNotification(job, logger),
    { connection, concurrency: WORKER_CONCURRENCY },
  );

function attachWorkerEvents(worker: Worker, name: string) {
  worker.on("completed", (job) => {
    logger.info({ jobId: job.id, queue: name }, "Job completed");
  });

  worker.on("failed", (job, error) => {
    logger.error(
      { jobId: job?.id, queue: name, error: error.message },
      "Job failed",
    );
  });
}

attachWorkerEvents(bookingConfirmationWorker, QUEUE_NAMES.BOOKING_CONFIRMATION);
attachWorkerEvents(
  eventUpdateNotificationWorker,
  QUEUE_NAMES.EVENT_UPDATE_NOTIFICATION,
);

logger.info("Worker started and listening for jobs");

async function shutdown(signal: string) {
  logger.info(`Received ${signal}, shutting down worker gracefully...`);

  try {
    await bookingConfirmationWorker.close();
    await eventUpdateNotificationWorker.close();
    await closeQueues();
    await closeRedisConnection();
    await prisma.$disconnect();
    logger.info("Worker shutdown complete");
    process.exit(0);
  } catch (error) {
    logger.error(error, "Error during worker shutdown");
    process.exit(1);
  }
}

process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));