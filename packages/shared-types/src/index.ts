import { z } from 'zod';

export const LocationPingSchema = z.object({
  busId: z.string().uuid(),
  tripId: z.string().uuid().optional(),
  lat: z.number(),
  lng: z.number(),
  speed: z.number().optional(),
  timestamp: z.number(),
});

export type LocationPing = z.infer<typeof LocationPingSchema>;
