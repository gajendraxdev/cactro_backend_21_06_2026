export { QUEUE_NAMES } from "./names.js";
export type { QueueName } from "./names.js";
export {
  getRedisConnection,
  getQueueConnection,
  closeRedisConnection,
} from "./connection.js";
export {
  getBookingConfirmationQueue,
  getEventUpdateNotificationQueue,
  enqueueBookingConfirmation,
  enqueueEventUpdateNotification,
  closeQueues,
} from "./queues.js";