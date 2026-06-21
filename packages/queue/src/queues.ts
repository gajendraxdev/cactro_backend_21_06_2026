import { Queue } from "bullmq";
import type {
  BookingConfirmationJobPayload,
  EventUpdateNotificationJobPayload,
} from "@event-booking/types";
import { getQueueConnection } from "./connection.js";
import { QUEUE_NAMES } from "./names.js";

const DEFAULT_JOB_OPTIONS = {
  attempts: 3,
  backoff: {
    type: "exponential" as const,
    delay: 1000,
  },
  removeOnComplete: true,
  removeOnFail: false,
};

let bookingConfirmationQueue: Queue | undefined;
let eventUpdateNotificationQueue: Queue | undefined;

function createQueue(name: string, redisUrl: string): Queue {
  return new Queue(name, {
    connection: getQueueConnection(redisUrl),
    defaultJobOptions: DEFAULT_JOB_OPTIONS,
  });
}

export function getBookingConfirmationQueue(redisUrl: string): Queue {
  bookingConfirmationQueue ??= createQueue(
    QUEUE_NAMES.BOOKING_CONFIRMATION,
    redisUrl,
  );
  return bookingConfirmationQueue;
}

export function getEventUpdateNotificationQueue(redisUrl: string): Queue {
  eventUpdateNotificationQueue ??= createQueue(
    QUEUE_NAMES.EVENT_UPDATE_NOTIFICATION,
    redisUrl,
  );
  return eventUpdateNotificationQueue;
}

export async function enqueueBookingConfirmation(
  redisUrl: string,
  payload: BookingConfirmationJobPayload,
): Promise<void> {
  const queue = getBookingConfirmationQueue(redisUrl);
  await queue.add("booking-confirmation", payload);
}

export async function enqueueEventUpdateNotification(
  redisUrl: string,
  payload: EventUpdateNotificationJobPayload,
): Promise<void> {
  const queue = getEventUpdateNotificationQueue(redisUrl);
  await queue.add("event-update-notification", payload);
}

export async function closeQueues(): Promise<void> {
  const closers: Promise<void>[] = [];

  if (bookingConfirmationQueue) {
    closers.push(bookingConfirmationQueue.close());
    bookingConfirmationQueue = undefined;
  }

  if (eventUpdateNotificationQueue) {
    closers.push(eventUpdateNotificationQueue.close());
    eventUpdateNotificationQueue = undefined;
  }

  await Promise.all(closers);
}