import { z } from 'zod';

export const createDriverProfileSchema = z.object({
  body: z.object({
    userId: z.string().uuid(),
    phone: z.string().optional(),
    licenseNo: z.string().optional(),
  }),
});

export const updateDriverProfileSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z.object({
    phone: z.string().optional(),
    licenseNo: z.string().optional(),
  }),
});

export const getDriverProfileSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
});
