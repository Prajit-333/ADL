import { z } from 'zod';

export const startTripSchema = z.object({
  body: z.object({
    vehicleId: z.string().uuid(),
    routeId: z.string().uuid(),
  }),
});

export const endTripSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
});

export const getTripSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
});
