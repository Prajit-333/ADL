import { z } from 'zod';

const VehicleStatusEnum = z.enum(['ACTIVE', 'INACTIVE', 'MAINTENANCE']);

export const createVehicleSchema = z.object({
  body: z.object({
    collegeId: z.string().uuid(),
    registration: z.string().min(2),
    type: z.string().min(2),
    capacity: z.number().int().positive().optional(),
    gpsDeviceId: z.string().optional(),
    status: VehicleStatusEnum.optional(),
  }),
});

export const updateVehicleSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z.object({
    collegeId: z.string().uuid().optional(),
    registration: z.string().min(2).optional(),
    type: z.string().min(2).optional(),
    capacity: z.number().int().positive().optional(),
    gpsDeviceId: z.string().optional(),
    status: VehicleStatusEnum.optional(),
  }),
});

export const getVehicleSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
});
