export const QUEUE_NAMES = {
  BOOKING_CONFIRMATION: "booking-confirmation",
  EVENT_UPDATE_NOTIFICATION: "event-update-notification",
} as const;

export type QueueName = (typeof QUEUE_NAMES)[keyof typeof QUEUE_NAMES];