import { z } from 'zod';

export const createRouteSchema = z.object({
  body: z.object({
    collegeId: z.string().uuid(),
    code: z.string().min(2),
    name: z.string().min(2),
    city: z.string().min(2),
    isActive: z.boolean().optional(),
  }),
});

export const updateRouteSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z.object({
    code: z.string().min(2).optional(),
    name: z.string().min(2).optional(),
    city: z.string().min(2).optional(),
    isActive: z.boolean().optional(),
  }),
});

export const getRouteSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
});
