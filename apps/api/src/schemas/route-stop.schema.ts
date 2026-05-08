import { z } from 'zod';

export const createRouteStopSchema = z.object({
  params: z.object({
    routeId: z.string().uuid(),
  }),
  body: z.object({
    name: z.string().min(2),
    latitude: z.number(),
    longitude: z.number(),
    sequence: z.number().int().nonnegative(),
  }),
});

export const updateRouteStopSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z.object({
    name: z.string().min(2).optional(),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
    sequence: z.number().int().nonnegative().optional(),
  }),
});

export const getRouteStopSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
});
