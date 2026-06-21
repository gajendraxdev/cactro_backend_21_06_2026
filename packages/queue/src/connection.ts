import { Redis } from "ioredis";
import type { ConnectionOptions } from "bullmq";

let connection: Redis | undefined;

export function getRedisConnection(redisUrl: string): Redis {
  if (!connection) {
    connection = new Redis(redisUrl, {
      maxRetriesPerRequest: null,
    });
  }

  return connection;
}

export function getQueueConnection(redisUrl: string): ConnectionOptions {
  return getRedisConnection(redisUrl) as ConnectionOptions;
}

export async function closeRedisConnection(): Promise<void> {
  if (connection) {
    await connection.quit();
    connection = undefined;
  }
}