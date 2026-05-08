import { z } from 'zod';

export const createCollegeSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    domain: z.string().optional(),
    isActive: z.boolean().optional(),
  }),
});

export const updateCollegeSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z.object({
    name: z.string().min(2).optional(),
    domain: z.string().optional(),
    isActive: z.boolean().optional(),
  }),
});

export const getCollegeSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
});

export const deleteCollegeSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
});
