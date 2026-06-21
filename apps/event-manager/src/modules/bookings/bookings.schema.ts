import { z } from "zod";

export const createBookingSchema = z.object({
  eventId: z.string().min(1),
  quantity: z.coerce.number().int().positive(),
});

export type CreateBookingInput = z.infer<typeof createBookingSchema>;