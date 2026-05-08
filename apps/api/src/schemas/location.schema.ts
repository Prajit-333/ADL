import { z } from 'zod';

export const updateLocationSchema = z.object({
  body: z.object({
    vehicleId: z.string().uuid(),
    tripId: z.string().uuid().optional(),
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    speed: z.number().nonnegative().optional(),
  }),
});

export const getLocationHistorySchema = z.object({
  params: z.object({
    id: z.string().uuid(), // vehicleId
  }),
});
